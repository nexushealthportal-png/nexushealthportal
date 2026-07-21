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

/* Nexus Membership: flat monthly fee that unlocks a members-only discount
   on every order. Pre-selected at checkout, toggleable, cancel anytime. */
var MEMBER_KEY = "vital_member";
var MEMBER_FEE = 50;
var MEMBER_RATE = 0.20;

function isMember() {
  var v = localStorage.getItem(MEMBER_KEY);
  return v === null ? true : v === "1"; // default: enrolled (box pre-checked)
}

function setMember(on) {
  localStorage.setItem(MEMBER_KEY, on ? "1" : "0");
}

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

/* Pack tiers: the bigger the pack, the deeper the discount. The advertised
   percentage is the subscription rate; a one-time buy gives up 15 points of it. */
var PACKS = [
  { key: "single", label: "SINGLE", qty: 1, off: 0.30 },
  { key: "two", label: "2-PACK", qty: 2, off: 0.40 },
  { key: "six", label: "6-PACK", qty: 6, off: 0.48 }
];
var ONE_TIME_PENALTY = 0.15;

function packByKey(key) {
  for (var i = 0; i < PACKS.length; i++) if (PACKS[i].key === key) return PACKS[i];
  return PACKS[0];
}

function packOff(pack, variant) {
  return variant === "sub" ? pack.off : Math.max(0, pack.off - ONE_TIME_PENALTY);
}

function packPrice(p, pack, variant) {
  return Math.round(p.price * pack.qty * (1 - packOff(pack, variant)) * 100) / 100;
}

function packLabel(item) {
  return item.pack ? packByKey(item.pack).label + " · " : "";
}

function itemPrice(item) {
  var p = getProductById(item.id);
  if (item.pack) return packPrice(p, packByKey(item.pack), item.variant);
  return item.variant === "sub" ? p.subPrice : p.price;
}

function cartCount() {
  return getCart().reduce(function (n, i) { return n + i.qty; }, 0);
}

function cartSubtotal() {
  return getCart().reduce(function (n, i) { return n + itemPrice(i) * i.qty; }, 0);
}

function addToCart(id, variant, qty, pack) {
  var items = getCart();
  var key = pack || null;
  var found = items.find(function (i) {
    return i.id === id && i.variant === variant && (i.pack || null) === key;
  });
  if (found) found.qty += qty;
  else items.push({ id: id, variant: variant, qty: qty, pack: key });
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
        '<span class="drawer-item-variant">' + esc(packLabel(item)) + (item.variant === "sub" ? "Subscription" : "One-time") + '</span>' +
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
  initQuiz();
}

/* ============================================================
   Find your routine quiz
   ============================================================ */

var QUIZ_FORM = {
  capsule: ["glp1-support", "digestive-enzyme", "ashwagandha-plus", "libido-strips"],
  powder: ["collagen-chocolate", "creatine-hydration", "colostrum", "mushroom-coffee", "shilajit"]
};
var QUIZ_GOAL = {
  energy: ["shilajit", "mushroom-coffee", "creatine-hydration"],
  calm: ["ashwagandha-plus", "colostrum", "digestive-enzyme"],
  strength: ["creatine-hydration", "collagen-chocolate", "glp1-support"],
  gut: ["digestive-enzyme", "colostrum", "ashwagandha-plus"],
  metabolism: ["glp1-support", "digestive-enzyme", "mushroom-coffee"]
};
var QUIZ_STEPS = [
  { q: "What are you optimizing for first?", opts: [
    { label: "Energy and focus", value: "energy" },
    { label: "Sleep and stress", value: "calm" },
    { label: "Strength and recovery", value: "strength" },
    { label: "Gut and daily health", value: "gut" },
    { label: "Metabolism and weight", value: "metabolism" }
  ], key: "goal" },
  { q: "How do you like to take things?", opts: [
    { label: "Capsules, quick and simple", value: "capsule" },
    { label: "Powders and drinks", value: "powder" },
    { label: "No preference, whatever works", value: "any" }
  ], key: "form" },
  { q: "Where are you starting from?", opts: [
    { label: "Just testing the waters", value: "one" },
    { label: "Ready to commit to a routine", value: "sub" }
  ], key: "commit" }
];

function quizRecommend(ans) {
  var pool = (QUIZ_GOAL[ans.goal] || []).slice();
  if (ans.form === "capsule" || ans.form === "powder") {
    var pref = QUIZ_FORM[ans.form];
    pool.sort(function (a, b) { return (pref.indexOf(b) !== -1) - (pref.indexOf(a) !== -1); });
  }
  PRODUCTS.forEach(function (p) { if (pool.indexOf(p.id) === -1) pool.push(p.id); });
  return pool.slice(0, 3);
}

function initQuiz() {
  var ov = document.createElement("div");
  ov.className = "quiz-overlay";
  ov.id = "quizOverlay";
  ov.innerHTML =
    '<button class="quiz-close" id="quizClose" aria-label="Close quiz">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<div class="quiz-inner"><div class="quiz-progress-track"><div class="quiz-progress-bar" id="quizBar"></div></div>' +
    '<div id="quizBody"></div></div>';
  document.body.appendChild(ov);

  var state = { step: 0, ans: {} };

  function renderStep() {
    var body = document.getElementById("quizBody");
    document.getElementById("quizBar").style.width = ((state.step) / QUIZ_STEPS.length * 100) + "%";
    if (state.step >= QUIZ_STEPS.length) { renderResult(); return; }
    var s = QUIZ_STEPS[state.step];
    body.innerHTML =
      '<span class="quiz-step-count">Step ' + (state.step + 1) + ' of ' + QUIZ_STEPS.length + '</span>' +
      '<h2 class="quiz-q">' + esc(s.q) + '</h2>' +
      '<div class="quiz-options">' + s.opts.map(function (o) {
        return '<button class="quiz-opt" data-val="' + esc(o.value) + '"><span class="dot"></span>' + esc(o.label) + '</button>';
      }).join("") + '</div>' +
      (state.step > 0 ? '<button class="quiz-back" id="quizBack">&larr; Back</button>' : '');
    body.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.ans[s.key] = btn.getAttribute("data-val");
        state.step++;
        renderStep();
      });
    });
    var back = document.getElementById("quizBack");
    if (back) back.addEventListener("click", function () { state.step--; renderStep(); });
  }

  function renderResult() {
    document.getElementById("quizBar").style.width = "100%";
    var recs = quizRecommend(state.ans).map(getProductById).filter(Boolean);
    var variant = state.ans.commit === "sub" ? "sub" : "one";
    var body = document.getElementById("quizBody");
    body.innerHTML =
      '<span class="quiz-step-count">Your routine</span>' +
      '<h2 class="quiz-result-head">Built for your biology.</h2>' +
      '<p class="quiz-result-sub">Based on your answers, this is where we would start you.</p>' +
      '<div class="quiz-rec-grid">' + recs.map(function (p) {
        return '<a class="quiz-rec" href="product.html?id=' + esc(p.id) + '">' +
          '<div class="art">' + productImg(p) + '</div>' +
          '<div class="rb"><h4>' + esc(p.name) + '</h4><div class="rp">' + money(variant === "sub" ? p.subPrice : p.price) + (variant === "sub" ? "/mo" : "") + '</div></div>' +
        '</a>';
      }).join("") + '</div>' +
      '<button class="btn btn-primary quiz-addall" id="quizAddAll">Add all to cart</button>' +
      '<button class="quiz-restart" id="quizRestart">Start over</button>';
    document.getElementById("quizAddAll").addEventListener("click", function () {
      recs.forEach(function (p) { addToCart(p.id, variant, 1); });
      closeQuiz();
    });
    document.getElementById("quizRestart").addEventListener("click", function () {
      state.step = 0; state.ans = {}; renderStep();
    });
  }

  function openQuiz() { state.step = 0; state.ans = {}; renderStep(); ov.classList.add("open"); document.body.classList.add("drawer-lock"); }
  function closeQuiz() { ov.classList.remove("open"); document.body.classList.remove("drawer-lock"); }
  window.__openQuiz = openQuiz;

  document.getElementById("quizClose").addEventListener("click", closeQuiz);
  ov.addEventListener("click", function (e) { if (e.target === ov) closeQuiz(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeQuiz(); });
  document.querySelectorAll(".quiz-open-btn").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openQuiz(); });
  });
}

/* ============================================================
   Scroll reveal + animated counters
   ============================================================ */

function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  var sel = ".stats-band, .feature-grid, .timeline-card, .cat-card, .expert-card, .review-card, .goal-tile, .science-grid, .guide-card, .lineup-head, .acc-item, .promo-card";
  var els = [].slice.call(document.querySelectorAll(sel));
  if (!els.length) return;
  els.forEach(function (el) { el.classList.add("reveal"); });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (el) { obs.observe(el); });
}

function initCounters() {
  var band = document.querySelector(".stats-band");
  if (!band || !("IntersectionObserver" in window)) return;
  var nums = [].slice.call(band.querySelectorAll(".stat strong"));
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      obs.disconnect();
      nums.forEach(function (el) {
        var raw = el.textContent;
        var m = raw.match(/^(\d+)(.*)$/);
        if (!m) return;
        var target = parseInt(m[1], 10), suffix = m[2], start = null, dur = 1100;
        function tick(t) {
          if (start === null) start = t;
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
  }, { threshold: 0.5 });
  obs.observe(band);
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

/* Countdown on the limited-time offer. The window is held in sessionStorage so
   it keeps ticking across pages instead of resetting on every render. */
var OFFER_MS = 15 * 60 * 1000;

function initOfferClock() {
  var minEl = document.getElementById("offMin");
  var secEl = document.getElementById("offSec");
  if (!minEl || !secEl) return;

  var endAt = parseInt(sessionStorage.getItem("vital_offer_end") || "0", 10);
  if (!endAt || endAt <= Date.now()) {
    endAt = Date.now() + OFFER_MS;
    sessionStorage.setItem("vital_offer_end", String(endAt));
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var left = endAt - Date.now();
    if (left <= 0) {
      endAt = Date.now() + OFFER_MS;
      sessionStorage.setItem("vital_offer_end", String(endAt));
      left = OFFER_MS;
    }
    minEl.textContent = pad(Math.floor(left / 60000));
    secEl.textContent = pad(Math.floor((left % 60000) / 1000));
  }

  tick();
  setInterval(tick, 1000);
}

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
  ["Third-party tested", "Clinical doses", "No fillers"].forEach(function (c) {
    if (benefitChips.length < 3 && benefitChips.indexOf(c) === -1) benefitChips.push(c);
  });
  benefitChips = benefitChips.slice(0, 3);

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
        '<h1 class="pdp-title">' + esc(p.name) + '</h1>' +
        '<span class="pdp-subtitle">' + esc(p.subtitle) + '</span>' +
        '<div class="card-rating pdp-rating">' + starsSVG(p.rating) + '<span>' + p.rating + ' (' + fmtCount(p.reviews) + ' reviews)</span></div>' +
        '<div class="offer-box">' +
          '<div class="save-strip" aria-hidden="true"><div class="save-track" id="saveTrack"></div></div>' +
          '<div class="offer-body">' +
            '<div class="offer-row">' +
              '<span class="offer-label">' +
                '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3v3.6c0 1.5 4 3.4 4 5.4s-4 3.9-4 5.4V21M16 3v3.6c0 1.5-4 3.4-4 5.4s4 3.9 4 5.4V21" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' +
                'LIMITED TIME OFFER</span>' +
              '<span class="offer-clock"><b id="offMin">15</b><i>:</i><b id="offSec">00</b></span>' +
            '</div>' +
            '<div class="offer-row offer-price-row">' +
              '<span class="offer-cta">GET YOURS NOW FOR</span>' +
              '<span class="offer-price"><strong id="offerNow"></strong><s id="offerWas"></s></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pdp-perks">' +
          '<div class="perk perk-strong">' +
            '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M3 7.2l9-4 9 4v9.6l-9 4-9-4V7.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 7.2l9 4 9-4M12 11.2v9.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
            '<span id="shipLine"></span>' +
          '</div>' +
          '<div class="perk">' +
            '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.4-5.9M20 12a8 8 0 0 1-13.4 5.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M18.5 2.5V7h-4.5M5.5 21.5V17H10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<span>Recurring subscription (see below for details)</span>' +
          '</div>' +
        '</div>' +
        '<h3 class="pdp-select-head">Select your quantity</h3>' +
        '<div class="pack-row" id="packRow" role="radiogroup" aria-label="Quantity">' +
          PACKS.map(function (pk, i) {
            return '<button class="pack-pill' + (i === 0 ? " active" : "") + '" data-pack="' + esc(pk.key) + '" role="radio" aria-checked="' + (i === 0 ? "true" : "false") + '">' +
              '<span class="pack-name">' + esc(pk.label) + '</span>' +
              '<span class="pack-badge">' + Math.round(pk.off * 100) + '% OFF</span>' +
            '</button>';
          }).join("") +
        '</div>' +
        '<div class="pdp-note"><span class="note-dot" aria-hidden="true"></span>Most customers pick the 2-pack</div>' +
        '<h3 class="pdp-select-head">Select your plan</h3>' +
        '<div class="option-cards" role="radiogroup" aria-label="Purchase options">' +
          '<label class="option-card selected">' +
            '<input type="radio" name="variant" value="sub" checked>' +
            '<span class="option-title">Subscribe &amp; save</span>' +
            '<span class="option-sub" id="optSubLine"></span>' +
          '</label>' +
          '<label class="option-card">' +
            '<input type="radio" name="variant" value="one">' +
            '<span class="option-title">One-time purchase</span>' +
            '<span class="option-sub" id="optOneLine"></span>' +
          '</label>' +
        '</div>' +
        '<div class="pdp-buy-row">' +
          '<span class="qty-stepper qty-lg">' +
            '<button id="qtyDown" aria-label="Decrease quantity">&minus;</button>' +
            '<span id="qtyVal">1</span>' +
            '<button id="qtyUp" aria-label="Increase quantity">+</button>' +
          '</span>' +
          '<button class="btn btn-primary pdp-add" id="pdpAdd">Add to cart &middot; <span id="pdpAddPrice"></span></button>' +
        '</div>' +
        '<p class="pdp-tagline">' + esc(p.tagline) + '</p>' +
        '<p class="pdp-desc">' + esc(p.description) + '</p>' +
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

  // Pack + plan selection
  var qty = 1;
  var variant = "sub";
  var pack = PACKS[0];
  var qtyVal = document.getElementById("qtyVal");

  function refresh() {
    var unit = packPrice(p, pack, variant);
    var was = Math.round(p.price * pack.qty * 100) / 100;
    var off = Math.round(packOff(pack, variant) * 100);
    var lineTotal = Math.round(unit * qty * 100) / 100;

    document.getElementById("offerNow").textContent = money(unit);
    document.getElementById("offerWas").textContent = money(was);
    document.getElementById("pdpAddPrice").textContent = money(lineTotal);

    var cell = "<span>SAVE " + off + "%</span>";
    document.getElementById("saveTrack").innerHTML = cell.repeat(16);

    document.getElementById("shipLine").textContent = lineTotal >= FREE_SHIP
      ? "THIS ORDER SHIPS FREE"
      : "FREE SHIPPING ON ORDERS OVER " + money(FREE_SHIP);

    document.getElementById("optSubLine").textContent =
      money(packPrice(p, pack, "sub")) + ", " + Math.round(pack.off * 100) + "% off, cancel anytime";
    document.getElementById("optOneLine").textContent =
      money(packPrice(p, pack, "one")) + ", " + Math.round(packOff(pack, "one") * 100) + "% off";
  }

  root.querySelectorAll(".pack-pill").forEach(function (btn) {
    btn.addEventListener("click", function () {
      pack = packByKey(btn.getAttribute("data-pack"));
      root.querySelectorAll(".pack-pill").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      refresh();
    });
  });

  root.querySelectorAll(".option-card input").forEach(function (input) {
    input.addEventListener("change", function () {
      variant = input.value;
      root.querySelectorAll(".option-card").forEach(function (c) {
        c.classList.toggle("selected", c.contains(input));
      });
      refresh();
    });
  });

  document.getElementById("qtyDown").addEventListener("click", function () {
    qty = Math.max(1, qty - 1); qtyVal.textContent = qty; refresh();
  });
  document.getElementById("qtyUp").addEventListener("click", function () {
    qty = Math.min(9, qty + 1); qtyVal.textContent = qty; refresh();
  });
  document.getElementById("pdpAdd").addEventListener("click", function () {
    addToCart(p.id, variant, qty, pack.key);
  });

  refresh();
  initOfferClock();

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
  var member = isMember();
  var discount = member ? Math.round(sub * MEMBER_RATE * 100) / 100 : 0;
  var goods = sub - discount;
  var shipping = goods >= FREE_SHIP ? 0 : SHIP_COST;
  var total = goods + shipping + (member ? MEMBER_FEE : 0);

  el.innerHTML =
    items.map(function (item) {
      var p = getProductById(item.id);
      return '<div class="summary-line">' +
        '<span class="summary-thumb">' + productImg(p) + '<span class="summary-qty">' + item.qty + '</span></span>' +
        '<span class="summary-name">' + esc(p.name) + '<em>' + esc(packLabel(item)) + (item.variant === "sub" ? "Subscription" : "One-time") + '</em></span>' +
        '<span>' + money(itemPrice(item) * item.qty) + '</span>' +
      '</div>';
    }).join("") +
    '<label class="member-card' + (member ? " on" : "") + '" id="memberCard">' +
      '<input type="checkbox" id="memberToggle"' + (member ? " checked" : "") + '>' +
      '<span class="member-check" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12.5l5 5L20 6.5" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</span>' +
      '<span class="member-body">' +
        '<span class="member-title">Nexus Membership <em>' + money(MEMBER_FEE) + '/mo</em></span>' +
        '<span class="member-desc">20% off every order, member pricing applied below. Cancel anytime.</span>' +
      '</span>' +
    '</label>' +
    '<div class="summary-totals">' +
      '<div><span>Subtotal</span><span>' + money(sub) + '</span></div>' +
      (member ? '<div class="summary-save"><span>Member savings (20%)</span><span>&minus;' + money(discount) + '</span></div>' : "") +
      '<div><span>Shipping</span><span>' + (shipping === 0 ? "Free" : money(shipping)) + '</span></div>' +
      (shipping !== 0 ? '<p class="summary-note">Add ' + money(Math.round((FREE_SHIP - goods) * 100) / 100) + ' more for free shipping.</p>' : "") +
      (member ? '<div><span>Nexus Membership</span><span>' + money(MEMBER_FEE) + '/mo</span></div>' : "") +
      '<div class="summary-grand"><span>Total due today</span><span>' + money(Math.round(total * 100) / 100) + '</span></div>' +
      (member ? '<p class="summary-note member-note">Includes your first month of membership. Renews at ' + money(MEMBER_FEE) + '/mo, cancel anytime.</p>' : "") +
    '</div>';

  var toggle = document.getElementById("memberToggle");
  if (toggle) {
    toggle.addEventListener("change", function () {
      setMember(toggle.checked);
      renderOrderSummary();
    });
  }
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
  initReveal();
  initCounters();
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
