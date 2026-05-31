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
    ned: { accent:"#ff6600", bg:"rgba(255,102,0,0.09)",  badge:"#003da5" },
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
    participantsOpen: false, unreadCount: 0,
  };
  let sbCh = null;
  let localStream = null;
  let screenStream = null;
  let peers = {};
  let peerMeta = {}; // peerId → { nickname, flag, handRaised, micOn, camOn }
  let audioCtx = null;
  let speakerAnalysers = {}; // peerId → { analyser, data, interval }

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
    // Try to register the room — non-fatal if table doesn't exist or RLS blocks it
    try {
      const { error } = await _sb.from("rooms").insert({ id: roomId });
      if (error && error.code !== "23505") {
        console.warn("rooms table insert failed (non-fatal):", error.code, error.message);
        // Continue anyway — Realtime channels work without this table
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
    await subscribe(roomId);
    await loadHistory(roomId);
    sysMsg(`You joined as ${st.teamFlag} ${st.nickname}`);
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
      .on("broadcast", { event: "rtc_hello"   }, ({ payload }) => { if (payload.p !== st.peerId) { peerMeta[payload.p] = { nickname: payload.n, flag: payload.f || "⚽", handRaised: false }; sendOffer(payload.p); } })
      .on("broadcast", { event: "rtc_offer"   }, ({ payload }) => { if (payload.to === st.peerId) handleOffer(payload); })
      .on("broadcast", { event: "rtc_answer"  }, ({ payload }) => { if (payload.to === st.peerId) handleAnswer(payload); })
      .on("broadcast", { event: "rtc_ice"     }, ({ payload }) => { if (payload.to === st.peerId) handleIce(payload); })
      .on("broadcast", { event: "hand_raise"  }, ({ payload }) => handleHandRaise(payload))
      .on("broadcast", { event: "peer_meta"   }, ({ payload }) => {
        if (payload.p !== st.peerId) {
          peerMeta[payload.p] = { nickname: payload.n, flag: payload.f || "⚽", handRaised: payload.handRaised || false, micOn: payload.micOn !== false, camOn: payload.camOn !== false };
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
    // Persist — non-fatal if messages table not set up yet
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

  // ── Presence ───────────────────────────────────────────
  function renderPresence(ps) {
    const bar   = document.getElementById("meet-presence-bar");
    const count = document.getElementById("meet-user-count");
    const users = Object.values(ps).flat();
    if (count) count.textContent = users.length + " watching";
    if (!bar)  return;
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
    const iframe = document.getElementById("meet-stream-iframe");
    const wrap   = document.getElementById("meet-stream-frame-wrap");
    const inp    = document.getElementById("meet-stream-input");
    if (inp)   inp.value = url;
    if (iframe) iframe.src = url;
    wrap?.classList.remove("hidden");
    if (broadcast) {
      sbCh?.send({ type:"broadcast", event:"stream_sync", payload:{ url } });
      sysMsg(`${st.teamFlag} ${st.nickname} synced a stream for everyone`);
    } else {
      sysMsg("Host synced a stream — loading for you…");
    }
  }

  // ── WebRTC ─────────────────────────────────────────────
  // ── Screen Share ───────────────────────────────────────
  async function toggleScreenShare() {
    if (st.screenOn) {
      screenStream?.getTracks().forEach(t => t.stop());
      screenStream = null;
      st.screenOn = false;
      // Replace screen track with camera track (or nothing) in all peers
      const camTrack = localStream?.getVideoTracks()[0] || null;
      Object.values(peers).forEach(p => {
        const sender = p.pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack || null).catch(() => {});
      });
      document.getElementById("meet-screen-share-vid-wrap")?.remove();
      updateBtns();
      return;
    }
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      st.screenOn = true;
      const screenTrack = screenStream.getVideoTracks()[0];
      // Replace video sender in all peers
      Object.values(peers).forEach(p => {
        const sender = p.pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        else p.pc.addTrack(screenTrack, screenStream);
      });
      // Show local preview
      const grid = document.getElementById("meet-video-grid");
      if (grid) {
        let wrap = document.getElementById("meet-screen-share-vid-wrap");
        if (!wrap) {
          wrap = document.createElement("div");
          wrap.id = "meet-screen-share-vid-wrap";
          wrap.className = "meet-peer-video meet-local meet-screen-tile";
          const vid = document.createElement("video");
          vid.autoplay = true; vid.muted = true; vid.playsInline = true;
          const lbl = document.createElement("div");
          lbl.className = "meet-vid-label"; lbl.textContent = "🖥️ Your Screen";
          wrap.appendChild(vid); wrap.appendChild(lbl);
          grid.appendChild(wrap);
        }
        wrap.querySelector("video").srcObject = screenStream;
      }
      screenTrack.onended = () => { if (st.screenOn) toggleScreenShare(); };
      sysMsg("📺 You started sharing your screen");
      updateBtns();
    } catch { alert2("Screen sharing cancelled or not supported."); }
  }

  // ── Raise Hand ─────────────────────────────────────────
  function toggleHand() {
    st.handRaised = !st.handRaised;
    updateBtns();
    sbCh?.send({ type:"broadcast", event:"hand_raise", payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, raised: st.handRaised } });
    sysMsg(st.handRaised ? `✋ You raised your hand` : `You lowered your hand`);
    // Update own label
    const localLabel = document.querySelector("#meet-local-vid-wrap .meet-vid-label");
    if (localLabel) localLabel.textContent = (st.handRaised ? "✋ " : "") + "You";
  }

  function handleHandRaise({ p, n, f, raised }) {
    if (!peerMeta[p]) peerMeta[p] = { nickname: n, flag: f || "⚽", handRaised: false };
    peerMeta[p].handRaised = raised;
    sysMsg(raised ? `✋ ${f || "⚽"} ${n} raised their hand` : `${f || "⚽"} ${n} lowered their hand`);
    updatePeerLabel(p);
  }

  function updatePeerLabel(peerId) {
    const wrap = document.getElementById(`peer-${peerId}`);
    if (!wrap) return;
    const meta = peerMeta[peerId] || {};
    const lbl = wrap.querySelector(".meet-vid-label");
    if (lbl) lbl.textContent = (meta.handRaised ? "✋ " : "") + (meta.nickname || "Peer");
    const flagEl = wrap.querySelector(".meet-vid-flag");
    if (flagEl) flagEl.textContent = meta.flag || "";
    wrap.classList.toggle("meet-hand-raised", !!meta.handRaised);
  }

  // ── View Toggle (Gallery / Speaker) ───────────────────
  function toggleView() {
    st.viewMode = st.viewMode === "gallery" ? "speaker" : "gallery";
    const grid = document.getElementById("meet-video-grid");
    const btn = document.getElementById("meet-view-btn");
    if (grid) grid.classList.toggle("meet-video-speaker", st.viewMode === "speaker");
    if (btn) btn.textContent = st.viewMode === "gallery" ? "⊞ Gallery" : "👤 Speaker";
    if (btn) btn.classList.toggle("media-active", st.viewMode === "speaker");
  }

  // ── Fullscreen ─────────────────────────────────────────
  function toggleFullscreen() {
    const el = document.getElementById("meet-left-col") || document.getElementById("meet-video-grid");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

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
    updateLocalVid();
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
    // Show tile as soon as mic OR cam is active
    wrap?.classList.toggle("hidden", !st.micOn && !st.camOn);
    setAvatar("meet-local-vid-wrap", st.nickname || "You");
    showAvatar("meet-local-vid-wrap", !st.camOn && st.micOn);
    updateTileStatus("meet-local-vid-wrap", st.micOn, st.camOn);
    // Broadcast updated status to peers
    sbCh?.send({ type:"broadcast", event:"peer_meta",
      payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, handRaised: st.handRaised, micOn: st.micOn, camOn: st.camOn } });
    if (st.participantsOpen) renderParticipantsList();
  }

  function updateBtns() {
    const m  = document.getElementById("meet-mic-btn");
    const c  = document.getElementById("meet-cam-btn");
    const sc = document.getElementById("meet-screen-btn");
    const h  = document.getElementById("meet-hand-btn");
    if (m)  { m.textContent  = st.micOn    ? "🎙️ Unmute"   : "🔇 Mute";    m.classList.toggle("media-active", st.micOn); }
    if (c)  { c.textContent  = st.camOn    ? "📹 Video On"  : "📷 Video";   c.classList.toggle("media-active", st.camOn); }
    if (sc) { sc.textContent = st.screenOn ? "🖥️ Stop Share": "🖥️ Share";  sc.classList.toggle("media-active", st.screenOn); sc.classList.toggle("media-danger", st.screenOn); }
    if (h)  { h.textContent  = st.handRaised ? "✋ Lower Hand" : "✋ Hand";  h.classList.toggle("media-active", st.handRaised); }
  }

  function mkPeer(peerId) {
    if (peers[peerId]?.pc) return peers[peerId].pc;
    const pc = new RTCPeerConnection({ iceServers: STUN });
    peers[peerId] = { pc, makingOffer: false };

    // onnegotiationneeded fires whenever addTrack is called on a stable connection
    // (e.g. when either peer enables mic/cam after the initial handshake).
    // Without this, tracks added after the first offer/answer are never sent.
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
      if (e.streams?.[0]) renderRemote(peerId, e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected","failed","closed"].includes(pc.connectionState)) {
        document.getElementById(`peer-${peerId}`)?.remove();
        peers[peerId]?.pc?.close();
        delete peers[peerId];
      }
    };

    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    return pc;
  }

  async function sendOffer(targetId) {
    const pc = mkPeer(targetId);
    // Pre-declare sendrecv transceivers so the remote side can also send tracks
    // even before either user has enabled mic/cam.
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
      // Collision: if we're mid-offer ourselves, roll back before applying theirs
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

  function renderRemote(peerId, stream) {
    const grid = document.getElementById("meet-video-grid");
    if (!grid) return;
    let wrap = document.getElementById(`peer-${peerId}`);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = `peer-${peerId}`;
      wrap.className = "meet-peer-video";
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
      flag.className = "meet-vid-flag"; flag.textContent = meta.flag || "";
      // Label
      const lbl = document.createElement("div");
      lbl.className = "meet-vid-label"; lbl.textContent = (meta.handRaised ? "✋ " : "") + (meta.nickname || "Peer");
      // Status icons
      const statusRow = document.createElement("div");
      statusRow.className = "meet-vid-status";
      statusRow.appendChild(flag);
      const tileStatus = document.createElement("div");
      tileStatus.className = "meet-tile-status";
      wrap.appendChild(vid); wrap.appendChild(av); wrap.appendChild(statusRow); wrap.appendChild(tileStatus); wrap.appendChild(lbl);
      grid.appendChild(wrap);
      // Ask for their meta
      sbCh?.send({ type:"broadcast", event:"peer_meta",
        payload:{ p: st.peerId, n: st.nickname, f: st.teamFlag, handRaised: st.handRaised, micOn: st.micOn, camOn: st.camOn } });
    }
    const vid = wrap.querySelector("video");
    vid.srcObject = stream;
    // Start speaker detection on audio tracks
    const audioStream = new MediaStream(stream.getAudioTracks());
    if (audioStream.getAudioTracks().length > 0) startSpeakerDetection(audioStream, peerId);
    // Show avatar if no video
    const hasVideo = stream.getVideoTracks().some(t => t.enabled && t.readyState === "live");
    const meta = peerMeta[peerId] || {};
    setAvatar(`peer-${peerId}`, meta.nickname || "Peer");
    showAvatar(`peer-${peerId}`, !hasVideo);
    updatePeerLabel(peerId);
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
        const elId = peerId === "local" ? "meet-local-vid-wrap" : `peer-${peerId}`;
        const el = document.getElementById(elId);
        if (el) el.classList.toggle("meet-speaking", vol > 8);
      }, 120);
      if (speakerAnalysers[peerId]) clearInterval(speakerAnalysers[peerId].interval);
      speakerAnalysers[peerId] = { analyser, data, interval };
    } catch(e) { console.warn("speaker detection:", e); }
  }

  function stopSpeakerDetection(peerId) {
    const a = speakerAnalysers[peerId];
    if (a) { clearInterval(a.interval); delete speakerAnalysers[peerId]; }
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
    // Build from presence + own entry
    const users = [];
    // self
    users.push({ id: st.peerId, nickname: st.nickname, flag: st.teamFlag, self: true,
      micOn: st.micOn, camOn: st.camOn, handRaised: st.handRaised });
    // peers
    Object.entries(peerMeta).forEach(([id, m]) => {
      users.push({ id, nickname: m.nickname, flag: m.flag, self: false,
        micOn: m.micOn !== false, camOn: m.camOn !== false, handRaised: m.handRaised });
    });
    list.innerHTML = users.map(u => `
      <div class="meet-participant-row${u.self ? " self" : ""}">
        <span class="meet-participant-avatar" style="background:${avatarColor(u.nickname)}">${getInitials(u.nickname)}</span>
        <span class="meet-participant-flag">${u.flag || "⚽"}</span>
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
      // Stop old tracks
      localStream?.getTracks().forEach(t => t.stop());
      localStream = newStream;
      st.micOn = newStream.getAudioTracks().length > 0;
      st.camOn = newStream.getVideoTracks().length > 0;
      updateLocalVid();
      updateBtns();
      // Replace tracks in all peer connections
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
    } catch(e) { alert2("Could not switch device: " + e.message); }
  }

  // ── Chat Unread Badge ──────────────────────────────────
  function markUnread() {
    const box = document.getElementById("meet-messages");
    // Only count as unread if chat is scrolled up
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
  async function leave() {
    await sbCh?.untrack();
    await sbCh?.unsubscribe();
    sbCh = null;
    localStream?.getTracks().forEach(t => t.stop());
    localStream = null;
    screenStream?.getTracks().forEach(t => t.stop());
    screenStream = null;
    Object.keys(speakerAnalysers).forEach(id => stopSpeakerDetection(id));
    peerMeta = {};
    st.screenOn = false; st.handRaised = false; st.viewMode = "gallery";
    st.participantsOpen = false; st.unreadCount = 0;
    Object.values(peers).forEach(p => p.pc.close());
    peers = {};
    st = { ...st, roomId:null, joined:false, micOn:false, camOn:false, peerId:null };

    const iframe = document.getElementById("meet-stream-iframe");
    if (iframe) iframe.src = "about:blank";
    document.getElementById("meet-stream-frame-wrap")?.classList.add("hidden");
    document.getElementById("meet-messages").innerHTML = "";
    document.getElementById("meet-presence-bar").innerHTML = "";

    // Reset video grid
    const grid = document.getElementById("meet-video-grid");
    if (grid) grid.innerHTML = `
      <div id="meet-local-vid-wrap" class="meet-peer-video meet-local hidden">
        <video id="meet-local-video" autoplay muted playsinline></video>
        <div class="meet-vid-label">You</div>
      </div>`;

    document.getElementById("meet-room")?.classList.add("hidden");
    document.getElementById("meet-landing")?.classList.remove("hidden");
    resetTheme();
  }

  // ── UI ─────────────────────────────────────────────────
  function showRoom(roomId) {
    document.getElementById("meet-landing")?.classList.add("hidden");
    document.getElementById("meet-room")?.classList.remove("hidden");
    const code = document.getElementById("meet-room-code-display");
    if (code) code.textContent = roomId;
    const shareInp = document.getElementById("meet-share-url");
    if (shareInp) shareInp.value = location.href.split("#")[0] + `#meet?room=${roomId}`;
  }

  function bindRoom() {
    document.getElementById("meet-send-btn")?.addEventListener("click", sendMsg);
    document.getElementById("meet-msg-input")?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    document.getElementById("meet-leave-btn")?.addEventListener("click", leave);
    document.getElementById("meet-copy-link-btn")?.addEventListener("click", copyLink);
    document.getElementById("meet-mic-btn")?.addEventListener("click", toggleMic);
    document.getElementById("meet-cam-btn")?.addEventListener("click", toggleCam);
    document.getElementById("meet-screen-btn")?.addEventListener("click", toggleScreenShare);
    document.getElementById("meet-hand-btn")?.addEventListener("click", toggleHand);
    document.getElementById("meet-participants-btn")?.addEventListener("click", toggleParticipants);
    document.getElementById("meet-settings-btn")?.addEventListener("click", openSettings);
    document.getElementById("meet-close-participants")?.addEventListener("click", toggleParticipants);
    document.getElementById("meet-close-settings")?.addEventListener("click", () => document.getElementById("meet-settings-modal")?.classList.add("hidden"));
    document.getElementById("meet-apply-devices")?.addEventListener("click", applyDevices);
    document.getElementById("meet-settings-overlay")?.addEventListener("click", e => { if (e.target.id === "meet-settings-overlay") document.getElementById("meet-settings-modal")?.classList.add("hidden"); });
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
      return `<button class="theme-chip" style="--chip-color:${th?.accent||"#e50914"}"
        title="${team?.name||id}" onclick="MeetSystem.previewTheme('${id}')">
        ${team?.flag || "🏳️"}
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
    const m = location.hash.match(/room=([A-Z0-9-]+)/i);
    if (!m) return;
    const inp = document.getElementById("meet-room-code-input");
    if (inp) inp.value = m[1].toUpperCase();
    document.getElementById("meet")?.scrollIntoView({ behavior:"smooth" });
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
