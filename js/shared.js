// ============================================================
// Shared Navigation & Utilities — World Cup 2026
// ============================================================

const NAV_PAGES = [
  { id: "home",        href: "index.html",       icon: "🏆", label: "Home"        },
  { id: "teams",       href: "teams.html",        icon: "👥", label: "Teams"       },
  { id: "matches",     href: "matches.html",      icon: "⚽", label: "Matches"     },
  { id: "stats",       href: "stats.html",        icon: "📊", label: "Stats"       },
  { id: "predictions", href: "predictions.html",  icon: "🔮", label: "Predictions" },
  { id: "meet",        href: "meet.html",         icon: "🏟️", label: "Meet"        },
  { id: "games",       href: "games.html",        icon: "🎮", label: "Games"       },
];

function buildNav(activePage) {
  const container = document.getElementById("main-nav");
  if (!container) return;

  container.innerHTML = `
    <div class="nav-logo">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/2026_FIFA_World_Cup_logo.svg/120px-2026_FIFA_World_Cup_logo.svg.png" alt="FIFA World Cup 2026 logo" style="height:44px;width:auto" loading="lazy" onerror="this.style.display='none'" />
      <span>World Cup <span class="logo-wc">2026</span></span>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">☰</button>
    <ul class="nav-links" id="nav-links-list">
      ${NAV_PAGES.map(p => `
        <li>
          <a class="nav-link${p.id === activePage ? ' nav-active' : ''}" href="${p.href}">
            <span class="nav-icon">${p.icon}</span>
            <span>${p.label}</span>
          </a>
        </li>
      `).join("")}
    </ul>
    <a class="nav-cta" href="meet.html">🏟️ Meet Rooms</a>
  `;

  // Scroll effect
  window.addEventListener("scroll", () => {
    container.classList.toggle("scrolled", window.scrollY > 60);
  });

  // Mobile hamburger
  const hamburger = document.getElementById("nav-hamburger");
  const linksList = document.getElementById("nav-links-list");
  if (hamburger && linksList) {
    hamburger.addEventListener("click", () => {
      linksList.classList.toggle("nav-open");
      hamburger.textContent = linksList.classList.contains("nav-open") ? "✕" : "☰";
    });
    // Close on link click
    linksList.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        linksList.classList.remove("nav-open");
        hamburger.textContent = "☰";
      });
    });
  }
}

// Shared footer builder
function buildFooter(containerId) {
  const el = document.getElementById(containerId || "footer");
  if (!el) return;
  el.innerHTML = `
    <div class="footer-links">
      ${NAV_PAGES.map(p => `<a href="${p.href}">${p.icon} ${p.label}</a>`).join("")}
      <a href="https://www.fifa.com" target="_blank" rel="noopener">FIFA Official</a>
    </div>
    <p>⚽ <strong>World Cup 2026 Live Hub</strong> — USA · Canada · Mexico</p>
    <p class="footer-disclaimer">
      Fan-built. Stats: PlanetFootball, ESPN, Tribuna.com, Sky Sports (May 2026).
      Squads: FIFA.com, ESPN, England FA. Win probabilities are algorithmic estimates for entertainment only.
      Always use licensed streams.
    </p>
  `;
}

// Shared stream presets data
const STREAM_PRESETS = [
  { label: "🏆 EpicSports",  url: "https://me.epicsports.online/" },
  { label: "📺 FIFA+",       url: "https://www.fifa.com/fifaplus" },
  { label: "🇮🇳 SonyLIV",    url: "https://www.sonyliv.com" },
  { label: "🎬 Hotstar",     url: "https://www.hotstar.com" },
  { label: "📱 Zee5",        url: "https://www.zee5.com" },
  { label: "🏏 FanCode",     url: "https://fancode.com" },
  { label: "🇺🇸 Fox Sports", url: "https://www.foxsports.com" },
  { label: "🇬🇧 BBC",        url: "https://www.bbc.co.uk/iplayer" },
  { label: "🇨🇦 TSN",        url: "https://www.tsn.ca/live" },
  { label: "🌍 DAZN",        url: "https://www.dazn.com" },
  { label: "🦚 Peacock",     url: "https://www.peacocktv.com" },
  { label: "⚡ beIN Sports", url: "https://www.beinsports.com" },
];

// Page fade-in on load
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");
});
