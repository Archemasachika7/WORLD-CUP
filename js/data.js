// ============================================================
// FIFA WORLD CUP 2026 — Static Data
// Hosts: USA, Canada, Mexico | 48 Teams | 104 Matches
// ============================================================

const WC_META = {
  year: 2026,
  hosts: ["United States", "Canada", "Mexico"],
  teams: 48,
  matches: 104,
  streamUrl: "#live-stream",
  startDate: "2026-06-11",
  finalDate: "2026-07-19",
  venues: [
    { name: "MetLife Stadium", city: "New York/New Jersey", capacity: 82500, country: "USA" },
    { name: "AT&T Stadium", city: "Dallas", capacity: 80000, country: "USA" },
    { name: "SoFi Stadium", city: "Los Angeles", capacity: 70240, country: "USA" },
    { name: "Levi's Stadium", city: "San Francisco", capacity: 68500, country: "USA" },
    { name: "Hard Rock Stadium", city: "Miami", capacity: 65326, country: "USA" },
    { name: "Arrowhead Stadium", city: "Kansas City", capacity: 76416, country: "USA" },
    { name: "Seahawks Stadium", city: "Seattle", capacity: 69000, country: "USA" },
    { name: "Lincoln Financial Field", city: "Philadelphia", capacity: 69328, country: "USA" },
    { name: "Gillette Stadium", city: "Boston", capacity: 65878, country: "USA" },
    { name: "NRG Stadium", city: "Houston", capacity: 72220, country: "USA" },
    { name: "Estadio Azteca", city: "Mexico City", capacity: 87523, country: "Mexico" },
    { name: "Estadio BBVA", city: "Monterrey", capacity: 53500, country: "Mexico" },
    { name: "Estadio Akron", city: "Guadalajara", capacity: 49850, country: "Mexico" },
    { name: "BMO Field", city: "Toronto", capacity: 30000, country: "Canada" },
    { name: "BC Place", city: "Vancouver", capacity: 54500, country: "Canada" },
    { name: "Stade de Montréal", city: "Montreal", capacity: 61004, country: "Canada" },
  ]
};

// ---- All 48 qualified teams ----
const TEAMS = [
  // UEFA (16)
  { id: "ger", name: "Germany",      flag: "🇩🇪", conf: "UEFA",     group: "A", ranking: 12, color: "#000000", kit: "#ffffff", elo: 1921 },
  { id: "fra", name: "France",       flag: "🇫🇷", conf: "UEFA",     group: "B", ranking: 2,  color: "#002395", kit: "#ffffff", elo: 1985 },
  { id: "eng", name: "England",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf: "UEFA",     group: "C", ranking: 5,  color: "#ffffff", kit: "#0000ff", elo: 1942 },
  { id: "esp", name: "Spain",        flag: "🇪🇸", conf: "UEFA",     group: "D", ranking: 1,  color: "#c60b1e", kit: "#c60b1e", elo: 1994 },
  { id: "por", name: "Portugal",     flag: "🇵🇹", conf: "UEFA",     group: "E", ranking: 6,  color: "#006600", kit: "#ff0000", elo: 1963 },
  { id: "ned", name: "Netherlands",  flag: "🇳🇱", conf: "UEFA",     group: "F", ranking: 7,  color: "#ff6600", kit: "#ff6600", elo: 1955 },
  { id: "bel", name: "Belgium",      flag: "🇧🇪", conf: "UEFA",     group: "G", ranking: 3,  color: "#000000", kit: "#ff0000", elo: 1930 },
  { id: "ita", name: "Italy",        flag: "🇮🇹", conf: "UEFA",     group: "H", ranking: 9,  color: "#003399", kit: "#003399", elo: 1915 },
  { id: "cro", name: "Croatia",      flag: "🇭🇷", conf: "UEFA",     group: "I", ranking: 10, color: "#ff0000", kit: "#ff0000", elo: 1905 },
  { id: "sui", name: "Switzerland",  flag: "🇨🇭", conf: "UEFA",     group: "J", ranking: 13, color: "#ff0000", kit: "#ff0000", elo: 1877 },
  { id: "aut", name: "Austria",      flag: "🇦🇹", conf: "UEFA",     group: "K", ranking: 25, color: "#cc0000", kit: "#cc0000", elo: 1841 },
  { id: "sco", name: "Scotland",     flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf: "UEFA",     group: "L", ranking: 38, color: "#003399", kit: "#003399", elo: 1790 },
  { id: "srb", name: "Serbia",       flag: "🇷🇸", conf: "UEFA",     group: "A", ranking: 33, color: "#cc0000", kit: "#ffffff", elo: 1822 },
  { id: "tur", name: "Türkiye",      flag: "🇹🇷", conf: "UEFA",     group: "B", ranking: 29, color: "#cc0000", kit: "#cc0000", elo: 1832 },
  { id: "dnk", name: "Denmark",      flag: "🇩🇰", conf: "UEFA",     group: "C", ranking: 20, color: "#cc0000", kit: "#cc0000", elo: 1865 },
  { id: "ukr", name: "Ukraine",      flag: "🇺🇦", conf: "UEFA",     group: "D", ranking: 22, color: "#ffd700", kit: "#0057a8", elo: 1835 },

  // CONMEBOL (6)
  { id: "arg", name: "Argentina",    flag: "🇦🇷", conf: "CONMEBOL", group: "E", ranking: 4,  color: "#74acdf", kit: "#74acdf", elo: 2001 },
  { id: "bra", name: "Brazil",       flag: "🇧🇷", conf: "CONMEBOL", group: "F", ranking: 5,  color: "#009c3b", kit: "#009c3b", elo: 1978 },
  { id: "uru", name: "Uruguay",      flag: "🇺🇾", conf: "CONMEBOL", group: "G", ranking: 17, color: "#0038a8", kit: "#0038a8", elo: 1890 },
  { id: "col", name: "Colombia",     flag: "🇨🇴", conf: "CONMEBOL", group: "H", ranking: 11, color: "#fcd116", kit: "#fcd116", elo: 1875 },
  { id: "ecu", name: "Ecuador",      flag: "🇪🇨", conf: "CONMEBOL", group: "I", ranking: 44, color: "#ffd100", kit: "#ffd100", elo: 1815 },
  { id: "ven", name: "Venezuela",    flag: "🇻🇪", conf: "CONMEBOL", group: "J", ranking: 52, color: "#cf142b", kit: "#cf142b", elo: 1788 },

  // CONCACAF (6)
  { id: "usa", name: "United States",flag: "🇺🇸", conf: "CONCACAF", group: "K", ranking: 14, color: "#002868", kit: "#002868", elo: 1861, isHost: true },
  { id: "mex", name: "Mexico",       flag: "🇲🇽", conf: "CONCACAF", group: "L", ranking: 15, color: "#006847", kit: "#006847", elo: 1852, isHost: true },
  { id: "can", name: "Canada",       flag: "🇨🇦", conf: "CONCACAF", group: "A", ranking: 43, color: "#ff0000", kit: "#ff0000", elo: 1793, isHost: true },
  { id: "pan", name: "Panama",       flag: "🇵🇦", conf: "CONCACAF", group: "B", ranking: 50, color: "#cf142b", kit: "#ffffff", elo: 1768 },
  { id: "cos", name: "Costa Rica",   flag: "🇨🇷", conf: "CONCACAF", group: "C", ranking: 48, color: "#002b7f", kit: "#ffffff", elo: 1755 },
  { id: "jam", name: "Jamaica",      flag: "🇯🇲", conf: "CONCACAF", group: "D", ranking: 55, color: "#000000", kit: "#ffd700", elo: 1740 },

  // AFC (8)
  { id: "jpn", name: "Japan",        flag: "🇯🇵", conf: "AFC",      group: "E", ranking: 18, color: "#003087", kit: "#003087", elo: 1882 },
  { id: "kor", name: "South Korea",  flag: "🇰🇷", conf: "AFC",      group: "F", ranking: 23, color: "#003478", kit: "#003478", elo: 1848 },
  { id: "irn", name: "Iran",         flag: "🇮🇷", conf: "AFC",      group: "G", ranking: 21, color: "#239f40", kit: "#239f40", elo: 1844 },
  { id: "aus", name: "Australia",    flag: "🇦🇺", conf: "AFC",      group: "H", ranking: 26, color: "#ffcd00", kit: "#00843d", elo: 1828 },
  { id: "sau", name: "Saudi Arabia", flag: "🇸🇦", conf: "AFC",      group: "I", ranking: 56, color: "#006c35", kit: "#006c35", elo: 1772 },
  { id: "uzb", name: "Uzbekistan",   flag: "🇺🇿", conf: "AFC",      group: "J", ranking: 67, color: "#1eb53a", kit: "#1eb53a", elo: 1755 },
  { id: "irq", name: "Iraq",         flag: "🇮🇶", conf: "AFC",      group: "K", ranking: 68, color: "#007a3d", kit: "#007a3d", elo: 1740 },
  { id: "jor", name: "Jordan",       flag: "🇯🇴", conf: "AFC",      group: "L", ranking: 70, color: "#007a3d", kit: "#ffffff", elo: 1730 },

  // CAF (9)
  { id: "mar", name: "Morocco",      flag: "🇲🇦", conf: "CAF",      group: "A", ranking: 14, color: "#c1272d", kit: "#c1272d", elo: 1880 },
  { id: "sen", name: "Senegal",      flag: "🇸🇳", conf: "CAF",      group: "B", ranking: 19, color: "#00853f", kit: "#00853f", elo: 1856 },
  { id: "nga", name: "Nigeria",      flag: "🇳🇬", conf: "CAF",      group: "C", ranking: 40, color: "#008751", kit: "#ffffff", elo: 1822 },
  { id: "egy", name: "Egypt",        flag: "🇪🇬", conf: "CAF",      group: "D", ranking: 36, color: "#cc0001", kit: "#cc0001", elo: 1810 },
  { id: "civ", name: "Côte d'Ivoire",flag: "🇨🇮", conf: "CAF",      group: "E", ranking: 46, color: "#ff8200", kit: "#ff8200", elo: 1798 },
  { id: "cmr", name: "Cameroon",     flag: "🇨🇲", conf: "CAF",      group: "F", ranking: 41, color: "#007a5e", kit: "#007a5e", elo: 1802 },
  { id: "gha", name: "Ghana",        flag: "🇬🇭", conf: "CAF",      group: "G", ranking: 62, color: "#006b3f", kit: "#ffffff", elo: 1778 },
  { id: "zaf", name: "South Africa", flag: "🇿🇦", conf: "CAF",      group: "H", ranking: 64, color: "#007a4d", kit: "#007a4d", elo: 1762 },
  { id: "dza", name: "Algeria",      flag: "🇩🇿", conf: "CAF",      group: "I", ranking: 36, color: "#006233", kit: "#ffffff", elo: 1815 },

  // OFC (1)
  { id: "nzl", name: "New Zealand",  flag: "🇳🇿", conf: "OFC",      group: "J", ranking: 101, color: "#000000", kit: "#ffffff", elo: 1705 },

  // Interconfederal Playoff (2)
  { id: "pri", name: "Paraguay",     flag: "🇵🇾", conf: "CONMEBOL", group: "K", ranking: 74, color: "#d52b1e", kit: "#d52b1e", elo: 1754 },
  { id: "geo", name: "Georgia",      flag: "🇬🇪", conf: "UEFA",     group: "L", ranking: 75, color: "#ff0000", kit: "#ffffff", elo: 1749 },
];

// ---- Top Players (per league, for analysis engine) ----
const PLAYERS = {
  EPL: [
    { name: "Mohamed Salah",      club: "Liverpool",       nation: "🇪🇬", goals: 28, assists: 13, ga: 0,  cs: 0,  rating: 9.1, award: "Golden Boot 2025", teamId: "egy" },
    { name: "Erling Haaland",     club: "Man City",        nation: "🇳🇴", goals: 27, assists: 6,  ga: 0,  cs: 0,  rating: 9.0, award: null, teamId: null },
    { name: "Bruno Fernandes",    club: "Man United",      nation: "🇵🇹", goals: 14, assists: 17, ga: 0,  cs: 0,  rating: 8.5, award: "EPL Playmaker Award 2025", teamId: "por" },
    { name: "Bukayo Saka",        club: "Arsenal",         nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 18, assists: 14, ga: 0,  cs: 0,  rating: 8.7, award: null, teamId: "eng" },
    { name: "Phil Foden",         club: "Man City",        nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 19, assists: 11, ga: 0,  cs: 0,  rating: 8.8, award: "PFA Player of the Year 2025", teamId: "eng" },
    { name: "Virgil van Dijk",    club: "Liverpool",       nation: "🇳🇱", goals: 3,  assists: 2,  ga: 28, cs: 0,  rating: 8.6, award: null, teamId: "ned" },
    { name: "David Raya",         club: "Arsenal",         nation: "🇪🇸", goals: 0,  assists: 0,  ga: 24, cs: 18, rating: 8.3, award: null, teamId: "esp" },
  ],
  LaLiga: [
    { name: "Kylian Mbappé",      club: "Real Madrid",     nation: "🇫🇷", goals: 32, assists: 10, ga: 0,  cs: 0,  rating: 9.3, award: "Pichichi 2025", teamId: "fra" },
    { name: "Vinicius Jr.",       club: "Real Madrid",     nation: "🇧🇷", goals: 24, assists: 15, ga: 0,  cs: 0,  rating: 9.2, award: "Ballon d'Or 2025", teamId: "bra" },
    { name: "Jude Bellingham",    club: "Real Madrid",     nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 19, assists: 10, ga: 0,  cs: 0,  rating: 8.9, award: null, teamId: "eng" },
    { name: "Robert Lewandowski", club: "Barcelona",       nation: "🇵🇱", goals: 22, assists: 7,  ga: 0,  cs: 0,  rating: 8.6, award: null, teamId: null },
    { name: "Lamine Yamal",       club: "Barcelona",       nation: "🇪🇸", goals: 17, assists: 18, ga: 0,  cs: 0,  rating: 8.9, award: "La Liga Best Young Player 2025", teamId: "esp" },
    { name: "Pedri",              club: "Barcelona",       nation: "🇪🇸", goals: 11, assists: 12, ga: 0,  cs: 0,  rating: 8.5, award: null, teamId: "esp" },
    { name: "Thibaut Courtois",   club: "Real Madrid",     nation: "🇧🇪", goals: 0,  assists: 0,  ga: 22, cs: 20, rating: 8.8, award: "Zamora Trophy 2025", teamId: "bel" },
  ],
  Bundesliga: [
    { name: "Harry Kane",         club: "Bayern Munich",   nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 36, assists: 14, ga: 0,  cs: 0,  rating: 9.1, award: "Bundesliga Top Scorer 2025", teamId: "eng" },
    { name: "Florian Wirtz",      club: "Bayer Leverkusen",nation: "🇩🇪", goals: 18, assists: 20, ga: 0,  cs: 0,  rating: 8.9, award: "Bundesliga Player of Year 2025", teamId: "ger" },
    { name: "Jamal Musiala",      club: "Bayern Munich",   nation: "🇩🇪", goals: 20, assists: 14, ga: 0,  cs: 0,  rating: 8.8, award: null, teamId: "ger" },
    { name: "Granit Xhaka",       club: "Bayer Leverkusen",nation: "🇨🇭", goals: 8,  assists: 10, ga: 0,  cs: 0,  rating: 8.2, award: null, teamId: "sui" },
    { name: "Manuel Neuer",       club: "Bayern Munich",   nation: "🇩🇪", goals: 0,  assists: 0,  ga: 20, cs: 19, rating: 8.4, award: null, teamId: "ger" },
  ],
  SerieA: [
    { name: "Lautaro Martínez",   club: "Inter Milan",     nation: "🇦🇷", goals: 29, assists: 9,  ga: 0,  cs: 0,  rating: 8.9, award: "Serie A Top Scorer 2025", teamId: "arg" },
    { name: "Federico Chiesa",    club: "Juventus",        nation: "🇮🇹", goals: 15, assists: 11, ga: 0,  cs: 0,  rating: 8.2, award: null, teamId: "ita" },
    { name: "Rafael Leão",        club: "AC Milan",        nation: "🇵🇹", goals: 20, assists: 13, ga: 0,  cs: 0,  rating: 8.6, award: "Serie A Best Player 2025", teamId: "por" },
    { name: "Nicolò Barella",     club: "Inter Milan",     nation: "🇮🇹", goals: 10, assists: 14, ga: 0,  cs: 0,  rating: 8.5, award: null, teamId: "ita" },
    { name: "Mike Maignan",       club: "AC Milan",        nation: "🇫🇷", goals: 0,  assists: 0,  ga: 23, cs: 17, rating: 8.7, award: null, teamId: "fra" },
  ],
  Ligue1: [
    { name: "Ousmane Dembélé",    club: "PSG",             nation: "🇫🇷", goals: 18, assists: 17, ga: 0,  cs: 0,  rating: 8.5, award: "Ligue 1 Player of the Year 2025", teamId: "fra" },
    { name: "Bradley Barcola",    club: "PSG",             nation: "🇫🇷", goals: 22, assists: 9,  ga: 0,  cs: 0,  rating: 8.4, award: "Ligue 1 Top Scorer 2025", teamId: "fra" },
    { name: "Gianluigi Donnarumma",club:"PSG",             nation: "🇮🇹", goals: 0,  assists: 0,  ga: 21, cs: 19, rating: 8.6, award: null, teamId: "ita" },
    { name: "Amine Harit",        club: "OM Marseille",    nation: "🇲🇦", goals: 14, assists: 12, ga: 0,  cs: 0,  rating: 8.1, award: null, teamId: "mar" },
  ]
};

// ---- Season Awards Summary ----
const AWARDS = [
  { award: "Ballon d'Or 2025",                winner: "Vinicius Jr.",      nation: "🇧🇷", club: "Real Madrid",        league: "La Liga",     teamId: "bra" },
  { award: "FIFA Best Men's Player 2025",      winner: "Kylian Mbappé",     nation: "🇫🇷", club: "Real Madrid",        league: "La Liga",     teamId: "fra" },
  { award: "EPL Golden Boot 2025",             winner: "Mohamed Salah",     nation: "🇪🇬", club: "Liverpool",          league: "EPL",         teamId: "egy" },
  { award: "PFA Player of the Year 2025",      winner: "Phil Foden",        nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City",           league: "EPL",         teamId: "eng" },
  { award: "La Liga Pichichi 2025",            winner: "Kylian Mbappé",     nation: "🇫🇷", club: "Real Madrid",        league: "La Liga",     teamId: "fra" },
  { award: "La Liga Best Young Player 2025",   winner: "Lamine Yamal",      nation: "🇪🇸", club: "Barcelona",          league: "La Liga",     teamId: "esp" },
  { award: "Bundesliga Top Scorer 2025",       winner: "Harry Kane",        nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Bayern Munich",      league: "Bundesliga",  teamId: "eng" },
  { award: "Bundesliga Player of Year 2025",   winner: "Florian Wirtz",     nation: "🇩🇪", club: "Bayer Leverkusen",   league: "Bundesliga",  teamId: "ger" },
  { award: "Serie A Top Scorer 2025",          winner: "Lautaro Martínez",  nation: "🇦🇷", club: "Inter Milan",        league: "Serie A",     teamId: "arg" },
  { award: "Serie A Best Player 2025",         winner: "Rafael Leão",       nation: "🇵🇹", club: "AC Milan",           league: "Serie A",     teamId: "por" },
  { award: "Ligue 1 Player of the Year 2025",  winner: "Ousmane Dembélé",   nation: "🇫🇷", club: "PSG",               league: "Ligue 1",     teamId: "fra" },
  { award: "UEFA Nations League 2025",         winner: "Spain",             nation: "🇪🇸", club: "National Team",      league: "UEFA",        teamId: "esp" },
  { award: "Copa América 2024",                winner: "Argentina",         nation: "🇦🇷", club: "National Team",      league: "CONMEBOL",    teamId: "arg" },
  { award: "AFCON 2025",                       winner: "Morocco",           nation: "🇲🇦", club: "National Team",      league: "CAF",         teamId: "mar" },
  { award: "AFC Asian Cup 2027 (prev.)",       winner: "Japan",             nation: "🇯🇵", club: "National Team",      league: "AFC",         teamId: "jpn" },
];

// ---- Match Schedule (Selected key group matches shown; full 104 gen'd by app) ----
const MATCHES = [
  // Opening match
  { id: 1,  stage: "Group A", home: "mex", away: "ger", date: "2026-06-11", time: "20:00", venue: "Estadio Azteca",    result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 2,  stage: "Group A", home: "mar", away: "can", date: "2026-06-11", time: "17:00", venue: "MetLife Stadium",   result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 3,  stage: "Group B", home: "fra", away: "tur", date: "2026-06-12", time: "20:00", venue: "AT&T Stadium",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 4,  stage: "Group B", home: "pan", away: "sen", date: "2026-06-12", time: "17:00", venue: "Hard Rock Stadium", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 5,  stage: "Group C", home: "eng", away: "dnk", date: "2026-06-13", time: "20:00", venue: "SoFi Stadium",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 6,  stage: "Group C", home: "cos", away: "nga", date: "2026-06-13", time: "17:00", venue: "Levi's Stadium",    result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 7,  stage: "Group D", home: "esp", away: "ukr", date: "2026-06-14", time: "20:00", venue: "MetLife Stadium",   result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 8,  stage: "Group D", home: "jam", away: "egy", date: "2026-06-14", time: "17:00", venue: "Arrowhead Stadium", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 9,  stage: "Group E", home: "arg", away: "por", date: "2026-06-15", time: "20:00", venue: "AT&T Stadium",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 10, stage: "Group E", home: "jpn", away: "civ", date: "2026-06-15", time: "17:00", venue: "NRG Stadium",       result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 11, stage: "Group F", home: "bra", away: "ned", date: "2026-06-16", time: "20:00", venue: "SoFi Stadium",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 12, stage: "Group F", home: "kor", away: "cmr", date: "2026-06-16", time: "17:00", venue: "Gillette Stadium",  result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 13, stage: "Group G", home: "bel", away: "uru", date: "2026-06-17", time: "20:00", venue: "Hard Rock Stadium", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 14, stage: "Group G", home: "irn", away: "gha", date: "2026-06-17", time: "17:00", venue: "BC Place",          result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 15, stage: "Group H", home: "ita", away: "col", date: "2026-06-18", time: "20:00", venue: "Lincoln Financial", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 16, stage: "Group H", home: "aus", away: "zaf", date: "2026-06-18", time: "17:00", venue: "BMO Field",         result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 17, stage: "Group I", home: "cro", away: "ecu", date: "2026-06-19", time: "20:00", venue: "AT&T Stadium",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 18, stage: "Group I", home: "irq", away: "sau", date: "2026-06-19", time: "17:00", venue: "Estadio BBVA",      result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 19, stage: "Group J", home: "sui", away: "ven", date: "2026-06-20", time: "20:00", venue: "Seahawks Stadium",  result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 20, stage: "Group J", home: "uzb", away: "nzl", date: "2026-06-20", time: "17:00", venue: "Stade de Montréal", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 21, stage: "Group K", home: "usa", away: "pri", date: "2026-06-21", time: "20:00", venue: "MetLife Stadium",   result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 22, stage: "Group K", home: "aut", away: "irq", date: "2026-06-21", time: "17:00", venue: "Arrowhead Stadium", result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 23, stage: "Group L", home: "mex", away: "geo", date: "2026-06-22", time: "20:00", venue: "Estadio Akron",     result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
  { id: 24, stage: "Group L", home: "sco", away: "jor", date: "2026-06-22", time: "17:00", venue: "NRG Stadium",       result: null, homeScore: null, awayScore: null, homeStats: null, awayStats: null },
];

// For localStorage persistence key
const STORAGE_KEY = "wc2026_data";
const NEWS_KEY    = "wc2026_news";
const NEWS_TTL    = 6 * 60 * 60 * 1000; // 6 hours in ms
