
const ORDER_API = "http://localhost:8081/orders";

const ordersMessage = document.getElementById("ordersMessage");
const ordersList = document.getElementById("ordersList");

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function money(value) {
    return "₹" + Number(value).toFixed(2);
}

async function loadOrders() {
    const email = sessionStorage.getItem("glowGraceEmail");

    if (!email) {
        ordersMessage.textContent =
            "Please log in to view your order history.";
        ordersList.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(
            `${ORDER_API}?email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load orders.");
        }

        if (!data.length) {
            ordersMessage.textContent = "";
            ordersList.innerHTML = `
                <div class="orders-empty">
                    <h2>No orders yet</h2>
                    <p>Your skincare purchases will appear here.</p>
                    <a href="index.html">Explore our products</a>
                </div>
            `;
            return;
        }

        const groupedOrders = new Map();

        data.forEach(function (item) {
            if (!groupedOrders.has(item.orderId)) {
                groupedOrders.set(item.orderId, {
                    id: item.orderId,
                    date: item.orderDate,
                    total: Number(item.total),
                    status: item.status,
                    items: []
                });
            }

            groupedOrders.get(item.orderId).items.push(item);
        });

        ordersMessage.textContent = "";

        ordersList.innerHTML = Array.from(groupedOrders.values())
            .map(function (order) {
                const formattedDate = new Date(
                    order.date.replace(" ", "T")
                ).toLocaleString("en-IN");

                const itemHTML = order.items.map(function (item) {
                    return `
                        <div class="order-item">
                            <div>
                                <div class="order-item-name">
                                    ${escapeHTML(item.product)}
                                </div>
                                <div class="order-item-detail">
                                    ${money(item.price)} × ${Number(item.quantity)}
                                </div>
                            </div>
                            <strong>
                                ${money(Number(item.price) * Number(item.quantity))}
                            </strong>
                        </div>
                    `;
                }).join("");

                return `
                    <article class="order-card">
                        <div class="order-card-header">
                            <div>
                                <h2>Order #${order.id}</h2>
                                <div class="order-item-detail">
                                    Placed on ${escapeHTML(formattedDate)}
                                </div>
                            </div>
                            <span class="order-status">
                                ${escapeHTML(order.status)}
                            </span>
                        </div>

                        ${itemHTML}

                        <div class="order-total">
                            Total: ${money(order.total)}
                        </div>
                    </article>
                `;
            }).join("");

    } catch (error) {
        console.error("Order history error:", error);
        ordersMessage.textContent =
            "Unable to load orders. Check that Java and MySQL are running.";
    }
}

loadOrders();
