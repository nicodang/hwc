/*
 * Happy Wednesday Club — animation en boucle de 56 secondes.
 *
 * Toute la chronologie est décrite ci-dessous en millisecondes, sur un cadre de 1920 × 1080
 * mis à l'échelle de l'écran. Les mouvements sont pilotés par la Web Animations API et
 * partagent la même horloge : tout reste synchronisé et reboucle sans couture.
 *
 * Touches : Espace pause · ← → ±1 s · F plein écran · R reprendre au début · D réalisation.
 */

(() => {
  "use strict";

  const T = 56000;

  // Deux mises en page : paysage 1920 × 1080 (écran de salon) et portrait 1080 × 1920
  // (smartphone, totem vertical). Même chronologie, positions différentes.
  const PORTRAIT = window.matchMedia("(orientation: portrait)").matches;
  const W = PORTRAIT ? 1080 : 1920;
  const H = PORTRAIT ? 1920 : 1080;
  document.body.classList.add(PORTRAIT ? "portrait" : "landscape");
  window.matchMedia("(orientation: portrait)").addEventListener("change", () => window.location.reload());

  // Coordonnées écrites pour le paysage, converties pour le portrait (étincelles).
  const sx = (x) => (PORTRAIT ? Math.round((x * 1080) / 1920) : x);
  const sy = (y) => (PORTRAIT ? Math.round((y * 1920) / 1080) : y);

  const POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const IN = "cubic-bezier(0.55, 0, 0.8, 0.2)";
  const LINEAR = "linear";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const animations = [];

  /**
   * Crée une animation de T ms en boucle à partir d'images clés horodatées.
   * frames : [{ t: ms, easing?, transform?, opacity? }, ...]
   * Une valeur omise est interpolée entre les images voisines qui la précisent.
   * Les premières et dernières images sont prolongées jusqu'aux bornes (maintien).
   * `cut: true` : l'image précédente est maintenue jusqu'à cette image (saut, pas de glissé).
   */
  function track(el, frames) {
    const sorted = [...frames].sort((a, b) => a.t - b.t);
    if (sorted[0].t > 0) sorted.unshift({ ...sorted[0], t: 0 });
    if (sorted[sorted.length - 1].t < T) sorted.push({ ...sorted[sorted.length - 1], t: T });

    const expanded = [];
    sorted.forEach((frame, i) => {
      if (frame.cut && i > 0) expanded.push({ ...sorted[i - 1], t: frame.t - 1, cut: false });
      expanded.push(frame);
    });

    const keyframes = expanded.map(({ t, easing = OUT, cut, ...props }) => ({
      offset: Math.min(1, Math.max(0, t / T)),
      easing,
      ...props,
    }));

    const animation = el.animate(keyframes, { duration: T, iterations: Infinity, fill: "both" });
    animations.push(animation);
    return animation;
  }

  const hidden = (transform) => ({ opacity: 0, transform });
  const shown = (transform = "none") => ({ opacity: 1, transform });

  /** Entrée puis sortie d'un élément, avec maintien entre les deux. */
  function appear(el, { at, from, dur = 600, ease = POP, to = "none", until, out, outDur = 500 }) {
    const frames = [
      { t: at, ...hidden(from) },
      { t: at, ...hidden(from), easing: ease },
      { t: at + dur, ...shown(to) },
    ];
    if (until != null) {
      frames.push({ t: until, ...shown(to), easing: IN });
      frames.push({ t: until + outDur, ...hidden(out ?? from) });
    }
    return track(el, frames);
  }

  // ---------------------------------------------------------------------------
  // Préparation du DOM
  // ---------------------------------------------------------------------------

  $$(".title__word").forEach((word) => {
    const text = word.dataset.text || "";
    word.textContent = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "title__ch" + (ch === " " ? " title__ch--space" : "");
      span.textContent = ch === " " ? "\u00a0" : ch;
      word.appendChild(span);
    }
  });

  const sparkleColors = ["#ed2124", "#a98bea", "#58b6ae", "#ee8fa6"];
  function sparkle(x, y, at, size = 1) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("class", "sparkle");
    svg.style.left = `${x}px`;
    svg.style.top = `${y}px`;
    svg.innerHTML = `<path d="M20 2 C22 14 26 18 38 20 C26 22 22 26 20 38 C18 26 14 22 2 20 C14 18 18 14 20 2Z" fill="${
      sparkleColors[Math.floor(Math.random() * sparkleColors.length)]
    }" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`;
    $("#sparkles").appendChild(svg);
    track(svg, [
      { t: at, ...hidden("scale(0) rotate(0deg)"), easing: POP },
      { t: at + 320, ...shown(`scale(${size}) rotate(60deg)`), easing: IN },
      { t: at + 820, ...hidden(`scale(0) rotate(140deg)`) },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Chronologie
  // ---------------------------------------------------------------------------

  // Skyline posée au sol : apparaît à la fin du rêve, repart juste avant la boucle.
  track($("#skyline"), [
    { t: 0, transform: "translateY(720px)" },
    { t: 5900, transform: "translateY(720px)", easing: OUT },
    { t: 7000, transform: "translateY(0)" },
    { t: 55200, transform: "translateY(0)", easing: IN },
    { t: 56000, transform: "translateY(720px)" },
  ]);

  // --- Scène 1 · Le rêve (0 → 6,2 s) --------------------------------------------

  const boy = $("#boy");
  track(
    boy,
    PORTRAIT
      ? [
          { t: 300, transform: "translate(-600px, 320px) rotate(-22deg)", easing: OUT },
          { t: 1150, transform: "translate(0, 0) rotate(0deg)" },
          { t: 5500, transform: "translate(0, 0) rotate(0deg)", easing: IN },
          { t: 6200, transform: "translate(-700px, 520px) rotate(-18deg)" },
          // Scène 3 : à droite.
          { t: 13400, transform: "translate(600px, 620px) scale(0.85)", easing: OUT, cut: true },
          { t: 14200, transform: "translate(600px, 0) scale(0.85)" },
          { t: 18500, transform: "translate(600px, 0) scale(0.85)", easing: IN },
          { t: 19100, transform: "translate(600px, 620px) scale(0.85)" },
          // Scène 5 : en bas à gauche (absent pendant les activités, faute de place).
          { t: 35000, transform: "translate(-80px, 620px) scale(0.8)", easing: OUT, cut: true },
          { t: 35800, transform: "translate(-80px, 0) scale(0.8)" },
          { t: 39900, transform: "translate(-80px, 0) scale(0.8)", easing: IN },
          { t: 40500, transform: "translate(-80px, 620px) scale(0.8)" },
          // Scène 6 : sous le QR code.
          { t: 41400, transform: "translate(60px, 620px) scale(0.7)", easing: OUT, cut: true },
          { t: 42200, transform: "translate(60px, 0) scale(0.7)" },
          { t: 54500, transform: "translate(60px, 0) scale(0.7)", easing: IN },
          { t: 55100, transform: "translate(60px, 620px) scale(0.7)" },
        ]
      : [
          // Entrée en glissade, assis avec son livre.
          { t: 300, transform: "translate(-700px, 320px) rotate(-22deg)", easing: OUT },
          { t: 1150, transform: "translate(0, 0) rotate(0deg)" },
          { t: 5500, transform: "translate(0, 0) rotate(0deg)", easing: IN },
          { t: 6200, transform: "translate(-760px, 520px) rotate(-18deg)" },
          // Scène 3 : à droite de l'écran.
          { t: 13400, transform: "translate(1360px, 620px) scale(0.85)", easing: OUT, cut: true },
          { t: 14200, transform: "translate(1360px, 0) scale(0.85)" },
          { t: 18500, transform: "translate(1360px, 0) scale(0.85)", easing: IN },
          { t: 19100, transform: "translate(1360px, 620px) scale(0.85)" },
          // Scène 4 : petit dans le coin, puis scène 5 : en bas à gauche.
          { t: 19600, transform: "translate(-280px, 620px) scale(0.7)", easing: OUT, cut: true },
          { t: 20400, transform: "translate(-280px, 0) scale(0.7)" },
          { t: 35000, transform: "translate(-280px, 0) scale(0.7)", easing: POP },
          { t: 35600, transform: "translate(-250px, 0) scale(0.8)" },
          { t: 39900, transform: "translate(-250px, 0) scale(0.8)", easing: IN },
          { t: 40500, transform: "translate(-250px, 620px) scale(0.8)" },
          // Scène 6 : près du QR code.
          { t: 41400, transform: "translate(880px, 620px) scale(0.75)", easing: OUT, cut: true },
          { t: 42200, transform: "translate(880px, 0) scale(0.75)" },
          { t: 54500, transform: "translate(880px, 0) scale(0.75)", easing: IN },
          { t: 55100, transform: "translate(880px, 620px) scale(0.75)" },
        ],
  );

  // Petites bulles de pensée, puis la grande bulle avec Londres dedans.
  const dots = [$(".bubble__dot--3"), $(".bubble__dot--2"), $(".bubble__dot--1")];
  dots.forEach((dot, i) => {
    track(dot, [
      { t: 1400 + i * 260, transform: "scale(0)", easing: POP },
      { t: 1750 + i * 260, transform: "scale(1)" },
      { t: 5400, transform: "scale(1)", easing: IN },
      { t: 5650, transform: "scale(0)" },
    ]);
  });

  const cloud = $(".bubble__cloud");
  cloud.style.transformOrigin = "8% 95%";
  track(cloud, [
    { t: 2150, ...hidden("scale(0) rotate(-10deg)"), easing: POP },
    { t: 2800, ...shown("scale(1) rotate(0deg)") },
    { t: 5400, ...shown("scale(1) rotate(0deg)"), easing: "cubic-bezier(0.4, 0, 1, 1)" },
    { t: 5600, ...shown("scale(1.12) rotate(2deg)"), easing: IN },
    { t: 5850, ...hidden("scale(0.2) rotate(6deg)") },
  ]);

  track($(".bubble__eye-ben"), [
    { t: 2700, transform: "translateY(380px)", easing: OUT },
    { t: 3500, transform: "translateY(0)" },
  ]);
  track($(".bubble__bridge"), [
    { t: 2900, transform: "translateY(260px)", easing: OUT },
    { t: 3700, transform: "translateY(0)" },
  ]);
  appear($(".bubble__flag"), { at: 3600, from: "scale(0) rotate(-25deg)", dur: 550 });

  // --- Scène 2 · Le titre (6,3 → 12,8 s) ------------------------------------------

  const LOGO_CORNER = PORTRAIT
    ? "translate(-430px, -650px) rotate(0deg) scale(0.42)"
    : "translate(-810px, -320px) rotate(0deg) scale(0.42)";
  track($("#logo"), [
    { t: 6300, ...hidden("translate(0, -900px) rotate(-30deg) scale(0.6)"), easing: POP },
    { t: 7150, ...shown("translate(0, 0) rotate(0deg) scale(1)") },
    { t: 8100, ...shown("translate(0, 0) rotate(0deg) scale(1)"), easing: OUT },
    { t: 8800, ...shown(LOGO_CORNER) },
    { t: 54900, ...shown(LOGO_CORNER), easing: IN },
    { t: 55500, ...hidden(LOGO_CORNER.replace("scale(0.42)", "scale(0.2)")) },
  ]);

  const wordStarts = [8600, 9150, 9800];
  $$(".title__word").forEach((word, w) => {
    $$(".title__ch", word).forEach((ch, i) => {
      const at = wordStarts[w] + i * 38;
      track(ch, [
        { t: at, ...hidden("translateY(140px) rotate(-14deg) scale(0.5)"), easing: POP },
        { t: at + 560, ...shown("translateY(0) rotate(0deg) scale(1)") },
      ]);
    });
  });

  track($("#title"), [
    { t: 12300, ...shown("scale(1)"), easing: IN },
    { t: 12800, ...hidden("scale(1.3)") },
  ]);

  appear($("#tagline"), {
    at: 10500,
    from: "translateY(90px) scale(0.8)",
    dur: 650,
    until: 12300,
    out: "translateY(-50px)",
  });

  // La fillette traverse l'écran en courant avec son drapeau.
  const girl = $("#girl");
  track(
    girl,
    PORTRAIT
      ? [
          { t: 0, transform: "translate(-700px, 0) scale(0.75)" },
          { t: 9000, transform: "translate(-700px, 0) scale(0.75)", easing: LINEAR },
          { t: 12700, transform: "translate(1300px, 0) scale(0.75)" },
          // Scène 5 : surgit en bas à droite, petit saut de joie.
          { t: 35000, transform: "translate(620px, 640px) scale(0.75)", easing: POP, cut: true },
          { t: 35800, transform: "translate(620px, 0) scale(0.75)" },
          { t: 36400, transform: "translate(620px, 0) scale(0.75)", easing: OUT },
          { t: 36650, transform: "translate(620px, -90px) scale(0.75)", easing: IN },
          { t: 36900, transform: "translate(620px, 0) scale(0.75)" },
          { t: 39900, transform: "translate(620px, 0) scale(0.75)", easing: IN },
          { t: 40500, transform: "translate(620px, 640px) scale(0.75)" },
          // Scène 6 : sous le QR code.
          { t: 41600, transform: "translate(620px, 640px) scale(0.7)", easing: POP, cut: true },
          { t: 42400, transform: "translate(620px, 0) scale(0.7)" },
          { t: 54500, transform: "translate(620px, 0) scale(0.7)", easing: IN },
          { t: 55100, transform: "translate(620px, 640px) scale(0.7)" },
        ]
      : [
          { t: 0, transform: "translate(-700px, 0) scale(0.85)" },
          { t: 9000, transform: "translate(-700px, 0) scale(0.85)", easing: LINEAR },
          { t: 12700, transform: "translate(2050px, 0) scale(0.85)" },
          // Scène 4 : petite dans le coin droit, puis bondit à sa place pour le déjeuner.
          { t: 20600, transform: "translate(1604px, 640px) scale(0.58)", easing: POP, cut: true },
          { t: 21400, transform: "translate(1604px, 0) scale(0.58)" },
          { t: 35000, transform: "translate(1604px, 0) scale(0.58)", easing: POP },
          { t: 35600, transform: "translate(1500px, 0) scale(0.75)" },
          // Petit saut de joie à l'heure du déjeuner.
          { t: 35800, transform: "translate(1500px, 0) scale(0.75)", easing: OUT },
          { t: 36050, transform: "translate(1500px, -90px) scale(0.75)", easing: IN },
          { t: 36300, transform: "translate(1500px, 0) scale(0.75)" },
          { t: 39900, transform: "translate(1500px, 0) scale(0.75)", easing: IN },
          { t: 40500, transform: "translate(1500px, 640px) scale(0.75)" },
          // Scène 6 : à droite, sous le QR code.
          { t: 41600, transform: "translate(1440px, 640px) scale(0.8)", easing: POP, cut: true },
          { t: 42400, transform: "translate(1440px, 0) scale(0.8)" },
          { t: 54500, transform: "translate(1440px, 0) scale(0.8)", easing: IN },
          { t: 55100, transform: "translate(1440px, 640px) scale(0.8)" },
        ],
  );

  // Étincelles autour du titre.
  [
    [380, 240, 8700],
    [1480, 230, 8900],
    [300, 560, 9300],
    [1560, 520, 9450],
    [500, 700, 9900],
    [1400, 700, 10050],
    [900, 180, 10300],
    [1200, 860, 10500],
  ].forEach(([x, y, at]) => sparkle(sx(x), sy(y), at, 1 + Math.random() * 0.5));

  // --- Scène 3 · L'offre (13 → 19,1 s) ---------------------------------------------

  appear($(".offer__headline"), {
    at: 13000,
    from: "scale(0.6) rotate(-6deg)",
    dur: 700,
    until: 18600,
    out: "scale(0.85)",
  });

  $$(".offer__pill").forEach((pill, i) => {
    appear(pill, {
      at: 14100 + i * 400,
      from: "translateY(140px) scale(0.5)",
      dur: 600,
      until: 18600,
      out: "translateY(80px) scale(0.8)",
    });
  });

  appear($(".offer__line"), {
    at: 15700,
    from: "translateY(70px)",
    dur: 600,
    ease: OUT,
    until: 18600,
    out: "translateY(60px)",
  });

  // --- Scène 4 · Les activités (19,3 → 35,2 s) : elles arrivent une par une et restent ---

  const ACT_START = 19900;
  const ACT_EVERY = 2600;

  appear($(".programme__header"), {
    at: 19300,
    from: "translateY(-220px)",
    dur: 650,
    until: 34700,
    out: "translateY(-220px)",
  });

  $$(".programme__card").forEach((card, i) => {
    const tilt = i % 2 === 0 ? -6 : 6;
    appear(card, {
      at: ACT_START + i * ACT_EVERY,
      from: `translateY(260px) rotate(${tilt}deg) scale(0.5)`,
      dur: 750,
      until: 34550 + i * 110,
      outDur: 450,
      out: `translateY(-900px) rotate(${tilt / 2}deg)`,
    });
  });

  // --- Scène 5 · Le déjeuner (35,4 → 40,5 s) ---------------------------------------

  appear($(".lunch__header"), {
    at: 35400,
    from: "translateY(-220px) scale(0.7)",
    dur: 650,
    until: 40000,
    out: "translateY(-220px)",
  });

  $$(".lunch__item").forEach((item, i) => {
    appear(item, {
      at: 36100 + i * 500,
      from: "translateX(-500px) rotate(-4deg)",
      dur: 650,
      until: 40000,
      out: "translateX(-500px)",
    });
  });

  appear($(".lunch__food"), {
    at: 36300,
    from: "translateY(300px) rotate(15deg) scale(0.4)",
    dur: 800,
    until: 40000,
    out: "translateY(300px) scale(0.6)",
  });

  // --- Scène 6 · Inscriptions et stand (40,9 → 55,1 s) — le QR code reste 13,5 s -------------------------------

  appear($(".cta__register"), {
    at: 40900,
    from: "scale(1.9) rotate(-10deg)",
    to: "scale(1) rotate(-2deg)",
    dur: 550,
    until: 54300,
    out: "scale(0.8) rotate(-2deg)",
  });

  appear($(".cta__url"), {
    at: 41500,
    from: "translateY(60px)",
    dur: 600,
    until: 54300,
    out: "translateY(40px)",
  });

  appear($(".cta__qr"), {
    at: 41200,
    from: "translate(320px, 0) rotate(12deg) scale(0.6)",
    dur: 750,
    until: 54700,
    out: "translate(200px, 0) rotate(6deg) scale(0.7)",
  });

  appear($(".cta__partners"), {
    at: 42000,
    from: "translateY(140px)",
    dur: 650,
    ease: OUT,
    until: 54300,
    out: "translateY(100px)",
  });

  appear($(".cta__stand"), {
    at: 43200,
    from: "translateY(160px) scale(0.6)",
    dur: 650,
    until: 54300,
    out: "translateY(120px) scale(0.8)",
  });

  appear($(".cta__salon"), {
    at: 43800,
    from: "translateY(50px)",
    dur: 550,
    ease: OUT,
    until: 54300,
    out: "translateY(40px)",
  });

  [
    [200, 110, 41050],
    [1230, 120, 41200],
    [1180, 640, 42300],
    [1810, 640, 42500],
    [120, 700, 43400],
    [1300, 120, 44000],
    [1240, 760, 45400],
    [60, 560, 46600],
  ].forEach(([x, y, at]) => sparkle(sx(x), sy(y), at, 1 + Math.random() * 0.5));

  // ---------------------------------------------------------------------------
  // Lecture : horloge commune, mise à l'échelle, raccourcis
  // ---------------------------------------------------------------------------

  const start = document.timeline.currentTime;
  animations.forEach((a) => {
    a.startTime = start;
  });
  document.getElementById("stage").style.visibility = "visible";

  const stage = $("#stage");
  function fit() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `scale(${scale})`;
  }
  fit();
  window.addEventListener("resize", fit);

  let paused = false;
  const now = () => animations[0].currentTime % T;

  function setTime(ms) {
    const t = ((ms % T) + T) % T;
    animations.forEach((a) => {
      a.currentTime = t;
    });
  }

  function togglePause() {
    paused = !paused;
    document.getAnimations().forEach((a) => (paused ? a.pause() : a.play()));
    updateHud();
  }

  const hud = $("#hud");
  const sceneNames = [
    [0, "1 · Le rêve"],
    [6300, "2 · Le titre"],
    [13000, "3 · L’offre"],
    [19300, "4 · Les activités"],
    [35400, "5 · Le déjeuner"],
    [40900, "6 · Inscriptions et stand"],
    [55100, "→ boucle"],
  ];

  function updateHud() {
    if (hud.hidden) return;
    const t = now();
    const scene = sceneNames.filter(([at]) => t >= at).pop()[1];
    hud.textContent = `${(t / 1000).toFixed(1).padStart(4)} s / 56 s   ${scene}${paused ? "   ⏸" : ""}\nEspace pause · ← → ±1 s · F plein écran · R début · D masquer`;
  }

  function hudLoop() {
    updateHud();
    requestAnimationFrame(hudLoop);
  }
  hudLoop();

  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case " ":
        event.preventDefault();
        togglePause();
        break;
      case "ArrowRight":
        event.preventDefault();
        setTime(now() + 1000);
        break;
      case "ArrowLeft":
        event.preventDefault();
        setTime(now() - 1000);
        break;
      case "r":
      case "R":
        setTime(0);
        break;
      case "d":
      case "D":
        hud.hidden = !hud.hidden;
        updateHud();
        break;
      case "f":
      case "F":
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
        break;
      default:
    }
  });

  // Curseur masqué après deux secondes sans mouvement.
  let cursorTimer = 0;
  const hideCursor = () => document.body.classList.add("cursor-hidden");
  cursorTimer = window.setTimeout(hideCursor, 2000);
  window.addEventListener("pointermove", () => {
    document.body.classList.remove("cursor-hidden");
    window.clearTimeout(cursorTimer);
    cursorTimer = window.setTimeout(hideCursor, 2000);
  });

  // Écran maintenu allumé quand le navigateur le permet.
  if ("wakeLock" in navigator) {
    const lock = () => navigator.wakeLock.request("screen").catch(() => {});
    lock();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") lock();
    });
  }

  // Petite API pour vérifier l'animation depuis la console.
  window.hwc = { seek: setTime, pause: () => !paused && togglePause(), play: () => paused && togglePause(), now };
})();
