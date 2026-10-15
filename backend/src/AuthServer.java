
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AuthServer {
    private static final Gson gson = new Gson();
    private static final SecureRandom random = new SecureRandom();

    private static final Map<String, Session> sessions =
            new ConcurrentHashMap<>();

    private static final String DB_URL = System.getenv().getOrDefault(
        "GLOW_DB_URL",
        "jdbc:mysql://localhost:3306/glow_grace_db"
        + "?useSSL=false&serverTimezone=UTC"
    );

    private static final String DB_USER =
            System.getenv().getOrDefault("GLOW_DB_USER", "root");

    private static final String DB_PASSWORD =
            System.getenv().getOrDefault("GLOW_DB_PASSWORD", "");

    private static final String[] ALLOWED_ORIGINS = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    };

    private static final String COOKIE_NAME = "gg_session";
    private static final long SESSION_MILLIS = 30 * 60 * 1000L;

    private static class Session {
        int userId;
        String name;
        long expiresAt;

        Session(int userId, String name) {
            this.userId = userId;
            this.name = name;
            this.expiresAt = System.currentTimeMillis()
                    + SESSION_MILLIS;
        }
    }

    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");

        try (Connection ignored = DriverManager.getConnection(
                DB_URL, DB_USER, DB_PASSWORD)) {
            System.out.println("MySQL connection successful.");
        }

        HttpServer server = HttpServer.create(
                new InetSocketAddress("localhost", 8080), 0);

        server.createContext("/api/register", AuthServer::register);
        server.createContext("/api/login", AuthServer::login);
        server.createContext("/api/logout", AuthServer::logout);
        server.createContext("/api/me", AuthServer::me);

        server.setExecutor(java.util.concurrent.Executors
                .newFixedThreadPool(10));

        server.start();
        System.out.println("Glow & Grace auth API running on port 8080.");
    }

    private static Connection db() throws SQLException {
        return DriverManager.getConnection(
                DB_URL, DB_USER, DB_PASSWORD);
    }

    private static boolean prepare(HttpExchange ex)
            throws IOException {
        ex.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        ex.getResponseHeaders().set("X-Content-Type-Options", "nosniff");

        String origin = ex.getRequestHeaders().getFirst("Origin");

        if (origin != null) {
            boolean allowed = false;
            for (String candidate : ALLOWED_ORIGINS) {
                if (candidate.equals(origin)) {
                    allowed = true;
                    break;
                }
            }

            if (!allowed) {
                send(ex, 403, "{\"error\":\"Origin not allowed.\"}");
                return false;
            }

            ex.getResponseHeaders().set(
                    "Access-Control-Allow-Origin", origin);
            ex.getResponseHeaders().set(
                    "Access-Control-Allow-Credentials", "true");
            ex.getResponseHeaders().set(
                    "Vary", "Origin");
        }

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            ex.getResponseHeaders().set("Content-Length", "0");
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return false;
        }

        return true;
    }

    private static boolean method(
            HttpExchange ex, String expected) throws IOException {
        if (!prepare(ex)) return false;

        if (!expected.equalsIgnoreCase(ex.getRequestMethod())) {
            send(ex, 405, "{\"error\":\"Method not allowed.\"}");
            return false;
        }
        return true;
    }

    private static JsonObject readJson(HttpExchange ex)
            throws IOException {
        byte[] bytes;
        try (InputStream in = ex.getRequestBody()) {
            bytes = in.readNBytes(10001);
        }

        if (bytes.length > 10000) {
            throw new IllegalArgumentException("Request too large.");
        }

        JsonObject obj = JsonParser.parseString(
                new String(bytes, StandardCharsets.UTF_8))
                .getAsJsonObject();

        return obj;
    }

    private static String field(JsonObject obj, String name) {
        return obj.has(name) && !obj.get(name).isJsonNull()
                ? obj.get(name).getAsString().trim() : "";
    }

    private static void register(HttpExchange ex) throws IOException {
        if (!method(ex, "POST")) return;

        try {
            JsonObject data = readJson(ex);
            String name = field(data, "name");
            String email = field(data, "email").toLowerCase();
            String password = field(data, "password");

            if (name.length() < 2 || name.length() > 100
                    || !email.matches(
                    "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
                    || password.length() < 8
                    || password.getBytes(StandardCharsets.UTF_8).length > 72
                    || !password.matches("(?s).*[A-Za-z].*")
                    || !password.matches("(?s).*\\d.*")) {
                send(ex, 400, "{\"error\":\"Enter a valid name and email, "
                        + "and a password with at least 8 characters, "
                        + "including a letter and a number.\"}");
                return;
            }

            String hash = BCrypt.hashpw(
                    password, BCrypt.gensalt(12));

            String sql = "INSERT INTO users "
                    + "(full_name, email, password_hash) VALUES (?, ?, ?)";

            try (Connection con = db();
                 PreparedStatement ps = con.prepareStatement(
                         sql, Statement.RETURN_GENERATED_KEYS)) {

                ps.setString(1, name);
                ps.setString(2, email);
                ps.setString(3, hash);
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        createSession(ex, rs.getInt(1), name);
                    }
                }

                send(ex, 201, "{\"message\":\"Account created successfully.\","
                        + "\"name\":" + gson.toJson(name) + "}");

            } catch (SQLIntegrityConstraintViolationException e) {
                send(ex, 409,
                        "{\"error\":\"An account with this email already exists.\"}");
            }
        } catch (IllegalArgumentException e) {
            send(ex, 400, "{\"error\":\"Invalid request data.\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            send(ex, 500, "{\"error\":\"Unable to create account right now.\"}");
        }
    }

    private static void login(HttpExchange ex) throws IOException {
        if (!method(ex, "POST")) return;

        try {
            JsonObject data = readJson(ex);
            String email = field(data, "email").toLowerCase();
            String password = field(data, "password");

            if (email.isEmpty() || password.isEmpty()) {
                send(ex, 400,
                        "{\"error\":\"Email and password are required.\"}");
                return;
            }

            String sql = "SELECT id, full_name, password_hash "
                    + "FROM users WHERE email = ?";

            try (Connection con = db();
                 PreparedStatement ps = con.prepareStatement(sql)) {

                ps.setString(1, email);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next() || !BCrypt.checkpw(
                            password, rs.getString("password_hash"))) {
                        send(ex, 401,
                                "{\"error\":\"Invalid email or password.\"}");
                        return;
                    }

                    createSession(ex, rs.getInt("id"),
                            rs.getString("full_name"));

                    send(ex, 200, "{\"message\":\"Login successful.\","
                            + "\"name\":"
                            + gson.toJson(rs.getString("full_name")) + "}");
                }
            }
        } catch (IllegalArgumentException e) {
            send(ex, 400, "{\"error\":\"Invalid request data.\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            send(ex, 500, "{\"error\":\"Unable to log in right now.\"}");
        }
    }

    private static void createSession(
            HttpExchange ex, int userId, String name) {
        String tokenBytes = randomToken();
        sessions.put(tokenBytes, new Session(userId, name));

        // Secure is intentionally omitted for local HTTP development.
        // Enable Secure when deploying behind HTTPS.
        ex.getResponseHeaders().add("Set-Cookie",
                COOKIE_NAME + "=" + tokenBytes
                + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800");
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(bytes);
    }

    private static String getSessionToken(HttpExchange ex) {
        String cookieHeader =
                ex.getRequestHeaders().getFirst("Cookie");

        if (cookieHeader == null) return null;

        for (String part : cookieHeader.split(";")) {
            String[] pair = part.trim().split("=", 2);
            if (pair.length == 2 && COOKIE_NAME.equals(pair[0])) {
                return pair[1];
            }
        }
        return null;
    }

    private static Session validSession(HttpExchange ex) {
        String token = getSessionToken(ex);
        if (token == null) return null;

        Session session = sessions.get(token);
        if (session == null) return null;

        if (System.currentTimeMillis() > session.expiresAt) {
            sessions.remove(token);
            return null;
        }

        return session;
    }

    private static void me(HttpExchange ex) throws IOException {
        if (!method(ex, "GET")) return;

        Session session = validSession(ex);
        if (session == null) {
            send(ex, 401, "{\"error\":\"Not logged in.\"}");
            return;
        }

        send(ex, 200, "{\"id\":" + session.userId
                + ",\"name\":" + gson.toJson(session.name) + "}");
    }

    private static void logout(HttpExchange ex) throws IOException {
        if (!method(ex, "POST")) return;

        String token = getSessionToken(ex);
        if (token != null) sessions.remove(token);

        ex.getResponseHeaders().add("Set-Cookie",
                COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");

        send(ex, 200, "{\"message\":\"Logged out successfully.\"}");
    }

    private static void send(
            HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (var out = ex.getResponseBody()) {
            out.write(bytes);
        }
    }
}
