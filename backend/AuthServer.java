
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;

public class AuthServer {

    private static final int PORT = 8080;
    private static final int ITERATIONS = 210_000;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(
            new InetSocketAddress("127.0.0.1", PORT), 0
        );

        server.createContext("/register", exchange ->
            handleRequest(exchange, true)
        );

        server.createContext("/login", exchange ->
            handleRequest(exchange, false)
        );

        server.start();

        System.out.println(
            "Glow & Grace Auth API running at http://localhost:8080"
        );
        System.out.println("Endpoints: POST /register and POST /login");
    }

    private static void handleRequest(
        HttpExchange exchange, boolean isRegister
    ) throws IOException {

        addCorsHeaders(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405,
                "{\"message\":\"Method not allowed.\"}");
            exchange.close();
            return;
        }

        try {
            String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
            );

            JsonObject data = JsonParser.parseString(body)
                .getAsJsonObject();

            String email = requiredString(data, "email")
                .trim().toLowerCase(Locale.ROOT);

            String password = requiredString(data, "password");

            if (!email.matches(
                "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
            )) {
                sendJson(exchange, 400,
                    "{\"message\":\"Enter a valid email address.\"}");
                return;
            }

            if (password.length() < 8 || password.length() > 128) {
                sendJson(exchange, 400,
                    "{\"message\":\"Password must be 8 to 128 characters.\"}");
                return;
            }

            if (isRegister) {
                String fullName =
                    requiredString(data, "fullName").trim();

                if (fullName.isEmpty() || fullName.length() > 100) {
                    sendJson(exchange, 400,
                        "{\"message\":\"Enter a valid name.\"}");
                    return;
                }

                registerUser(exchange, fullName, email, password);
            } else {
                loginUser(exchange, email, password);
            }

        } catch (IllegalArgumentException | IllegalStateException e) {
            sendJson(exchange, 400,
                "{\"message\":\"Please provide valid account details.\"}");

        } catch (SQLException e) {
            e.printStackTrace();
            sendJson(exchange, 500,
                "{\"message\":\"Database error. Check DBConnection.java and the Java terminal.\"}");

        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 500,
                "{\"message\":\"Server error. Check the Java terminal.\"}");

        } finally {
            exchange.close();
        }
    }

    private static String requiredString(
        JsonObject data, String key
    ) {
        if (!data.has(key)
                || data.get(key).isJsonNull()
                || !data.get(key).isJsonPrimitive()
                || !data.get(key).getAsJsonPrimitive().isString()) {
            throw new IllegalArgumentException("Missing field: " + key);
        }

        return data.get(key).getAsString();
    }

    private static void registerUser(
        HttpExchange exchange,
        String fullName,
        String email,
        String password
    ) throws Exception {

        String passwordHash = hashPassword(password);

        String sql =
            "INSERT INTO users (full_name, email, password_hash) " +
            "VALUES (?, ?, ?)";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement =
                 connection.prepareStatement(sql)) {

            statement.setString(1, fullName);
            statement.setString(2, email);
            statement.setString(3, passwordHash);

            statement.executeUpdate();

            sendJson(exchange, 201,
                "{\"message\":\"Account created successfully.\"}");

        } catch (SQLException e) {
            if ("23000".equals(e.getSQLState())) {
                sendJson(exchange, 409,
                    "{\"message\":\"An account with this email already exists.\"}");
            } else {
                throw e;
            }
        }
    }

    private static void loginUser(
        HttpExchange exchange,
        String email,
        String password
    ) throws Exception {

        String sql =
            "SELECT full_name, password_hash FROM users WHERE email = ?";

        try (Connection connection = DBConnection.getConnection();
             PreparedStatement statement =
                 connection.prepareStatement(sql)) {

            statement.setString(1, email);

            try (ResultSet result = statement.executeQuery()) {
                if (result.next() &&
                    verifyPassword(
                        password,
                        result.getString("password_hash")
                    )) {

                    JsonObject response = new JsonObject();
                    response.addProperty(
                        "message", "Login successful."
                    );
                    response.addProperty(
                        "fullName", result.getString("full_name")
                    );

                    sendJson(exchange, 200, response.toString());

                } else {
                    sendJson(exchange, 401,
                        "{\"message\":\"Invalid email or password.\"}");
                }
            }
        }
    }

    private static String hashPassword(
        String password
    ) throws Exception {

        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);

        byte[] hash = deriveKey(
            password.toCharArray(), salt, ITERATIONS
        );

        return ITERATIONS + "$"
            + Base64.getEncoder().encodeToString(salt) + "$"
            + Base64.getEncoder().encodeToString(hash);
    }

    private static boolean verifyPassword(
        String password, String storedHash
    ) throws Exception {

        String[] parts = storedHash.split("\\$");

        if (parts.length != 3) {
            return false;
        }

        int iterations = Integer.parseInt(parts[0]);

        if (iterations < 100_000 || iterations > 1_000_000) {
            return false;
        }

        byte[] salt = Base64.getDecoder().decode(parts[1]);
        byte[] expectedHash = Base64.getDecoder().decode(parts[2]);

        byte[] actualHash = deriveKey(
            password.toCharArray(), salt, iterations
        );

        return MessageDigest.isEqual(expectedHash, actualHash);
    }

    private static byte[] deriveKey(
        char[] password, byte[] salt, int iterations
    ) throws Exception {

        PBEKeySpec spec =
            new PBEKeySpec(password, salt, iterations, 256);

        try {
            SecretKeyFactory factory =
                SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");

            return factory.generateSecret(spec).getEncoded();

        } finally {
            spec.clearPassword();
            Arrays.fill(password, '\0');
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {

        String origin =
            exchange.getRequestHeaders().getFirst("Origin");

        if ("http://localhost:5500".equals(origin)
                || "http://127.0.0.1:5500".equals(origin)) {

            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", origin
            );

            exchange.getResponseHeaders().set("Vary", "Origin");

            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "POST, OPTIONS"
            );

            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type"
            );
        }

        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8"
        );
    }

    private static void sendJson(
        HttpExchange exchange,
        int status,
        String json
    ) throws IOException {

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.sendResponseHeaders(status, bytes.length);

        exchange.getResponseBody().write(bytes);
    }
}

