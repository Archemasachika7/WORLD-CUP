// ============================================================
// World Cup 2026 — Global Auth State (Supabase magic-link)
// Injected on every page via shared.js buildNav().
// Exposes window.WCAuth for any page to read/react.
// ============================================================

const WCAuth = (() => {
  let _user    = null;
  let _profile = null;
  const _subs  = [];

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    if (typeof _sb === "undefined") return;

    const { data } = await _sb.auth.getSession();
    if (data.session) await _loadProfile(data.session.user);

    _sb.auth.onAuthStateChange(async (_evt, session) => {
      _user = session?.user || null;
      if (_user) await _loadProfile(_user);
      else _profile = null;
      _notify();
    });
  }

  async function _loadProfile(user) {
    _user = user;
    try {
      const { data } = await _sb.from("profiles").select("*").eq("id", user.id).single();
      _profile = data || null;
    } catch (_) {
      _profile = null;
    }
    _notify();
  }

  function _notify() {
    _subs.forEach(fn => { try { fn(_user, _profile); } catch (_) {} });
    _updateNavAvatar();
  }

  // ── Public API ───────────────────────────────────────────────
  function getUser()    { return _user; }
  function getProfile() { return _profile; }
  function isLoggedIn() { return !!_user; }

  async function signOut() {
    await _sb.auth.signOut();
  }

  function onChange(fn) {
    _subs.push(fn);
    // Fire immediately with current state
    fn(_user, _profile);
  }

  // ── Nav avatar pill ─────────────────────────────────────────
  function _updateNavAvatar() {
    const existing = document.getElementById("nav-user-btn");
    if (existing) existing.remove();

    const anchor = document.querySelector(".nav-cta");
    if (!anchor) return;

    const btn = document.createElement("a");
    btn.id = "nav-user-btn";
    btn.className = "nav-user-btn";

    if (_user) {
      const display = _profile?.display_name || _user.email?.split("@")[0] || "You";
      const avatarUrl = _profile?.avatar_url || null;
      btn.href = "profile.html";
      btn.title = "Your profile";
      btn.innerHTML = avatarUrl
        ? `<img class="nav-avatar-img" src="${avatarUrl}" alt="${display}" /><span class="nav-avatar-name">${display}</span>`
        : `<span class="nav-avatar-initials">${display.slice(0,2).toUpperCase()}</span><span class="nav-avatar-name">${display}</span>`;
    } else {
      btn.href = "auth.html";
      btn.title = "Sign in";
      btn.innerHTML = `<span class="nav-avatar-initials nav-avatar-guest">👤</span><span class="nav-avatar-name">Sign In</span>`;
    }

    anchor.insertAdjacentElement("beforebegin", btn);
  }

  return { init, getUser, getProfile, isLoggedIn, signOut, onChange };
})();

// Bootstrap after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (typeof _sb !== "undefined") WCAuth.init();
});
