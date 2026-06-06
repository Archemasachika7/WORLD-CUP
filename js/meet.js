// ============================================================
// Meet Rooms — Supabase Realtime chat + presence + WebRTC
// ============================================================

const MeetSystem = (() => {

  const EMOJI_LIST = ["⚽","🔥","❤️","😱","🎉","👏","🚀","💪","🏆","😭","🤩","💥"];

  const TEAM_THEMES = {
    esp: { accent:"#c60b1e", bg:"rgba(198,11,30,0.09)",  badge:"#ffc400" },
    fra: { accent:"#0033a0", bg:"rgba(0,51,160,0.09)",   badge:"#ed2939" },
    bel: { accent:"#f5d900", bg:"rgba(245,217,0,0.07)",  badge:"#1a1a1a" },
    arg: { accent:"#74acdf", bg:"rgba(116,172,223,0.09)",badge:"#ffffff" },
    eng: { accent:"#cf081f", bg:"rgba(207,8,31,0.08)",   badge:"#ffffff" },
    bra: { accent:"#009c3b", bg:"rgba(0,156,59,0.08)",   badge:"#ffdf00" },
    por: { accent:"#006600", bg:"rgba(0,102,0,0.08)",    badge:"#ff2200" },
    ned: { accent:"#ff6600", bg:"rgba(255,102,0,0.09)",  badge:"#003da5" },
    col: { accent:"#c4a800", bg:"rgba(253,209,22,0.07)", badge:"#003087" },
    ger: { accent:"#dd0000", bg:"rgba(221,0,0,0.08)",    badge:"#ffcc00" },
    sui: { accent:"#ff0000", bg:"rgba(255,0,0,0.08)",    badge:"#ffffff" },
    mex: { accent:"#006847", bg:"rgba(0,104,71,0.08)",   badge:"#ce1126" },
    usa: { accent:"#3c3b6e", bg:"rgba(60,59,110,0.08)",  badge:"#b22234" },
    jpn: { accent:"#bc002d", bg:"rgba(188,0,45,0.08)",   badge:"#ffffff" },
    kor: { accent:"#cd2e3a", bg:"rgba(205,46,58,0.08)",  badge:"#003478" },
    mar: { accent:"#c1272d", bg:"rgba(193,39,45,0.08)",  badge:"#006233" },
    tur: { accent:"#e30a17", bg:"rgba(227,10,23,0.08)",  badge:"#ffffff" },
    sen: { accent:"#00853f", bg:"rgba(0,133,63,0.08)",   badge:"#fdef42" },
    aut: { accent:"#ed2939", bg:"rgba(237,41,57,0.08)",  badge:"#ffffff" },
    cro: { accent:"#0093dd", bg:"rgba(0,147,221,0.08)",  badge:"#cc0000" },
    nor: { accent:"#ef2b2d", bg:"rgba(239,43,45,0.08)",  badge:"#003087" },
    swe: { accent:"#006aa7", bg:"rgba(0,106,167,0.08)",  badge:"#fecc02" },
  };

  const STUN = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  // ── State ──────────────────────────────────────────────
  let st = {
    roomId: null, nickname: "", teamId: "", teamFlag: "⚽",
    peerId: null, joined: false, micOn: false, camOn: false,
    screenOn: false, handRaised: false, viewMode: "gallery",
    participantsOpen: false, unreadCount: 0, blurOn: false,
  };
  let sbCh = null;
  let localStream = null;
  let screenStream = null;
  let screenSharingPeer = null; // peerId of whoever is currently sharing their screen
  let screenSenders = {};       // peerId → RTCRtpSender for the screen-video track (so we can removeTrack)
  let peerScreenStreamIds = {}; // peerId → stream.id expected for that peer's screen share
  let peerScreenStreams = {};   // peerId → received screen MediaStream (ready to show)
  let peerStreams = {};         // peerId → Map(streamId → MediaStream) of every inbound stream
  let peers = {};
  let peerMeta = {}; // peerId → { nickname, flag, handRaised, micOn, camOn }
  let audioCtx = null;
  let speakerAnalysers = {}; // peerId → { analyser, data, interval }
  let speakerVolumes = {};   // peerId → number (volume level)

  // Timer state
  let timerInterval = null;
  let timerStart = null;

  // Pinning state
  let pinnedTileId = null;   // DOM id of pinned tile

  // Presence tracking for join/leave toasts
  let prevPresenceIds = new Set();

  // Quality simulation intervals
  let qualityIntervals = {};

  // ── Init ───────────────────────────────────────────────
  function init() {
    bindLanding();
    renderThemeChips();
    renderMeetPlayers();
    checkUrlRoom();
    // Restore nickname from localStorage
    const saved = localStorage.getItem("wc-meet-nick");
    if (saved) {
      const inp = document.getElementById("meet-nickname-input");
      if (inp) inp.value = saved;
    }
  }

  function bindLanding() {
    document.getElementById("meet-create-btn")?.addEventListener("click", createRoom);
    document.getElementById("meet-join-btn")?.addEventListener("click", () => {
      const code = (document.getElementById("meet-room-code-input")?.value || "").trim().toUpperCase();
      if (!code) { alert2("Enter a room code!"); return; }
      joinRoom(code);
    });
    document.getElementById("meet-room-code-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("meet-join-btn")?.click();
    });
    document.getElementById("meet-team-select")?.addEventListener("change", () => {
      const sel = document.getElementById("meet-team-select");
      applyTheme(sel?.options[sel.selectedIndex]?.dataset?.id || "");
    });
  }

  // ── Create / Join ──────────────────────────────────────
  async function createRoom() {
    if (!readIdentity()) return;
    const roomId = genId();
    try {
      const { error } = await _sb.from("rooms").insert({ id: roomId });
      if (error && error.code !== "23505") {
        console.warn("rooms table insert failed (non-fatal):", error.code, error.message);
      }
    } catch (e) { console.warn("rooms insert exception (non-fatal):", e); }
    await enter(roomId);
  }

  async function joinRoom(roomId) {
    if (!readIdentity()) return;
    await enter(roomId);
  }

  function readIdentity() {
    const nick = (document.getElementById("meet-nickname-input")?.value || "").trim();
    if (!nick) { alert2("Enter a nickname first!"); return false; }
    st.nickname = nick;
    localStorage.setItem("wc-meet-nick", nick);
    const sel = document.getElementById("meet-team-select");
    const opt = sel?.options[sel?.selectedIndex];
    st.teamFlag = opt?.value || "⚽";
    st.teamId   = opt?.dataset?.id || "";
    return true;
  }

  async function enter(roomId) {
    st.roomId = roomId;
    st.peerId = crypto.randomUUID();
    st.joined = true;
    applyTheme(st.teamId);
    showRoom(roomId);
    bindRoom();
    bindKeyboardShortcuts();
    await subscribe(roomId);
    await loadHistory(roomId);
    sysMsg(`You joined as ${st.teamFlag} ${st.nickname}`);
    showToast(`You joined as ${st.teamFlag} ${st.nickname}`, "success");
  }

  // ── Supabase Realtime ──────────────────────────────────
  async function subscribe(roomId) {
    sbCh = _sb.channel(`meet:${roomId}`, {
      config: { presence: { key: st.peerId }, broadcast: { self: false } }
    });

    sbCh
      .on("presence", { event: "sync" }, () => renderPresence(sbCh.presenceState()))
      .on("broadcast", { event: "chat"        }, ({ payload }) => appendMsg(payload))
      .on("broadcast", { event: "emoji_pop"   }, ({ payload }) => rain(payload.e))
      .on("broadcast", { event: "stream_sync" }, ({ payload }) => loadStream(payload.url, false))
      .on("broadcast", { event: "rtc_hello"   }, ({ payload }) => {
        if (payload.p !== st.peerId) {
          peerMeta[payload.p] = { nickname: payload.n, flag: payload.f || "⚽", handRaised: false };
          sendOffer(payload.p);
          // Re-announce active screen share so the new peer can identify the screen stream
          if (st.screenOn && screenStream) {
            sbCh?.send({ type:"broadcast", event:"screen_share",
              payload:{ p: st.peerId, n: st.nickname, sharing: true, streamId: screenStream.id } });
          }
        }
      })
      .on("broadcast", { event: "rtc_offer"   }, ({ payload }) => { if (payload.to === st.peerId) handleOffer(payload); })
      .on("broadcast", { event: "rtc_answer"  }, ({ payload }) => { if (payload.to === st.peerId) handleAnswer(payload); })
      .on("broadcast", { event: "rtc_ice"     }, ({ payload }) => { if (payload.to === st.peerId) handleIce(payload); })
      .on("broadcast", { event: "hand_raise"  }, ({ payload }) => handleHandRaise(payload))
      .on("broadcast", { event: "screen_share" }, ({ payload }) => {
        if (payload.p === st.peerId) return;
        if (payload.sharing) {
          screenSharingPeer = payload.p;
          if (payload.streamId) peerScreenStreamIds[payload.p] = payload.streamId;
          const name = peerMeta[payload.p]?.nickname || "Someone";
          sysMsg(`🖥️ ${name} started sharing their screen`);
          showToast(`🖥️ ${name} is sharing their screen`, "info");
          // Now that we know which stream id is the screen, re-route any buffered
          // streams — this pulls the screen out of the camera tile and into the container.
          classifyPeerStreams(payload.p);
          showRemoteScreen(payload.p);
        } else {
          if (screenSharingPeer === payload.p) {
            const name = peerMeta[payload.p]?.nickname || "Someone";
            sysMsg(`🖥️ ${name} stopped sharing their screen`);
            // Drop the (now-ended) screen stream from the buffer so a future share
            // with a new id classifies cleanly.
            const oldScreenId = peerScreenStreamIds[payload.p];
            if (oldScreenId) peerStreams[payload.p]?.delete(oldScreenId);
            delete peerScreenStreams[payload.p];
            delete peerScreenStreamIds[payload.p];
            screenSharingPeer = null;
            hideRemoteScreen();
          }
        }
      })
      .on("broadcast", { event: "peer_meta"   }, ({ payload }) => {
        if (payload.p !== st.peerId) {
          peerMeta[payload.p] = {
            nickname: payload.n, flag: payload.f || "⚽",
            handRaised: payload.handRaised || false,
            micOn: payload.micOn !== false, camOn: payload.camOn !== false
          };
          updatePeerLabel(payload.p);
          updateTileStatus(`peer-${payload.p}`, payload.micOn !== false, payload.camOn !== false);
          const hasVid = payload.camOn !== false;
          setAvatar(`peer-${payload.p}`, payload.n || "Peer");
          showAvatar(`peer-${payload.p}`, !hasVid);
          if (st.participantsOpen) renderParticipantsList();
        }
      });

    await sbCh.subscribe(async status => {
      if (status !== "SUBSCRIBED") return;
      await sbCh.track({ n: st.nickname, f: st.teamFlag, id: st.teamId, p: st.peerId, t: Date.now() });
      sbCh.send({ type:"broadcast", event:"rtc_hello", payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag } });
    });
  }

  async function loadHistory(roomId) {
    try {
      const { data, error } = await _sb.from("messages")
        .select("*").eq("room_id", roomId)
        .order("created_at", { ascending: true }).limit(100);
      if (error) console.warn("loadHistory:", error.code, error.message);
      (data || []).forEach(m => appendMsg(m, true));
    } catch (e) { console.warn("loadHistory exception:", e); }
  }

  // ── Chat ───────────────────────────────────────────────
  async function sendMsg() {
    const inp = document.getElementById("meet-msg-input");
    const txt = (inp?.value || "").trim();
    if (!txt) return;
    inp.value = "";

    const payload = { room_id: st.roomId, nickname: st.nickname,
      team_flag: st.teamFlag, text: txt, type: "msg", created_at: new Date().toISOString() };

    appendMsg(payload, false, true);
    sbCh?.send({ type:"broadcast", event:"chat", payload });
    try {
      const { error } = await _sb.from("messages").insert({
        room_id: payload.room_id, nickname: payload.nickname,
        team_flag: payload.team_flag, text: payload.text, type: "msg"
      });
      if (error) console.warn("messages insert:", error.code, error.message);
    } catch (e) { console.warn("messages insert exception:", e); }
  }

  function appendMsg(m, _hist = false, self = false) {
    const box = document.getElementById("meet-messages");
    if (!box) return;
    const d = document.createElement("div");
    d.className = `meet-msg ${self ? "meet-msg-self" : "meet-msg-other"}`;
    const t = new Date(m.created_at || Date.now()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    d.innerHTML = `<span class="meet-msg-flag">${m.team_flag||"⚽"}</span>
      <div class="meet-msg-body">
        <span class="meet-msg-nick">${esc(m.nickname)}</span>
        <span class="meet-msg-text">${esc(m.text)}</span>
      </div>
      <time class="meet-msg-time">${t}</time>`;
    box.appendChild(d);
    if (!self) {
      const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
      if (atBottom) box.scrollTop = box.scrollHeight;
      else markUnread();
    } else {
      box.scrollTop = box.scrollHeight;
    }
  }

  function sysMsg(txt) {
    const box = document.getElementById("meet-messages");
    if (!box) return;
    const d = document.createElement("div");
    d.className = "meet-sys-msg";
    d.textContent = txt;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  }

  // ── Toast Notifications ────────────────────────────────
  function showToast(msg, type = "info", duration = 3500) {
    const container = document.getElementById("meet-toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = `meet-toast meet-toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${
      type === "success" ? "✅" : type === "warning" ? "⚠️" : type === "hand" ? "✋" : "ℹ️"
    }</span><span class="toast-msg">${esc(msg)}</span>`;
    container.appendChild(t);
    // Trigger enter animation
    requestAnimationFrame(() => t.classList.add("toast-visible"));
    setTimeout(() => {
      t.classList.remove("toast-visible");
      t.classList.add("toast-exit");
      setTimeout(() => t.remove(), 350);
    }, duration);
  }

  // ── Presence ───────────────────────────────────────────
  function renderPresence(ps) {
    const bar   = document.getElementById("meet-presence-bar");
    const count = document.getElementById("meet-user-count");
    const users = Object.values(ps).flat();
    if (count) count.textContent = users.length + " in call";

    // Detect joins and leaves for toasts
    const currentIds = new Set(users.map(u => u.p));
    users.forEach(u => {
      if (u.p !== st.peerId && !prevPresenceIds.has(u.p)) {
        showToast(`${u.f || "⚽"} ${u.n} joined the meeting`, "info");
        if (st.participantsOpen) renderParticipantsList();
      }
    });
    prevPresenceIds.forEach(id => {
      if (id !== st.peerId && !currentIds.has(id)) {
        const meta = peerMeta[id];
        const name = meta ? meta.nickname : "Someone";
        showToast(`${name} left the meeting`, "warning", 2500);
        if (st.participantsOpen) renderParticipantsList();
      }
    });
    prevPresenceIds = currentIds;

    if (!bar) return;
    bar.innerHTML = users.map(u => `
      <div class="meet-user-chip${u.p === st.peerId ? " meet-user-me" : ""}">
        <span>${u.f}</span>
        <span>${esc(u.n)}${u.p === st.peerId ? " (you)" : ""}</span>
      </div>`).join("");
  }

  // ── Emoji Reactions ────────────────────────────────────
  function sendEmoji(e) {
    rain(e);
    sbCh?.send({ type:"broadcast", event:"emoji_pop", payload:{ e } });
  }

  function rain(emoji) {
    const container = document.getElementById("meet-emoji-rain");
    if (!container) return;
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement("span");
        el.className = "emoji-float";
        el.textContent = emoji;
        el.style.left = (5 + Math.random() * 90) + "%";
        el.style.fontSize = (1.4 + Math.random() * 1.4) + "rem";
        el.style.animationDuration = (1.2 + Math.random() * 1) + "s";
        container.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
      }, i * 100);
    }
  }

  // ── Stream Sync ────────────────────────────────────────
  function loadStream(url, broadcast = true) {
    const iframe      = document.getElementById("meet-stream-iframe");
    const wrap        = document.getElementById("meet-stream-frame-wrap");
    const placeholder = document.getElementById("meet-stream-placeholder");
    const leftCol     = document.getElementById("meet-left-col");
    const inp         = document.getElementById("meet-stream-input");
    if (inp)   inp.value = url;
    if (iframe) iframe.src = url;
    // Trigger embed-fallback check (defined in meet.html inline script)
    if (typeof setupStreamIframeFallback === "function") setupStreamIframeFallback(url);
    // Show stream iframe, hide placeholder
    wrap?.classList.add("active");
    if (placeholder) placeholder.style.display = "none";
    leftCol?.classList.add("has-stream");
    // Show PiP if camera is on
    updatePip();
    if (broadcast) {
      sbCh?.send({ type:"broadcast", event:"stream_sync", payload:{ url } });
      sysMsg(`${st.teamFlag} ${st.nickname} synced a stream for everyone`);
    } else {
      sysMsg("Host synced a stream — loading for you…");
    }
  }

  function updatePip() {
    const pipTile  = document.getElementById("meet-pip-tile");
    const pipVideo = document.getElementById("meet-pip-video");
    const hasStream = document.getElementById("meet-stream-frame-wrap")?.classList.contains("active");
    if (!pipTile) return;
    if (hasStream && localStream && st.camOn) {
      pipVideo.srcObject = localStream;
      pipTile.classList.add("visible");
    } else {
      pipTile.classList.remove("visible");
    }
  }

  function initPip() {
    const pipTile = document.getElementById("meet-pip-tile");
    const pipClose = document.getElementById("meet-pip-close");
    if (!pipTile) return;

    // Close button
    pipClose?.addEventListener("click", e => {
      e.stopPropagation();
      pipTile.classList.remove("visible");
    });

    // Drag to reposition
    let dragging = false, ox = 0, oy = 0;
    pipTile.addEventListener("mousedown", e => {
      if (e.target === pipClose) return;
      dragging = true;
      const r = pipTile.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      pipTile.style.cursor = "grabbing";
    });
    document.addEventListener("mousemove", e => {
      if (!dragging) return;
      const area = document.getElementById("meet-stream-area");
      const ar = area?.getBoundingClientRect() || { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
      const x = Math.max(0, Math.min(ar.width - pipTile.offsetWidth, e.clientX - ar.left - ox));
      const y = Math.max(0, Math.min(ar.height - pipTile.offsetHeight, e.clientY - ar.top - oy));
      pipTile.style.right = "auto"; pipTile.style.bottom = "auto";
      pipTile.style.left = x + "px"; pipTile.style.top = y + "px";
    });
    document.addEventListener("mouseup", () => { dragging = false; pipTile.style.cursor = "move"; });
  }

  // ── Remote screen share helpers ────────────────────────
  function showRemoteScreen(peerId) {
    const sw = document.getElementById("meet-screen-wrap");
    const sv = document.getElementById("meet-screen-video");
    if (!sw || !sv) return;
    // Use the buffered screen stream if ontrack already routed it
    if (!sv.srcObject && peerScreenStreams[peerId]) {
      sv.srcObject = peerScreenStreams[peerId]; sv.muted = false;
    }
    sw.classList.add("active");
    const lbl = sw.querySelector(".meet-screen-label");
    if (lbl) lbl.textContent = `🖥️ ${peerMeta[peerId]?.nickname || "Peer"} is sharing their screen`;
    document.getElementById("meet-left-col")?.classList.add("has-stream");
    const ph = document.getElementById("meet-stream-placeholder");
    if (ph) ph.style.display = "none";
  }

  function hideRemoteScreen() {
    const sw = document.getElementById("meet-screen-wrap");
    if (sw) sw.classList.remove("active");
    const sv = document.getElementById("meet-screen-video");
    if (sv) { sv.srcObject = null; sv.muted = true; }
    const lbl = sw?.querySelector(".meet-screen-label");
    if (lbl) lbl.textContent = "🖥️ You are sharing your screen";
    const hasUrlStream = document.getElementById("meet-stream-frame-wrap")?.classList.contains("active");
    if (!hasUrlStream && !st.screenOn) {
      document.getElementById("meet-left-col")?.classList.remove("has-stream");
      const ph = document.getElementById("meet-stream-placeholder");
      if (ph) ph.style.display = "";
    }
  }

  // ── WebRTC ─────────────────────────────────────────────
  async function toggleScreenShare() {
    if (st.screenOn) {
      screenStream?.getTracks().forEach(t => t.stop());
      // Remove the dedicated screen senders (camera sender is untouched)
      Object.entries(peers).forEach(([pid, p]) => {
        if (screenSenders[pid]) { try { p.pc.removeTrack(screenSenders[pid]); } catch {} delete screenSenders[pid]; }
      });
      screenStream = null;
      st.screenOn = false;
      // Broadcast stop so remotes clear their screen area
      sbCh?.send({ type:"broadcast", event:"screen_share", payload:{ p: st.peerId, sharing: false } });
      // Hide screen from local main area
      const sw = document.getElementById("meet-screen-wrap");
      if (sw) sw.classList.remove("active");
      const sv = document.getElementById("meet-screen-video");
      if (sv) sv.srcObject = null;
      // Restore gallery-only view if no URL stream is active
      const hasUrlStream = document.getElementById("meet-stream-frame-wrap")?.classList.contains("active");
      if (!hasUrlStream) {
        document.getElementById("meet-left-col")?.classList.remove("has-stream");
        const ph = document.getElementById("meet-stream-placeholder");
        if (ph) ph.style.display = "";
      }
      updateBtns();
      return;
    }
    try {
      // Request screen + system audio
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      st.screenOn = true;
      const screenTrack      = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];

      // Add screen as a SECOND track alongside the camera (never replaceTrack)
      // so both camera (peer tile) and screen (main area) are visible simultaneously.
      Object.entries(peers).forEach(([pid, p]) => {
        try { const s = p.pc.addTrack(screenTrack, screenStream); screenSenders[pid] = s; } catch {}
        if (screenAudioTrack) { try { p.pc.addTrack(screenAudioTrack, screenStream); } catch {} }
      });

      // Show screen locally in the main area
      const sw = document.getElementById("meet-screen-wrap");
      const sv = document.getElementById("meet-screen-video");
      if (sw && sv) { sv.srcObject = screenStream; sv.muted = true; sw.classList.add("active"); }
      document.getElementById("meet-left-col")?.classList.add("has-stream");
      const ph = document.getElementById("meet-stream-placeholder");
      if (ph) ph.style.display = "none";

      // Include the stream ID so remotes can identify the screen stream in ontrack
      sbCh?.send({ type:"broadcast", event:"screen_share",
        payload:{ p: st.peerId, n: st.nickname, sharing: true, streamId: screenStream.id } });

      screenTrack.onended = () => { if (st.screenOn) toggleScreenShare(); };
      sysMsg("📺 You started sharing your screen");
      showToast("Screen sharing started — everyone can see your screen", "success");
      updateBtns();
    } catch { alert2("Screen sharing cancelled or not supported."); }
  }

  // ── Raise Hand ─────────────────────────────────────────
  function toggleHand() {
    st.handRaised = !st.handRaised;
    updateBtns();
    sbCh?.send({ type:"broadcast", event:"hand_raise",
      payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, raised: st.handRaised } });
    sysMsg(st.handRaised ? `✋ You raised your hand` : `You lowered your hand`);
    const localLabel = document.querySelector("#meet-local-vid-wrap .meet-vid-label");
    if (localLabel) localLabel.textContent = (st.handRaised ? "✋ " : "") + "You";
  }

  function handleHandRaise({ p, n, f, raised }) {
    if (!peerMeta[p]) peerMeta[p] = { nickname: n, flag: f || "⚽", handRaised: false };
    peerMeta[p].handRaised = raised;
    if (raised) {
      sysMsg(`✋ ${f || "⚽"} ${n} raised their hand`);
      showToast(`✋ ${n} raised their hand`, "hand", 5000);
    } else {
      sysMsg(`${f || "⚽"} ${n} lowered their hand`);
    }
    updatePeerLabel(p);
  }

  function updatePeerLabel(peerId) {
    const wrap = document.getElementById(`peer-${peerId}`);
    if (!wrap) return;
    const meta = peerMeta[peerId] || {};
    const lbl = wrap.querySelector(".meet-vid-label");
    if (lbl) lbl.textContent = (meta.handRaised ? "✋ " : "") + (meta.nickname || "Peer");
    const flagEl = wrap.querySelector(".meet-vid-flag");
    if (flagEl) flagEl.innerHTML = (typeof natFlag === "function" && meta.flag) ? natFlag(meta.flag, 18) : (meta.flag || "");
    wrap.classList.toggle("meet-hand-raised", !!meta.handRaised);
  }

  // ── View Toggle (Gallery / Speaker) ───────────────────
  function toggleView() {
    st.viewMode = st.viewMode === "gallery" ? "speaker" : "gallery";
    const grid = document.getElementById("meet-video-grid");
    const btn  = document.getElementById("meet-view-btn");
    if (grid) grid.classList.toggle("meet-video-speaker", st.viewMode === "speaker");
    if (btn)  { btn.textContent = st.viewMode === "gallery" ? "⊞ Gallery" : "👤 Speaker"; btn.classList.toggle("media-active", st.viewMode === "speaker"); }
  }

  // ── Fullscreen ─────────────────────────────────────────
  function toggleFullscreen() {
    const el = document.getElementById("meet-left-col") || document.getElementById("meet-video-grid");
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  // ── Tile Pin / Spotlight ───────────────────────────────
  function pinTile(wrapId) {
    const prevPinned = pinnedTileId;
    // Unpin current
    if (pinnedTileId) {
      document.getElementById(pinnedTileId)?.classList.remove("meet-pinned");
      pinnedTileId = null;
    }
    if (prevPinned === wrapId) {
      // Was already pinned — just unpin
      showToast("Unpinned — back to gallery", "info", 2000);
      return;
    }
    pinnedTileId = wrapId;
    const el = document.getElementById(wrapId);
    el?.classList.add("meet-pinned");
    // Move pinned tile to first position in grid
    const grid = document.getElementById("meet-video-grid");
    if (grid && el) grid.insertBefore(el, grid.firstChild);
    // Auto-switch to speaker view
    if (st.viewMode !== "speaker") toggleView();
    const meta = el?.dataset.peer === "local"
      ? { nickname: "You" }
      : peerMeta[el?.dataset.peer] || { nickname: "Peer" };
    showToast(`📌 ${meta.nickname} pinned to spotlight. Click tile again to unpin.`, "info", 3000);
  }

  // ── Background Blur ─────────────────────────────────────
  function toggleBlur() {
    st.blurOn = !st.blurOn;
    if (localStream) {
      const vt = localStream.getVideoTracks()[0];
      if (vt) {
        // CSS filter approach via the local video element
        const vid = document.getElementById("meet-local-video");
        if (vid) vid.style.filter = st.blurOn ? "blur(8px)" : "";
        // Replicate on remote peers via a visual note only (actual video blur needs
        // MediaStreamTrackProcessor which requires HTTPS + browser support)
      }
    }
    const btn = document.getElementById("meet-blur-btn");
    if (btn) { btn.classList.toggle("media-active", st.blurOn); btn.textContent = st.blurOn ? "✨ Blur On" : "✨ Blur"; }
    showToast(st.blurOn ? "Background blur enabled" : "Background blur off", "info", 2000);
  }

  // ── Meeting Timer ──────────────────────────────────────
  function startTimer() {
    timerStart = Date.now();
    timerInterval = setInterval(() => {
      const el = document.getElementById("meet-timer");
      if (!el) return;
      const totalSec = Math.floor((Date.now() - timerStart) / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      el.textContent = h > 0
        ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
        : `${m}:${String(s).padStart(2,"0")}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerStart = null;
    const el = document.getElementById("meet-timer");
    if (el) el.textContent = "0:00";
  }

  // ── Quality Indicator (3-bar WiFi) ─────────────────────
  function addQualityIndicator(wrapEl) {
    if (wrapEl.querySelector(".meet-tile-quality")) return;
    const q = document.createElement("div");
    q.className = "meet-tile-quality";
    q.innerHTML = '<div class="qb"></div><div class="qb"></div><div class="qb"></div>';
    wrapEl.appendChild(q);
    // Simulate quality fluctuations
    const intervalId = setInterval(() => {
      if (!document.contains(wrapEl)) { clearInterval(intervalId); return; }
      const v = Math.random();
      const bars = q.querySelectorAll(".qb");
      bars[0].style.background = v > 0.15 ? "#2ecc71" : "rgba(255,255,255,0.2)";
      bars[1].style.background = v > 0.4  ? "#2ecc71" : v > 0.15 ? "#f1c40f" : "rgba(255,255,255,0.2)";
      bars[2].style.background = v > 0.65 ? "#2ecc71" : v > 0.4  ? "#f1c40f" : "#e74c3c";
    }, 4000);
  }

  // ── Keyboard Shortcuts ─────────────────────────────────
  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", e => {
      if (!st.joined) return;
      if (["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "m": e.preventDefault(); toggleMic(); break;
        case "v": e.preventDefault(); toggleCam(); break;
        case "h": e.preventDefault(); toggleHand(); break;
        case "p": e.preventDefault(); toggleParticipants(); break;
        case "b": e.preventDefault(); toggleBlur(); break;
        case "s": e.preventDefault(); toggleScreenShare(); break;
        case "escape":
          const modal = document.getElementById("meet-settings-modal");
          if (modal && !modal.classList.contains("hidden")) { modal.classList.add("hidden"); }
          break;
      }
    });
  }

  // ── Mic / Cam ──────────────────────────────────────────
  async function toggleMic() {
    if (!localStream) await startMedia(false);
    if (!localStream) return;
    const t = localStream.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; st.micOn = t.enabled; }
    updateBtns();
    updateLocalVid();
    showToast(st.micOn ? "Microphone on" : "Microphone muted", "info", 1500);
  }

  async function toggleCam() {
    if (!localStream) await startMedia(true);
    if (!localStream) return;
    let vt = localStream.getVideoTracks()[0];
    if (!vt) {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({ video: true });
        vs.getVideoTracks().forEach(track => {
          localStream.addTrack(track);
          Object.values(peers).forEach(p => p.pc.addTrack(track, localStream));
        });
        st.camOn = true;
      } catch { alert2("Camera access denied."); }
    } else {
      vt.enabled = !vt.enabled;
      st.camOn = vt.enabled;
    }
    updateLocalVid();
    updateBtns();
    showToast(st.camOn ? "Camera on" : "Camera off", "info", 1500);
  }

  async function startMedia(withVideo) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
      st.micOn = true;
      st.camOn = withVideo && localStream.getVideoTracks().length > 0;
    } catch {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        st.micOn = true; st.camOn = false;
      } catch { alert2("Mic/camera access denied — check browser permissions."); return; }
    }
    updateLocalVid();
    updateBtns();
    startSpeakerDetection(localStream, "local");
    Object.values(peers).forEach(p => {
      localStream.getTracks().forEach(track => {
        if (!p.pc.getSenders().find(s => s.track === track)) p.pc.addTrack(track, localStream);
      });
    });
  }

  function updateLocalVid() {
    const wrap = document.getElementById("meet-local-vid-wrap");
    const vid  = document.getElementById("meet-local-video");
    if (vid && localStream) { vid.srcObject = localStream; vid.muted = true; vid.play().catch(()=>{}); }
    wrap?.classList.toggle("hidden", !st.micOn && !st.camOn);
    setAvatar("meet-local-vid-wrap", st.nickname || "You");
    showAvatar("meet-local-vid-wrap", !st.camOn && st.micOn);
    updateTileStatus("meet-local-vid-wrap", st.micOn, st.camOn);
    updatePip();
    sbCh?.send({ type:"broadcast", event:"peer_meta",
      payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, handRaised: st.handRaised, micOn: st.micOn, camOn: st.camOn } });
    if (st.participantsOpen) renderParticipantsList();
  }

  function updateBtns() {
    const m  = document.getElementById("meet-mic-btn");
    const c  = document.getElementById("meet-cam-btn");
    const sc = document.getElementById("meet-screen-btn");
    const h  = document.getElementById("meet-hand-btn");
    const bl = document.getElementById("meet-blur-btn");
    if (m)  { m.textContent  = st.micOn    ? "🎙️ Unmute"    : "🔇 Mute";    m.classList.toggle("media-active", st.micOn); }
    if (c)  { c.textContent  = st.camOn    ? "📹 Video On"   : "📷 Video";   c.classList.toggle("media-active", st.camOn); }
    if (sc) { sc.textContent = st.screenOn ? "🖥️ Stop Share" : "🖥️ Share";  sc.classList.toggle("media-active", st.screenOn); sc.classList.toggle("media-danger", st.screenOn); }
    if (h)  { h.textContent  = st.handRaised ? "✋ Lower Hand" : "✋ Hand";   h.classList.toggle("media-active", st.handRaised); }
    if (bl) { bl.textContent = st.blurOn   ? "✨ Blur On"    : "✨ Blur";    bl.classList.toggle("media-active", st.blurOn); }
  }

  function mkPeer(peerId) {
    if (peers[peerId]?.pc) return peers[peerId].pc;
    const pc = new RTCPeerConnection({ iceServers: STUN });
    peers[peerId] = { pc, makingOffer: false };

    pc.onnegotiationneeded = async () => {
      if (peers[peerId]?.makingOffer) return;
      peers[peerId].makingOffer = true;
      try {
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") return;
        await pc.setLocalDescription(offer);
        sbCh?.send({ type:"broadcast", event:"rtc_offer",
          payload:{ from: st.peerId, to: peerId, sdp:{ type: offer.type, sdp: offer.sdp } } });
      } catch(e) { console.warn("onneg:", e); }
      finally { if (peers[peerId]) peers[peerId].makingOffer = false; }
    };

    pc.onicecandidate = e => {
      if (e.candidate && sbCh) sbCh.send({ type:"broadcast", event:"rtc_ice",
        payload:{ from: st.peerId, to: peerId, candidate: e.candidate.toJSON() } });
    };

    pc.ontrack = e => {
      const stream = e.streams?.[0];
      if (!stream) return;
      // Buffer every inbound stream by its id, then classify deterministically.
      if (!peerStreams[peerId]) peerStreams[peerId] = new Map();
      peerStreams[peerId].set(stream.id, stream);
      classifyPeerStreams(peerId);
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected","failed","closed"].includes(pc.connectionState)) {
        document.getElementById(`peer-${peerId}`)?.remove();
        peers[peerId]?.pc?.close();
        delete peers[peerId];
        delete screenSenders[peerId];
        delete peerStreams[peerId];
        delete peerScreenStreams[peerId];
        delete peerScreenStreamIds[peerId];
        if (screenSharingPeer === peerId) { screenSharingPeer = null; hideRemoteScreen(); }
      }
    };

    // Always send camera + mic first, then screen tracks on top if sharing is active
    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    if (st.screenOn && screenStream) {
      screenStream.getVideoTracks().forEach(t => {
        try { const s = pc.addTrack(t, screenStream); screenSenders[peerId] = s; } catch {}
      });
      screenStream.getAudioTracks().forEach(t => { try { pc.addTrack(t, screenStream); } catch {} });
    }
    return pc;
  }

  async function sendOffer(targetId) {
    const pc = mkPeer(targetId);
    if (pc.getTransceivers().length === 0) {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
    }
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sbCh?.send({ type:"broadcast", event:"rtc_offer",
        payload:{ from: st.peerId, to: targetId, sdp:{ type: offer.type, sdp: offer.sdp } } });
    } catch(e) { console.warn("sendOffer:", e); }
  }

  async function handleOffer({ from, sdp }) {
    const pc = peers[from]?.pc || mkPeer(from);
    try {
      if (pc.signalingState === "have-local-offer") {
        await pc.setLocalDescription({ type: "rollback" });
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sbCh?.send({ type:"broadcast", event:"rtc_answer",
        payload:{ from: st.peerId, to: from, sdp:{ type: answer.type, sdp: answer.sdp } } });
    } catch(e) { console.warn("handleOffer:", e); }
  }

  async function handleAnswer({ from, sdp }) {
    const pc = peers[from]?.pc;
    if (pc && pc.signalingState === "have-local-offer")
      await pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(()=>{});
  }

  async function handleIce({ from, candidate }) {
    const pc = peers[from]?.pc;
    if (pc && candidate) try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
  }

  // Deterministically route a peer's inbound streams: the stream whose id matches the
  // broadcast screen id goes to the main screen container; everything else is the
  // camera/mic stream and goes to the peer's grid tile. Order-independent and
  // self-correcting — re-running this after the screen broadcast arrives moves a
  // mis-placed screen stream out of the tile and into the container.
  function classifyPeerStreams(peerId) {
    const map = peerStreams[peerId];
    if (!map) return;
    const screenId = peerScreenStreamIds[peerId];
    const tileVid = document.getElementById(`peer-${peerId}`)?.querySelector("video");
    const sv = document.getElementById("meet-screen-video");

    map.forEach((stream, id) => {
      const isScreen = !!screenId && id === screenId;
      if (isScreen) {
        peerScreenStreams[peerId] = stream;
        // Never let the screen stream sit in the camera tile.
        if (tileVid && tileVid.srcObject === stream) tileVid.srcObject = null;
        if (screenSharingPeer === peerId && sv && sv.srcObject !== stream) { sv.srcObject = stream; sv.muted = false; }
      } else {
        // Camera/mic stream → grid tile.
        renderRemote(peerId, stream);
      }
    });
  }

  function renderRemote(peerId, stream) {
    const grid = document.getElementById("meet-video-grid");
    if (!grid) return;
    let wrap = document.getElementById(`peer-${peerId}`);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = `peer-${peerId}`;
      wrap.className = "meet-peer-video";
      wrap.dataset.peer = peerId;
      const vid = document.createElement("video");
      vid.autoplay = true; vid.playsInline = true;
      const meta = peerMeta[peerId] || {};
      // Avatar fallback
      const av = document.createElement("div");
      av.className = "meet-avatar";
      const avSpan = document.createElement("span");
      avSpan.textContent = getInitials(meta.nickname || "?");
      av.appendChild(avSpan);
      av.style.background = avatarColor(meta.nickname || "");
      // Flag
      const flag = document.createElement("span");
      flag.className = "meet-vid-flag";
      if (typeof natFlag === "function" && meta.flag) { flag.innerHTML = natFlag(meta.flag, 18); }
      else { flag.textContent = meta.flag || ""; }
      // Label
      const lbl = document.createElement("div");
      lbl.className = "meet-vid-label"; lbl.textContent = (meta.handRaised ? "✋ " : "") + (meta.nickname || "Peer");
      // Status icons
      const statusRow = document.createElement("div");
      statusRow.className = "meet-vid-status";
      statusRow.appendChild(flag);
      // Tile status (mic/cam)
      const tileStatus = document.createElement("div");
      tileStatus.className = "meet-tile-status";
      // Quality indicator
      const qual = document.createElement("div");
      qual.className = "meet-tile-quality";
      qual.innerHTML = '<div class="qb"></div><div class="qb"></div><div class="qb"></div>';
      // Hover overlay with pin hint
      const overlay = document.createElement("div");
      overlay.className = "meet-tile-overlay";
      overlay.innerHTML = '<span class="tile-pin-hint">📌 Click to pin</span>';

      wrap.appendChild(vid); wrap.appendChild(av); wrap.appendChild(statusRow);
      wrap.appendChild(tileStatus); wrap.appendChild(qual); wrap.appendChild(lbl);
      wrap.appendChild(overlay);
      grid.appendChild(wrap);

      // Click to pin
      wrap.addEventListener("click", () => pinTile(`peer-${peerId}`));

      // Start quality simulation
      addQualityIndicator(wrap);
      askPeerMeta();
    }
    const vid = wrap.querySelector("video");
    // Only replace srcObject when the new stream has video, or there is no current stream.
    // This prevents an audio-only stream (e.g. screen system-audio track) from blanking
    // out the peer tile while the video track is still arriving via replaceTrack().
    if (stream.getVideoTracks().length > 0 || !vid.srcObject) vid.srcObject = stream;
    // Speaker detection on audio tracks
    const audioStream = new MediaStream(stream.getAudioTracks());
    if (audioStream.getAudioTracks().length > 0) startSpeakerDetection(audioStream, peerId);
    // Avatar visibility
    const hasVideo = stream.getVideoTracks().some(t => t.enabled && t.readyState === "live");
    const meta = peerMeta[peerId] || {};
    setAvatar(`peer-${peerId}`, meta.nickname || "Peer");
    showAvatar(`peer-${peerId}`, !hasVideo);
    updatePeerLabel(peerId);
    // If this peer is sharing their screen, mirror their stream to the main area
    if (peerId === screenSharingPeer) showRemoteScreen(peerId);
  }

  function askPeerMeta() {
    sbCh?.send({ type:"broadcast", event:"peer_meta",
      payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, handRaised: st.handRaised, micOn: st.micOn, camOn: st.camOn } });
  }

  // ── Active Speaker Detection ───────────────────────────
  function startSpeakerDetection(stream, peerId) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const vol = data.reduce((a, b) => a + b, 0) / data.length;
        speakerVolumes[peerId] = vol;
        const elId = peerId === "local" ? "meet-local-vid-wrap" : `peer-${peerId}`;
        const el = document.getElementById(elId);
        if (el) el.classList.toggle("meet-speaking", vol > 8);

        // Auto-spotlight dominant speaker in speaker view when nothing is pinned
        if (!pinnedTileId && st.viewMode === "speaker" && vol > 8) {
          const sorted = Object.entries(speakerVolumes).sort((a, b) => b[1] - a[1]);
          if (sorted.length > 0 && sorted[0][0] === peerId) {
            const grid = document.getElementById("meet-video-grid");
            if (el && grid && el !== grid.firstChild) grid.insertBefore(el, grid.firstChild);
          }
        }
      }, 120);

      if (speakerAnalysers[peerId]) clearInterval(speakerAnalysers[peerId].interval);
      speakerAnalysers[peerId] = { analyser, data, interval };
    } catch(e) { console.warn("speaker detection:", e); }
  }

  function stopSpeakerDetection(peerId) {
    const a = speakerAnalysers[peerId];
    if (a) { clearInterval(a.interval); delete speakerAnalysers[peerId]; }
    delete speakerVolumes[peerId];
    const elId = peerId === "local" ? "meet-local-vid-wrap" : `peer-${peerId}`;
    document.getElementById(elId)?.classList.remove("meet-speaking");
  }

  // ── Avatar / Initials ──────────────────────────────────
  function getInitials(name) {
    return (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  }

  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return `hsl(${Math.abs(h) % 360},55%,42%)`;
  }

  function setAvatar(wrapId, name) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    let av = wrap.querySelector(".meet-avatar");
    if (!av) { av = document.createElement("div"); av.className = "meet-avatar"; wrap.appendChild(av); }
    const span = av.querySelector("span") || document.createElement("span");
    span.textContent = getInitials(name);
    if (!av.contains(span)) av.appendChild(span);
    av.style.background = avatarColor(name);
  }

  function showAvatar(wrapId, show) {
    const wrap = document.getElementById(wrapId);
    wrap?.querySelector(".meet-avatar")?.classList.toggle("visible", show);
    const vid = wrap?.querySelector("video");
    if (vid) vid.style.opacity = show ? "0" : "1";
  }

  // ── Tile Status Icons ──────────────────────────────────
  function updateTileStatus(wrapId, micOn, camOn) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    let status = wrap.querySelector(".meet-tile-status");
    if (!status) { status = document.createElement("div"); status.className = "meet-tile-status"; wrap.appendChild(status); }
    status.innerHTML = (!micOn ? `<span class="tile-icon tile-muted">🔇</span>` : "") +
                       (!camOn ? `<span class="tile-icon tile-nocam">📷</span>` : "");
  }

  // ── Participants Panel ─────────────────────────────────
  function toggleParticipants() {
    st.participantsOpen = !st.participantsOpen;
    const panel = document.getElementById("meet-participants-panel");
    const btn   = document.getElementById("meet-participants-btn");
    panel?.classList.toggle("hidden", !st.participantsOpen);
    btn?.classList.toggle("media-active", st.participantsOpen);
    if (st.participantsOpen) renderParticipantsList();
  }

  function renderParticipantsList() {
    const list = document.getElementById("meet-participants-list");
    if (!list) return;
    const users = [];
    users.push({ id: st.peerId, nickname: st.nickname, flag: st.teamFlag, self: true,
      micOn: st.micOn, camOn: st.camOn, handRaised: st.handRaised });
    Object.entries(peerMeta).forEach(([id, m]) => {
      users.push({ id, nickname: m.nickname, flag: m.flag, self: false,
        micOn: m.micOn !== false, camOn: m.camOn !== false, handRaised: m.handRaised });
    });
    list.innerHTML = users.map(u => `
      <div class="meet-participant-row${u.self ? " self" : ""}">
        <span class="meet-participant-avatar" style="background:${avatarColor(u.nickname)}">${getInitials(u.nickname)}</span>
        <span class="meet-participant-flag">${typeof natFlag === "function" ? natFlag(u.flag, 18) : (u.flag || "⚽")}</span>
        <span class="meet-participant-name">${esc(u.nickname)}${u.self ? " (you)" : ""}</span>
        <span class="meet-participant-icons">
          ${u.handRaised ? "✋" : ""}
          ${!u.micOn ? "🔇" : ""}
          ${!u.camOn ? "📷" : ""}
        </span>
      </div>`).join("");
  }

  // ── Device Settings ────────────────────────────────────
  async function openSettings() {
    const modal = document.getElementById("meet-settings-modal");
    modal?.classList.remove("hidden");
    const micSel = document.getElementById("meet-mic-select");
    const camSel = document.getElementById("meet-cam-select");
    if (!micSel || !camSel) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      micSel.innerHTML = devices.filter(d => d.kind === "audioinput")
        .map(d => `<option value="${d.deviceId}">${d.label || "Mic " + d.deviceId.slice(0,6)}</option>`).join("");
      camSel.innerHTML = devices.filter(d => d.kind === "videoinput")
        .map(d => `<option value="${d.deviceId}">${d.label || "Camera " + d.deviceId.slice(0,6)}</option>`).join("");
    } catch(e) { alert2("Cannot list devices — grant permissions first."); }
  }

  async function applyDevices() {
    const micId = document.getElementById("meet-mic-select")?.value;
    const camId = document.getElementById("meet-cam-select")?.value;
    document.getElementById("meet-settings-modal")?.classList.add("hidden");
    if (!micId && !camId) return;
    const constraints = { audio: micId ? { deviceId: { exact: micId } } : true,
                          video: camId ? { deviceId: { exact: camId } } : st.camOn };
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream?.getTracks().forEach(t => t.stop());
      localStream = newStream;
      st.micOn = newStream.getAudioTracks().length > 0;
      st.camOn = newStream.getVideoTracks().length > 0;
      updateLocalVid();
      updateBtns();
      Object.values(peers).forEach(p => {
        newStream.getTracks().forEach(track => {
          const sender = p.pc.getSenders().find(s => s.track?.kind === track.kind);
          if (sender) sender.replaceTrack(track).catch(() => {});
          else p.pc.addTrack(track, newStream);
        });
      });
      stopSpeakerDetection("local");
      startSpeakerDetection(newStream, "local");
      sysMsg("🎙️ Switched to new devices");
      showToast("Devices switched successfully", "success");
    } catch(e) { alert2("Could not switch device: " + e.message); }
  }

  // ── Chat Unread Badge ──────────────────────────────────
  function markUnread() {
    const box = document.getElementById("meet-messages");
    const atBottom = !box || (box.scrollHeight - box.scrollTop - box.clientHeight < 60);
    if (atBottom) return;
    st.unreadCount++;
    const badge = document.getElementById("meet-chat-badge");
    if (badge) { badge.textContent = st.unreadCount; badge.classList.remove("hidden"); }
  }

  function clearUnread() {
    st.unreadCount = 0;
    const badge = document.getElementById("meet-chat-badge");
    if (badge) badge.classList.add("hidden");
  }

  // ── Leave ──────────────────────────────────────────────
  function confirmLeave() {
    const dialog = document.getElementById("meet-leave-dialog");
    dialog?.classList.remove("hidden");
  }

  async function leave() {
    document.getElementById("meet-leave-dialog")?.classList.add("hidden");
    await sbCh?.untrack();
    await sbCh?.unsubscribe();
    sbCh = null;
    localStream?.getTracks().forEach(t => t.stop());
    localStream = null;
    screenStream?.getTracks().forEach(t => t.stop());
    screenStream = null;
    Object.keys(speakerAnalysers).forEach(id => stopSpeakerDetection(id));
    peerMeta = {};
    prevPresenceIds = new Set();
    speakerVolumes = {};
    pinnedTileId = null;
    screenSharingPeer = null;
    st.screenOn = false; st.handRaised = false; st.viewMode = "gallery";
    st.participantsOpen = false; st.unreadCount = 0; st.blurOn = false;
    Object.values(peers).forEach(p => p.pc.close());
    peers = {};
    st = { ...st, roomId:null, joined:false, micOn:false, camOn:false, peerId:null };

    stopTimer();
    document.body.classList.remove("meet-active");

    const iframe = document.getElementById("meet-stream-iframe");
    if (iframe) iframe.src = "about:blank";
    document.getElementById("meet-stream-fallback")?.classList.add("hidden");
    const fw = document.getElementById("meet-stream-frame-wrap");
    fw?.classList.remove("active");
    const sw = document.getElementById("meet-screen-wrap");
    if (sw) sw.classList.remove("active");
    const sv = document.getElementById("meet-screen-video");
    if (sv) sv.srcObject = null;
    document.getElementById("meet-stream-placeholder").style.display = "";
    document.getElementById("meet-left-col")?.classList.remove("has-stream");
    document.getElementById("meet-pip-tile")?.classList.remove("visible");
    document.getElementById("meet-messages").innerHTML = "";
    document.getElementById("meet-presence-bar").innerHTML = "";

    const grid = document.getElementById("meet-video-grid");
    if (grid) grid.innerHTML = `
      <div id="meet-local-vid-wrap" class="meet-peer-video meet-local hidden" data-peer="local">
        <video id="meet-local-video" autoplay muted playsinline></video>
        <div class="meet-avatar"><span></span></div>
        <div class="meet-tile-status"></div>
        <div class="meet-tile-quality"><div class="qb"></div><div class="qb"></div><div class="qb"></div></div>
        <div class="meet-vid-label">You</div>
        <div class="meet-tile-overlay"><span class="tile-pin-hint">📌 Click to pin</span></div>
      </div>`;

    // Re-wire local tile click
    document.getElementById("meet-local-vid-wrap")?.addEventListener("click", () => pinTile("meet-local-vid-wrap"));

    document.getElementById("meet-room")?.classList.add("hidden");
    document.getElementById("meet-landing")?.classList.remove("hidden");
    resetTheme();
  }

  // ── UI ─────────────────────────────────────────────────
  function showRoom(roomId) {
    document.getElementById("meet-landing")?.classList.add("hidden");
    document.getElementById("meet-room")?.classList.remove("hidden");
    document.body.classList.add("meet-active");
    const code = document.getElementById("meet-room-code-display");
    if (code) code.textContent = roomId;
    const shareInp = document.getElementById("meet-share-url");
    if (shareInp) shareInp.value = location.href.split("?")[0].split("#")[0] + `?room=${roomId}`;
    startTimer();
    initPip();
  }

  function bindRoom() {
    document.getElementById("meet-send-btn")?.addEventListener("click", sendMsg);
    document.getElementById("meet-msg-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    document.getElementById("meet-leave-btn")?.addEventListener("click", confirmLeave);
    document.getElementById("meet-leave-confirm")?.addEventListener("click", leave);
    document.getElementById("meet-leave-cancel")?.addEventListener("click", () =>
      document.getElementById("meet-leave-dialog")?.classList.add("hidden"));
    document.getElementById("meet-copy-link-btn")?.addEventListener("click", copyLink);
    document.getElementById("meet-mic-btn")?.addEventListener("click", toggleMic);
    document.getElementById("meet-cam-btn")?.addEventListener("click", toggleCam);
    document.getElementById("meet-blur-btn")?.addEventListener("click", toggleBlur);
    document.getElementById("meet-screen-btn")?.addEventListener("click", toggleScreenShare);
    document.getElementById("meet-hand-btn")?.addEventListener("click", toggleHand);
    document.getElementById("meet-participants-btn")?.addEventListener("click", toggleParticipants);
    document.getElementById("meet-settings-btn")?.addEventListener("click", openSettings);
    document.getElementById("meet-close-participants")?.addEventListener("click", toggleParticipants);
    document.getElementById("meet-close-settings")?.addEventListener("click", () =>
      document.getElementById("meet-settings-modal")?.classList.add("hidden"));
    document.getElementById("meet-apply-devices")?.addEventListener("click", applyDevices);
    document.getElementById("meet-messages")?.addEventListener("scroll", () => {
      const box = document.getElementById("meet-messages");
      if (box && box.scrollHeight - box.scrollTop - box.clientHeight < 60) clearUnread();
    });
    document.getElementById("meet-view-btn")?.addEventListener("click", toggleView);
    document.getElementById("meet-fullscreen-btn")?.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", () => {
      const btn = document.getElementById("meet-fullscreen-btn");
      if (btn) btn.textContent = document.fullscreenElement ? "⛶ Exit Full" : "⛶ Fullscreen";
    });
    document.getElementById("meet-stream-go")?.addEventListener("click", () => {
      const url = (document.getElementById("meet-stream-input")?.value || "").trim();
      if (url) loadStream(url, true);
    });
    document.getElementById("meet-stream-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("meet-stream-go")?.click();
    });
    document.querySelectorAll(".emoji-reaction-btn").forEach(btn => {
      btn.addEventListener("click", () => sendEmoji(btn.dataset.emoji));
    });
    // Local tile click to pin
    document.getElementById("meet-local-vid-wrap")?.addEventListener("click", () => pinTile("meet-local-vid-wrap"));
    // Close leave dialog on backdrop click
    document.getElementById("meet-leave-dialog")?.parentElement?.addEventListener("click", e => {
      if (e.target.id === "meet-leave-overlay") document.getElementById("meet-leave-dialog")?.classList.add("hidden");
    });
  }

  function copyLink() {
    const url = document.getElementById("meet-share-url")?.value;
    if (!url) return;
    const btn = document.getElementById("meet-copy-link-btn");
    const origText = btn?.textContent;
    const doSuccess = () => {
      showToast("Link copied to clipboard!", "success");
      if (btn) {
        btn.textContent = "✓ Copied!";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = origText; btn.classList.remove("copied"); }, 2000);
      }
    };
    navigator.clipboard.writeText(url).then(doSuccess)
      .catch(() => { document.getElementById("meet-share-url")?.select(); document.execCommand("copy"); doSuccess(); });
  }

  // ── Theme ──────────────────────────────────────────────
  function renderThemeChips() {
    const row = document.getElementById("meet-themes-row");
    if (!row) return;
    const ids = ["esp","fra","bel","arg","eng","bra","por","ned","ger","col","mex","usa","jpn","kor","nor","swe"];
    row.innerHTML = ids.map(id => {
      const th   = TEAM_THEMES[id];
      const team = (typeof TEAMS !== "undefined") ? TEAMS.find(x => x.id === id) : null;
      const fc   = (typeof FLAG_CODES !== "undefined") ? FLAG_CODES[id] : null;
      const emoji = team?.flag || "🏳️";
      const inner = fc
        ? `<span class="tc-emoji">${emoji}</span><img class="tc-img" src="https://flagcdn.com/w48/${fc}.png" alt="" onerror="this.style.display='none'" />`
        : `<span class="tc-emoji">${emoji}</span>`;
      return `<button class="theme-chip" style="--chip-color:${th?.accent||"#e50914"}"
        title="${team?.name||id}" onclick="MeetSystem.previewTheme('${id}')">
        ${inner}
      </button>`;
    }).join("");
  }

  // ── Player DPs strip ───────────────────────────────────
  function renderMeetPlayers() {
    const strip = document.getElementById("meet-players-strip");
    if (!strip || typeof PLAYERS === "undefined") return;
    const top = PLAYERS
      .filter(p => p.teamId && p.rating >= 8.0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 20);
    if (!top.length) return;
    strip.innerHTML =
      '<div class="mps-label">⭐ Star Players at WC 2026</div>' +
      '<div class="mps-row">' +
      top.map(p => {
        const ph = typeof getPlayerPhoto === "function" ? getPlayerPhoto(p.name) : { src:"", fallback:"" };
        const team = typeof TEAMS !== "undefined" ? TEAMS.find(t => t.id === p.teamId) : null;
        const ovr  = Math.round(p.rating * 10);
        return `<div class="mps-card" title="${p.name} · ${team?.name||""}">
          <div class="mps-photo-wrap">
            <img class="mps-photo" src="${ph.src}" onerror="this.src='${ph.fallback}'" alt="${p.name}" />
            <span class="mps-flag" style="font-size:0;">${team && typeof flagImg === "function" ? flagImg(team.id, 20) : ""}</span>
          </div>
          <div class="mps-name">${p.name.split(" ").pop()}</div>
          <div class="mps-ovr">${ovr}</div>
        </div>`;
      }).join("") +
      '</div>';
  }

  function previewTheme(teamId) {
    applyTheme(teamId);
    const sel = document.getElementById("meet-team-select");
    if (sel) for (const opt of sel.options) {
      if (opt.dataset.id === teamId) { sel.value = opt.value; break; }
    }
    // Visual selected ring on the chip
    document.querySelectorAll(".theme-chip").forEach(c => c.classList.remove("selected"));
    const chips = document.querySelectorAll(".theme-chip");
    const ids = ["esp","fra","bel","arg","eng","bra","por","ned","ger","col","mex","usa","jpn","kor","nor","swe"];
    const idx = ids.indexOf(teamId);
    if (idx >= 0 && chips[idx]) chips[idx].classList.add("selected");
  }

  function applyTheme(teamId) {
    const th = TEAM_THEMES[teamId];
    const r  = document.documentElement;
    r.style.setProperty("--meet-accent",   th?.accent  || "var(--accent)");
    r.style.setProperty("--meet-bg-tint",  th?.bg      || "rgba(229,9,20,0.05)");
    r.style.setProperty("--meet-badge",    th?.badge   || "var(--accent)");
  }

  function resetTheme() {
    const r = document.documentElement;
    r.style.removeProperty("--meet-accent");
    r.style.removeProperty("--meet-bg-tint");
    r.style.removeProperty("--meet-badge");
  }

  // ── Helpers ────────────────────────────────────────────
  function checkUrlRoom() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (!code) {
      const m = location.hash.match(/room=([A-Z0-9-]+)/i);
      if (m) {
        const inp = document.getElementById("meet-room-code-input");
        if (inp) inp.value = m[1].toUpperCase();
      }
      return;
    }
    const inp = document.getElementById("meet-room-code-input");
    if (inp) inp.value = code.toUpperCase();
  }

  function genId() {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return "WC-" + Array.from({length:5}, () => c[Math.floor(Math.random()*c.length)]).join("");
  }

  function alert2(msg) {
    const el = document.getElementById("meet-alert");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("visible"), 3500);
  }

  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  return { init, previewTheme, checkUrlRoom };
})();
