// ============================================================
// Meet Rooms — Zoom-style UI + Supabase Realtime + WebRTC
// ============================================================

const MeetSystem = (() => {

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
  };
  let sbCh = null;
  let localStream = null;
  let screenStream = null;
  let peers = {};
  let _timerStart = null;
  let _timerInterval = null;

  // ── Init ───────────────────────────────────────────────
  function init() {
    bindLanding();
    renderThemeChips();
    checkUrlRoom();
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
    startTimer();
    await subscribe(roomId);
    await loadHistory(roomId);
    // Fetch and auto-load any existing stream for this room
    try {
      const { data } = await _sb.from("rooms").select("stream_url").eq("id", roomId).maybeSingle();
      if (data?.stream_url) {
        loadStream(data.stream_url, false);
        sysMsg("Loading the room's current stream…");
      }
    } catch(e) { /* non-fatal */ }
    sysMsg(`You joined as ${st.teamFlag} ${st.nickname}`);
    // Set local tile
    setLocalTileInfo();
  }

  function setLocalTileInfo() {
    const initials = document.getElementById("zroom-local-initials");
    const nameEl   = document.getElementById("zroom-local-name");
    if (initials) initials.textContent = (st.nickname || "?")[0].toUpperCase();
    if (nameEl)   nameEl.textContent   = `${st.teamFlag} ${st.nickname} (you)`;
  }

  // ── Timer ──────────────────────────────────────────────
  function startTimer() {
    _timerStart = Date.now();
    _timerInterval = setInterval(() => {
      const el = document.getElementById("zroom-timer");
      if (!el) return;
      const s = Math.floor((Date.now() - _timerStart) / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      el.textContent = h > 0
        ? `${pad(h)}:${pad(m)}:${pad(sec)}`
        : `${pad(m)}:${pad(sec)}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  // ── Supabase Realtime ──────────────────────────────────
  async function subscribe(roomId) {
    sbCh = _sb.channel(`meet:${roomId}`, {
      config: { presence: { key: st.peerId }, broadcast: { self: false } }
    });

    sbCh
      .on("presence", { event: "sync" }, () => renderPresence(sbCh.presenceState()))
      .on("broadcast", { event: "chat"        }, ({ payload }) => { appendMsg(payload); if (typeof window._onNewMsg === "function") window._onNewMsg(); })
      .on("broadcast", { event: "emoji_pop"   }, ({ payload }) => rain(payload.e))
      .on("broadcast", { event: "stream_sync" }, ({ payload }) => loadStream(payload.url, false))
      .on("broadcast", { event: "rtc_hello"   }, ({ payload }) => { if (payload.p !== st.peerId) sendOffer(payload.p); })
      .on("broadcast", { event: "rtc_offer"   }, ({ payload }) => { if (payload.to === st.peerId) handleOffer(payload); })
      .on("broadcast", { event: "rtc_answer"  }, ({ payload }) => { if (payload.to === st.peerId) handleAnswer(payload); })
      .on("broadcast", { event: "rtc_ice"     }, ({ payload }) => { if (payload.to === st.peerId) handleIce(payload); });

    await sbCh.subscribe(async status => {
      if (status !== "SUBSCRIBED") return;
      await sbCh.track({ n: st.nickname, f: st.teamFlag, id: st.teamId, p: st.peerId, t: Date.now() });
      sbCh.send({ type:"broadcast", event:"rtc_hello", payload:{ p: st.peerId, n: st.nickname } });
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
    box.scrollTop = box.scrollHeight;
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

  // ── Presence ───────────────────────────────────────────
  function renderPresence(ps) {
    const strip   = document.getElementById("meet-presence-bar");
    const countEl = document.getElementById("zroom-count-num");
    const users   = Object.values(ps).flat();

    if (countEl) countEl.textContent = users.length;

    // Presence chips at top of gallery
    if (strip) {
      strip.innerHTML = users.map(u => `
        <div class="meet-user-chip${u.p === st.peerId ? " meet-user-me" : ""}">
          <span>${u.f}</span>
          <span>${esc(u.n)}${u.p === st.peerId ? " (you)" : ""}</span>
        </div>`).join("");
    }

    // People panel list
    const peopleList = document.getElementById("zroom-people-list");
    if (peopleList) {
      peopleList.innerHTML = users.map(u => `
        <div class="zroom-person-row">
          <div class="zroom-person-avatar">${u.n[0]?.toUpperCase() || "?"}</div>
          <span class="zroom-person-name">${esc(u.n)}${u.p === st.peerId ? " (you)" : ""}</span>
          <span class="zroom-person-flag">${u.f}</span>
        </div>`).join("");
    }
  }

  // ── Emoji Reactions (Zoom/Meet-style floating overlay) ──
  function sendEmoji(e) {
    rain(e, st.teamFlag, true);
    sbCh?.send({ type:"broadcast", event:"emoji_pop", payload:{ e, f: st.teamFlag, n: st.nickname } });
  }

  function rain(emoji, flag, self = false) {
    const container = document.getElementById("meet-emoji-rain");
    if (!container) return;

    // A labelled "burst" pill rises from a random spot near the bottom —
    // shows who reacted, Google-Meet style.
    const lane = 8 + Math.random() * 78; // % from left
    if (flag) {
      const pill = document.createElement("span");
      pill.className = "emoji-pill" + (self ? " emoji-pill-self" : "");
      pill.innerHTML = `<span class="emoji-pill-flag">${flag}</span><span class="emoji-pill-emoji">${emoji}</span>`;
      pill.style.left = lane + "%";
      pill.style.animationDuration = (2 + Math.random() * 0.8) + "s";
      container.appendChild(pill);
      pill.addEventListener("animationend", () => pill.remove());
    }

    // Trailing cluster of the emoji itself for a lively, celebratory feel
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement("span");
        el.className = "emoji-float";
        el.textContent = emoji;
        el.style.left = (lane - 6 + Math.random() * 18) + "%";
        el.style.fontSize = (1.4 + Math.random() * 1.6) + "rem";
        el.style.animationDuration = (1.3 + Math.random() * 1) + "s";
        container.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
      }, i * 90);
    }
  }

  // ── Stream URL normalization ───────────────────────────
  function toYouTubeEmbed(url) {
    let m = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
    m = url.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
    if (/youtube\.com\/embed\//.test(url)) return url;
    return null;
  }

  function isLikelyEmbeddable(url) {
    const blocked = [
      "foxsports.com","beinsports.com","tsn.ca","bbc.co.uk","peacocktv.com",
      "dazn.com","sonyliv.com","hotstar.com","zee5.com","fancode.com",
      "epicsports.online","fifa.com/fifaplus",
    ];
    return !blocked.some(d => url.includes(d));
  }

  function normalizeStreamUrl(raw) {
    const url = (raw || "").trim();
    if (!url) return { ok: false, reason: "Please enter a stream URL." };
    try { new URL(url); } catch { return { ok: false, reason: "That doesn't look like a valid URL." }; }
    const ytEmbed = toYouTubeEmbed(url);
    if (ytEmbed) return { ok: true, url: ytEmbed, embeddable: true };
    return { ok: true, url, embeddable: isLikelyEmbeddable(url) };
  }

  // ── Stream Sync ────────────────────────────────────────
  async function loadStream(url, broadcast = true) {
    const normalized = normalizeStreamUrl(url);
    if (!normalized.ok) { alert2(normalized.reason); return; }
    const finalUrl = normalized.url;

    const iframe     = document.getElementById("meet-stream-iframe");
    const wrap       = document.getElementById("meet-stream-frame-wrap");
    const actionsBar = document.getElementById("meet-stream-actions");
    const inp        = document.getElementById("meet-stream-input");
    const openLink   = document.getElementById("meet-stream-open-link");
    const statusEl   = document.getElementById("meet-stream-status");

    if (inp)        inp.value = finalUrl;
    if (openLink)   openLink.href = finalUrl;
    if (statusEl)   statusEl.textContent = "";
    if (actionsBar) actionsBar.style.display = "flex";

    // Reset iframe before new src to avoid stale content
    if (iframe) { iframe.src = "about:blank"; setTimeout(() => { iframe.src = finalUrl; }, 50); }
    wrap?.classList.remove("hidden");

    console.log("[MeetStream] Loading:", finalUrl, "embeddable:", normalized.embeddable);

    // Iframe load / error / timeout handling
    if (iframe) {
      let warned = false;
      const showEmbedWarning = () => {
        if (warned) return;
        warned = true;
        const msg = "This stream provider blocks in-app playback — use 'Open Stream' to watch in a new tab.";
        if (statusEl) statusEl.textContent = msg;
        sysMsg("Stream blocked by provider — click Open Stream below the player.");
        console.log("[MeetStream] embed blocked or timed out for:", finalUrl);
      };
      const onLoad = () => {
        console.log("[MeetStream] iframe load event fired");
        clearTimeout(loadTimer);
      };
      iframe.removeEventListener("load", onLoad);
      iframe.removeEventListener("error", showEmbedWarning);
      iframe.addEventListener("load", onLoad, { once: true });
      iframe.addEventListener("error", showEmbedWarning, { once: true });
      const loadTimer = setTimeout(showEmbedWarning, 8000);
      if (!normalized.embeddable) setTimeout(showEmbedWarning, 400);
    }

    _lastSyncedUrl = finalUrl;

    if (broadcast) {
      sbCh?.send({ type:"broadcast", event:"stream_sync", payload:{ url: finalUrl } });
      try {
        await _sb.from("rooms").upsert(
          { id: st.roomId, stream_url: finalUrl, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      } catch(e) { /* non-fatal */ }
      sysMsg(`${st.teamFlag} ${st.nickname} synced a stream for everyone`);
    } else {
      sysMsg("Stream synced — if it doesn't load, click Open Stream below the player.");
    }
  }

  // ── WebRTC ─────────────────────────────────────────────
  async function toggleMic() {
    if (!localStream) await startMedia(false);
    if (!localStream) return;
    const t = localStream.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; st.micOn = t.enabled; }
    updateBtns();
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
    updateLocalTile();
    updateBtns();
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
    updateLocalTile();
    updateBtns();
    Object.values(peers).forEach(p => {
      localStream.getTracks().forEach(track => {
        if (!p.pc.getSenders().find(s => s.track === track)) p.pc.addTrack(track, localStream);
      });
    });
  }

  function updateLocalTile() {
    const avatar = document.getElementById("zroom-local-avatar");
    const vid    = document.getElementById("meet-local-video");
    if (vid && localStream) { vid.srcObject = localStream; vid.play().catch(()=>{}); }
    if (vid) vid.classList.toggle("hidden", !st.camOn);
    if (avatar) avatar.style.display = st.camOn ? "none" : "flex";
    // mic icon
    const micIcon = document.getElementById("zroom-local-mic-icon");
    if (micIcon) {
      micIcon.className = st.micOn ? "ztile-mic-on" : "ztile-mic-off";
      micIcon.title = st.micOn ? "Mic on" : "Muted";
      micIcon.innerHTML = st.micOn
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    }
  }

  function updateBtns() {
    const micBtn = document.getElementById("meet-mic-btn");
    const camBtn = document.getElementById("meet-cam-btn");

    if (micBtn) {
      micBtn.classList.toggle("zctrl-muted", !st.micOn);
      micBtn.classList.toggle("zctrl-on",    st.micOn);
      const lbl = micBtn.querySelector(".zctrl-label");
      if (lbl) lbl.textContent = st.micOn ? "Mute" : "Unmute";
      const icon = micBtn.querySelector(".zctrl-icon");
      if (icon) icon.innerHTML = st.micOn
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    }

    if (camBtn) {
      camBtn.classList.toggle("zctrl-muted", !st.camOn);
      camBtn.classList.toggle("zctrl-on",    st.camOn);
      const lbl = camBtn.querySelector(".zctrl-label");
      if (lbl) lbl.textContent = st.camOn ? "Stop Video" : "Start Video";
      const icon = camBtn.querySelector(".zctrl-icon");
      if (icon) icon.innerHTML = st.camOn
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><polygon points="23 7 16 12 23 17 23 7"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    }
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
      if (e.streams?.[0]) renderRemoteTile(peerId, e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected","failed","closed"].includes(pc.connectionState)) {
        document.getElementById(`ztile-${peerId}`)?.remove();
        peers[peerId]?.pc?.close();
        delete peers[peerId];
      }
    };

    // If screen sharing is active, send screen video; otherwise send camera
    if (screenStream) {
      screenStream.getTracks().forEach(t => pc.addTrack(t, screenStream));
    }
    if (localStream) {
      localStream.getTracks().forEach(t => {
        // Skip video if already covered by screenStream
        if (screenStream && t.kind === "video") return;
        if (!pc.getSenders().find(s => s.track === t)) pc.addTrack(t, localStream);
      });
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

  function renderRemoteTile(peerId, stream) {
    const gallery = document.getElementById("zroom-gallery");
    if (!gallery) return;

    let tile = document.getElementById(`ztile-${peerId}`);
    if (!tile) {
      tile = document.createElement("div");
      tile.id = `ztile-${peerId}`;
      tile.className = "ztile";

      // Avatar placeholder
      const avatar = document.createElement("div");
      avatar.className = "ztile-avatar";
      avatar.innerHTML = `<span class="ztile-avatar-initials">P</span>`;

      const vid = document.createElement("video");
      vid.autoplay = true;
      vid.playsInline = true;
      vid.className = "ztile-video";

      const overlay = document.createElement("div");
      overlay.className = "ztile-overlay";
      overlay.innerHTML = `<span class="ztile-name">Peer</span>
        <span class="ztile-mic-off" title="Muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M19 11a7 7 0 0 1-14 0"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </span>`;

      tile.appendChild(avatar);
      tile.appendChild(vid);
      tile.appendChild(overlay);
      gallery.appendChild(tile);
    }

    const vid = tile.querySelector("video");
    const avatar = tile.querySelector(".ztile-avatar");
    if (vid) {
      vid.srcObject = stream;
      const hasVideo = stream.getVideoTracks().length > 0;
      vid.classList.toggle("hidden", !hasVideo);
      if (avatar) avatar.style.display = hasVideo ? "none" : "flex";
    }
  }

  // ── Leave ──────────────────────────────────────────────
  async function leave() {
    stopTimer();
    await sbCh?.untrack();
    await sbCh?.unsubscribe();
    sbCh = null;
    closeFullscreenStream();
    screenStream?.getTracks().forEach(t => t.stop());
    screenStream = null;
    localStream?.getTracks().forEach(t => t.stop());
    localStream = null;
    Object.values(peers).forEach(p => p.pc.close());
    peers = {};
    st = { ...st, roomId:null, joined:false, micOn:false, camOn:false, peerId:null };

    const iframe = document.getElementById("meet-stream-iframe");
    if (iframe) iframe.src = "about:blank";
    document.getElementById("meet-stream-frame-wrap")?.classList.add("hidden");
    document.getElementById("meet-stream-actions")?.style.setProperty("display","none");
    document.getElementById("meet-messages").innerHTML = "";
    document.getElementById("meet-presence-bar").innerHTML = "";
    screenSharers.clear();
    clearScreenContainer();

    // Reset gallery to just the local tile
    const gallery = document.getElementById("zroom-gallery");
    if (gallery) {
      const remoteTiles = gallery.querySelectorAll(".ztile:not(.ztile-local)");
      remoteTiles.forEach(t => t.remove());
    }
    // Reset local tile
    const localAvatar = document.getElementById("zroom-local-avatar");
    const localVid    = document.getElementById("meet-local-video");
    if (localAvatar) localAvatar.style.display = "flex";
    if (localVid)    { localVid.classList.add("hidden"); localVid.srcObject = null; }

    document.getElementById("meet-room-app")?.classList.add("hidden");
    document.getElementById("meet-landing-page")?.classList.remove("hidden");
    resetTheme();

    // close side/stream panels
    if (typeof closeSidePanel === "function") closeSidePanel();
    document.getElementById("zroom-stream-panel")?.classList.add("hidden");
    document.getElementById("zroom-stream-btn")?.classList.remove("zctrl-active");
  }

  // ── UI ─────────────────────────────────────────────────
  function showRoom(roomId) {
    document.getElementById("meet-landing-page")?.classList.add("hidden");
    document.getElementById("meet-room-app")?.classList.remove("hidden");

    const codeEl = document.getElementById("zroom-code-display");
    if (codeEl) codeEl.textContent = roomId;

    const shareInp = document.getElementById("meet-share-url");
    if (shareInp) shareInp.value = location.origin + location.pathname + `?room=${roomId}`;
  }

  function bindRoom() {
    document.getElementById("meet-send-btn")?.addEventListener("click", sendMsg);
    document.getElementById("meet-msg-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    document.getElementById("meet-leave-btn")?.addEventListener("click", leave);
    document.getElementById("zroom-copy-btn")?.addEventListener("click", copyLink);
    document.getElementById("meet-mic-btn")?.addEventListener("click", toggleMic);
    document.getElementById("meet-cam-btn")?.addEventListener("click", toggleCam);
    document.getElementById("meet-screen-btn")?.addEventListener("click", toggleScreenShare);
    document.getElementById("meet-stream-share-focused-btn")?.addEventListener("click", shareStreamFocused);
    document.getElementById("meet-stream-expand-btn")?.addEventListener("click", openFullscreenStream);
    document.getElementById("meet-stream-theater-btn")?.addEventListener("click", toggleTheater);
    document.getElementById("meet-stream-fs-btn")?.addEventListener("click", toggleStreamFullscreen);
    document.getElementById("meet-fs-close-btn")?.addEventListener("click", closeFullscreenStream);
    document.getElementById("meet-fs-share-btn")?.addEventListener("click", () => {
      closeFullscreenStream();
      toggleScreenShare();
    });
    document.getElementById("meet-stream-go")?.addEventListener("click", async () => {
      const url = (document.getElementById("meet-stream-input")?.value || "").trim();
      if (url) await loadStream(url, true);
    });
    document.getElementById("meet-stream-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("meet-stream-go")?.click();
    });
    // Emoji buttons (both in popover and in chat panel)
    document.querySelectorAll(".emoji-reaction-btn").forEach(btn => {
      btn.addEventListener("click", () => sendEmoji(btn.dataset.emoji));
    });
  }

  function copyLink() {
    const url = document.getElementById("meet-share-url")?.value;
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => alert2("Link copied — share it with friends! 🎉"))
      .catch(() => { document.getElementById("meet-share-url")?.select(); document.execCommand("copy"); alert2("Link copied!"); });
  }

  // ── Theme ──────────────────────────────────────────────
  function renderThemeChips() {
    const row = document.getElementById("meet-themes-row");
    if (!row) return;
    const ids = ["esp","fra","bel","arg","eng","bra","por","ned","ger","col","mex","usa","jpn","kor","nor","swe"];
    row.innerHTML = ids.map(id => {
      const th   = TEAM_THEMES[id];
      const team = (typeof TEAMS !== "undefined") ? TEAMS.find(x => x.id === id) : null;
      const flag = (typeof flagImg === "function") ? flagImg(id, 36) : (team?.flag || id.toUpperCase());
      return `<button class="theme-chip" style="--chip-color:${th?.accent||"#e50914"};display:flex;align-items:center;justify-content:center;overflow:hidden;"
        title="${team?.name||id}" onclick="MeetSystem.previewTheme('${id}')">
        ${flag}
      </button>`;
    }).join("");
  }

  function previewTheme(teamId) {
    applyTheme(teamId);
    const sel = document.getElementById("meet-team-select");
    if (sel) for (const opt of sel.options) {
      if (opt.dataset.id === teamId) { sel.value = opt.value; break; }
    }
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
    if (!code) return;
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

  return { init, previewTheme, checkUrlRoom, toggleScreenShare };
})();
