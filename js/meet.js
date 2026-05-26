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
  };
  let sbCh = null;
  let localStream = null;
  let screenStream = null;
  let peers = {};
  let _lastSyncedUrl = "";
  let _syncDebounceT = null;

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
    // Fetch and auto-load any existing stream for this room
    try {
      const { data } = await _sb.from("rooms").select("stream_url").eq("id", roomId).maybeSingle();
      if (data?.stream_url) {
        loadStream(data.stream_url, false);
        sysMsg("Loading the room's current stream…");
      }
    } catch(e) { /* non-fatal */ }
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
      .on("broadcast", { event: "stream_sync" }, ({ payload }) => {
        if (!payload?.url) return;
        if (payload.url === _lastSyncedUrl) return;
        _lastSyncedUrl = payload.url;
        clearTimeout(_syncDebounceT);
        _syncDebounceT = setTimeout(() => loadStream(payload.url, false), 300);
      })
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

    const iframe   = document.getElementById("meet-stream-iframe");
    const wrap     = document.getElementById("meet-stream-frame-wrap");
    const inp      = document.getElementById("meet-stream-input");
    const openLink = document.getElementById("meet-stream-open-link");
    const statusEl = document.getElementById("meet-stream-status");

    if (inp)      inp.value = finalUrl;
    if (openLink) { openLink.href = finalUrl; openLink.style.display = "inline-flex"; }
    if (statusEl) statusEl.textContent = "";

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
    Object.values(peers).forEach(p => {
      localStream.getTracks().forEach(track => {
        if (!p.pc.getSenders().find(s => s.track === track)) p.pc.addTrack(track, localStream);
      });
    });
  }

  function updateLocalVid() {
    const wrap = document.getElementById("meet-local-vid-wrap");
    const vid  = document.getElementById("meet-local-video");
    const src  = screenStream || localStream;
    if (vid && src) { vid.srcObject = src; vid.muted = true; vid.play().catch(()=>{}); }
    wrap?.classList.toggle("hidden", !(screenStream || st.camOn));
  }

  function updateBtns() {
    const m = document.getElementById("meet-mic-btn");
    const c = document.getElementById("meet-cam-btn");
    const s = document.getElementById("meet-screen-btn");
    if (m) { m.textContent = st.micOn ? "🎙️ Mic On" : "🔇 Muted"; m.classList.toggle("media-active", st.micOn); }
    if (c) { c.textContent = st.camOn ? "📹 Cam On" : "📷 Cam Off"; c.classList.toggle("media-active", st.camOn); }
    if (s) {
      const sharing = !!screenStream;
      s.textContent = sharing ? "🖥️ Stop Sharing" : "🖥️ Share Screen";
      s.classList.toggle("media-active", sharing);
    }
  }

  // ── Screen Share ───────────────────────────────────────
  async function toggleScreenShare() {
    if (screenStream) { stopScreenShare(); return; }
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true });
    } catch (e) {
      if (e.name !== "NotAllowedError") alert2("Screen share failed — " + e.message);
      screenStream = null;
      return;
    }

    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack) { screenStream = null; return; }

    // When the user clicks "Stop sharing" in the browser's native controls
    videoTrack.addEventListener("ended", stopScreenShare);

    // Push screen track into every open peer connection
    Object.values(peers).forEach(({ pc }) => {
      const videoSender = pc.getSenders().find(s => s.track?.kind === "video");
      if (videoSender) {
        videoSender.replaceTrack(videoTrack).catch(() => {});
      } else {
        pc.addTrack(videoTrack, screenStream);
      }
      // Add screen audio track if captured
      screenStream.getAudioTracks().forEach(at => {
        if (!pc.getSenders().find(s => s.track === at)) pc.addTrack(at, screenStream);
      });
    });

    updateLocalVid();
    updateBtns();
    sysMsg(`${st.teamFlag} ${st.nickname} started screen sharing — all users now see your screen via WebRTC`);
    sbCh?.send({ type:"broadcast", event:"chat", payload:{
      room_id: st.roomId, nickname: "📺 System", team_flag: "🖥️",
      text: `${st.nickname} started screen sharing`, type:"msg",
      created_at: new Date().toISOString(),
    }});
  }

  function stopScreenShare() {
    if (!screenStream) return;
    screenStream.getTracks().forEach(t => t.stop());
    screenStream = null;

    // Restore camera video track (or null) in all senders
    const camTrack = localStream?.getVideoTracks()[0] || null;
    Object.values(peers).forEach(({ pc }) => {
      const videoSender = pc.getSenders().find(s => s.track?.kind === "video");
      if (videoSender) videoSender.replaceTrack(camTrack).catch(() => {});
    });

    updateLocalVid();
    updateBtns();
    sysMsg("Screen share ended");
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
      const lbl = document.createElement("div");
      lbl.className = "meet-vid-label"; lbl.textContent = "Peer";
      wrap.appendChild(vid); wrap.appendChild(lbl);
      grid.appendChild(wrap);
    }
    wrap.querySelector("video").srcObject = stream;
  }

  // ── Leave ──────────────────────────────────────────────
  async function leave() {
    await sbCh?.untrack();
    await sbCh?.unsubscribe();
    sbCh = null;
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
    if (shareInp) shareInp.value = location.origin + location.pathname + `?room=${roomId}`;
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
    document.getElementById("meet-stream-go")?.addEventListener("click", async () => {
      const url = (document.getElementById("meet-stream-input")?.value || "").trim();
      if (url) await loadStream(url, true);
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
    // Support both ?room=CODE (new) and #meet?room=CODE (legacy)
    const qCode = new URLSearchParams(location.search).get("room");
    const hMatch = location.hash.match(/room=([A-Z0-9-]+)/i);
    const code = (qCode || (hMatch && hMatch[1]) || "").toUpperCase();
    if (!code) return;
    const inp = document.getElementById("meet-room-code-input");
    if (inp) inp.value = code;
    document.getElementById("meet-landing")?.scrollIntoView({ behavior:"smooth" });
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
