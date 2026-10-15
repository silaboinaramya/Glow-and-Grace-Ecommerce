/* =====================================================
   GLOW & GRACE — SKINCARE E-COMMERCE WEBSITE
   ===================================================== */

const products = [
    {
        id: 1,
        name: "Vitamin C Glow Serum",
        category: "Serums",
        price: 499,
        oldPrice: 699,
        rating: 4.8,
        reviews: 124,
        tag: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Vitamin C", "Hyaluronic Acid"],
        benefits: [
            "Supports a brighter-looking complexion",
            "Helps improve the appearance of uneven skin tone",
            "Provides lightweight hydration"
        ]
    },
    {
        id: 2,
        name: "Niacinamide Pore Care Serum",
        category: "Serums",
        price: 449,
        oldPrice: 599,
        rating: 4.7,
        reviews: 98,
        tag: "POPULAR",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Niacinamide", "Hyaluronic Acid"],
        benefits: [
            "Helps improve the appearance of pores",
            "Supports a more even-looking skin tone",
            "Helps maintain skin hydration"
        ]
    },
    {
        id: 3,
        name: "Hydrating Daily Face Wash",
        category: "Face Wash",
        price: 299,
        oldPrice: 399,
        rating: 4.6,
        reviews: 86,
        tag: "DAILY CARE",
        image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Glycerin", "Gentle Cleansing Agents"],
        benefits: [
            "Removes everyday dirt and impurities",
            "Helps leave skin feeling fresh",
            "Designed for daily cleansing"
        ]
    },
    {
        id: 4,
        name: "Gentle Foaming Cleanser",
        category: "Face Wash",
        price: 349,
        oldPrice: 449,
        rating: 4.5,
        reviews: 65,
        tag: "",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Gentle Cleansing Agents", "Glycerin"],
        benefits: [
            "Creates a cleansing foam",
            "Helps remove everyday dirt",
            "Leaves skin feeling clean"
        ]
    },
    {
        id: 5,
        name: "Ceramide Barrier Moisturizer",
        category: "Moisturizers",
        price: 399,
        oldPrice: 549,
        rating: 4.8,
        reviews: 112,
        tag: "SKIN FAVOURITE",
        image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Ceramides", "Glycerin"],
        benefits: [
            "Helps support the skin barrier",
            "Helps reduce moisture loss",
            "Provides daily hydration"
        ]
    },
    {
        id: 6,
        name: "Oil-Free Daily Moisturizer",
        category: "Moisturizers",
        price: 349,
        oldPrice: 449,
        rating: 4.6,
        reviews: 73,
        tag: "",
        image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Glycerin", "Lightweight Moisturizers"],
        benefits: [
            "Provides lightweight hydration",
            "Designed for everyday use",
            "Helps keep skin feeling comfortable"
        ]
    },
    {
        id: 7,
        name: "Daily Shield SPF 50 Sunscreen",
        category: "Sunscreens",
        price: 449,
        oldPrice: 599,
        rating: 4.7,
        reviews: 142,
        tag: "SUN CARE",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=700&q=80",
        ingredients: ["UV Filters", "Moisturizing Ingredients"],
        benefits: [
            "Provides daily sun protection when used as directed",
            "Suitable for a daily skincare routine",
            "Helps protect skin from UV exposure"
        ]
    },
    {
        id: 8,
        name: "Overnight Repair Cream",
        category: "Moisturizers",
        price: 549,
        oldPrice: 699,
        rating: 4.8,
        reviews: 91,
        tag: "NIGHT CARE",
        image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80",
        ingredients: ["Glycerin", "Moisturizing Ingredients"],
        benefits: [
            "Provides overnight hydration",
            "Helps skin feel soft and comfortable",
            "Suitable for a nighttime skincare routine"
        ]
    }
];

/* HTML elements */

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const productGrid = document.getElementById("productGrid");
const productCount = document.getElementById("productCount");
const emptyMessage = document.getElementById("emptyMessage");

const cartPanel = document.getElementById("cartPanel");
const cartButton = document.getElementById("cartButton");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");

const checkoutButton = document.getElementById("checkoutButton");
const checkoutModal = document.getElementById("checkoutModal");
const closeCheckout = document.getElementById("closeCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutTotal = document.getElementById("checkoutTotal");
const orderMessage = document.getElementById("orderMessage");

const wishlistButton = document.getElementById("wishlistButton");
const wishlistCount = document.getElementById("wishlistCount");

const productDetailsModal =
    document.getElementById("productDetailsModal");
const productDetailsBody =
    document.getElementById("productDetailsBody");
const closeProductDetails =
    document.getElementById("closeProductDetails");

const authModal = document.getElementById("authModal");
const loginButton = document.getElementById("loginButton");

const welcomeUser = document.getElementById("welcomeUser");
const logoutButton = document.getElementById("logoutButton");

const closeAuth = document.getElementById("closeAuthModal");
const showLogin = document.getElementById("showLogin");
const showRegister = document.getElementById("showRegister");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");

/* Website state */

let activeCategory = "All";
let searchTerm = "";
let viewMode = "all";

function loadFromStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Storage loading error:", error);
        return fallback;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Storage saving error:", error);
    }
}

let cart = loadFromStorage("glowGraceCart", []);
let wishlist = loadFromStorage("glowGraceWishlist", []);

function formatPrice(amount) {
    return "₹" + Number(amount).toFixed(2);
}

function saveCart() {
    saveToStorage("glowGraceCart", cart);
}

function saveWishlist() {
    saveToStorage("glowGraceWishlist", wishlist);
}

function getCartQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartSubtotal() {
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}
/* =====================================================
   DISPLAY PRODUCTS
   ===================================================== */

function renderProducts() {
    if (!productGrid) return;

    let filteredProducts = [...products];

    // Filter by category
    if (activeCategory !== "All") {
        filteredProducts = filteredProducts.filter(
            product => product.category === activeCategory
        );
    }

    // Filter wishlist
    if (viewMode === "wishlist") {
        filteredProducts = filteredProducts.filter(
            product => wishlist.includes(product.id)
        );
    }

    // Search products
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => {
            const searchableText = [
                product.name,
                product.category,
                ...(product.ingredients || [])
            ].join(" ").toLowerCase();

            return searchableText.includes(searchTerm.toLowerCase());
        });
    }

    // Sort products
if (sortSelect) {
    switch (sortSelect.value) {
        case "low":
        case "price-low":
            filteredProducts.sort((a, b) => a.price - b.price);
            break;

        case "high":
        case "price-high":
            filteredProducts.sort((a, b) => b.price - a.price);
            break;

        case "rating":
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;

        case "name":
            filteredProducts.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            break;
    }
}

    // Show products
    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card">
            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >

                ${product.tag
                    ? `<span class="product-tag">${product.tag}</span>`
                    : ""
                }

                <button
                    class="wishlist-btn ${wishlist.includes(product.id) ? "active" : ""}"
                    data-wishlist="${product.id}"
                    aria-label="Toggle wishlist for ${product.name}"
                    type="button"
                >
                    ${wishlist.includes(product.id) ? "♥" : "♡"}
                </button>
            </div>

            <div class="product-info">
                <p class="product-category">${product.category}</p>

                <h3>${product.name}</h3>

                <p class="product-rating">
                    ★ ${product.rating}
                    <span>(${product.reviews} reviews)</span>
                </p>

                <div class="product-price">
                    <strong>${formatPrice(product.price)}</strong>
                    <del>${formatPrice(product.oldPrice)}</del>
                </div>

                <div class="product-actions">
                    <button
                        class="view-product-btn"
                        data-view="${product.id}"
                        type="button"
                    >
                        View Details
                    </button>

                    <button
                        class="add-cart-btn"
                        data-add="${product.id}"
                        type="button"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </article>
    `).join("");

    if (productCount) {
        productCount.textContent =
            `${filteredProducts.length} products found`;
    }

    if (emptyMessage) {
    emptyMessage.hidden = filteredProducts.length !== 0;
}
}


/* =====================================================
   SEARCH
   ===================================================== */

if (searchInput) {
    searchInput.addEventListener("input", function () {
        searchTerm = this.value.trim();
        renderProducts();
    });
}


/* =====================================================
   CATEGORY FILTERS
   ===================================================== */

document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", function () {
        activeCategory = this.dataset.category;
        viewMode = "all";

        document.querySelectorAll("[data-category]").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
        renderProducts();
    });
});


/* =====================================================
   PRODUCT SORTING
   ===================================================== */

if (sortSelect) {
    sortSelect.addEventListener("change", renderProducts);
}


/* =====================================================
   WISHLIST
   ===================================================== */

function toggleWishlist(productId) {
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
    } else {
        wishlist.push(productId);
    }

    saveWishlist();
    updateWishlistCount();
    renderProducts();
}

function updateWishlistCount() {
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

if (wishlistButton) {
    wishlistButton.addEventListener("click", function () {
        viewMode = viewMode === "wishlist" ? "all" : "wishlist";

        if (viewMode === "wishlist") {
            activeCategory = "All";
        }

        renderProducts();
    });
}


/* =====================================================
   PRODUCT BUTTON EVENTS
   ===================================================== */

if (productGrid) {
    productGrid.addEventListener("click", function (event) {
        const wishlistBtn = event.target.closest("[data-wishlist]");
        const addBtn = event.target.closest("[data-add]");
        const viewBtn = event.target.closest("[data-view]");

        if (wishlistBtn) {
            toggleWishlist(Number(wishlistBtn.dataset.wishlist));
        }

        if (addBtn) {
            addToCart(Number(addBtn.dataset.add));
        }

        if (viewBtn) {
            showProductDetails(Number(viewBtn.dataset.view));
        }
    });
}
/* =====================================================
   ADD PRODUCTS TO CART
   ===================================================== */

function addToCart(productId) {
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    openCart();

    alert(`${product.name} added to your cart!`);
}


/* =====================================================
   RENDER CART ITEMS
   ===================================================== */

function renderCart() {
    if (!cartItems) return;

    // Remove items that no longer exist in the product list
    cart = cart.filter(item =>
        products.some(product => product.id === item.id)
    );

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty 🛍️</p>
                <p>Add your favourite skincare products!</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);

            if (!product) return "";

            return `
                <div class="cart-item">
                    <img
                        src="${product.image}"
                        alt="${product.name}"
                        class="cart-item-image"
                    >

                    <div class="cart-item-info">
                        <h4>${product.name}</h4>

                        <p>${formatPrice(product.price)}</p>

                        <div class="quantity-controls">
                            <button
                                type="button"
                                data-decrease="${product.id}"
                                aria-label="Decrease quantity"
                            >−</button>

                            <span>${item.quantity}</span>

                            <button
                                type="button"
                                data-increase="${product.id}"
                                aria-label="Increase quantity"
                            >+</button>
                        </div>

                        <button
                            type="button"
                            class="remove-item-btn"
                            data-remove="${product.id}"
                        >
                            Remove
                        </button>
                    </div>

                    <strong>
                        ${formatPrice(product.price * item.quantity)}
                    </strong>
                </div>
            `;
        }).join("");
    }

    if (cartCount) {
        cartCount.textContent = getCartQuantity();
    }

    if (cartSubtotal) {
        cartSubtotal.textContent = formatPrice(getCartSubtotal());
    }

    if (checkoutTotal) {
        checkoutTotal.textContent = formatPrice(getCartSubtotal());
    }

    saveCart();
}


/* =====================================================
   CHANGE PRODUCT QUANTITY
   ===================================================== */

function changeQuantity(productId, amount) {
    const item = cart.find(item => item.id === productId);

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }

    saveCart();
    renderCart();
}


/* =====================================================
   REMOVE PRODUCT FROM CART
   ===================================================== */

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);

    saveCart();
    renderCart();
}


/* =====================================================
   CART BUTTON EVENTS
   ===================================================== */

if (cartItems) {
    cartItems.addEventListener("click", function (event) {
        const increaseBtn = event.target.closest("[data-increase]");
        const decreaseBtn = event.target.closest("[data-decrease]");
        const removeBtn = event.target.closest("[data-remove]");

        if (increaseBtn) {
            changeQuantity(Number(increaseBtn.dataset.increase), 1);
        }

        if (decreaseBtn) {
            changeQuantity(Number(decreaseBtn.dataset.decrease), -1);
        }

        if (removeBtn) {
            removeFromCart(Number(removeBtn.dataset.remove));
        }
    });
}


/* =====================================================
   OPEN AND CLOSE CART
   ===================================================== */

function openCart() {
    if (cartPanel) {
        cartPanel.classList.add("active");
    }

    if (overlay) {
        overlay.classList.add("active");
    }
}

function closeCartPanel() {
    if (cartPanel) {
        cartPanel.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }
}

if (cartButton) {
    cartButton.addEventListener("click", openCart);
}

if (closeCart) {
    closeCart.addEventListener("click", closeCartPanel);
}

if (overlay) {
    overlay.addEventListener("click", function () {
        closeCartPanel();
    });
}

/* =====================================================
   GLOW & GRACE — REMAINING WEBSITE FUNCTIONALITY
   ===================================================== */


/* =====================================================
   1. PRODUCT DETAILS MODAL
   ===================================================== */

function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);

    if (!product || !productDetailsModal || !productDetailsBody) {
        return;
    }

    productDetailsBody.innerHTML = `
        <div class="product-details-content">
            <img
                src="${product.image}"
                alt="${product.name}"
                class="details-image"
            >

            <div class="details-info">
                <p class="product-category">${product.category}</p>

                <h2>${product.name}</h2>

                <p>★ ${product.rating} (${product.reviews} reviews)</p>

                <h3>
                    ${formatPrice(product.price)}
                    <del>${formatPrice(product.oldPrice)}</del>
                </h3>

                <h4>Key Ingredients</h4>
                <p>${product.ingredients.join(", ")}</p>

                <h4>Benefits</h4>
                <ul>
                    ${product.benefits.map(benefit =>
                        `<li>${benefit}</li>`
                    ).join("")}
                </ul>

                <button
                    type="button"
                    id="detailsAddToCart"
                    data-product-id="${product.id}"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    productDetailsModal.classList.add("active");

    if (overlay) {
        overlay.classList.add("active");
    }
}

function closeProductDetailsModal() {
    if (productDetailsModal) {
        productDetailsModal.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }
}

if (closeProductDetails) {
    closeProductDetails.addEventListener(
        "click",
        closeProductDetailsModal
    );
}

if (productDetailsBody) {
    productDetailsBody.addEventListener("click", function (event) {
        const button = event.target.closest("#detailsAddToCart");

        if (!button) return;

        const productId = Number(button.dataset.productId);

        closeProductDetailsModal();
        addToCart(productId);
    });
}


/* =====================================================
   2. CHECKOUT MODAL
   ===================================================== */

function openCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty. Please add a product first.");
        return;
    }

    if (checkoutTotal) {
        checkoutTotal.textContent = formatPrice(getCartSubtotal());
    }

    closeCartPanel();

    if (checkoutModal) {
        checkoutModal.classList.add("active");
    }

    if (overlay) {
        overlay.classList.add("active");
    }
}

function closeCheckoutModal() {
    if (checkoutModal) {
        checkoutModal.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", openCheckout);
}

if (closeCheckout) {
    closeCheckout.addEventListener("click", closeCheckoutModal);
}


if (checkoutForm) {
    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty!");
            closeCheckoutModal();
            return;
        }

        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }

        // Require a logged-in customer.
        const email = sessionStorage.getItem("glowGraceEmail");

        if (!email) {
            alert("Please log in before placing your order.");
            closeCheckoutModal();
            openAuthModal();
            return;
        }

        const formData = new FormData(checkoutForm);
        const customerName =
            formData.get("name") ||
            formData.get("customerName") ||
            sessionStorage.getItem("glowGraceUser") ||
            "Customer";

        // Convert your existing cart into the format expected by Java.
        const orderItems = cart.map(function (item) {
            const product = products.find(p => p.id === item.id);

            if (!product) {
                throw new Error("A product in your cart could not be found.");
            }

            return {
                name: product.name,
                price: product.price,
                quantity: item.quantity
            };
        });

        const submitButton =
            checkoutForm.querySelector('button[type="submit"]');

        if (submitButton) submitButton.disabled = true;

        if (orderMessage) {
            orderMessage.style.display = "block";
            orderMessage.textContent = "Placing your order...";
        }

        try {
            const response = await fetch("http://localhost:8081/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    items: orderItems
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not place your order."
                );
            }

            // Only clear the cart after Java confirms success.
            const orderId = result.orderId;

            cart = [];
            saveCart();
            renderCart();
            checkoutForm.reset();

            if (orderMessage) {
                orderMessage.style.display = "block";
                orderMessage.textContent =
                    `Thank you, ${customerName}! ` +
                    `Your order GG${orderId} was placed successfully. ` +
                    `Total: ${formatPrice(
                        orderItems.reduce(
                            (sum, item) =>
                                sum + item.price * item.quantity,
                            0
                        )
                    )}. Open My Orders to view your purchase.`;
            } else {
                alert(
                    `Order placed successfully!\n` +
                    `Order ID: GG${orderId}`
                );
            }

        } catch (error) {
            console.error("Checkout error:", error);

            if (orderMessage) {
                orderMessage.style.display = "block";
                orderMessage.textContent =
                    error.message === "Failed to fetch"
                        ? "Cannot reach the order server. Check that OrderServer is running on port 8081."
                        : error.message;
            } else {
                alert(error.message);
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

/* =====================================================
   LOGIN AND SIGNUP — GLOW & GRACE
   ===================================================== */

const AUTH_API = "http://localhost:8080";

function openAuthModal() {
    if (!authModal) return;

    authModal.classList.add("active");
    showLoginForm();
}

function closeAuthModal() {
    if (authModal) {
        authModal.classList.remove("active");
    }
}

function showLoginForm() {
    if (loginForm) loginForm.hidden = false;
    if (registerForm) registerForm.hidden = true;

    if (showLogin) showLogin.classList.add("active");
    if (showRegister) showRegister.classList.remove("active");

    if (authTitle) authTitle.textContent = "Welcome Back!";
    if (authSubtitle) {
        authSubtitle.textContent =
            "Sign in to continue your skincare journey.";
    }

    if (authMessage) authMessage.textContent = "";
}

function showRegisterForm() {
    if (loginForm) loginForm.hidden = true;
    if (registerForm) registerForm.hidden = false;

    if (showLogin) showLogin.classList.remove("active");
    if (showRegister) showRegister.classList.add("active");

    if (authTitle) authTitle.textContent = "Create Your Account";
    if (authSubtitle) {
        authSubtitle.textContent =
            "Join the Glow & Grace community.";
    }

    if (authMessage) authMessage.textContent = "";
}

if (loginButton) {
    loginButton.addEventListener("click", openAuthModal);
}

if (closeAuth) {
    closeAuth.addEventListener("click", closeAuthModal);
}

if (showLogin) {
    showLogin.addEventListener("click", showLoginForm);
}

if (showRegister) {
    showRegister.addEventListener("click", showRegisterForm);
}

// REAL LOGIN — verifies the account using Java and MySQL.
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!loginForm.reportValidity()) return;

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        if (authMessage) {
            authMessage.textContent = "Logging in...";
        }

        const submitButton =
            loginForm.querySelector('button[type="submit"]');

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${AUTH_API}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Login failed. Please try again."
                );
            }
            
            sessionStorage.setItem("glowGraceUser", result.fullName);
            sessionStorage.setItem("glowGraceEmail", email);
            updateAccountUI();

            if (authMessage) {
                authMessage.textContent =
                    `Welcome, ${result.fullName}! Login successful.`;
            }

            // Remember the display name for this browser session.
            sessionStorage.setItem(
                "glowGraceUser",
                result.fullName
            );
            
            loginForm.reset();

        } catch (error) {
            console.error("Login error:", error);

            if (authMessage) {
                authMessage.textContent =
                    error.message === "Failed to fetch"
                        ? "Cannot reach Java. Check that the backend is running on port 8080."
                        : error.message;
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// REAL REGISTRATION — creates the account in MySQL.
if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!registerForm.reportValidity()) return;

        const fullName =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            if (authMessage) {
                authMessage.textContent =
                    "Passwords do not match. Please try again.";
            }
            return;
        }

        if (authMessage) {
            authMessage.textContent = "Creating your account...";
        }

        const submitButton =
            registerForm.querySelector('button[type="submit"]');

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${AUTH_API}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not create your account."
                );
            }

            registerForm.reset();
            showLoginForm();

            const loginEmail =
                document.getElementById("loginEmail");

            if (loginEmail) loginEmail.value = email;

            if (authMessage) {
                authMessage.textContent =
                    "Account created successfully! Please log in.";
            }

        } catch (error) {
            console.error("Signup error:", error);

            if (authMessage) {
                authMessage.textContent =
                    error.message === "Failed to fetch"
                        ? "Cannot reach Java. Check that the backend is running on port 8080."
                        : error.message;
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// Close the authentication modal by clicking its backdrop.
if (authModal) {
    authModal.addEventListener("click", function (event) {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });
}


/* =====================================================
   6. UPDATE WISHLIST AND INITIAL DISPLAY
   ===================================================== */

function initializeWebsite() {
    // Keep wishlist values valid.
    wishlist = wishlist.filter(id =>
        products.some(product => product.id === id)
    );

    // Remove invalid or malformed cart items.
    cart = cart.filter(item =>
        item &&
        products.some(product => product.id === item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );

    saveCart();
    saveWishlist();

    updateWishlistCount();
    renderProducts();
    renderCart();
}

/* =====================================================
   ACCOUNT WELCOME AND LOGOUT
   ===================================================== */

function updateAccountUI() {
    const userName = sessionStorage.getItem("glowGraceUser");
    const isLoggedIn = Boolean(userName);

    if (loginButton) {
        loginButton.hidden = isLoggedIn;
    }

    if (welcomeUser) {
        welcomeUser.hidden = !isLoggedIn;
        welcomeUser.textContent = isLoggedIn
            ? `Welcome, ${userName}!`
            : "";
    }

    if (logoutButton) {
        logoutButton.hidden = !isLoggedIn;
    }
}

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        sessionStorage.removeItem("glowGraceUser");
        sessionStorage.removeItem("glowGraceEmail");
        updateAccountUI();

        if (authMessage) {
            authMessage.textContent = "";
        }

        closeAuthModal();
    });
}

initializeWebsite();
