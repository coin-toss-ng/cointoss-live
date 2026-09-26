let currentUser = null;
let cooldownInterval = null;

window.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    loadApp();
  }
});

async function loadApp() {
  try {
    const data = await apiRequest("/user/me");
    currentUser = data.user;

    document.getElementById("auth-screen").classList.remove("active");
    document.getElementById("app-screen").classList.add("active");

    renderHome();
    loadMessages();
    loadLeaderboard();
    renderProfile();
    initAds(); // start the timed interstitial cycle now that the user is in the app
  } catch (e) {
    clearToken();
    document.getElementById("app-screen").classList.remove("active");
    document.getElementById("auth-screen").classList.add("active");
  }
}

function switchView(viewId, btn) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
  btn.classList.add("active");

  if (viewId === "leaderboard-view") loadLeaderboard();
  if (viewId === "profile-view") renderProfile();
}

function renderHome() {
  document.getElementById("card-username").textContent = currentUser.username;
  document.getElementById("card-coins").textContent = currentUser.coins;
  document.getElementById("card-rank").textContent = currentUser.rank;
  applyCooldownState();
}

function renderProfile() {
  document.getElementById("profile-username").value = currentUser.username;
  document.getElementById("profile-rank").textContent = currentUser.rank;
  document.getElementById("profile-lifetime").textContent = currentUser.lifetime_coins;
  document.getElementById("profile-coins").textContent = currentUser.coins;
  document.getElementById("referral-code").textContent = currentUser.referral_code;
}

async function loadMessages() {
  try {
    const data = await apiRequest("/messages");
    const list = document.getElementById("message-list");
    if (!data.messages.length) {
      list.innerHTML = '<p class="empty-text">No messages yet.</p>';
      return;
    }
    list.innerHTML = data.messages
      .map(
        (m) => `
      <div class="message-item">
        <div>${escapeHtml(m.content)}</div>
        <div class="msg-date">${new Date(m.created_at).toLocaleString()}</div>
      </div>`
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

async function loadLeaderboard() {
  try {
    const data = await apiRequest("/leaderboard");
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = data.leaderboard
      .map(
        (u, i) => `
      <div class="leaderboard-item ${u.username === currentUser.username ? "me" : ""}">
        <span class="rank-num">#${i + 1}</span>
        <span class="lb-name">${escapeHtml(u.username)} <small style="color:var(--text-dim)">(${u.rank})</small></span>
        <span class="lb-coins">${u.coins}</span>
      </div>`
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

async function handleEarnClick() {
  const btn = document.getElementById("earn-btn");
  try {
    const data = await apiRequest("/coins/earn", { method: "POST" });
    currentUser.coins = data.coins;
    currentUser.lifetime_coins = data.lifetime_coins;
    currentUser.rank = data.rank;
    renderHome();
    startCooldown(3);
  } catch (e) {
    if (e.message.includes("cooldown")) {
      const match = e.message.match(/(\d+)/);
      startCooldown(match ? parseInt(match[1]) : 3);
    } else {
      alert(e.message);
    }
  }
}

function startCooldown(seconds) {
  const btn = document.getElementById("earn-btn");
  const text = document.getElementById("cooldown-text");
  btn.disabled = true;
  let remaining = seconds;
  text.textContent = `Wait ${remaining}s...`;

  clearInterval(cooldownInterval);
  cooldownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      btn.disabled = false;
      text.textContent = "";
    } else {
      text.textContent = `Wait ${remaining}s...`;
    }
  }, 1000);
}

function applyCooldownState() {
  if (!currentUser.last_earn_click) return;
  const last = new Date(currentUser.last_earn_click).getTime();
  const now = Date.now();
  const elapsed = (now - last) / 1000;
  if (elapsed < 3) {
    startCooldown(Math.ceil(3 - elapsed));
  }
}

async function handleUpdateProfile() {
  const newUsername = document.getElementById("profile-username").value.trim();
  const msgEl = document.getElementById("profile-msg");
  try {
    const data = await apiRequest("/user/me", {
      method: "PATCH",
      body: JSON.stringify({ username: newUsername }),
    });
    currentUser = data.user;
    msgEl.textContent = "Saved!";
    renderHome();
    setTimeout(() => (msgEl.textContent = ""), 2000);
  } catch (e) {
    msgEl.style.color = "#ff5555";
    msgEl.textContent = e.message;
  }
}

function copyReferralCode() {
  navigator.clipboard.writeText(currentUser.referral_code);
  alert("Referral code copied!");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
