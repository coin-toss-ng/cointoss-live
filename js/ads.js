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

function initAds() {
  loadInPagePush();
}

// ============================================================
// MONETAG ONCLICK — GATED (window.open AND simulated anchor clicks)
// ============================================================
// This script doesn't only use window.open() — it also opens new tabs by
// creating a hidden <a target="_blank"> and simulating a click on it,
// which completely bypasses a window.open override. So we gate BOTH:
// 1) window.open() calls directly
// 2) any click (real or script-simulated) on an <a target="_blank">,
//    caught via a permanent capture-phase listener on document, which
//    fires before the ad script's own handling and can cancel it outright.

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const EARN_AD_MAX_PER_DAY = 5;
const EARN_AD_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const GATE_WINDOW_MS = 2000;

let onclickLoaded = false;
let gateArmed = false;
let gateOpenUntil = 0;

function gateAllows() {
  const now = Date.now();
  if (now < gateOpenUntil) return true;
  if (gateArmed) {
    gateArmed = false;
    gateOpenUntil = now + GATE_WINDOW_MS;
    return true;
  }
  return false;
}

// Layer 1 — window.open()
const originalWindowOpen = window.open;
window.open = function (...args) {
  if (gateAllows()) return originalWindowOpen.apply(window, args);
  return null;
};

// Layer 2 — simulated clicks on <a target="_blank">, real or script-dispatched.
// Capture phase runs before the ad script's own handling, and preventDefault()
// on a click event cancels the link's default navigation regardless of
// whether a real user or a script triggered it.
document.addEventListener(
  "click",
  function (e) {
    const link = e.target && e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (link && !gateAllows()) {
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
  if (this.target === "_blank" && !gateAllows()) return; // blocked
  return originalAnchorClick.apply(this, args);
};

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

// ---------- daily cap + interval ----------
function getEarnAdState() {
  const today = new Date().toDateString();
  const raw = localStorage.getItem("earnAdState");
  const state = raw ? JSON.parse(raw) : { date: today, count: 0, lastFired: 0 };
  if (state.date !== today) return { date: today, count: 0, lastFired: 0 };
  return state;
}

function saveEarnAdState(state) {
  localStorage.setItem("earnAdState", JSON.stringify(state));
}

function triggerEarnClickAd() {
  const state = getEarnAdState();
  const now = Date.now();

  if (state.count >= EARN_AD_MAX_PER_DAY) return;
  if (now - state.lastFired < EARN_AD_MIN_INTERVAL_MS) return;

  loadOnclickAd();
  gateArmed = true;

  saveEarnAdState({ date: state.date, count: state.count + 1, lastFired: now });
}