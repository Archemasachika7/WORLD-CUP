// ============================================================
// Games — Score Predictor, World Cup Quiz, Penalty Shootout
// ============================================================

const PRED_STORAGE_KEY = "wc2026_predictions";

const QUIZ_QUESTIONS = [
  {
    q: "Who scored the most goals in a single World Cup?",
    opts: ["Ronaldo (8, 2002)", "Just Fontaine (13, 1958)", "Eusébio (9, 1966)", "Kylian Mbappé (8, 2022)"],
    answer: 1,
    explanation: "Just Fontaine scored 13 goals for France at the 1958 World Cup — a record that still stands."
  },
  {
    q: "Which country has won the most World Cups?",
    opts: ["Germany", "Italy", "Brazil", "Argentina"],
    answer: 2,
    explanation: "Brazil have won the World Cup 5 times (1958, 1962, 1970, 1994, 2002)."
  },
  {
    q: "What year was the first World Cup held?",
    opts: ["1926", "1930", "1934", "1938"],
    answer: 1,
    explanation: "The inaugural FIFA World Cup was held in Uruguay in 1930, with the hosts winning it."
  },
  {
    q: "Which player(s) have appeared in the most World Cups (5 each)?",
    opts: ["Cristiano Ronaldo & Pelé", "Lionel Messi & Rafael Márquez", "Lothar Matthäus & Antonio Carbajal", "Cafu & Diego Maradona"],
    answer: 1,
    explanation: "Lionel Messi and Rafael Márquez both appeared in 5 World Cups, tying the record."
  },
  {
    q: "Who was the top scorer at the 2022 World Cup?",
    opts: ["Lionel Messi (7 goals)", "Kylian Mbappé (8 goals)", "Olivier Giroud (4 goals)", "Richarlison (3 goals)"],
    answer: 1,
    explanation: "Kylian Mbappé scored 8 goals at Qatar 2022 and won the Golden Boot."
  },
  {
    q: "How many teams compete in the 2026 World Cup?",
    opts: ["32", "40", "48", "64"],
    answer: 2,
    explanation: "The 2026 World Cup features 48 teams for the first time — up from 32 in previous editions."
  },
  {
    q: "Which 3 countries are hosting the 2026 World Cup?",
    opts: ["USA, Canada, Mexico", "USA, Brazil, Mexico", "Canada, Mexico, Argentina", "USA, Canada, Colombia"],
    answer: 0,
    explanation: "The 2026 World Cup is jointly hosted by the United States, Canada, and Mexico."
  },
  {
    q: "Who won the 2022 FIFA World Cup?",
    opts: ["France", "Brazil", "Croatia", "Argentina"],
    answer: 3,
    explanation: "Argentina defeated France on penalties in the 2022 final in Qatar."
  },
  {
    q: "What is England's best World Cup finish?",
    opts: ["Runners-up (1966)", "Winners (1966)", "3rd place (1990)", "Semi-final (2018)"],
    answer: 1,
    explanation: "England won the World Cup in 1966 on home soil, defeating West Germany 4-2 in the final."
  },
  {
    q: "Which 2026 venue has the highest seating capacity?",
    opts: ["MetLife Stadium (82,500)", "AT&T Stadium (80,000)", "Estadio Azteca (87,523)", "SoFi Stadium (70,240)"],
    answer: 2,
    explanation: "Estadio Azteca in Mexico City has a capacity of 87,523 — the largest of all 2026 venues."
  },
];

// ============================================================
// Shared Audio beep (Web Audio API)
// ============================================================
function playBeep(freq = 440, dur = 0.15, type = "sine") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

function playGoalSound() {
  playBeep(600, 0.1, "square");
  setTimeout(() => playBeep(800, 0.12, "square"), 120);
  setTimeout(() => playBeep(1000, 0.2, "square"), 240);
}

function playSaveSound() {
  playBeep(300, 0.2, "sawtooth");
}

// ============================================================
// DOM Ready
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  buildNav("games");
  buildFooter("footer");
  initGameTabs();
  initScorePredictor();
  initQuiz();
  initShootout();
});

// ============================================================
// Game Tabs
// ============================================================
function initGameTabs() {
  document.querySelectorAll(".game-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".game-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".game-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("game-" + btn.dataset.game)?.classList.add("active");
    });
  });
}

// ============================================================
// Game 1: Score Predictor
// ============================================================
function initScorePredictor() {
  const homeSelect = document.getElementById("pred-home");
  const awaySelect = document.getElementById("pred-away");
  if (!homeSelect || !awaySelect) return;

  // Populate team selects
  const opts = TEAMS.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  homeSelect.innerHTML = opts;
  awaySelect.innerHTML = opts;
  if (TEAMS[1]) awaySelect.value = TEAMS[1].id;

  let userScores = { home: 0, away: 0 };

  function updateFlagDisplay() {
    const ht = TEAMS.find(t => t.id === homeSelect.value);
    const at = TEAMS.find(t => t.id === awaySelect.value);
    document.getElementById("pred-home-flag").innerHTML = ht ? flagImg(ht.id, 48) : '';
    document.getElementById("pred-away-flag").innerHTML = at ? flagImg(at.id, 48) : '';
    document.getElementById("pred-home-name").textContent = ht?.name || '';
    document.getElementById("pred-away-name").textContent = at?.name || '';
  }

  homeSelect.addEventListener("change", updateFlagDisplay);
  awaySelect.addEventListener("change", updateFlagDisplay);
  updateFlagDisplay();

  // Score steppers
  document.querySelectorAll(".score-stepper").forEach(btn => {
    btn.addEventListener("click", () => {
      const team = btn.dataset.team;
      const dir = btn.dataset.dir;
      if (dir === "up") userScores[team] = Math.min(9, userScores[team] + 1);
      if (dir === "dn") userScores[team] = Math.max(0, userScores[team] - 1);
      document.getElementById(`pred-${team}-score`).textContent = userScores[team];
    });
  });

  // Submit
  document.getElementById("pred-submit-btn").addEventListener("click", () => {
    const hId = homeSelect.value;
    const aId = awaySelect.value;
    if (hId === aId) { alert("Pick two different teams!"); return; }

    const prob = Predictions.getProbability(hId, aId);
    const ht = TEAMS.find(t => t.id === hId);
    const at = TEAMS.find(t => t.id === aId);

    // AI model: pick score based on probability
    let aiH = 1, aiA = 1;
    if (prob.home > prob.away + 20) { aiH = 2; aiA = 0; }
    else if (prob.home > prob.away + 10) { aiH = 2; aiA = 1; }
    else if (prob.away > prob.home + 20) { aiH = 0; aiA = 2; }
    else if (prob.away > prob.home + 10) { aiH = 1; aiA = 2; }

    // Score points
    let pts = 0;
    const userResult = Math.sign(userScores.home - userScores.away);
    const aiResult   = Math.sign(aiH - aiA);
    if (userScores.home === aiH && userScores.away === aiA) {
      pts = 3;
    } else if (userResult === aiResult) {
      pts = 1;
    }

    // Display AI card
    const aiCard = document.getElementById("pred-ai-card");
    aiCard.classList.remove("hidden");
    document.getElementById("pred-ai-result").innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div style="text-align:center;flex:1">
          ${flagImg(ht.id, 40)}
          <div style="font-weight:700;margin-top:4px">${ht.name}</div>
        </div>
        <div style="font-size:2rem;font-weight:900;color:var(--gold)">${aiH} – ${aiA}</div>
        <div style="text-align:center;flex:1">
          ${flagImg(at.id, 40)}
          <div style="font-weight:700;margin-top:4px">${at.name}</div>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-dim)">
        Win probability: ${ht.name} ${prob.home}% | Draw ${prob.draw}% | ${at.name} ${prob.away}%
      </div>`;

    const ptsRow = document.getElementById("pred-points-row");
    ptsRow.classList.remove("hidden");
    document.getElementById("pred-pts-label").textContent =
      pts === 3 ? "🎯 Exact score match!" :
      pts === 1 ? "✅ Correct result (wrong score)" :
      "❌ Wrong prediction";
    document.getElementById("pred-pts-num").textContent = `+${pts} pts`;

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem(PRED_STORAGE_KEY) || "[]");
    saved.unshift({
      home: ht.name, away: at.name,
      userH: userScores.home, userA: userScores.away,
      aiH, aiA, pts, date: new Date().toLocaleDateString()
    });
    localStorage.setItem(PRED_STORAGE_KEY, JSON.stringify(saved.slice(0, 20)));

    // Update total
    const total = saved.reduce((acc, p) => acc + (p.pts || 0), 0);
    document.getElementById("predictor-total-pts").textContent = `Total: ${total} pts`;

    renderPredHistory();
    playBeep(pts > 0 ? 600 : 300, 0.2);
  });

  renderPredHistory();
  const saved = JSON.parse(localStorage.getItem(PRED_STORAGE_KEY) || "[]");
  const total = saved.reduce((acc, p) => acc + (p.pts || 0), 0);
  if (total > 0) document.getElementById("predictor-total-pts").textContent = `Total: ${total} pts`;
}

function renderPredHistory() {
  const container = document.getElementById("pred-history");
  if (!container) return;
  const saved = JSON.parse(localStorage.getItem(PRED_STORAGE_KEY) || "[]");
  if (!saved.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;color:var(--text-dim)">Your Predictions</h3>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${saved.slice(0, 5).map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-hover);border-radius:8px;font-size:0.85rem;">
          <span>${p.home} ${p.userH}–${p.userA} ${p.away}</span>
          <span style="color:var(--text-dim)">AI: ${p.aiH}–${p.aiA}</span>
          <span style="font-weight:700;color:${p.pts===3?'var(--green)':p.pts===1?'var(--gold)':'var(--accent)'}">+${p.pts} pts</span>
        </div>`).join('')}
    </div>
    <button onclick="localStorage.removeItem('${PRED_STORAGE_KEY}');renderPredHistory();document.getElementById('predictor-total-pts').textContent=''"
      style="margin-top:12px;font-size:0.8rem;color:var(--text-dim);background:none;border:none;cursor:pointer;text-decoration:underline;">
      Clear history
    </button>`;
}

// ============================================================
// Game 2: World Cup Quiz
// ============================================================
let quizState = { q: 0, score: 0, timer: null, answered: false };

function initQuiz() {
  const startBtn = document.getElementById("quiz-start-btn");
  if (startBtn) startBtn.addEventListener("click", startQuiz);
}

function startQuiz() {
  quizState = { q: 0, score: 0, timer: null, answered: false };
  showQuizQuestion();
}

function showQuizQuestion() {
  const container = document.getElementById("quiz-container");
  if (!container) return;
  if (quizState.q >= QUIZ_QUESTIONS.length) { showQuizScore(); return; }

  const q = QUIZ_QUESTIONS[quizState.q];
  let timeLeft = 30;
  quizState.answered = false;

  container.innerHTML = `
    <div class="quiz-progress">
      <span>Question ${quizState.q + 1} / ${QUIZ_QUESTIONS.length}</span>
      <span class="quiz-timer" id="quiz-timer">⏱ ${timeLeft}s</span>
      <span style="color:var(--gold)">Score: ${quizState.score}</span>
    </div>
    <div class="quiz-question">${q.q}</div>
    <div class="quiz-options">
      ${q.opts.map((opt, i) => `<button class="quiz-opt-btn" data-idx="${i}">${opt}</button>`).join('')}
    </div>
    <div id="quiz-feedback" class="quiz-feedback" style="display:none"></div>
    <button id="quiz-next-btn" class="btn-primary" style="margin-top:20px;display:none;">
      ${quizState.q + 1 < QUIZ_QUESTIONS.length ? 'Next Question →' : 'See Results 🏆'}
    </button>`;

  // Timer
  const timerEl = () => document.getElementById("quiz-timer");
  quizState.timer = setInterval(() => {
    timeLeft--;
    const el = timerEl();
    if (el) {
      el.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 10) el.classList.add("timer-urgent");
    }
    if (timeLeft <= 0) {
      clearInterval(quizState.timer);
      if (!quizState.answered) autoFailQuestion();
    }
  }, 1000);

  // Option click handlers
  container.querySelectorAll(".quiz-opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (quizState.answered) return;
      clearInterval(quizState.timer);
      quizState.answered = true;
      const chosen = +btn.dataset.idx;
      const correct = q.answer;
      container.querySelectorAll(".quiz-opt-btn").forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.classList.add("correct");
        else if (i === chosen) b.classList.add("wrong");
      });
      const isCorrect = chosen === correct;
      if (isCorrect) { quizState.score++; playBeep(660, 0.2); }
      else { playSaveSound(); }
      const fb = document.getElementById("quiz-feedback");
      fb.style.display = "block";
      fb.className = "quiz-feedback " + (isCorrect ? "correct" : "wrong");
      fb.textContent = (isCorrect ? "✅ Correct! " : "❌ Wrong! ") + q.explanation;
      document.getElementById("quiz-next-btn").style.display = "block";
    });
  });

  document.getElementById("quiz-next-btn").addEventListener("click", () => {
    quizState.q++;
    showQuizQuestion();
  });
}

function autoFailQuestion() {
  if (quizState.answered) return;
  quizState.answered = true;
  const q = QUIZ_QUESTIONS[quizState.q];
  const container = document.getElementById("quiz-container");
  container.querySelectorAll(".quiz-opt-btn").forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("correct");
  });
  const fb = document.getElementById("quiz-feedback");
  fb.style.display = "block";
  fb.className = "quiz-feedback wrong";
  fb.textContent = "⏰ Time's up! " + q.explanation;
  const nextBtn = document.getElementById("quiz-next-btn");
  if (nextBtn) nextBtn.style.display = "block";
  playSaveSound();
}

function showQuizScore() {
  const container = document.getElementById("quiz-container");
  const pct = Math.round((quizState.score / QUIZ_QUESTIONS.length) * 100);
  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "⚽" : "😢";
  const msg = pct >= 80 ? "World Cup Mastermind!" : pct >= 50 ? "Solid knowledge!" : "Keep watching football!";
  container.innerHTML = `
    <div class="quiz-score-card">
      <div class="quiz-score-emoji">${emoji}</div>
      <div class="quiz-score-num">${quizState.score}/${QUIZ_QUESTIONS.length}</div>
      <div style="font-size:1.3rem;font-weight:700;margin:8px 0">${msg}</div>
      <div style="color:var(--text-dim);margin-bottom:24px">${pct}% correct</div>
      <button onclick="startQuiz()" class="btn-primary" style="padding:12px 32px;">Play Again 🔄</button>
    </div>`;
  if (pct >= 80) playGoalSound();
  else playBeep(300, 0.3);
}

// ============================================================
// Game 3: Penalty Shootout
// ============================================================
let shootState = {
  playerTeam: null, cpuTeam: null,
  kicks: [], turn: "player",
  playerScore: 0, cpuScore: 0,
  kickNum: 0, maxKicks: 5,
  done: false
};

function initShootout() {
  const sel = document.getElementById("shootout-team-select");
  if (!sel) return;
  sel.innerHTML = TEAMS.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  document.getElementById("shootout-start-btn").addEventListener("click", startShootout);
}

function startShootout() {
  const playerTeamId = document.getElementById("shootout-team-select").value;
  const playerTeam = TEAMS.find(t => t.id === playerTeamId);
  // CPU = random team that's not player
  const others = TEAMS.filter(t => t.id !== playerTeamId);
  const cpuTeam = others[Math.floor(Math.random() * others.length)];

  shootState = {
    playerTeam, cpuTeam,
    kicks: [], turn: "player",
    playerScore: 0, cpuScore: 0,
    kickNum: 0, maxKicks: 5,
    done: false
  };
  renderShootout();
}

function renderShootout() {
  const container = document.getElementById("shootout-container");
  if (!container) return;
  const st = shootState;

  // Build dots
  const buildDots = (kicks, isPlayer) => {
    const teamKicks = kicks.filter(k => k.isPlayer === isPlayer);
    return Array.from({length: st.maxKicks}, (_, i) => {
      const k = teamKicks[i];
      if (!k) return '<div class="shoot-dot"></div>';
      return `<div class="shoot-dot ${k.scored?'scored':'missed'}"></div>`;
    }).join('');
  };

  const isPlayerTurn = st.turn === "player" && !st.done;
  const kicksLeft = st.maxKicks * 2 - st.kicks.length;
  const currentKickNum = st.kicks.filter(k => k.isPlayer).length + 1;

  container.innerHTML = `
    <div class="shootout-field">
      <div class="shootout-scoreboard">
        <div class="shoot-team-score">
          <div style="margin-bottom:6px;font-size:0;">${flagImg(st.playerTeam.id, 40)}</div>
          <div class="shoot-score-num">${st.playerScore}</div>
          <div class="shoot-score-name">${st.playerTeam.name}</div>
          <div class="shoot-dots">${buildDots(st.kicks, true)}</div>
        </div>
        <div class="shoot-score-sep">–</div>
        <div class="shoot-team-score">
          <div style="margin-bottom:6px;font-size:0;">${flagImg(st.cpuTeam.id, 40)}</div>
          <div class="shoot-score-num">${st.cpuScore}</div>
          <div class="shoot-score-name">${st.cpuTeam.name} (CPU)</div>
          <div class="shoot-dots">${buildDots(st.kicks, false)}</div>
        </div>
      </div>

      ${st.done ? renderWinner() : `
      <div class="shootout-goal-zone">
        <div class="shoot-turn-label">
          ${isPlayerTurn
            ? `Kick ${currentKickNum}/${st.maxKicks} — <strong>${st.playerTeam.name}</strong> shooting — Choose your zone!`
            : `CPU (${st.cpuTeam.name}) is shooting…`}
        </div>
        <div class="goal-visual" id="goal-grid">
          ${['Left', 'Centre', 'Right'].map(zone => `
            <button class="goal-zone-btn" data-zone="${zone}" ${!isPlayerTurn ? 'disabled' : ''}>
              ${zone}
            </button>`).join('')}
        </div>
        <div id="shoot-result" class="shoot-action-result"></div>
      </div>`}
    </div>`;

  if (!st.done) {
    container.querySelectorAll(".goal-zone-btn").forEach(btn => {
      btn.addEventListener("click", () => playerKick(btn.dataset.zone));
    });

    if (st.turn === "cpu" && !st.done) {
      setTimeout(() => cpuKick(), 1000);
    }
  }
}

function playerKick(zone) {
  if (shootState.turn !== "player" || shootState.done) return;

  // Disable buttons immediately
  document.querySelectorAll(".goal-zone-btn").forEach(b => b.disabled = true);

  const cpuDir = ['Left', 'Centre', 'Right'][Math.floor(Math.random() * 3)];
  const scored = zone !== cpuDir;

  const resultEl = document.getElementById("shoot-result");
  if (resultEl) {
    resultEl.className = "shoot-action-result " + (scored ? "goal" : "save");
    resultEl.textContent = scored ? "⚽ GOAL! " + zone + " corner — keeper went " + cpuDir : "🧤 SAVED! You aimed " + zone + " — keeper dived " + cpuDir;
  }

  if (scored) { shootState.playerScore++; playGoalSound(); }
  else { playSaveSound(); }

  shootState.kicks.push({ isPlayer: true, scored, zone, cpuDir });
  shootState.turn = "cpu";

  setTimeout(() => {
    if (checkShootoutEnd()) return;
    renderShootout();
    setTimeout(() => cpuKick(), 800);
  }, 1400);
}

function cpuKick() {
  const zones = ['Left', 'Centre', 'Right'];
  const cpuZone = zones[Math.floor(Math.random() * 3)];
  const playerSave = zones[Math.floor(Math.random() * 3)];
  const scored = cpuZone !== playerSave;

  const resultEl = document.getElementById("shoot-result");
  if (resultEl) {
    resultEl.className = "shoot-action-result " + (scored ? "save" : "goal");
    resultEl.textContent = scored
      ? `⚽ CPU SCORES! ${st_name()} aimed ${cpuZone} — you dived ${playerSave}`
      : `🧤 YOU SAVED IT! CPU aimed ${cpuZone} — you dived ${playerSave}`;
  }

  function st_name() { return shootState.cpuTeam?.name || 'CPU'; }

  if (scored) { shootState.cpuScore++; playSaveSound(); }
  else { playBeep(660, 0.2); }

  shootState.kicks.push({ isPlayer: false, scored, zone: cpuZone });
  shootState.turn = "player";

  setTimeout(() => {
    if (checkShootoutEnd()) return;
    renderShootout();
  }, 1400);
}

function checkShootoutEnd() {
  const st = shootState;
  const playerKicks = st.kicks.filter(k => k.isPlayer).length;
  const cpuKicks = st.kicks.filter(k => !k.isPlayer).length;

  if (playerKicks >= st.maxKicks && cpuKicks >= st.maxKicks) {
    st.done = true;
    renderShootout();
    return true;
  }

  // Early termination: if one side can't be caught
  if (playerKicks === cpuKicks && playerKicks < st.maxKicks) {
    const remaining = st.maxKicks - playerKicks;
    if (st.playerScore - st.cpuScore > remaining ||
        st.cpuScore - st.playerScore > remaining) {
      st.done = true;
      renderShootout();
      return true;
    }
  }
  return false;
}

function renderWinner() {
  const st = shootState;
  const playerWon = st.playerScore > st.cpuScore;
  const draw = st.playerScore === st.cpuScore;
  const winTeam = playerWon ? st.playerTeam : st.cpuTeam;
  return `
    <div class="shoot-winner-banner">
      <div style="font-size:3rem;margin-bottom:12px">${draw ? '🤝' : playerWon ? '🎉' : '😢'}</div>
      <div style="font-size:1.6rem;font-weight:900;margin-bottom:8px">
        ${draw ? "It's a draw!" : (playerWon ? "YOU WIN! 🏆" : "CPU WINS!")}
      </div>
      <div style="font-size:1.1rem;color:var(--gold);margin-bottom:4px">
        ${st.playerTeam.name} ${st.playerScore} – ${st.cpuScore} ${st.cpuTeam.name}
      </div>
      ${!draw ? `<div style="font-size:0.9rem;color:var(--text-dim)">${winTeam.name} wins the shootout!</div>` : ''}
      <button onclick="startShootout()" class="btn-primary" style="margin-top:24px;padding:12px 32px;">Play Again 🔄</button>
    </div>`;
}

// ============================================================
// LINEUP BUILDER
// ============================================================

const LB_FORMATIONS = {
  "4-3-3": [
    {label:"GK",  x:50, y:86, posGroup:"GK"},
    {label:"LB",  x:13, y:68, posGroup:"DF"}, {label:"CB", x:36, y:68, posGroup:"DF"},
    {label:"CB",  x:64, y:68, posGroup:"DF"}, {label:"RB", x:87, y:68, posGroup:"DF"},
    {label:"LCM", x:22, y:50, posGroup:"MF"}, {label:"CM", x:50, y:47, posGroup:"MF"}, {label:"RCM", x:78, y:50, posGroup:"MF"},
    {label:"LW",  x:18, y:26, posGroup:"FW"}, {label:"CF", x:50, y:20, posGroup:"FW"}, {label:"RW",  x:82, y:26, posGroup:"FW"},
  ],
  "4-4-2": [
    {label:"GK",  x:50, y:86, posGroup:"GK"},
    {label:"LB",  x:13, y:68, posGroup:"DF"}, {label:"CB", x:36, y:68, posGroup:"DF"},
    {label:"CB",  x:64, y:68, posGroup:"DF"}, {label:"RB", x:87, y:68, posGroup:"DF"},
    {label:"LM",  x:13, y:50, posGroup:"MF"}, {label:"CM", x:37, y:50, posGroup:"MF"},
    {label:"CM",  x:63, y:50, posGroup:"MF"}, {label:"RM", x:87, y:50, posGroup:"MF"},
    {label:"ST",  x:35, y:22, posGroup:"FW"}, {label:"ST", x:65, y:22, posGroup:"FW"},
  ],
  "3-5-2": [
    {label:"GK",  x:50, y:86, posGroup:"GK"},
    {label:"CB",  x:25, y:68, posGroup:"DF"}, {label:"CB", x:50, y:68, posGroup:"DF"}, {label:"CB", x:75, y:68, posGroup:"DF"},
    {label:"LWB", x:10, y:52, posGroup:"MF"}, {label:"CM", x:30, y:49, posGroup:"MF"}, {label:"CM", x:50, y:47, posGroup:"MF"},
    {label:"CM",  x:70, y:49, posGroup:"MF"}, {label:"RWB",x:90, y:52, posGroup:"MF"},
    {label:"ST",  x:35, y:22, posGroup:"FW"}, {label:"ST", x:65, y:22, posGroup:"FW"},
  ],
  "4-2-3-1": [
    {label:"GK",  x:50, y:86, posGroup:"GK"},
    {label:"LB",  x:13, y:68, posGroup:"DF"}, {label:"CB", x:36, y:68, posGroup:"DF"},
    {label:"CB",  x:64, y:68, posGroup:"DF"}, {label:"RB", x:87, y:68, posGroup:"DF"},
    {label:"CDM", x:36, y:55, posGroup:"MF"}, {label:"CDM",x:64, y:55, posGroup:"MF"},
    {label:"LW",  x:18, y:38, posGroup:"MF"}, {label:"CAM",x:50, y:36, posGroup:"MF"}, {label:"RW",  x:82, y:38, posGroup:"MF"},
    {label:"ST",  x:50, y:20, posGroup:"FW"},
  ],
};

var lbState = {
  team: null,
  formation: "4-3-3",
  selected: null,        // name of bench player selected
  placed: {},            // slotIdx -> playerName
  squadPlayers: [],
};

function initLineupBuilder() {
  // Populate team select with announced/preliminary squads only
  var sel = document.getElementById("lb-team-select");
  if (!sel) return;
  var opts = TEAMS.filter(function(t) {
    var sq = SQUADS[t.id];
    return sq && sq.players && sq.players.length > 0;
  });
  sel.innerHTML = opts.map(function(t) {
    return '<option value="' + t.id + '">' + t.name + '</option>';
  }).join("");
  lbState.team = opts[0] ? opts[0].id : null;

  sel.addEventListener("change", function() {
    lbState.team = sel.value;
    lbState.placed = {};
    lbState.selected = null;
    lbRender();
  });

  var fsel = document.getElementById("lb-formation-select");
  if (fsel) {
    fsel.addEventListener("change", function() {
      lbState.formation = fsel.value;
      lbState.placed = {};
      lbState.selected = null;
      lbRender();
    });
  }

  var clrBtn = document.getElementById("lb-clear-btn");
  if (clrBtn) {
    clrBtn.addEventListener("click", function() {
      lbState.placed = {};
      lbState.selected = null;
      lbRender();
    });
  }

  lbRender();
}

function lbGetSquadPlayers() {
  if (!lbState.team) return [];
  var sq = SQUADS[lbState.team];
  if (!sq || !sq.players || !sq.players.length) return [];
  return sq.players;
}

function lbMakePlayerChip(p, isSelected, isPlaced) {
  var enc = encodeURIComponent(p.name);
  var src = (PLAYER_PHOTOS && PLAYER_PHOTOS[p.name])
    ? PLAYER_PHOTOS[p.name]
    : 'https://ui-avatars.com/api/?name=' + enc + '&background=1e1e30&color=e5e5e5&size=80&bold=true&format=svg';
  var fb = 'https://ui-avatars.com/api/?name=' + enc + '&background=1e1e30&color=e5e5e5&size=80&bold=true&format=svg';
  var cls = 'lb-player-chip' + (isSelected ? ' lb-selected' : '') + (isPlaced ? ' lb-placed' : '');
  var lastName = p.name.split(' ').pop();
  return '<div class="' + cls + '" data-player="' + p.name.replace(/"/g,'&quot;') + '">' +
    '<img class="lb-chip-img" src="' + src + '" onerror="this.src=\'' + fb + '\'" alt="' + p.name + '" />' +
    '<span class="lb-chip-name">' + lastName + '</span>' +
  '</div>';
}

function lbRender() {
  var players = lbGetSquadPlayers();
  var placed_names = Object.values(lbState.placed);

  // Render bench by position
  var posGroups = {GK:[], DF:[], MF:[], FW:[]};
  players.forEach(function(p) { if (posGroups[p.pos]) posGroups[p.pos].push(p); });

  ['GK','DF','MF','FW'].forEach(function(pos) {
    var wrap = document.querySelector('#lb-bench-' + pos.toLowerCase() + ' .lb-pos-players');
    if (!wrap) return;
    wrap.innerHTML = posGroups[pos].map(function(p) {
      return lbMakePlayerChip(p, lbState.selected === p.name, placed_names.indexOf(p.name) !== -1);
    }).join('');
    wrap.querySelectorAll('.lb-player-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        var name = chip.dataset.player;
        if (lbState.selected === name) { lbState.selected = null; }
        else { lbState.selected = name; }
        lbRender();
      });
    });
  });

  // Render pitch slots
  var pitch = document.getElementById('lb-pitch');
  if (!pitch) return;
  var slots = LB_FORMATIONS[lbState.formation] || LB_FORMATIONS["4-3-3"];
  pitch.innerHTML = slots.map(function(slot, i) {
    var playerName = lbState.placed[i];
    var cls = 'lb-slot' + (playerName ? ' lb-slot-filled' : '') + (lbState.selected ? ' lb-slot-target' : '');
    var inner = '';
    if (playerName) {
      var enc = encodeURIComponent(playerName);
      var src = (PLAYER_PHOTOS && PLAYER_PHOTOS[playerName])
        ? PLAYER_PHOTOS[playerName]
        : 'https://ui-avatars.com/api/?name=' + enc + '&background=1e1e30&color=e5e5e5&size=80&bold=true&format=svg';
      var fb = 'https://ui-avatars.com/api/?name=' + enc + '&background=1e1e30&color=e5e5e5&size=80&bold=true&format=svg';
      var ln = playerName.split(' ').pop();
      inner = '<img class="lb-slot-img" src="' + src + '" onerror="this.src=\'' + fb + '\'" alt="' + playerName + '" />' +
              '<span class="lb-slot-name">' + ln + '</span>';
    } else {
      inner = '<span class="lb-slot-pos">' + slot.label + '</span>';
    }
    return '<div class="' + cls + '" data-slot="' + i + '" style="left:' + slot.x + '%;top:' + slot.y + '%">' + inner + '</div>';
  }).join('');

  pitch.querySelectorAll('.lb-slot').forEach(function(slotEl) {
    slotEl.addEventListener('click', function() {
      var i = parseInt(slotEl.dataset.slot);
      if (lbState.selected) {
        // Remove player from any other slot
        Object.keys(lbState.placed).forEach(function(k) {
          if (lbState.placed[k] === lbState.selected) delete lbState.placed[k];
        });
        lbState.placed[i] = lbState.selected;
        lbState.selected = null;
        lbRender();
      } else if (lbState.placed[i]) {
        // Click placed player to unplace
        delete lbState.placed[i];
        lbRender();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function() {
  // Wire up lineup builder tab activation
  var lineupTab = document.querySelector('[data-game="lineup"]');
  if (lineupTab) {
    lineupTab.addEventListener("click", function() {
      if (!lbState.team) initLineupBuilder();
    });
  }
});
