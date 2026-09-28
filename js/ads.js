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
  // loadInPagePush(); // temporarily disabled to test whether this is the source of repeated popups
}

// ============================================================
// MONETAG ONCLICK — GATED AT THE SOURCE (window.open)
// ============================================================
// Instead of guessing how the script detects a click (addEventListener,
// onclick property, polling, etc. — we can't be sure), we gate the one
// thing every popunder MUST do to actually work: call window.open(). If
// the gate isn't open, the call is simply blocked and nothing happens.
// This is robust regardless of how the script decides WHEN to try.

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const EARN_AD_MAX_PER_DAY = 5;
const EARN_AD_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const GATE_WINDOW_MS = 2000; // small window to allow the actual open() call through

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

// Gate window.open permanently, from page load — regardless of whether the
// onclick script has loaded yet. Harmless to anything else that legitimately
// calls window.open, since the gate is only ever open right after a real
// earn-click has earned a trigger.
const originalWindowOpen = window.open;
window.open = function (...args) {
  if (gateAllows()) {
    return originalWindowOpen.apply(window, args);
  }
  return null; // blocked — gate closed
};

function loadOnclickAd() {
  if (onclickLoaded) return; // load once, ever
  onclickLoaded = true;

  const s = document.createElement("script");
  s.dataset.zone = ONCLICK_ZONE;
  s.src = ONCLICK_SRC;
  s.id = "onclick-ad-script";
  document.body.appendChild(s);
}

// kept so auth.js's logout call doesn't break; intentionally does nothing
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

  loadOnclickAd();   // no-op after the first time
  gateArmed = true;  // the next window.open() call is allowed through, then it shuts

  saveEarnAdState({ date: state.date, count: state.count + 1, lastFired: now });
}