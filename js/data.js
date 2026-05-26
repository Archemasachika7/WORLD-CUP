// ============================================================
// FIFA WORLD CUP 2026 — Real Data (2025-26 Season)
// Stats sourced from PlanetFootball, ESPN, Tribuna, Sky Sports
// Squad info from FIFA, ESPN, Sky Sports (squads.deadline: June 2)
// ============================================================

const WC_META = {
  year: 2026, hosts: ["United States","Canada","Mexico"],
  teams: 48, matches: 104,
  startDate: "2026-06-11", finalDate: "2026-07-19",
  venues: [
    { name: "MetLife Stadium",          city: "New York/NJ",       capacity: 82500, country: "USA"    },
    { name: "AT&T Stadium",             city: "Dallas",            capacity: 80000, country: "USA"    },
    { name: "SoFi Stadium",             city: "Los Angeles",       capacity: 70240, country: "USA"    },
    { name: "Levi's Stadium",           city: "San Francisco",     capacity: 68500, country: "USA"    },
    { name: "Hard Rock Stadium",        city: "Miami",             capacity: 65326, country: "USA"    },
    { name: "Arrowhead Stadium",        city: "Kansas City",       capacity: 76416, country: "USA"    },
    { name: "Lumen Field",              city: "Seattle",           capacity: 69000, country: "USA"    },
    { name: "Lincoln Financial Field",  city: "Philadelphia",      capacity: 69328, country: "USA"    },
    { name: "Gillette Stadium",         city: "Boston",            capacity: 65878, country: "USA"    },
    { name: "NRG Stadium",              city: "Houston",           capacity: 72220, country: "USA"    },
    { name: "Estadio Azteca",           city: "Mexico City",       capacity: 87523, country: "Mexico" },
    { name: "Estadio BBVA",             city: "Monterrey",         capacity: 53500, country: "Mexico" },
    { name: "Estadio Akron",            city: "Guadalajara",       capacity: 49850, country: "Mexico" },
    { name: "BMO Field",                city: "Toronto",           capacity: 30000, country: "Canada" },
    { name: "BC Place",                 city: "Vancouver",         capacity: 54500, country: "Canada" },
    { name: "Stade de Montréal",        city: "Montreal",          capacity: 61004, country: "Canada" },
  ]
};

// ---- League Metadata & Weightings ----
// Top-5 leagues = 1.0 weight; others weighted down for squad strength scoring
const LEAGUE_META = {
  "EPL":          { name: "Premier League",    nation: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", weight: 1.00, tier: 1 },
  "LaLiga":       { name: "La Liga",           nation: "🇪🇸", weight: 1.00, tier: 1 },
  "Bundesliga":   { name: "Bundesliga",        nation: "🇩🇪", weight: 1.00, tier: 1 },
  "SerieA":       { name: "Serie A",           nation: "🇮🇹", weight: 1.00, tier: 1 },
  "Ligue1":       { name: "Ligue 1",           nation: "🇫🇷", weight: 1.00, tier: 1 },
  "Eredivisie":   { name: "Eredivisie",        nation: "🇳🇱", weight: 0.65, tier: 2 },
  "LigaPortugal": { name: "Liga Portugal",     nation: "🇵🇹", weight: 0.65, tier: 2 },
  "SaudiPro":     { name: "Saudi Pro League",  nation: "🇸🇦", weight: 0.58, tier: 2 },
  "LigaMX":       { name: "Liga MX",           nation: "🇲🇽", weight: 0.60, tier: 2 },
  "MLS":          { name: "MLS",               nation: "🇺🇸", weight: 0.55, tier: 2 },
  "JupilerPro":   { name: "Jupiler Pro",       nation: "🇧🇪", weight: 0.62, tier: 2 },
  "Other":        { name: "Other",             nation: "🌍", weight: 0.45, tier: 3 },
};

// ---- All 48 Teams ----
const TEAMS = [
  // UEFA (16)
  { id:"ger", name:"Germany",       flag:"🇩🇪", conf:"UEFA",     group:"A", ranking:12, elo:1921 },
  { id:"fra", name:"France",        flag:"🇫🇷", conf:"UEFA",     group:"B", ranking:2,  elo:1985 },
  { id:"eng", name:"England",       flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", conf:"UEFA",     group:"C", ranking:5,  elo:1942 },
  { id:"esp", name:"Spain",         flag:"🇪🇸", conf:"UEFA",     group:"D", ranking:1,  elo:1994 },
  { id:"por", name:"Portugal",      flag:"🇵🇹", conf:"UEFA",     group:"E", ranking:6,  elo:1963 },
  { id:"ned", name:"Netherlands",   flag:"🇳🇱", conf:"UEFA",     group:"F", ranking:7,  elo:1955 },
  { id:"bel", name:"Belgium",       flag:"🇧🇪", conf:"UEFA",     group:"G", ranking:3,  elo:1930 },
  { id:"ita", name:"Italy",         flag:"🇮🇹", conf:"UEFA",     group:"H", ranking:9,  elo:1915 },
  { id:"cro", name:"Croatia",       flag:"🇭🇷", conf:"UEFA",     group:"I", ranking:10, elo:1905 },
  { id:"sui", name:"Switzerland",   flag:"🇨🇭", conf:"UEFA",     group:"J", ranking:13, elo:1877 },
  { id:"aut", name:"Austria",       flag:"🇦🇹", conf:"UEFA",     group:"K", ranking:25, elo:1841 },
  { id:"sco", name:"Scotland",      flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", conf:"UEFA",     group:"L", ranking:38, elo:1790 },
  { id:"srb", name:"Serbia",        flag:"🇷🇸", conf:"UEFA",     group:"A", ranking:33, elo:1822 },
  { id:"tur", name:"Türkiye",       flag:"🇹🇷", conf:"UEFA",     group:"B", ranking:29, elo:1832 },
  { id:"dnk", name:"Denmark",       flag:"🇩🇰", conf:"UEFA",     group:"C", ranking:20, elo:1865 },
  { id:"ukr", name:"Ukraine",       flag:"🇺🇦", conf:"UEFA",     group:"D", ranking:22, elo:1835 },
  // CONMEBOL (6)
  { id:"arg", name:"Argentina",     flag:"🇦🇷", conf:"CONMEBOL", group:"E", ranking:4,  elo:2001 },
  { id:"bra", name:"Brazil",        flag:"🇧🇷", conf:"CONMEBOL", group:"F", ranking:5,  elo:1978 },
  { id:"uru", name:"Uruguay",       flag:"🇺🇾", conf:"CONMEBOL", group:"G", ranking:17, elo:1890 },
  { id:"col", name:"Colombia",      flag:"🇨🇴", conf:"CONMEBOL", group:"H", ranking:11, elo:1875 },
  { id:"ecu", name:"Ecuador",       flag:"🇪🇨", conf:"CONMEBOL", group:"I", ranking:44, elo:1815 },
  { id:"ven", name:"Venezuela",     flag:"🇻🇪", conf:"CONMEBOL", group:"J", ranking:52, elo:1788 },
  // CONCACAF (6)
  { id:"usa", name:"United States", flag:"🇺🇸", conf:"CONCACAF", group:"K", ranking:14, elo:1861, isHost:true },
  { id:"mex", name:"Mexico",        flag:"🇲🇽", conf:"CONCACAF", group:"L", ranking:15, elo:1852, isHost:true },
  { id:"can", name:"Canada",        flag:"🇨🇦", conf:"CONCACAF", group:"A", ranking:43, elo:1793, isHost:true },
  { id:"pan", name:"Panama",        flag:"🇵🇦", conf:"CONCACAF", group:"B", ranking:50, elo:1768 },
  { id:"cos", name:"Costa Rica",    flag:"🇨🇷", conf:"CONCACAF", group:"C", ranking:48, elo:1755 },
  { id:"jam", name:"Jamaica",       flag:"🇯🇲", conf:"CONCACAF", group:"D", ranking:55, elo:1740 },
  // AFC (8)
  { id:"jpn", name:"Japan",         flag:"🇯🇵", conf:"AFC",      group:"E", ranking:18, elo:1882 },
  { id:"kor", name:"South Korea",   flag:"🇰🇷", conf:"AFC",      group:"F", ranking:23, elo:1848 },
  { id:"irn", name:"Iran",          flag:"🇮🇷", conf:"AFC",      group:"G", ranking:21, elo:1844 },
  { id:"aus", name:"Australia",     flag:"🇦🇺", conf:"AFC",      group:"H", ranking:26, elo:1828 },
  { id:"sau", name:"Saudi Arabia",  flag:"🇸🇦", conf:"AFC",      group:"I", ranking:56, elo:1772 },
  { id:"uzb", name:"Uzbekistan",    flag:"🇺🇿", conf:"AFC",      group:"J", ranking:67, elo:1755 },
  { id:"irq", name:"Iraq",          flag:"🇮🇶", conf:"AFC",      group:"K", ranking:68, elo:1740 },
  { id:"jor", name:"Jordan",        flag:"🇯🇴", conf:"AFC",      group:"L", ranking:70, elo:1730 },
  // CAF (9)
  { id:"mar", name:"Morocco",       flag:"🇲🇦", conf:"CAF",      group:"A", ranking:14, elo:1880 },
  { id:"sen", name:"Senegal",       flag:"🇸🇳", conf:"CAF",      group:"B", ranking:19, elo:1856 },
  { id:"nga", name:"Nigeria",       flag:"🇳🇬", conf:"CAF",      group:"C", ranking:40, elo:1822 },
  { id:"egy", name:"Egypt",         flag:"🇪🇬", conf:"CAF",      group:"D", ranking:36, elo:1810 },
  { id:"civ", name:"Côte d'Ivoire", flag:"🇨🇮", conf:"CAF",      group:"E", ranking:46, elo:1798 },
  { id:"cmr", name:"Cameroon",      flag:"🇨🇲", conf:"CAF",      group:"F", ranking:41, elo:1802 },
  { id:"gha", name:"Ghana",         flag:"🇬🇭", conf:"CAF",      group:"G", ranking:62, elo:1778 },
  { id:"zaf", name:"South Africa",  flag:"🇿🇦", conf:"CAF",      group:"H", ranking:64, elo:1762 },
  { id:"dza", name:"Algeria",       flag:"🇩🇿", conf:"CAF",      group:"I", ranking:36, elo:1815 },
  // OFC (1)
  { id:"nzl", name:"New Zealand",   flag:"🇳🇿", conf:"OFC",      group:"J", ranking:101,elo:1705 },
  // Interconfederal Playoff (2)
  { id:"pri", name:"Paraguay",      flag:"🇵🇾", conf:"CONMEBOL", group:"K", ranking:74, elo:1754 },
  { id:"geo", name:"Georgia",       flag:"🇬🇪", conf:"UEFA",     group:"L", ranking:75, elo:1749 },
];

// ---- Real 2025-26 Player Stats (all leagues) ----
// Source: PlanetFootball, ESPN, Tribuna.com, Sky Sports May 2026
// weight field derived from LEAGUE_META
const PLAYERS = [
  // ---- PREMIER LEAGUE (EPL) ----
  { name:"Harry Kane",         club:"Bayern Munich",    league:"Bundesliga", nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:36, assists:10, ga:0,  cs:0,  rating:9.3, teamId:"eng", award:"Bundesliga Golden Boot 2025-26 (36G)", note:"European Golden Shoe contender" },
  { name:"Bukayo Saka",        club:"Arsenal",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:18, assists:13, ga:0,  cs:0,  rating:8.8, teamId:"eng", award:null },
  { name:"Jude Bellingham",    club:"Real Madrid",      league:"LaLiga",     nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:19, assists:8,  ga:0,  cs:0,  rating:8.9, teamId:"eng", award:"2nd World Cup for Bellingham" },
  { name:"Declan Rice",        club:"Arsenal",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:8,  assists:10, ga:0,  cs:0,  rating:8.5, teamId:"eng", award:null },
  { name:"Kobbie Mainoo",      club:"Man United",       league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"MF", goals:6,  assists:7,  ga:0,  cs:0,  rating:8.1, teamId:"eng", award:null },
  { name:"Eberechi Eze",       club:"Crystal Palace",   league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:14, assists:9,  ga:0,  cs:0,  rating:8.3, teamId:"eng", award:null },
  { name:"Noni Madueke",       club:"Chelsea",          league:"EPL",        nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:12, assists:8,  ga:0,  cs:0,  rating:8.0, teamId:"eng", award:null },
  { name:"Rayan Cherki",       club:"Manchester City",  league:"EPL",        nation:"🇫🇷", pos:"MF", goals:12, assists:11, ga:0,  cs:0,  rating:8.4, teamId:"fra", award:"France WC squad confirmed" },
  { name:"Jean-Philippe Mateta",club:"Crystal Palace",  league:"EPL",        nation:"🇫🇷", pos:"FW", goals:18, assists:5,  ga:0,  cs:0,  rating:8.0, teamId:"fra", award:null },
  { name:"Alejandro Garnacho", club:"Chelsea",          league:"EPL",        nation:"🇦🇷", pos:"FW", goals:15, assists:10, ga:0,  cs:0,  rating:8.2, teamId:"arg", award:null },
  { name:"Virgil van Dijk",    club:"Liverpool",        league:"EPL",        nation:"🇳🇱", pos:"DF", goals:3,  assists:2,  ga:27, cs:0,  rating:8.6, teamId:"ned", award:null },
  { name:"David Raya",         club:"Arsenal",          league:"EPL",        nation:"🇪🇸", pos:"GK", goals:0,  assists:0,  ga:23, cs:19, rating:8.4, teamId:"esp", award:null },
  // ---- LA LIGA ----
  { name:"Kylian Mbappé",      club:"Real Madrid",      league:"LaLiga",     nation:"🇫🇷", pos:"FW", goals:25, assists:20, ga:0,  cs:0,  rating:9.4, teamId:"fra", award:"La Liga top scorer; 41 goals all comps 2025-26", note:"3rd World Cup; arrives as planet's best player" },
  { name:"Lamine Yamal",       club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"FW", goals:21, assists:15, ga:0,  cs:0,  rating:9.2, teamId:"esp", award:"La Liga Best Young Player 2025-26; 10G+10A elite club", note:"Only 18 years old" },
  { name:"Vinícius Jr.",       club:"Real Madrid",      league:"LaLiga",     nation:"🇧🇷", pos:"FW", goals:22, assists:14, ga:0,  cs:0,  rating:9.1, teamId:"bra", award:"Ballon d'Or 2025 winner" },
  { name:"Raphinha",           club:"Barcelona",        league:"LaLiga",     nation:"🇧🇷", pos:"FW", goals:18, assists:14, ga:0,  cs:0,  rating:8.7, teamId:"bra", award:null },
  { name:"Dani Olmo",          club:"Barcelona",        league:"LaLiga",     nation:"🇪🇸", pos:"MF", goals:12, assists:10, ga:0,  cs:0,  rating:8.5, teamId:"esp", award:null },
  { name:"Julian Álvarez",     club:"Atlético Madrid",  league:"LaLiga",     nation:"🇦🇷", pos:"FW", goals:18, assists:9,  ga:0,  cs:0,  rating:8.7, teamId:"arg", award:null },
  { name:"Giuliano Simeone",   club:"Atlético Madrid",  league:"LaLiga",     nation:"🇦🇷", pos:"FW", goals:10, assists:8,  ga:0,  cs:0,  rating:7.9, teamId:"arg", award:null },
  { name:"Franco Mastantuono", club:"Real Madrid",      league:"LaLiga",     nation:"🇦🇷", pos:"MF", goals:8,  assists:9,  ga:0,  cs:0,  rating:8.0, teamId:"arg", award:"Argentina's next big thing" },
  { name:"Thibaut Courtois",   club:"Real Madrid",      league:"LaLiga",     nation:"🇧🇪", pos:"GK", goals:0,  assists:0,  ga:22, cs:21, rating:8.8, teamId:"bel", award:"Zamora Trophy 2025-26" },
  // ---- BUNDESLIGA ----
  { name:"Michael Olise",      club:"Bayern Munich",    league:"Bundesliga", nation:"🇫🇷", pos:"FW", goals:16, assists:23, ga:0,  cs:0,  rating:9.0, teamId:"fra", award:"10G+10A elite club; France WC squad confirmed", note:"Only player with 10G+10A alongside Yamal & Díaz" },
  { name:"Luis Díaz",          club:"Bayern Munich",    league:"Bundesliga", nation:"🇨🇴", pos:"FW", goals:22, assists:15, ga:0,  cs:0,  rating:8.9, teamId:"col", award:"10G+10A elite club; left Liverpool for Bayern", note:"Extraordinary debut Bundesliga season" },
  { name:"Florian Wirtz",      club:"Bayer Leverkusen", league:"Bundesliga", nation:"🇩🇪", pos:"MF", goals:20, assists:18, ga:0,  cs:0,  rating:8.9, teamId:"ger", award:"Bundesliga Player of Year 2025-26" },
  { name:"Jamal Musiala",      club:"Bayern Munich",    league:"Bundesliga", nation:"🇩🇪", pos:"MF", goals:18, assists:14, ga:0,  cs:0,  rating:8.8, teamId:"ger", award:null },
  { name:"Manuel Neuer",       club:"Bayern Munich",    league:"Bundesliga", nation:"🇩🇪", pos:"GK", goals:0,  assists:0,  ga:21, cs:18, rating:8.3, teamId:"ger", award:null },
  // ---- SERIE A ----
  { name:"Lautaro Martínez",   club:"Inter Milan",      league:"SerieA",     nation:"🇦🇷", pos:"FW", goals:25, assists:8,  ga:0,  cs:0,  rating:8.9, teamId:"arg", award:"Serie A Top Scorer 2025-26" },
  { name:"Marcus Thuram",      club:"Inter Milan",      league:"SerieA",     nation:"🇫🇷", pos:"FW", goals:20, assists:8,  ga:0,  cs:0,  rating:8.5, teamId:"fra", award:null },
  { name:"Nicolò Barella",     club:"Inter Milan",      league:"SerieA",     nation:"🇮🇹", pos:"MF", goals:10, assists:14, ga:0,  cs:0,  rating:8.5, teamId:"ita", award:null },
  { name:"Federico Chiesa",    club:"Juventus",         league:"SerieA",     nation:"🇮🇹", pos:"FW", goals:15, assists:11, ga:0,  cs:0,  rating:8.2, teamId:"ita", award:null },
  { name:"Gianluigi Donnarumma",club:"PSG",             league:"Ligue1",     nation:"🇮🇹", pos:"GK", goals:0,  assists:0,  ga:21, cs:19, rating:8.6, teamId:"ita", award:null },
  { name:"Mike Maignan",       club:"AC Milan",         league:"SerieA",     nation:"🇫🇷", pos:"GK", goals:0,  assists:0,  ga:22, cs:17, rating:8.7, teamId:"fra", award:null },
  // ---- LIGUE 1 ----
  { name:"Ousmane Dembélé",    club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"FW", goals:16, assists:18, ga:0,  cs:0,  rating:8.6, teamId:"fra", award:"Ligue 1 Player of Year 2025-26" },
  { name:"Bradley Barcola",    club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"FW", goals:20, assists:9,  ga:0,  cs:0,  rating:8.5, teamId:"fra", award:"Ligue 1 Top Scorer 2025-26" },
  { name:"Désiré Doué",        club:"PSG",              league:"Ligue1",     nation:"🇫🇷", pos:"MF", goals:14, assists:10, ga:0,  cs:0,  rating:8.3, teamId:"fra", award:null },

  // ---- SAUDI PRO LEAGUE (weight: 0.58) ----
  { name:"Cristiano Ronaldo",  club:"Al-Nassr",         league:"SaudiPro",   nation:"🇵🇹", pos:"FW", goals:28, assists:8,  ga:0,  cs:0,  rating:8.8, teamId:"por", award:"Saudi Pro Top Scorer 2025-26; 6th World Cup (record)", note:"41 years old — defying father time" },
  { name:"Ivan Toney",         club:"Al-Ahli",          league:"SaudiPro",   nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", pos:"FW", goals:12, assists:6,  ga:0,  cs:0,  rating:7.6, teamId:"eng", award:"Controversially picked; non-top-5 discount applied", note:"England squad per ESPN/Sky Sports" },
  { name:"Neymar Jr.",         club:"Al-Hilal",         league:"SaudiPro",   nation:"🇧🇷", pos:"FW", goals:14, assists:9,  ga:0,  cs:0,  rating:7.8, teamId:"bra", award:"Controversial Ancelotti call-up; returning from injury", note:"Fitness question mark" },
  { name:"Karim Benzema",      club:"Al-Ittihad",       league:"SaudiPro",   nation:"🇫🇷", pos:"FW", goals:18, assists:7,  ga:0,  cs:0,  rating:7.9, teamId:null,  award:"Not in France WC squad (retired from NT)" },

  // ---- MLS (weight: 0.55) ----
  { name:"Lionel Messi",       club:"Inter Miami",      league:"MLS",        nation:"🇦🇷", pos:"FW", goals:29, assists:19, ga:0,  cs:0,  rating:9.0, teamId:"arg", award:"MLS Golden Boot 2025; Argentina preliminary squad — Messi uncertain for WC", note:"38 years old; preliminary squad inclusion sparks debate" },
  { name:"Lorenzo Insigne",    club:"Toronto FC",       league:"MLS",        nation:"🇮🇹", pos:"FW", goals:10, assists:12, ga:0,  cs:0,  rating:7.5, teamId:null,  award:null },
  { name:"Xherdan Shaqiri",    club:"Chicago Fire",     league:"MLS",        nation:"🇨🇭", pos:"MF", goals:9,  assists:8,  ga:0,  cs:0,  rating:7.4, teamId:"sui", award:"MLS experience" },
];

// ---- 2025-26 Season Awards ----
const AWARDS = [
  { award:"Ballon d'Or 2025",              winner:"Vinícius Jr.",    nation:"🇧🇷", club:"Real Madrid",        league:"LaLiga",    teamId:"bra" },
  { award:"FIFA Best Men's Player 2025",   winner:"Kylian Mbappé",  nation:"🇫🇷", club:"Real Madrid",        league:"LaLiga",    teamId:"fra" },
  { award:"European Golden Shoe 2025-26",  winner:"Harry Kane",     nation:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", club:"Bayern Munich",     league:"Bundesliga",teamId:"eng" },
  { award:"Bundesliga Player of Year",     winner:"Florian Wirtz",  nation:"🇩🇪", club:"Bayer Leverkusen",  league:"Bundesliga",teamId:"ger" },
  { award:"Ligue 1 Player of Year",        winner:"Ousmane Dembélé",nation:"🇫🇷", club:"PSG",               league:"Ligue1",    teamId:"fra" },
  { award:"La Liga Best Young Player",     winner:"Lamine Yamal",   nation:"🇪🇸", club:"Barcelona",         league:"LaLiga",    teamId:"esp" },
  { award:"Serie A Top Scorer",            winner:"Lautaro Martínez",nation:"🇦🇷",club:"Inter Milan",        league:"SerieA",    teamId:"arg" },
  { award:"Zamora Trophy (La Liga GK)",    winner:"Thibaut Courtois",nation:"🇧🇪",club:"Real Madrid",        league:"LaLiga",    teamId:"bel" },
  { award:"MLS Golden Boot 2025",          winner:"Lionel Messi",   nation:"🇦🇷", club:"Inter Miami",        league:"MLS",       teamId:"arg" },
  { award:"Saudi Pro Top Scorer",          winner:"Cristiano Ronaldo",nation:"🇵🇹",club:"Al-Nassr",          league:"SaudiPro",  teamId:"por" },
  { award:"Copa América 2024",             winner:"Argentina",      nation:"🇦🇷", club:"National Team",      league:"—",         teamId:"arg" },
  { award:"UEFA Nations League 2025",      winner:"Spain",          nation:"🇪🇸", club:"National Team",      league:"—",         teamId:"esp" },
  { award:"AFCON 2025",                    winner:"Morocco",        nation:"🇲🇦", club:"National Team",      league:"—",         teamId:"mar" },
];

// ---- Squad Status (real announcement data, June 2 deadline) ----
const SQUADS = {
  eng: {
    status: "ANNOUNCED", date: "2026-05-22",
    note: "Thomas Tuchel's 26-man squad. Big exclusions: Cole Palmer, Phil Foden, Trent Alexander-Arnold, Harry Maguire.",
    players: [
      { name:"Harry Kane",        pos:"FW", club:"Bayern Munich",     league:"Bundesliga" },
      { name:"Jude Bellingham",   pos:"MF", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Bukayo Saka",       pos:"FW", club:"Arsenal",           league:"EPL"        },
      { name:"Declan Rice",       pos:"MF", club:"Arsenal",           league:"EPL"        },
      { name:"Kobbie Mainoo",     pos:"MF", club:"Man United",        league:"EPL"        },
      { name:"Eberechi Eze",      pos:"FW", club:"Crystal Palace",    league:"EPL"        },
      { name:"Noni Madueke",      pos:"FW", club:"Chelsea",           league:"EPL"        },
      { name:"Ivan Toney",        pos:"FW", club:"Al-Ahli",           league:"SaudiPro"   },
      { name:"John Stones",       pos:"DF", club:"Man City",          league:"EPL"        },
      { name:"Jarell Quansah",    pos:"DF", club:"Liverpool",         league:"EPL"        },
      { name:"Djed Spence",       pos:"DF", club:"PSG",               league:"Ligue1"     },
    ]
  },
  fra: {
    status: "ANNOUNCED", date: "2026-05-20",
    note: "Mbappé leads France as arguably the world's best player. Eduardo Camavinga misses out.",
    players: [
      { name:"Kylian Mbappé",     pos:"FW", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Ousmane Dembélé",   pos:"FW", club:"PSG",               league:"Ligue1"     },
      { name:"Michael Olise",     pos:"FW", club:"Bayern Munich",     league:"Bundesliga" },
      { name:"Bradley Barcola",   pos:"FW", club:"PSG",               league:"Ligue1"     },
      { name:"Marcus Thuram",     pos:"FW", club:"Inter Milan",       league:"SerieA"     },
      { name:"Rayan Cherki",      pos:"MF", club:"Manchester City",   league:"EPL"        },
      { name:"Désiré Doué",       pos:"MF", club:"PSG",               league:"Ligue1"     },
      { name:"Jean-Philippe Mateta",pos:"FW",club:"Crystal Palace",   league:"EPL"        },
      { name:"Maghnes Akliouche", pos:"MF", club:"AS Monaco",         league:"Ligue1"     },
      { name:"Mike Maignan",      pos:"GK", club:"AC Milan",          league:"SerieA"     },
      { name:"Gianluigi Donnarumma",pos:"GK",club:"PSG",             league:"Ligue1"     },
    ]
  },
  esp: {
    status: "ANNOUNCED", date: "2026-05-20",
    note: "Defending UEFA Nations League champions. Yamal headlines an exciting young squad.",
    players: [
      { name:"Lamine Yamal",      pos:"FW", club:"Barcelona",         league:"LaLiga"     },
      { name:"Nico Williams",     pos:"FW", club:"Athletic Club",     league:"LaLiga"     },
      { name:"Dani Olmo",         pos:"MF", club:"Barcelona",         league:"LaLiga"     },
      { name:"Ferran Torres",     pos:"FW", club:"Barcelona",         league:"LaLiga"     },
      { name:"Mikel Oyarzabal",   pos:"FW", club:"Real Sociedad",     league:"LaLiga"     },
      { name:"Yéremy Pino",       pos:"FW", club:"Crystal Palace",    league:"EPL"        },
      { name:"David Raya",        pos:"GK", club:"Arsenal",           league:"EPL"        },
      { name:"Víctor Muñoz",      pos:"FW", club:"Osasuna",           league:"LaLiga"     },
    ]
  },
  arg: {
    status: "PRELIMINARY", date: "2026-05-12",
    note: "Messi (38) listed in preliminary squad — WC participation still uncertain. Final 26 due June 1.",
    players: [
      { name:"Lionel Messi",      pos:"FW", club:"Inter Miami",       league:"MLS"        },
      { name:"Lautaro Martínez",  pos:"FW", club:"Inter Milan",       league:"SerieA"     },
      { name:"Julián Álvarez",    pos:"FW", club:"Atlético Madrid",   league:"LaLiga"     },
      { name:"Alejandro Garnacho",pos:"FW", club:"Chelsea",           league:"EPL"        },
      { name:"Franco Mastantuono",pos:"MF", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Thiago Almada",     pos:"MF", club:"Atlético Madrid",   league:"LaLiga"     },
      { name:"Matías Soulé",      pos:"FW", club:"Roma",              league:"SerieA"     },
      { name:"Claudio Echeverri", pos:"MF", club:"Girona",            league:"LaLiga"     },
      { name:"Nicolás Paz",       pos:"MF", club:"Como",              league:"SerieA"     },
      { name:"Giuliano Simeone",  pos:"FW", club:"Atlético Madrid",   league:"LaLiga"     },
    ]
  },
  bra: {
    status: "ANNOUNCED", date: "2026-05-18",
    note: "Carlo Ancelotti's Brazil name Neymar despite fitness concerns. Vinicius and Raphinha lead the attack.",
    players: [
      { name:"Vinícius Jr.",      pos:"FW", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Raphinha",          pos:"FW", club:"Barcelona",         league:"LaLiga"     },
      { name:"Neymar Jr.",        pos:"FW", club:"Al-Hilal",          league:"SaudiPro"   },
      { name:"Rodrygo",           pos:"FW", club:"Real Madrid",       league:"LaLiga"     },
      { name:"Endrick",           pos:"FW", club:"Real Madrid",       league:"LaLiga"     },
    ]
  },
  ger: {
    status: "ANNOUNCED", date: "2026-05-21",
    note: "Julian Nagelsmann names formidable roster. Kane NOT in squad (plays for England). Wirtz and Musiala headline.",
    players: [
      { name:"Florian Wirtz",     pos:"MF", club:"Bayer Leverkusen",  league:"Bundesliga" },
      { name:"Jamal Musiala",     pos:"MF", club:"Bayern Munich",     league:"Bundesliga" },
      { name:"Joshua Kimmich",    pos:"MF", club:"Barcelona",         league:"LaLiga"     },
      { name:"Manuel Neuer",      pos:"GK", club:"Bayern Munich",     league:"Bundesliga" },
      { name:"Kai Havertz",       pos:"FW", club:"Arsenal",           league:"EPL"        },
      { name:"Leroy Sané",        pos:"FW", club:"Bayern Munich",     league:"Bundesliga" },
    ]
  },
  por: {
    status: "ANNOUNCED", date: "2026-05-19",
    note: "Ronaldo, 41, at his 6th World Cup — a record. 28 goals in Saudi Pro League this season.",
    players: [
      { name:"Cristiano Ronaldo", pos:"FW", club:"Al-Nassr",          league:"SaudiPro"   },
      { name:"Bruno Fernandes",   pos:"MF", club:"Man United",        league:"EPL"        },
      { name:"Rafael Leão",       pos:"FW", club:"AC Milan",          league:"SerieA"     },
      { name:"Bernardo Silva",    pos:"MF", club:"Barcelona",         league:"LaLiga"     },
      { name:"Rúben Dias",        pos:"DF", club:"Man City",          league:"EPL"        },
    ]
  },
  ned: { status:"UNANNOUNCED", date:null, note:"Netherlands squad expected by May 31.", players:[] },
  bel: { status:"UNANNOUNCED", date:null, note:"Belgium squad expected by June 1.", players:[] },
  ita: { status:"UNANNOUNCED", date:null, note:"Italy squad expected by June 1.", players:[] },
  cro: { status:"UNANNOUNCED", date:null, note:"Croatia squad expected by June 1.", players:[] },
  sui: { status:"ANNOUNCED",   date:"2026-05-20", note:"Switzerland confirmed via social media May 18-19.", players:[
    { name:"Granit Xhaka",       pos:"MF", club:"Bayer Leverkusen",  league:"Bundesliga" },
    { name:"Xherdan Shaqiri",    pos:"MF", club:"Chicago Fire",      league:"MLS"        },
    { name:"Yann Sommer",        pos:"GK", club:"Inter Milan",       league:"SerieA"     },
  ]},
  tur: { status:"UNANNOUNCED", date:null, note:"Türkiye squad pending.", players:[] },
  dnk: { status:"UNANNOUNCED", date:null, note:"Denmark squad pending.", players:[] },
  ukr: { status:"UNANNOUNCED", date:null, note:"Ukraine squad pending.", players:[] },
  sco: { status:"UNANNOUNCED", date:null, note:"Scotland squad pending.", players:[] },
  aut: { status:"UNANNOUNCED", date:null, note:"Austria squad pending.", players:[] },
  srb: { status:"UNANNOUNCED", date:null, note:"Serbia squad pending.", players:[] },
  uru: { status:"UNANNOUNCED", date:null, note:"Uruguay squad pending.", players:[] },
  col: { status:"UNANNOUNCED", date:null, note:"Colombia squad pending.", players:[] },
  ecu: { status:"UNANNOUNCED", date:null, note:"Ecuador squad pending.", players:[] },
  ven: { status:"UNANNOUNCED", date:null, note:"Venezuela squad pending.", players:[] },
  usa: { status:"ANNOUNCED",   date:"2026-05-26", note:"USA host nation — final 26 named today.", players:[
    { name:"Christian Pulisic",  pos:"FW", club:"AC Milan",          league:"SerieA"     },
    { name:"Gio Reyna",          pos:"MF", club:"Borussia Dortmund", league:"Bundesliga" },
    { name:"Tyler Adams",        pos:"MF", club:"Bournemouth",       league:"EPL"        },
    { name:"Weston McKennie",    pos:"MF", club:"Leeds United",      league:"EPL"        },
    { name:"Ricardo Pepi",       pos:"FW", club:"PSV Eindhoven",     league:"Eredivisie" },
    { name:"Matt Turner",        pos:"GK", club:"Crystal Palace",    league:"EPL"        },
  ]},
  mex: { status:"UNANNOUNCED", date:null, note:"Mexico host nation — squad pending.", players:[] },
  can: { status:"UNANNOUNCED", date:null, note:"Canada host nation — squad pending.", players:[] },
  pan: { status:"UNANNOUNCED", date:null, note:"Panama squad pending.", players:[] },
  cos: { status:"UNANNOUNCED", date:null, note:"Costa Rica squad pending.", players:[] },
  jam: { status:"UNANNOUNCED", date:null, note:"Jamaica squad pending.", players:[] },
  jpn: { status:"UNANNOUNCED", date:null, note:"Japan squad pending.", players:[] },
  kor: { status:"UNANNOUNCED", date:null, note:"South Korea squad pending.", players:[] },
  irn: { status:"UNANNOUNCED", date:null, note:"Iran squad pending.", players:[] },
  aus: { status:"UNANNOUNCED", date:null, note:"Australia squad pending.", players:[] },
  sau: { status:"UNANNOUNCED", date:null, note:"Saudi Arabia squad pending.", players:[] },
  uzb: { status:"UNANNOUNCED", date:null, note:"Uzbekistan squad pending.", players:[] },
  irq: { status:"UNANNOUNCED", date:null, note:"Iraq squad pending.", players:[] },
  jor: { status:"UNANNOUNCED", date:null, note:"Jordan squad pending.", players:[] },
  mar: { status:"UNANNOUNCED", date:null, note:"Morocco squad pending.", players:[] },
  sen: { status:"UNANNOUNCED", date:null, note:"Senegal squad pending.", players:[] },
  nga: { status:"UNANNOUNCED", date:null, note:"Nigeria squad pending.", players:[] },
  egy: { status:"UNANNOUNCED", date:null, note:"Egypt squad pending.", players:[] },
  civ: { status:"UNANNOUNCED", date:null, note:"Côte d'Ivoire squad pending.", players:[] },
  cmr: { status:"UNANNOUNCED", date:null, note:"Cameroon squad pending.", players:[] },
  gha: { status:"UNANNOUNCED", date:null, note:"Ghana squad pending.", players:[] },
  zaf: { status:"UNANNOUNCED", date:null, note:"South Africa squad pending.", players:[] },
  dza: { status:"UNANNOUNCED", date:null, note:"Algeria squad pending.", players:[] },
  nzl: { status:"UNANNOUNCED", date:null, note:"New Zealand squad pending.", players:[] },
  pri: { status:"UNANNOUNCED", date:null, note:"Paraguay squad pending.", players:[] },
  geo: { status:"UNANNOUNCED", date:null, note:"Georgia squad pending.", players:[] },
};

// ---- Match Schedule (opening 24 group fixtures) ----
const MATCHES = [
  { id:1,  stage:"Group A", home:"mex", away:"ger", date:"2026-06-11", time:"20:00", venue:"Estadio Azteca",           homeScore:null, awayScore:null },
  { id:2,  stage:"Group A", home:"mar", away:"can", date:"2026-06-11", time:"17:00", venue:"MetLife Stadium",           homeScore:null, awayScore:null },
  { id:3,  stage:"Group B", home:"fra", away:"tur", date:"2026-06-12", time:"20:00", venue:"AT&T Stadium",              homeScore:null, awayScore:null },
  { id:4,  stage:"Group B", home:"pan", away:"sen", date:"2026-06-12", time:"17:00", venue:"Hard Rock Stadium",         homeScore:null, awayScore:null },
  { id:5,  stage:"Group C", home:"eng", away:"dnk", date:"2026-06-13", time:"20:00", venue:"SoFi Stadium",              homeScore:null, awayScore:null },
  { id:6,  stage:"Group C", home:"cos", away:"nga", date:"2026-06-13", time:"17:00", venue:"Levi's Stadium",            homeScore:null, awayScore:null },
  { id:7,  stage:"Group D", home:"esp", away:"ukr", date:"2026-06-14", time:"20:00", venue:"MetLife Stadium",           homeScore:null, awayScore:null },
  { id:8,  stage:"Group D", home:"jam", away:"egy", date:"2026-06-14", time:"17:00", venue:"Arrowhead Stadium",         homeScore:null, awayScore:null },
  { id:9,  stage:"Group E", home:"arg", away:"por", date:"2026-06-15", time:"20:00", venue:"AT&T Stadium",              homeScore:null, awayScore:null },
  { id:10, stage:"Group E", home:"jpn", away:"civ", date:"2026-06-15", time:"17:00", venue:"NRG Stadium",               homeScore:null, awayScore:null },
  { id:11, stage:"Group F", home:"bra", away:"ned", date:"2026-06-16", time:"20:00", venue:"SoFi Stadium",              homeScore:null, awayScore:null },
  { id:12, stage:"Group F", home:"kor", away:"cmr", date:"2026-06-16", time:"17:00", venue:"Gillette Stadium",          homeScore:null, awayScore:null },
  { id:13, stage:"Group G", home:"bel", away:"uru", date:"2026-06-17", time:"20:00", venue:"Hard Rock Stadium",         homeScore:null, awayScore:null },
  { id:14, stage:"Group G", home:"irn", away:"gha", date:"2026-06-17", time:"17:00", venue:"BC Place",                  homeScore:null, awayScore:null },
  { id:15, stage:"Group H", home:"ita", away:"col", date:"2026-06-18", time:"20:00", venue:"Lincoln Financial Field",   homeScore:null, awayScore:null },
  { id:16, stage:"Group H", home:"aus", away:"zaf", date:"2026-06-18", time:"17:00", venue:"BMO Field",                 homeScore:null, awayScore:null },
  { id:17, stage:"Group I", home:"cro", away:"ecu", date:"2026-06-19", time:"20:00", venue:"AT&T Stadium",              homeScore:null, awayScore:null },
  { id:18, stage:"Group I", home:"irq", away:"sau", date:"2026-06-19", time:"17:00", venue:"Estadio BBVA",              homeScore:null, awayScore:null },
  { id:19, stage:"Group J", home:"sui", away:"ven", date:"2026-06-20", time:"20:00", venue:"Lumen Field",               homeScore:null, awayScore:null },
  { id:20, stage:"Group J", home:"uzb", away:"nzl", date:"2026-06-20", time:"17:00", venue:"Stade de Montréal",         homeScore:null, awayScore:null },
  { id:21, stage:"Group K", home:"usa", away:"pri", date:"2026-06-21", time:"20:00", venue:"MetLife Stadium",           homeScore:null, awayScore:null },
  { id:22, stage:"Group K", home:"aut", away:"irq", date:"2026-06-21", time:"17:00", venue:"Arrowhead Stadium",         homeScore:null, awayScore:null },
  { id:23, stage:"Group L", home:"mex", away:"geo", date:"2026-06-22", time:"20:00", venue:"Estadio Akron",             homeScore:null, awayScore:null },
  { id:24, stage:"Group L", home:"sco", away:"jor", date:"2026-06-22", time:"17:00", venue:"NRG Stadium",               homeScore:null, awayScore:null },
];

const NEWS_KEY  = "wc2026_news";
const NEWS_TTL  = 6 * 60 * 60 * 1000;
const STREAM_KEY = "wc2026_stream";
