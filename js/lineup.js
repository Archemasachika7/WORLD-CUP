// ============================================================
// Lineup Builder — pick a nation, formation, assign squad players
// ============================================================

const LineupBuilder = (() => {
  // Formations: slots positioned on a vertical pitch (x,y in %, GK at bottom)
  const FORMATIONS = {
    "4-3-3": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:74 }, { role:"DF", x:39, y:78 }, { role:"DF", x:61, y:78 }, { role:"DF", x:82, y:74 },
      { role:"MF", x:30, y:52 }, { role:"MF", x:50, y:56 }, { role:"MF", x:70, y:52 },
      { role:"FW", x:22, y:26 }, { role:"FW", x:50, y:20 }, { role:"FW", x:78, y:26 },
    ],
    "4-4-2": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:75 }, { role:"DF", x:39, y:79 }, { role:"DF", x:61, y:79 }, { role:"DF", x:82, y:75 },
      { role:"MF", x:18, y:52 }, { role:"MF", x:39, y:55 }, { role:"MF", x:61, y:55 }, { role:"MF", x:82, y:52 },
      { role:"FW", x:38, y:24 }, { role:"FW", x:62, y:24 },
    ],
    "3-5-2": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:28, y:77 }, { role:"DF", x:50, y:80 }, { role:"DF", x:72, y:77 },
      { role:"MF", x:14, y:55 }, { role:"MF", x:34, y:57 }, { role:"MF", x:50, y:60 }, { role:"MF", x:66, y:57 }, { role:"MF", x:86, y:55 },
      { role:"FW", x:38, y:24 }, { role:"FW", x:62, y:24 },
    ],
    "4-2-3-1": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:76 }, { role:"DF", x:39, y:79 }, { role:"DF", x:61, y:79 }, { role:"DF", x:82, y:76 },
      { role:"MF", x:38, y:60 }, { role:"MF", x:62, y:60 },
      { role:"MF", x:22, y:40 }, { role:"MF", x:50, y:38 }, { role:"MF", x:78, y:40 },
      { role:"FW", x:50, y:18 },
    ],
    "3-4-3": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:28, y:77 }, { role:"DF", x:50, y:80 }, { role:"DF", x:72, y:77 },
      { role:"MF", x:16, y:54 }, { role:"MF", x:38, y:56 }, { role:"MF", x:62, y:56 }, { role:"MF", x:84, y:54 },
      { role:"FW", x:22, y:24 }, { role:"FW", x:50, y:20 }, { role:"FW", x:78, y:24 },
    ],
    "4-1-4-1": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:77 }, { role:"DF", x:39, y:80 }, { role:"DF", x:61, y:80 }, { role:"DF", x:82, y:77 },
      { role:"MF", x:50, y:62 },
      { role:"MF", x:18, y:42 }, { role:"MF", x:39, y:44 }, { role:"MF", x:61, y:44 }, { role:"MF", x:82, y:42 },
      { role:"FW", x:50, y:20 },
    ],
    "5-3-2": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:12, y:74 }, { role:"DF", x:31, y:78 }, { role:"DF", x:50, y:80 }, { role:"DF", x:69, y:78 }, { role:"DF", x:88, y:74 },
      { role:"MF", x:30, y:52 }, { role:"MF", x:50, y:55 }, { role:"MF", x:70, y:52 },
      { role:"FW", x:38, y:24 }, { role:"FW", x:62, y:24 },
    ],
    "4-3-2-1": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:76 }, { role:"DF", x:39, y:79 }, { role:"DF", x:61, y:79 }, { role:"DF", x:82, y:76 },
      { role:"MF", x:30, y:56 }, { role:"MF", x:50, y:58 }, { role:"MF", x:70, y:56 },
      { role:"FW", x:38, y:36 }, { role:"FW", x:62, y:36 },
      { role:"FW", x:50, y:18 },
    ],
    "3-4-2-1": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:28, y:78 }, { role:"DF", x:50, y:80 }, { role:"DF", x:72, y:78 },
      { role:"MF", x:16, y:56 }, { role:"MF", x:38, y:58 }, { role:"MF", x:62, y:58 }, { role:"MF", x:84, y:56 },
      { role:"FW", x:38, y:34 }, { role:"FW", x:62, y:34 },
      { role:"FW", x:50, y:16 },
    ],
    "4-4-1-1": [
      { role:"GK", x:50, y:92 },
      { role:"DF", x:18, y:76 }, { role:"DF", x:39, y:79 }, { role:"DF", x:61, y:79 }, { role:"DF", x:82, y:76 },
      { role:"MF", x:18, y:54 }, { role:"MF", x:39, y:56 }, { role:"MF", x:61, y:56 }, { role:"MF", x:82, y:54 },
      { role:"FW", x:50, y:34 },
      { role:"FW", x:50, y:16 },
    ],
  };

  let teamId = null;
  let formationKey = "4-3-3";
  let assigned = {};       // slotIndex -> player object
  let activeSlot = null;   // slot being filled via picker

  function init() {
    const panel = document.getElementById("game-lineup");
    if (!panel) return;
    populateTeams();
    populateFormations();
    bind();
    render();
  }

  function announcedTeams() {
    if (typeof SQUADS === "undefined") return [];
    return TEAMS.filter(t => SQUADS[t.id]?.players?.length);
  }

  function populateTeams() {
    const sel = document.getElementById("lineup-team");
    if (!sel) return;
    const teams = announcedTeams();
    sel.innerHTML = teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    teamId = teams[0]?.id || null;
  }

  function populateFormations() {
    const sel = document.getElementById("lineup-formation");
    if (!sel) return;
    sel.innerHTML = Object.keys(FORMATIONS).map(f => `<option value="${f}">${f}</option>`).join("");
  }

  function bind() {
    document.getElementById("lineup-team")?.addEventListener("change", e => {
      teamId = e.target.value; assigned = {}; loadSaved(); render();
    });
    document.getElementById("lineup-formation")?.addEventListener("change", e => {
      formationKey = e.target.value; assigned = {}; render();
    });
    document.getElementById("lineup-clear-btn")?.addEventListener("click", () => { assigned = {}; render(); });
    document.getElementById("lineup-save-btn")?.addEventListener("click", save);
    document.getElementById("lineup-share-btn")?.addEventListener("click", share);
    document.getElementById("lineup-picker-close")?.addEventListener("click", closePicker);
    document.getElementById("lineup-picker")?.addEventListener("click", e => {
      if (e.target.id === "lineup-picker") closePicker();
    });
  }

  function squad() {
    return (SQUADS[teamId]?.players || []).map((p, i) => ({ ...p, _id: i }));
  }

  function isUsed(playerId) {
    return Object.values(assigned).some(p => p && p._id === playerId);
  }

  function render() {
    renderNote();
    renderPitch();
    renderBench();
  }

  function renderNote() {
    const note = document.getElementById("lineup-note");
    if (!note) return;
    const sq = squad();
    const filled = Object.values(assigned).filter(Boolean).length;
    note.textContent = `${SQUADS[teamId]?.players?.length || 0} players in squad · ${filled}/11 picked` +
      (sq.length < 26 ? "  ·  squad list is partial" : "");
  }

  function renderPitch() {
    const pitch = document.getElementById("lineup-pitch");
    if (!pitch) return;
    const slots = FORMATIONS[formationKey];
    pitch.innerHTML = slots.map((s, i) => {
      const p = assigned[i];
      const name = p ? (p.name.split(" ").slice(-1)[0]) : "+";
      return `
        <button class="lineup-slot${p ? " filled" : ""}" data-slot="${i}"
          style="left:${s.x}%;top:${s.y}%">
          <span class="lineup-slot-role">${p ? esc(p.club || s.role) : s.role}</span>
          <span class="lineup-slot-name">${esc(name)}</span>
        </button>`;
    }).join("");
    pitch.querySelectorAll(".lineup-slot").forEach(btn => {
      btn.addEventListener("click", () => openPicker(parseInt(btn.dataset.slot, 10)));
    });
  }

  function renderBench() {
    const list = document.getElementById("lineup-bench-list");
    if (!list) return;
    const sq = squad();
    if (!sq.length) { list.innerHTML = `<p style="color:var(--text-dim);font-size:0.8rem;padding:8px;">No squad announced yet for this nation.</p>`; return; }
    list.innerHTML = sq.map(p => `
      <div class="lineup-bench-item${isUsed(p._id) ? " used" : ""}">
        <span class="lineup-pos lineup-pos-${p.pos}">${p.pos}</span>
        <span class="lineup-bench-name">${esc(p.name)}</span>
        <span class="lineup-bench-club">${esc(p.club || "")}</span>
      </div>`).join("");
  }

  function openPicker(slotIndex) {
    activeSlot = slotIndex;
    const slot = FORMATIONS[formationKey][slotIndex];
    const overlay = document.getElementById("lineup-picker");
    const title = document.getElementById("lineup-picker-title");
    const listEl = document.getElementById("lineup-picker-list");
    if (title) title.textContent = `Choose a ${slot.role}`;

    const sq = squad();
    // Suggest matching position first, then everyone else
    const match = sq.filter(p => p.pos === slot.role);
    const others = sq.filter(p => p.pos !== slot.role);
    const ordered = [...match, ...others];

    let html = "";
    if (assigned[slotIndex]) {
      html += `<button class="lineup-pick-item lineup-pick-remove" data-pid="-1">✕ Remove from this position</button>`;
    }
    html += ordered.map(p => `
      <button class="lineup-pick-item${isUsed(p._id) ? " used" : ""}" data-pid="${p._id}">
        <span class="lineup-pos lineup-pos-${p.pos}">${p.pos}</span>
        <span style="flex:1;text-align:left">${esc(p.name)}</span>
        <span class="lineup-bench-club">${esc(p.club || "")}</span>
      </button>`).join("");
    if (listEl) {
      listEl.innerHTML = html;
      listEl.querySelectorAll(".lineup-pick-item").forEach(btn => {
        btn.addEventListener("click", () => choosePlayer(parseInt(btn.dataset.pid, 10)));
      });
    }
    if (overlay) overlay.style.display = "flex";
  }

  function choosePlayer(pid) {
    if (activeSlot == null) return;
    if (pid === -1) { delete assigned[activeSlot]; }
    else {
      const p = squad().find(x => x._id === pid);
      // Remove this player from any other slot first (no duplicates)
      Object.keys(assigned).forEach(k => { if (assigned[k]?._id === pid) delete assigned[k]; });
      assigned[activeSlot] = p;
    }
    closePicker();
    render();
  }

  function closePicker() {
    activeSlot = null;
    const overlay = document.getElementById("lineup-picker");
    if (overlay) overlay.style.display = "none";
  }

  function storageKey() { return "wc26_lineup_" + teamId; }

  function save() {
    const data = { formationKey, slots: {} };
    Object.entries(assigned).forEach(([k, p]) => { if (p) data.slots[k] = p._id; });
    try {
      localStorage.setItem(storageKey(), JSON.stringify(data));
      flashNote("✅ Lineup saved on this device");
    } catch { flashNote("Could not save (storage full)"); }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.formationKey && FORMATIONS[data.formationKey]) {
        formationKey = data.formationKey;
        const fSel = document.getElementById("lineup-formation");
        if (fSel) fSel.value = formationKey;
      }
      assigned = {};
      const sq = squad();
      Object.entries(data.slots || {}).forEach(([k, pid]) => {
        const p = sq.find(x => x._id === pid);
        if (p) assigned[k] = p;
      });
    } catch {}
  }

  function share() {
    const team = TEAMS.find(t => t.id === teamId);
    const slots = FORMATIONS[formationKey];
    const lines = slots.map((s, i) => `${s.role}: ${assigned[i]?.name || "—"}`);
    const txt = `My ${team?.name || ""} XI (${formationKey}) for World Cup 2026:\n` + lines.join("\n");
    navigator.clipboard?.writeText(txt)
      .then(() => flashNote("🔗 Lineup copied to clipboard"))
      .catch(() => flashNote("Copy failed — select & copy manually"));
  }

  let _flashT;
  function flashNote(msg) {
    const note = document.getElementById("lineup-note");
    if (!note) return;
    const prev = note.textContent;
    note.textContent = msg;
    clearTimeout(_flashT);
    _flashT = setTimeout(renderNote, 2200);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  LineupBuilder.init();
});
