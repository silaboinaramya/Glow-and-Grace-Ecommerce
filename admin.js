
const ADMIN_API = "http://localhost:8082";
const ADMIN_TOKEN_KEY = "glowGraceAdminToken";

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");
const dashboardMessage = document.getElementById("dashboardMessage");
const productForm = document.getElementById("productForm");
const productModal = document.getElementById("productModal");
const productsTableBody = document.getElementById("productsTableBody");
const productFormMessage = document.getElementById("productFormMessage");

let products = [];

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function apiRequest(path, options = {}) {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(ADMIN_API + path, {
        ...options,
        headers
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: "The server returned an invalid response." };
    }

    if (response.status === 401 && token) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        showLogin();
        throw new Error("Your admin session expired. Please sign in again.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

function showLogin() {
    loginScreen.classList.remove("hidden");
    dashboardScreen.classList.add("hidden");
    productModal.classList.add("hidden");
}

function showDashboard() {
    loginScreen.classList.add("hidden");
    dashboardScreen.classList.remove("hidden");
}

adminLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginMessage.textContent = "Signing in...";

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    try {
        const response = await fetch(ADMIN_API + "/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Admin login failed.");
        }

        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        document.getElementById("adminPassword").value = "";
        loginMessage.textContent = "";

        showDashboard();
        await loadDashboard();
    } catch (error) {
        loginMessage.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to ProductServer. Start the Java server on port 8082."
                : error.message;
    }
});

async function loadDashboard() {
    dashboardMessage.textContent = "Loading dashboard...";

    try {
        const [stats, productData] = await Promise.all([
            apiRequest("/admin/stats"),
            apiRequest("/admin/products")
        ]);

        products = productData;
        document.getElementById("statProducts").textContent = stats.products;
        document.getElementById("statOrders").textContent = stats.orders;
        document.getElementById("statSales").textContent = money(stats.sales);
        document.getElementById("statStock").textContent = stats.stock;

        renderProducts();
        dashboardMessage.textContent = "";
    } catch (error) {
        dashboardMessage.textContent = error.message;
    }
}

function renderProducts() {
    if (!products.length) {
        productsTableBody.innerHTML =
            '<tr><td colspan="5">No products yet. Click Add Product to begin.</td></tr>';
        return;
    }

    productsTableBody.innerHTML = products.map(product => {
        const stockClass = Number(product.stock) <= 5 ? "low" : "";

        return `
            <tr>
                <td>
                    <div class="product-name">${escapeHTML(product.name)}</div>
                    <div class="product-sub">Product ID: ${Number(product.id)}</div>
                </td>
                <td>${escapeHTML(product.category)}</td>
                <td>${money(product.price)}</td>
                <td>
                    <span class="stock-badge ${stockClass}">
                        ${Number(product.stock)} units
                    </span>
                </td>
                <td>
                    <button class="action-btn" data-action="edit"
                            data-id="${Number(product.id)}">Edit</button>
                    <button class="action-btn delete" data-action="delete"
                            data-id="${Number(product.id)}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

document.getElementById("addProductButton").addEventListener("click", () => {
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("formTitle").textContent = "Add Product";
    document.getElementById("saveProductButton").textContent = "Add Product";
    productFormMessage.textContent = "";
    productModal.classList.remove("hidden");
});

document.getElementById("closeProductModal").addEventListener("click", () => {
    productModal.classList.add("hidden");
});

productModal.addEventListener("click", event => {
    if (event.target === productModal) {
        productModal.classList.add("hidden");
    }
});

productsTableBody.addEventListener("click", async function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const product = products.find(item => Number(item.id) === id);
    if (!product) return;

    if (button.dataset.action === "edit") {
        document.getElementById("productId").value = product.id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productCategory").value =
            product.category;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productStock").value = product.stock;
        document.getElementById("productImage").value =
            product.imageUrl || "";
        document.getElementById("productDescription").value =
            product.description || "";

        document.getElementById("formTitle").textContent = "Edit Product";
        document.getElementById("saveProductButton").textContent =
            "Save Changes";
        productFormMessage.textContent = "";
        productModal.classList.remove("hidden");
        return;
    }

    if (button.dataset.action === "delete") {
        const confirmed = confirm(
            `Delete "${product.name}" from the product catalogue?`
        );

        if (!confirmed) return;

        try {
            await apiRequest("/admin/products?id=" + id, {
                method: "DELETE"
            });

            dashboardMessage.textContent = "Product deleted successfully.";
            await loadDashboard();
        } catch (error) {
            dashboardMessage.textContent = error.message;
        }
    }
});

productForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    productFormMessage.textContent = "";

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);
    const imageUrl = document.getElementById("productImage").value.trim();
    const description =
        document.getElementById("productDescription").value.trim();

    if (!name || !category || !Number.isFinite(price) ||
            price < 0 || !Number.isInteger(stock) || stock < 0) {
        productFormMessage.textContent =
            "Enter a product name, valid price, and whole-number stock.";
        return;
    }

    const product = { name, category, price, stock, imageUrl, description };
    const id = document.getElementById("productId").value;
    const saveButton = document.getElementById("saveProductButton");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        if (id) {
            await apiRequest("/admin/products?id=" + encodeURIComponent(id), {
                method: "PUT",
                body: JSON.stringify(product)
            });
            dashboardMessage.textContent = "Product updated successfully.";
        } else {
            await apiRequest("/admin/products", {
                method: "POST",
                body: JSON.stringify(product)
            });
            dashboardMessage.textContent = "Product added successfully.";
        }

        productModal.classList.add("hidden");
        await loadDashboard();
    } catch (error) {
        productFormMessage.textContent = error.message;
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = id ? "Save Changes" : "Add Product";
    }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await apiRequest("/admin/logout", { method: "POST" });
    } catch (error) {
        console.warn("Admin logout:", error.message);
    } finally {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        showLogin();
    }
});

// A token is accepted only if the server verifies it via a protected endpoint.
async function startAdminPage() {
    if (!sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        showLogin();
        return;
    }

    showDashboard();
    await loadDashboard();
}

startAdminPage();
