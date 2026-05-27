// ============================================================
// Bracket Predictor — Supabase magic-link auth + saved predictions
// Requires table `predictions` (see SQL in PR description).
// ============================================================

const Bracket = (() => {
  let user = null;

  function init() {
    if (typeof _sb === "undefined") {
      setAuthMsg("Auth unavailable — Supabase client failed to load.", true);
      return;
    }
    populateNationSelects();
    bindEvents();

    // React to login state (also fires after returning from the magic link)
    _sb.auth.getSession().then(({ data }) => applySession(data.session));
    _sb.auth.onAuthStateChange((_evt, session) => applySession(session));
  }

  function bindEvents() {
    document.getElementById("bracket-login-btn")?.addEventListener("click", sendMagicLink);
    document.getElementById("bracket-email")?.addEventListener("keydown", e => {
      if (e.key === "Enter") sendMagicLink();
    });
    document.getElementById("bracket-logout-btn")?.addEventListener("click", () => _sb.auth.signOut());
    document.getElementById("bracket-save-btn")?.addEventListener("click", savePrediction);
  }

  function populateNationSelects() {
    if (typeof TEAMS === "undefined") return;
    const opts = '<option value="">— Select —</option>' +
      TEAMS.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    ["bracket-favorite", "bracket-champion", "bracket-runnerup"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts;
    });
  }

  async function sendMagicLink() {
    const email = (document.getElementById("bracket-email")?.value || "").trim();
    if (!email || !email.includes("@")) { setAuthMsg("Enter a valid email address.", true); return; }
    setAuthMsg("Sending magic link…");
    const { error } = await _sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.href },
    });
    if (error) { setAuthMsg("Could not send link: " + error.message, true); return; }
    setAuthMsg("✅ Check your inbox for the sign-in link!");
  }

  function applySession(session) {
    user = session?.user || null;
    const authBox = document.getElementById("bracket-auth");
    const formBox = document.getElementById("bracket-form");
    if (user) {
      if (authBox) authBox.style.display = "none";
      if (formBox) formBox.style.display = "block";
      const emailEl = document.getElementById("bracket-user-email");
      if (emailEl) emailEl.textContent = user.email || "your account";
      loadPrediction();
    } else {
      if (authBox) authBox.style.display = "block";
      if (formBox) formBox.style.display = "none";
    }
  }

  async function loadPrediction() {
    const { data, error } = await _sb.from("predictions")
      .select("favorite_nation, champion, runner_up")
      .eq("user_id", user.id).maybeSingle();
    if (error) { console.warn("loadPrediction:", error.message); return; }
    if (!data) return;
    setVal("bracket-favorite",  data.favorite_nation);
    setVal("bracket-champion",  data.champion);
    setVal("bracket-runnerup",  data.runner_up);
  }

  async function savePrediction() {
    if (!user) return;
    const favorite_nation = getVal("bracket-favorite");
    const champion        = getVal("bracket-champion");
    const runner_up       = getVal("bracket-runnerup");
    if (!favorite_nation && !champion && !runner_up) {
      setSaveMsg("Make at least one pick first.", true);
      return;
    }
    setSaveMsg("Saving…");
    const { error } = await _sb.from("predictions").upsert({
      user_id: user.id, favorite_nation, champion, runner_up,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) { setSaveMsg("Save failed: " + error.message, true); return; }
    setSaveMsg("✅ Bracket saved!");
  }

  // ── small DOM helpers ──
  function getVal(id) { return document.getElementById(id)?.value || ""; }
  function setVal(id, v) { const el = document.getElementById(id); if (el && v != null) el.value = v; }
  function setAuthMsg(msg, err = false) {
    const el = document.getElementById("bracket-auth-msg");
    if (el) { el.textContent = msg; el.style.color = err ? "var(--accent)" : "var(--green)"; }
  }
  function setSaveMsg(msg, err = false) {
    const el = document.getElementById("bracket-save-msg");
    if (el) { el.textContent = msg; el.style.color = err ? "var(--accent)" : "var(--green)"; }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => Bracket.init());
