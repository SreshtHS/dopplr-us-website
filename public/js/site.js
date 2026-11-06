/* Dopplr site: GA4 events for every CTA click, demo booking and email click. */
(function () {
  // ── Settings ─────────────────────────────────────────────
  var GA_ID = "";            // GA4 measurement ID, e.g. "G-XXXXXXXXXX". Empty = analytics off (events still queue in dataLayer).

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
})();
