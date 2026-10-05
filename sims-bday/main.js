/* =========================================================
   НАСТРОЙКИ ВЕЧЕРИНКИ — поменяй здесь
   ========================================================= */
const PARTY = {
  // Дата и время начала (часовой пояс +03:00 — Москва)
  start: "2026-11-28T17:00:00+03:00",
  // Сколько часов длится (для файла календаря)
  durationHours: 5,
  // С какого момента «монетка» начинает ползти по прогресс-бару
  inviteSent: "2026-10-05T00:00:00+03:00",
  place: "Адрес пришлю позже",
  // Ссылка на карту (Яндекс/Google). Пусто — адрес без ссылки
  mapUrl: "",
};

/* Истории для значков рубежей. Подставь свои. */
const MILESTONES = [
  {
    group: "Первые разы",
    items: [
      { img: "m-heart", title: "Первая любовь", text: "Рубеж получен. Подробности выдаются только лично и только после второго куска торта." },
      { img: "m-career", title: "Первая работа", text: "Персонаж устроился на работу и с тех пор ни разу не забывал про кофе." },
    ],
  },
  {
    group: "Жизнь",
    items: [
      { img: "m-pets", title: "Завела питомца", text: "Шкала «Веселье» с тех пор не опускается ниже зелёного." },
      { img: "m-fame", title: "Звезда вечеринок", text: "Навык «Харизма» прокачан. Проверим 30-го уровня на практике." },
    ],
  },
  {
    group: "Общение",
    items: [
      { img: "m-love", title: "Лучшие друзья", text: "Ты — одна из причин, почему этот рубеж открыт. Спасибо!" },
      { img: "m-friends", title: "Душа компании", text: "Отношения со всеми гостями — «Близкие друзья». Приходи укреплять." },
      { img: "m-hearts", title: "Много любви", text: "Мудлет «Очень счастлива» обеспечен, если ты придёшь." },
    ],
  },
];

const LOADER_PHRASES = [
  "Надуваем шарики…", "Ретикулируем сплайны…", "Прячем возраст…",
  "Зажигаем 30 свечей…", "Ищем лестницу из бассейна…", "Уговариваем собачку…",
];

/* ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGSAP = typeof window.gsap !== "undefined";
const startDate = new Date(PARTY.start);
const endDate = new Date(startDate.getTime() + PARTY.durationHours * 3600e3);

/* ---------- Факты: дата / время / место ---------- */
(function fillFacts() {
  const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "short", timeZone: "Europe/Moscow" });
  const timeFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  $("#factDate").textContent = dateFmt.format(startDate);
  $("#factTime").textContent = timeFmt.format(startDate);
  const place = $("#factPlace");
  place.textContent = PARTY.place;
  if (PARTY.mapUrl) place.href = PARTY.mapUrl;
  else place.removeAttribute("href");
})();

/* ---------- Звук (WebAudio, по умолчанию выключен) ---------- */
const Sound = {
  on: false,
  ctx: null,
  toggle() {
    this.on = !this.on;
    const btn = $("#soundBtn");
    btn.setAttribute("aria-pressed", String(this.on));
    btn.setAttribute("aria-label", this.on ? "Выключить звук" : "Включить звук");
    if (this.on) { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); this.ctx.resume(); this.play("pling"); }
  },
  tone(freq, t0, dur, type = "sine", vol = 0.12) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  },
  play(name) {
    if (!this.on || !this.ctx) return;
    const seq = {
      pling: [[880, 0, .25], [1320, .08, .35]],
      pop: [[620, 0, .12, "triangle"]],
      goal: [[660, 0, .2], [880, .1, .2], [1175, .2, .45]],
      fanfare: [[523, 0, .25], [659, .12, .25], [784, .24, .25], [1047, .36, .7]],
      age: [[400, 0, .3, "triangle"], [600, .2, .3, "triangle"], [500, .45, .5, "triangle"]],
    }[name] || [];
    seq.forEach(([f, t, d, type]) => this.tone(f, t, d, type));
  },
};
$("#soundBtn").addEventListener("click", () => Sound.toggle());

/* ---------- Рубежи ---------- */
const groupsEl = $("#groups");
MILESTONES.forEach((g, gi) => {
  const group = document.createElement("div");
  group.className = "group";
  group.innerHTML = `<div class="group__head">${g.group}</div><div class="group__body"></div>`;
  const body = group.querySelector(".group__body");
  g.items.forEach((m) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "badge";
    b.setAttribute("aria-label", m.title);
    b.innerHTML = `<img src="assets/${m.img}.webp" alt="" width="184" height="184" loading="lazy">`;
    b.addEventListener("click", (e) => { e.stopPropagation(); openPop(b, { img: `assets/${m.img}.webp`, kicker: g.group, title: m.title, text: m.text }); });
    b.addEventListener("mouseenter", () => { if (matchMedia("(hover:hover)").matches) openPop(b, { img: `assets/${m.img}.webp`, kicker: g.group, title: m.title, text: m.text }); });
    b.addEventListener("mouseleave", () => { if (matchMedia("(hover:hover)").matches) closePop(); });
    body.appendChild(b);
  });
  const more = document.createElement("button");
  more.type = "button"; more.className = "more"; more.setAttribute("aria-label", `Ещё рубежи: ${g.group}`);
  more.addEventListener("click", (e) => {
    e.stopPropagation();
    openPop(more, { img: "assets/plumbob.webp", kicker: g.group, title: "Ещё не открыто", text: gi === 2 ? "Следующий рубеж — «Отметили 30 вместе». Откроется на вечеринке." : "Новые рубежи разблокируются после 30. Следите за обновлениями!" });
  });
  body.appendChild(more);
  groupsEl.appendChild(group);
});

/* ---------- Поповер ---------- */
const pop = $("#pop");
let popOwner = null;
function openPop(anchor, d) {
  $("#popIcon").src = d.img; $("#popKicker").textContent = d.kicker; $("#popTitle").textContent = d.title; $("#popText").textContent = d.text;
  pop.hidden = false;
  popOwner = anchor;
  anchor.classList.remove("is-shine"); void anchor.offsetWidth; anchor.classList.add("is-shine");
  const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  let x = r.right + 12, y = r.top + r.height / 2 - ph / 2;
  if (x + pw > innerWidth - 16) { x = Math.min(Math.max(16, r.left + r.width / 2 - pw / 2), innerWidth - pw - 16); y = r.top - ph - 10; if (y < 16) y = r.bottom + 10; }
  pop.style.left = `${x}px`; pop.style.top = `${Math.max(16, Math.min(y, innerHeight - ph - 16))}px`;
  if (hasGSAP && !reduceMotion) gsap.fromTo(pop, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .25, ease: "back.out(2)" });
  Sound.play("pop");
}
function closePop() { pop.hidden = true; popOwner = null; }
document.addEventListener("click", (e) => { if (!pop.hidden && !pop.contains(e.target)) closePop(); });
addEventListener("scroll", () => { if (!pop.hidden) closePop(); }, { passive: true });
groupsEl.addEventListener("scroll", () => { if (!pop.hidden) closePop(); }, { passive: true });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closePop(); closeModal(); } });

/* ---------- Уведомления ---------- */
const toast = $("#toast");
let toastTimer;
function showToast(icon, title, text, ms = 4200) {
  $("#toastIcon").src = icon; $("#toastTitle").textContent = title; $("#toastText").textContent = text;
  toast.hidden = false;
  if (hasGSAP && !reduceMotion) gsap.fromTo(toast, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: .35, ease: "back.out(1.8)" });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (hasGSAP && !reduceMotion) gsap.to(toast, { opacity: 0, duration: .25, onComplete: () => (toast.hidden = true) });
    else toast.hidden = true;
  }, ms);
}

/* ---------- Обратный отсчёт + монетка ---------- */
const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
function tick() {
  const now = Date.now(), t0 = new Date(PARTY.inviteSent).getTime(), t1 = startDate.getTime();
  const p = Math.min(1, Math.max(0, (now - t0) / (t1 - t0)));
  const pct = 4 + p * 92;
  $("#progFill").style.width = `${pct}%`;
  $("#coin").style.left = `${pct}%`;
  let left = Math.max(0, t1 - now);
  const cd = $("#countdown");
  if (now >= endDate.getTime()) { cd.textContent = "Вечеринка прошла — спасибо, что были!"; return; }
  if (left === 0) { cd.textContent = "Вечеринка уже идёт! Бегом!"; return; }
  const d = Math.floor(left / 864e5); left %= 864e5;
  const h = Math.floor(left / 36e5); left %= 36e5;
  const m = Math.floor(left / 6e4); const s = Math.floor((left % 6e4) / 1e3);
  cd.textContent = `До вечеринки: ${d} ${plural(d, ["день", "дня", "дней"])} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
tick(); setInterval(tick, 1000);

/* ---------- Взросление (и остаётся «Молодая») ---------- */
let ageing = false;
function ageUp() {
  if (ageing) return;
  ageing = true;
  const label = $("#ageLabel"), sparks = $("#sparks");
  Sound.play("age");
  if (!hasGSAP || reduceMotion) {
    showToast("assets/sim-young.webp", "Марина стала… Молодой!", "Опять. Возраст не меняется, проверено.");
    ageing = false; return;
  }
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    sparks.appendChild(s);
    const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 25;
    gsap.set(s, { left: `${50 + Math.cos(a) * 18}%`, top: `${30 + Math.sin(a) * 14 + Math.random() * 25}%`, scale: 0 });
    gsap.timeline({ delay: Math.random() * .8, onComplete: () => s.remove() })
      .to(s, { scale: 1 + Math.random() * 1.4, duration: .3, ease: "back.out(3)" })
      .to(s, { y: -r * 3, x: Math.cos(a) * r, opacity: 0, duration: 1.1, ease: "power1.out" }, ">-0.1");
  }
  gsap.timeline({ onComplete: () => { ageing = false; } })
    .to("#simImg", { filter: "drop-shadow(0 0 30px rgba(190,255,150,.95)) brightness(1.15)", duration: .5, yoyo: true, repeat: 1 })
    .to(label, { opacity: 0, duration: .12, repeat: 7, yoyo: true, ease: "none" }, 0)
    .call(() => { label.textContent = "Взрослая?"; }, null, .9)
    .to(label, { opacity: 0, duration: .1, repeat: 5, yoyo: true, ease: "none" }, 1.0)
    .call(() => { label.textContent = "Молодая"; }, null, 1.65)
    .fromTo(label, { scale: 1.3, color: "#2fae47" }, { scale: 1, color: "#1546b4", duration: .6, ease: "elastic.out(1, .4)" }, 1.65)
    .call(() => showToast("assets/sim-young.webp", "Марина стала… Молодой!", "Опять. Возраст не меняется, проверено."), null, 1.7);
}
$("#simImg").addEventListener("click", ageUp);

/* ---------- Конфетти из кристаллов ---------- */
function confetti() {
  if (!hasGSAP || reduceMotion) return;
  const box = $("#confetti"), btn = $("#cta").getBoundingClientRect();
  const ox = btn.left + btn.width / 2, oy = btn.top + btn.height / 2;
  const n = innerWidth < 600 ? 34 : 56;
  for (let i = 0; i < n; i++) {
    const img = document.createElement("img");
    img.src = "assets/plumbob.webp"; img.alt = "";
    box.appendChild(img);
    const ang = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1;
    const v = 260 + Math.random() * 420;
    const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v;
    gsap.set(img, { x: ox, y: oy, scale: .6 + Math.random() * .9, rotation: Math.random() * 360, xPercent: -50, yPercent: -50 });
    gsap.timeline({ onComplete: () => img.remove() })
      .to(img, { x: ox + dx, y: oy + dy, rotation: "+=" + (Math.random() * 360 - 180), duration: .7 + Math.random() * .3, ease: "power2.out" })
      .to(img, { y: innerHeight + 60, x: `+=${(Math.random() - .5) * 160}`, rotation: "+=" + (Math.random() * 540), duration: 1.4 + Math.random() * .9, ease: "power1.in" })
      .to(img, { opacity: 0, duration: .4 }, "-=.4");
  }
}

/* ---------- CTA ---------- */
const modal = $("#modal");
let joined = false;
function openModal() {
  const f = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  $("#modalText").textContent = `Жду тебя ${f.format(startDate)}. ${PARTY.place}.`;
  modal.hidden = false;
  if (hasGSAP && !reduceMotion) gsap.fromTo(".modal__box", { scale: .85, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: "back.out(1.8)" });
  $("#icsBtn").focus({ preventScroll: true });
}
function closeModal() { if (!modal.hidden) { modal.hidden = true; $("#cta").focus({ preventScroll: true }); } }
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

$("#cta").addEventListener("click", () => {
  confetti();
  Sound.play("fanfare");
  if (!joined) {
    joined = true;
    $("#cta").classList.add("is-joined");
    $("#ctaLabel").innerHTML = "Ты в событии!<br>Добавить в календарь";
    setTimeout(openModal, reduceMotion ? 0 : 900);
    setTimeout(ageUp, reduceMotion ? 0 : 2600);
  } else openModal();
});

/* ---------- Файл календаря (.ics) ---------- */
$("#icsBtn").addEventListener("click", () => {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s) => String(s).replace(/([,;\\])/g, "\\$1");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//sims-bday//RU", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:sims-bday-${startDate.getTime()}@marina`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startDate)}`, `DTEND:${fmt(endDate)}`,
    "SUMMARY:День рождения Марины — вечеринка в стиле The Sims",
    `LOCATION:${esc(PARTY.place)}`,
    `DESCRIPTION:${esc("Основная цель: задуть свечи. Дресс-код: как у твоего сима.")}${PARTY.mapUrl ? "\\n" + esc(PARTY.mapUrl) : ""}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Завтра вечеринка!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "marina-birthday.ics" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

/* ---------- Иконки в облачках по кругу ---------- */
const CLOUD_ICONS = ["assets/i-cake.webp", "assets/i-party.webp", "assets/i-gift.svg"];
CLOUD_ICONS.forEach((src) => { const i = new Image(); i.src = src; });
const cloudIcons = [...document.querySelectorAll(".thought__icon")];
let cloudStep = 0;
function cycleClouds() {
  cloudStep++;
  cloudIcons.forEach((img, k) => {
    const src = CLOUD_ICONS[(cloudStep + k) % CLOUD_ICONS.length];
    if (!hasGSAP || reduceMotion) { img.src = src; return; }
    gsap.timeline()
      .to(img, { scale: 0, opacity: 0, duration: .25, ease: "back.in(2)", delay: k * .5 })
      .call(() => { img.src = src; })
      .to(img, { scale: 1, opacity: 1, duration: .45, ease: "back.out(2.5)" });
  });
}

/* ---------- Параллакс фона ---------- */
function initParallax() {
  const layers = [...document.querySelectorAll(".bg__layer")].map((el) => ({
    el, d: +el.dataset.depth,
    x: gsap.quickTo(el, "x", { duration: .9, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: .9, ease: "power3.out" }),
  }));
  const move = (nx, ny) => layers.forEach((l) => { l.x(nx * l.d); l.y(ny * l.d); });
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    move((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2);
  }, { passive: true });
  const onTilt = (e) => {
    if (e.gamma == null) return;
    move(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25)));
  };
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    // iOS: разрешение только по жесту пользователя
    addEventListener("touchend", function ask() {
      removeEventListener("touchend", ask);
      DOE.requestPermission().then((s) => { if (s === "granted") addEventListener("deviceorientation", onTilt); }).catch(() => {});
    }, { once: true });
  } else if (DOE) addEventListener("deviceorientation", onTilt);
}

/* ---------- 3D-пламбоб (three.js) ---------- */
const Gems = (() => {
  const items = [];
  let raf = 0;
  function geometry(THREE, scale = 1) {
    // Вытянутая шестигранная бипирамида, как в The Sims 4
    const n = 6, r = 1.08 * scale, top = 2.32 * scale, bottom = -2.32 * scale;
    const eq = Array.from({ length: n }, (_, i) => [Math.cos(i * 2 * Math.PI / n) * r, 0, Math.sin(i * 2 * Math.PI / n) * r]);
    const cTop = [0.1, 0.52, 0.06], cMid = [0.42, 0.88, 0.12], cBot = [0.0, 0.2, 0.02];
    const pos = [], col = [];
    for (let i = 0; i < n; i++) {
      const a = eq[i], b = eq[(i + 1) % n];
      pos.push(0, top, 0, ...b, ...a); col.push(...cTop, ...cMid, ...cMid);
      pos.push(0, bottom, 0, ...a, ...b); col.push(...cBot, ...cMid, ...cMid);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals(); // неиндексированная геометрия → плоские грани
    return g;
  }
  function mount(host, { speed = 1, tilt = true } = {}) {
    const THREE = window.THREE;
    if (!THREE || !host) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 240 / 507, 0.1, 50);
    camera.position.set(0, 0, 9.4);
    const geo = geometry(THREE);
    const gem = new THREE.Group();
    // Светящееся ядро внутри — даёт «стеклянную» глубину
    gem.add(new THREE.Mesh(geometry(THREE, 0.62), new THREE.MeshBasicMaterial({
      color: 0xb4ff3c, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false,
    })));
    // Стеклянная оболочка
    gem.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      vertexColors: true, flatShading: true, shininess: 160, specular: 0xffffff,
      emissive: 0x021f03, transparent: true, opacity: 0.95, depthWrite: false,
    })));
    gem.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xc8ffb0, transparent: true, opacity: 0.3 })));
    scene.add(gem);
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(-3, 4, 6); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9dff80, 0.35); fill.position.set(4, -1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(0, 2, -6); scene.add(rim);
    const canvas = renderer.domElement;
    canvas.className = "gem3d";
    host.appendChild(canvas);
    host.classList.add("has-3d");
    const fit = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(host);
    const item = { host, renderer, scene, camera, gem, speed, tilt };
    items.push(item);
    if (reduceMotion) { gem.rotation.y = 0.6; renderer.render(scene, camera); }
    else if (!raf) raf = requestAnimationFrame(loop);
    return item;
  }
  function loop(t) {
    const s = t / 1000;
    items.forEach((it) => {
      it.gem.rotation.y = s * 1.1 * it.speed;
      if (it.tilt) { it.gem.rotation.x = Math.sin(s * 0.9) * 0.22; it.gem.rotation.z = Math.sin(s * 0.7) * 0.06; }
      it.renderer.render(it.scene, it.camera);
    });
    raf = items.length ? requestAnimationFrame(loop) : 0;
  }
  function unmount(host) {
    const i = items.findIndex((it) => it.host === host);
    if (i < 0) return;
    items[i].renderer.dispose();
    items.splice(i, 1);
  }
  return { mount, unmount };
})();
Gems.mount($(".loader__gem-wrap"), { speed: 2.4, tilt: false });
Gems.mount($(".logo__gem-wrap"));

/* ---------- Загрузка и вход ---------- */
const loader = $("#loader"), loaderText = $("#loaderText");
let phrase = 0;
const phraseTimer = setInterval(() => { loaderText.textContent = LOADER_PHRASES[++phrase % LOADER_PHRASES.length]; }, 380);
const simImg = $("#simImg");
const imgReady = new Promise((res) => {
  if (simImg.complete) res();
  else { simImg.addEventListener("load", res, { once: true }); simImg.addEventListener("error", res, { once: true }); }
});
const minTime = new Promise((res) => setTimeout(res, reduceMotion ? 300 : 1150));
const maxTime = new Promise((res) => setTimeout(res, 4000));

Promise.race([Promise.all([imgReady, minTime]), maxTime]).then(start);

function start() {
  clearInterval(phraseTimer);
  document.body.classList.remove("is-loading");

  if (!hasGSAP) { loader.remove(); return; }

  if (reduceMotion) {
    gsap.to(loader, { opacity: 0, duration: .3, onComplete: () => loader.remove() });
    gsap.from([".logo", ".sim", ".panel-l", ".event"], { opacity: 0, duration: .5, stagger: .08, clearProps: "opacity" });
    setInterval(cycleClouds, 3500);
    return;
  }

  const mobile = matchMedia("(max-width: 900px)").matches;
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(loader, { opacity: 0, duration: .35, onComplete: () => { Gems.unmount($(".loader__gem-wrap")); loader.remove(); } })
    .from(".sim", { opacity: 0, y: 40, duration: .7, clearProps: "transform" }, "-=.15")
    .from(".logo__word--l", { x: -40, opacity: 0, duration: .5, ease: "back.out(2)" }, "<.1")
    .from(".logo__word--r", { x: 40, opacity: 0, duration: .5, ease: "back.out(2)" }, "<")
    .from(".logo__gem-wrap", { y: -60, scale: .3, opacity: 0, duration: .6, ease: "back.out(2.4)" }, "<.1")
    .from(".panel-l", mobile ? { y: 40, opacity: 0, duration: .6, clearProps: "transform" } : { x: -120, opacity: 0, duration: .7, ease: "back.out(1.4)", clearProps: "transform" }, "<")
    .from(".event", mobile ? { y: 50, opacity: 0, duration: .6, clearProps: "transform" } : { x: 120, opacity: 0, duration: .7, ease: "back.out(1.4)", clearProps: "transform" }, "<.05")
    .from(".badge", { scale: 0, opacity: 0, duration: .45, stagger: .06, ease: "back.out(2.5)" }, "-=.35")
    .from(".goal", { x: 24, opacity: 0, duration: .4, stagger: .07, clearProps: "transform" }, "<")
    .from(".cta-wrap", { y: mobile ? 90 : 20, opacity: 0, duration: .5, ease: "back.out(1.6)" }, "<.1")
    .from(".thought__dot", { scale: 0, duration: .25, stagger: { each: .1, from: "end" }, ease: "back.out(3)" }, "-=.6")
    .from(".thought__cloud", { scale: 0, opacity: 0, duration: .8, ease: "elastic.out(1, .5)", stagger: .15 }, "-=.15")
    .add(ambient, "-=.4");
}

function ambient() {
  // Кристалл: покачивание (вращение — в 3D-рендере ниже)
  gsap.to(".logo__gem-wrap", { y: -6, rotation: 4, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
  // Персонаж дышит и чуть покачивается
  gsap.to("#simImg", { scale: 1.006, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to("#simImg", { rotation: .5, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: .6 });
  // Облачка плавают
  gsap.to(".thought--l", { y: -8, x: 3, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".thought--r", { y: -10, x: -3, duration: 3.1, ease: "sine.inOut", yoyo: true, repeat: -1, delay: .4 });
  setInterval(cycleClouds, 3200);
  initParallax();
}
