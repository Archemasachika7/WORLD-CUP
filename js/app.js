// ============================================================
// App Controller — renders all sections
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  renderHero();
  renderTeams();
  renderMatches();
  renderStats();
  renderPredictions();
  API.startNewsAutoRefresh(renderNews);
  initSearch();
  initScrollAnimations();
});

// ---- Navigation ----
function initNav() {
  const nav = document.getElementById("main-nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ---- Hero ----
function renderHero() {
  const el = document.getElementById("hero-countdown");
  if (!el) return;
  updateCountdown(el);
  setInterval(() => updateCountdown(el), 1000);
}

function updateCountdown(el) {
  const diff = new Date("2026-06-11T20:00:00") - new Date();
  if (diff <= 0) { el.textContent = "THE TOURNAMENT IS LIVE!"; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.innerHTML = `<span>${d}</span>d <span>${h}</span>h <span>${m}</span>m <span>${s}</span>s`;
}

// ---- Teams ----
function renderTeams() {
  const container = document.getElementById("teams-grid");
  if (!container) return;

  const confOrder = ["UEFA", "CONMEBOL", "CONCACAF", "AFC", "CAF", "OFC"];
  const confNames = { UEFA:"Europe (UEFA)", CONMEBOL:"South America (CONMEBOL)", CONCACAF:"North America (CONCACAF)", AFC:"Asia (AFC)", CAF:"Africa (CAF)", OFC:"Oceania (OFC)" };

  let html = "";
  confOrder.forEach(conf => {
    const teams = TEAMS.filter(t => t.conf === conf);
    html += `<div class="conf-section">
      <h3 class="conf-title">${confNames[conf]} <span class="conf-count">${teams.length} teams</span></h3>
      <div class="teams-row">
        ${teams.map(t => renderTeamCard(t)).join("")}
      </div>
    </div>`;
  });

  container.innerHTML = html;

  // Click handler for team analysis modal
  container.querySelectorAll(".team-card").forEach(card => {
    card.addEventListener("click", () => openTeamModal(card.dataset.id));
  });
}

function renderTeamCard(t) {
  const sq = (Predictions.SQUAD_STRENGTH[t.id] || 7.5).toFixed(1);
  const stars = Math.round((sq - 7) / 2.5 * 5);
  const starStr = "★".repeat(Math.max(1, stars)) + "☆".repeat(5 - Math.max(1, stars));
  return `
    <div class="team-card" data-id="${t.id}">
      ${t.isHost ? '<span class="host-badge">HOST</span>' : ''}
      <div class="team-flag">${t.flag}</div>
      <div class="team-name">${t.name}</div>
      <div class="team-group">Group ${t.group}</div>
      <div class="team-ranking">FIFA #${t.ranking}</div>
      <div class="team-stars" title="Squad strength ${sq}/10">${starStr}</div>
    </div>`;
}

// ---- Team Modal ----
function openTeamModal(teamId) {
  const analysis = Predictions.getTeamAnalysis(teamId);
  if (!analysis) return;
  const { team, players, awards, squadStrength, composite, strengths, weaknesses } = analysis;

  const modal = document.getElementById("modal");
  const body  = document.getElementById("modal-body");

  const compPct = Math.round(composite * 100);
  const titleOdds = Predictions.getTournamentFavourites().find(t => t.id === teamId);
  const titleLabel = titleOdds ? titleOdds.title.label : "—";
  const titlePct   = titleOdds ? titleOdds.title.percentage : 0;

  body.innerHTML = `
    <div class="modal-header">
      <span class="modal-flag">${team.flag}</span>
      <div>
        <h2>${team.name}</h2>
        <p class="modal-sub">Group ${team.group} &bull; FIFA #${team.ranking} &bull; ${team.conf}</p>
      </div>
    </div>
    <div class="modal-scores">
      <div class="score-box"><div class="score-val">${squadStrength}</div><div class="score-lbl">Squad Strength</div></div>
      <div class="score-box"><div class="score-val">${compPct}%</div><div class="score-lbl">Composite Score</div></div>
      <div class="score-box"><div class="score-val">${titlePct}%</div><div class="score-lbl">Title Probability</div></div>
      <div class="score-box"><div class="score-val">${team.elo}</div><div class="score-lbl">Elo Rating</div></div>
    </div>
    <div class="modal-verdict ${titleLabel.includes('Strong') ? 'verdict-green' : titleLabel.includes('Dark') ? 'verdict-yellow' : 'verdict-grey'}">
      ${titleLabel}
    </div>
    ${players.length ? `
    <h3 class="modal-section-title">Key Players (Top 5 Leagues)</h3>
    <div class="player-list">
      ${players.map(p => `
        <div class="player-row">
          <span class="player-nation">${p.nation}</span>
          <span class="player-name">${p.name}</span>
          <span class="player-club">${p.club}</span>
          <span class="player-stats">${p.goals ? `⚽ ${p.goals}G ${p.assists}A` : p.cs ? `🧤 ${p.cs} CS` : `🛡️ ${p.ga} GA conceded`}</span>
          <span class="player-rating">⭐ ${p.rating}</span>
          ${p.award ? `<span class="player-award">🏆 ${p.award}</span>` : ''}
        </div>`).join("")}
    </div>` : '<p class="muted-text">No top-5 league players tracked for this squad.</p>'}
    ${awards.length ? `
    <h3 class="modal-section-title">Season Honours</h3>
    <ul class="awards-list">${awards.map(a => `<li>🏅 <b>${a.award}</b> — ${a.winner}</li>`).join("")}</ul>` : ""}
    <div class="strengths-weaknesses">
      <div><h3 class="modal-section-title green-title">Strengths</h3><ul>${strengths.map(s => `<li>✅ ${s}</li>`).join("") || "<li>—</li>"}</ul></div>
      <div><h3 class="modal-section-title red-title">Concerns</h3><ul>${weaknesses.map(w => `<li>⚠️ ${w}</li>`).join("") || "<li>—</li>"}</ul></div>
    </div>`;

  modal.classList.add("open");
}

document.addEventListener("click", e => {
  if (e.target.id === "modal" || e.target.id === "modal-close") {
    document.getElementById("modal").classList.remove("open");
  }
});

// ---- Matches ----
function renderMatches() {
  const container = document.getElementById("matches-list");
  if (!container) return;

  const groups = [...new Set(MATCHES.map(m => m.stage))];
  const tabs   = document.getElementById("match-tabs");
  tabs.innerHTML = ['All', ...groups].map((g, i) =>
    `<button class="tab-btn ${i===0?'active':''}" data-group="${g}">${g}</button>`
  ).join("");

  tabs.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      displayMatches(btn.dataset.group);
    });
  });

  displayMatches("All");
}

function displayMatches(group) {
  const container = document.getElementById("matches-list");
  const list = group === "All" ? MATCHES : MATCHES.filter(m => m.stage === group);

  container.innerHTML = list.map(m => {
    const home = TEAMS.find(t => t.id === m.home);
    const away = TEAMS.find(t => t.id === m.away);
    if (!home || !away) return "";
    const prob = Predictions.getProbability(m.home, m.away);
    const dateStr = new Date(m.date + "T" + m.time).toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });

    return `
      <div class="match-card" data-match="${m.id}">
        <div class="match-stage">${m.stage}</div>
        <div class="match-date">${dateStr} ${m.time} &bull; ${m.venue}</div>
        <div class="match-teams">
          <div class="match-team home-team">
            <span class="mflag">${home.flag}</span>
            <span class="mname">${home.name}</span>
          </div>
          <div class="match-center">
            ${m.homeScore !== null
              ? `<span class="final-score">${m.homeScore} – ${m.awayScore}</span>`
              : `<span class="vs-badge">VS</span>`}
          </div>
          <div class="match-team away-team">
            <span class="mname">${away.name}</span>
            <span class="mflag">${away.flag}</span>
          </div>
        </div>
        <div class="prob-bar">
          <div class="prob-home" style="width:${prob.home}%">${prob.home}%</div>
          <div class="prob-draw" style="width:${prob.draw}%">${prob.draw}%</div>
          <div class="prob-away" style="width:${prob.away}%">${prob.away}%</div>
        </div>
        <div class="prob-labels"><span>${home.name}</span><span>Draw</span><span>${away.name}</span></div>
      </div>`;
  }).join("");

  container.querySelectorAll(".match-card").forEach(card => {
    card.addEventListener("click", () => {
      const match = MATCHES.find(m => m.id === +card.dataset.match);
      if (match) openMatchModal(match);
    });
  });
}

function openMatchModal(match) {
  const home = TEAMS.find(t => t.id === match.home);
  const away = TEAMS.find(t => t.id === match.away);
  const prob = Predictions.getProbability(match.home, match.away);
  const modal = document.getElementById("modal");
  const body  = document.getElementById("modal-body");

  body.innerHTML = `
    <div class="match-modal-header">
      <h2>${match.stage}</h2>
      <p>${new Date(match.date + "T" + match.time).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} &bull; ${match.time}</p>
      <p>📍 ${match.venue}</p>
    </div>
    <div class="big-matchup">
      <div class="bm-team"><span class="bm-flag">${home.flag}</span><br>${home.name}<br><small>FIFA #${home.ranking}</small></div>
      <div class="bm-vs">VS</div>
      <div class="bm-team"><span class="bm-flag">${away.flag}</span><br>${away.name}<br><small>FIFA #${away.ranking}</small></div>
    </div>
    <h3 class="modal-section-title">Win Probability</h3>
    <div class="big-prob-bar">
      <div class="bpb-home" style="width:${prob.home}%">${home.flag} ${prob.home}%</div>
      <div class="bpb-draw" style="width:${prob.draw}%">DRAW<br>${prob.draw}%</div>
      <div class="bpb-away" style="width:${prob.away}%">${away.flag} ${prob.away}%</div>
    </div>
    <div class="modal-scores mt-20">
      <div class="score-box"><div class="score-val">${prob.homeSqStrength}</div><div class="score-lbl">${home.name} Squad</div></div>
      <div class="score-box"><div class="score-val">${home.elo}</div><div class="score-lbl">${home.name} Elo</div></div>
      <div class="score-box"><div class="score-val">${prob.awaySqStrength}</div><div class="score-lbl">${away.name} Squad</div></div>
      <div class="score-box"><div class="score-val">${away.elo}</div><div class="score-lbl">${away.name} Elo</div></div>
    </div>
    <p class="prediction-verdict">
      🔮 Prediction: <strong>${
        prob.home > prob.away + 10 ? home.name + " to win" :
        prob.away > prob.home + 10 ? away.name + " to win" :
        "A very close match — could go either way"
      }</strong>
    </p>`;

  modal.classList.add("open");
}

// ---- Stats ----
function renderStats() {
  const container = document.getElementById("stats-container");
  if (!container) return;

  const leagues = Object.keys(PLAYERS);
  let html = `<div class="awards-banner"><h3>🏆 2024/25 Season Honours</h3><div class="awards-scroll">
    ${AWARDS.map(a => `
      <div class="award-chip">
        <span class="award-nation">${a.nation}</span>
        <div><strong>${a.winner}</strong><br><small>${a.award}</small><br><small class="award-league">${a.league}</small></div>
      </div>`).join("")}
  </div></div>`;

  leagues.forEach(league => {
    const players = PLAYERS[league];
    html += `
      <div class="league-section">
        <h3 class="league-title">${leagueIcon(league)} ${league}</h3>
        <div class="stats-table-wrap">
          <table class="stats-table">
            <thead><tr><th>Player</th><th>Club</th><th>Nat.</th><th>G</th><th>A</th><th>GA</th><th>CS</th><th>Rating</th></tr></thead>
            <tbody>
              ${players.sort((a,b) => (b.goals+b.assists)-(a.goals+a.assists)).map(p => `
                <tr class="${p.award ? 'award-row' : ''}">
                  <td><strong>${p.name}</strong>${p.award ? ' 🏆' : ''}</td>
                  <td>${p.club}</td>
                  <td>${p.nation}</td>
                  <td>${p.goals || '—'}</td>
                  <td>${p.assists || '—'}</td>
                  <td>${p.ga || '—'}</td>
                  <td>${p.cs || '—'}</td>
                  <td><span class="rating-badge">${p.rating}</span></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

function leagueIcon(league) {
  const icons = { EPL:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", LaLiga:"🇪🇸", Bundesliga:"🇩🇪", SerieA:"🇮🇹", Ligue1:"🇫🇷" };
  return icons[league] || "🌍";
}

// ---- Predictions ----
function renderPredictions() {
  const container = document.getElementById("predictions-container");
  if (!container) return;

  const favs = Predictions.getTournamentFavourites();

  container.innerHTML = `
    <div class="favs-intro">
      <p>Ratings powered by a composite of Elo, FIFA rankings, and real 2024/25 club performance. Click a team to see full analysis.</p>
    </div>
    <div class="favs-podium">
      ${favs.slice(0, 3).map((t, i) => `
        <div class="podium-card p${i+1}" data-id="${t.id}">
          <div class="podium-medal">${["🥇","🥈","🥉"][i]}</div>
          <div class="podium-flag">${t.flag}</div>
          <div class="podium-name">${t.name}</div>
          <div class="podium-pct">${t.title.percentage}% title chance</div>
          <div class="podium-label ${t.title.label.includes('Strong')?'label-green':'label-yellow'}">${t.title.label}</div>
          <div class="podium-sq">Squad: ${t.squadStrength}/10</div>
        </div>`).join("")}
    </div>
    <h3 class="section-sub-title">Full Tournament Power Rankings</h3>
    <div class="rankings-list">
      ${favs.map((t, i) => `
        <div class="ranking-row" data-id="${t.id}">
          <span class="rank-num">#${i+1}</span>
          <span class="rank-flag">${t.flag}</span>
          <span class="rank-name">${t.name}</span>
          <div class="rank-bar-wrap">
            <div class="rank-bar" style="width:${Math.round(t.composite*100)}%"></div>
          </div>
          <span class="rank-pct">${Math.round(t.composite*100)}%</span>
          <span class="rank-label ${t.title.label.includes('Strong') ? 'label-green' : t.title.label.includes('Dark') ? 'label-yellow' : 'label-grey'}">${t.title.label}</span>
        </div>`).join("")}
    </div>
    <div class="head2head-section">
      <h3 class="section-sub-title">Head-to-Head Predictor</h3>
      <div class="h2h-selectors">
        <select id="h2h-home">
          ${TEAMS.map(t => `<option value="${t.id}">${t.flag} ${t.name}</option>`).join("")}
        </select>
        <span class="h2h-vs">VS</span>
        <select id="h2h-away">
          ${TEAMS.map((t,i) => `<option value="${t.id}" ${i===1?'selected':''}>${t.flag} ${t.name}</option>`).join("")}
        </select>
        <button id="h2h-btn" class="btn-primary">Predict</button>
      </div>
      <div id="h2h-result"></div>
    </div>`;

  document.getElementById("h2h-btn").addEventListener("click", () => {
    const homeId = document.getElementById("h2h-home").value;
    const awayId = document.getElementById("h2h-away").value;
    if (homeId === awayId) {
      document.getElementById("h2h-result").innerHTML = '<p class="error-text">Please select two different teams.</p>';
      return;
    }
    renderH2H(homeId, awayId);
  });

  container.querySelectorAll("[data-id]").forEach(el => {
    el.addEventListener("click", () => openTeamModal(el.dataset.id));
  });
}

function renderH2H(homeId, awayId) {
  const prob = Predictions.getProbability(homeId, awayId);
  const { homeTeam: h, awayTeam: a } = prob;
  const winner = prob.home > prob.away + 5 ? h.name : prob.away > prob.home + 5 ? a.name : "Likely a draw";

  document.getElementById("h2h-result").innerHTML = `
    <div class="h2h-result-card">
      <div class="h2h-teams">
        <div>${h.flag} <strong>${h.name}</strong></div>
        <div class="h2h-divider">VS</div>
        <div><strong>${a.name}</strong> ${a.flag}</div>
      </div>
      <div class="big-prob-bar mt-20">
        <div class="bpb-home" style="width:${prob.home}%">${prob.home}%</div>
        <div class="bpb-draw" style="width:${prob.draw}%">${prob.draw}%</div>
        <div class="bpb-away" style="width:${prob.away}%">${prob.away}%</div>
      </div>
      <p class="prediction-verdict mt-10">🔮 <strong>${winner}</strong> ${winner.includes("draw") ? "" : "expected to win"}</p>
      <div class="h2h-detail">
        <span>Elo: ${h.elo} vs ${a.elo}</span>
        <span>Squad: ${prob.homeSqStrength} vs ${prob.awaySqStrength}</span>
        <span>Ranking: #${h.ranking} vs #${a.ranking}</span>
      </div>
    </div>`;
}

// ---- News ----
function renderNews(articles) {
  const container = document.getElementById("news-grid");
  if (!container) return;

  const lastUpdate = document.getElementById("news-last-update");
  if (lastUpdate) lastUpdate.textContent = "Updated " + new Date().toLocaleTimeString();

  container.innerHTML = articles.slice(0, 9).map((a, i) => `
    <div class="news-card ${i === 0 ? 'news-featured' : ''}">
      ${a.image ? `<div class="news-img" style="background-image:url('${a.image}')"></div>` : `<div class="news-img-placeholder"><span>⚽</span></div>`}
      <div class="news-body">
        ${a.tag ? `<span class="news-tag">${a.tag}</span>` : ''}
        <h4 class="news-title">${a.title}</h4>
        <p class="news-desc">${a.description || ''}</p>
        <div class="news-meta">
          <span>${a.source?.name || 'Sports News'}</span>
          <span>${timeAgo(a.publishedAt)}</span>
          ${a.url && a.url !== '#' ? `<a href="${a.url}" target="_blank" rel="noopener" class="news-read">Read →</a>` : ''}
        </div>
      </div>
    </div>`).join("");
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 23) return Math.floor(h / 24) + "d ago";
  if (h > 0)  return h + "h ago";
  return m + "m ago";
}

// ---- Search ----
function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    if (!q) { renderTeams(); return; }
    const filtered = TEAMS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.conf.toLowerCase().includes(q) ||
      ("group " + t.group).toLowerCase().includes(q)
    );
    const container = document.getElementById("teams-grid");
    container.innerHTML = `<div class="conf-section"><div class="teams-row">${filtered.map(renderTeamCard).join("")}</div></div>`;
    container.querySelectorAll(".team-card").forEach(c => c.addEventListener("click", () => openTeamModal(c.dataset.id)));
  });
}

// ---- Scroll animations ----
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.1 });

  document.querySelectorAll(".section-fade").forEach(el => observer.observe(el));
}
