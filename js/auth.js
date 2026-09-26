function showSignup() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("signup-form").classList.remove("hidden");
}
function showLogin() {
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("login-form").classList.remove("hidden");
}

async function handleSignup() {
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;
  const referral = document.getElementById("signup-referral").value.trim();
  const errorEl = document.getElementById("signup-error");
  errorEl.textContent = "";

  if (!username || !password) {
    errorEl.textContent = "Username and password required.";
    return;
  }

  try {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password, referralCode: referral || null }),
    });
    setToken(data.token);
    await loadApp();
  } catch (e) {
    errorEl.textContent = e.message;
  }
}

async function handleLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  if (!username || !password) {
    errorEl.textContent = "Username and password required.";
    return;
  }

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    await loadApp();
  } catch (e) {
    errorEl.textContent = e.message;
  }
}

function handleLogout() {
  clearToken();
  document.getElementById("app-screen").classList.remove("active");
  document.getElementById("auth-screen").classList.add("active");
}
