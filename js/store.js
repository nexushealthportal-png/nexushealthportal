/* Nexus Research: store.js
   Shared shell (header, footer, cart drawer), RUO access gate, cart logic,
   and per-page renderers. Pages declare themselves via <body data-page="...">.

   RESEARCH USE ONLY storefront. Deliberately contains no consumer-conversion
   machinery: no subscriptions, no urgency timers, no volume-discount ladders,
   no testimonials, no outcome claims. Product pages carry identity and
   handling data only.
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

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function productImg(p, eager) {
  return '<img class="tile-img" src="img/' + esc(p.img) + '.webp" alt="' + esc(p.name) + '"' +
    (eager ? "" : ' loading="lazy"') + '>';
}

/* ============================================================
   RUO access gate
   Confirms age and acceptance of the research-use-only terms before
   the catalog is reachable. Choice is remembered per browser.
   ============================================================ */

var GATE_KEY = "nr_ruo_ack";

function initGate() {
  if (localStorage.getItem(GATE_KEY) === "1") return;

  var gate = document.createElement("div");
  gate.className = "ruo-gate";
  gate.innerHTML =
    '<div class="ruo-panel" role="dialog" aria-modal="true" aria-labelledby="ruoTitle">' +
      '<span class="ruo-kicker">Research use only</span>' +
      '<h2 id="ruoTitle">You must be 21 or older to enter.</h2>' +
      '<p>Nexus Research supplies laboratory reagents and consumables strictly for ' +
      '<strong>in-vitro research use</strong>. Our products are not drugs, foods, cosmetics, ' +
      'or supplements, and are <strong>not for human or veterinary use</strong>.</p>' +
      '<p>By entering you confirm that you are at least 21 years old, that you are ' +
      'qualified to handle research chemicals, and that you accept our Research Use ' +
      'Only Agreement and Terms.</p>' +
      '<div class="ruo-actions">' +
        '<button class="btn btn-primary" id="ruoEnter">I am 21 or older, and I accept</button>' +
        '<a class="btn btn-ghost" id="ruoExit" href="https://www.google.com">Exit</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(gate);
  document.body.classList.add("gate-lock");

  document.getElementById("ruoEnter").addEventListener("click", function () {
    localStorage.setItem(GATE_KEY, "1");
    gate.remove();
    document.body.classList.remove("gate-lock");
  });
}

/* ============================================================
   Cart (localStorage "nr_cart")
   Items: { id, qty }. Single price per SKU, no variants.
   ============================================================ */

var CART_KEY = "nr_cart";
var FREE_SHIP = 150;
var SHIP_COST = 12.00;

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
  return getProductById(item.id).price;
}

function cartCount() {
  return getCart().reduce(function (n, i) { return n + i.qty; }, 0);
}

function cartSubtotal() {
  return getCart().reduce(function (n, i) { return n + itemPrice(i) * i.qty; }, 0);
}

function addToCart(id, qty) {
  var items = getCart();
  var found = items.find(function (i) { return i.id === id; });
  if (found) found.qty += qty;
  else items.push({ id: id, qty: qty });
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
   Shared shell
   ============================================================ */

function shellHeaderHTML() {
  return '' +
  '<a class="skip-link" href="#main">Skip to content</a>' +
  '<div class="announce">' +
    '<div class="announce-inner">' +
      '<span>Research use only &middot; Not for human or veterinary use</span>' +
    '</div>' +
  '</div>' +
  '<header class="site-header">' +
    '<div class="nav-inner">' +
      '<button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<a class="wordmark lockup" href="index.html">NEXUS <em>Research</em></a>' +
      '<nav class="main-nav" aria-label="Main">' +
        '<a href="shop.html">Catalog</a>' +
        '<a href="shop.html?cat=peptides">Peptides</a>' +
        '<a href="shop.html?cat=biochemicals">Biochemicals</a>' +
        '<a href="shop.html?cat=supplies">Lab supplies</a>' +
        '<a href="quality.html">Quality</a>' +
      '</nav>' +
      '<div class="nav-right">' +
        '<a class="nav-about" href="about.html">About</a>' +
        '<button class="cart-btn" id="cartBtn" aria-label="Open cart">' +
          '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M6 8V7a6 6 0 0 1 12 0v1h2.5l-1.2 12.2A2 2 0 0 1 17.3 22H6.7a2 2 0 0 1-2-1.8L3.5 8H6zm2 0h8V7a4 4 0 0 0-8 0v1z" fill="currentColor"/></svg>' +
          '<span>Cart</span><span class="cart-count" id="cartCount">0</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="mobile-menu" id="mobileMenu">' +
      '<a href="shop.html">Catalog</a>' +
      '<a href="shop.html?cat=peptides">Peptides</a>' +
      '<a href="shop.html?cat=biochemicals">Biochemicals</a>' +
      '<a href="shop.html?cat=supplies">Lab supplies</a>' +
      '<a href="quality.html">Quality &amp; testing</a>' +
      '<a href="certificates.html">Certificates</a>' +
      '<a href="shipping.html">Shipping</a>' +
      '<a href="wholesale.html">Wholesale</a>' +
      '<a href="about.html">About</a>' +
    '</div>' +
  '</header>' +
  '<div class="drawer-overlay" id="drawerOverlay"></div>' +
  '<aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">' +
    '<div class="drawer-head">' +
      '<h3>Your order</h3>' +
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
  '<footer class="site-footer dotted dotted--mint dotted--top">' +
    '<div class="footer-inner">' +

      /* Same .lockup markup and CSS as the header, so the letterforms,
         weights and spacing can never drift apart. initMegaFit() scales it. */
      '<div class="footer-mega"><span class="lockup">NEXUS <em>Research</em></span></div>' +

      '<div class="footer-grid">' +
        '<div class="footer-col"><h4>Catalog</h4>' +
          '<a href="shop.html">All products</a>' +
          '<a href="shop.html?cat=peptides">Peptides</a>' +
          '<a href="shop.html?cat=biochemicals">Biochemicals</a>' +
          '<a href="shop.html?cat=supplies">Lab supplies</a></div>' +
        '<div class="footer-col"><h4>Company</h4>' +
          '<a href="about.html">About Nexus</a>' +
          '<a href="quality.html">Quality &amp; testing</a>' +
          '<a href="certificates.html">Certificates</a>' +
          '<a href="shipping.html">Shipping &amp; handling</a></div>' +
        '<div class="footer-col"><h4>Support</h4>' +
          // <wbr> after the @ so a narrow column breaks the address at a
          // readable point instead of mid-word ("nexusresearc / h.co")
          '<a href="mailto:support@nexusresearch.co">support@<wbr>nexusresearch.co</a>' +
          '<a href="wholesale.html">Wholesale</a>' +
          '<a href="index.html#faq">FAQ</a>' +
          '<a href="shipping.html">Returns</a></div>' +
        '<div class="footer-col"><h4>Get in touch</h4>' +
          '<p class="footer-note">Laboratory reagents and consumables, independently tested with a certificate of analysis on every lot.</p>' +
          '<p class="footer-badges"><span>HPLC + LC-MS</span><span>Tamper-sealed</span></p></div>' +
      '</div>' +

      '<div class="footer-fine">' +
        '<p><strong>DISCLAIMER</strong> &mdash; All products sold by Nexus Research are intended for ' +
        'laboratory research use only. They are not for human or animal consumption of any kind, and are ' +
        'not drugs, foods, cosmetics, or dietary supplements. Nothing on this site constitutes medical advice ' +
        'or a recommendation regarding the use of any compound, and no statement here has been evaluated by ' +
        'the Food and Drug Administration. Purchasers confirm that they are qualified to handle research ' +
        'chemicals and assume all responsibility for safe and lawful use.</p>' +
      '</div>' +

      '<div class="footer-legal">' +
        '<span>&copy; 2026 Nexus Research. All rights reserved.</span>' +
        '<span class="footer-legal-links">' +
          '<a href="index.html#faq">Terms</a>' +
          '<a href="index.html#faq">Privacy</a>' +
          '<a href="shipping.html">Shipping policy</a>' +
          '<a href="index.html#faq">RUO agreement</a>' +
        '</span>' +
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
    itemsEl.innerHTML = '<div class="drawer-empty"><p>Your order is empty.</p><a class="btn btn-primary" href="shop.html">Browse the catalog</a></div>';
    footEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = items.map(function (item, idx) {
    var p = getProductById(item.id);
    return '<div class="drawer-item">' +
      '<a class="drawer-thumb" href="product.html?id=' + esc(p.id) + '">' + productImg(p) + '</a>' +
      '<div class="drawer-item-info">' +
        '<a class="drawer-item-name" href="product.html?id=' + esc(p.id) + '">' + esc(p.name) + '</a>' +
        '<span class="drawer-item-variant">' + esc(p.size) + (p.purity ? " &middot; " + esc(p.purity) : "") + '</span>' +
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
    ? money(Math.round(away * 100) / 100) + " from free shipping"
    : "Free shipping applied";

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


/* Scale the footer lockup to fill its row exactly. Measuring beats guessing
   with a font-size clamp, which is what let it overflow before. */
function initMegaFit() {
  var wrap = document.querySelector(".footer-mega");
  if (!wrap) return;
  var mark = wrap.querySelector(".lockup");
  if (!mark) return;

  function fit() {
    // Measure shrink-to-fit. As a block element its width would just report
    // the container, which is what made it under-fill.
    mark.style.display = "inline-block";
    mark.style.fontSize = "100px";
    var natural = mark.getBoundingClientRect().width;
    if (!natural) return;
    // clientWidth INCLUDES the wrapper's padding, so using it directly let the
    // mark run past the padding and get chopped by overflow:hidden. The real
    // room is the content box.
    var cs = getComputedStyle(wrap);
    var avail = wrap.clientWidth -
                parseFloat(cs.paddingLeft || 0) -
                parseFloat(cs.paddingRight || 0);
    if (!(avail > 0)) return;
    // 0.995 leaves a sub-pixel guard so rounding can never clip the last glyph
    mark.style.fontSize = Math.max(20, Math.floor(avail / natural * 99.5)) + "px";
    // hard backstop: if anything still overflows, step down until it fits
    var guard = 0;
    while (mark.getBoundingClientRect().width > avail && guard < 40) {
      mark.style.fontSize = (parseFloat(mark.style.fontSize) - 1) + "px";
      guard++;
    }
  }

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  setTimeout(fit, 600);                       // late webfont swap
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  else window.addEventListener("resize", fit);
}


/* COA lookup. Lives on its own so the homepage band and the certificates
   page can both host it. No-ops when the form is not present. */
function initCoa() {
  // COA lookup: resolves a lot number to its product record
  var coaForm = document.getElementById("coaForm");
  if (coaForm) {
    coaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = document.getElementById("coaInput").value.trim().toLowerCase();
      var out = document.getElementById("coaResult");
      if (!q) { out.innerHTML = ""; return; }
      var hit = PRODUCTS.find(function (p) {
        return (p.lot && p.lot.toLowerCase() === q) ||
               p.name.toLowerCase().indexOf(q) !== -1 ||
               (p.cas && p.cas === q);
      });
      if (hit) {
        out.innerHTML = '<div class="coa-hit">' +
          '<span class="coa-lot">' + esc(hit.lot) + '</span>' +
          '<span class="coa-name">' + esc(hit.name) + ' &middot; ' + esc(hit.purity) + ' by ' + esc(hit.method) + '</span>' +
          '<a class="text-btn" href="product.html?id=' + esc(hit.id) + '">View product &rarr;</a>' +
          '<p class="coa-note">Email support with this lot number and we will send the signed certificate for it.</p>' +
        '</div>';
      } else {
        out.innerHTML = '<p class="coa-miss">No lot matching that reference. Search by lot number (for example NR-2601-A), product name, or CAS.</p>';
      }
    });
  }
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
  initMegaFit();
  initCoa();
}

/* ============================================================
   Scroll reveal, counters, motion
   ============================================================ */

function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  var sel = ".stats-band, .spec-card, .cat-card, .guide-card, .acc-item, .lineup-grid .product-card, .promise-card";
  var els = [].slice.call(document.querySelectorAll(sel));
  if (!els.length) return;
  els.forEach(function (el) {
    el.classList.add("reveal");
    var sibs = [].slice.call(el.parentElement.children).filter(function (c) {
      return c.classList.contains("reveal");
    });
    var idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 70, 420) + "ms";
  });
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
        var m = raw.match(/^([\d.]+)(.*)$/);
        if (!m) return;
        var target = parseFloat(m[1]);
        var decimals = (m[1].split(".")[1] || "").length;
        var suffix = m[2], start = null, dur = 1100;
        function tick(t) {
          if (start === null) start = t;
          var pr = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - pr, 3);
          el.textContent = (eased * target).toFixed(decimals) + suffix;
          if (pr < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
  }, { threshold: 0.5 });
  obs.observe(band);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initMotion() {
  if (prefersReducedMotion()) return;

  var heroImg = document.querySelector(".hero-lux-bg img");
  if (heroImg) {
    var heroH = 0, ticking = false;
    function measure() { heroH = heroImg.closest(".hero-lux").offsetHeight; }
    function apply() {
      ticking = false;
      var y = window.scrollY;
      if (y <= heroH) heroImg.style.transform = "translate3d(0," + Math.round(y * 0.28) + "px,0) scale(1.1)";
    }
    measure(); apply();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  var spotSel = ".product-card, .cat-card, .promise-card, .spec-card";
  var magSel = ".hero-lux .btn, .card-add, .pdp-add, .lineup-foot .btn, .sticky-add";
  var lastMag = null;

  document.addEventListener("mousemove", function (e) {
    if (!e.target || !e.target.closest) return;

    var card = e.target.closest(spotSel);
    if (card) {
      var r = card.getBoundingClientRect();
      card.classList.add("spot");
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }

    var btn = e.target.closest(magSel);
    if (btn !== lastMag && lastMag) { lastMag.style.transform = ""; }
    lastMag = btn;
    if (btn) {
      var b = btn.getBoundingClientRect();
      var dx = (e.clientX - b.left - b.width / 2) / (b.width / 2);
      var dy = (e.clientY - b.top - b.height / 2) / (b.height / 2);
      btn.style.transform = "translate(" + Math.round(dx * 5) + "px," + Math.round(dy * 4) + "px)";
    }
  }, { passive: true });
}

function addFeedback(btn) {
  var badge = document.getElementById("cartCount");
  if (badge) {
    badge.classList.remove("pulse");
    void badge.offsetWidth;
    badge.classList.add("pulse");
  }
  if (btn && !btn.dataset.busy) {
    btn.dataset.busy = "1";
    var original = btn.innerHTML;
    btn.classList.add("added");
    btn.innerHTML = "Added &#10003;";
    setTimeout(function () {
      btn.classList.remove("added");
      btn.innerHTML = original;
      delete btn.dataset.busy;
    }, 1400);
  }
}

/* ============================================================
   Product card: identity data, no ratings or urgency
   ============================================================ */

function productCardHTML(p) {
  var specs = [];
  if (p.cas) specs.push('<span><i>CAS</i>' + esc(p.cas) + '</span>');
  specs.push('<span><i>Size</i>' + esc(p.size) + '</span>');
  if (p.purity) specs.push('<span><i>Purity</i>' + esc(p.purity) + '</span>');

  return '<div class="product-card">' +
    '<a class="card-link" href="product.html?id=' + esc(p.id) + '">' +
      '<div class="card-art">' + productImg(p) + '</div>' +
      '<div class="card-body">' +
        '<span class="card-sub">' + esc(p.subtitle) + '</span>' +
        '<h3 class="card-name">' + esc(p.name) + '</h3>' +
        '<div class="card-specs">' + specs.join("") + '</div>' +
        '<div class="card-price"><strong>' + money(p.price) + '</strong></div>' +
      '</div>' +
    '</a>' +
    '<button class="btn btn-primary card-add" data-add="' + esc(p.id) + '">Add to order</button>' +
  '</div>';
}

function bindCardAdds(container) {
  container.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addToCart(btn.getAttribute("data-add"), 1);
      addFeedback(btn);
    });
  });
}

/* ============================================================
   Home page
   ============================================================ */

function initHome() {
  var grid = document.getElementById("lineupScroller");
  if (grid) {
    grid.innerHTML = PRODUCTS.map(function (p) { return productCardHTML(p); }).join("");
    bindCardAdds(grid);
  }

  var testToggle = document.getElementById("testToggle");
  var testDetail = document.getElementById("testDetail");
  if (testToggle && testDetail) {
    testToggle.addEventListener("click", function () {
      var open = testDetail.classList.toggle("open");
      testToggle.textContent = open ? "Hide method detail" : "See our testing method";
      testToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var form = document.getElementById("guideForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var done = document.createElement("p");
      done.className = "guide-done";
      done.textContent = "You're on the list.";
      form.replaceWith(done);
    });
  }

  initAccordions(document);
}

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
   Catalog page
   ============================================================ */

var CAT_TITLES = {
  peptides: "Peptides",
  biochemicals: "Biochemicals",
  supplies: "Lab supplies"
};

function initShop() {
  var grid = document.getElementById("productGrid");
  var title = document.getElementById("shopTitle");
  var sub = document.getElementById("shopSub");
  var chips = document.querySelectorAll("#chipRow .chip");
  var search = document.getElementById("catalogSearch");
  var clearBtn = document.getElementById("searchClear");
  var sortSel = document.getElementById("catalogSort");

  var state = { cat: "all", q: "", sort: "default" };

  /* Match on anything a researcher would actually type: product or common
     name, category, CAS (with or without dashes), or molecular formula. */
  function matches(p, q) {
    if (!q) return true;
    var hay = [p.name, p.subtitle, p.cas, p.formula, p.sequence, CAT_TITLES[p.category]]
      .filter(Boolean).join(" ").toLowerCase();
    var bare = hay.replace(/-/g, "");
    var needle = q.toLowerCase().trim();
    return hay.indexOf(needle) !== -1 || bare.indexOf(needle.replace(/-/g, "")) !== -1;
  }

  var SORTS = {
    "default": null,
    "price-asc": function (a, b) { return a.price - b.price; },
    "price-desc": function (a, b) { return b.price - a.price; },
    "name": function (a, b) { return a.name.localeCompare(b.name); }
  };

  function render(updateUrl) {
    var list = PRODUCTS.filter(function (p) {
      return (state.cat === "all" || p.category === state.cat) && matches(p, state.q);
    });
    if (SORTS[state.sort]) list = list.slice().sort(SORTS[state.sort]);

    title.textContent = state.cat !== "all" ? CAT_TITLES[state.cat] : "Full catalog";

    if (list.length) {
      sub.textContent = list.length + (list.length === 1 ? " product" : " products") +
        (state.q ? ' matching "' + state.q + '"' : "") +
        " · every lot tested, certificate on file";
      grid.innerHTML = list.map(function (p) { return productCardHTML(p); }).join("");
      bindCardAdds(grid);
    } else {
      sub.textContent = "No matches";
      grid.innerHTML =
        '<div class="empty-state">' +
          '<h3>Nothing matched that search.</h3>' +
          '<p>Try a compound name, a CAS number, or a category. Or clear the filters to see the full catalog.</p>' +
          '<button class="btn btn-ghost" id="resetFilters">Show all products</button>' +
        '</div>';
      var reset = document.getElementById("resetFilters");
      if (reset) reset.addEventListener("click", function () {
        state.cat = "all"; state.q = ""; state.sort = "default";
        if (search) search.value = "";
        if (sortSel) sortSel.value = "default";
        render(true);
      });
    }

    chips.forEach(function (chip) {
      chip.classList.toggle("active", chip.getAttribute("data-cat") === state.cat);
    });
    if (clearBtn) clearBtn.classList.toggle("show", !!state.q);

    if (updateUrl) {
      var parts = [];
      if (state.cat !== "all") parts.push("cat=" + encodeURIComponent(state.cat));
      if (state.q) parts.push("q=" + encodeURIComponent(state.q));
      if (state.sort !== "default") parts.push("sort=" + encodeURIComponent(state.sort));
      history.replaceState(null, "", "shop.html" + (parts.length ? "?" + parts.join("&") : ""));
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.cat = chip.getAttribute("data-cat");
      render(true);
    });
  });

  if (search) {
    search.addEventListener("input", function () {
      state.q = search.value;
      render(true);
    });
    // Escape clears the field, which is what people expect from a search box
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { search.value = ""; state.q = ""; render(true); }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      search.value = ""; state.q = ""; search.focus(); render(true);
    });
  }
  if (sortSel) {
    sortSel.addEventListener("change", function () {
      state.sort = sortSel.value;
      render(true);
    });
  }

  // Restore state from the URL so filtered views are shareable
  var cat = qs("cat");
  state.cat = (cat && CAT_TITLES[cat]) ? cat : "all";
  state.q = qs("q") || "";
  var sort = qs("sort");
  state.sort = SORTS[sort] ? sort : "default";
  if (search) search.value = state.q;
  if (sortSel) sortSel.value = state.sort;
  render(false);
}

/* ============================================================
   Product detail: specification sheet
   ============================================================ */

function initProduct() {
  var root = document.getElementById("pdpRoot");
  var p = getProductById(qs("id") || "");

  if (!p) {
    root.innerHTML =
      '<div class="pdp-notfound">' +
        '<h1>No record for that reference.</h1>' +
        '<p>The catalog number may have changed or the link is incomplete.</p>' +
        '<a class="btn btn-primary" href="shop.html">Browse the catalog</a>' +
      '</div>';
    return;
  }

  document.title = p.name + " | Nexus Research";

  var specRows = [
    ["Catalog number", p.lot],
    ["CAS number", p.cas],
    ["Molecular formula", p.formula],
    ["Molecular weight", p.mw],
    ["Sequence", p.sequence],
    ["Unit size", p.size],
    ["Purity", p.purity],
    ["Analytical method", p.method],
    ["Physical form", p.form],
    ["Solubility", p.solubility]
  ].filter(function (r) { return r[1]; })
   .map(function (r) {
     return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
   }).join("");

  var appItems = (p.apps || []).map(function (a) {
    return '<li>' + esc(a) + '</li>';
  }).join("");

  root.innerHTML =
    '<nav class="breadcrumb" aria-label="Breadcrumb">' +
      '<a href="shop.html">Catalog</a><span>/</span>' +
      '<a href="shop.html?cat=' + esc(p.category) + '">' + esc(CAT_TITLES[p.category]) + '</a><span>/</span>' +
      '<span class="crumb-here">' + esc(p.name) + '</span>' +
    '</nav>' +
    '<div class="pdp-grid">' +
      '<div class="pdp-left">' +
        '<div class="pdp-art">' + productImg(p, true) + '</div>' +
        '<div class="pdp-chips">' +
          '<span class="pill-chip">Research use only</span>' +
          '<span class="pill-chip">Lot ' + esc(p.lot) + '</span>' +
          '<span class="pill-chip">COA on file</span>' +
        '</div>' +
      '</div>' +
      '<div class="pdp-right">' +
        '<span class="pdp-subtitle">' + esc(p.subtitle) + '</span>' +
        '<h1 class="pdp-title">' + esc(p.name) + '</h1>' +
        '<p class="pdp-tagline">' + esc(p.tagline) + '</p>' +

        '<div class="ruo-flag">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l9 16H3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v5M12 16.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
          '<span>For in-vitro laboratory research only. Not a drug, food, cosmetic, or supplement. Not for human or veterinary use.</span>' +
        '</div>' +

        '<div class="pdp-buy-block">' +
          '<div class="pdp-buy-price"><strong>' + money(p.price) + '</strong><span>' + esc(p.size) + '</span></div>' +
          '<div class="pdp-buy-row">' +
            '<span class="qty-stepper qty-lg">' +
              '<button id="qtyDown" aria-label="Decrease quantity">&minus;</button>' +
              '<span id="qtyVal">1</span>' +
              '<button id="qtyUp" aria-label="Increase quantity">+</button>' +
            '</span>' +
            '<button class="btn btn-primary pdp-add" id="pdpAdd">Add to order &middot; <span id="pdpAddPrice">' + money(p.price) + '</span></button>' +
          '</div>' +
          '<div class="pdp-perks">' +
            '<div class="perk"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M7 3h8l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 3v4h4M10 12h5M10 16h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>Certificate of analysis for lot ' + esc(p.lot) + ', on request</span></div>' +
            '<div class="perk"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M3 7.2l9-4 9 4v9.6l-9 4-9-4V7.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span>Ships in 1 business day, plain tamper-evident packaging</span></div>' +
          '</div>' +
        '</div>' +

        '<h2 class="spec-head">Specification</h2>' +
        '<table class="spec-table"><tbody>' + specRows + '</tbody></table>' +

        '<div class="acc-group pdp-accs">' +
          '<div class="acc-item open">' +
            '<button class="acc-q" aria-expanded="true"><span>Description</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><p>' + esc(p.description) + '</p></div>' +
          '</div>' +
          (appItems ? '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>Research applications</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><ul class="app-list">' + appItems + '</ul></div>' +
          '</div>' : "") +
          '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>Handling &amp; storage</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><p>' + esc(p.storage) + '</p>' +
            '<p>Handle in accordance with your institution&rsquo;s chemical hygiene plan. Use appropriate personal protective equipment. Not for use in humans or animals.</p></div>' +
          '</div>' +
          '<div class="acc-item">' +
            '<button class="acc-q" aria-expanded="false"><span>Shipping &amp; returns</span><span class="acc-icon" aria-hidden="true">+</span></button>' +
            '<div class="acc-a"><p>In-stock items are dispatched within 1 business day and ship tracked in plain, tamper-evident packaging. Free shipping on orders over ' + money(FREE_SHIP) + ', otherwise a flat ' + money(SHIP_COST) + '. Unopened items may be returned within 30 days. Opened reagents cannot be returned once the seal is broken.</p></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<section class="pairs-section">' +
      '<h2>Related items</h2>' +
      '<div class="pairs-grid" id="pairsGrid"></div>' +
    '</section>';

  var qty = 1;
  var qtyVal = document.getElementById("qtyVal");

  function refresh() {
    document.getElementById("pdpAddPrice").textContent = money(Math.round(p.price * qty * 100) / 100);
    var sp = document.getElementById("stickyPrice");
    if (sp) {
      sp.textContent = money(Math.round(p.price * qty * 100) / 100);
      document.getElementById("stickyMeta").textContent = p.size + (qty > 1 ? " · ×" + qty : "");
    }
  }

  document.getElementById("qtyDown").addEventListener("click", function () {
    qty = Math.max(1, qty - 1); qtyVal.textContent = qty; refresh();
  });
  document.getElementById("qtyUp").addEventListener("click", function () {
    qty = Math.min(99, qty + 1); qtyVal.textContent = qty; refresh();
  });
  document.getElementById("pdpAdd").addEventListener("click", function () {
    addToCart(p.id, qty);
    addFeedback(document.getElementById("pdpAdd"));
  });

  initAccordions(root);

  // Sticky order bar
  var bar = document.createElement("div");
  bar.className = "sticky-buy";
  bar.innerHTML =
    '<div class="sticky-buy-inner">' +
      '<span class="sticky-thumb">' + productImg(p, true) + '</span>' +
      '<span class="sticky-info"><b>' + esc(p.name) + '</b><em id="stickyMeta">' + esc(p.size) + '</em></span>' +
      '<span class="sticky-price" id="stickyPrice">' + money(p.price) + '</span>' +
      '<button class="btn btn-primary sticky-add" id="stickyAdd">Add to order</button>' +
    '</div>';
  document.body.appendChild(bar);

  document.getElementById("stickyAdd").addEventListener("click", function () {
    addToCart(p.id, qty);
    addFeedback(document.getElementById("stickyAdd"));
  });

  if ("IntersectionObserver" in window) {
    var buyRow = root.querySelector(".pdp-buy-row");
    var barObs = new IntersectionObserver(function (entries) {
      bar.classList.toggle("show", !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
    }, { threshold: 0 });
    barObs.observe(buyRow);
  }

  refresh();

  // Related: same category first, then anything else
  var related = PRODUCTS.filter(function (o) { return o.id !== p.id && o.category === p.category; });
  PRODUCTS.forEach(function (o) {
    if (related.length >= 3 || o.id === p.id || related.indexOf(o) !== -1) return;
    related.push(o);
  });
  related = related.slice(0, 3);
  var pairsGrid = document.getElementById("pairsGrid");
  pairsGrid.innerHTML = related.map(function (o) { return productCardHTML(o); }).join("");
  bindCardAdds(pairsGrid);
}

/* ============================================================
   Checkout
   ============================================================ */

function renderOrderSummary() {
  var el = document.getElementById("orderSummary");
  var items = getCart();

  if (items.length === 0) {
    el.innerHTML = '<p class="summary-empty">Your order is empty.</p><a class="btn btn-secondary" href="shop.html">Back to catalog</a>';
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
        '<span class="summary-name">' + esc(p.name) + '<em>' + esc(p.size) + (p.lot ? " &middot; Lot " + esc(p.lot) : "") + '</em></span>' +
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
    var ack = document.getElementById("coRuo");
    if (ack && !ack.checked) { ack.focus(); form.reportValidity(); return; }
    clearCart();
    document.getElementById("checkoutMain").innerHTML =
      '<div class="order-success">' +
        '<div class="success-check" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 12.5l5 5L20 6.5" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h1>Order received.</h1>' +
        '<p>A confirmation with your lot numbers is on its way. In-stock items dispatch within 1 business day, tracked.</p>' +
        '<a class="btn btn-primary" href="shop.html">Back to catalog</a>' +
      '</div>';
    window.scrollTo({ top: 0 });
  });
}

/* ============================================================
   Boot
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  initShell();
  initGate();
  var page = document.body.getAttribute("data-page");
  if (page === "home") initHome();
  else if (page === "shop") initShop();
  else if (page === "product") initProduct();
  else if (page === "checkout") initCheckout();
  initReveal();
  initCounters();
  initMotion();
});

window.addEventListener("pageshow", function () {
  if (document.getElementById("cartCount")) renderCartUI();
});
window.addEventListener("storage", function (e) {
  if (e.key === CART_KEY && document.getElementById("cartCount")) renderCartUI();
});
