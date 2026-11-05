/* Dopplr site: GA4 events for every CTA, demo booking and audit-form step, plus the free fit audit form. */
(function () {
  // ── Settings ─────────────────────────────────────────────
  var GA_ID = "";            // GA4 measurement ID, e.g. "G-XXXXXXXXXX". Empty = analytics off (events still queue in dataLayer).
  var FORM_ENDPOINT = "";    // Form backend URL, e.g. "https://formspree.io/f/xxxxxxx". Empty = falls back to a pre-filled email.
  var AUDIT_EMAIL = "sresht@highstreet3d.co";

  // ── GA4 ──────────────────────────────────────────────────
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (GA_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }
  var page = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index";
  function where(el) { var s = el.closest("section,header,footer"); return s ? (s.id || s.tagName.toLowerCase()) : "page"; }
  function track(name, params) {
    params = params || {};
    params.page = page;
    try { window.gtag("event", name, params); } catch (e) { /* analytics must never break the page */ }
  }

  // Every link/button click that matters, tracked once at the document level.
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a,button");
    if (!a || a.type === "submit") return;
    var href = a.getAttribute("href") || "";
    var label = (a.dataset.cta || a.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (/calendar\.app\.google|calendly\.com|cal\.com/.test(href)) {
      track("demo_booking_click", { cta: label, location: where(a) });
    } else if (/^mailto:/.test(href)) {
      track("email_click", { location: where(a) });
    } else if (a.classList.contains("btn") || a.classList.contains("link-cta") || a.dataset.cta) {
      track("cta_click", { cta: label, location: where(a), destination: href });
    }
  });

  // ── Free fit audit form ──────────────────────────────────
  function normaliseStore(v) {
    v = v.trim();
    if (!v) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try { var u = new URL(v); return u.hostname.indexOf(".") > 0 ? u.origin : ""; } catch (e) { return ""; }
  }

  document.querySelectorAll("form[data-audit-form]").forEach(function (f) {
    var msg = f.querySelector(".af-msg");
    var btn = f.querySelector("button[type=submit]");
    var started = false;
    function say(text, kind) { msg.textContent = text; msg.className = "af-msg " + (kind || ""); }

    f.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      track("audit_form_start", { location: where(f) });
    });

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (f.company && f.company.value) return; // honeypot: bots fill hidden fields
      var store = normaliseStore(f.store.value);
      var email = f.email.value.trim();
      var category = f.category ? f.category.value : "";
      if (!store) { say("Enter your store's web address, e.g. yourbrand.com.", "err"); f.store.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Enter a valid work email.", "err"); f.email.focus(); return; }

      var data = { store: store, email: email, category: category, page: page, location: where(f) };
      track("audit_form_submit", { location: where(f), category: category });

      function success(via) {
        f.classList.add("sent");
        say(via === "email"
          ? "Your email app has opened with your request. Hit send and we'll take it from there."
          : "Got it. We'll review your product pages and email your fit audit to " + email + ".", "ok");
        track("generate_lead", { location: where(f), category: category, method: via });
      }

      if (!FORM_ENDPOINT) {
        var body = "Store: " + store + "\nCategory: " + category + "\nEmail: " + email + "\n\nSent from dopplr.info (" + page + ")";
        location.href = "mailto:" + AUDIT_EMAIL + "?subject=" + encodeURIComponent("Free fit audit: " + store) + "&body=" + encodeURIComponent(body);
        success("email");
        return;
      }
      btn.disabled = true;
      say("Sending…");
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        success("form");
      }).catch(function () {
        btn.disabled = false;
        say("That didn't go through. Email us at " + AUDIT_EMAIL + " and we'll run your audit.", "err");
        track("audit_form_error", { location: where(f) });
      });
    });
  });
})();
