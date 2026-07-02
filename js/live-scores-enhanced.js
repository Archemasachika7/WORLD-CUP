// ============================================================
// Enhanced Live Scores Module — Real-time score updates with UI
// ============================================================

const LiveScoresEnhanced = (() => {
  let liveMatches = {};  // Map of match ID to match data
  let updateInterval = null;
  let lastUpdateTime = null;

  // Initialize live scores display
  function init() {
    console.log("Initializing enhanced live scores module...");
    
    // Start auto-refresh on page load
    if (typeof API !== 'undefined' && API.startLiveScoresAutoRefresh) {
      API.startLiveScoresAutoRefresh(updateScoresDisplay);
    }
  }

  // Update scores display on page
  function updateScoresDisplay(matches) {
    if (!matches || !Array.isArray(matches)) {
      console.warn("Invalid matches data received");
      return;
    }
    
    console.log(`Live Scores: Received ${matches.length} matches`);
    lastUpdateTime = new Date();

    // Build map of matches by ID for quick lookup
    matches.forEach(match => {
      if (match.id) {
        liveMatches[match.id] = match;
      }
    });

    // Update match cards if they exist on the page
    updateMatchCards(matches);
  }

  // Update individual match cards with live scores
  function updateMatchCards(matches) {
    matches.forEach(match => {
      if (!match.id) return;

      // Find the match card element
      const card = document.querySelector(`[data-match="${match.id}"]`);
      if (!card) return;

      // Extract score information
      const hasScore = match.score && 
                      (match.score.fullTime?.home !== null || 
                       match.score.fullTime?.away !== null);

      if (hasScore) {
        const homeScore = match.score.fullTime.home ?? 0;
        const awayScore = match.score.fullTime.away ?? 0;

        // Update center score display
        const centerEl = card.querySelector(".mct-center");
        if (centerEl) {
          centerEl.innerHTML = `<span class="final-score" style="font-size:1.3rem;font-weight:900;">${homeScore}–${awayScore}</span>`;
        }

        // Add live indicator styling
        const status = match.status;
        if (status === "IN_PLAY" || status === "PAUSED") {
          card.classList.add("live-match");
          card.style.borderLeft = "4px solid #ff4444";
          card.style.backgroundColor = "rgba(255, 68, 68, 0.05)";
          
          // Add live badge
          const topEl = card.querySelector(".match-card-top");
          if (topEl && !topEl.querySelector(".live-badge")) {
            const badge = document.createElement("span");
            badge.className = "live-badge";
            badge.style.cssText = `
              display: inline-block;
              background: #ff4444;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 700;
              margin-left: 8px;
              animation: pulse 1s infinite;
            `;
            badge.textContent = "🔴 LIVE";
            topEl.appendChild(badge);
          }
        } else if (status === "FINISHED") {
          card.classList.remove("live-match");
          card.style.borderLeft = "";
          card.style.backgroundColor = "";
        }
      }
    });

    // Add CSS animation if not already present
    if (!document.getElementById("live-scores-styles")) {
      const style = document.createElement("style");
      style.id = "live-scores-styles";
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .live-match {
          transition: all 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Get current live matches
  function getLiveMatches() {
    return Object.values(liveMatches);
  }

  // Get match by ID
  function getMatch(matchId) {
    return liveMatches[matchId];
  }

  // Format score for display
  function formatScore(match) {
    if (!match || !match.score) return "–";
    const home = match.score.fullTime?.home;
    const away = match.score.fullTime?.away;
    if (home === null || away === null) return "–";
    return `${home}–${away}`;
  }

  // Get match status badge
  function getStatusBadge(match) {
    if (!match) return "–";
    const status = match.status;
    if (status === "IN_PLAY" || status === "PAUSED") return "🔴 LIVE";
    if (status === "FINISHED") return "✓ FT";
    if (status === "SCHEDULED") return "⏰ UPCOMING";
    return status;
  }

  // Get match status color
  function getStatusColor(match) {
    if (!match) return "var(--text-dim)";
    const status = match.status;
    if (status === "IN_PLAY" || status === "PAUSED") return "#ff4444";
    if (status === "FINISHED") return "#2ecc71";
    return "var(--text-dim)";
  }

  // Get last update time
  function getLastUpdateTime() {
    return lastUpdateTime;
  }

  // Manually refresh scores (useful for buttons)
  async function manualRefresh() {
    if (typeof API !== 'undefined' && API.fetchLiveMatches) {
      const matches = await API.fetchLiveMatches();
      updateScoresDisplay(matches);
      console.log("Manual refresh completed");
    }
  }

  return {
    init,
    updateScoresDisplay,
    getLiveMatches,
    getMatch,
    formatScore,
    getStatusBadge,
    getStatusColor,
    getLastUpdateTime,
    manualRefresh
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', LiveScoresEnhanced.init);
} else {
  LiveScoresEnhanced.init();
}
