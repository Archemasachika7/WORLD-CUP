// ============================================================
// Predictions Engine — Elo + Weighted Squad Strength + In-Play
// ============================================================

const Predictions = (() => {

  // Build squad strength using LEAGUE_META weights
  // Top-5 league players count fully; non-top-5 discounted
  function buildSquadStrengths() {
    const scores = {};
    TEAMS.forEach(t => { scores[t.id] = { weightedSum: 0, weightTotal: 0, awardBonus: 0, top5Count: 0, nonTop5Count: 0, formBoost: 0 }; });

    PLAYERS.forEach(p => {
      if (!p.teamId || !scores[p.teamId]) return;
      const lm = LEAGUE_META[p.league] || LEAGUE_META["Other"];
      const w  = lm.weight;
      scores[p.teamId].weightedSum   += p.rating * w;
      scores[p.teamId].weightTotal   += w;
      scores[p.teamId].formBoost     += ((p.goals||0) + 0.7*(p.assists||0)) * 0.01 * w;
      if (lm.tier === 1) scores[p.teamId].top5Count++;
      else               scores[p.teamId].nonTop5Count++;
    });

    AWARDS.forEach(a => {
      if (a.teamId && scores[a.teamId]) {
        const lm = LEAGUE_META[a.league] || LEAGUE_META["Other"];
        scores[a.teamId].awardBonus += 0.25 * (lm.weight || 0.5);
      }
    });

    const result = {};
    TEAMS.forEach(t => {
      const s = scores[t.id];
      const base = s.weightTotal > 0 ? s.weightedSum / s.weightTotal : 7.5;
      result[t.id] = {
        score: base + s.awardBonus + Math.min(0.6, s.formBoost),
        top5Count: s.top5Count,
        nonTop5Count: s.nonTop5Count,
        awardBonus: s.awardBonus,
        formBoost: Math.min(0.6, s.formBoost),
      };
    });
    return result;
  }

  const SQ = buildSquadStrengths();

  function compositeScore(team) {
    const maxElo = 2010, minElo = 1700;
    const eloNorm  = (team.elo - minElo) / (maxElo - minElo);
    const sq       = SQ[team.id]?.score || 7.5;
    const sqNorm   = Math.min(1, (sq - 7.0) / 2.5);
    const rankNorm = 1 - (Math.min(team.ranking, 110) - 1) / 109;
    return 0.40 * eloNorm + 0.35 * sqNorm + 0.25 * rankNorm;
  }

  // ---- Pre-match probability ----
  function getProbability(homeId, awayId) {
    const home = TEAMS.find(t => t.id === homeId);
    const away = TEAMS.find(t => t.id === awayId);
    if (!home || !away) return { home:33, draw:34, away:33 };

    const hS = compositeScore(home);
    const aS = compositeScore(away);
    const total = hS + aS;

    const eloDiff  = Math.abs(home.elo - away.elo);
    const drawProb = Math.max(0.14, 0.33 - eloDiff / 2600);
    const rem      = 1 - drawProb;

    const hFrac = hS / total;
    const hWin  = rem * hFrac;
    const aWin  = rem * (1 - hFrac);

    return {
      home: Math.round(hWin * 100),
      draw: Math.round(drawProb * 100),
      away: Math.round(aWin * 100),
      homeTeam: home, awayTeam: away,
      homeSqScore: SQ[homeId]?.score?.toFixed(2),
      awaySqScore: SQ[awayId]?.score?.toFixed(2),
      homeTop5: SQ[homeId]?.top5Count || 0,
      awayTop5: SQ[awayId]?.top5Count || 0,
    };
  }

  // ---- LIVE In-Play Probability ----
  // Updates as match progresses — score, minute, cards
  function getInPlayProbability(homeId, awayId, homeGoals, awayGoals, minute, homeRed = 0, awayRed = 0) {
    const pre = getProbability(homeId, awayId);
    const t   = Math.min(minute, 90) / 90;   // 0-1 elapsed
    const rem = 1 - t;                        // 0-1 remaining
    const diff = homeGoals - awayGoals;

    // Red card penalty: each red reduces team composite by ~12%
    const homeHandicap = 1 - homeRed * 0.12;
    const awayHandicap = 1 - awayRed * 0.12;
    const adjHome = (pre.home / 100) * homeHandicap;
    const adjAway = (pre.away / 100) * awayHandicap;

    let hWin, draw, aWin;

    if (diff === 0) {
      // Level — draw inflates with time
      const drawInflation = t * 0.42;
      draw = Math.min(0.94, pre.draw / 100 + drawInflation);
      const remaining_prob = 1 - draw;
      const ratio = adjHome / (adjHome + adjAway + 1e-6);
      hWin = remaining_prob * ratio;
      aWin = remaining_prob * (1 - ratio);
    } else if (diff > 0) {
      // Home leading
      const holdFactor = 1 - Math.pow(rem, 0.55) * (1 / (diff + 0.6)) * 0.85;
      hWin = adjHome + (holdFactor - adjHome) * t * 1.4;
      hWin = Math.min(0.97, Math.max(adjHome, hWin));
      draw  = diff === 1 ? (1 - hWin) * 0.28 * rem : (1 - hWin) * 0.06;
      aWin  = 1 - hWin - draw;
    } else {
      // Away leading
      const holdFactor = 1 - Math.pow(rem, 0.55) * (1 / (-diff + 0.6)) * 0.85;
      aWin = adjAway + (holdFactor - adjAway) * t * 1.4;
      aWin = Math.min(0.97, Math.max(adjAway, aWin));
      draw  = diff === -1 ? (1 - aWin) * 0.28 * rem : (1 - aWin) * 0.06;
      hWin  = 1 - aWin - draw;
    }

    // Clamp & normalise
    hWin = Math.max(0.01, hWin);
    draw = Math.max(0.01, draw);
    aWin = Math.max(0.01, aWin);
    const tot = hWin + draw + aWin;

    return {
      home: Math.round(hWin / tot * 100),
      draw: Math.round(draw / tot * 100),
      away: Math.round(aWin / tot * 100),
      momentum: diff > 0 ? "Home" : diff < 0 ? "Away" : "Level",
      matchVerdict: buildMatchVerdict(homeId, awayId, homeGoals, awayGoals, minute, hWin/tot, aWin/tot),
    };
  }

  function buildMatchVerdict(hId, aId, hG, aG, min, hWin, aWin) {
    const h = TEAMS.find(t => t.id === hId);
    const a = TEAMS.find(t => t.id === aId);
    if (!h || !a) return "";
    const diff = hG - aG;
    if (min === 0) return "Pre-match — move the sliders to see live probability shift";
    if (hWin > 0.75) return `${h.flag} ${h.name} in complete control`;
    if (aWin > 0.75) return `${a.flag} ${a.name} heading for the win`;
    if (Math.abs(diff) === 0 && min > 75) return "Late-game stalemate — penalty shootout looms";
    if (Math.abs(diff) === 1 && min > 70) return "Nervy finish — one goal can flip everything";
    if (diff > 0) return `${h.flag} ${h.name} are ahead — holding on`;
    if (diff < 0) return `${a.flag} ${a.name} are ahead — ${h.flag} ${h.name} chasing`;
    return "Tight encounter — any team can win";
  }

  

  function buildProbableXI(teamId) {
    const squad = SQUADS[teamId] || { players: [] };
    const tracked = new Map(PLAYERS.filter(p => p.teamId === teamId).map(p => [p.name.toLowerCase(), p]));
    const announced = squad.status === "ANNOUNCED";
    const candidates = (squad.players || []).map(sp => {
      const tp = tracked.get(sp.name.toLowerCase());
      const lm = LEAGUE_META[sp.league] || LEAGUE_META["Other"];
      if (announced && !tp) return null;
      const rating = tp?.rating || 6.2;
      const score = rating * (lm.weight || 0.5) + ((tp?.goals||0)*0.03 + (tp?.assists||0)*0.02);
      return { ...sp, rating, selectScore: score, goals: tp?.goals||0, assists: tp?.assists||0 };
    });
    const pick = (pos, n) => candidates.filter(c=>c.pos===pos).sort((a,b)=>b.selectScore-a.selectScore).slice(0,n);
    const gk = pick("GK",1);
    const df = pick("DF",4);
    const mf = pick("MF",3);
    const fw = pick("FW",3);
    const xi = [...gk,...df,...mf,...fw];
    return { formation:"4-3-3", players: xi.sort((a,b)=>b.selectScore-a.selectScore), complete: xi.length===11 };
  }
function getTournamentFavourites() {
    return TEAMS
      .map(t => {
        const comp = compositeScore(t);
        const sq   = SQ[t.id] || { score: 7.5, top5Count: 0, awardBonus: 0 };
        return {
          ...t,
          composite: comp,
          squadScore: sq.score.toFixed(2),
          top5Players: sq.top5Count,
          titlePct: Math.round(comp * comp * 100),
          titleLabel: comp > 0.76 ? "Strong Contender" : comp > 0.60 ? "Dark Horse" : comp > 0.42 ? "Possible Upset" : "Group Stage Exit Likely",
        };
      })
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 16);
  }

  function getTeamAnalysis(teamId) {
    const team    = TEAMS.find(t => t.id === teamId);
    if (!team) return null;
    const players = PLAYERS.filter(p => p.teamId === teamId);
    const awards  = AWARDS.filter(a  => a.teamId === teamId);
    const squad   = SQUADS[teamId] || { status:"UNANNOUNCED", note:"", players:[] };
    const sq      = SQ[teamId]     || { score: 7.5, top5Count: 0, nonTop5Count: 0, awardBonus: 0 };
    const comp    = compositeScore(team);

    const strengths  = [];
    const weaknesses = [];

    const elite = players.filter(p => p.goals > 15 || (p.rating >= 9.0));
    const gks   = players.filter(p => p.cs > 12 || (p.pos === "GK" && p.rating >= 8.5));
    const defs  = players.filter(p => p.pos === "DF" && p.rating >= 8.0);

    if (elite.length)        strengths.push(`Elite attacker${elite.length > 1 ? 's' : ''}: ${elite.map(p=>p.name).join(', ')}`);
    if (gks.length)          strengths.push(`World-class GK: ${gks.map(p=>p.name).join(', ')}`);
    if (defs.length)         strengths.push(`Defensive quality: ${defs.map(p=>p.name).join(', ')}`);
    if (awards.length)       strengths.push(`Season hardware: ${awards.map(a=>a.award).join('; ')}`);
    if (sq.top5Count >= 4)   strengths.push(`${sq.top5Count} players in top-5 European leagues — world-class depth`);

    if (sq.top5Count < 2)    weaknesses.push("Limited top-5 league representation — heavy non-top-5 discounting");
    if (team.ranking > 50)   weaknesses.push("Low FIFA ranking may lead to tough group draw exit");
    if (squad.status === "UNANNOUNCED") weaknesses.push("Squad not yet announced — analysis based on past tournaments");

    const probableXI = buildProbableXI(teamId);
    if (probableXI.complete) strengths.push("Probable XI available (rating-based selection model)");
    return { team, players, awards, squad, sq, probableXI, composite: comp, strengths, weaknesses };
  }

  return { getProbability, getInPlayProbability, getTournamentFavourites, getTeamAnalysis, SQ, buildProbableXI };
})();
