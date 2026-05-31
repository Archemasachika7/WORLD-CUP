// Vercel Serverless Function — secure API-Football stats proxy
// Set API_FOOTBALL_KEY in Vercel → Settings → Environment Variables.
// Endpoint: https://v3.football.api-sports.io  (key as x-apisports-key header)
// WC 2026 league ID = 1, season = 2026
//
// Usage:  /api/stats?type=standings   → group tables (official)
//         /api/stats?type=scorers     → tournament top scorers
//         /api/stats?type=assists     → tournament top assists
//
// Free tier: 100 req/day → cache 5 min at the edge to conserve quota.

const ENDPOINTS = {
  standings: "https://v3.football.api-sports.io/standings?league=1&season=2026",
  scorers:   "https://v3.football.api-sports.io/players/topscorers?league=1&season=2026",
  assists:   "https://v3.football.api-sports.io/players/topassists?league=1&season=2026",
};

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  const type = (req.query?.type || "scorers").toString();

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (!ENDPOINTS[type]) {
    return res.status(400).json({ error: "invalid type", allowed: Object.keys(ENDPOINTS) });
  }

  if (!key) {
    return res.status(200).json({ type, data: [], fallback: true, reason: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const r = await fetch(ENDPOINTS[type], {
      headers: { "x-apisports-key": key, "Accept": "application/json" },
    });

    if (!r.ok) {
      return res.status(200).json({ type, data: [], fallback: true, reason: `API-Football ${r.status}` });
    }

    const json = await r.json();
    const raw = json.response || [];

    let data;
    if (type === "standings") {
      data = parseStandings(raw);
    } else {
      data = parsePlayers(raw, type);
    }

    return res.status(200).json({ type, data, fallback: false, count: data.length });
  } catch (e) {
    return res.status(200).json({ type, data: [], fallback: true, reason: e.message });
  }
}

function parsePlayers(raw, type) {
  return raw.slice(0, 20).map(item => {
    const p = item.player || {};
    const st = (item.statistics && item.statistics[0]) || {};
    return {
      name: p.name,
      photo: p.photo || null,
      nationality: p.nationality || null,
      age: p.age || null,
      team: st.team?.name || null,
      teamLogo: st.team?.logo || null,
      goals: st.goals?.total ?? 0,
      assists: st.goals?.assists ?? 0,
      appearances: st.games?.appearences ?? 0,
      minutes: st.games?.minutes ?? 0,
      value: type === "assists" ? (st.goals?.assists ?? 0) : (st.goals?.total ?? 0),
    };
  });
}

function parseStandings(raw) {
  const league = raw[0]?.league;
  if (!league) return [];
  // standings is an array of groups, each an array of team rows
  const groups = league.standings || [];
  return groups.map(rows => ({
    group: rows[0]?.group || "",
    rows: rows.map(t => ({
      rank: t.rank,
      team: t.team?.name,
      teamLogo: t.team?.logo,
      played: t.all?.played ?? 0,
      win: t.all?.win ?? 0,
      draw: t.all?.draw ?? 0,
      lose: t.all?.lose ?? 0,
      gf: t.all?.goals?.for ?? 0,
      ga: t.all?.goals?.against ?? 0,
      gd: t.goalsDiff ?? 0,
      points: t.points ?? 0,
      form: t.form || "",
    })),
  }));
}
