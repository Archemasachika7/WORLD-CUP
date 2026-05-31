// Live match data — fetches /api/matches, merges into MATCHES, re-renders UI.
// Polls every 60 s during live windows; every 5 min otherwise.
// Falls back gracefully when the API key is not set or the request fails.

(function () {
  "use strict";

  const POLL_LIVE_MS    = 60_000;   // 1 min during active match windows
  const POLL_IDLE_MS    = 300_000;  // 5 min otherwise
  const CACHE_KEY       = "wc26_live_fixtures";
  const CACHE_TTL_MS    = 4 * 60_000; // 4 min local cache (just under s-maxage=300)

  let _pollTimer = null;
  let _lastFetch = 0;

  // ── Public bootstrap ──────────────────────────────────────────
  window.initLiveData = function () {
    // Try restoring from sessionStorage first so page loads feel instant
    const cached = _loadCache();
    if (cached) {
      _merge(cached);
      _refresh();        // fire in background; may be a no-op if cache is fresh
    } else {
      _refresh();
    }
  };

  // ── Fetch + merge ─────────────────────────────────────────────
  async function _refresh() {
    const now = Date.now();
    if (now - _lastFetch < CACHE_TTL_MS) return;   // still fresh enough
    _lastFetch = now;

    try {
      const r = await fetch("/api/matches");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      if (data.fallback) {
        // API key not set — silently skip, static data stays
        _schedule(false);
        return;
      }

      _saveCache(data.fixtures);
      _merge(data.fixtures);
    } catch (_) {
      // Network error — keep existing data, retry at idle cadence
    }

    _schedule(_hasLiveNow());
  }

  // ── Merge API fixtures into MATCHES array ─────────────────────
  function _merge(fixtures) {
    if (!Array.isArray(fixtures) || typeof MATCHES === "undefined") return;

    let changed = false;

    fixtures.forEach(fix => {
      if (fix.homeId === null || fix.awayId === null) return;

      const match = MATCHES.find(
        m => m.home === fix.homeId && m.away === fix.awayId
      );
      if (!match) return;

      const prevHome = match.homeScore;
      const prevAway = match.awayScore;

      // Always update scores (even null → null keeps idempotent)
      match.homeScore  = fix.homeScore;
      match.awayScore  = fix.awayScore;
      match.isLive     = fix.isLive;
      match.isFinished = fix.isFinished;
      match.elapsed    = fix.elapsed;
      match.status     = fix.status;

      // Extra sub-scores useful for live predictor
      match.htHome = fix.htHome;
      match.htAway = fix.htAway;
      match.penHome = fix.penHome;
      match.penAway = fix.penAway;

      if (prevHome !== fix.homeScore || prevAway !== fix.awayScore) {
        changed = true;
      }
    });

    if (changed || _firstRender) {
      _firstRender = false;
      _triggerRerender();
    }
  }

  let _firstRender = true;

  // ── Re-render whatever is on the page ────────────────────────
  function _triggerRerender() {
    // matches.html
    if (typeof renderMatches    === "function") renderMatches();
    if (typeof renderStandings  === "function") renderStandings();
    if (typeof renderLivePredictor === "function") renderLivePredictor();

    // index.html
    if (typeof initNextMatch    === "function") initNextMatch();

    // Emit a custom event so any page can listen
    document.dispatchEvent(new CustomEvent("wc26:liveupdate", { detail: { ts: Date.now() } }));
  }

  // ── Poll scheduling ───────────────────────────────────────────
  function _schedule(live) {
    clearTimeout(_pollTimer);
    _pollTimer = setTimeout(_refresh, live ? POLL_LIVE_MS : POLL_IDLE_MS);
  }

  function _hasLiveNow() {
    if (typeof MATCHES === "undefined") return false;
    return MATCHES.some(m => m.isLive);
  }

  // ── Session-level cache ───────────────────────────────────────
  function _saveCache(fixtures) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), fixtures }));
    } catch (_) {}
  }

  function _loadCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, fixtures } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return fixtures;
    } catch (_) {
      return null;
    }
  }
})();
