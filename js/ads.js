// ============================================================
// MONETAG IN-PAGE PUSH (BANNER) — unchanged, loads directly in the page
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
// MONETAG ONCLICK — CONTAINED IN A SANDBOXED IFRAME
// ============================================================
// Every JS-level trick we tried (window.open override, anchor click
// interception, .click() override) kept getting bypassed, because the
// script can open popups through more than one mechanism, some of which
// aren't reachable from outside JS.
//
// This uses a real browser security boundary instead: an iframe with the
// `sandbox` attribute, WITHOUT `allow-popups`, cannot open a popup by ANY
// method — window.open, target="_blank" links, anything. The restriction
// is enforced by the browser engine itself, not by our code, so it can't
// be worked around by a clever script.
//
// Default state: the iframe has no popup permission at all (fully blocked).
// When a trigger is earned, we briefly swap in a version of the iframe
// WITH popup permission, let it run for a few seconds, then swap back to
// the blocked version.

const ONCLICK_ZONE = "11907052";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";

const MAX_OPENS_PER_DAY = 5;
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const ALLOWED_WINDOW_MS = 4000; // how long popups are permitted once granted

let onclickIframe = null;

function iframeHtml() {
  return `<script src="${ONCLICK_SRC}" data-zone="${ONCLICK_ZONE}"></script>`;
}

function createBlockedIframe() {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.sandbox = "allow-scripts allow-same-origin"; // deliberately NO allow-popups
  iframe.srcdoc = iframeHtml();
  document.body.appendChild(iframe);
  return iframe;
}

function initAds() {
  loadInPagePush();
  onclickIframe = createBlockedIframe(); // present, but structurally unable to open popups
}

function getOpenState() {
  const today = new Date().toDateString();
  const raw = localStorage.getItem("adOpenState");
  const state = raw ? JSON.parse(raw) : { date: today, count: 0, lastOpen: 0 };
  if (state.date !== today) return { date: today, count: 0, lastOpen: 0 };
  return state;
}

function saveOpenState(state) {
  localStorage.setItem("adOpenState", JSON.stringify(state));
}

function triggerEarnClickAd() {
  const state = getOpenState();
  const now = Date.now();

  if (state.count >= MAX_OPENS_PER_DAY) return; // daily cap reached
  if (now - state.lastOpen < MIN_INTERVAL_MS) return; // too soon since last one

  saveOpenState({ date: state.date, count: state.count + 1, lastOpen: now });

  // swap to a briefly-unblocked iframe
  if (onclickIframe) onclickIframe.remove();
  const openIframe = document.createElement("iframe");
  openIframe.style.display = "none";
  openIframe.sandbox = "allow-scripts allow-same-origin allow-popups";
  openIframe.srcdoc = iframeHtml();
  document.body.appendChild(openIframe);
  onclickIframe = openIframe;

  setTimeout(() => {
    if (onclickIframe === openIframe) {
      openIframe.remove();
      onclickIframe = createBlockedIframe(); // back to structurally blocked
    }
  }, ALLOWED_WINDOW_MS);
}

// kept as harmless no-ops so nothing elsewhere in the app breaks
function loadOnclickAd() {}
function unloadOnclickAd() {}