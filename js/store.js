/* Nexus Health: store.js
   Shared shell (header, footer, cart drawer), cart logic, product photography,
   and per-page renderers. Pages declare themselves via <body data-page="...">.
*/

/* ============================================================
   Helpers
   ============================================================ */

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function money(n) {
  return "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

function fmtCount(n) {
  return n.toLocaleString("en-US");
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ============================================================
   Product photography
   Real photos live in img/<name>.webp. This renders an <img>
   sized to fill its tile via CSS (object-fit: cover).
   ============================================================ */

function productImg(p, eager) {
  var altText = esc(p.name) + ", " + esc(p.subtitle);
  return '<img class="tile-img" src="img/' + esc(p.img) + '.webp" alt="' + altText + '"' +
    (eager ? "" : ' loading="lazy"') + '>';
}

/* Star rating row */
function starsSVG(rating) {
  var star = '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path fill="#B9913F" d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"/></svg>';
  return '<span class="stars" aria-label="Rated ' + rating + ' out of 5">' + star.repeat(5) + "</span>";
}

/* ============================================================
   Cart (localStorage "vital_cart")
   Items: { id, variant: "one"|"sub", qty }
   ============================================================ */

var CART_KEY = "vital_cart";
var FREE_SHIP = 75;
var SHIP_COST = 6.95;

function getCart() {
  try {
    var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(function (i) { return getProductById(i.id); }) : [];
  } catch (e) { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCartUI();
}

function itemPrice(item) {
  var p = getProductById(item.id);
  return item.variant === "sub" ? p.subPrice : p.price;
}

function cartCount() {
  return getCart().reduce(function (n, i) { return n + i.qty; }, 0);
}

function cartSubtotal() {
  return getCart().reduce(function (n, i) { return n + itemPrice(i) * i.qty; }, 0);
}

function addToCart(id, variant, qty) {
  var items = getCart();
  var found = items.find(function (i) { return i.id === id && i.variant === variant; });
  if (found) found.qty += qty;
  else items.push({ id: id, variant: variant, qty: qty });
  saveCart(items);
  openDrawer();
}

function changeQty(index, delta) {
  var items = getCart();
  if (!items[index]) return;
  items[index].qty += delta;
  if (items[index].qty < 1) items.splice(index, 1);
  saveCart(items);
}

function removeItem(index) {
  var items = getCart();
  items.splice(index, 1);
  saveCart(items);
}

function clearCart() {
  saveCart([]);
}

/* ============================================================
   Shared shell: announcement bar, header, footer, cart drawer
   ============================================================ */

function shellHeaderHTML() {
  return '' +
  '<div class="announce">' +
    '<div class="announce-inner">' +
      '<span>GLP-1 Support has arrived.</span>' +
      '<a class="announce-btn" href="product.html?id=glp1-support">Check it out &rarr;</a>' +
    '</div>' +
  '</div>' +
  '<header class="site-header">' +
    '<div class="nav-inner">' +
      '<button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<a class="wordmark" href="index.html">NEXUS</a>' +
      '<nav class="main-nav" aria-label="Main">' +
        '<a href="shop.html">Shop</a>' +
        '<a href="shop.html?cat=daily">Daily</a>' +
        '<a href="shop.html?cat=performance">Performance</a>' +
        '<a href="shop.html?cat=vitality">Vitality</a>' +
      '</nav>' +
      '<div class="nav-right">' +
        '<a class="nav-about" href="index.html#experts">About</a>' +
        '<button class="cart-btn" id="cartBtn" aria-label="Open cart">' +
          '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M6 8V7a6 6 0 0 1 12 0v1h2.5l-1.2 12.2A2 2 0 0 1 17.3 22H6.7a2 2 0 0 1-2-1.8L3.5 8H6zm2 0h8V7a4 4 0 0 0-8 0v1z" fill="currentColor"/></svg>' +
          '<span>Cart</span><span class="cart-count" id="cartCount">0</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="mobile-menu" id="mobileMenu">' +
      '<a href="shop.html">Shop</a>' +
      '<a href="shop.html?cat=daily">Daily</a>' +
      '<a href="shop.html?cat=performance">Performance</a>' +
      '<a href="shop.html?cat=vitality">Vitality</a>' +
      '<a href="index.html#experts">About</a>' +
    '</div>' +
  '</header>' +
  '<div class="drawer-overlay" id="drawerOverlay"></div>' +
  '<aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">' +
    '<div class="drawer-head">' +
      '<h3>Your cart</h3>' +
      '<button class="drawer-close" id="drawerClose" aria-label="Close cart">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="drawer-items" id="drawerItems"></div>' +
    '<div class="drawer-foot" id="drawerFoot"></div>' +
  '</aside>';
}

function shellFooterHTML() {
  return '' +
  '<footer class="site-footer">' +
    '<div class="footer-inner">' +
      '<div class="footer-grid">' +
        '<div class="footer-brand"><span class="footer-wordmark">NEXUS</span>' +
          '<p>Supplements, peptides, and protein for people who take their edge seriously.</p></div>' +
        '<div class="footer-col"><h4>Shop</h4>' +
          '<a href="shop.html">Shop all</a>' +
          '<a href="shop.html?cat=daily">Daily Essentials</a>' +
          '<a href="shop.html?cat=performance">Performance</a>' +
          '<a href="shop.html?cat=vitality">Vitality</a></div>' +
        '<div class="footer-col"><h4>Learn</h4>' +
          '<a href="index.html#science">The science</a>' +
          '<a href="index.html#experts">Experts</a>' +
          '<a href="index.html#faq">FAQ</a></div>' +
        '<div class="footer-col"><h4>Support</h4>' +
          '<a href="mailto:support@nexushealth.co">support@nexushealth.co</a>' +
          '<a href="index.html#faq">Shipping</a>' +
          '<a href="index.html#faq">Returns</a></div>' +
      '</div>' +
      '<div class="footer-fine">' +
        '<p>These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.</p>' +
        '<p>&copy; 2026 Nexus Health. All rights reserved.</p>' +
      '</div>' +
    '</div>' +
  '</footer>';
}

function openDrawer() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("open");
  document.body.classList.add("drawer-lock");
}

function closeDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
  document.body.classList.remove("drawer-lock");
}

function renderCartUI() {
  var items = getCart();
  var countEl = document.getElementById("cartCount");
  if (countEl) countEl.textContent = String(cartCount());

  var itemsEl = document.getElementById("drawerItems");
  var footEl = document.getElementById("drawerFoot");
  if (!itemsEl || !footEl) return;

  if (items.length === 0) {
    itemsEl.innerHTML = '<div class="drawer-empty"><p>Your cart is empty.</p><a class="btn btn-primary" href="shop.html">Start shopping</a></div>';
    footEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = items.map(function (item, idx) {
    var p = getProductById(item.id);
    return '<div class="drawer-item">' +
      '<a class="drawer-thumb" href="product.html?id=' + esc(p.id) + '">' + productImg(p) + '</a>' +
      '<div class="drawer-item-info">' +
        '<a class="drawer-item-name" href="product.html?id=' + esc(p.id) + '">' + esc(p.name) + '</a>' +
        '<span class="drawer-item-variant">' + (item.variant === "sub" ? "Subscription" : "One-time") + '</span>' +
        '<div class="drawer-item-row">' +
          '<span class="qty-stepper">' +
            '<button data-qty="-1" data-idx="' + idx + '" aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button data-qty="1" data-idx="' + idx + '" aria-label="Increase quantity">+</button>' +
          '</span>' +
          '<button class="remove-btn" data-remove="' + idx + '">Remove</button>' +
        '</div>' +
      '</div>' +
      '<span class="drawer-item-price">' + money(itemPrice(item) * item.qty) + '</span>' +
    '</div>';
  }).join("");

  var sub = cartSubtotal();
  var away = FREE_SHIP - sub;
  var pct = Math.min(100, (sub / FREE_SHIP) * 100);
  var shipMsg = away > 0
    ? "You're " + money(Math.round(away * 100) / 100) + " away from free shipping"
    : "Free shipping unlocked 🎉";

  footEl.innerHTML =
    '<div class="ship-progress">' +
      '<span class="ship-msg' + (away <= 0 ? " unlocked" : "") + '">' + shipMsg + '</span>' +
      '<div class="progress-track"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
    '</div>' +
    '<div class="drawer-subtotal"><span>Subtotal</span><span>' + money(sub) + '</span></div>' +
    '<a class="btn btn-primary drawer-checkout" href="checkout.html">Checkout</a>';

  itemsEl.querySelectorAll("[data-qty]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      changeQty(parseInt(btn.getAttribute("data-idx"), 10), parseInt(btn.getAttribute("data-qty"), 10));
    });
  });
  itemsEl.querySelectorAll("[data-remove]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      removeItem(parseInt(btn.getAttribute("data-remove"), 10));
    });
  });
}

function initShell() {
  document.body.insertAdjacentHTML("afterbegin", shellHeaderHTML());
  document.body.insertAdjacentHTML("beforeend", shellFooterHTML());

  document.getElementById("cartBtn").addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  renderCartUI();
}

/* ============================================================
   Shared product card (shop grid, lineup, pairs-well-with)
   ============================================================ */

function productCardHTML(p, opts) {
  opts = opts || {};
  var badge = p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : "";
  return '<div class="product-card' + (opts.lineup ? " lineup-card" : "") + (p.badge && !opts.lineup ? " featured" : "") + '">' +
    '<a class="card-link" href="product.html?id=' + esc(p.id) + '">' +
      '<div class="card-art">' + badge + productImg(p) + '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-name">' + esc(p.name) + '</h3>' +
        '<span class="card-sub">' + esc(p.subtitle) + '</span>' +
        '<p class="card-tag">' + esc(p.tagline) + '</p>' +
        '<div class="card-rating">' + starsSVG(p.rating) + '<span>' + p.rating + ' (' + fmtCount(p.reviews) + ')</span></div>' +
        '<div class="card-price"><strong>' + money(p.price) + '</strong><span>or ' + money(p.subPrice) + '/mo with subscription</span></div>' +
      '</div>' +
    '</a>' +
    '<button class="btn btn-primary card-add" data-add="' + esc(p.id) + '">Add to cart</button>' +
  '</div>';
}

function bindCardAdds(container) {
  container.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addToCart(btn.getAttribute("data-add"), "one", 1);
    });
  });
}

/* ============================================================
   Home page
   ============================================================ */

function initHome() {
  // Featured product spotlight add-to-cart
  var fc = document.getElementById("featureCard");
  if (fc) bindCardAdds(fc);

  // Product lineup scroller (dark section)
  var scroller = document.getElementById("lineupScroller");
  if (scroller) {
    var lineupIds = ["glp1-support", "collagen-chocolate", "creatine-hydration", "ashwagandha-plus", "mushroom-coffee", "colostrum", "shilajit", "digestive-enzyme"];
    scroller.innerHTML = lineupIds.map(function (id) {
      return productCardHTML(getProductById(id), { lineup: true });
    }).join("");
    bindCardAdds(scroller);
  }

  // "See how we test" disclosure
  var testToggle = document.getElementById("testToggle");
  var testDetail = document.getElementById("testDetail");
  if (testToggle && testDetail) {
    testToggle.addEventListener("click", function () {
      var open = testDetail.classList.toggle("open");
      testToggle.textContent = open ? "Hide testing details" : "See how we test";
      testToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Email capture
  var form = document.getElementById("guideForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var done = document.createElement("p");
      done.className = "guide-done";
      done.textContent = "Check your inbox. It's on the way.";
      form.replaceWith(done);
    });
  }

  // FAQ accordion (one open at a time)
  initAccordions(document);
}

/* Accordion helper: works for FAQ and PDP accordions.
   Scoped one-open-at-a-time per .acc-group. */
function initAccordions(root) {
  root.querySelectorAll(".acc-group").forEach(function (group) {
    group.querySelectorAll(".acc-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.parentElement;
        var wasOpen = item.classList.contains("open");
        group.querySelectorAll(".acc-item.open").forEach(function (o) {
          o.classList.remove("open");
          o.querySelector(".acc-q").setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  });
}

/* ============================================================
   Shop page
   ============================================================ */

var GOAL_TITLES = {
  muscle: "Build muscle",
  recovery: "Recover faster",
  sleep: "Sleep deeper",
  focus: "Sharpen focus"
};
var CAT_TITLES = {
  daily: "Daily Essentials",
  performance: "Performance",
  vitality: "Vitality"
};

function initShop() {
  var grid = document.getElementById("productGrid");
  var title = document.getElementById("shopTitle");
  var sub = document.getElementById("shopSub");
  var chips = document.querySelectorAll("#chipRow .chip");

  function applyFilter(cat, goal, updateUrl) {
    var list = PRODUCTS.filter(function (p) {
      if (goal) return p.goals.indexOf(goal) !== -1;
      if (cat && cat !== "all") return p.category === cat;
      return true;
    });

    title.textContent = goal ? GOAL_TITLES[goal] : (cat && cat !== "all" ? CAT_TITLES[cat] : "Shop all");
    sub.textContent = list.length + (list.length === 1 ? " product" : " products");

    grid.innerHTML = list.map(function (p) { return productCardHTML(p); }).join("");
    bindCardAdds(grid);

    chips.forEach(function (chip) {
      var active = goal
        ? chip.getAttribute("data-goal") === goal
        : chip.getAttribute("data-cat") === (cat || "all");
      chip.classList.toggle("active", active);
    });

    if (updateUrl) {
      var url = "shop.html";
      if (goal) url += "?goal=" + goal;
      else if (cat && cat !== "all") url += "?cat=" + cat;
      history.replaceState(null, "", url);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      applyFilter(chip.getAttribute("data-cat"), chip.getAttribute("data-goal"), true);
    });
  });

  var cat = qs("cat");
  var goal = qs("goal");
  if (cat && !CAT_TITLES[cat]) cat = null;
  if (goal && !GOAL_TITLES[goal]) goal = null;
  applyFilter(cat || "all", goal, false);
}

/* ============================================================
   Product detail page
   ============================================================ */

var GOAL_CHIPS = {
  muscle: "Builds strength",
  recovery: "Speeds recovery",
  sleep: "Deeper sleep",
  focus: "Sharper focus"
};

function initProduct() {
  var root = document.getElementById("pdpRoot");
  var p = getProductById(qs("id") || "");

  if (!p) {
    root.innerHTML =
      '<div class="pdp-notfound">' +
        '<h1>We couldn\'t find that one.</h1>' +
        '<p>The product may have moved or the link is off. The full lineup is one click away.</p>' +
        '<a class="btn btn-primary" href="shop.html">Shop all products</a>' +
      '</div>';
    return;
  }

  document.title = p.name + " | Nexus Health";

  var benefitChips = p.goals.map(function (g) { return GOAL_CHIPS[g]; });
  benefitChips.push("Third-party tested");
  benefitChips = benefitChips.slice(0, 3);
  while (benefitChips.length < 3) benefitChips.push("Clinical doses");

  var ingRows = p.ingredients.map(function (ing) {
    return '<tr><td>' + esc(ing.name) + '</td><td>' + esc(ing.dose) + '</td></tr>';
  }).join("");

  root.innerHTML =
    '<nav class="breadcrumb" aria-label="Breadcrumb">' +
      '<a href="shop.html">Shop</a><span>/</span>' +
      '<a href="shop.html?cat=' + esc(p.category) + '">' + esc(CAT_TITLES[p.category]) + '</a><span>/</span>' +
      '<span class="crumb-here">' + esc(p.name) + '</span>' +
    '</nav>' +
    '<div class="pdp-grid">' +
      '<div class="pdp-left">' +
        '<div class="pdp-art">' + productImg(p, true) + '</div>' +
        '<div class="pdp-chips">' + benefitChips.map(function (c) {
          return '<span class="pill-chip">' + esc(c) + '</span>';
        }).join("") + '</div>' +
      '</div>' +
      '<div class="pdp-right">' +
        (p.badge ? '<span class="badge badge-inline">' + esc(p.badge) + '</span>' : "") +
        '<h1>' + esc(p.name) + '</h1>' +
        '<span class="pdp-subtitle">' + esc(p.subtitle) + '</span>' +
        '<div class="card-rating pdp-rating">' + starsSVG(p.rating) + '<span>' + p.rating + ' (' + fmtCount(p.reviews) + ' reviews)</span></div>' +
        '<p class="pdp-tagline">' + esc(p.tagline) + '</p>' +
        '<p class="pdp-desc">' + esc(p.description) + '</p>' +
        '<div class="option-cards" role="radiogroup" aria-label="Purchase options">' +
          '<label class="option-card selected">' +
            '<input type="radio" name="variant" value="sub" checked>' +
            '<span class="option-title">Subscribe &amp; save 20%</span>' +
            '<span class="option-sub">' + money(p.subPrice) + '/mo, pause or cancel anytime</span>' +
          '</label>' +
          '<label class="option-card">' +
            '<input type="radio" name="variant" value="one">' +
            '<span class="option-title">One-time purchase</span>' +
            '<span class="option-sub">' + money(p.price) + '</span>' +
          '</label>' +
        '</div>' +
        '<div class="pdp-buy-row">' +
          '<span class="qty-stepper qty-lg">' +
            '<button id="qtyDown" aria-label="Decrease quantity">&minus;</button>' +
            '<span id="qtyVal">1</span>' +
            '<button id="qtyUp" aria-label="Increase quantity">+</button>' +
          '</span>' +
          '<button class="btn btn-primary pdp-add" id="pdpAdd">Add to cart &middot; <span id="pdpAddPrice">' + money(p.subPrice) + '</span></button>' +
        '</div>' +
        '<div class="acc-group pdp-accs">' +
          '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>Ingredients</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><table class="dose-table"><thead><tr><th>Ingredient</th><th>Per serving</th></tr></thead><tbody>' + ingRows + '</tbody></table></div>' +
          '</div>' +
          '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>How to use</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><p>' + esc(p.howToUse) + '</p></div>' +
          '</div>' +
          '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>Shipping &amp; returns</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><p>Free shipping on orders over $75, otherwise a flat $6.95. Orders ship within 1 business day. Not feeling it? Email us within 30 days for a full refund, even on opened products.</p></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<section class="pairs-section">' +
      '<h2>Pairs well with</h2>' +
      '<div class="pairs-grid" id="pairsGrid"></div>' +
    '</section>';

  // Variant selection
  var qty = 1;
  var variant = "sub";
  var qtyVal = document.getElementById("qtyVal");
  var addPrice = document.getElementById("pdpAddPrice");

  function refreshAddPrice() {
    var unit = variant === "sub" ? p.subPrice : p.price;
    addPrice.textContent = money(unit * qty);
  }

  root.querySelectorAll(".option-card input").forEach(function (input) {
    input.addEventListener("change", function () {
      variant = input.value;
      root.querySelectorAll(".option-card").forEach(function (c) {
        c.classList.toggle("selected", c.contains(input));
      });
      refreshAddPrice();
    });
  });

  document.getElementById("qtyDown").addEventListener("click", function () {
    qty = Math.max(1, qty - 1); qtyVal.textContent = qty; refreshAddPrice();
  });
  document.getElementById("qtyUp").addEventListener("click", function () {
    qty = Math.min(9, qty + 1); qtyVal.textContent = qty; refreshAddPrice();
  });
  document.getElementById("pdpAdd").addEventListener("click", function () {
    addToCart(p.id, variant, qty);
  });

  initAccordions(root);

  // Pairs well with: same category first, then shared goals
  var pairs = PRODUCTS.filter(function (o) { return o.id !== p.id && o.category === p.category; });
  if (pairs.length < 3) {
    PRODUCTS.forEach(function (o) {
      if (pairs.length >= 3 || o.id === p.id || pairs.indexOf(o) !== -1) return;
      if (o.goals.some(function (g) { return p.goals.indexOf(g) !== -1; })) pairs.push(o);
    });
  }
  pairs = pairs.slice(0, 3);
  var pairsGrid = document.getElementById("pairsGrid");
  pairsGrid.innerHTML = pairs.map(function (o) { return productCardHTML(o); }).join("");
  bindCardAdds(pairsGrid);
}

/* ============================================================
   Checkout page
   ============================================================ */

function renderOrderSummary() {
  var el = document.getElementById("orderSummary");
  var items = getCart();

  if (items.length === 0) {
    el.innerHTML = '<p class="summary-empty">Your cart is empty.</p><a class="btn btn-secondary" href="shop.html">Back to shop</a>';
    var btn = document.getElementById("placeOrder");
    if (btn) btn.disabled = true;
    return;
  }

  var sub = cartSubtotal();
  var shipping = sub >= FREE_SHIP ? 0 : SHIP_COST;
  var total = sub + shipping;

  el.innerHTML =
    items.map(function (item) {
      var p = getProductById(item.id);
      return '<div class="summary-line">' +
        '<span class="summary-thumb">' + productImg(p) + '<span class="summary-qty">' + item.qty + '</span></span>' +
        '<span class="summary-name">' + esc(p.name) + '<em>' + (item.variant === "sub" ? "Subscription" : "One-time") + '</em></span>' +
        '<span>' + money(itemPrice(item) * item.qty) + '</span>' +
      '</div>';
    }).join("") +
    '<div class="summary-totals">' +
      '<div><span>Subtotal</span><span>' + money(sub) + '</span></div>' +
      '<div><span>Shipping</span><span>' + (shipping === 0 ? "Free" : money(shipping)) + '</span></div>' +
      (shipping !== 0 ? '<p class="summary-note">Add ' + money(Math.round((FREE_SHIP - sub) * 100) / 100) + ' more for free shipping.</p>' : "") +
      '<div class="summary-grand"><span>Total</span><span>' + money(Math.round(total * 100) / 100) + '</span></div>' +
    '</div>';
}

function initCheckout() {
  renderOrderSummary();

  var form = document.getElementById("checkoutForm");
  var btn = document.getElementById("placeOrder");

  btn.addEventListener("click", function () {
    if (getCart().length === 0) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    clearCart();
    document.getElementById("checkoutMain").innerHTML =
      '<div class="order-success">' +
        '<div class="success-check" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 12.5l5 5L20 6.5" stroke="#0E1526" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h1>Order placed. Welcome to Nexus Health.</h1>' +
        '<p>A confirmation is on its way to your inbox. Your order ships within 1 business day.</p>' +
        '<a class="btn btn-primary" href="shop.html">Keep shopping</a>' +
      '</div>';
    window.scrollTo({ top: 0 });
  });
}

/* ============================================================
   Boot
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  initShell();
  var page = document.body.getAttribute("data-page");
  if (page === "home") initHome();
  else if (page === "shop") initShop();
  else if (page === "product") initProduct();
  else if (page === "checkout") initCheckout();
});

/* Keep the cart badge fresh after bfcache restores and cross-tab changes */
window.addEventListener("pageshow", function () {
  if (document.getElementById("cartCount")) renderCartUI();
});
window.addEventListener("storage", function (e) {
  if (e.key === CART_KEY && document.getElementById("cartCount")) renderCartUI();
});
