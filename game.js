(() => {
  "use strict";

  const SAVE_KEY = "fryday-midnight-shift-v1";
  const MAX_ORDERS = 3;
  const COOLDOWN_BASE = 36000;

  const UPGRADES = [
    {
      id: "spatula",
      name: "Sizzle Spatula",
      icon: "🥄",
      tone: "",
      desc: "Smash another patty with every tap.",
      base: 14,
      growth: 1.6,
      unlock: () => true,
      unlockShort: "",
      effect: (level) => `+${1 + level} → +${2 + level} per tap`
    },
    {
      id: "grill",
      name: "Second Grill",
      icon: "🍳",
      tone: "mint",
      desc: "A hands-free grill keeps patties moving.",
      base: 28,
      growth: 1.64,
      unlock: (s) => s.served >= 1,
      unlockShort: "Serve 1",
      effect: (level) => `${(level * 0.65).toFixed(1)} → ${((level + 1) * 0.65).toFixed(1)} / sec`
    },
    {
      id: "sauce",
      name: "Secret Sauce",
      icon: "🧂",
      tone: "coral",
      desc: "A little drizzle raises every ticket.",
      base: 115,
      growth: 2.05,
      unlock: (s) => s.served >= 5,
      unlockShort: "Serve 5",
      effect: (level) => `+${Math.round(level * 22)}% → +${Math.round((level + 1) * 22)}% tips`
    },
    {
      id: "drivethru",
      name: "Drive-Thru Lane",
      icon: "🚗",
      tone: "blue",
      desc: "More regulars, less waiting between tickets.",
      base: 95,
      growth: 2.12,
      unlock: (s) => s.served >= 10,
      unlockShort: "Serve 10",
      effect: (level) => `${Math.max(3.2, 8.5 - level * 0.55).toFixed(1)}s → ${Math.max(3.2, 8.5 - (level + 1) * 0.55).toFixed(1)}s / ticket`
    },
    {
      id: "treats",
      name: "Corgi Treats",
      icon: "🦴",
      tone: "",
      desc: "Nugget goes harder. Zoomies hit stronger.",
      base: 75,
      growth: 1.9,
      unlock: (s) => s.zoomiesUsed >= 1,
      unlockShort: "Try Zoomies",
      effect: (level) => `x${(2 + level * 0.25).toFixed(2)}·${8 + level * 1.4}s → x${(2 + (level + 1) * 0.25).toFixed(2)}·${8 + (level + 1) * 1.4}s`
    }
  ];

  const DISHES = [
    { emoji: "🍔", name: "The Classic", note: "extra pickles, no onions" },
    { emoji: "🍔", name: "Double Smash", note: "make it messy" },
    { emoji: "🍟", name: "Fryday Combo", note: "fries extra crispy" },
    { emoji: "🌭", name: "Chili Dawg", note: "sauce on the side" },
    { emoji: "🥤", name: "Shake & Stack", note: "strawberry, please" },
    { emoji: "🍗", name: "Nugget Basket", note: "honey mustard x2" },
    { emoji: "🍔", name: "Big Night Burger", note: "for here, not to go" },
    { emoji: "🧀", name: "Cheese Freak", note: "yes, more cheese" }
  ];

  const CUSTOMERS = [
    "Marisol", "Big Tony", "Night Owl", "Rae", "Coach", "Dee", "Luz", "Jules",
    "Sam", "Nora", "Tiny", "Bea", "Moe", "Kit", "Pops", "Iris", "Alex", "June"
  ];

  const ACHIEVEMENTS = [
    {
      id: "first_flip", icon: "🍔", name: "First Flip",
      desc: "Cook your first patty.",
      test: (s) => s.totalPatties >= 1,
      progress: (s) => [Math.min(s.totalPatties, 1), 1]
    },
    {
      id: "order_up", icon: "🧾", name: "Order Up",
      desc: "Serve your first ticket.",
      test: (s) => s.served >= 1,
      progress: (s) => [Math.min(s.served, 1), 1]
    },
    {
      id: "good_dog", icon: "🐾", name: "Good Dog",
      desc: "Use Nugget's Zoomies once.",
      test: (s) => s.zoomiesUsed >= 1,
      progress: (s) => [Math.min(s.zoomiesUsed, 1), 1]
    },
    {
      id: "side_hustle", icon: "🔧", name: "Side Hustle",
      desc: "Buy your first kitchen upgrade.",
      test: (s) => totalUpgrades(s) >= 1,
      progress: (s) => [Math.min(totalUpgrades(s), 1), 1]
    },
    {
      id: "ten_orders", icon: "🍟", name: "Regular Crowd",
      desc: "Serve 10 tickets.",
      test: (s) => s.served >= 10,
      progress: (s) => [Math.min(s.served, 10), 10]
    },
    {
      id: "hot_stuff", icon: "🔥", name: "Hot Stuff",
      desc: "Fill the Sizzle meter to the top.",
      test: (s) => s.bestHeat >= 92,
      progress: (s) => [Math.min(s.bestHeat, 92), 92]
    },
    {
      id: "cash_500", icon: "💵", name: "Pocket Money",
      desc: "Earn $500 all-time.",
      test: (s) => s.totalEarned >= 500,
      progress: (s) => [Math.min(s.totalEarned, 500), 500]
    },
    {
      id: "fifty_orders", icon: "🏆", name: "Line Cook Legend",
      desc: "Serve 50 tickets.",
      test: (s) => s.served >= 50,
      progress: (s) => [Math.min(s.served, 50), 50]
    },
    {
      id: "clicks_250", icon: "👆", name: "Knuckle Grease",
      desc: "Tap the grill 250 times.",
      test: (s) => s.clicks >= 250,
      progress: (s) => [Math.min(s.clicks, 250), 250]
    },
    {
      id: "upgrades_10", icon: "🛠️", name: "Well Equipped",
      desc: "Buy 10 upgrades.",
      test: (s) => totalUpgrades(s) >= 10,
      progress: (s) => [Math.min(totalUpgrades(s), 10), 10]
    },
    {
      id: "franchise", icon: "⭐", name: "Franchise Owner",
      desc: "Open your first franchise.",
      test: (s) => s.franchises >= 1,
      progress: (s) => [Math.min(s.franchises, 1), 1]
    },
    {
      id: "regulars", icon: "📈", name: "Future Empire",
      desc: "Earn $5,000 all-time.",
      test: (s) => s.totalEarned >= 5000,
      progress: (s) => [Math.min(s.totalEarned, 5000), 5000]
    }
  ];

  const LOCATION_NAMES = [
    "The Original", "Neon Alley", "The Corner", "Uptown Smash", "Last Stop",
    "The Late Shift", "Lucky Number 7", "Downtown Heat", "The Night Market"
  ];

  const el = {
    app: document.getElementById("app"),
    scene: document.getElementById("scene"),
    cash: document.getElementById("cashValue"),
    cashAmount: document.getElementById("cashAmount"),
    tapStat: document.getElementById("tapStat"),
    autoStat: document.getElementById("autoStat"),
    servedStat: document.getElementById("servedStat"),
    rankPill: document.getElementById("rankPill"),
    rankCount: document.getElementById("rankCount"),
    tickets: document.getElementById("tickets"),
    queueCount: document.getElementById("queueCount"),
    grillBtn: document.getElementById("grillBtn"),
    grillBadge: document.getElementById("grillBadge"),
    fxLayer: document.getElementById("fxLayer"),
    petBtn: document.getElementById("petBtn"),
    petBubble: document.getElementById("petBubble"),
    petHint: document.getElementById("petHint"),
    firstHint: document.getElementById("firstHint"),
    stockCount: document.getElementById("stockCount"),
    sizzleMult: document.getElementById("sizzleMult"),
    heatFill: document.getElementById("heatFill"),
    heatTrack: document.getElementById("heatTrack"),
    heatHint: document.getElementById("heatHint"),
    zoomBtn: document.getElementById("zoomBtn"),
    zoomStatus: document.getElementById("zoomStatus"),
    zoomCool: document.getElementById("zoomCool"),
    upgradeList: document.getElementById("upgradeList"),
    upgradePanel: document.getElementById("upgradePanel"),
    achievementPanel: document.getElementById("achievementPanel"),
    tabUpgrades: document.getElementById("tabUpgrades"),
    tabAchievements: document.getElementById("tabAchievements"),
    achList: document.getElementById("achList"),
    achCount: document.getElementById("achCount"),
    achSummaryCount: document.getElementById("achSummaryCount"),
    achSummaryBar: document.getElementById("achSummaryBar"),
    franchiseCard: document.getElementById("franchiseCard"),
    franchiseName: document.getElementById("franchiseName"),
    franchiseDesc: document.getElementById("franchiseDesc"),
    franchiseTrack: document.getElementById("franchiseTrack"),
    franchiseBar: document.getElementById("franchiseBar"),
    franchiseProgress: document.getElementById("franchiseProgress"),
    franchiseBtn: document.getElementById("franchiseBtn"),
    franchiseBonusPreview: document.getElementById("franchiseBonusPreview"),
    franchiseNextPreview: document.getElementById("franchiseNextPreview"),
    franchiseModalText: document.getElementById("franchiseModalText"),
    starCount: document.getElementById("starCount"),
    shiftBadge: document.getElementById("shiftBadge"),
    sideSub: document.getElementById("sideSub"),
    soundBtn: document.getElementById("soundBtn"),
    helpBtn: document.getElementById("helpBtn"),
    resetBtn: document.getElementById("resetBtn"),
    confirmReset: document.getElementById("confirmReset"),
    confirmFranchise: document.getElementById("confirmFranchise"),
    helpModal: document.getElementById("helpModal"),
    franchiseModal: document.getElementById("franchiseModal"),
    resetModal: document.getElementById("resetModal"),
    toasts: document.getElementById("toasts"),
    saveStatus: document.getElementById("saveStatus")
  };

  let state;
  let offlineReport = null;
  let audioCtx = null;
  let lastFrame = performance.now();
  let uiClock = 0;
  let saveClock = 0;
  let achClock = 0;
  let lastOrderSignature = "";
  let lastCash = 0;
  let lastTitle = "";
  let isZooming = false;
  let bubbleTimer = 0;
  let hintTimer = 0;
  const seenOrders = new Set();
  let knownUnlocks = new Set();
  let activeTab = "upgrades";
  let modalReturnFocus = null;

  function freshState() {
    const now = Date.now();
    return {
      version: 1,
      cash: 0,
      totalEarned: 0,
      runEarned: 0,
      patties: 0,
      totalPatties: 0,
      clicks: 0,
      served: 0,
      runServed: 0,
      heat: 0,
      bestHeat: 0,
      upgrades: { spatula: 0, grill: 0, sauce: 0, drivethru: 0, treats: 0 },
      franchises: 0,
      zoomiesUntil: 0,
      zoomiesReadyAt: 0,
      zoomiesUsed: 0,
      achievements: {},
      sound: true,
      orders: [],
      nextOrderId: 1,
      nextOrderAt: now + 7000,
      lastSeen: now
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return freshState();
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return freshState();
      const next = freshState();
      const numeric = [
        "cash", "totalEarned", "runEarned", "patties", "totalPatties", "clicks",
        "served", "runServed", "heat", "bestHeat", "franchises", "zoomiesUntil", "zoomiesReadyAt",
        "zoomiesUsed", "nextOrderId", "nextOrderAt", "lastSeen"
      ];
      numeric.forEach((key) => {
        if (Number.isFinite(Number(saved[key]))) next[key] = Number(saved[key]);
      });
      if (saved.upgrades && typeof saved.upgrades === "object") {
        UPGRADES.forEach((upgrade) => {
          const value = Number(saved.upgrades[upgrade.id]);
          if (Number.isFinite(value) && value >= 0) next.upgrades[upgrade.id] = Math.floor(value);
        });
      }
      if (saved.achievements && typeof saved.achievements === "object") {
        ACHIEVEMENTS.forEach((achievement) => {
          if (saved.achievements[achievement.id]) {
            next.achievements[achievement.id] = Number(saved.achievements[achievement.id]) || Date.now();
          }
        });
      }
      if (typeof saved.sound === "boolean") next.sound = saved.sound;
      if (Array.isArray(saved.orders)) {
        next.orders = saved.orders
          .filter((order) => order && Number.isFinite(Number(order.need)) && Number(order.need) > 0)
          .slice(0, MAX_ORDERS)
          .map((order) => ({
            id: Number(order.id) || next.nextOrderId++,
            need: Math.max(1, Math.round(Number(order.need))),
            progress: Math.max(0, Math.min(Number(order.progress) || 0, Number(order.need))),
            reward: Math.max(1, Math.round(Number(order.reward) || 1)),
            customer: String(order.customer || "Regular"),
            emoji: String(order.emoji || "🍔"),
            dish: String(order.dish || "The Classic"),
            note: String(order.note || "extra napkins")
          }));
      }
      return next;
    } catch (error) {
      console.warn("FRYDAY save could not be loaded.", error);
      return freshState();
    }
  }

  function saveState() {
    try {
      state.lastSeen = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      const time = new Date();
      el.saveStatus.textContent = `Autosaved · ${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
    } catch (error) {
      el.saveStatus.textContent = "Autosave unavailable";
    }
  }

  function franchiseMultiplier() {
    return 1 + state.franchises * 0.35;
  }

  function zoomMultiplier() {
    return 2 + state.upgrades.treats * 0.25;
  }

  function zoomDuration() {
    return 8000 + state.upgrades.treats * 1400;
  }

  function zoomActive(now = Date.now()) {
    return now < state.zoomiesUntil;
  }

  function clickPower() {
    return (1 + state.upgrades.spatula) * franchiseMultiplier() * (zoomActive() ? zoomMultiplier() : 1);
  }

  function autoRate() {
    return state.upgrades.grill * 0.65 * franchiseMultiplier() * (zoomActive() ? zoomMultiplier() : 1);
  }

  function tipMultiplier() {
    return (1 + state.upgrades.sauce * 0.22) * franchiseMultiplier();
  }

  function sizzleMultiplier() {
    return 1 + (state.heat / 100) * 1.2;
  }

  function orderInterval() {
    return Math.max(3.2, 8.5 - state.upgrades.drivethru * 0.55);
  }

  function franchiseGoal() {
    return Math.round(3000 * Math.pow(1.9, state.franchises));
  }

  function totalUpgrades(s = state) {
    return Object.values(s.upgrades).reduce((sum, value) => sum + value, 0);
  }

  function upgradeCost(definition) {
    return Math.ceil(definition.base * Math.pow(definition.growth, state.upgrades[definition.id]));
  }

  function makeOrder() {
    const dish = DISHES[Math.floor(Math.random() * DISHES.length)];
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    const need = Math.max(3, Math.round(3 + Math.pow(state.runServed, 0.72) * 0.55 + Math.random() * 2.8));
    const unitPrice = 2.15 + Math.pow(state.runServed, 0.65) * 0.08;
    const reward = Math.max(3, Math.round(need * unitPrice * tipMultiplier()));
    return {
      id: state.nextOrderId++,
      need,
      progress: 0,
      reward,
      customer,
      emoji: dish.emoji,
      dish: dish.name,
      note: dish.note
    };
  }

  function seedOrders(count = 2) {
    refillOrders(count);
    if (!Number.isFinite(state.nextOrderAt) || state.nextOrderAt < Date.now() + 500) {
      state.nextOrderAt = Date.now() + Math.max(4000, orderInterval() * 850);
    }
  }

  function refillOrders(count = 2) {
    let safety = 0;
    while (state.orders.length < count && state.orders.length < MAX_ORDERS && safety < MAX_ORDERS) {
      state.orders.push(makeOrder());
      safety += 1;
    }
  }

  function processPatties() {
    const events = [];
    let applied = false;
    let safety = 0;
    while (state.patties > 0.000001 && state.orders.length > 0 && safety < 20) {
      safety += 1;
      const order = state.orders[0];
      const remaining = order.need - order.progress;
      if (remaining <= 0.000001) {
        const node = orderNode(order.id);
        const rect = node ? node.getBoundingClientRect() : null;
        serveOrder(order, events, rect);
        continue;
      }
      const take = Math.min(state.patties, remaining);
      if (take <= 0.000001) break;
      order.progress += take;
      state.patties -= take;
      applied = true;
      if (order.progress >= order.need - 0.000001) {
        const node = orderNode(order.id);
        const rect = node ? node.getBoundingClientRect() : null;
        serveOrder(order, events, rect);
      }
    }

    if (events.length > 0) {
      refillOrders(2);
      renderOrders();
      events.forEach(showServeEffect);
      checkAchievements();
    } else if (applied) {
      updateOrderBars();
    }
  }

  function serveOrder(order, events, rect) {
    const index = state.orders.findIndex((candidate) => candidate.id === order.id);
    if (index === -1) return;
    state.orders.splice(index, 1);
    const multiplier = sizzleMultiplier();
    const earned = Math.max(1, Math.round(order.reward * multiplier));
    const bonus = Math.max(0, earned - order.reward);
    state.cash += earned;
    state.totalEarned += earned;
    state.runEarned += earned;
    state.served += 1;
    state.runServed += 1;
    state.heat = Math.min(100, state.heat + 2.4);
    state.bestHeat = Math.max(state.bestHeat, state.heat);
    if (state.served === 1) {
      window.clearTimeout(hintTimer);
      el.firstHint.classList.add("is-hidden");
    }
    events.push({ order, earned, bonus, rect });
  }

  function addPatties(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    state.patties += amount;
    state.totalPatties += amount;
    processPatties();
  }

  function cook(event) {
    const amount = clickPower();
    addPatties(amount);
    state.clicks += 1;
    state.heat = Math.min(100, state.heat + 8.6);
    state.bestHeat = Math.max(state.bestHeat, state.heat);

    const spot = clickSpot(event);
    floatText(`+${formatPower(amount)}`, spot.x, spot.y - 20, "small");
    crumbs(spot.x, spot.y, zoomActive() ? 12 : 8);
    if (zoomActive()) floatText("x" + zoomMultiplier().toFixed(2), spot.x + 31, spot.y - 49, "zoom");
    if (state.clicks === 1) {
      el.firstHint.classList.add("is-hidden");
    }
    el.grillBtn.classList.remove("is-hit");
    void el.grillBtn.offsetWidth;
    el.grillBtn.classList.add("is-hit");
    window.setTimeout(() => el.grillBtn.classList.remove("is-hit"), 240);
    playTap();
    checkAchievements();
  }

  function clickSpot(event) {
    const sceneRect = el.scene.getBoundingClientRect();
    if (event && Number.isFinite(event.clientX) && (event.clientX !== 0 || event.clientY !== 0)) {
      return {
        x: Math.max(16, Math.min(sceneRect.width - 16, event.clientX - sceneRect.left)),
        y: Math.max(16, Math.min(sceneRect.height - 16, event.clientY - sceneRect.top))
      };
    }
    const grillRect = el.grillBtn.getBoundingClientRect();
    return {
      x: grillRect.left - sceneRect.left + grillRect.width / 2,
      y: grillRect.top - sceneRect.top + grillRect.height * 0.58
    };
  }

  function activateZoomies() {
    const now = Date.now();
    if (zoomActive(now)) {
      showPetBubble("ZOOM!");
      return;
    }
    if (now < state.zoomiesReadyAt) {
      const wait = Math.ceil((state.zoomiesReadyAt - now) / 1000);
      showPetBubble(`resting ${wait}s`);
      toast("Nugget is catching a breath", `${wait}s until the next Zoomies.`, "🐾");
      playRest();
      return;
    }
    state.zoomiesUntil = now + zoomDuration();
    state.zoomiesReadyAt = now + COOLDOWN_BASE + state.upgrades.treats * 650;
    state.zoomiesUsed += 1;
    bodyZoom(true);
    showPetBubble(["BORK!", "ZOOM!", "LET'S GO!"][Math.floor(Math.random() * 3)]);
    toast("Zoomies activated!", `Nugget doubles output for ${(zoomDuration() / 1000).toFixed(0)} seconds.`, "⚡", "achievement");
    const r = el.scene.getBoundingClientRect();
    confetti(14, r.width * 0.2, r.height * 0.7);
    playZoom();
    checkAchievements();
    renderUI(now);
  }

  function bodyZoom(active) {
    isZooming = active;
    document.body.classList.toggle("zooming", active);
  }

  function showPetBubble(text) {
    el.petBubble.textContent = text;
    el.petBubble.classList.add("show");
    window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => el.petBubble.classList.remove("show"), 1150);
  }

  function renderOrders() {
    const signature = state.orders.map((order) => order.id).join("|");
    if (signature !== lastOrderSignature) {
      if (state.orders.length === 0) {
        el.tickets.innerHTML = `<div class="no-tickets">No tickets yet — the next regular is walking in.</div>`;
      } else {
        const tickets = state.orders.map((order, index) => {
          const seen = seenOrders.has(order.id);
          seenOrders.add(order.id);
          const percent = Math.min(100, (order.progress / order.need) * 100);
          return `<article class="ticket${index === 0 ? " is-active" : ""}${seen ? " is-static" : ""}" data-order-id="${order.id}">
            <div class="ticket-top">
              <span class="ticket-no">#${String(order.id).padStart(3, "0")}</span>
              <span class="ticket-cust">${escapeHTML(order.customer)}</span>
              <span class="ticket-reward">${money(order.reward)}</span>
            </div>
            <div class="ticket-main">
              <span class="ticket-emoji" aria-hidden="true">${order.emoji}</span>
              <div class="ticket-dish"><b>${escapeHTML(order.dish)}</b><small>${order.need} patties</small></div>
            </div>
            <div class="ticket-progress-row">
              <span class="ticket-track"><i style="width:${percent}%"></i></span>
              <span class="ticket-count">${Math.min(order.need, Math.floor(order.progress))} / ${order.need}</span>
            </div>
            <div class="ticket-note">“${escapeHTML(order.note)}”</div>
          </article>`;
        }).join("");
        const emptySlots = Math.max(0, MAX_ORDERS - state.orders.length);
        el.tickets.innerHTML = tickets + Array.from({ length: emptySlots }, () => (
          `<div class="ticket-empty" aria-hidden="true"><span>Next regular</span><small>walking in…</small></div>`
        )).join("");
      }
      lastOrderSignature = signature;
    }
    el.queueCount.textContent = `${state.orders.length} / ${MAX_ORDERS}`;
    updateOrderBars();
  }

  function updateOrderBars() {
    state.orders.forEach((order, index) => {
      const node = orderNode(order.id);
      if (!node) return;
      const bar = node.querySelector(".ticket-track i");
      const count = node.querySelector(".ticket-count");
      const percent = Math.min(100, (order.progress / order.need) * 100);
      if (bar) bar.style.width = `${percent}%`;
      if (count) {
        const shown = Math.min(order.need, Math.floor(order.progress + 0.00001));
        count.textContent = `${shown} / ${order.need}`;
      }
      node.classList.toggle("is-active", index === 0);
    });
  }

  function orderNode(id) {
    return el.tickets.querySelector(`[data-order-id="${id}"]`);
  }

  function showServeEffect(event) {
    const sceneRect = el.scene.getBoundingClientRect();
    const rect = event.rect;
    let x = sceneRect.width / 2;
    let y = sceneRect.height * 0.25;
    if (rect && rect.width > 0) {
      x = rect.left - sceneRect.left + rect.width / 2;
      y = rect.top - sceneRect.top + rect.height / 2;
      if (y < sceneRect.height * 0.2) y = sceneRect.height * 0.2;
    }
    floatText(`+${money(event.earned)}`, x, y, "cash");
    stamp("Served", x, y + 21);
    crumbs(x, y + 9, 10);
    if (event.bonus >= 1) {
      floatText(`sizzle +${money(event.bonus)}`, x, y + 53, "served");
    }
    bumpCash();
    playServe();
    if (state.served === 1) {
      window.setTimeout(() => toast("First ticket served!", "Tips are in. Upgrade the kitchen or see what unlocks next.", "🧾"), 320);
    }
  }

  function floatText(text, x, y, className = "") {
    const node = document.createElement("span");
    node.className = `float-text ${className}`.trim();
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    el.fxLayer.appendChild(node);
    window.setTimeout(() => node.remove(), 1000);
  }

  function stamp(text, x, y) {
    const node = document.createElement("span");
    node.className = "serve-stamp";
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    el.fxLayer.appendChild(node);
    window.setTimeout(() => node.remove(), 1100);
  }

  function crumbs(x, y, count = 8) {
    for (let index = 0; index < count; index += 1) {
      const node = document.createElement("span");
      node.className = "crumb";
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      const angle = Math.random() * Math.PI * 2;
      const distance = 22 + Math.random() * 58;
      node.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      node.style.setProperty("--dy", `${Math.sin(angle) * distance - 18}px`);
      node.style.background = Math.random() > 0.65 ? "#ff8b4a" : "#ffc34c";
      el.fxLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 720);
    }
  }

  function confetti(count = 16, originX = null, originY = null) {
    const sceneRect = el.scene.getBoundingClientRect();
    const x = originX === null ? sceneRect.width / 2 : originX;
    const y = originY === null ? sceneRect.height * 0.25 : originY;
    const colors = ["#ffc34c", "#f05b3d", "#70d4b2", "#fff1cf", "#f39a4b"];
    for (let index = 0; index < count; index += 1) {
      const node = document.createElement("span");
      node.className = "confetti";
      node.style.left = `${x + (Math.random() - 0.5) * 90}px`;
      node.style.top = `${y}px`;
      node.style.background = colors[index % colors.length];
      node.style.animationDelay = `${Math.random() * 0.22}s`;
      node.style.transform = `rotate(${Math.random() * 90}deg)`;
      el.fxLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 1700);
    }
  }

  function bumpCash() {
    el.cash.classList.add("bump");
    window.clearTimeout(bumpCash.timer);
    bumpCash.timer = window.setTimeout(() => el.cash.classList.remove("bump"), 180);
  }

  function renderUI(now = Date.now()) {
    const cash = Math.max(0, state.cash);
    if (cash !== lastCash) {
      el.cashAmount.textContent = formatNumber(cash);
      lastCash = cash;
    }
    el.tapStat.textContent = `+${formatPower(clickPower())}`;
    el.autoStat.textContent = `${formatPower(autoRate())}/s`;
    el.servedStat.textContent = formatNumber(state.runServed);
    el.grillBadge.textContent = `+${formatPower(clickPower())} / tap`;

    const active = zoomActive(now);
    if (active !== isZooming) bodyZoom(active);
    const cooling = !active && now < state.zoomiesReadyAt;
    const coolingSeconds = Math.max(0, Math.ceil((state.zoomiesReadyAt - now) / 1000));
    el.zoomBtn.classList.toggle("is-active", active);
    el.zoomBtn.classList.toggle("is-cooling", cooling);
    el.petBtn.classList.toggle("is-cooling", cooling);
    if (active) {
      const remaining = Math.max(0, Math.ceil((state.zoomiesUntil - now) / 1000));
      el.zoomStatus.textContent = `${remaining}s of zoom`;
      el.petHint.textContent = "zoomies!";
    } else if (cooling) {
      el.zoomStatus.textContent = `Nugget rests ${coolingSeconds}s`;
      el.petHint.textContent = `${coolingSeconds}s`;
      el.zoomCool.style.transform = `scaleX(${Math.max(0.02, (state.zoomiesReadyAt - now) / (COOLDOWN_BASE + state.upgrades.treats * 650))})`;
    } else {
      el.zoomStatus.textContent = "Ready";
      el.petHint.textContent = "click for zoomies";
      el.zoomCool.style.transform = "scaleX(0)";
    }

    const heat = Math.max(0, Math.min(100, state.heat));
    el.heatFill.style.width = `${heat}%`;
    el.heatTrack.setAttribute("aria-valuenow", String(Math.round(heat)));
    el.sizzleMult.textContent = `x${sizzleMultiplier().toFixed(2)}`;
    if (heat >= 90) {
      el.heatHint.textContent = "On fire · maximum tip bonus";
    } else if (heat > 0.5) {
      el.heatHint.textContent = "Keep it hot for bigger tips";
    } else {
      el.heatHint.textContent = "Tap fast to boost order tips";
    }

    el.stockCount.textContent = formatNumber(Math.floor(state.totalPatties));
    upgradeAffordability();
    checkUpgradeUnlocks();
    renderFranchise();

    const count = Object.keys(state.achievements).length;
    el.achCount.textContent = String(count);
    el.achSummaryCount.textContent = String(count);
    el.achSummaryBar.style.width = `${(count / ACHIEVEMENTS.length) * 100}%`;
    if (state.franchises > 0) {
      el.rankPill.hidden = false;
      el.rankCount.textContent = String(state.franchises);
    }

    const title = `${money(Math.floor(cash))} · FRYDAY`;
    if (title !== lastTitle) {
      lastTitle = title;
      document.title = title;
    }
  }

  function renderFranchise(now = Date.now()) {
    const goal = franchiseGoal();
    const ready = state.runEarned >= goal;
    el.starCount.textContent = String(state.franchises);
    el.franchiseCard.classList.toggle("ready", ready);
    el.franchiseName.textContent = LOCATION_NAMES[Math.min(state.franchises, LOCATION_NAMES.length - 1)];
    el.franchiseDesc.textContent = ready
      ? "The books are healthy. Reset this shift and open a new location with a permanent boost."
      : `Bank ${money(goal)} this shift to unlock location #${state.franchises + 2}. Badges stay forever.`;
    el.franchiseBar.style.width = `${Math.min(100, (state.runEarned / goal) * 100)}%`;
    el.franchiseProgress.textContent = `${money(Math.floor(state.runEarned))} / ${money(goal)}`;
    el.franchiseBtn.disabled = !ready;
    el.franchiseBtn.textContent = ready ? `Open #${state.franchises + 2}` : "Locked";
    el.shiftBadge.textContent = `SHIFT ${String(state.franchises + 1).padStart(2, "0")}`;
    el.sideSub.textContent = state.franchises > 0
      ? `Location ${state.franchises + 1}: ${LOCATION_NAMES[Math.min(state.franchises, LOCATION_NAMES.length - 1)]}. Your permanent bonus is +${Math.round(state.franchises * 35)}%.`
      : "Spend tips on the line. Every upgrade makes the next rush a little easier.";
    el.franchiseBonusPreview.textContent = `+${Math.round((state.franchises + 1) * 35)}%`;
    el.franchiseNextPreview.textContent = `Shift ${String(state.franchises + 2).padStart(2, "0")}`;
    el.franchiseModalText.textContent = `You have banked ${money(state.runEarned)} this shift. Opening the next location resets cash, stock, and kitchen upgrades, keeps every badge, and adds a permanent +${Math.round((state.franchises + 1) * 35)}% to taps, auto-grill, and tickets.`;
  }

  function renderUpgrades() {
    el.upgradeList.innerHTML = UPGRADES.map((definition) => {
      const level = state.upgrades[definition.id] || 0;
      const unlocked = definition.unlock(state);
      const cost = upgradeCost(definition);
      const lockedLabel = unlocked ? "" : definition.unlockShort;
      return `<button class="upgrade-card${unlocked ? "" : " locked"}" type="button" data-upgrade="${definition.id}" aria-label="${escapeHTML(definition.name)}${unlocked ? `, upgrade for ${money(cost)}` : `, locked until ${escapeHTML(lockedLabel)}`}">
        <span class="upgrade-icon icon-${definition.tone}">${definition.icon}</span>
        <span class="upgrade-copy">
          <span class="upgrade-title-line">
            <span class="upgrade-title">${escapeHTML(definition.name)}</span>
            <span class="level-pill">${unlocked ? `LV ${level}` : "LOCKED"}</span>
          </span>
          <span class="upgrade-desc">${escapeHTML(definition.desc)}</span>
          <span class="upgrade-effect">${unlocked ? escapeHTML(definition.effect(level)) : escapeHTML(definition.unlockShort)}</span>
        </span>
        <span class="buy-box">
          <span class="buy-cost">${unlocked ? money(cost) : "🔒"}</span>
          <span class="buy-label">${unlocked ? "Buy" : "locked"}</span>
        </span>
      </button>`;
    }).join("");
    upgradeAffordability();
  }

  function upgradeAffordability() {
    el.upgradeList.querySelectorAll(".upgrade-card").forEach((card) => {
      const definition = UPGRADES.find((item) => item.id === card.dataset.upgrade);
      if (!definition) return;
      const locked = !definition.unlock(state);
      card.classList.toggle("cant-afford", !locked && state.cash < upgradeCost(definition));
      card.setAttribute("aria-disabled", String(locked));
    });
  }

  function checkUpgradeUnlocks() {
    UPGRADES.forEach((definition) => {
      if (definition.unlock(state) && !knownUnlocks.has(definition.id)) {
        knownUnlocks.add(definition.id);
        if (state.served > 0 || state.zoomiesUsed > 0) {
          toast("New upgrade unlocked", `${definition.name} is ready on the line.`, definition.icon);
          renderUpgrades();
          playUnlock();
        }
      }
    });
  }

  function buyUpgrade(id) {
    const definition = UPGRADES.find((item) => item.id === id);
    if (!definition) return;
    if (!definition.unlock(state)) {
      toast("Still locked", `${definition.name} unlocks after: ${definition.unlockShort}.`, "🔒");
      return;
    }
    const cost = upgradeCost(definition);
    if (state.cash < cost) {
      const card = el.upgradeList.querySelector(`[data-upgrade="${id}"]`);
      if (card) {
        card.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
          { duration: 180, easing: "ease-out" }
        );
      }
      toast("Not enough tips", `${money(cost - state.cash)} more to afford ${definition.name}.`, "💸");
      return;
    }
    state.cash -= cost;
    state.upgrades[id] += 1;
    bumpCash();
    renderUpgrades();
    renderUI();
    const nextCost = upgradeCost(definition);
    toast(`${definition.name} upgraded`, `Now level ${state.upgrades[id]} · next one costs ${money(nextCost)}.`, definition.icon);
    playUpgrade();
    checkAchievements();
    saveState();
  }

  function renderAchievements() {
    const count = Object.keys(state.achievements).length;
    el.achList.innerHTML = ACHIEVEMENTS.map((achievement) => {
      const unlocked = Boolean(state.achievements[achievement.id]);
      const [value, max] = achievement.progress(state);
      const percent = Math.max(0, Math.min(100, (value / max) * 100));
      return `<article class="ach-card${unlocked ? " unlocked" : ""}">
        <span class="ach-medal" aria-hidden="true">${achievement.icon}</span>
        <div class="ach-copy">
          <div class="ach-name">${escapeHTML(achievement.name)}</div>
          <div class="ach-desc">${escapeHTML(achievement.desc)}</div>
          <div class="ach-mini-track"><i style="width:${percent}%"></i></div>
        </div>
        <span class="ach-status">${unlocked ? "Earned" : `${Math.floor(percent)}%`}</span>
      </article>`;
    }).join("");
    el.achSummaryCount.textContent = String(count);
    el.achSummaryBar.style.width = `${(count / ACHIEVEMENTS.length) * 100}%`;
    el.achCount.textContent = String(count);
  }

  function checkAchievements() {
    let unlockedAny = false;
    ACHIEVEMENTS.forEach((achievement) => {
      if (!state.achievements[achievement.id] && achievement.test(state)) {
        state.achievements[achievement.id] = Date.now();
        unlockedAny = true;
        toast("Badge earned", achievement.name, achievement.icon, "achievement");
        confetti(12);
        playAchievement();
      }
    });
    if (unlockedAny) {
      if (activeTab === "achievements") renderAchievements();
      saveState();
    }
  }

  function doFranchise() {
    if (state.runEarned < franchiseGoal()) {
      closeModal(el.franchiseModal);
      toast("Not ready yet", "Keep serving until the franchise goal is filled.", "📒");
      return;
    }
    state.franchises += 1;
    state.cash = 0;
    state.patties = 0;
    state.heat = 0;
    state.runEarned = 0;
    state.runServed = 0;
    state.upgrades = { spatula: 0, grill: 0, sauce: 0, drivethru: 0, treats: 0 };
    state.zoomiesUntil = 0;
    state.zoomiesReadyAt = 0;
    state.orders = [];
    state.nextOrderAt = Date.now() + 6000;
    state.lastSeen = Date.now();
    knownUnlocks = new Set(UPGRADES.filter((item) => item.unlock(state)).map((item) => item.id));
    bodyZoom(false);
    seedOrders(2);
    lastOrderSignature = "";
    lastCash = -1;
    renderUpgrades();
    renderOrders();
    renderUI();
    renderAchievements();
    closeModal(el.franchiseModal);
    confetti(30, el.scene.getBoundingClientRect().width * 0.5, el.scene.getBoundingClientRect().height * 0.25);
    toast("New FRYDAY opened!", `Shift ${state.franchises + 1} is live. Permanent bonus: +${Math.round(state.franchises * 35)}%.`, "⭐", "achievement");
    playFranchise();
    checkAchievements();
    saveState();
    if (state.served === 1) {
      el.firstHint.classList.add("is-hidden");
    }
  }

  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (error) { /* no storage, no problem */ }
    state = freshState();
    offlineReport = null;
    knownUnlocks = new Set(UPGRADES.filter((item) => item.unlock(state)).map((item) => item.id));
    seedOrders(2);
    lastOrderSignature = "";
    lastCash = -1;
    lastTitle = "";
    seenOrders.clear();
    bodyZoom(false);
    activeTab = "upgrades";
    setTab("upgrades");
    closeAllModals();
    renderUpgrades();
    renderOrders();
    renderUI();
    renderAchievements();
    el.firstHint.classList.remove("is-hidden");
    el.rankPill.hidden = true;
    el.cashAmount.textContent = "0";
    toast("Fresh kitchen", "New shift, clean grill, same good dog.", "🧽");
    saveState();
  }

  function setTab(tab) {
    activeTab = tab;
    const achievements = tab === "achievements";
    el.tabUpgrades.classList.toggle("active", !achievements);
    el.tabAchievements.classList.toggle("active", achievements);
    el.tabUpgrades.setAttribute("aria-selected", String(!achievements));
    el.tabAchievements.setAttribute("aria-selected", String(achievements));
    el.upgradePanel.hidden = achievements;
    el.achievementPanel.hidden = !achievements;
    if (achievements) renderAchievements();
  }

  function openModal(layer) {
    if (!layer) return;
    modalReturnFocus = document.activeElement;
    layer.hidden = false;
    document.body.classList.add("modal-open");
    if (layer === el.franchiseModal) renderFranchise();
    const close = layer.querySelector(".modal-close");
    if (close) window.setTimeout(() => close.focus(), 20);
  }

  function closeModal(layer) {
    if (!layer) return;
    layer.hidden = true;
    if (![el.helpModal, el.franchiseModal, el.resetModal].some((item) => !item.hidden)) {
      document.body.classList.remove("modal-open");
    }
    if (modalReturnFocus && typeof modalReturnFocus.focus === "function") {
      modalReturnFocus.focus();
    }
    modalReturnFocus = null;
  }

  function closeAllModals() {
    [el.helpModal, el.franchiseModal, el.resetModal].forEach((layer) => { layer.hidden = true; });
    document.body.classList.remove("modal-open");
  }

  function toast(title, detail, icon = "⭐", variant = "") {
    const node = document.createElement("div");
    node.className = `toast ${variant}`.trim();
    node.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span><span class="toast-copy"><b>${escapeHTML(title)}</b><span>${escapeHTML(detail)}</span></span>`;
    el.toasts.appendChild(node);
    while (el.toasts.children.length > 2) el.toasts.firstElementChild.remove();
    window.setTimeout(() => {
      node.classList.add("is-out");
      window.setTimeout(() => node.remove(), 260);
    }, variant === "achievement" ? 4300 : 3400);
  }

  function applyOfflineProgress() {
    const elapsed = Math.max(0, (Date.now() - (Number(state.lastSeen) || Date.now())) / 1000);
    if (elapsed < 75) return;
    const rate = state.upgrades.grill * 0.65 * franchiseMultiplier();
    if (rate <= 0) return;
    const seconds = Math.min(elapsed, 4 * 60 * 60);
    const averageNeed = Math.max(4, 5 + Math.pow(state.runServed, 0.72) * 0.55);
    const averageTicket = averageNeed * (2.15 + Math.pow(state.runServed, 0.65) * 0.08) * tipMultiplier();
    const autoPatties = rate * seconds;
    const capacity = (seconds / orderInterval()) * 0.72;
    const served = Math.max(0, Math.min(autoPatties / averageNeed, capacity));
    const gain = Math.floor(served * averageTicket * 0.78);
    if (served < 0.5 || gain < 1) return;
    state.cash += gain;
    state.totalEarned += gain;
    state.runEarned += gain;
    state.totalPatties += autoPatties;
    state.served += Math.floor(served);
    state.runServed += Math.floor(served);
    offlineReport = { gain, served: Math.floor(served) };
  }

  function init() {
    state = loadState();
    applyOfflineProgress();
    seedOrders(state.orders.length ? state.orders.length : 2);
    if (state.orders.length > MAX_ORDERS) state.orders.length = MAX_ORDERS;
    knownUnlocks = new Set(UPGRADES.filter((item) => item.unlock(state)).map((item) => item.id));
    document.body.classList.toggle("muted", !state.sound);
    el.soundBtn.setAttribute("aria-label", state.sound ? "Mute sound" : "Enable sound");
    el.soundBtn.title = state.sound ? "Mute sound" : "Enable sound";
    if (state.franchises > 0) {
      el.rankPill.hidden = false;
      el.rankCount.textContent = String(state.franchises);
    }
    if (state.served > 0) el.firstHint.classList.add("is-hidden");
    renderUpgrades();
    renderOrders();
    renderAchievements();
    renderUI();
    bindEvents();
    if (offlineReport) {
      window.setTimeout(() => {
        toast("Welcome back", `Nugget kept the grill warm: +${money(offlineReport.gain)} from ${offlineReport.served} tickets.`, "🌙", "achievement");
        checkAchievements();
      }, 550);
    }
    window.setTimeout(checkAchievements, 400);
    requestAnimationFrame(gameLoop);
    window.setInterval(saveState, 6000);
  }

  function bindEvents() {
    el.grillBtn.addEventListener("click", cook);
    el.petBtn.addEventListener("click", activateZoomies);
    el.zoomBtn.addEventListener("click", activateZoomies);

    el.upgradeList.addEventListener("click", (event) => {
      const card = event.target.closest(".upgrade-card");
      if (card) buyUpgrade(card.dataset.upgrade);
    });

    el.tabUpgrades.addEventListener("click", () => setTab("upgrades"));
    el.tabAchievements.addEventListener("click", () => setTab("achievements"));

    el.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      document.body.classList.toggle("muted", !state.sound);
      el.soundBtn.setAttribute("aria-label", state.sound ? "Mute sound" : "Enable sound");
      el.soundBtn.title = state.sound ? "Mute sound" : "Enable sound";
      if (state.sound) playUnlock();
      saveState();
    });

    el.helpBtn.addEventListener("click", () => openModal(el.helpModal));
    el.resetBtn.addEventListener("click", () => {
      closeModal(el.helpModal);
      openModal(el.resetModal);
    });
    el.confirmReset.addEventListener("click", resetGame);
    el.confirmFranchise.addEventListener("click", doFranchise);
    el.franchiseBtn.addEventListener("click", () => {
      if (state.runEarned >= franchiseGoal()) openModal(el.franchiseModal);
    });

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const layer = document.getElementById(button.dataset.close);
        closeModal(layer);
      });
    });
    [el.helpModal, el.franchiseModal, el.resetModal].forEach((layer) => {
      layer.addEventListener("click", (event) => {
        if (event.target === layer) closeModal(layer);
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const open = [el.helpModal, el.franchiseModal, el.resetModal].find((layer) => !layer.hidden);
        if (open) closeModal(open);
        return;
      }
      const modalOpen = [el.helpModal, el.franchiseModal, el.resetModal].some((layer) => !layer.hidden);
      if (modalOpen) return;
      const tag = (event.target && event.target.tagName) || "";
      if (event.code === "Space" && !event.repeat && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        event.preventDefault();
        cook(event);
      }
      if ((event.key === "z" || event.key === "Z") && !event.repeat && tag !== "INPUT" && tag !== "TEXTAREA") {
        event.preventDefault();
        activateZoomies();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) saveState();
    });
    window.addEventListener("beforeunload", saveState);
    window.addEventListener("blur", () => saveState());
  }

  function gameLoop(timestamp) {
    const now = Date.now();
    const dt = Math.min(0.2, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;

    if (state.heat > 0) {
      state.heat = Math.max(0, state.heat - 5.15 * dt);
    }

    const auto = autoRate();
    if (auto > 0) {
      state.patties += auto * dt;
      state.totalPatties += auto * dt;
      processPatties();
    }

    if (now >= state.nextOrderAt) {
      if (state.orders.length < MAX_ORDERS) {
        state.orders.push(makeOrder());
        lastOrderSignature = "";
        renderOrders();
      }
      state.nextOrderAt = now + orderInterval() * 1000;
    }

    const zNow = zoomActive(now);
    if (zNow !== isZooming) {
      bodyZoom(zNow);
      if (!zNow) {
        showPetBubble("phew!");
      }
    }

    uiClock += dt;
    achClock += dt;
    saveClock += dt;
    if (uiClock >= 0.085) {
      uiClock = 0;
      renderUI(now);
    }
    if (achClock >= 0.5) {
      achClock = 0;
      checkAchievements();
    }
    requestAnimationFrame(gameLoop);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
  }

  function formatPower(value) {
    if (!Number.isFinite(value)) return "0";
    if (value < 10 && Math.abs(value - Math.round(value)) > 0.02) return value.toFixed(1);
    return formatNumber(value);
  }

  function formatNumber(value) {
    const number = Math.max(0, Number(value) || 0);
    if (number < 1000) {
      if (number < 10 && Math.abs(number - Math.round(number)) > 0.01) return number.toFixed(1);
      return Math.floor(number).toLocaleString("en-US");
    }
    if (number < 1e6) {
      const scaled = number / 1000;
      return `${scaled.toFixed(scaled < 10 ? 1 : 0).replace(/\.0$/, "")}K`;
    }
    if (number < 1e9) {
      const scaled = number / 1e6;
      return `${scaled.toFixed(scaled < 10 ? 1 : 0).replace(/\.0$/, "")}M`;
    }
    const scaled = number / 1e9;
    return `${scaled.toFixed(scaled < 10 ? 1 : 0).replace(/\.0$/, "")}B`;
  }

  function money(value) {
    return `$${formatNumber(value)}`;
  }

  // Tiny WebAudio sound kit — no downloads, started on the first gesture.
  function getAudio() {
    if (!state.sound) return null;
    try {
      if (!audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        audioCtx = new AudioCtor();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (error) {
      return null;
    }
  }

  function tone(frequency, duration, type = "sine", volume = 0.035, endFrequency = null, delay = 0) {
    const context = getAudio();
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency && endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function playTap() {
    if (!state.sound) return;
    tone(155 + Math.random() * 45, 0.065, "triangle", 0.025, 92);
    tone(420 + Math.random() * 50, 0.035, "sine", 0.008, 300);
  }

  function playServe() {
    if (!state.sound) return;
    tone(523.25, 0.08, "triangle", 0.026, 523, 0);
    tone(659.25, 0.1, "triangle", 0.022, 659, 0.055);
    tone(783.99, 0.13, "sine", 0.02, 784, 0.11);
  }

  function playUpgrade() {
    if (!state.sound) return;
    tone(330, 0.09, "triangle", 0.027, 440, 0);
    tone(554, 0.12, "sine", 0.025, 660, 0.075);
    tone(880, 0.14, "sine", 0.018, 880, 0.15);
  }

  function playUnlock() {
    if (!state.sound) return;
    tone(660, 0.08, "sine", 0.02, 880, 0);
    tone(990, 0.17, "sine", 0.015, 990, 0.08);
  }

  function playAchievement() {
    if (!state.sound) return;
    tone(523.25, 0.1, "triangle", 0.024, 523, 0);
    tone(659.25, 0.1, "triangle", 0.022, 659, 0.09);
    tone(783.99, 0.12, "triangle", 0.02, 784, 0.18);
    tone(1046.5, 0.22, "sine", 0.018, 1046, 0.28);
  }

  function playZoom() {
    if (!state.sound) return;
    tone(360, 0.1, "square", 0.018, 760, 0);
    tone(760, 0.16, "triangle", 0.022, 1200, 0.08);
    tone(240, 0.11, "triangle", 0.02, 160, 0.18);
  }

  function playRest() {
    if (!state.sound) return;
    tone(260, 0.13, "sine", 0.016, 220);
  }

  function playFranchise() {
    if (!state.sound) return;
    [523, 659, 784, 1046, 1318].forEach((note, index) => tone(note, 0.2, "triangle", 0.02, note, index * 0.1));
  }

  init();
})();
