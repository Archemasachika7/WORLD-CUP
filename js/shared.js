// ============================================================
// Shared Navigation & Utilities — World Cup 2026
// ============================================================

const NAV_PAGES = [
  { id: "home",        href: "index.html",       icon: "🏆", label: "Home"        },
  { id: "teams",       href: "teams.html",        icon: "👥", label: "Teams"       },
  { id: "matches",     href: "matches.html",      icon: "⚽", label: "Matches"     },
  { id: "stats",       href: "stats.html",        icon: "📊", label: "Stats"       },
  { id: "predictions", href: "predictions.html",  icon: "🔮", label: "Predictions" },
  { id: "bracket",     href: "bracket.html",      icon: "🏆", label: "Bracket"     },
  { id: "meet",        href: "meet.html",         icon: "🏟️", label: "Meet"        },
  { id: "games",       href: "games.html",        icon: "🎮", label: "Games"       },
];

// Convert a match UTC date+time to user's local timezone
// Returns e.g. "20:00 UTC · 15:00 EDT (you)"
function localMatchTime(dateStr, utcTime) {
  try {
    const [h, m] = utcTime.split(":").map(Number);
    const dt = new Date(Date.UTC(
      parseInt(dateStr.slice(0,4)),
      parseInt(dateStr.slice(5,7)) - 1,
      parseInt(dateStr.slice(8,10)),
      h, m
    ));
    const localStr = dt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12: false });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzAbbr = new Intl.DateTimeFormat("en-US", { timeZoneName: "short", hour:"numeric" })
      .formatToParts(dt).find(p => p.type === "timeZoneName")?.value || "";
    // If local time equals UTC time (user IS in UTC), just show UTC
    const utcHH = String(h).padStart(2,"0");
    const utcMM = String(m).padStart(2,"0");
    if (localStr === `${utcHH}:${utcMM}`) return `${utcTime} UTC`;
    return `${utcTime} UTC · ${localStr} ${tzAbbr} (your time)`;
  } catch {
    return utcTime;
  }
}

function buildNav(activePage) {
  const container = document.getElementById("main-nav");
  if (!container) return;

  container.innerHTML = `
    <div class="nav-logo">
      <span class="logo-wc">WC</span><span class="logo-26">26</span>
      <span style="font-family:var(--font-display);font-size:.65rem;letter-spacing:2px;color:#555;align-self:flex-end;margin-bottom:3px;padding-left:4px">FIFA</span>
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
    <button class="theme-toggle" id="theme-toggle" title="Toggle dark/light mode" aria-label="Toggle theme">🌙</button>
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

  // Theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("wc-theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    if (themeBtn) themeBtn.textContent = "☀️";
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      themeBtn.textContent = isLight ? "☀️" : "🌙";
      localStorage.setItem("wc-theme", isLight ? "light" : "dark");
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
    <p>⚽ <strong>WE ARE 26</strong> — World Cup 2026 Fan Hub · USA · Canada · Mexico</p>
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
