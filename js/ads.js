// ============================================================
// MONETAG IN-PAGE PUSH (BANNER) — persistent while on Home screen
// ============================================================
const INPAGE_ZONE = "11907055";
const INPAGE_SRC = "https://nap5k.com/tag.min.js";

let inPageScriptEl = null;

function loadInPagePush() {
  if (inPageScriptEl) return;
  inPageScriptEl = document.createElement("script");
  inPageScriptEl.dataset.zone = INPAGE_ZONE;
  inPageScriptEl.src = INPAGE_SRC;
  inPageScriptEl.id = "inpage-push-script";
  document.body.appendChild(inPageScriptEl);
}

function unloadInPagePush() {
  if (inPageScriptEl) {
    inPageScriptEl.remove();
    inPageScriptEl = null;
  }
}

// ============================================================
// MONETAG ONCLICK — HARD DAILY CAP ON ACTUAL POPUPS, REGARDLESS OF TRIGGER
// ============================================================
// This script doesn't reliably respect being "armed" only after an earn
// click — it opens windows on its own timing too. So instead of trying to
// control WHEN it's allowed to fire, we count every real popup that
// actually succeeds, at every way it can open one (window.open, a
// simulated click on a target="_blank" link, or calling .click() directly
// on such a link even if it's not attached to the page). Once 5 have
// happened today, everything is blocked, full stop, no matter what
// triggered it. A minimum interval between opens is enforced the same way,
// so even the first 5 can't all fire in the first few seconds.

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const MAX_OPENS_PER_DAY = 5;
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function getOpenState() {
  const today = new Date().toDateString();
  const raw = localStorage.getItem("adOpenState");
  const state = raw ? JSON.parse(raw) : { date: today, count: 0, lastOpen: 0 };
  if (state.date !== today) return { date: today, count: 0, lastOpen: 0 }; // new day, reset
  return state;
}

function saveOpenState(state) {
  localStorage.setItem("adOpenState", JSON.stringify(state));
}

// Returns true if this open is allowed (and records it). Returns false if
// it should be blocked — either the daily cap or the interval hasn't passed.
function allowOpenAndRecord() {
  const state = getOpenState();
  const now = Date.now();

  if (state.count >= MAX_OPENS_PER_DAY) return false;
  if (now - state.lastOpen < MIN_INTERVAL_MS) return false;

  saveOpenState({ date: state.date, count: state.count + 1, lastOpen: now });
  return true;
}

// Layer 1 — window.open()
const originalWindowOpen = window.open;
window.open = function (...args) {
  if (allowOpenAndRecord()) return originalWindowOpen.apply(window, args);
  return null;
};

// Layer 2 — simulated clicks (real or script-dispatched) on <a target="_blank">,
// caught in the capture phase, before the ad script's own handling runs.
document.addEventListener(
  "click",
  function (e) {
    const link = e.target && e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (link && !allowOpenAndRecord()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },
  true
);

// Layer 3 — the .click() method itself, in case the element is never
// attached to the document (which would skip the capture listener above).
const originalAnchorClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function (...args) {
  if (this.target === "_blank" && !allowOpenAndRecord()) return; // blocked
  return originalAnchorClick.apply(this, args);
};

let onclickLoaded = false;
function loadOnclickAd() {
  if (onclickLoaded) return;
  onclickLoaded = true;

  const s = document.createElement("script");
  s.dataset.zone = ONCLICK_ZONE;
  s.src = ONCLICK_SRC;
  s.id = "onclick-ad-script";
  document.body.appendChild(s);
}

function unloadOnclickAd() {}

// The earn button no longer needs to "arm" anything — the cap above applies
// globally and automatically. We just make sure the script is loaded.
function triggerEarnClickAd() {
  loadOnclickAd();
}

function initAds() {
  loadInPagePush();
  loadOnclickAd(); // load once at login; the cap above governs everything from here
}