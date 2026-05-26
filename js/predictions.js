// ============================================================
// Win Probability Engine — Elo + Squad Strength + Form
// ============================================================

const Predictions = (() => {
  // Build team squad strength from player data
  function buildSquadStrengths() {
    const scores = {};
    TEAMS.forEach(t => { scores[t.id] = { totalRating: 0, count: 0, awardBonus: 0 }; });

    const allPlayers = Object.values(PLAYERS).flat();
    allPlayers.forEach(p => {
      if (p.teamId && scores[p.teamId]) {
        scores[p.teamId].totalRating += p.rating;
        scores[p.teamId].count++;
      }
    });

    AWARDS.forEach(a => {
      if (a.teamId && scores[a.teamId]) {
        scores[a.teamId].awardBonus += 0.3;
      }
    });

    const result = {};
    TEAMS.forEach(t => {
      const s = scores[t.id];
      result[t.id] = s.count > 0
        ? (s.totalRating / s.count) + s.awardBonus
        : 7.5;
    });
    return result;
  }

  const SQUAD_STRENGTH = buildSquadStrengths();

  // Elo-based expected win probability (classic formula)
  function eloProbability(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  }

  // Composite score: 40% Elo, 35% squad strength (normalised), 25% ranking
  function compositeScore(team) {
    const maxElo = 2010; const minElo = 1700;
    const eloNorm = (team.elo - minElo) / (maxElo - minElo);

    const sq = SQUAD_STRENGTH[team.id] || 7.5;
    const sqNorm = (sq - 7.0) / (9.5 - 7.0);

    const maxRank = 110; const minRank = 1;
    const rankNorm = 1 - (team.ranking - minRank) / (maxRank - minRank);

    return 0.40 * eloNorm + 0.35 * sqNorm + 0.25 * rankNorm;
  }

  function getProbability(homeId, awayId) {
    const home = TEAMS.find(t => t.id === homeId);
    const away = TEAMS.find(t => t.id === awayId);
    if (!home || !away) return { home: 33, draw: 34, away: 33 };

    const hScore = compositeScore(home);
    const aScore = compositeScore(away);

    // Base win prob from composite
    const total = hScore + aScore;
    const hWin = (hScore / total) * 0.75;
    const aWin = (aScore / total) * 0.75;

    // Elo draw tendency (closer elo = more draws)
    const eloDiff = Math.abs(home.elo - away.elo);
    const drawProb = Math.max(0.15, 0.32 - eloDiff / 2500);

    const remaining = 1 - drawProb;
    const hFinal = hWin * remaining / (hWin + aWin);
    const aFinal = aWin * remaining / (hWin + aWin);

    return {
      home: Math.round(hFinal * 100),
      draw: Math.round(drawProb * 100),
      away: Math.round(aFinal * 100),
      homeTeam: home,
      awayTeam: away,
      homeSqStrength: SQUAD_STRENGTH[homeId]?.toFixed(2),
      awaySqStrength: SQUAD_STRENGTH[awayId]?.toFixed(2),
    };
  }

  function getTournamentFavourites() {
    return TEAMS
      .map(t => ({
        ...t,
        composite: compositeScore(t),
        squadStrength: (SQUAD_STRENGTH[t.id] || 7.5).toFixed(2),
        title: computeTitleOdds(t),
      }))
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 12);
  }

  // Rough title odds based on composite score (not real betting markets)
  function computeTitleOdds(team) {
    const s = compositeScore(team);
    const odds = {
      percentage: Math.round(s * s * 100),
      label: s > 0.75 ? "Strong Contender" : s > 0.55 ? "Dark Horse" : s > 0.35 ? "Possible Upset" : "Group Stage Exit Likely"
    };
    return odds;
  }

  function getTeamAnalysis(teamId) {
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return null;

    const allPlayers = Object.values(PLAYERS).flat().filter(p => p.teamId === teamId);
    const teamAwards = AWARDS.filter(a => a.teamId === teamId);
    const sq = SQUAD_STRENGTH[teamId] || 7.5;
    const comp = compositeScore(team);

    const strengths = [];
    const weaknesses = [];

    const goalScorers = allPlayers.filter(p => p.goals > 15);
    const defenders  = allPlayers.filter(p => p.ga > 0);
    const keepers    = allPlayers.filter(p => p.cs > 10);

    if (goalScorers.length)  strengths.push(`Elite scorer${goalScorers.length > 1 ? 's' : ''}: ${goalScorers.map(p => p.name).join(', ')}`);
    if (defenders.length)    strengths.push(`Solid defence via ${defenders.map(p => p.name).join(', ')}`);
    if (keepers.length)      strengths.push(`World-class GK: ${keepers.map(p => p.name).join(', ')}`);
    if (teamAwards.length)   strengths.push(`Season hardware: ${teamAwards.map(a => a.award).join('; ')}`);

    if (allPlayers.length < 2) weaknesses.push("Limited top-5 league representation");
    if (team.ranking > 40)     weaknesses.push("Lower FIFA ranking may cause tough draws");
    if (sq < 7.8)              weaknesses.push("Squad depth a concern vs. elite opposition");

    return { team, players: allPlayers, awards: teamAwards, squadStrength: sq.toFixed(2), composite: comp, strengths, weaknesses };
  }

  return { getProbability, getTournamentFavourites, getTeamAnalysis, SQUAD_STRENGTH };
})();
