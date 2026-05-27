// Vercel Serverless Function — secure API-Football proxy
// Set API_FOOTBALL_KEY in Vercel → Project → Settings → Environment Variables.
// Endpoint: https://v3.football.api-sports.io  (key as x-apisports-key header)
// WC 2026 league ID = 1, season = 2026
// Free tier: 100 req/day  →  cache 5 min to stay well within quota.

// Team code map: API-Football country name → our site's teamId
const COUNTRY_TO_ID = {
  "Mexico": "mex", "South Africa": "zaf", "Korea Republic": "kor", "Czech Republic": "cze", "Czechia": "cze",
  "Canada": "can", "Bosnia and Herzegovina": "bih", "Qatar": "qat", "Switzerland": "sui",
  "Brazil": "bra", "Morocco": "mar", "Haiti": "hai", "Scotland": "sco",
  "United States": "usa", "Paraguay": "par", "Australia": "aus", "Turkey": "tur", "Türkiye": "tur",
  "Germany": "ger", "Curacao": "cuw", "Curaçao": "cuw", "Ivory Coast": "civ", "Côte d'Ivoire": "civ",
  "Netherlands": "ned", "Japan": "jpn", "Sweden": "swe", "Tunisia": "tun",
  "Belgium": "bel", "Egypt": "egy", "Iran": "irn", "New Zealand": "nzl",
  "Spain": "esp", "Cape Verde": "cpv", "Saudi Arabia": "sau", "Uruguay": "uru",
  "France": "fra", "Senegal": "sen", "Iraq": "irq", "Norway": "nor",
  "Argentina": "arg", "Algeria": "dza", "Austria": "aut", "Jordan": "jor",
  "Portugal": "por", "DR Congo": "cod", "Congo DR": "cod", "Uzbekistan": "uzb", "Colombia": "col",
  "England": "eng", "Croatia": "cro", "Ghana": "gha", "Panama": "pan",
};

// Status codes that mean the match is live right now
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"]);
// Status codes that mean the match is finished
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;

  // Cache at the edge: 5 min fresh, 10 min stale — conserves daily quota
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (!key) {
    return res.status(200).json({ fixtures: [], fallback: true, reason: "API_FOOTBALL_KEY not configured" });
  }

  const url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";

  try {
    const r = await fetch(url, {
      headers: {
        "x-apisports-key": key,
        "Accept": "application/json",
      },
    });

    if (!r.ok) {
      return res.status(200).json({ fixtures: [], fallback: true, reason: `API-Football ${r.status}` });
    }

    const json = await r.json();
    const raw = json.response || [];

    const fixtures = raw.map(item => {
      const f = item.fixture;
      const teams = item.teams;
      const goals = item.goals;
      const score = item.score;
      const status = f.status?.short || "";

      const homeId = COUNTRY_TO_ID[teams.home?.name] || null;
      const awayId = COUNTRY_TO_ID[teams.away?.name] || null;

      // Parse UTC kickoff to date + time strings matching our MATCHES format
      const kickoff = new Date(f.date);
      const dateStr = kickoff.toISOString().slice(0, 10);                  // "2026-06-11"
      const timeStr = kickoff.toISOString().slice(11, 16);                 // "20:00" (UTC)

      const isLive = LIVE_STATUSES.has(status);
      const isFinished = FINISHED_STATUSES.has(status);
      const hasScore = isLive || isFinished;

      return {
        fixtureId: f.id,
        homeId,
        awayId,
        homeName: teams.home?.name,
        awayName: teams.away?.name,
        date: dateStr,
        time: timeStr,
        venue: f.venue?.name || null,
        status,
        statusLong: f.status?.long || "",
        elapsed: f.status?.elapsed || null,
        isLive,
        isFinished,
        homeScore: hasScore ? goals.home : null,
        awayScore: hasScore ? goals.away : null,
        // Halftime / extra-time sub-scores for the predictor
        htHome: score.halftime?.home ?? null,
        htAway: score.halftime?.away ?? null,
        etHome: score.extratime?.home ?? null,
        etAway: score.extratime?.away ?? null,
        penHome: score.penalty?.home ?? null,
        penAway: score.penalty?.away ?? null,
      };
    });

    return res.status(200).json({ fixtures, fallback: false, count: fixtures.length });
  } catch (e) {
    return res.status(200).json({ fixtures: [], fallback: true, reason: e.message });
  }
}
