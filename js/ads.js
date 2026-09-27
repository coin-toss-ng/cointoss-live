// ============================================================
// MONETAG IN-PAGE PUSH (BANNER) — persistent while on Home screen
// ============================================================
// Sits quietly in the page for as long as the user is actively browsing
// Home. Unloaded while on Leaderboard/Profile.

const INPAGE_ZONE = "11907055";
const INPAGE_SRC = "https://nap5k.com/tag.min.js";

let inPageScriptEl = null;

function loadInPagePush() {
  if (inPageScriptEl) return; // already active

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
  loadInPagePush(); // Home is the default active view on login, so start it immediately
}

// ============================================================
// MONETAG ONCLICK (POPUNDER) — used in two places:
// 1) Tied to the Earn Coins button (capped, see below)
// 2) Available on-demand via loadOnclickAd()/unloadOnclickAd()
// ============================================================

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";
const MAX_ONCLICK_TRIGGERS_PER_SESSION = 15;

let onclickScriptEl = null;
let onclickLoadsThisSession = 0;

function loadOnclickAd() {
  if (onclickScriptEl) return; // already active
  if (onclickLoadsThisSession >= MAX_ONCLICK_TRIGGERS_PER_SESSION) return;

  onclickScriptEl = document.createElement("script");
  onclickScriptEl.dataset.zone = ONCLICK_ZONE;
  onclickScriptEl.src = ONCLICK_SRC;
  onclickScriptEl.id = "onclick-ad-script";
  document.body.appendChild(onclickScriptEl);

  onclickLoadsThisSession += 1;
}

function unloadOnclickAd() {
  if (onclickScriptEl) {
    onclickScriptEl.remove();
    onclickScriptEl = null;
  }
}

// ============================================================
// ONCLICK TIED TO EARN BUTTON — capped, so it stays safely human-shaped
// ============================================================
const EARN_AD_MAX_PER_DAY = 5;
const EARN_AD_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function getEarnAdState() {
  const today = new Date().toDateString();
  const raw = localStorage.getItem("earnAdState");
  const state = raw ? JSON.parse(raw) : { date: today, count: 0, lastFired: 0 };
  if (state.date !== today) return { date: today, count: 0, lastFired: 0 }; // new day, reset
  return state;
}

function saveEarnAdState(state) {
  localStorage.setItem("earnAdState", JSON.stringify(state));
}

function triggerEarnClickAd() {
  const state = getEarnAdState();
  const now = Date.now();

  if (state.count >= EARN_AD_MAX_PER_DAY) return; // daily cap reached
  if (now - state.lastFired < EARN_AD_MIN_INTERVAL_MS) return; // still cooling down

  loadOnclickAd(); // catches the next click after this
  setTimeout(unloadOnclickAd, 5000); // remove shortly after so it doesn't linger for unrelated clicks

  saveEarnAdState({ date: state.date, count: state.count + 1, lastFired: now });
}