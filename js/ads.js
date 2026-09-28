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
// MONETAG ONCLICK — GATED
// ============================================================
// The OnClick script attaches its own listeners to document/window and we
// can't remove them. So: while the script is loading, we wrap every click-type
// listener IT registers so it only runs when our gate is open. Your app's own
// button handlers are never touched.

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const EARN_AD_MAX_PER_DAY = 5;
const EARN_AD_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const GATE_WINDOW_MS = 800; // covers mousedown/mouseup/click of ONE tap

const GATED_EVENTS = ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend"];

let onclickLoaded = false;
let gateArmed = false;      // set true when an ad trigger has been earned
let gateOpenUntil = 0;      // timestamp; handlers may run until this time

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

function loadOnclickAd() {
  if (onclickLoaded) return; // load once, ever
  onclickLoaded = true;

  const original = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (type, handler, options) {
    const isPageLevel =
      this === document || this === window || this === document.documentElement || this === document.body;

    if (isPageLevel && GATED_EVENTS.includes(type) && typeof handler === "function") {
      const gated = function (e) {
        if (gateAllows()) return handler.call(this, e);
        // otherwise: swallow silently
      };
      return original.call(this, type, gated, options);
    }
    return original.call(this, type, handler, options);
  };

  const restore = () => {
    EventTarget.prototype.addEventListener = original;
  };

  const s = document.createElement("script");
  s.dataset.zone = ONCLICK_ZONE;
  s.src = ONCLICK_SRC;
  s.id = "onclick-ad-script";
  s.onload = () => setTimeout(restore, 500); // let the script finish registering
  s.onerror = restore;
  document.body.appendChild(s);
}

// kept so auth.js's logout call doesn't break; intentionally does nothing
function unloadOnclickAd() {}

// ---------- daily cap + interval (enforced by us, via the gate) ----------
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
  gateArmed = true;  // the NEXT tap is allowed through to the ad, then it shuts

  saveEarnAdState({ date: state.date, count: state.count + 1, lastFired: now });
}