// ============================================================
// App Controller
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  populateTeamSelector();
  populateMeetTeamSelector();
  WatchParty.init();
  MeetSystem.init();
  renderHero();
  renderTeams();
  renderMatches();
  renderStats();
  renderPredictions();
  renderLivePredictor();
  API.startNewsAutoRefresh(renderNews);
  initSearch();
  initScrollAnimations();
  initStatsViewToggle();
});

// ---- Meet Rooms team selector ----
function populateMeetTeamSelector() {
  const sel = document.getElementById("meet-team-select");
  if (!sel) return;
  sel.innerHTML = '<option value="⚽" data-id="">⚽ Neutral</option>' +
    TEAMS.map(t => `<option value="${t.flag}" data-id="${t.id}">${t.flag} ${t.name}</option>`).join("");
}

// ---- Watch Party team selector ----
function populateTeamSelector() {
  const sel = document.getElementById("wp-team-select");
  if (!sel) return;
  sel.innerHTML = '<option value="⚽">⚽ Neutral</option>' +
    TEAMS.map(t => `<option value="${t.flag}">${t.flag} ${t.name}</option>`).join("");
}

// ---- Stats view toggle ----
let statsView = "cards";
function initStatsViewToggle() {
  document.getElementById("view-cards-btn")?.addEventListener("click", () => {
    statsView = "cards";
    document.getElementById("view-cards-btn").classList.add("active");
    document.getElementById("view-table-btn").classList.remove("active");
    renderStats();
  });
  document.getElementById("view-table-btn")?.addEventListener("click", () => {
    statsView = "table";
    document.getElementById("view-table-btn").classList.add("active");
    document.getElementById("view-cards-btn").classList.remove("active");
    renderStats();
  });
}

// ---- Nav ----
function initNav() {
  const nav = document.getElementById("main-nav");
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 60));
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector(link.getAttribute("href"))?.scrollIntoView({ behavior:"smooth" });
    });
  });
}

// Stream bar is handled by watchparty.js — restore saved URL on load
(function restoreSavedStreamUrl() {
  const saved = localStorage.getItem(typeof STREAM_KEY !== 'undefined' ? STREAM_KEY : "wc2026_stream_url");
  const input = document.getElementById("stream-url-input");
  if (saved && input) input.value = saved;
})()

// ---- Hero countdown ----
function renderHero() {
  const el = document.getElementById("hero-countdown");
  if (!el) return;
  const tick = () => {
    const diff = new Date("2026-06-11T20:00:00") - new Date();
    if (diff <= 0) { el.textContent = "🔴 THE TOURNAMENT IS LIVE!"; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `<span>${d}</span>d <span>${h}</span>h <span>${m}</span>m <span>${s}</span>s`;
  };
  tick(); setInterval(tick, 1000);
}

// ---- Teams ----
function renderTeams() {
  const container = document.getElementById("teams-grid");
  if (!container) return;
  const confOrder = ["UEFA","CONMEBOL","CONCACAF","AFC","CAF","OFC"];
  const confNames = { UEFA:"Europe (UEFA) — 16 teams", CONMEBOL:"South America (CONMEBOL) — 6 teams",
    CONCACAF:"North/Central America (CONCACAF) — 6 teams", AFC:"Asia (AFC) — 8 teams",
    CAF:"Africa (CAF) — 9 teams", OFC:"Oceania (OFC) — 1 team" };
  let html = "";
  confOrder.forEach(conf => {
    const teams = TEAMS.filter(t => t.conf === conf);
    if (!teams.length) return;
    html += `<div class="conf-section">
      <h3 class="conf-title">${confNames[conf]}</h3>
      <div class="teams-row">${teams.map(renderTeamCard).join("")}</div>
    </div>`;
  });
  container.innerHTML = html;
  container.querySelectorAll(".team-card").forEach(c => c.addEventListener("click", () => openTeamModal(c.dataset.id)));
}

function renderTeamCard(t) {
  const sq   = Predictions.SQ[t.id];
  const score = sq?.score || 7.5;
  const top5  = sq?.top5Count || 0;
  const stars = Math.min(5, Math.max(1, Math.round((score - 7.0) / 2.5 * 5)));
  const squad = SQUADS[t.id] || {};
  const badge = squad.status === "ANNOUNCED"   ? '<span class="sq-badge sq-confirmed">✓ Announced</span>'
              : squad.status === "PRELIMINARY" ? '<span class="sq-badge sq-preliminary">~ Preliminary</span>'
              :                                  '<span class="sq-badge sq-pending">? Unannounced</span>';
  return `
    <div class="team-card" data-id="${t.id}">
      ${t.isHost ? '<span class="host-badge">HOST</span>' : ''}
      <div class="team-flag-lg">${t.flag}</div>
      <div class="team-name">${t.name}</div>
      <div class="team-group">Group ${t.group} &bull; #${t.ranking}</div>
      <div class="team-top5">${top5} top-5 league player${top5 !== 1 ? 's' : ''}</div>
      <div class="team-stars">${"★".repeat(stars)}${"☆".repeat(5-stars)}</div>
      ${badge}
    </div>`;
}

// ---- Team Modal ----
function openTeamModal(teamId) {
  const data = Predictions.getTeamAnalysis(teamId);
  if (!data) return;
  const { team, players, awards, squad, sq, composite, strengths, weaknesses } = data;
  const modal = document.getElementById("modal");
  const body  = document.getElementById("modal-body");

  const squadStatusHtml = `
    <div class="squad-status-bar ${squad.status === 'ANNOUNCED' ? 'sq-bar-green' : squad.status === 'PRELIMINARY' ? 'sq-bar-yellow' : 'sq-bar-grey'}">
      <span class="sq-status-icon">${squad.status === 'ANNOUNCED' ? '✅' : squad.status === 'PRELIMINARY' ? '⚠️' : '❓'}</span>
      <div>
        <strong>Squad: ${squad.status}</strong>${squad.date ? ` — ${squad.date}` : ' — pending June 2 FIFA deadline'}
        <div class="sq-note">${squad.note}</div>
      </div>
    </div>`;

  const announcedPlayersHtml = squad.players?.length ? `
    <h3 class="modal-section-title">Official Squad Players (Confirmed)</h3>
    <div class="squad-player-grid">
      ${squad.players.map(p => {
        const lm = LEAGUE_META[p.league] || LEAGUE_META["Other"];
        return `<div class="squad-player-chip ${lm.tier === 1 ? 'tier1' : 'tier2'}">
          <span>${p.name}</span>
          <small>${lm.nation} ${p.club}</small>
          ${lm.tier > 1 ? `<span class="weight-chip">×${lm.weight}</span>` : ''}
        </div>`;
      }).join("")}
    </div>` : '';

  const statsHtml = players.length ? `
    <h3 class="modal-section-title">2025-26 Season Stats (${players.length} tracked players)</h3>
    <div class="player-list">
      ${players.map(p => {
        const lm  = LEAGUE_META[p.league] || LEAGUE_META["Other"];
        const eff = (p.rating * lm.weight).toFixed(2);
        return `<div class="player-row">
          <span class="player-nation">${p.nation}</span>
          <span class="player-name">${p.name}</span>
          <span class="player-club ${lm.tier === 1 ? '' : 'non-top5'}">${lm.nation} ${p.club} <em class="league-label">${lm.name}</em></span>
          <span class="player-stats">${p.goals ? `⚽ ${p.goals}G ${p.assists}A` : p.cs ? `🧤 ${p.cs} CS` : `🛡️ ${p.pos}`}</span>
          <span class="player-rating" title="Weighted: ${eff}">⭐ ${p.rating} <small>(×${lm.weight}→${eff})</small></span>
          ${p.award ? `<span class="player-award">🏆 ${p.award}</span>` : ''}
          ${p.note  ? `<span class="player-note">ℹ️ ${p.note}</span>`  : ''}
        </div>`;
      }).join("")}
    </div>` : `<p class="muted-text">No top-league tracked players for this squad yet.</p>`;

  const leagueSplit = players.reduce((acc, p) => {
    const lm = LEAGUE_META[p.league] || LEAGUE_META["Other"];
    const key = lm.tier === 1 ? "top5" : "other";
    acc[key] = (acc[key] || 0) + 1; return acc;
  }, {});

  body.innerHTML = `
    <div class="modal-header">
      <span class="modal-flag-lg">${team.flag}</span>
      <div>
        <h2>${team.name}</h2>
        <p class="modal-sub">Group ${team.group} &bull; FIFA #${team.ranking} &bull; ${team.conf} &bull; Elo ${team.elo}</p>
      </div>
    </div>
    ${squadStatusHtml}
    <div class="modal-scores">
      <div class="score-box"><div class="score-val">${sq.score.toFixed(2)}</div><div class="score-lbl">Weighted Squad Score</div></div>
      <div class="score-box"><div class="score-val">${Math.round(composite*100)}%</div><div class="score-lbl">Composite Rating</div></div>
      <div class="score-box"><div class="score-val">${sq.top5Count}</div><div class="score-lbl">Top-5 League Players</div></div>
      <div class="score-box"><div class="score-val">${sq.awardBonus.toFixed(1)}</div><div class="score-lbl">Award Bonus</div></div>
    </div>
    <div class="league-split-bar">
      <span>Top-5 leagues: <strong>${leagueSplit.top5 || 0}</strong> players (full weight)</span>
      <span>Other leagues: <strong>${leagueSplit.other || 0}</strong> players (discounted weight)</span>
    </div>
    ${announcedPlayersHtml}
    ${awards.length ? `
    <h3 class="modal-section-title">Season Honours (2024/25 – 2025/26)</h3>
    <ul class="awards-list">${awards.map(a => `<li>🏅 <b>${a.award}</b> — ${a.winner} (${LEAGUE_META[a.league]?.nation||''} ${a.league})</li>`).join("")}</ul>` : ""}
    ${statsHtml}
    <div class="strengths-weaknesses">
      <div><h3 class="modal-section-title green-title">Strengths</h3><ul>${strengths.map(s=>`<li>✅ ${s}</li>`).join("")||"<li>—</li>"}</ul></div>
      <div><h3 class="modal-section-title red-title">Concerns</h3><ul>${weaknesses.map(w=>`<li>⚠️ ${w}</li>`).join("")||"<li>—</li>"}</ul></div>
    </div>`;

  modal.classList.add("open");
}

document.addEventListener("click", e => {
  if (e.target.id === "modal" || e.target.id === "modal-close")
    document.getElementById("modal").classList.remove("open");
});

// ---- Matches (flags prominent) ----
function renderMatches() {
  const container = document.getElementById("matches-list");
  if (!container) return;
  const groups = [...new Set(MATCHES.map(m => m.stage))];
  const tabs   = document.getElementById("match-tabs");
  tabs.innerHTML = ["All",...groups].map((g,i)=>
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
    const dt   = new Date(m.date + "T" + m.time);
    const ds   = dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
    return `
      <div class="match-card" data-match="${m.id}">
        <div class="match-stage">${m.stage}</div>
        <div class="match-date">${ds} ${m.time} &bull; ${m.venue}</div>
        <div class="match-teams">
          <div class="match-team">
            <span class="mflag-lg">${home.flag}</span>
            <span class="mname-sm">${home.name}</span>
          </div>
          <div class="match-center">
            ${m.homeScore !== null
              ? `<span class="final-score">${m.homeScore}–${m.awayScore}</span>`
              : `<span class="vs-badge">VS</span>`}
          </div>
          <div class="match-team">
            <span class="mflag-lg">${away.flag}</span>
            <span class="mname-sm">${away.name}</span>
          </div>
        </div>
        <div class="prob-bar">
          <div class="prob-home" style="width:${prob.home}%">${prob.home}%</div>
          <div class="prob-draw" style="width:${prob.draw}%">${prob.draw}%</div>
          <div class="prob-away" style="width:${prob.away}%">${prob.away}%</div>
        </div>
        <div class="prob-labels">
          <span>${home.flag} Win</span><span>Draw</span><span>Win ${away.flag}</span>
        </div>
      </div>`;
  }).join("");
  container.querySelectorAll(".match-card").forEach(card => {
    card.addEventListener("click", () => {
      const m = MATCHES.find(x => x.id === +card.dataset.match);
      if (m) openMatchModal(m);
    });
  });
}

function openMatchModal(match) {
  const home = TEAMS.find(t => t.id === match.home);
  const away = TEAMS.find(t => t.id === match.away);
  const prob = Predictions.getProbability(match.home, match.away);
  const body = document.getElementById("modal-body");
  const dt   = new Date(match.date + "T" + match.time).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  body.innerHTML = `
    <div class="match-modal-header">
      <h2>${match.stage}</h2><p>${dt} &bull; ${match.time}</p><p>📍 ${match.venue}</p>
    </div>
    <div class="big-matchup">
      <div class="bm-team"><span class="bm-flag">${home.flag}</span><br><strong>${home.name}</strong><br><small>FIFA #${home.ranking} &bull; Elo ${home.elo}</small></div>
      <div class="bm-vs">VS</div>
      <div class="bm-team"><span class="bm-flag">${away.flag}</span><br><strong>${away.name}</strong><br><small>FIFA #${away.ranking} &bull; Elo ${away.elo}</small></div>
    </div>
    <h3 class="modal-section-title">Pre-Match Win Probability</h3>
    <div class="big-prob-bar">
      <div class="bpb-home" style="width:${prob.home}%">${home.flag} ${prob.home}%</div>
      <div class="bpb-draw" style="width:${prob.draw}%">Draw<br>${prob.draw}%</div>
      <div class="bpb-away" style="width:${prob.away}%">${away.flag} ${prob.away}%</div>
    </div>
    <div class="modal-scores mt-16">
      <div class="score-box"><div class="score-val">${prob.homeSqScore}</div><div class="score-lbl">${home.flag} Squad</div></div>
      <div class="score-box"><div class="score-val">${prob.homeTop5}</div><div class="score-lbl">${home.flag} Top-5</div></div>
      <div class="score-box"><div class="score-val">${prob.awaySqScore}</div><div class="score-lbl">${away.flag} Squad</div></div>
      <div class="score-box"><div class="score-val">${prob.awayTop5}</div><div class="score-lbl">${away.flag} Top-5</div></div>
    </div>
    <p class="prediction-verdict mt-10">
      🔮 <strong>${prob.home > prob.away + 10 ? home.name + " to win" : prob.away > prob.home + 10 ? away.name + " to win" : "Very close — could go either way"}</strong>
    </p>
    <div class="quick-live-link">
      <a class="btn-sm" href="#live-predictor" onclick="document.getElementById('modal').classList.remove('open');prefillPredictor('${home.id}','${away.id}')">
        ▶ Run live in-play predictor for this match →
      </a>
    </div>`;
  document.getElementById("modal").classList.add("open");
}

// ---- Stats ----
function renderStats() {
  const container = document.getElementById("stats-container");
  if (!container) return;

  // Awards banner (always shown)
  let html = `<div class="awards-banner"><h3>🏆 2025-26 Season Honours</h3><div class="awards-scroll">
    ${AWARDS.map(a => `<div class="award-chip">
      <span class="award-nation">${a.nation}</span>
      <div><strong>${a.winner}</strong><br><small>${a.award}</small><br>
      <small class="award-league">${(LEAGUE_META[a.league]||{}).nation||''} ${a.league}</small></div>
    </div>`).join("")}
  </div></div>`;

  const tier1 = PLAYERS.filter(p => (LEAGUE_META[p.league]||{}).tier === 1);
  const tier2 = PLAYERS.filter(p => (LEAGUE_META[p.league]||{}).tier !== 1);

  if (statsView === "cards") {
    // EA FC-style card grid — all players sorted by effective score
    const allSorted = [...PLAYERS]
      .filter(p => p.teamId)
      .sort((a,b) => {
        const wa = (LEAGUE_META[a.league]||{weight:0.45}).weight;
        const wb = (LEAGUE_META[b.league]||{weight:0.45}).weight;
        return (b.rating*wb) - (a.rating*wa);
      });

    html += `<div class="cards-league-section">
      <h3 class="league-title">⭐ Top Performers — EA FC Style <span class="weight-tag">Effective score = Rating × League Weight</span></h3>
      <div class="ea-cards-grid">${allSorted.map(renderEaCard).join("")}</div>
    </div>`;

  } else {
    // Table view grouped by league
    const byLeague = {};
    tier1.forEach(p => { (byLeague[p.league]=byLeague[p.league]||[]).push(p); });

    Object.entries(byLeague).forEach(([league, players]) => {
      const lm = LEAGUE_META[league] || {};
      html += `<div class="league-section">
        <h3 class="league-title">${lm.nation} ${lm.name} <span class="weight-tag">Weight: ${lm.weight}</span></h3>
        ${playerTable(players)}
      </div>`;
    });

    if (tier2.length) {
      html += `<div class="league-section">
        <h3 class="league-title">🌍 Other Leagues <span class="weight-tag weight-discounted">Discounted (0.45–0.65×)</span></h3>
        <p class="league-note">Still counted — just at reduced weight vs. top-6 league players.</p>
        ${playerTable(tier2)}
      </div>`;
    }
  }

  container.innerHTML = html;
}

// League → 2-letter flag code for flagcdn.com
const LEAGUE_FLAG_CODES = {
  "EPL": "gb-eng", "LaLiga": "es", "Bundesliga": "de", "SerieA": "it",
  "Ligue1": "fr", "LigaPortugal": "pt", "Eredivisie": "nl",
  "SaudiPro": "sa", "LigaMX": "mx", "MLS": "us", "JupilerPro": "be"
};

function eaFlagHtml(emoji, code, size) {
  if (!code) return `<span class="ea-flag-emoji">${emoji}</span>`;
  return `<span class="ea-flag-wrap"><span class="ea-flag-emoji">${emoji}</span><img class="ea-flag-img" src="https://flagcdn.com/w${size}/${code}.png" alt="" onerror="this.style.display='none'" /></span>`;
}

function renderEaCard(p) {
  const lm      = LEAGUE_META[p.league] || LEAGUE_META["Other"];
  const ovr     = Math.round(p.rating * 10);
  const eff     = (p.rating * lm.weight).toFixed(1);
  const wct     = p.teamId ? TEAMS.find(t => t.id === p.teamId) : null;
  const tier    = ovr >= 90 ? "gold" : ovr >= 85 ? "silver" : "bronze";

  const stat1lbl = p.pos === "GK" ? "CS"  : p.pos === "DF" ? "GA"  : "GOL";
  const stat1val = p.pos === "GK" ? p.cs  : p.pos === "DF" ? p.ga  : p.goals;
  const stat2lbl = p.pos === "GK" ? "RTG" : "AST";
  const stat2val = p.pos === "GK" ? p.rating : p.assists;

  // Nation flag: use WC team flag code if available, else fallback to p.nation emoji
  const natCode   = wct && FLAG_CODES ? FLAG_CODES[wct.id] : null;
  const natEmoji  = wct ? wct.flag : p.nation;
  const natHtml   = eaFlagHtml(natEmoji, natCode, 32);

  // WC team flag (smaller badge beside nation)
  const wcHtml = wct ? eaFlagHtml(wct.flag, natCode, 32) : '';

  // League flag
  const lgCode    = LEAGUE_FLAG_CODES[p.league] || null;
  const lgEmoji   = lm.nation;
  const lgFlagHtml = eaFlagHtml(lgEmoji, lgCode, 24);

  const ph = getPlayerPhoto(p.name);

  return `
    <div class="ea-card ea-${tier}" title="${p.name} — ${p.club}">
      <div class="ea-top">
        <div class="ea-ovr">${ovr}</div>
        <div class="ea-pos">${p.pos}</div>
        <div class="ea-nation">${natHtml}</div>
        ${wct ? `<div class="ea-wcteam">${wcHtml}</div>` : ''}
      </div>
      <div class="ea-silhouette"><img class="ea-photo" src="${ph.src}" onerror="this.src='${ph.fallback}'" alt="${p.name}" /></div>
      <div class="ea-name">${p.name.toUpperCase().split(" ").pop()}</div>
      <div class="ea-fullname">${p.name}</div>
      <div class="ea-club">${lgFlagHtml} ${p.club}</div>
      <div class="ea-stats">
        <div class="ea-stat"><span class="ea-sv">${stat1val||"—"}</span><span class="ea-sl">${stat1lbl}</span></div>
        <div class="ea-stat"><span class="ea-sv">${stat2val||"—"}</span><span class="ea-sl">${stat2lbl}</span></div>
        <div class="ea-stat"><span class="ea-sv ea-eff">${eff}</span><span class="ea-sl">EFF</span></div>
      </div>
      ${p.award ? `<div class="ea-award">🏆</div>` : ''}
      ${lm.tier > 1 ? `<div class="ea-discount-label">×${lm.weight}</div>` : ''}
    </div>`;
}

function playerTable(players) {
  const sorted = [...players].sort((a,b) => (b.goals+b.assists)-(a.goals+a.assists));
  return `<div class="stats-table-wrap"><table class="stats-table">
    <thead><tr><th>Player</th><th>Club / League</th><th>Nat.</th><th>WC Team</th><th>G</th><th>A</th><th>CS/GA</th><th>Rating</th><th>Eff. Score</th></tr></thead>
    <tbody>${sorted.map(p => {
      const lm  = LEAGUE_META[p.league] || LEAGUE_META["Other"];
      const eff = (p.rating * lm.weight).toFixed(2);
      const wct = p.teamId ? TEAMS.find(t=>t.id===p.teamId) : null;
      return `<tr class="${p.award ? 'award-row' : ''}">
        <td><strong>${p.name}</strong>${p.award ? ' 🏆' : ''}</td>
        <td><span class="league-pill ${lm.tier===1?'tier1-pill':'tier2-pill'}">${lm.nation}</span> ${p.club}</td>
        <td>${p.nation}</td>
        <td>${wct ? wct.flag : '—'}</td>
        <td>${p.goals||'—'}</td>
        <td>${p.assists||'—'}</td>
        <td>${p.cs ? `🧤${p.cs}` : p.ga ? `🛡️${p.ga}` : '—'}</td>
        <td><span class="rating-badge">${p.rating}</span></td>
        <td><span class="eff-badge ${lm.tier===1?'eff-full':'eff-disc'}" title="×${lm.weight} weight">${eff}</span></td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

// ---- Predictions (tournament rankings) ----
function renderPredictions() {
  const container = document.getElementById("predictions-container");
  if (!container) return;
  const favs = Predictions.getTournamentFavourites();

  container.innerHTML = `
    <div class="favs-intro">
      Composite score = 40% Elo + 35% weighted squad strength (real 2025-26 stats, league-discounted) + 25% FIFA ranking.
      Non-top-5 league players have reduced weight (0.45–0.65×).
    </div>
    <div class="favs-podium">${favs.slice(0,3).map((t,i)=>`
      <div class="podium-card p${i+1}" data-id="${t.id}">
        <div class="podium-medal">${["🥇","🥈","🥉"][i]}</div>
        <div class="podium-flag">${t.flag}</div>
        <div class="podium-name">${t.name}</div>
        <div class="podium-pct">${t.titlePct}% title chance</div>
        <div class="podium-sq">Squad score: ${t.squadScore} &bull; ${t.top5Players} top-5 players</div>
        <div class="podium-label ${t.titleLabel.includes('Strong')?'label-green':'label-yellow'}">${t.titleLabel}</div>
      </div>`).join("")}
    </div>
    <h3 class="section-sub-title">Full Power Rankings (Top 16)</h3>
    <div class="rankings-list">${favs.map((t,i)=>`
      <div class="ranking-row" data-id="${t.id}">
        <span class="rank-num">#${i+1}</span>
        <span class="rank-flag">${t.flag}</span>
        <span class="rank-name">${t.name}</span>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.round(t.composite*100)}%"></div></div>
        <span class="rank-pct">${Math.round(t.composite*100)}%</span>
        <span class="rank-top5">${t.top5Players} T5</span>
        <span class="rank-label ${t.titleLabel.includes('Strong')?'label-green':t.titleLabel.includes('Dark')?'label-yellow':'label-grey'}">${t.titleLabel}</span>
      </div>`).join("")}
    </div>
    <div class="head2head-section">
      <h3 class="section-sub-title">Head-to-Head Predictor</h3>
      <div class="h2h-selectors">
        <select id="h2h-home">${TEAMS.map(t=>`<option value="${t.id}">${t.flag} ${t.name}</option>`).join("")}</select>
        <span class="h2h-vs">VS</span>
        <select id="h2h-away">${TEAMS.map((t,i)=>`<option value="${t.id}" ${i===1?'selected':''}>${t.flag} ${t.name}</option>`).join("")}</select>
        <button id="h2h-btn" class="btn-primary">Predict</button>
      </div>
      <div id="h2h-result"></div>
    </div>`;

  document.getElementById("h2h-btn").addEventListener("click", () => {
    const hId = document.getElementById("h2h-home").value;
    const aId = document.getElementById("h2h-away").value;
    if (hId === aId) { document.getElementById("h2h-result").innerHTML='<p class="error-text">Select two different teams.</p>'; return; }
    renderH2H(hId, aId);
  });
  container.querySelectorAll("[data-id]").forEach(el => el.addEventListener("click", () => openTeamModal(el.dataset.id)));
}

function renderH2H(hId, aId) {
  const prob = Predictions.getProbability(hId, aId);
  const h = prob.homeTeam, a = prob.awayTeam;
  const winner = prob.home > prob.away + 6 ? h.name : prob.away > prob.home + 6 ? a.name : "Likely a draw";
  document.getElementById("h2h-result").innerHTML = `
    <div class="h2h-result-card">
      <div class="h2h-flags">
        <span class="h2h-flag-lg">${h.flag}</span>
        <span class="h2h-divider">VS</span>
        <span class="h2h-flag-lg">${a.flag}</span>
      </div>
      <div class="h2h-names"><span>${h.name}</span><span>${a.name}</span></div>
      <div class="big-prob-bar mt-16">
        <div class="bpb-home" style="width:${prob.home}%">${prob.home}%</div>
        <div class="bpb-draw" style="width:${prob.draw}%">Draw ${prob.draw}%</div>
        <div class="bpb-away" style="width:${prob.away}%">${prob.away}%</div>
      </div>
      <p class="prediction-verdict mt-10">🔮 <strong>${winner}</strong>${winner.includes("draw")?"":" expected to win"}</p>
      <div class="h2h-detail">
        <span>Elo: ${h.elo} vs ${a.elo}</span>
        <span>Squad: ${prob.homeSqScore} vs ${prob.awaySqScore}</span>
        <span>Top-5 players: ${prob.homeTop5} vs ${prob.awayTop5}</span>
        <span>Ranking: #${h.ranking} vs #${a.ranking}</span>
      </div>
    </div>`;
}

// ---- Live In-Play Predictor ----
function renderLivePredictor() {
  const container = document.getElementById("live-predictor");
  if (!container) return;

  container.innerHTML = `
    <div class="lp-teams">
      <select id="lp-home">${TEAMS.map(t=>`<option value="${t.id}">${t.flag} ${t.name}</option>`).join("")}</select>
      <span class="lp-vs">vs</span>
      <select id="lp-away">${TEAMS.map((t,i)=>`<option value="${t.id}" ${i===1?'selected':''}>${t.flag} ${t.name}</option>`).join("")}</select>
    </div>
    <div class="lp-controls">
      <div class="lp-score-wrap">
        <label>Score</label>
        <div class="lp-score-inputs">
          <div class="lp-goals">
            <button class="goal-btn" data-team="home" data-action="minus">−</button>
            <span id="lp-home-goals">0</span>
            <button class="goal-btn" data-team="home" data-action="plus">+</button>
          </div>
          <span class="lp-score-dash">—</span>
          <div class="lp-goals">
            <button class="goal-btn" data-team="away" data-action="minus">−</button>
            <span id="lp-away-goals">0</span>
            <button class="goal-btn" data-team="away" data-action="plus">+</button>
          </div>
        </div>
      </div>
      <div class="lp-minute-wrap">
        <label>Minute: <strong id="lp-minute-val">0'</strong></label>
        <input type="range" id="lp-minute" min="0" max="120" value="0" step="1" />
        <div class="lp-minute-marks">
          <span>0'</span><span>45'</span><span>HT</span><span>75'</span><span>FT 90'</span><span>ET 120'</span>
        </div>
      </div>
      <div class="lp-cards-wrap">
        <label>Red Cards</label>
        <div class="lp-cards">
          <span id="lp-home-flag">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          <button class="card-btn" data-team="home" data-action="minus">−</button>
          <span class="red-card-count" id="lp-home-red">0 🟥</span>
          <button class="card-btn" data-team="home" data-action="plus">+</button>
          &nbsp;&nbsp;
          <button class="card-btn" data-team="away" data-action="minus">−</button>
          <span class="red-card-count" id="lp-away-red">0 🟥</span>
          <button class="card-btn" data-team="away" data-action="plus">+</button>
          <span id="lp-away-flag">🇫🇷</span>
        </div>
      </div>
    </div>
    <div id="lp-result" class="lp-result">
      <div class="lp-result-header">
        <span id="lp-res-home-flag">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
        <span id="lp-scoreline">0 – 0</span>
        <span id="lp-res-away-flag">🇫🇷</span>
        <span id="lp-minute-badge" class="minute-badge">0'</span>
      </div>
      <div id="lp-bar" class="big-prob-bar mt-10">
        <div class="bpb-home" id="lp-bpb-home" style="width:50%">50%</div>
        <div class="bpb-draw" id="lp-bpb-draw" style="width:25%">25%</div>
        <div class="bpb-away" id="lp-bpb-away" style="width:25%">25%</div>
      </div>
      <div class="lp-verdict" id="lp-verdict">Move the sliders to simulate a live match</div>
      <div class="lp-momentum" id="lp-momentum"></div>
    </div>`;

  // State
  const state = { home: 0, away: 0, minute: 0, homeRed: 0, awayRed: 0 };

  function updateLP() {
    const hId = document.getElementById("lp-home").value;
    const aId = document.getElementById("lp-away").value;
    if (hId === aId) return;
    const prob = Predictions.getInPlayProbability(hId, aId, state.home, state.away, state.minute, state.homeRed, state.awayRed);
    const h = TEAMS.find(t=>t.id===hId), a = TEAMS.find(t=>t.id===aId);

    document.getElementById("lp-res-home-flag").textContent = h.flag;
    document.getElementById("lp-res-away-flag").textContent = a.flag;
    document.getElementById("lp-home-flag").textContent = h.flag;
    document.getElementById("lp-away-flag").textContent = a.flag;
    document.getElementById("lp-scoreline").textContent  = `${state.home} – ${state.away}`;
    document.getElementById("lp-minute-badge").textContent = state.minute > 90 ? `${state.minute}' ET` : state.minute === 90 ? "FT" : state.minute === 45 ? "HT" : `${state.minute}'`;
    document.getElementById("lp-verdict").textContent    = prob.matchVerdict;
    document.getElementById("lp-momentum").textContent   = state.minute > 0 ? `Momentum: ${prob.momentum}` : "";

    const bph = document.getElementById("lp-bpb-home");
    const bpd = document.getElementById("lp-bpb-draw");
    const bpa = document.getElementById("lp-bpb-away");
    bph.style.width = prob.home + "%"; bph.textContent = `${h.flag} ${prob.home}%`;
    bpd.style.width = prob.draw + "%"; bpd.textContent = `Draw ${prob.draw}%`;
    bpa.style.width = prob.away + "%"; bpa.textContent = `${a.flag} ${prob.away}%`;
  }

  document.getElementById("lp-minute").addEventListener("input", e => {
    state.minute = +e.target.value;
    document.getElementById("lp-minute-val").textContent = `${state.minute}'`;
    updateLP();
  });

  document.querySelectorAll(".goal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const team = btn.dataset.team, act = btn.dataset.action;
      if (act === "plus")  state[team] = Math.min(20, state[team] + 1);
      if (act === "minus") state[team] = Math.max(0,  state[team] - 1);
      document.getElementById(`lp-${team}-goals`).textContent = state[team];
      updateLP();
    });
  });

  document.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const team = btn.dataset.team + "Red", act = btn.dataset.action;
      if (act === "plus")  state[team] = Math.min(3, state[team] + 1);
      if (act === "minus") state[team] = Math.max(0, state[team] - 1);
      document.getElementById(`lp-${btn.dataset.team}-red`).textContent = `${state[team]} 🟥`;
      updateLP();
    });
  });

  document.getElementById("lp-home").addEventListener("change", updateLP);
  document.getElementById("lp-away").addEventListener("change", updateLP);

  updateLP();
}

// Called from match modal link
function prefillPredictor(hId, aId) {
  const hs = document.getElementById("lp-home");
  const as = document.getElementById("lp-away");
  if (hs) hs.value = hId;
  if (as) as.value = aId;
  document.getElementById("live-predictor")?.scrollIntoView({ behavior:"smooth" });
  // trigger update
  setTimeout(() => document.getElementById("lp-home")?.dispatchEvent(new Event("change")), 200);
}

// ---- News ----
function renderNews(articles) {
  const container = document.getElementById("news-grid");
  if (!container) return;
  const lu = document.getElementById("news-last-update");
  if (lu) lu.textContent = "Updated " + new Date().toLocaleTimeString();

  container.innerHTML = articles.slice(0,9).map((a,i) => `
    <div class="news-card ${i===0?'news-featured':''}">
      ${a.image ? `<div class="news-img" style="background-image:url('${a.image}')"></div>` : `<div class="news-img-placeholder"><span>⚽</span></div>`}
      <div class="news-body">
        ${a.tag ? `<span class="news-tag">${a.tag}</span>` : ''}
        <h4 class="news-title">${a.title}</h4>
        <p class="news-desc">${a.description||''}</p>
        <div class="news-meta">
          <span>${a.source?.name||'Sports News'}</span>
          <span>${timeAgo(a.publishedAt)}</span>
          ${a.url && a.url !== '#' ? `<a href="${a.url}" target="_blank" rel="noopener" class="news-read">Read →</a>` : ''}
        </div>
      </div>
    </div>`).join("");
}

function timeAgo(ds) {
  const diff = Date.now() - new Date(ds);
  const h = Math.floor(diff/3600000), m = Math.floor(diff/60000);
  if (h>23) return Math.floor(h/24)+"d ago"; if (h>0) return h+"h ago"; return m+"m ago";
}

// ---- Search ----
function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    if (!q) { renderTeams(); return; }
    const filtered = TEAMS.filter(t => t.name.toLowerCase().includes(q) || t.conf.toLowerCase().includes(q) || ("group "+t.group).toLowerCase().includes(q));
    const container = document.getElementById("teams-grid");
    container.innerHTML = `<div class="conf-section"><div class="teams-row">${filtered.map(renderTeamCard).join("")}</div></div>`;
    container.querySelectorAll(".team-card").forEach(c => c.addEventListener("click", () => openTeamModal(c.dataset.id)));
  });
}

// ---- Scroll animations ----
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }), { threshold: 0.08 });
  document.querySelectorAll(".section-fade").forEach(el => obs.observe(el));
}
