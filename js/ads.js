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
// ONCLICK TIED TO EARN BUTTON — loads ONCE, never reloaded
// ============================================================
// This ad format attaches a page-wide click listener the moment it loads,
// and that listener can't be un-attached by removing the script tag. So we
// load it exactly once (on the user's first qualifying earn click) and
// never touch it again. Actual firing frequency from here on is controlled
// by your Monetag zone's own Frequency Capping setting in the dashboard,
// not by this code.

let onclickHasLoadedThisPageview = false;

function triggerEarnClickAd() {
  if (onclickHasLoadedThisPageview) return; // already loaded once, never reload
  onclickHasLoadedThisPageview = true;
  loadOnclickAd();
}