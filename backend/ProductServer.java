
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ProductServer {

    private static final Gson gson = new Gson();

    // Admin credentials are configured on the Java server, not in admin.js.
    private static final String ADMIN_EMAIL =
            System.getenv().getOrDefault(
                    "GLOW_ADMIN_EMAIL", "admin@glowgrace.com");

    private static final String ADMIN_PASSWORD =
            System.getenv().getOrDefault(
                    "GLOW_ADMIN_PASSWORD", "ChangeMe123!");

    // Temporary in-memory admin sessions.
    private static final Map<String, Boolean> sessions =
            new ConcurrentHashMap<>();

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(
                new InetSocketAddress("0.0.0.0", 8082), 0);

        server.createContext("/products", ProductServer::publicProducts);
        server.createContext("/admin", ProductServer::adminRoutes);

        server.start();

        System.out.println(
                "Glow & Grace Product API running at http://localhost:8082");
        System.out.println("Public products: GET /products");
        System.out.println("Admin API: /admin");
        System.out.println("Admin email: " + ADMIN_EMAIL);
    }

    private static void cors(HttpExchange ex) {
        String origin = ex.getRequestHeaders().getFirst("Origin");

        if ("http://localhost:5500".equals(origin)
                || "http://127.0.0.1:5500".equals(origin)) {
            ex.getResponseHeaders().set(
                    "Access-Control-Allow-Origin", origin);
            ex.getResponseHeaders().set("Vary", "Origin");
        }

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS");

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization");
    }

    private static void send(
            HttpExchange ex, int status, Object data) throws IOException {

        byte[] bytes = gson.toJson(data)
                .getBytes(StandardCharsets.UTF_8);

        ex.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");

        ex.sendResponseHeaders(status, bytes.length);

        try (OutputStream out = ex.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static JsonObject error(String message) {
        JsonObject result = new JsonObject();
        result.addProperty("message", message);
        return result;
    }

    private static JsonObject readJson(HttpExchange ex)
            throws IOException {

        try (InputStream in = ex.getRequestBody()) {
            String body = new String(
                    in.readAllBytes(), StandardCharsets.UTF_8);

            return gson.fromJson(body, JsonObject.class);
        }
    }

    private static String queryValue(HttpExchange ex, String key) {
        String query = ex.getRequestURI().getRawQuery();

        if (query == null) {
            return null;
        }

        for (String part : query.split("&")) {
            String[] pair = part.split("=", 2);

            if (pair.length == 2 &&
                    URLDecoder.decode(
                            pair[0], StandardCharsets.UTF_8).equals(key)) {
                return URLDecoder.decode(
                        pair[1], StandardCharsets.UTF_8);
            }
        }

        return null;
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private static boolean isAdmin(HttpExchange ex) {
        String header =
                ex.getRequestHeaders().getFirst("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            return false;
        }

        return sessions.containsKey(header.substring(7));
    }

    private static void adminRoutes(HttpExchange ex)
            throws IOException {

        cors(ex);

        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return;
        }

        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        try {
            // ADMIN LOGIN
            if ("/admin/login".equals(path) && "POST".equals(method)) {
                JsonObject body = readJson(ex);

                String email = body != null && body.has("email")
                        ? body.get("email").getAsString().trim() : "";

                String password = body != null && body.has("password")
                        ? body.get("password").getAsString() : "";

                if (email.equalsIgnoreCase(ADMIN_EMAIL)
                        && MessageDigest.isEqual(
                                password.getBytes(StandardCharsets.UTF_8),
                                ADMIN_PASSWORD.getBytes(StandardCharsets.UTF_8))) {

                    String token = newToken();
                    sessions.put(token, true);

                    JsonObject result = new JsonObject();
                    result.addProperty("token", token);
                    result.addProperty(
                            "message", "Admin login successful");

                    send(ex, 200, result);
                } else {
                    send(ex, 401,
                            error("Invalid admin email or password."));
                }

                return;
            }

            // ALL REMAINING ADMIN ROUTES REQUIRE A VALID TOKEN.
            if (!isAdmin(ex)) {
                send(ex, 401, error("Admin login required."));
                return;
            }

            // ADMIN LOGOUT
            if ("/admin/logout".equals(path) && "POST".equals(method)) {
                String header =
                        ex.getRequestHeaders().getFirst("Authorization");

                sessions.remove(header.substring(7));
                send(ex, 200, error("Logged out."));
                return;
            }

            // DASHBOARD STATISTICS
            if ("/admin/stats".equals(path) && "GET".equals(method)) {
                send(ex, 200, getStats());
                return;
            }

            // PRODUCT MANAGEMENT
            if ("/admin/products".equals(path)) {

                if ("GET".equals(method)) {
                    send(ex, 200, getProducts());

                } else if ("POST".equals(method)) {
                    JsonObject body = readJson(ex);
                    validateProduct(body);

                    int id = insertProduct(body);

                    JsonObject result = new JsonObject();
                    result.addProperty("id", id);
                    result.addProperty("message", "Product added.");

                    send(ex, 201, result);

                } else if ("PUT".equals(method)) {
                    String idText = queryValue(ex, "id");

                    if (idText == null) {
                        send(ex, 400, error("Product ID is required."));
                        return;
                    }

                    int id = Integer.parseInt(idText);
                    JsonObject body = readJson(ex);
                    validateProduct(body);

                    if (updateProduct(id, body)) {
                        send(ex, 200, error("Product updated."));
                    } else {
                        send(ex, 404, error("Product not found."));
                    }

                } else if ("DELETE".equals(method)) {
                    String idText = queryValue(ex, "id");

                    if (idText == null) {
                        send(ex, 400, error("Product ID is required."));
                        return;
                    }

                    int id = Integer.parseInt(idText);

                    if (deleteProduct(id)) {
                        send(ex, 200, error("Product deleted."));
                    } else {
                        send(ex, 404, error("Product not found."));
                    }

                } else {
                    send(ex, 405, error("Method not allowed."));
                }

                return;
            }

            send(ex, 404, error("Admin endpoint not found."));

        } catch (IllegalArgumentException e) {
            send(ex, 400,
                    error("Invalid input. Check the product details."));

        } catch (Exception e) {
            e.printStackTrace();
            send(ex, 500,
                    error("Server error. Check the VS Code terminal."));
        }
    }

    private static void validateProduct(JsonObject p) {
        if (p == null || !p.has("name") || !p.has("category")
                || !p.has("price") || !p.has("stock")) {
            throw new IllegalArgumentException("Missing product fields.");
        }

        String name = p.get("name").getAsString().trim();
        String category = p.get("category").getAsString().trim();
        double price = p.get("price").getAsDouble();
        int stock = p.get("stock").getAsInt();

        if (name.isEmpty() || category.isEmpty()
                || !Double.isFinite(price) || price < 0 || stock < 0) {
            throw new IllegalArgumentException("Invalid product values.");
        }
    }

    // GET ALL PRODUCTS
    private static JsonArray getProducts() throws SQLException {
        JsonArray result = new JsonArray();

        String sql = "SELECT id, name, category, price, description, " +
                "image_url, stock FROM products ORDER BY id DESC";

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JsonObject p = new JsonObject();

                p.addProperty("id", rs.getInt("id"));
                p.addProperty("name", rs.getString("name"));
                p.addProperty("category", rs.getString("category"));
                p.addProperty("price", rs.getDouble("price"));
                p.addProperty("description",
                        rs.getString("description"));
                p.addProperty("imageUrl", rs.getString("image_url"));
                p.addProperty("stock", rs.getInt("stock"));

                result.add(p);
            }
        }

        return result;
    }

    // PUBLIC STORE PRODUCT LIST
    private static void publicProducts(HttpExchange ex)
            throws IOException {

        cors(ex);

        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return;
        }

        if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
            send(ex, 405, error("Only GET is allowed."));
            return;
        }

        try {
            send(ex, 200, getProducts());
        } catch (Exception e) {
            e.printStackTrace();
            send(ex, 500, error("Could not load products."));
        }
    }

    // ADD PRODUCT
    private static int insertProduct(JsonObject p)
            throws SQLException {

        String sql = "INSERT INTO products " +
                "(name, category, price, description, image_url, stock) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     sql, Statement.RETURN_GENERATED_KEYS)) {

            setProduct(ps, p);
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        }

        throw new SQLException("Could not create product.");
    }

    // EDIT PRODUCT
    private static boolean updateProduct(int id, JsonObject p)
            throws SQLException {

        String sql = "UPDATE products SET name=?, category=?, price=?, " +
                "description=?, image_url=?, stock=? WHERE id=?";

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            setProduct(ps, p);
            ps.setInt(7, id);

            return ps.executeUpdate() > 0;
        }
    }

    private static void setProduct(
            PreparedStatement ps, JsonObject p) throws SQLException {

        ps.setString(1, p.get("name").getAsString().trim());
        ps.setString(2, p.get("category").getAsString().trim());

        ps.setBigDecimal(3, new java.math.BigDecimal(
                p.get("price").getAsString()));

        ps.setString(4,
                p.has("description") && !p.get("description").isJsonNull()
                        ? p.get("description").getAsString() : "");

        ps.setString(5,
                p.has("imageUrl") && !p.get("imageUrl").isJsonNull()
                        ? p.get("imageUrl").getAsString() : "");

        ps.setInt(6, p.get("stock").getAsInt());
    }

    // DELETE PRODUCT
    private static boolean deleteProduct(int id)
            throws SQLException {

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "DELETE FROM products WHERE id=?")) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    // DASHBOARD STATISTICS
    private static JsonObject getStats() throws SQLException {
        JsonObject stats = new JsonObject();

        try (Connection c = DBConnection.getConnection()) {

            String productSql =
                    "SELECT COUNT(*) AS product_count, " +
                    "COALESCE(SUM(stock), 0) AS stock_count FROM products";

            try (PreparedStatement ps = c.prepareStatement(productSql);
                 ResultSet rs = ps.executeQuery()) {

                if (rs.next()) {
                    stats.addProperty(
                            "products", rs.getInt("product_count"));
                    stats.addProperty(
                            "stock", rs.getInt("stock_count"));
                }
            }

            String orderSql =
                    "SELECT COUNT(*) AS order_count, " +
                    "COALESCE(SUM(total_amount), 0) AS sales FROM orders";

            try (PreparedStatement ps = c.prepareStatement(orderSql);
                 ResultSet rs = ps.executeQuery()) {

                if (rs.next()) {
                    stats.addProperty(
                            "orders", rs.getInt("order_count"));
                    stats.addProperty(
                            "sales", rs.getDouble("sales"));
                }
            }
        }

        return stats;
    }
}
