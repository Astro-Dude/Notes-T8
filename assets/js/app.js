/* ============================================================
   Study Notes — Shared JS
   - Theme toggle (persisted)
   - Reading progress bar
   - Active TOC highlighting via IntersectionObserver
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var saved = localStorage.getItem("notes-theme");
  if (saved) root.setAttribute("data-theme", saved);

  function toggleTheme() {
    var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", cur);
    localStorage.setItem("notes-theme", cur);
    syncThemeIcon();
  }
  function syncThemeIcon() {
    var btn = document.getElementById("theme-btn");
    if (btn) btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  }

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "theme-btn") toggleTheme();
  });

  /* ---------- Multi-language code tabs ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".codetab") : null;
    if (!btn) return;
    var wrap = btn.closest(".codetabs");
    if (!wrap) return;
    var lang = btn.getAttribute("data-lang");
    var i;
    var tabs = wrap.querySelectorAll(".codetab");
    for (i = 0; i < tabs.length; i++) tabs[i].classList.toggle("active", tabs[i] === btn);
    var panes = wrap.querySelectorAll(".codepane");
    for (i = 0; i < panes.length; i++) panes[i].classList.toggle("active", panes[i].getAttribute("data-lang") === lang);
  });

  /* ---------- Reading progress ---------- */
  var bar = document.getElementById("progress");
  if (bar) {
    window.addEventListener("scroll", function () {
      var h = document.documentElement;
      var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      bar.style.width = Math.min(100, Math.max(0, scrolled * 100)) + "%";
    }, { passive: true });
  }

  /* ---------- Active TOC ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (tocLinks.length) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      map[id] = a;
    });
    var sections = document.querySelectorAll(".article > section[id]");
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove("active"); });
          var link = map[en.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-80px 0px -65% 0px", threshold: 0 });
    sections.forEach(function (s) { obs.observe(s); });
  }

  document.addEventListener("DOMContentLoaded", syncThemeIcon);
  syncThemeIcon();
})();
