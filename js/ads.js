// ============================================================
// MONETAG VIGNETTE BANNER — loaded/unloaded on a timed cycle
// ============================================================
// Since Vignette Banner is a self-managing script (Monetag controls its
// own internal trigger logic), we can't pause it mid-flight. What we CAN
// control is whether the script exists on the page at all. So: load it
// for an "active window", then physically remove it for a "rest window",
// on repeat. This keeps ad exposure bursty-but-capped instead of constant.
// ============================================================

const VIGNETTE_ZONE = "11906756"; // from your Monetag zone
const VIGNETTE_SRC = "https://n6wxm.com/vignette.min.js";

const ACTIVE_WINDOW_SECONDS = 25;   // how long the script is allowed to be live
const REST_WINDOW_MIN = 60;         // minimum rest before it's allowed back
const REST_WINDOW_MAX = 90;         // maximum rest (randomized so it's not robotic)
const GRACE_PERIOD_ON_LOAD = 20;    // don't load any ad script in the first N seconds of a session
const MAX_CYCLES_PER_SESSION = 10;  // hard cap so a long session can't over-serve

let scriptEl = null;
let cycleTimer = null;
let cyclesRun = 0;

function loadVignette() {
  if (scriptEl) return; // already loaded, don't double-insert

  scriptEl = document.createElement("script");
  scriptEl.dataset.zone = VIGNETTE_ZONE;
  scriptEl.src = VIGNETTE_SRC;
  scriptEl.id = "vignette-ad-script";
  document.body.appendChild(scriptEl);

  cyclesRun += 1;

  // after the active window, tear it down and schedule the next rest+active cycle
  cycleTimer = setTimeout(unloadVignette, ACTIVE_WINDOW_SECONDS * 1000);
}

function unloadVignette() {
  if (scriptEl) {
    scriptEl.remove();
    scriptEl = null;
  }

  if (cyclesRun >= MAX_CYCLES_PER_SESSION) return; // done for this session

  const restSeconds =
    REST_WINDOW_MIN + Math.random() * (REST_WINDOW_MAX - REST_WINDOW_MIN);

  clearTimeout(cycleTimer);
  cycleTimer = setTimeout(loadVignette, restSeconds * 1000);
}

function initAds() {
  loadInPagePush(); // Home is the default active view on login, so start it immediately
  // Vignette disabled for now — moving ad focus to OnClick, which is the only format actually paying
}

// Pause the cycle while the tab is hidden — don't burn ad slots on a
// backgrounded tab, and don't resume until the user is actually back.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimeout(cycleTimer);
    if (scriptEl) {
      scriptEl.remove();
      scriptEl = null;
    }
  } else if (!scriptEl && cyclesRun < MAX_CYCLES_PER_SESSION) {
    clearTimeout(cycleTimer);
    cycleTimer = setTimeout(loadVignette, 5000);
  }
});

// ============================================================
// MONETAG ONCLICK (POPUNDER) — only live on Leaderboard & Profile
// ============================================================
// OnClick fires on the NEXT click anywhere on the page after it loads, and
// keeps listening once loaded. To keep it away from the Earn Coins button
// entirely, we only ever insert this script while the user is actually on
// the Leaderboard or Profile screen, and rip it out the instant they leave.
// It is NEVER present while home-view (with the Earn button) is active.

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
// MONETAG IN-PAGE PUSH (BANNER) — persistent while on Home screen
// ============================================================
// Unlike Vignette/OnClick, this format is meant to sit quietly in the page
// for as long as the user is actively browsing — not fire-and-remove. We
// scope it to the Home screen (where Earn Coins lives) since that's where
// you want it, matching Vignette. It's unloaded on Leaderboard/Profile so
// it doesn't stack with the OnClick ad running there.

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
