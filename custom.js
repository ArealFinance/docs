// Auto-resize embedded widget iframes (.wfr) to their content height.
// Each widget posts { type: "wf-height", height } via postMessage.
window.addEventListener("message", function (e) {
  var d = e.data;
  if (!d || d.type !== "wf-height" || !d.height) return;
  var frames = document.querySelectorAll("iframe.wfr");
  for (var i = 0; i < frames.length; i++) {
    if (frames[i].contentWindow === e.source) {
      frames[i].style.height = d.height + "px";
      break;
    }
  }
});

// Live RWT / stRWT price ticker injected into the navbar (next to Launch App).
// RWT price = Book NAV (EarnConfig capital / RWT supply); stRWT price = rate x NAV.
(function () {
  var RPCS = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
  var rpcIdx = 0;
  var EARN = "5GyVeryGnTPPtfteYaj5pNUjE9s2DDDpDnccgoFjV8L3"; // EarnConfig PDA
  var RWT = "RWTeFt9M635Tf6w6yveAoXQR2ZwfXs7MfA7W3grDuGT";
  var STRWT = "sRWTy1bkqvRegb31RETanhbAtJ7eXN6XsTvaqBRh6kA";
  var CFG = "EwXST2yoQRBf3FEYe6fyoseatHaVypYck3ZQ5bEGzEUe"; // StakingConfig PDA (rate counters)
  var ACTIVE_OFFSET = 201; // total_rwt_active (u64 LE) — rate numerator (not vault balance)
  var last = { rwt: null, st: null };

  function rpc(method, params) {
    var body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params });
    function tryAt(k) {
      var i = (rpcIdx + k) % RPCS.length;
      return fetch(RPCS[i], { method: "POST", headers: { "Content-Type": "application/json" }, body: body })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { if (j.error) throw 0; rpcIdx = i; return j; })
        .catch(function (e) { if (k + 1 < RPCS.length) return tryAt(k + 1); throw e; });
    }
    return tryAt(0);
  }

  function fmt(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function header() {
    return document.getElementById("navbar") || document.querySelector("header") || document.querySelector("nav");
  }
  function findTab() {
    var nav = header();
    if (!nav) return null;
    var els = nav.querySelectorAll("a, button");
    for (var i = 0; i < els.length; i++) {
      if (els[i].textContent.trim() === "Documentation") {
        var r = els[i].getBoundingClientRect();
        if (r.width > 0) return els[i];
      }
    }
    return null;
  }
  function findLogo() {
    var nav = header();
    if (!nav) return null;
    var ls = nav.querySelectorAll("a");
    for (var i = 0; i < ls.length; i++) {
      if (ls[i].querySelector("img,svg")) {
        var r = ls[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return ls[i]; // skip hidden duplicates
      }
    }
    return null;
  }

  function injectTicker() {
    if (document.getElementById("rwt-ticker")) return false; // already present
    if (!header()) return false;
    var t = document.createElement("div");
    t.id = "rwt-ticker";
    t.className = "rwt-ticker";
    t.innerHTML =
      '<a class="tk" href="/how-it-works/rwt" title="RWT — Book NAV"><img src="/images/rwt.png" alt="" /><span class="tk-sym">RWT</span><span class="tk-px" id="tk-rwt">' + (last.rwt != null ? fmt(last.rwt) : "$—") + '</span></a>' +
      '<a class="tk" href="/how-it-works/strwt" title="stRWT price"><img src="/images/strwt.png" alt="" /><span class="tk-sym">stRWT</span><span class="tk-px" id="tk-strwt">' + (last.st != null ? fmt(last.st) : "$—") + '</span></a>';
    document.body.appendChild(t); // fixed; positioned relative to the navbar at runtime
    positionTicker();
    return true;
  }

  // Position the fixed ticker, anchored to the logo (reliable geometry).
  // Tabs present (desktop) -> left of the Documentation tab; otherwise (mobile menu)
  // -> centered in the free zone between the logo and the search/menu icons.
  function positionTicker() {
    var t = document.getElementById("rwt-ticker");
    if (!t) return;
    var hdr = header();
    if (!hdr) { t.style.display = "none"; return; }
    var hr = hdr.getBoundingClientRect();
    if (hr.height < 20) return; // header not laid out yet — keep current state, avoid flicker
    var tab = findTab();
    t.classList.toggle("compact", !tab); // compact when the navbar is in mobile (menu) mode
    t.style.display = "flex";
    t.style.visibility = "hidden";
    var tw = t.getBoundingClientRect().width;
    var logo = findLogo();
    var lr = logo ? logo.getBoundingClientRect() : null;
    // Vertical: center on the logo if present, else the top row of the header.
    var top = lr ? (lr.top + lr.height / 2) : (hr.top + Math.min(hr.height, 72) / 2);
    var leftBound = (lr ? lr.right : hr.left + 12) + 10;
    var left;
    if (tab) {
      var dr = tab.getBoundingClientRect();
      left = dr.left - 20 - tw;
      if (left < leftBound + 6) { t.style.display = "none"; t.style.visibility = ""; return; } // no room
    } else {
      // mobile: left-aligned right after the logo (compact); hide only if it reaches the icons
      left = leftBound;
      if (left + tw > window.innerWidth - 88) { t.style.display = "none"; t.style.visibility = ""; return; }
    }
    t.style.left = left + "px";
    t.style.top = top + "px";
    t.style.visibility = "";
  }

  function update() {
    Promise.all([
      rpc("getAccountInfo", [EARN, { encoding: "base64" }]),
      rpc("getTokenSupply", [RWT]),
      rpc("getAccountInfo", [CFG, { encoding: "base64" }]),
      rpc("getTokenSupply", [STRWT]),
    ]).then(function (res) {
      var bin = atob(res[0].result.value.data[0]);
      var capital = 0n;
      for (var i = 0; i < 16; i++) capital += BigInt(bin.charCodeAt(8 + i)) << (8n * BigInt(i));
      var rwtSupply = Number(res[1].result.value.amount);
      var nav = rwtSupply === 0 ? 1 : Number(capital) / rwtSupply;
      var cfgBin = atob(res[2].result.value.data[0]);
      var active = 0n; // total_rwt_active (u64 LE) — excludes cooldown reserve
      for (var j = 0; j < 8; j++) active += BigInt(cfgBin.charCodeAt(ACTIVE_OFFSET + j)) << (8n * BigInt(j));
      var stSupply = Number(res[3].result.value.amount);
      var rate = (Number(active) + 1e7) / (stSupply + 1e6);
      last.rwt = nav; last.st = rate * nav;
      var er = document.getElementById("tk-rwt"), es = document.getElementById("tk-strwt");
      if (er) er.textContent = fmt(last.rwt);
      if (es) es.textContent = fmt(last.st);
    }).catch(function () {});
  }

  if (document.readyState !== "loading") { injectTicker(); update(); }
  else document.addEventListener("DOMContentLoaded", function () { injectTicker(); update(); });
  // Re-inject instantly when the SPA re-renders the navbar (avoids flicker).
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (!document.getElementById("rwt-ticker")) { if (injectTicker()) update(); }
      else positionTicker();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  setInterval(function () { if (injectTicker()) update(); positionTicker(); }, 1500); // backup
  setInterval(update, 30000);
  window.addEventListener("resize", positionTicker);
  window.addEventListener("scroll", positionTicker, { passive: true });
})();
