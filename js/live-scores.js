// ============================================================
// Live Scores Module — Real-time score updates
// ============================================================

const LiveScores = (() => {
  let liveMatches = [];
  let updateInterval = null;

  // Initialize live scores display
  function init() {
    console.log("Initializing live scores module...");
    // Start auto-refresh on page load
    if (typeof API !== 'undefined' && API.startLiveScoresAutoRefresh) {
      API.startLiveScoresAutoRefresh(updateScoresDisplay);
    }
  }

  // Update scores display on page
  function updateScoresDisplay(matches) {
    if (!matches || !Array.isArray(matches)) return;
    
    liveMatches = matches;
    console.log(`Received ${matches.length} live matches`);

    // Update match cards if they exist on the page
    updateMatchCards(matches);
    
    // Update standings if they exist
    updateStandings(matches);
  }

  // Update individual match cards with live scores
  function updateMatchCards(matches) {
    matches.forEach(match => {
      if (!match.id) return;
      
      const card = document.querySelector(`[data-match="${match.id}"]`);
      if (!card) return;

      // Only update if match has scores
      if (match.score && (match.score.fullTime.home !== null || match.score.fullTime.away !== null)) {
        const centerEl = card.querySelector(".mct-center");
        if (centerEl) {
          const homeScore = match.score.fullTime.home ?? 0;
          const awayScore = match.score.fullTime.away ?? 0;
          centerEl.innerHTML = `<span class="final-score" style="font-size:1.3rem;font-weight:900;">${homeScore}–${awayScore}</span>`;
          
          // Add live indicator if match is in progress
          if (match.status === "IN_PLAY" || match.status === "PAUSED") {
            card.classList.add("live-match");
            card.style.borderLeft = "4px solid #ff4444";
          }
        }
      }
    });
  }

  // Update group standings
  function updateStandings(matches) {
    // This would update standings table if present
    // Implementation depends on standings page structure
  }

  // Get current live matches
  function getLiveMatches() {
    return liveMatches;
  }

  // Get match by ID
  function getMatch(matchId) {
    return liveMatches.find(m => m.id === matchId);
  }

  // Format score for display
  function formatScore(match) {
    if (!match.score) return "–";
    const home = match.score.fullTime.home;
    const away = match.score.fullTime.away;
    if (home === null || away === null) return "–";
    return `${home}–${away}`;
  }

  // Get match status badge
  function getStatusBadge(match) {
    const status = match.status;
    if (status === "IN_PLAY" || status === "PAUSED") return "🔴 LIVE";
    if (status === "FINISHED") return "✓ FT";
    if (status === "SCHEDULED") return "⏰ UPCOMING";
    return status;
  }

  return {
    init,
    updateScoresDisplay,
    getLiveMatches,
    getMatch,
    formatScore,
    getStatusBadge
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', LiveScores.init);
} else {
  LiveScores.init();
}
