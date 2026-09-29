// ============================================================
// MONETAG IN-PAGE PUSH (BANNER) — Home screen
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

function initAds() {
  loadInPagePush();
}

// ============================================================
// MONETAG ONCLICK — tied to Earn Coins, capped at 5/day, 3 min apart
// ============================================================
const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const EARN_AD_MAX_PER_DAY = 5;
const EARN_AD_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

let onclickLoaded = false;
function loadOnclickAd() {
  if (onclickLoaded) return; // loads once, ever
  onclickLoaded = true;

  const s = document.createElement("script");
  s.dataset.zone = ONCLICK_ZONE;
  s.src = ONCLICK_SRC;
  s.id = "onclick-ad-script";
  document.body.appendChild(s);
}

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

  saveEarnAdState({ date: state.date, count: state.count + 1, lastFired: now });
}