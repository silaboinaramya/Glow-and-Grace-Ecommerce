
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.google.gson.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

public class OrderServer {

    private static final Gson gson = new Gson();

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(
            new InetSocketAddress(8081), 0
        );

        server.createContext("/orders", OrderServer::handleOrders);
        server.start();

        System.out.println(
            "Glow & Grace Order API running at http://localhost:8081"
        );
        System.out.println("Endpoint: /orders");
    }

    private static void handleOrders(HttpExchange exchange)
            throws IOException {

        addCors(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            String method = exchange.getRequestMethod();

            if ("POST".equalsIgnoreCase(method)) {
                createOrder(exchange);
            } else if ("GET".equalsIgnoreCase(method)) {
                getOrders(exchange);
            } else {
                sendJson(exchange, 405,
                    "{\"message\":\"Method not allowed\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 500,
                "{\"message\":\"Order server error. Check the Java terminal.\"}");
        }
    }

    private static void createOrder(HttpExchange exchange)
            throws Exception {

        JsonObject body = JsonParser.parseString(
            new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
            )
        ).getAsJsonObject();

        String email = body.has("email")
            ? body.get("email").getAsString().trim()
            : "";

        JsonArray items = body.has("items")
            ? body.getAsJsonArray("items")
            : new JsonArray();

        if (email.isBlank() || items.isEmpty()) {
            sendJson(exchange, 400,
                "{\"message\":\"Email and order items are required.\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            con.setAutoCommit(false);

            try {
                int userId;

                try (PreparedStatement ps = con.prepareStatement(
                        "SELECT id FROM users WHERE email = ?")) {
                    ps.setString(1, email);

                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            con.rollback();
                            sendJson(exchange, 404,
                                "{\"message\":\"User account not found. Please log in again.\"}");
                            return;
                        }
                        userId = rs.getInt("id");
                    }
                }

                double total = 0;

                for (JsonElement element : items) {
                    JsonObject item = element.getAsJsonObject();
                    double price = item.get("price").getAsDouble();
                    int quantity = item.get("quantity").getAsInt();

                    if (!Double.isFinite(price) || price <= 0
                            || quantity < 1 || quantity > 1000) {
                        con.rollback();
                        sendJson(exchange, 400,
                            "{\"message\":\"Invalid item price or quantity.\"}");
                        return;
                    }

                    total += price * quantity;

                    if (!Double.isFinite(total) || total > 100000000) {
                        con.rollback();
                        sendJson(exchange, 400,
                            "{\"message\":\"Order total is invalid.\"}");
                        return;
                    }
                }

                int orderId;

                try (PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO orders (user_id, total_amount, status) " +
                    "VALUES (?, ?, 'Confirmed')",
                    Statement.RETURN_GENERATED_KEYS)) {

                    ps.setInt(1, userId);
                    ps.setBigDecimal(2,
                        java.math.BigDecimal.valueOf(total));
                    ps.executeUpdate();

                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) {
                            throw new SQLException(
                                "Could not create order ID");
                        }
                        orderId = keys.getInt(1);
                    }
                }

                String itemSql =
                    "INSERT INTO order_items " +
                    "(order_id, product_name, unit_price, quantity) " +
                    "VALUES (?, ?, ?, ?)";

                try (PreparedStatement ps =
                        con.prepareStatement(itemSql)) {

                    for (JsonElement element : items) {
                        JsonObject item = element.getAsJsonObject();

                        String name = item.has("name")
                            ? item.get("name").getAsString().trim()
                            : "";

                        double price = item.get("price").getAsDouble();
                        int quantity = item.get("quantity").getAsInt();

                        if (name.isBlank() || name.length() > 200) {
                            throw new IllegalArgumentException(
                                "Invalid product name");
                        }

                        ps.setInt(1, orderId);
                        ps.setString(2, name);
                        ps.setBigDecimal(3,
                            java.math.BigDecimal.valueOf(price));
                        ps.setInt(4, quantity);
                        ps.addBatch();
                    }

                    ps.executeBatch();
                }

                con.commit();

                JsonObject result = new JsonObject();
                result.addProperty("message",
                    "Order placed successfully!");
                result.addProperty("orderId", orderId);

                sendJson(exchange, 201, gson.toJson(result));

            } catch (Exception e) {
                con.rollback();
                throw e;
            } finally {
                con.setAutoCommit(true);
            }
        }
    }

    private static void getOrders(HttpExchange exchange)
            throws Exception {

        String query = exchange.getRequestURI().getRawQuery();
        String email = "";

        if (query != null) {
            for (String part : query.split("&")) {
                String[] pair = part.split("=", 2);

                if (pair.length == 2 && pair[0].equals("email")) {
                    email = URLDecoder.decode(
                        pair[1], StandardCharsets.UTF_8);
                }
            }
        }

        if (email.isBlank()) {
            sendJson(exchange, 400,
                "{\"message\":\"Email is required.\"}");
            return;
        }

        JsonArray result = new JsonArray();

        String sql =
            "SELECT o.id AS order_id, o.order_date, " +
            "o.total_amount, o.status, oi.product_name, " +
            "oi.unit_price, oi.quantity " +
            "FROM orders o " +
            "JOIN users u ON u.id = o.user_id " +
            "JOIN order_items oi ON oi.order_id = o.id " +
            "WHERE u.email = ? " +
            "ORDER BY o.order_date DESC, o.id DESC, oi.id";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    JsonObject order = new JsonObject();

                    order.addProperty("orderId",
                        rs.getInt("order_id"));
                    order.addProperty("orderDate",
                        rs.getTimestamp("order_date").toString());
                    order.addProperty("total",
                        rs.getBigDecimal("total_amount"));
                    order.addProperty("status",
                        rs.getString("status"));
                    order.addProperty("product",
                        rs.getString("product_name"));
                    order.addProperty("price",
                        rs.getBigDecimal("unit_price"));
                    order.addProperty("quantity",
                        rs.getInt("quantity"));

                    result.add(order);
                }
            }
        }

        sendJson(exchange, 200, gson.toJson(result));
    }

    private static void addCors(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders()
            .getFirst("Origin");

        if ("http://localhost:5500".equals(origin)
                || "http://127.0.0.1:5500".equals(origin)) {
            exchange.getResponseHeaders()
                .set("Access-Control-Allow-Origin", origin);
        }

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set(
            "Vary", "Origin");
    }

    private static void sendJson(
            HttpExchange exchange, int status, String json)
            throws IOException {

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8");

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }
}
