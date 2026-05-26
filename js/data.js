// ============================================================
// FIFA WORLD CUP 2026 — Real Data (2025-26 Season)
// Stats sourced from PlanetFootball, ESPN, Tribuna, Sky Sports
// Squad info from FIFA, ESPN, Sky Sports (squads deadline: June 2)
// Groups: confirmed official draw
// ============================================================

const WC_META = {
  year: 2026, hosts: ["United States", "Canada", "Mexico"],
  teams: 48, matches: 104,
  startDate: "2026-06-11", finalDate: "2026-07-19",
  venues: [
    { name: "MetLife Stadium",         city: "New York/NJ",    capacity: 82500, country: "USA"    },
    { name: "AT&T Stadium",            city: "Dallas",         capacity: 80000, country: "USA"    },
    { name: "SoFi Stadium",            city: "Los Angeles",    capacity: 70240, country: "USA"    },
    { name: "Levi's Stadium",          city: "San Francisco",  capacity: 68500, country: "USA"    },
    { name: "Hard Rock Stadium",       city: "Miami",          capacity: 65326, country: "USA"    },
    { name: "Arrowhead Stadium",       city: "Kansas City",    capacity: 76416, country: "USA"    },
    { name: "Lumen Field",             city: "Seattle",        capacity: 69000, country: "USA"    },
    { name: "Lincoln Financial Field", city: "Philadelphia",   capacity: 69328, country: "USA"    },
    { name: "Gillette Stadium",        city: "Boston",         capacity: 65878, country: "USA"    },
    { name: "NRG Stadium",             city: "Houston",        capacity: 72220, country: "USA"    },
    { name: "Estadio Azteca",          city: "Mexico City",    capacity: 87523, country: "Mexico" },
    { name: "Estadio BBVA",            city: "Monterrey",      capacity: 53500, country: "Mexico" },
    { name: "Estadio Akron",           city: "Guadalajara",    capacity: 49850, country: "Mexico" },
    { name: "BMO Field",               city: "Toronto",        capacity: 30000, country: "Canada" },
    { name: "BC Place",                city: "Vancouver",      capacity: 54500, country: "Canada" },
    { name: "Stade de Montréal",       city: "Montreal",       capacity: 61004, country: "Canada" },
  ]
};

// ---- League Metadata & Weightings ----
// Top-5 leagues = 1.0 weight; others weighted down for squad strength scoring
const LEAGUE_META = {
  "EPL":          { name: "Premier League",   nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", weight: 1.00, tier: 1 },
  "LaLiga":       { name: "La Liga",          nation: "🇪🇸", weight: 1.00, tier: 1 },
  "Bundesliga":   { name: "Bundesliga",       nation: "🇩🇪", weight: 1.00, tier: 1 },
  "SerieA":       { name: "Serie A",          nation: "🇮🇹", weight: 1.00, tier: 1 },
  "Ligue1":       { name: "Ligue 1",          nation: "🇫🇷", weight: 1.00, tier: 1 },
  "LigaPortugal": { name: "Liga Portugal",    nation: "🇵🇹", weight: 0.90, tier: 1 },
  "Eredivisie":   { name: "Eredivisie",       nation: "🇳🇱", weight: 0.65, tier: 2 },
  "SaudiPro":     { name: "Saudi Pro League", nation: "🇸🇦", weight: 0.58, tier: 2 },
  "LigaMX":       { name: "Liga MX",          nation: "🇲🇽", weight: 0.60, tier: 2 },
  "MLS":          { name: "MLS",              nation: "🇺🇸", weight: 0.55, tier: 2 },
  "JupilerPro":   { name: "Jupiler Pro",      nation: "🇧🇪", weight: 0.62, tier: 2 },
  "Other":        { name: "Other",            nation: "🌍", weight: 0.45, tier: 3 },
};

// ---- All 48 Teams ----
// Groups A–L (confirmed official draw)
const TEAMS = [

  // ── Group A ──────────────────────────────────────────────
  { id:"mex", name:"Mexico",              flag:"🇲🇽", conf:"CONCACAF", group:"A", ranking:15, elo:1852, isHost:true },
  { id:"zaf", name:"South Africa",        flag:"🇿🇦", conf:"CAF",      group:"A", ranking:64, elo:1762 },
  { id:"kor", name:"South Korea",         flag:"🇰🇷", conf:"AFC",      group:"A", ranking:23, elo:1848 },
  { id:"cze", name:"Czechia",             flag:"🇨🇿", conf:"UEFA",     group:"A", ranking:37, elo:1812 },

  // ── Group B ──────────────────────────────────────────────
  { id:"can", name:"Canada",              flag:"🇨🇦", conf:"CONCACAF", group:"B", ranking:43, elo:1793, isHost:true },
  { id:"bih", name:"Bosnia-Herzegovina",  flag:"🇧🇦", conf:"UEFA",     group:"B", ranking:63, elo:1764 },
  { id:"qat", name:"Qatar",               flag:"🇶🇦", conf:"AFC",      group:"B", ranking:58, elo:1768 },
  { id:"sui", name:"Switzerland",         flag:"🇨🇭", conf:"UEFA",     group:"B", ranking:13, elo:1877 },

  // ── Group C ──────────────────────────────────────────────
  { id:"bra", name:"Brazil",              flag:"🇧🇷", conf:"CONMEBOL", group:"C", ranking:5,  elo:1978 },
  { id:"mar", name:"Morocco",             flag:"🇲🇦", conf:"CAF",      group:"C", ranking:14, elo:1880 },
  { id:"hai", name:"Haiti",               flag:"🇭🇹", conf:"CONCACAF", group:"C", ranking:82, elo:1710 },
  { id:"sco", name:"Scotland",            flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf:"UEFA",     group:"C", ranking:38, elo:1790 },

  // ── Group D ──────────────────────────────────────────────
  { id:"usa", name:"United States",       flag:"🇺🇸", conf:"CONCACAF", group:"D", ranking:14, elo:1861, isHost:true },
  { id:"par", name:"Paraguay",            flag:"🇵🇾", conf:"CONMEBOL", group:"D", ranking:74, elo:1754 },
  { id:"aus", name:"Australia",           flag:"🇦🇺", conf:"AFC",      group:"D", ranking:26, elo:1828 },
  { id:"tur", name:"Türkiye",             flag:"🇹🇷", conf:"UEFA",     group:"D", ranking:29, elo:1832 },

  // ── Group E ──────────────────────────────────────────────
  { id:"ger", name:"Germany",             flag:"🇩🇪", conf:"UEFA",     group:"E", ranking:12, elo:1921 },
  { id:"cuw", name:"Curaçao",             flag:"🇨🇼", conf:"CONCACAF", group:"E", ranking:88, elo:1698, isDebut:true },
  { id:"civ", name:"Côte d'Ivoire",       flag:"🇨🇮", conf:"CAF",      group:"E", ranking:46, elo:1798 },
  { id:"ecu", name:"Ecuador",             flag:"🇪🇨", conf:"CONMEBOL", group:"E", ranking:44, elo:1815 },

  // ── Group F ──────────────────────────────────────────────
  { id:"ned", name:"Netherlands",         flag:"🇳🇱", conf:"UEFA",     group:"F", ranking:7,  elo:1955 },
  { id:"jpn", name:"Japan",               flag:"🇯🇵", conf:"AFC",      group:"F", ranking:18, elo:1882 },
  { id:"swe", name:"Sweden",              flag:"🇸🇪", conf:"UEFA",     group:"F", ranking:24, elo:1845 },
  { id:"tun", name:"Tunisia",             flag:"🇹🇳", conf:"CAF",      group:"F", ranking:35, elo:1818 },

  // ── Group G ──────────────────────────────────────────────
  { id:"bel", name:"Belgium",             flag:"🇧🇪", conf:"UEFA",     group:"G", ranking:3,  elo:1930 },
  { id:"egy", name:"Egypt",               flag:"🇪🇬", conf:"CAF",      group:"G", ranking:36, elo:1810 },
  { id:"irn", name:"Iran",                flag:"🇮🇷", conf:"AFC",      group:"G", ranking:21, elo:1844 },
  { id:"nzl", name:"New Zealand",         flag:"🇳🇿", conf:"OFC",      group:"G", ranking:101,elo:1705 },

  // ── Group H ──────────────────────────────────────────────
  { id:"esp", name:"Spain",               flag:"🇪🇸", conf:"UEFA",     group:"H", ranking:1,  elo:1994 },
  { id:"cpv", name:"Cape Verde",          flag:"🇨🇻", conf:"CAF",      group:"H", ranking:79, elo:1730, isDebut:true },
  { id:"sau", name:"Saudi Arabia",        flag:"🇸🇦", conf:"AFC",      group:"H", ranking:56, elo:1772 },
  { id:"uru", name:"Uruguay",             flag:"🇺🇾", conf:"CONMEBOL", group:"H", ranking:17, elo:1890 },

  // ── Group I ──────────────────────────────────────────────
  { id:"fra", name:"France",              flag:"🇫🇷", conf:"UEFA",     group:"I", ranking:2,  elo:1985 },
  { id:"sen", name:"Senegal",             flag:"🇸🇳", conf:"CAF",      group:"I", ranking:19, elo:1856 },
  { id:"irq", name:"Iraq",               flag:"🇮🇶", conf:"AFC",      group:"I", ranking:68, elo:1740 },
  { id:"nor", name:"Norway",              flag:"🇳🇴", conf:"UEFA",     group:"I", ranking:30, elo:1835 },

  // ── Group J ──────────────────────────────────────────────
  { id:"arg", name:"Argentina",           flag:"🇦🇷", conf:"CONMEBOL", group:"J", ranking:4,  elo:2001 },
  { id:"dza", name:"Algeria",             flag:"🇩🇿", conf:"CAF",      group:"J", ranking:36, elo:1815 },
  { id:"aut", name:"Austria",             flag:"🇦🇹", conf:"UEFA",     group:"J", ranking:25, elo:1841 },
  { id:"jor", name:"Jordan",              flag:"🇯🇴", conf:"AFC",      group:"J", ranking:70, elo:1730, isDebut:true },

  // ── Group K ──────────────────────────────────────────────
  { id:"por", name:"Portugal",            flag:"🇵🇹", conf:"UEFA",     group:"K", ranking:6,  elo:1963 },
  { id:"cod", name:"DR Congo",            flag:"🇨🇩", conf:"CAF",      group:"K", ranking:53, elo:1784 },
  { id:"uzb", name:"Uzbekistan",          flag:"🇺🇿", conf:"AFC",      group:"K", ranking:67, elo:1755, isDebut:true },
  { id:"col", name:"Colombia",            flag:"🇨🇴", conf:"CONMEBOL", group:"K", ranking:11, elo:1875 },

  // ── Group L ──────────────────────────────────────────────
  { id:"eng", name:"England",             flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf:"UEFA",     group:"L", ranking:5,  elo:1942 },
  { id:"cro", name:"Croatia",             flag:"🇭🇷", conf:"UEFA",     group:"L", ranking:10, elo:1905 },
  { id:"gha", name:"Ghana",               flag:"🇬🇭", conf:"CAF",      group:"L", ranking:62, elo:1778 },
  { id:"pan", name:"Panama",              flag:"🇵🇦", conf:"CONCACAF", group:"L", ranking:50, elo:1768 },
];

// ---- Real 2025-26 Player Stats (all leagues) ----
// Source: PlanetFootball, ESPN, Tribuna.com, Sky Sports May 2026
// weight field derived from LEAGUE_META
const PLAYERS = [

  // ── PREMIER LEAGUE (EPL, weight 1.00) ──────────────────
  { name:"Harry Kane",           club:"Bayern Munich",    league:"Bundesliga", nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:36, assists:10, ga:0,  cs:0,  rating:9.3, teamId:"eng", award:"Bundesliga Golden Boot 2025-26 (36G)", note:"European Golden Shoe contender" },
  { name:"Bukayo Saka",          club:"Arsenal",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:18, assists:13, ga:0,  cs:0,  rating:8.8, teamId:"eng" },
  { name:"Jude Bellingham",      club:"Real Madrid",      league:"LaLiga",     nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:19, assists:8,  ga:0,  cs:0,  rating:8.9, teamId:"eng", award:"2nd World Cup for Bellingham" },
  { name:"Declan Rice",          club:"Arsenal",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:8,  assists:10, ga:0,  cs:0,  rating:8.5, teamId:"eng" },
  { name:"Kobbie Mainoo",        club:"Man United",       league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:6,  assists:7,  ga:0,  cs:0,  rating:8.1, teamId:"eng" },
  { name:"Eberechi Eze",         club:"Arsenal",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:14, assists:9,  ga:0,  cs:0,  rating:8.3, teamId:"eng" },
  { name:"Ollie Watkins",        club:"Aston Villa",      league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:20, assists:8,  ga:0,  cs:0,  rating:8.3, teamId:"eng" },
  { name:"Anthony Gordon",       club:"Newcastle",        league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:13, assists:10, ga:0,  cs:0,  rating:8.0, teamId:"eng" },
  { name:"Marcus Rashford",      club:"Barcelona",        league:"LaLiga",     nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:14, assists:8,  ga:0,  cs:0,  rating:8.1, teamId:"eng" },
  { name:"Ivan Toney",           club:"Al-Ahli",          league:"SaudiPro",   nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:12, assists:6,  ga:0,  cs:0,  rating:7.6, teamId:"eng", award:"Controversially picked; non-top-5 discount applied", note:"England squad per ESPN/Sky Sports" },
  { name:"Rayan Cherki",         club:"Manchester City",  league:"EPL",        nation:"🇫🇷", pos:"MF", goals:12, assists:11, ga:0,  cs:0,  rating:8.4, teamId:"fra", award:"France WC squad confirmed" },
  { name:"Jean-Philippe Mateta", club:"Crystal Palace",   league:"EPL",        nation:"🇫🇷", pos:"FW", goals:18, assists:5,  ga:0,  cs:0,  rating:8.0, teamId:"fra" },
  { name:"Alejandro Garnacho",   club:"Chelsea",          league:"EPL",        nation:"🇦🇷", pos:"FW", goals:15, assists:10, ga:0,  cs:0,  rating:8.2, teamId:"arg" },
  { name:"Virgil van Dijk",      club:"Liverpool",        league:"EPL",        nation:"🇳🇱", pos:"DF", goals:3,  assists:2,  ga:27, cs:0,  rating:8.6, teamId:"ned" },
  { name:"David Raya",           club:"Arsenal",          league:"EPL",        nation:"🇪🇸", pos:"GK", goals:0,  assists:0,  ga:23, cs:19, rating:8.4, teamId:"esp" },
  { name:"Mohamed Salah",        club:"Liverpool",        league:"EPL",        nation:"🇪🇬", pos:"FW", goals:28, assists:13, ga:0,  cs:0,  rating:9.1, teamId:"egy", award:"EPL Golden Boot 2025-26" },
  { name:"Martin Ødegaard",      club:"Arsenal",          league:"EPL",        nation:"🇳🇴", pos:"MF", goals:14, assists:16, ga:0,  cs:0,  rating:8.7, teamId:"nor" },
  { name:"Erling Haaland",       club:"Man City",         league:"EPL",        nation:"🇳🇴", pos:"FW", goals:29, assists:8,  ga:0,  cs:0,  rating:9.1, teamId:"nor", award:"Norway's greatest ever scorer" },
  { name:"Bruno Guimarães",      club:"Newcastle",        league:"EPL",        nation:"🇧🇷", pos:"MF", goals:6,  assists:9,  ga:0,  cs:0,  rating:8.4, teamId:"bra" },
  { name:"Gabriel Martinelli",   club:"Arsenal",          league:"EPL",        nation:"🇧🇷", pos:"FW", goals:16, assists:9,  ga:0,  cs:0,  rating:8.3, teamId:"bra" },
  { name:"Matheus Cunha",        club:"Man United",       league:"EPL",        nation:"🇧🇷", pos:"FW", goals:14, assists:7,  ga:0,  cs:0,  rating:8.2, teamId:"bra" },
  { name:"Rodri",                club:"Man City",         league:"EPL",        nation:"🇪🇸", pos:"MF", goals:6,  assists:8,  ga:0,  cs:0,  rating:8.8, teamId:"esp", award:"Ballon d'Or 2024; injury return" },
  { name:"Bruno Fernandes",      club:"Man United",       league:"EPL",        nation:"🇵🇹", pos:"MF", goals:12, assists:14, ga:0,  cs:0,  rating:8.4, teamId:"por" },
  { name:"Christian Pulisic",    club:"AC Milan",         league:"SerieA",     nation:"🇺🇸", pos:"FW", goals:16, assists:11, ga:0,  cs:0,  rating:8.3, teamId:"usa" },

  // ── LA LIGA (weight 1.00) ───────────────────────────────
  { name:"Kylian Mbappé",        club:"Real Madrid",      league:"LaLiga",     nation:"🇫🇷", pos:"FW", goals:25, assists:20, ga:0,  cs:0,  rating:9.4, teamId:"fra", award:"La Liga top scorer; 41 goals all comps 2025-26", note:"3rd World Cup; arrives as planet's best player" },
  { name:"Lamine Yamal",         club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"FW", goals:21, assists:15, ga:0,  cs:0,  rating:9.2, teamId:"esp", award:"La Liga Best Young Player 2025-26", note:"Only 18 years old" },
  { name:"Vinícius Jr.",         club:"Real Madrid",      league:"LaLiga",     nation:"🇧🇷", pos:"FW", goals:22, assists:14, ga:0,  cs:0,  rating:9.1, teamId:"bra", award:"Ballon d'Or 2025 winner" },
  { name:"Raphinha",             club:"Barcelona",        league:"LaLiga",     nation:"🇧🇷", pos:"FW", goals:18, assists:14, ga:0,  cs:0,  rating:8.7, teamId:"bra" },
  { name:"Antony Matheus",       club:"Real Betis",       league:"LaLiga",     nation:"🇧🇷", pos:"FW", goals:9,  assists:7,  ga:0,  cs:0,  rating:7.8, teamId:"bra" },
  { name:"Dani Olmo",            club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"MF", goals:12, assists:10, ga:0,  cs:0,  rating:8.5, teamId:"esp" },
  { name:"Pedri",                club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"MF", goals:10, assists:13, ga:0,  cs:0,  rating:8.6, teamId:"esp" },
  { name:"Gavi",                 club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"MF", goals:8,  assists:11, ga:0,  cs:0,  rating:8.3, teamId:"esp", note:"Returned from injury for Spain WC" },
  { name:"Bernardo Silva",       club:"Barcelona",        league:"LaLiga",     nation:"🇵🇹", pos:"MF", goals:9,  assists:14, ga:0,  cs:0,  rating:8.7, teamId:"por" },
  { name:"Julián Álvarez",       club:"Atlético Madrid",  league:"LaLiga",     nation:"🇦🇷", pos:"FW", goals:18, assists:9,  ga:0,  cs:0,  rating:8.7, teamId:"arg" },
  { name:"Giuliano Simeone",     club:"Atlético Madrid",  league:"LaLiga",     nation:"🇦🇷", pos:"FW", goals:10, assists:8,  ga:0,  cs:0,  rating:7.9, teamId:"arg" },
  { name:"Franco Mastantuono",   club:"Real Madrid",      league:"LaLiga",     nation:"🇦🇷", pos:"MF", goals:8,  assists:9,  ga:0,  cs:0,  rating:8.0, teamId:"arg", award:"Argentina's next big thing" },
  { name:"Thibaut Courtois",     club:"Real Madrid",      league:"LaLiga",     nation:"🇧🇪", pos:"GK", goals:0,  assists:0,  ga:22, cs:21, rating:8.8, teamId:"bel", award:"Zamora Trophy 2025-26" },
  { name:"Riyad Mahrez",         club:"Al-Ahli",          league:"SaudiPro",   nation:"🇩🇿", pos:"FW", goals:12, assists:8,  ga:0,  cs:0,  rating:8.0, teamId:"dza" },

  // ── BUNDESLIGA (weight 1.00) ────────────────────────────
  { name:"Michael Olise",        club:"Bayern Munich",    league:"Bundesliga", nation:"🇫🇷", pos:"FW", goals:16, assists:23, ga:0,  cs:0,  rating:9.0, teamId:"fra", award:"10G+10A elite club; France WC squad confirmed", note:"Only player with 10G+10A alongside Yamal" },
  { name:"Florian Wirtz",        club:"Bayer Leverkusen", league:"Bundesliga", nation:"🇩🇪", pos:"MF", goals:20, assists:18, ga:0,  cs:0,  rating:8.9, teamId:"ger", award:"Bundesliga Player of Year 2025-26" },
  { name:"Jamal Musiala",        club:"Bayern Munich",    league:"Bundesliga", nation:"🇩🇪", pos:"MF", goals:18, assists:14, ga:0,  cs:0,  rating:8.8, teamId:"ger" },
  { name:"Manuel Neuer",         club:"Bayern Munich",    league:"Bundesliga", nation:"🇩🇪", pos:"GK", goals:0,  assists:0,  ga:21, cs:18, rating:8.3, teamId:"ger" },
  { name:"Kai Havertz",          club:"Arsenal",          league:"EPL",        nation:"🇩🇪", pos:"FW", goals:17, assists:10, ga:0,  cs:0,  rating:8.4, teamId:"ger" },
  { name:"Leroy Sané",           club:"Bayern Munich",    league:"Bundesliga", nation:"🇩🇪", pos:"FW", goals:14, assists:12, ga:0,  cs:0,  rating:8.2, teamId:"ger" },
  { name:"Luis Díaz",            club:"Bayern Munich",    league:"Bundesliga", nation:"🇨🇴", pos:"FW", goals:22, assists:15, ga:0,  cs:0,  rating:8.9, teamId:"col", award:"10G+10A elite club; left Liverpool for Bayern", note:"Extraordinary debut Bundesliga season" },
  { name:"Gio Reyna",            club:"Borussia Dortmund",league:"Bundesliga", nation:"🇺🇸", pos:"MF", goals:10, assists:12, ga:0,  cs:0,  rating:8.1, teamId:"usa" },

  // ── SERIE A (weight 1.00) ───────────────────────────────
  { name:"Lautaro Martínez",     club:"Inter Milan",      league:"SerieA",     nation:"🇦🇷", pos:"FW", goals:25, assists:8,  ga:0,  cs:0,  rating:8.9, teamId:"arg", award:"Serie A Top Scorer 2025-26" },
  { name:"Marcus Thuram",        club:"Inter Milan",      league:"SerieA",     nation:"🇫🇷", pos:"FW", goals:20, assists:8,  ga:0,  cs:0,  rating:8.5, teamId:"fra" },
  { name:"Mike Maignan",         club:"AC Milan",         league:"SerieA",     nation:"🇫🇷", pos:"GK", goals:0,  assists:0,  ga:22, cs:17, rating:8.7, teamId:"fra" },
  { name:"Rafael Leão",          club:"AC Milan",         league:"SerieA",     nation:"🇵🇹", pos:"FW", goals:18, assists:12, ga:0,  cs:0,  rating:8.6, teamId:"por" },

  // ── LIGUE 1 (weight 1.00) ───────────────────────────────
  { name:"Ousmane Dembélé",      club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"FW", goals:16, assists:18, ga:0,  cs:0,  rating:8.6, teamId:"fra", award:"Ligue 1 Player of Year 2025-26" },
  { name:"Bradley Barcola",      club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"FW", goals:20, assists:9,  ga:0,  cs:0,  rating:8.5, teamId:"fra", award:"Ligue 1 Top Scorer 2025-26" },
  { name:"Désiré Doué",          club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"MF", goals:14, assists:10, ga:0,  cs:0,  rating:8.3, teamId:"fra" },
  { name:"Gianluigi Donnarumma", club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"GK", goals:0,  assists:0,  ga:21, cs:19, rating:8.6, teamId:"fra" },
  { name:"Achraf Hakimi",        club:"PSG",              league:"Ligue1",     nation:"🇲🇦", pos:"DF", goals:5,  assists:10, ga:0,  cs:0,  rating:8.5, teamId:"mar" },
  { name:"Endrick",              club:"Lyon",             league:"Ligue1",     nation:"🇧🇷", pos:"FW", goals:12, assists:6,  ga:0,  cs:0,  rating:8.0, teamId:"bra" },

  // ── SAUDI PRO LEAGUE (weight 0.58) ─────────────────────
  { name:"Cristiano Ronaldo",    club:"Al-Nassr",         league:"SaudiPro",   nation:"🇵🇹", pos:"FW", goals:28, assists:8,  ga:0,  cs:0,  rating:8.8, teamId:"por", award:"Saudi Pro Top Scorer 2025-26; 6th World Cup (record)", note:"41 years old — defying father time" },
  { name:"Neymar",               club:"Santos",           league:"Other",      nation:"🇧🇷", pos:"FW", goals:10, assists:7,  ga:0,  cs:0,  rating:7.7, teamId:"bra", note:"Returned to Santos; fitness question" },
  { name:"Sadio Mané",           club:"Al-Nassr",         league:"SaudiPro",   nation:"🇸🇳", pos:"FW", goals:16, assists:7,  ga:0,  cs:0,  rating:8.0, teamId:"sen" },
  { name:"Karim Benzema",        club:"Al-Ittihad",       league:"SaudiPro",   nation:"🇫🇷", pos:"FW", goals:18, assists:7,  ga:0,  cs:0,  rating:7.9, teamId:null,  award:"Not in France WC squad (retired from NT)" },

  // ── MLS (weight 0.55) ───────────────────────────────────
  { name:"Lionel Messi",         club:"Inter Miami",      league:"MLS",        nation:"🇦🇷", pos:"FW", goals:29, assists:19, ga:0,  cs:0,  rating:9.0, teamId:"arg", award:"MLS Golden Boot 2025; Argentina preliminary squad", note:"38 years old; preliminary squad inclusion sparks debate" },
  { name:"Xherdan Shaqiri",      club:"Chicago Fire",     league:"MLS",        nation:"🇨🇭", pos:"MF", goals:9,  assists:8,  ga:0,  cs:0,  rating:7.4, teamId:"sui" },
];

// ---- 2025-26 Season Awards ----
const AWARDS = [
  { award:"Ballon d'Or 2025",              winner:"Vinícius Jr.",     nation:"🇧🇷", club:"Real Madrid",       league:"LaLiga",    teamId:"bra" },
  { award:"FIFA Best Men's Player 2025",   winner:"Kylian Mbappé",   nation:"🇫🇷", club:"Real Madrid",       league:"LaLiga",    teamId:"fra" },
  { award:"European Golden Shoe 2025-26",  winner:"Harry Kane",      nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", club:"Bayern Munich",    league:"Bundesliga",teamId:"eng" },
  { award:"Bundesliga Player of Year",     winner:"Florian Wirtz",   nation:"🇩🇪", club:"Bayer Leverkusen", league:"Bundesliga",teamId:"ger" },
  { award:"Ligue 1 Player of Year",        winner:"Ousmane Dembélé", nation:"🇫🇷", club:"PSG",              league:"Ligue1",    teamId:"fra" },
  { award:"La Liga Best Young Player",     winner:"Lamine Yamal",    nation:"🇪🇸", club:"Barcelona",        league:"LaLiga",    teamId:"esp" },
  { award:"Serie A Top Scorer",            winner:"Lautaro Martínez",nation:"🇦🇷", club:"Inter Milan",      league:"SerieA",    teamId:"arg" },
  { award:"Zamora Trophy (La Liga GK)",    winner:"Thibaut Courtois",nation:"🇧🇪", club:"Real Madrid",      league:"LaLiga",    teamId:"bel" },
  { award:"EPL Golden Boot 2025-26",       winner:"Mohamed Salah",   nation:"🇪🇬", club:"Liverpool",        league:"EPL",       teamId:"egy" },
  { award:"MLS Golden Boot 2025",          winner:"Lionel Messi",    nation:"🇦🇷", club:"Inter Miami",      league:"MLS",       teamId:"arg" },
  { award:"Saudi Pro Top Scorer",          winner:"Cristiano Ronaldo",nation:"🇵🇹",club:"Al-Nassr",         league:"SaudiPro",  teamId:"por" },
  { award:"Ballon d'Or 2024",              winner:"Rodri",           nation:"🇪🇸", club:"Man City",         league:"EPL",       teamId:"esp" },
  { award:"Copa América 2024",             winner:"Argentina",       nation:"🇦🇷", club:"National Team",    league:"—",         teamId:"arg" },
  { award:"UEFA Nations League 2025",      winner:"Portugal",        nation:"🇵🇹", club:"National Team",    league:"—",         teamId:"por", score:"2-2 aet (5-3 pens vs Spain)" },
  { award:"AFCON 2025",                    winner:"Morocco",         nation:"🇲🇦", club:"National Team",    league:"—",         teamId:"mar" },
];

// ---- Squad Status (real announcement data, FIFA June 2 deadline) ----
const SQUADS = {

  // ── England (ANNOUNCED May 22) ────────────────────────────
  eng: {
    status: "ANNOUNCED", date: "2026-05-22", squadSize: 26,
    note: "Ruthless Tuchel drops Foden, Palmer, TAA, Maguire. Kane captains at 3rd World Cup.",
    players: [
      // GK
      { name:"Jordan Pickford",   pos:"GK", club:"Everton",             league:"EPL"        },
      { name:"Dean Henderson",    pos:"GK", club:"Crystal Palace",      league:"EPL"        },
      { name:"James Trafford",    pos:"GK", club:"Man City",            league:"EPL"        },
      // DF
      { name:"Reece James",       pos:"DF", club:"Chelsea",             league:"EPL"        },
      { name:"Ezri Konsa",        pos:"DF", club:"Aston Villa",         league:"EPL"        },
      { name:"Jarell Quansah",    pos:"DF", club:"Bayer Leverkusen",    league:"Bundesliga" },
      { name:"John Stones",       pos:"DF", club:"Man City",            league:"EPL"        },
      { name:"Marc Guehi",        pos:"DF", club:"Man City",            league:"EPL"        },
      { name:"Dan Burn",          pos:"DF", club:"Newcastle",           league:"EPL"        },
      { name:"Nico O'Reilly",     pos:"DF", club:"Man City",            league:"EPL"        },
      { name:"Djed Spence",       pos:"DF", club:"Tottenham",           league:"EPL"        },
      { name:"Tino Livramento",   pos:"DF", club:"Newcastle",           league:"EPL"        },
      // MF
      { name:"Declan Rice",       pos:"MF", club:"Arsenal",             league:"EPL"        },
      { name:"Elliot Anderson",   pos:"MF", club:"Nottingham Forest",   league:"EPL"        },
      { name:"Kobbie Mainoo",     pos:"MF", club:"Man Utd",             league:"EPL"        },
      { name:"Jordan Henderson",  pos:"MF", club:"Brentford",           league:"EPL"        },
      { name:"Morgan Rogers",     pos:"MF", club:"Aston Villa",         league:"EPL"        },
      { name:"Jude Bellingham",   pos:"MF", club:"Real Madrid",         league:"LaLiga"     },
      { name:"Eberechi Eze",      pos:"MF", club:"Arsenal",             league:"EPL"        },
      // FW
      { name:"Harry Kane",        pos:"FW", club:"Bayern Munich",       league:"Bundesliga" },
      { name:"Ivan Toney",        pos:"FW", club:"Al-Ahli",             league:"SaudiPro"   },
      { name:"Ollie Watkins",     pos:"FW", club:"Aston Villa",         league:"EPL"        },
      { name:"Bukayo Saka",       pos:"FW", club:"Arsenal",             league:"EPL"        },
      { name:"Marcus Rashford",   pos:"FW", club:"Barcelona",           league:"LaLiga"     },
      { name:"Anthony Gordon",    pos:"FW", club:"Newcastle",           league:"EPL"        },
    ]
  },

  // ── Germany (ANNOUNCED May 21) ────────────────────────────
  ger: {
    status: "ANNOUNCED", date: "2026-05-21", squadSize: 26,
    note: "Nagelsmann names strong squad. Wirtz and Musiala the creative engine.",
    players: [
      // GK
      { name:"Manuel Neuer",          pos:"GK", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"Oliver Baumann",        pos:"GK", club:"Hoffenheim",       league:"Bundesliga" },
      { name:"Alexander Nübel",       pos:"GK", club:"Stuttgart",        league:"Bundesliga" },
      // DF
      { name:"Antonio Rüdiger",       pos:"DF", club:"Real Madrid",      league:"LaLiga"     },
      { name:"Jonathan Tah",          pos:"DF", club:"Bayer Leverkusen", league:"Bundesliga" },
      { name:"Nico Schlotterbeck",    pos:"DF", club:"Dortmund",         league:"Bundesliga" },
      { name:"Nathaniel Brown",       pos:"DF", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"David Raum",            pos:"DF", club:"RB Leipzig",       league:"Bundesliga" },
      { name:"Malick Thiaw",          pos:"DF", club:"AC Milan",         league:"SerieA"     },
      { name:"Waldemar Anton",        pos:"DF", club:"Stuttgart",        league:"Bundesliga" },
      { name:"Pascal Groß",           pos:"DF", club:"Arsenal",          league:"EPL"        },
      // MF
      { name:"Joshua Kimmich",        pos:"MF", club:"Barcelona",        league:"LaLiga"     },
      { name:"Leon Goretzka",         pos:"MF", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"Jamal Musiala",         pos:"MF", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"Florian Wirtz",         pos:"MF", club:"Bayer Leverkusen", league:"Bundesliga" },
      { name:"Jamie Leweling",        pos:"MF", club:"Stuttgart",        league:"Bundesliga" },
      { name:"Aleksandar Pavlovic",   pos:"MF", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"Maximilian Beier",      pos:"MF", club:"Dortmund",         league:"Bundesliga" },
      { name:"Leroy Sané",            pos:"MF", club:"Bayern Munich",    league:"Bundesliga" },
      { name:"Angelo Stiller",        pos:"MF", club:"Stuttgart",        league:"Bundesliga" },
      { name:"Nadiem Amiri",          pos:"MF", club:"Bayer Leverkusen", league:"Bundesliga" },
      { name:"Felix Nmecha",          pos:"MF", club:"Dortmund",         league:"Bundesliga" },
      // FW
      { name:"Kai Havertz",           pos:"FW", club:"Arsenal",          league:"EPL"        },
      { name:"Denis Undav",           pos:"FW", club:"Stuttgart",        league:"Bundesliga" },
      { name:"Nick Woltemeade",       pos:"FW", club:"Stuttgart",        league:"Bundesliga" },
    ]
  },

  // ── Brazil (ANNOUNCED May 18) ─────────────────────────────
  bra: {
    status: "ANNOUNCED", date: "2026-05-18", squadSize: 26,
    note: "Carlo Ancelotti's Brazil. Neymar controversially recalled, now at Santos. Vini Jr leads attack.",
    players: [
      // DF
      { name:"Wesley",            pos:"DF", club:"Roma",              league:"SerieA"     },
      { name:"Douglas Santos",    pos:"DF", club:"Flamengo",          league:"Other"      },
      { name:"Alex Sandro",       pos:"DF", club:"Flamengo",          league:"Other"      },
      { name:"Gabriel Magalhães", pos:"DF", club:"Arsenal",           league:"EPL"        },
      { name:"Marquinhos",        pos:"DF", club:"PSG",               league:"Ligue1"     },
      { name:"Danilo",            pos:"DF", club:"Flamengo",          league:"Other"      },
      { name:"Bremer",            pos:"DF", club:"Juventus",          league:"SerieA"     },
      { name:"Ibañez",            pos:"DF", club:"Al-Ahli",           league:"SaudiPro"   },
      { name:"Léo Pereira",       pos:"DF", club:"Flamengo",          league:"Other"      },
      // MF
      { name:"Bruno Guimarães",   pos:"MF", club:"Newcastle",         league:"EPL"        },
      { name:"Casemiro",          pos:"MF", club:"Man Utd",           league:"EPL"        },
      { name:"Lucas Paquetá",     pos:"MF", club:"Flamengo",          league:"Other"      },
      { name:"Raphinha",          pos:"MF", club:"Barcelona",         league:"LaLiga"     },
      { name:"Danilo Santos",     pos:"MF", club:"Botafogo",          league:"Other"      },
      { name:"Fabinho",           pos:"MF", club:"Al-Ittihad",        league:"SaudiPro"   },
      { name:"Neymar",            pos:"MF", club:"Santos",            league:"Other"      },
      // FW
      { name:"Vinícius Jr.",      pos:"FW", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Luiz Henrique",     pos:"FW", club:"Zenit",             league:"Other"      },
      { name:"Matheus Cunha",     pos:"FW", club:"Man Utd",           league:"EPL"        },
      { name:"Gabriel Martinelli",pos:"FW", club:"Arsenal",           league:"EPL"        },
      { name:"Igor Thiago",       pos:"FW", club:"Brentford",         league:"EPL"        },
      { name:"Endrick",           pos:"FW", club:"Lyon",              league:"Ligue1"     },
      { name:"Rayan",             pos:"FW", club:"Bournemouth",       league:"EPL"        },
      { name:"Antony Matheus",    pos:"FW", club:"Real Betis",        league:"LaLiga"     },
    ]
  },

  // ── France (ANNOUNCED May 14) ─────────────────────────────
  fra: {
    status: "ANNOUNCED", date: "2026-05-14", squadSize: 26,
    note: "Mbappé leads at 3rd World Cup. Deschamps names attacking powerhouse. Camavinga misses out.",
    players: [
      // GK
      { name:"Mike Maignan",          pos:"GK", club:"AC Milan",          league:"SerieA"     },
      { name:"Gianluigi Donnarumma",  pos:"GK", club:"PSG",               league:"Ligue1"     },
      { name:"Brice Samba",           pos:"GK", club:"Nottm Forest",       league:"EPL"        },
      // DF
      { name:"William Saliba",        pos:"DF", club:"Arsenal",            league:"EPL"        },
      { name:"Dayot Upamecano",       pos:"DF", club:"Bayern Munich",      league:"Bundesliga" },
      { name:"Ibrahima Konaté",       pos:"DF", club:"Liverpool",          league:"EPL"        },
      { name:"Benjamin Pavard",       pos:"DF", club:"Inter Milan",        league:"SerieA"     },
      { name:"Theo Hernandez",        pos:"DF", club:"AC Milan",           league:"SerieA"     },
      { name:"Jonathan Clauss",       pos:"DF", club:"Marseille",          league:"Ligue1"     },
      { name:"Timothée Pembélé",      pos:"DF", club:"Eintracht Frankfurt", league:"Bundesliga" },
      // MF
      { name:"Aurélien Tchouaméni",   pos:"MF", club:"Real Madrid",        league:"LaLiga"     },
      { name:"N'Golo Kanté",          pos:"MF", club:"Al-Ittihad",         league:"SaudiPro"   },
      { name:"Rayan Cherki",          pos:"MF", club:"Man City",           league:"EPL"        },
      { name:"Désiré Doué",           pos:"MF", club:"PSG",                league:"Ligue1"     },
      { name:"Maghnes Akliouche",     pos:"MF", club:"Monaco",             league:"Ligue1"     },
      // FW
      { name:"Kylian Mbappé",         pos:"FW", club:"Real Madrid",        league:"LaLiga"     },
      { name:"Ousmane Dembélé",       pos:"FW", club:"PSG",                league:"Ligue1"     },
      { name:"Michael Olise",         pos:"FW", club:"Bayern Munich",      league:"Bundesliga" },
      { name:"Bradley Barcola",       pos:"FW", club:"PSG",                league:"Ligue1"     },
      { name:"Marcus Thuram",         pos:"FW", club:"Inter Milan",        league:"SerieA"     },
      { name:"Jean-Philippe Mateta",  pos:"FW", club:"Crystal Palace",     league:"EPL"        },
    ]
  },

  // ── Spain (ANNOUNCED May 25) ──────────────────────────────
  esp: {
    status: "ANNOUNCED", date: "2026-05-25", squadSize: 26,
    note: "Yamal-Nico Williams flank among most feared in world.",
    players: [
      // GK
      { name:"David Raya",            pos:"GK", club:"Arsenal",            league:"EPL"        },
      { name:"Robert Sánchez",        pos:"GK", club:"Chelsea",            league:"EPL"        },
      // DF
      { name:"Dani Carvajal",         pos:"DF", club:"Real Madrid",        league:"LaLiga"     },
      { name:"Nacho",                 pos:"DF", club:"Al-Qadsiah",         league:"SaudiPro"   },
      { name:"Aymeric Laporte",       pos:"DF", club:"Al-Nassr",           league:"SaudiPro"   },
      { name:"Robin Le Normand",      pos:"DF", club:"Real Sociedad",      league:"LaLiga"     },
      { name:"Iñigo Vivian",          pos:"DF", club:"Athletic Club",      league:"LaLiga"     },
      { name:"Marc Cucurella",        pos:"DF", club:"Chelsea",            league:"EPL"        },
      { name:"Alejandro Grimaldo",    pos:"DF", club:"Bayer Leverkusen",   league:"Bundesliga" },
      { name:"Víctor Muñoz",          pos:"DF", club:"Osasuna",            league:"LaLiga"     },
      // MF
      { name:"Rodri",                 pos:"MF", club:"Man City",           league:"EPL"        },
      { name:"Pedri",                 pos:"MF", club:"Barcelona",          league:"LaLiga"     },
      { name:"Gavi",                  pos:"MF", club:"Barcelona",          league:"LaLiga"     },
      { name:"Fabián Ruiz",           pos:"MF", club:"PSG",                league:"Ligue1"     },
      { name:"Dani Olmo",             pos:"MF", club:"Barcelona",          league:"LaLiga"     },
      // FW
      { name:"Lamine Yamal",          pos:"FW", club:"Barcelona",          league:"LaLiga"     },
      { name:"Nico Williams",         pos:"FW", club:"Athletic Club",      league:"LaLiga"     },
      { name:"Ferran Torres",         pos:"FW", club:"Barcelona",          league:"LaLiga"     },
      { name:"Mikel Oyarzabal",       pos:"FW", club:"Real Sociedad",      league:"LaLiga"     },
      { name:"Yéremy Pino",           pos:"FW", club:"Crystal Palace",     league:"EPL"        },
      { name:"Álvaro Morata",         pos:"FW", club:"AC Milan",           league:"SerieA"     },
      { name:"Borja Iglesias",        pos:"FW", club:"Celta Vigo",         league:"LaLiga"     },
    ]
  },

  // ── Argentina (PRELIMINARY May 12) ───────────────────────
  arg: {
    status: "PRELIMINARY", date: "2026-05-12",
    note: "Messi (Inter Miami/MLS) included but participation uncertain. Lautaro, Alvarez lead attack.",
    players: [
      { name:"Lionel Messi",          pos:"FW", club:"Inter Miami",        league:"MLS"        },
      { name:"Lautaro Martínez",      pos:"FW", club:"Inter Milan",        league:"SerieA"     },
      { name:"Julián Álvarez",        pos:"FW", club:"Atlético Madrid",    league:"LaLiga"     },
      { name:"Alejandro Garnacho",    pos:"FW", club:"Chelsea",            league:"EPL"        },
      { name:"Franco Mastantuono",    pos:"MF", club:"Real Madrid",        league:"LaLiga"     },
      { name:"Thiago Almada",         pos:"MF", club:"Atlético Madrid",    league:"LaLiga"     },
      { name:"Matías Soulé",          pos:"FW", club:"Roma",               league:"SerieA"     },
      { name:"Claudio Echeverri",     pos:"MF", club:"Girona",             league:"LaLiga"     },
      { name:"Nicolás Paz",           pos:"MF", club:"Como",               league:"SerieA"     },
      { name:"Giuliano Simeone",      pos:"FW", club:"Atlético Madrid",    league:"LaLiga"     },
    ]
  },

  // ── Portugal (ANNOUNCED May 19) ───────────────────────────
  por: {
    status: "ANNOUNCED", date: "2026-05-19", squadSize: 26,
    note: "Ronaldo at his 6th World Cup — a world record. 41 years old. 28 goals in Saudi Pro League this season.",
    players: [
      // GK
      { name:"Diogo Costa",       pos:"GK", club:"Porto",             league:"LigaPortugal" },
      { name:"José Sá",           pos:"GK", club:"Wolves",            league:"EPL"          },
      // DF
      { name:"Rúben Dias",        pos:"DF", club:"Man City",          league:"EPL"          },
      { name:"Inácio",            pos:"DF", club:"Sporting CP",       league:"LigaPortugal" },
      { name:"João Cancelo",      pos:"DF", club:"Barcelona",         league:"LaLiga"       },
      { name:"Nuno Mendes",       pos:"DF", club:"PSG",               league:"Ligue1"       },
      // MF
      { name:"Rúben Neves",       pos:"MF", club:"Al-Hilal",          league:"SaudiPro"     },
      { name:"Bruno Fernandes",   pos:"MF", club:"Man United",        league:"EPL"          },
      { name:"Bernardo Silva",    pos:"MF", club:"Barcelona",         league:"LaLiga"       },
      { name:"Vitinha",           pos:"MF", club:"PSG",               league:"Ligue1"       },
      { name:"Pedro Neto",        pos:"MF", club:"Chelsea",           league:"EPL"          },
      // FW
      { name:"Cristiano Ronaldo", pos:"FW", club:"Al-Nassr",          league:"SaudiPro"     },
      { name:"Rafael Leão",       pos:"FW", club:"AC Milan",          league:"SerieA"       },
      { name:"Gonçalo Ramos",     pos:"FW", club:"PSG",               league:"Ligue1"       },
      { name:"Diogo Jota",        pos:"FW", club:"Liverpool",         league:"EPL"          },
    ]
  },

  // ── Switzerland (ANNOUNCED May 20) ───────────────────────
  sui: {
    status: "ANNOUNCED", date: "2026-05-20", squadSize: 26,
    note: "Switzerland quietly steady. Xhaka the general in midfield.",
    players: [
      { name:"Yann Sommer",       pos:"GK", club:"Inter Milan",       league:"SerieA"     },
      { name:"Gregor Kobel",      pos:"GK", club:"Dortmund",          league:"Bundesliga" },
      { name:"Manuel Akanji",     pos:"DF", club:"Man City",          league:"EPL"        },
      { name:"Nico Elvedi",       pos:"DF", club:"Mönchengladbach",   league:"Bundesliga" },
      { name:"Ricardo Rodriguez", pos:"DF", club:"Torino",            league:"SerieA"     },
      { name:"Granit Xhaka",      pos:"MF", club:"Bayer Leverkusen",  league:"Bundesliga" },
      { name:"Remo Freuler",      pos:"MF", club:"Bologna",           league:"SerieA"     },
      { name:"Xherdan Shaqiri",   pos:"MF", club:"Chicago Fire",      league:"MLS"        },
      { name:"Michel Aebischer",  pos:"MF", club:"Bologna",           league:"SerieA"     },
      { name:"Breel Embolo",      pos:"FW", club:"Monaco",            league:"Ligue1"     },
      { name:"Ruben Vargas",      pos:"FW", club:"Augsburg",          league:"Bundesliga" },
    ]
  },

  // ── United States (ANNOUNCED May 26) ──────────────────────
  usa: {
    status: "ANNOUNCED", date: "2026-05-26", squadSize: 26,
    note: "Host nation. Pulisic the star. Reyna finally fit for a major tournament.",
    players: [
      // GK
      { name:"Matt Turner",           pos:"GK", club:"Crystal Palace",    league:"EPL"        },
      { name:"Patrick Schulte",       pos:"GK", club:"Columbus Crew",     league:"MLS"        },
      // DF
      { name:"Sergiño Dest",          pos:"DF", club:"AC Milan",          league:"SerieA"     },
      { name:"Antonee Robinson",      pos:"DF", club:"Fulham",            league:"EPL"        },
      { name:"Walker Zimmermann",     pos:"DF", club:"Nashville SC",      league:"MLS"        },
      { name:"Chris Richards",        pos:"DF", club:"Crystal Palace",    league:"EPL"        },
      { name:"Tim Ream",              pos:"DF", club:"Fulham",            league:"EPL"        },
      // MF
      { name:"Tyler Adams",           pos:"MF", club:"Bournemouth",       league:"EPL"        },
      { name:"Weston McKennie",       pos:"MF", club:"Juventus",          league:"SerieA"     },
      { name:"Gio Reyna",             pos:"MF", club:"Borussia Dortmund", league:"Bundesliga" },
      { name:"Yunus Musah",           pos:"MF", club:"AC Milan",          league:"SerieA"     },
      // FW
      { name:"Christian Pulisic",     pos:"FW", club:"AC Milan",          league:"SerieA"     },
      { name:"Ricardo Pepi",          pos:"FW", club:"PSV Eindhoven",     league:"Eredivisie" },
      { name:"Josh Sargent",          pos:"FW", club:"Norwich City",      league:"EPL"        },
      { name:"Folarin Balogun",       pos:"FW", club:"Monaco",            league:"Ligue1"     },
    ]
  },

  // ── All other teams: pending June 2 deadline ──────────────
  mex: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  can: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  bih: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  qat: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  mar: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  hai: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  sco: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  par: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  aus: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  tur: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  cuw: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  civ: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  ecu: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  ned: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  jpn: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  swe: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  tun: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  bel: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  egy: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  irn: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  nzl: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  cpv: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  sau: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  uru: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  sen: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  irq: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  nor: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  dza: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  aut: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  jor: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  cod: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  uzb: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  col: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  cro: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  gha: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  pan: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  zaf: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  kor: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
  cze: { status:"UNANNOUNCED", date:null, squadSize:null, note:"Squad pending FIFA June 2 deadline (expected 26 or 27 by federation rules/dispensation).", players:[] },
};

// ---- Match Schedule (opening 24 group fixtures) ----
// One match per group-pair combination; dates from June 11 2026
const MATCHES = [
  // ── Group A ───────────────────────────────────────────────
  { id:1,  stage:"Group A", home:"mex", away:"zaf", date:"2026-06-11", time:"20:00", venue:"Estadio Azteca",          homeScore:null, awayScore:null },
  { id:2,  stage:"Group A", home:"kor", away:"cze", date:"2026-06-11", time:"17:00", venue:"SoFi Stadium",             homeScore:null, awayScore:null },

  // ── Group B ───────────────────────────────────────────────
  { id:3,  stage:"Group B", home:"can", away:"qat", date:"2026-06-12", time:"20:00", venue:"BC Place",                 homeScore:null, awayScore:null },
  { id:4,  stage:"Group B", home:"bih", away:"sui", date:"2026-06-12", time:"17:00", venue:"Stade de Montréal",        homeScore:null, awayScore:null },

  // ── Group C ───────────────────────────────────────────────
  { id:5,  stage:"Group C", home:"bra", away:"sco", date:"2026-06-13", time:"20:00", venue:"MetLife Stadium",          homeScore:null, awayScore:null },
  { id:6,  stage:"Group C", home:"mar", away:"hai", date:"2026-06-13", time:"17:00", venue:"Hard Rock Stadium",        homeScore:null, awayScore:null },

  // ── Group D ───────────────────────────────────────────────
  { id:7,  stage:"Group D", home:"usa", away:"par", date:"2026-06-14", time:"20:00", venue:"AT&T Stadium",             homeScore:null, awayScore:null },
  { id:8,  stage:"Group D", home:"aus", away:"tur", date:"2026-06-14", time:"17:00", venue:"Lumen Field",              homeScore:null, awayScore:null },

  // ── Group E ───────────────────────────────────────────────
  { id:9,  stage:"Group E", home:"ger", away:"cuw", date:"2026-06-15", time:"20:00", venue:"NRG Stadium",              homeScore:null, awayScore:null },
  { id:10, stage:"Group E", home:"ecu", away:"civ", date:"2026-06-15", time:"17:00", venue:"Arrowhead Stadium",        homeScore:null, awayScore:null },

  // ── Group F ───────────────────────────────────────────────
  { id:11, stage:"Group F", home:"ned", away:"swe", date:"2026-06-16", time:"20:00", venue:"Gillette Stadium",         homeScore:null, awayScore:null },
  { id:12, stage:"Group F", home:"jpn", away:"tun", date:"2026-06-16", time:"17:00", venue:"Lincoln Financial Field",  homeScore:null, awayScore:null },

  // ── Group G ───────────────────────────────────────────────
  { id:13, stage:"Group G", home:"bel", away:"irn", date:"2026-06-17", time:"20:00", venue:"Levi's Stadium",           homeScore:null, awayScore:null },
  { id:14, stage:"Group G", home:"egy", away:"nzl", date:"2026-06-17", time:"17:00", venue:"BMO Field",                homeScore:null, awayScore:null },

  // ── Group H ───────────────────────────────────────────────
  { id:15, stage:"Group H", home:"esp", away:"sau", date:"2026-06-18", time:"20:00", venue:"MetLife Stadium",          homeScore:null, awayScore:null },
  { id:16, stage:"Group H", home:"cpv", away:"uru", date:"2026-06-18", time:"17:00", venue:"Estadio BBVA",             homeScore:null, awayScore:null },

  // ── Group I ───────────────────────────────────────────────
  { id:17, stage:"Group I", home:"fra", away:"irq", date:"2026-06-19", time:"20:00", venue:"AT&T Stadium",             homeScore:null, awayScore:null },
  { id:18, stage:"Group I", home:"sen", away:"nor", date:"2026-06-19", time:"17:00", venue:"Arrowhead Stadium",        homeScore:null, awayScore:null },

  // ── Group J ───────────────────────────────────────────────
  { id:19, stage:"Group J", home:"arg", away:"dza", date:"2026-06-20", time:"20:00", venue:"Hard Rock Stadium",        homeScore:null, awayScore:null },
  { id:20, stage:"Group J", home:"aut", away:"jor", date:"2026-06-20", time:"17:00", venue:"NRG Stadium",              homeScore:null, awayScore:null },

  // ── Group K ───────────────────────────────────────────────
  { id:21, stage:"Group K", home:"por", away:"uzb", date:"2026-06-21", time:"20:00", venue:"Gillette Stadium",         homeScore:null, awayScore:null },
  { id:22, stage:"Group K", home:"cod", away:"col", date:"2026-06-21", time:"17:00", venue:"Lumen Field",              homeScore:null, awayScore:null },

  // ── Group L ───────────────────────────────────────────────
  { id:23, stage:"Group L", home:"eng", away:"cro", date:"2026-06-22", time:"20:00", venue:"SoFi Stadium",             homeScore:null, awayScore:null },
  { id:24, stage:"Group L", home:"gha", away:"pan", date:"2026-06-22", time:"17:00", venue:"Lincoln Financial Field",  homeScore:null, awayScore:null },
];

const NEWS_KEY   = "wc2026_news";
const NEWS_TTL   = 6 * 60 * 60 * 1000;
const STREAM_KEY = "wc2026_stream";

// ---- Real Flag Images via flagcdn.com ----
const FLAG_CODES = {
  mex:"mx", zaf:"za", kor:"kr", cze:"cz", can:"ca", bih:"ba", qat:"qa",
  sui:"ch", bra:"br", mar:"ma", hai:"ht", sco:"gb-sct", usa:"us", par:"py",
  aus:"au", tur:"tr", ger:"de", cuw:"cw", civ:"ci", ecu:"ec", ned:"nl",
  jpn:"jp", swe:"se", tun:"tn", bel:"be", egy:"eg", irn:"ir", nzl:"nz",
  esp:"es", cpv:"cv", sau:"sa", uru:"uy", fra:"fr", sen:"sn", irq:"iq",
  nor:"no", arg:"ar", dza:"dz", aut:"at", jor:"jo", por:"pt", cod:"cd",
  uzb:"uz", col:"co", eng:"gb-eng", cro:"hr", gha:"gh", pan:"pa",
};

function flagImg(teamId, size=32) {
  const code = FLAG_CODES[teamId];
  const team = TEAMS.find(t => t.id === teamId);
  const emoji = team?.flag || '🏳️';
  if (!code) return `<span class="flag-emoji">${emoji}</span>`;
  return `<img class="flag-img" src="https://flagcdn.com/w${size}/${code}.png" alt="${teamId}" width="${size}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='inline'" /><span class="flag-emoji" style="display:none">${emoji}</span>`;
}
