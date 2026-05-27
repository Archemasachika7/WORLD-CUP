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

// ── Dark / light theme (system-detected, user-overridable) ──
const THEME_KEY = "wc26_theme";

function preferredColorScheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setColorScheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("nav-theme-toggle");
  if (btn) { btn.textContent = theme === "light" ? "☀️" : "🌙"; }
}

function toggleColorScheme() {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  setColorScheme(next);
}

// Apply immediately (before nav builds) to minimise flash
setColorScheme(preferredColorScheme());

// ── UTC → local kickoff time helper ──
// Match data stores date ("2026-06-11") + time ("20:00") as UTC.
// Returns the kickoff rendered in the viewer's own browser timezone.
function formatKickoffLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return { date: "TBD", time: "", tz: "" };
  const d = new Date(`${dateStr}T${timeStr}:00Z`);
  if (isNaN(d.getTime())) return { date: dateStr, time: timeStr, tz: "UTC" };
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const tz = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(d).find(p => p.type === "timeZoneName")?.value || "";
  return { date, time, tz };
}

function buildNav(activePage) {
  const container = document.getElementById("main-nav");
  if (!container) return;

  container.innerHTML = `
    <div class="nav-logo">
      <img src="img/your-logo.png" alt="FIFA World Cup 2026 logo" style="height:44px;width:auto" loading="lazy" onerror="this.style.display='none'" />
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
    <button class="nav-theme-toggle" id="nav-theme-toggle" aria-label="Toggle dark/light mode" title="Toggle dark/light mode">🌙</button>
    <a class="nav-cta" href="meet.html">🏟️ Meet Rooms</a>
  `;
  setColorScheme(document.documentElement.getAttribute("data-theme") || preferredColorScheme());
  document.getElementById("nav-theme-toggle")?.addEventListener("click", toggleColorScheme);

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

// ── Cinematic player background cycler ─────────────────
const BG_PLAYERS = [
  // Portugal first — Ronaldo leads, then squad
  "Cristiano Ronaldo",
  "Bruno Fernandes",
  "Rafael Leão",
  "Bernardo Silva",
  "Rúben Dias",
  "João Félix",
  "Diogo Costa",
  "Pedro Neto",
  // World stars
  "Lionel Messi",
  "Kylian Mbappé",
  "Vinicius Junior",
  "Jude Bellingham",
  "Rodri",
  "Lamine Yamal",
  "Erling Haaland",
];

function _makeBgLayer() {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "wc-bg-layer";
  Object.assign(el.style, {
    position:           "fixed",
    inset:              "0",
    backgroundSize:     "cover",
    backgroundPosition: "center 20%",
    backgroundRepeat:   "no-repeat",
    filter:             "blur(14px) brightness(0.28)",
    transform:          "scale(1.08)",
    zIndex:             "-1",
    opacity:            "0",
    transition:         "opacity 2.5s ease-in-out",
    animation:          "slowZoom 40s ease-in-out infinite",
    pointerEvents:      "none",
  });
  document.body.prepend(el);
  return el;
}

function startBgCycler() {
  if (typeof getPlayerPhoto !== "function") return;
  if (window.location.pathname.includes("meet")) return;
  const layerA = _makeBgLayer();
  const layerB = _makeBgLayer();
  let active = layerA, idle = layerB, idx = 0;

  async function tick() {
    const name = BG_PLAYERS[idx % BG_PLAYERS.length];
    idx++;
    try {
      const url = await getPlayerPhoto(name);
      if (!url || (typeof _photoPlaceholder !== "undefined" && url === _photoPlaceholder)) return;
      idle.style.backgroundImage = `url('${url}')`;
      void idle.offsetHeight; // force reflow so transition fires
      idle.style.opacity  = "0.75";
      active.style.opacity = "0";
      [active, idle] = [idle, active];
    } catch {}
  }

  tick();
  setInterval(tick, 12000);
}

// Scroll progress bar (host-nation tricolour) — injected on every page
function initScrollProgress() {
  let bar = document.getElementById("scroll-progress");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);
  }
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = max > 0 ? (h.scrollTop / max) * 100 + "%" : "0";
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// Site anthem — floating play/pause button. "A Triangle of Fire".
// Browser autoplay policy needs a user gesture, so playback starts on first click.
// Play state + position persist across pages via sessionStorage for seamless nav.
const ANTHEM_SRC   = "audio/triangle-of-fire.mp3";
const ANTHEM_STATE = "wc26_anthem_playing";
const ANTHEM_TIME  = "wc26_anthem_time";

function initAnthem() {
  if (document.getElementById("anthem-toggle")) return;
  if (window.location.pathname.includes("meet")) return;  // don't clash with call audio

  const audio = new Audio(ANTHEM_SRC);
  audio.loop = true;
  audio.preload = "none";
  audio.volume = 0.55;

  // Resume from where the last page left off
  const savedTime = parseFloat(sessionStorage.getItem(ANTHEM_TIME) || "0");
  if (savedTime > 0) audio.currentTime = savedTime;

  const btn = document.createElement("button");
  btn.id = "anthem-toggle";
  btn.className = "anthem-toggle";
  btn.setAttribute("aria-label", "Play World Cup anthem");
  btn.title = "A Triangle of Fire — World Cup 2026 anthem";
  btn.innerHTML = `<span class="anthem-icon">♪</span><span class="anthem-eq"><i></i><i></i><i></i><i></i></span>`;
  document.body.appendChild(btn);

  function setPlaying(on) {
    btn.classList.toggle("playing", on);
    btn.setAttribute("aria-label", on ? "Pause World Cup anthem" : "Play World Cup anthem");
    sessionStorage.setItem(ANTHEM_STATE, on ? "1" : "0");
  }

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  // Persist position so the next page resumes smoothly
  setInterval(() => {
    if (!audio.paused) sessionStorage.setItem(ANTHEM_TIME, String(audio.currentTime));
  }, 1000);
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem(ANTHEM_TIME, String(audio.currentTime));
  });

  // Continue playing across navigations if it was on (after first gesture this page)
  if (sessionStorage.getItem(ANTHEM_STATE) === "1") {
    const resume = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
      document.removeEventListener("click", resume);
      document.removeEventListener("keydown", resume);
    };
    document.addEventListener("click", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  }
}

// Page fade-in on load
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");
  startBgCycler();
  initScrollProgress();
  initAnthem();
});
