// ============================================================
// API & News Engine
// ============================================================

const API = (() => {
  // API keys removed — proxied through Supabase Edge Functions
  const FD_KEY    = "";
  const FD_BASE   = "https://api.football-data.org/v4";

  // Fallback news stories (shown when API key not set / quota hit)
  const FALLBACK_NEWS = [
    {
      title: "FIFA World Cup 2026 Draw Ceremony — Full Group Stage Revealed",
      description: "All 48 nations have been drawn into 12 groups ahead of the first 48-team World Cup, to be hosted across USA, Canada and Mexico.",
      source: { name: "FIFA Official" },
      publishedAt: new Date().toISOString(),
      url: "#",
      image: null,
      tag: "Draw"
    },
    {
      title: "Kylian Mbappé Leads France's 26-Man World Cup Squad",
      description: "Les Bleus name Mbappé as captain with a blend of experience and youth as France target a third World Cup title.",
      source: { name: "L'Équipe" },
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      url: "#",
      image: null,
      tag: "Squad News"
    },
    {
      title: "Vinicius Jr. Targets World Cup Glory After Ballon d'Or",
      description: "Brazil's star attacker says the World Cup would complete his journey to being the world's best player.",
      source: { name: "Marca" },
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      url: "#",
      image: null,
      tag: "Interview"
    },
    {
      title: "Lionel Messi Confirms World Cup Participation — Argentina's Bid for Back-to-Back",
      description: "The eight-time Ballon d'Or winner says he is ready and motivated to defend Argentina's 2022 title.",
      source: { name: "ESPN FC" },
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      url: "#",
      image: null,
      tag: "Squad News"
    },
    {
      title: "Harry Kane Eyes Golden Boot Record at USA 2026",
      description: "England's all-time top scorer arrives at the World Cup as one of the hottest favourites for the individual golden boot award.",
      source: { name: "BBC Sport" },
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      url: "#",
      image: null,
      tag: "Preview"
    },
    {
      title: "Morocco Eye Historic Title on Home Confederation's Turf",
      description: "After their 2022 semi-final breakthrough, the Atlas Lions believe 2026 is their best chance for a maiden World Cup crown.",
      source: { name: "Goal.com" },
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      url: "#",
      image: null,
      tag: "Preview"
    },
  ];

  async function fetchNews() {
    const cached = loadCache(NEWS_KEY);
    if (cached) return cached;
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const articles = (json.articles || []).map(a => ({ ...a, tag: "Live News" }));
      if (articles.length) {
        saveCache(NEWS_KEY, articles, NEWS_TTL);
        return articles;
      }
    } catch (e) {
      console.warn("News proxy unavailable, using fallback:", e.message);
    }
    return FALLBACK_NEWS;
  }

  // Auto-refresh hook — call once; re-fetches every 6 h
  function startNewsAutoRefresh(callback) {
    const doRefresh = async () => {
      const news = await fetchNews();
      callback(news);
    };
    doRefresh();
    setInterval(doRefresh, NEWS_TTL);
  }

  // Fetch live matches from Supabase Edge Function (which proxies football-data.org)
  async function fetchLiveMatches() {
    const cached = loadCache("LIVE_MATCHES_KEY");
    if (cached) return cached;
    
    try {
      const res = await fetch("/api/scores-proxy?endpoint=competitions/WC/matches");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (json.matches) {
        // Cache for 5 minutes
        saveCache("LIVE_MATCHES_KEY", json.matches, 5 * 60 * 1000);
        return json.matches;
      }
      return [];
    } catch (e) {
      console.warn("Live matches fetch failed:", e.message);
      return [];
    }
  }

  // Fetch standings/brackets from Supabase Edge Function
  async function fetchStandings() {
    const cached = loadCache("STANDINGS_KEY");
    if (cached) return cached;
    
    try {
      const res = await fetch("/api/scores-proxy?endpoint=competitions/WC/standings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (json.standings) {
        // Cache for 5 minutes
        saveCache("STANDINGS_KEY", json.standings, 5 * 60 * 1000);
        return json.standings;
      }
      return [];
    } catch (e) {
      console.warn("Standings fetch failed:", e.message);
      return [];
    }
  }

  // Auto-refresh live matches every 30 seconds during tournament
  function startLiveScoresAutoRefresh(callback) {
    const doRefresh = async () => {
      const matches = await fetchLiveMatches();
      callback(matches);
    };
    doRefresh();
    // Refresh every 30 seconds during tournament
    setInterval(doRefresh, 30 * 1000);
  }

  // ---- LocalStorage helpers ----
  function saveCache(key, data, ttl) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttl }));
    } catch (_) {}
  }

  function loadCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, expiry } = JSON.parse(raw);
      return Date.now() < expiry ? data : null;
    } catch (_) { return null; }
  }

  return { 
    fetchNews, 
    startNewsAutoRefresh, 
    fetchLiveMatches, 
    fetchStandings,
    startLiveScoresAutoRefresh
  };
})();
