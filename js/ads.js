// ============================================================
// MONETAG INTERSTITIAL — timed, independent of the earn-click cooldown
// ============================================================
// SETUP:
// 1. In your Monetag dashboard, create an "Interstitial" zone.
// 2. Monetag will give you a script snippet that looks like:
//      <script src="//libtl.com/sdk.js" data-zone="XXXXXXX" data-sdk="show_XXXXXXX"></script>
//    Paste that snippet into index.html's <head> (there's a marked spot for it).
// 3. Replace SHOW_FUNCTION_NAME below with the exact function name Monetag gave you
//    (it's the same string as the data-sdk value, e.g. "show_9161234").
// ============================================================

const SHOW_FUNCTION_NAME = "show_9161234"; // <-- replace with your real Monetag function name

// ---- Tunable settings ----
const MIN_SECONDS_BETWEEN_ADS = 75;   // floor: never show more often than this
const MAX_SECONDS_BETWEEN_ADS = 120;  // ceiling: randomized so timing isn't robotic
const GRACE_PERIOD_ON_LOAD = 20;      // don't show an ad in the first N seconds of a session
const MAX_ADS_PER_SESSION = 12;       // hard cap so one long session can't over-serve
const COOLDOWN_BUFFER_SECONDS = 2;    // never show while the earn-click cooldown is active

let adsShownThisSession = 0;
let adTimer = null;

function scheduleNextAd() {
  if (adsShownThisSession >= MAX_ADS_PER_SESSION) return; // stop for the rest of this session

  const delaySeconds =
    MIN_SECONDS_BETWEEN_ADS + Math.random() * (MAX_SECONDS_BETWEEN_ADS - MIN_SECONDS_BETWEEN_ADS);

  clearTimeout(adTimer);
  adTimer = setTimeout(tryShowAd, delaySeconds * 1000);
}

function tryShowAd() {
  // Skip if the earn-click cooldown is actively running — keeps the ad from ever
  // feeling tied to the click itself, which is what we want to avoid.
  const earnBtn = document.getElementById("earn-btn");
  if (earnBtn && earnBtn.disabled) {
    // cooldown in progress — try again shortly instead of skipping the slot entirely
    adTimer = setTimeout(tryShowAd, COOLDOWN_BUFFER_SECONDS * 1000);
    return;
  }

  // Skip if the tab isn't visible — showing ads to a backgrounded tab wastes the
  // slot and looks like a fraudulent impression to the ad network.
  if (document.hidden) {
    adTimer = setTimeout(tryShowAd, 5000);
    return;
  }

  const showFn = window[SHOW_FUNCTION_NAME];
  if (typeof showFn === "function") {
    showFn()
      .then(() => {
        adsShownThisSession += 1;
        scheduleNextAd();
      })
      .catch(() => {
        // ad failed to load / was skipped by the network — still move on
        scheduleNextAd();
      });
  } else {
    // SDK not loaded yet (e.g. ad blocker, slow network) — retry later
    adTimer = setTimeout(tryShowAd, 10000);
  }
}

function initAds() {
  adsShownThisSession = 0;
  clearTimeout(adTimer);
  adTimer = setTimeout(scheduleNextAd, GRACE_PERIOD_ON_LOAD * 1000);
}

// Pause the whole cycle if the user leaves the tab, resume cleanly when they come back
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !adTimer) {
    scheduleNextAd();
  }
});
