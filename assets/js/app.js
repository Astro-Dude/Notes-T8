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

  /* ---------- Listen / read-aloud (Web Speech API) ---------- */
  (function () {
    var article = document.querySelector(".article");
    if (!article || !("speechSynthesis" in window)) return;
    var synth = window.speechSynthesis;

    // Walk readable content into "units" (a highlight box + its text nodes),
    // skipping code, the TOC, pager, quizzes, images, and the player itself.
    var SKIP = { PRE: 1, SCRIPT: 1, STYLE: 1, BUTTON: 1, IMG: 1, SELECT: 1 };
    var SKIP_CLASS = ["codetabs", "toc", "pager", "hero-meta", "tts-player", "quiz"];
    var LEAF = { P: 1, LI: 1, H2: 1, H3: 1, H4: 1, FIGCAPTION: 1, TD: 1, TH: 1, SUMMARY: 1, BLOCKQUOTE: 1 };

    function skipEl(el) {
      if (SKIP[el.tagName]) return true;
      for (var i = 0; i < SKIP_CLASS.length; i++) if (el.classList.contains(SKIP_CLASS[i])) return true;
      if (el.tagName === "DETAILS") return true; // self-check quizzes
      return false;
    }
    function textNodesIn(el, acc) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var c = el.childNodes[i];
        if (c.nodeType === 3) { if (c.textContent.trim()) acc.push(c); }
        else if (c.nodeType === 1 && !skipEl(c)) textNodesIn(c, acc);
      }
      return acc;
    }
    var units = [];
    (function walk(node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = node.childNodes[i];
        if (c.nodeType === 3) {
          if (c.textContent.trim()) units.push({ box: node, nodes: [c] });
        } else if (c.nodeType === 1) {
          if (skipEl(c)) continue;
          if (LEAF[c.tagName]) {
            var ns = textNodesIn(c, []);
            if (ns.length) units.push({ box: c, nodes: ns });
          } else walk(c);
        }
      }
    })(article);
    if (!units.length) return;

    // Lazily wrap each word in a <span> and build the spoken segment queue.
    // Each segment: { box, words:[spans], text, offs:[char start of each word] }
    var queue = [], built = false;
    function buildQueue() {
      if (built) return; built = true;
      units.forEach(function (unit) {
        var spans = [];
        unit.nodes.forEach(function (tn) {
          if (!tn.parentNode) return;
          var frag = document.createDocumentFragment();
          tn.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); }
            else { var s = document.createElement("span"); s.className = "tts-w"; s.textContent = p; frag.appendChild(s); spans.push(s); }
          });
          tn.parentNode.replaceChild(frag, tn);
        });
        var i = 0;
        while (i < spans.length) {
          var words = [], text = "", offs = [];
          while (i < spans.length && words.length < 32 && text.length < 200) {
            if (text) text += " ";
            offs.push(text.length);
            text += spans[i].textContent;
            words.push(spans[i]); i++;
          }
          queue.push({ box: unit.box, words: words, text: text, offs: offs });
        }
      });
    }

    var idx = 0, playing = false, paused = false, lastEl = null, lastWord = null;
    var rate = parseFloat(localStorage.getItem("notes-tts-rate") || "1");

    // ---- UI ----
    var launch = document.createElement("button");
    launch.className = "tts-launch";
    launch.title = "Listen to this page";
    launch.setAttribute("aria-label", "Listen to this page");
    launch.textContent = "🎧";

    var player = document.createElement("div");
    player.className = "tts-player collapsed";
    player.innerHTML =
      '<button class="tts-btn primary" data-act="toggle" title="Play / pause" aria-label="Play or pause">▶︎</button>' +
      '<button class="tts-btn" data-act="prev" title="Previous" aria-label="Previous">⏮</button>' +
      '<button class="tts-btn" data-act="next" title="Next" aria-label="Next">⏭</button>' +
      '<button class="tts-btn" data-act="stop" title="Stop" aria-label="Stop">⏹</button>' +
      '<select class="tts-voice" title="Choose voice" aria-label="Choose voice"></select>' +
      '<select class="tts-speed" title="Playback speed" aria-label="Playback speed"></select>' +
      '<span class="tts-status">0%</span>' +
      '<button class="tts-btn" data-act="close" title="Hide player" aria-label="Hide">✕</button>';

    document.body.appendChild(launch);
    document.body.appendChild(player);

    var primaryBtn = player.querySelector('[data-act="toggle"]');
    var status = player.querySelector(".tts-status");
    var voiceSel = player.querySelector(".tts-voice");
    var speedSel = player.querySelector(".tts-speed");

    // populate the speed dropdown
    [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach(function (s) {
      var o = document.createElement("option");
      o.value = s; o.textContent = s + "×";
      if (s === rate) o.selected = true;
      speedSel.appendChild(o);
    });
    speedSel.addEventListener("change", function () {
      rate = parseFloat(speedSel.value);
      localStorage.setItem("notes-tts-rate", String(rate));
      if (playing && !paused) { synth.cancel(); speakCurrent(); } // apply immediately
    });
    var chosenURI = localStorage.getItem("notes-tts-voice-v2") || "";

    // Score a voice by likely quality (higher = nicer). Neural/Natural/Online win.
    function score(v) {
      var n = (v.name + " " + (v.voiceURI || "")).toLowerCase();
      var s = 0;
      if (/natural|neural/.test(n)) s += 100;
      if (/online/.test(n)) s += 60;
      if (/\bgoogle\b/.test(n)) s += 55;
      if (/premium|enhanced/.test(n)) s += 50;
      if (/siri|aria|jenny|guy|libby|sonia|ava|emma|andrew|brian/.test(n)) s += 40;
      if (/samantha|karen|moira|serena|daniel|tessa|fiona/.test(n)) s += 20;
      if (/en-us/.test((v.lang || "").toLowerCase())) s += 8;
      if (/^en/i.test(v.lang || "")) s += 5;
      if (v.localService) s += 2; // works offline
      if (/albert|fred|zarvox|bad|bells|cellos|trinoids|whisper|novelty|compact|eloquence/.test(n)) s -= 80;
      return s;
    }
    function enVoices() {
      return (synth.getVoices() || [])
        .filter(function (v) { return /^en/i.test(v.lang || ""); })
        .sort(function (a, b) { return score(b) - score(a); });
    }
    // The macOS `say` command uses the system default on-device voice.
    // The Web Speech API marks it with .default (and it is a localService voice).
    function defaultVoice() {
      var all = synth.getVoices() || [];
      var en = enVoices();
      return all.find(function (v) { return v.default && v.localService; })   // system voice (= say)
          || en.find(function (v) { return v.default; })
          || en.find(function (v) { return v.localService && /samantha|alex/i.test(v.name); })
          || en.find(function (v) { return v.localService; })
          || en[0] || all[0] || null;
    }
    // Prefer a good MALE English voice (the Web Speech API exposes no gender,
    // so we use a name heuristic). Quality order: Alex → premium/Siri male → Daniel → others.
    var MALE = /\b(alex|daniel|rishi|tom|aaron|arthur|oliver|gordon|reed|evan|nathan|ralph|rocko|eddy|jacques|thomas|fred)\b/i;
    var FEMALE = /\b(samantha|karen|moira|tessa|fiona|victoria|allison|ava|susan|kathy|vicki|nora|serena|zoe|veena|kanya|isha|sandy|grandma)\b/i;
    var NOVELTY = /bad news|good news|bahh|bells|boing|bubbles|cellos|wobble|zarvox|whisper|trinoids|organ|deranged|hysterical|albert|jester|superstar|grandpa/i;
    function maleRank(v) {
      var n = v.name.toLowerCase(), s = score(v);
      if (/\balex\b/.test(n)) s += 200;
      if (/natural|neural|premium|enhanced|siri/.test(n)) s += 120;
      if (/\b(aaron|tom|reed|evan|arthur|oliver|nathan)\b/.test(n)) s += 80;
      if (/\bdaniel\b/.test(n)) s += 60;
      if (/\brishi\b/.test(n)) s += 40;
      return s;
    }
    // A short curated shortlist — clear, high-quality voices, mixed male/female.
    // Tried in this order; only the ones actually installed are shown (max 5).
    var CURATED = [
      /\balex\b/i,                              // ♂ US — clear classic
      /\bsamantha\b/i,                          // ♀ US
      /\bdaniel\b/i,                            // ♂ UK
      /\bkaren\b/i,                             // ♀ AU
      /\b(reed|tom|aaron|evan|nathan)\b/i,      // ♂ premium / Siri
      /\bmoira\b/i,                             // ♀ IE
      /\brishi\b/i,                             // ♂ IN
      /\b(tessa|fiona|victoria|allison|ava)\b/i // ♀
    ];
    function genderOf(v) {
      if (MALE.test(v.name) && !FEMALE.test(v.name)) return " ♂";
      if (FEMALE.test(v.name)) return " ♀";
      return "";
    }
    function curatedList() {
      var en = enVoices(), out = [], seen = {};
      CURATED.forEach(function (re) {
        if (out.length >= 5) return;
        var v = en.find(function (x) { return re.test(x.name) && !seen[x.voiceURI]; });
        if (v) { out.push(v); seen[v.voiceURI] = 1; }
      });
      // top up to 5 with the best remaining non-novelty English voices
      for (var i = 0; i < en.length && out.length < 5; i++) {
        if (!seen[en[i].voiceURI] && !NOVELTY.test(en[i].name)) { out.push(en[i]); seen[en[i].voiceURI] = 1; }
      }
      // always include the user's chosen voice even if outside the shortlist
      if (chosenURI && !seen[chosenURI]) {
        var c = en.find(function (x) { return x.voiceURI === chosenURI; });
        if (c) out.unshift(c);
      }
      return out;
    }
    function preferredDefault() {
      var list = curatedList();
      return list.find(function (v) { return MALE.test(v.name) && !FEMALE.test(v.name); }) || list[0] || defaultVoice();
    }
    function pickVoice() {
      var en = enVoices();
      if (chosenURI) {
        var c = en.find(function (v) { return v.voiceURI === chosenURI; });
        if (c) return c;
      }
      return preferredDefault();
    }
    function prettyName(v) {
      return v.name.replace(/\s*\((Natural|Online|United States|United Kingdom|en-US|en-GB)\)/gi, "").trim()
        + (/natural|neural/i.test(v.name) ? " ✨" : "");
    }
    function populateVoices() {
      var list = curatedList();
      if (!list.length) return;
      var active = pickVoice();
      var activeURI = active ? active.voiceURI : "";
      voiceSel.innerHTML = list.map(function (v) {
        return '<option value="' + v.voiceURI + '"' + (v.voiceURI === activeURI ? " selected" : "") +
               ">" + prettyName(v) + genderOf(v) + "</option>";
      }).join("");
    }

    function highlight(el) {
      if (lastEl && lastEl !== el) lastEl.classList.remove("tts-reading");
      if (el) {
        el.classList.add("tts-reading");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      lastEl = el;
    }
    function highlightWord(span) {
      if (lastWord) lastWord.classList.remove("tts-w-active");
      lastWord = span || null;
      if (!span) return;
      span.classList.add("tts-w-active");
      var r = span.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 70) {
        span.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    function updateStatus() {
      status.textContent = queue.length ? Math.round((idx / queue.length) * 100) + "%" : "0%";
    }
    function setPlayingIcon() { primaryBtn.textContent = playing && !paused ? "⏸" : "▶︎"; }

    function speakCurrent() {
      if (idx >= queue.length) { stop(); return; }
      var seg = queue[idx];
      var u = new SpeechSynthesisUtterance(seg.text);
      u.rate = rate;
      var v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
      highlight(seg.box);
      highlightWord(seg.words[0]);
      updateStatus();
      u.onboundary = function (e) {
        if (e.name && e.name !== "word") return;
        var ci = e.charIndex || 0, k = 0;
        for (var j = 0; j < seg.offs.length; j++) { if (seg.offs[j] <= ci) k = j; else break; }
        highlightWord(seg.words[k]);
      };
      u.onend = function () {
        if (!playing || paused) return;
        idx++;
        speakCurrent();
      };
      synth.speak(u);
    }

    function play() {
      if (paused) { paused = false; synth.resume(); playing = true; setPlayingIcon(); return; }
      buildQueue();
      if (!queue.length) return;
      synth.cancel();
      playing = true; paused = false;
      setPlayingIcon();
      speakCurrent();
    }
    function pause() {
      paused = true; playing = true; synth.pause(); setPlayingIcon();
    }
    function stop() {
      synth.cancel(); playing = false; paused = false; idx = 0;
      highlight(null); highlightWord(null); setPlayingIcon(); updateStatus();
    }
    function jump(delta) {
      buildQueue();
      idx = Math.max(0, Math.min(queue.length - 1, idx + delta));
      synth.cancel();
      if (playing) speakCurrent();
      else { highlight(queue[idx].box); highlightWord(queue[idx].words[0]); updateStatus(); }
    }

    launch.addEventListener("click", function () {
      player.classList.remove("collapsed");
      launch.style.display = "none";
      play();
    });

    player.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]"); if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "toggle") { (playing && !paused) ? pause() : play(); }
      else if (act === "next") jump(1);
      else if (act === "prev") jump(-1);
      else if (act === "stop") stop();
      else if (act === "close") { stop(); player.classList.add("collapsed"); launch.style.display = "grid"; }
    });

    voiceSel.addEventListener("change", function () {
      chosenURI = voiceSel.value;
      localStorage.setItem("notes-tts-voice-v2", chosenURI);
      if (playing && !paused) { synth.cancel(); speakCurrent(); } // apply immediately
    });

    // voices may load late (esp. Chrome/Edge online voices)
    populateVoices();
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = populateVoices;
    // stop audio when leaving the page
    window.addEventListener("pagehide", function () { synth.cancel(); });
    window.addEventListener("beforeunload", function () { synth.cancel(); });
  })();
})();
