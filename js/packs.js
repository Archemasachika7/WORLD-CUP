// ============================================================
// Pack Opening — FUT-style card reveal from the PLAYERS pool
// ============================================================

const PackOpening = (() => {
  // Rarity from a player's rating (rating is ~7.4–9.4 → overall 74–94)
  function overall(p) { return Math.round((p.rating || 7.5) * 10); }
  function rarityOf(p) {
    const o = overall(p);
    if (o >= 90) return "special";
    if (o >= 86) return "goldrare";
    if (o >= 83) return "gold";
    if (o >= 80) return "silver";
    return "bronze";
  }

  // Packs: size + weighted rarity odds + a guaranteed floor
  const PACKS = {
    bronze:  { name: "Bronze Pack",  icon: "🥉", size: 4, color: "#cd7f32",
               odds: { bronze: 70, silver: 25, gold: 5 } },
    gold:    { name: "Gold Pack",    icon: "🥇", size: 5, color: "#FFD700",
               odds: { silver: 45, gold: 40, goldrare: 13, special: 2 }, floor: "silver" },
    premium: { name: "Premium Gold", icon: "✨", size: 5, color: "#f5c542",
               odds: { gold: 55, goldrare: 35, special: 10 }, floor: "gold" },
    icon:    { name: "Icon Pack",    icon: "🌟", size: 3, color: "#e8e1c5",
               odds: { goldrare: 55, special: 45 }, floor: "goldrare" },
  };

  let pool = [];
  let currentPack = null;

  function init() {
    if (typeof PLAYERS === "undefined") return;
    pool = PLAYERS.slice();
    renderStore();
    bind();
  }

  function bind() {
    document.getElementById("packs-back-btn")?.addEventListener("click", showStore);
    document.getElementById("packs-store-btn")?.addEventListener("click", showStore);
    document.getElementById("packs-again-btn")?.addEventListener("click", () => openPack(currentPack));
    document.getElementById("packs-pack")?.addEventListener("click", revealCurrent);
  }

  function renderStore() {
    const store = document.getElementById("packs-store");
    if (!store) return;
    store.innerHTML = Object.entries(PACKS).map(([key, p]) => `
      <button class="pack-tile pack-tile-${key}" data-pack="${key}" style="--pack-color:${p.color}">
        <span class="pack-tile-icon">${p.icon}</span>
        <span class="pack-tile-name">${p.name}</span>
        <span class="pack-tile-size">${p.size} players</span>
      </button>`).join("");
    store.querySelectorAll(".pack-tile").forEach(btn => {
      btn.addEventListener("click", () => openPack(btn.dataset.pack));
    });
  }

  function showStore() {
    document.getElementById("packs-store").style.display = "";
    document.getElementById("packs-stage").style.display = "none";
  }

  // Choose a pack → show the sealed pack ready to tap
  function openPack(key) {
    currentPack = key;
    const pack = PACKS[key];
    document.getElementById("packs-store").style.display = "none";
    const stage = document.getElementById("packs-stage");
    stage.style.display = "flex";
    const packEl = document.getElementById("packs-pack");
    packEl.style.setProperty("--pack-color", pack.color);
    document.getElementById("packs-pack-wrap").style.display = "flex";
    packEl.classList.remove("opening");
    document.getElementById("packs-reveal").style.display = "none";
    document.getElementById("packs-reveal").innerHTML = "";
    document.getElementById("packs-actions").style.display = "none";
  }

  function revealCurrent() {
    const packEl = document.getElementById("packs-pack");
    if (packEl.classList.contains("opening")) return;
    packEl.classList.add("opening");
    const pulls = drawPack(currentPack);
    setTimeout(() => {
      document.getElementById("packs-pack-wrap").style.display = "none";
      showReveal(pulls);
    }, 850);
  }

  // Weighted random pull honoring odds + floor
  function drawPack(key) {
    const pack = PACKS[key];
    const byRarity = groupByRarity();
    const cards = [];
    for (let i = 0; i < pack.size; i++) {
      const rarity = pickRarity(pack.odds, byRarity);
      const list = byRarity[rarity] && byRarity[rarity].length ? byRarity[rarity] : pool;
      cards.push(list[Math.floor(Math.random() * list.length)]);
    }
    // Guarantee the pack floor: if best card is below floor, upgrade one slot
    if (pack.floor) {
      const order = ["bronze","silver","gold","goldrare","special"];
      const floorIdx = order.indexOf(pack.floor);
      const hasFloor = cards.some(c => order.indexOf(rarityOf(c)) >= floorIdx);
      if (!hasFloor) {
        for (let r = floorIdx; r < order.length; r++) {
          if (byRarity[order[r]]?.length) {
            cards[0] = byRarity[order[r]][Math.floor(Math.random() * byRarity[order[r]].length)];
            break;
          }
        }
      }
    }
    // Sort so the best card reveals last (walkout finale)
    const order = ["bronze","silver","gold","goldrare","special"];
    cards.sort((a,b) => order.indexOf(rarityOf(a)) - order.indexOf(rarityOf(b)));
    return cards;
  }

  function groupByRarity() {
    const g = { bronze:[], silver:[], gold:[], goldrare:[], special:[] };
    pool.forEach(p => g[rarityOf(p)].push(p));
    return g;
  }

  function pickRarity(odds, byRarity) {
    const avail = Object.entries(odds).filter(([r]) => byRarity[r]?.length);
    const total = avail.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [r, w] of avail) { roll -= w; if (roll <= 0) return r; }
    return avail[0]?.[0] || "bronze";
  }

  function showReveal(cards) {
    const wrap = document.getElementById("packs-reveal");
    wrap.style.display = "flex";
    wrap.innerHTML = cards.map((p, i) => cardHtml(p, i)).join("");

    // Flip cards one by one
    const els = wrap.querySelectorAll(".pack-card");
    els.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("flipped");
        const p = cards[i];
        const r = rarityOf(p);
        if (r === "special" || r === "goldrare") {
          el.classList.add("walkout");
          burstConfetti(r === "special");
        }
        loadCardPhoto(el, p.name);
      }, 500 + i * 650);
    });

    // Show actions after the last reveal
    setTimeout(() => {
      document.getElementById("packs-actions").style.display = "flex";
    }, 500 + cards.length * 650 + 300);
  }

  function cardHtml(p, i) {
    const r = rarityOf(p);
    const nation = (typeof flagImgFromEmoji === "function") ? flagImgFromEmoji(p.nation, 22) : (p.nation || "");
    return `
      <div class="pack-card pack-card-${r}" style="animation-delay:${i*0.05}s">
        <div class="pack-card-inner">
          <div class="pack-card-back"><span>⚽</span></div>
          <div class="pack-card-front">
            <div class="pack-card-top">
              <span class="pack-card-ovr">${overall(p)}</span>
              <span class="pack-card-pos">${p.pos || ""}</span>
              <span class="pack-card-nation">${nation}</span>
            </div>
            <div class="pack-card-photo" data-photo></div>
            <div class="pack-card-name">${esc(p.name)}</div>
            <div class="pack-card-club">${esc(p.club || "")}</div>
          </div>
        </div>
      </div>`;
  }

  async function loadCardPhoto(cardEl, name) {
    const holder = cardEl.querySelector("[data-photo]");
    if (!holder || typeof getPlayerPhoto !== "function") return;
    try {
      const url = await getPlayerPhoto(name);
      if (url) holder.style.backgroundImage = `url('${url}')`;
    } catch {}
  }

  // ── Confetti ──
  function burstConfetti(big) {
    const cont = document.getElementById("packs-confetti");
    if (!cont) return;
    const colors = ["#FF0000","#00A650","#004B87","#FFD700","#ffffff"];
    const n = big ? 60 : 28;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "confetti-bit";
      c.style.left = (40 + Math.random() * 20) + "%";
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.setProperty("--dx", (Math.random() * 360 - 180) + "px");
      c.style.setProperty("--dy", (-180 - Math.random() * 220) + "px");
      c.style.setProperty("--rot", (Math.random() * 720) + "deg");
      c.style.animationDuration = (0.9 + Math.random() * 0.7) + "s";
      cont.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => PackOpening.init());
