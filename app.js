"use strict";

/* ================= helpers ================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let soundOn = true;

/* Tiny synthesised sounds so we need no audio files. */
let audioCtx = null;
function tone(freq, duration = 0.15, type = "sine", gainValue = 0.12) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) { /* audio not available */ }
}
function happySound() { tone(523, 0.12); setTimeout(() => tone(659, 0.12), 100); setTimeout(() => tone(784, 0.18), 200); }
function sadSound() { tone(300, 0.18, "triangle"); setTimeout(() => tone(220, 0.25, "triangle"), 140); }

/* Spoken names, when the browser supports it. */
function speak(text) {
  if (!soundOn || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.25;
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  } catch (_) { /* ignore */ }
}

/* ================= navigation ================= */
function showSection(name) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  const view = $("#view-" + name);
  if (view) view.classList.add("active");
  $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.section === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "shapes") startShapeStage();
}

$$(".nav-btn").forEach((b) => b.addEventListener("click", () => { tone(700, 0.08); showSection(b.dataset.section); }));
$$("[data-go]").forEach((b) => b.addEventListener("click", () => { tone(700, 0.08); showSection(b.dataset.go); }));

$("#soundToggle").addEventListener("click", (e) => {
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? "🔊" : "🔇";
  e.currentTarget.classList.toggle("off", !soundOn);
  if (!soundOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  if (soundOn) tone(880, 0.1);
});

/* ================= shape catalogue ================= */
const SHAPES = [
  { id: "circle",  name: "Circle",  color: "#38bdf8", svg: '<circle cx="32" cy="32" r="28" fill="#38bdf8"/>' },
  { id: "square",  name: "Square",  color: "#fb923c", svg: '<rect x="5" y="5" width="54" height="54" rx="6" fill="#fb923c"/>' },
  { id: "triangle",name: "Triangle",color: "#34d399", svg: '<polygon points="32,4 60,58 4,58" fill="#34d399"/>' },
  { id: "star",    name: "Star",    color: "#fbbf24", svg: '<polygon points="32,3 39.5,23.5 61,24.5 44,38 50,59 32,46.5 14,59 20,38 3,24.5 24.5,23.5" fill="#fbbf24"/>' },
  { id: "heart",   name: "Heart",   color: "#ef4444", svg: '<path d="M32 58S6 42 6 24a12 12 0 0 1 26-6 12 12 0 0 1 26 6c0 18-26 34-26 34z" fill="#ef4444"/>' },
  { id: "diamond", name: "Diamond", color: "#a78bfa", svg: '<polygon points="32,4 58,32 32,60 6,32" fill="#a78bfa"/>' },
  { id: "oval",    name: "Oval",    color: "#f472b6", svg: '<ellipse cx="32" cy="32" rx="29" ry="19" fill="#f472b6"/>' },
  { id: "hexagon", name: "Hexagon", color: "#22d3ee", svg: '<polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="#22d3ee"/>' },
];

const shapeGrid = $("#shapeGrid");
SHAPES.forEach((s) => {
  const tile = document.createElement("button");
  tile.className = "shape-tile";
  tile.innerHTML = `<svg viewBox="0 0 64 64">${s.svg}</svg><span class="shape-name">${s.name}</span>`;
  tile.addEventListener("click", () => {
    tile.classList.remove("spin");
    void tile.offsetWidth;
    tile.classList.add("spin");
    speak(s.name);
    tone(560 + Math.random() * 300, 0.16, "sine");
    addStageShape(s);
  });
  shapeGrid.appendChild(tile);
});

/* ================= bouncing-shape playground ================= */
const stage = $("#shapeStage");
const sctx = stage.getContext("2d");
let stageShapes = [];
let stageRunning = false;
let stageRAF = null;

function resizeStage() {
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  stage.width = Math.max(300, rect.width * dpr);
  stage.height = 380 * dpr;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function randomShape() { return SHAPES[Math.floor(Math.random() * SHAPES.length)]; }

function addStageShape(shape) {
  const cfg = shape || randomShape();
  const size = 18 + Math.random() * 20;
  stageShapes.push({
    kind: cfg.id,
    color: cfg.color,
    x: 60 + Math.random() * Math.max(1, stage.width / (window.devicePixelRatio || 1) - 120),
    y: 60 + Math.random() * 220,
    vx: (Math.random() - 0.5) * 3.2 || 2,
    vy: (Math.random() - 0.5) * 3.2 || 1.5,
    size,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.05,
  });
  if (stageShapes.length > 26) stageShapes.shift();
}

function drawStageShape(s) {
  sctx.save();
  sctx.translate(s.x, s.y);
  sctx.rotate(s.rot);
  sctx.fillStyle = s.color;
  const r = s.size;
  sctx.beginPath();
  switch (s.kind) {
    case "circle": sctx.arc(0, 0, r, 0, Math.PI * 2); break;
    case "oval": sctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2); break;
    case "square": sctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7); break;
    case "triangle":
      sctx.moveTo(0, -r); sctx.lineTo(r * 0.95, r * 0.8); sctx.lineTo(-r * 0.95, r * 0.8); sctx.closePath(); break;
    case "diamond":
      sctx.moveTo(0, -r); sctx.lineTo(r, 0); sctx.lineTo(0, r); sctx.lineTo(-r, 0); sctx.closePath(); break;
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i === 0 ? sctx.moveTo(px, py) : sctx.lineTo(px, py);
      }
      sctx.closePath(); break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        i === 0 ? sctx.moveTo(px, py) : sctx.lineTo(px, py);
      }
      sctx.closePath(); break;
    case "heart":
      sctx.moveTo(0, r * 0.8);
      sctx.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 0.6, -r * 1.1, 0, -r * 0.35);
      sctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.4, -r * 0.2, 0, r * 0.8);
      break;
    default: sctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  sctx.fill();
  sctx.lineWidth = 3;
  sctx.strokeStyle = "rgba(255,255,255,0.75)";
  sctx.stroke();
  sctx.restore();
}

function stageLoop() {
  const w = stage.width / (window.devicePixelRatio || 1);
  const h = stage.height / (window.devicePixelRatio || 1);
  sctx.clearRect(0, 0, w, h);

  stageShapes.forEach((s) => {
    s.x += s.vx;
    s.y += s.vy;
    s.rot += s.spin;
    const pad = s.size + 4;
    if (s.x < pad || s.x > w - pad) { s.vx *= -1; s.x = Math.max(pad, Math.min(w - pad, s.x)); }
    if (s.y < pad || s.y > h - pad) { s.vy *= -1; s.y = Math.max(pad, Math.min(h - pad, s.y)); }
    drawStageShape(s);
  });

  stageRAF = requestAnimationFrame(stageLoop);
}

function startShapeStage() {
  if (stageShapes.length === 0) {
    for (let i = 0; i < 8; i++) addStageShape(randomShape());
  }
  if (!stageRunning) {
    stageRunning = true;
    resizeStage();
    stageLoop();
  }
}

stage.addEventListener("click", (e) => {
  const rect = stage.getBoundingClientRect();
  const s = randomShape();
  stageShapes.push({
    kind: s.id, color: s.color,
    x: e.clientX - rect.left, y: e.clientY - rect.top,
    vx: (Math.random() - 0.5) * 4 || 2, vy: (Math.random() - 0.5) * 4 || 2,
    size: 18 + Math.random() * 18, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.06,
  });
  if (stageShapes.length > 26) stageShapes.shift();
  tone(700, 0.1, "triangle");
});

window.addEventListener("resize", () => { if (stageRunning) resizeStage(); });

/* ================= colors ================= */
const RAINBOW = [
  { name: "Red",    hex: "#ef4444" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green",  hex: "#22c55e" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#a855f7" },
];

const rainbowEl = $("#rainbow");
RAINBOW.forEach((c) => {
  const band = document.createElement("button");
  band.className = "rainbow-band";
  band.style.background = c.hex;
  band.textContent = c.name;
  band.addEventListener("click", () => {
    band.classList.remove("lit");
    void band.offsetWidth;
    band.classList.add("lit");
    speak(c.name);
    tone(420 + Math.random() * 400, 0.16);
  });
  rainbowEl.appendChild(band);
});

/* ---- mixer ---- */
const MIX_COLORS = [
  { name: "Red",    hex: "#ef4444" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "White",  hex: "#ffffff" },
  { name: "Black",  hex: "#1f2937" },
  { name: "Pink",   hex: "#f472b6" },
];
const KNOWN_MIXES = {
  "Red+Yellow": { name: "Orange", hex: "#fb923c" },
  "Red+Blue": { name: "Purple", hex: "#a855f7" },
  "Yellow+Blue": { name: "Green", hex: "#22c55e" },
  "Red+White": { name: "Pink", hex: "#fbb6ce" },
  "Blue+White": { name: "Sky Blue", hex: "#bae6fd" },
  "Red+Black": { name: "Brown", hex: "#7c4a2a" },
};
let mixA = MIX_COLORS[0];
let mixB = MIX_COLORS[1];
let activeSlot = "A";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function averageHex(a, b) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const to = (v) => Math.round(v).toString(16).padStart(2, "0");
  return "#" + to((r1 + r2) / 2) + to((g1 + g2) / 2) + to((b1 + b2) / 2);
}

const mixPalette = $("#mixPalette");
MIX_COLORS.forEach((c) => {
  const dot = document.createElement("button");
  dot.className = "mix-dot";
  dot.style.background = c.hex;
  dot.title = c.name;
  dot.dataset.hex = c.hex;
  dot.addEventListener("click", () => {
    if (activeSlot === "A") { mixA = c; activeSlot = "B"; }
    else { mixB = c; activeSlot = "A"; }
    updateMixer();
    tone(600, 0.1);
  });
  mixPalette.appendChild(dot);
});

function updateMixer() {
  $("#swatchA").style.background = mixA.hex;
  $("#swatchB").style.background = mixB.hex;
  const key1 = mixA.name + "+" + mixB.name;
  const key2 = mixB.name + "+" + mixA.name;
  const known = KNOWN_MIXES[key1] || KNOWN_MIXES[key2];
  const mixed = known || { hex: averageHex(mixA.hex, mixB.hex) };
  $("#swatchMix").style.background = mixed.hex;
  $("#swatchMix").textContent = "";
  $$(".mix-dot").forEach((d) => {
    d.classList.toggle("selected", d.dataset.hex === mixA.hex || d.dataset.hex === mixB.hex);
  });
  return mixed;
}
updateMixer();
$("#swatchMix").addEventListener("click", () => {
  const key1 = mixA.name + "+" + mixB.name, key2 = mixB.name + "+" + mixA.name;
  const known = KNOWN_MIXES[key1] || KNOWN_MIXES[key2];
  const name = known ? known.name : "a new color";
  speak(name);
  happySound();
});

/* ================= draw pad ================= */
const pad = $("#drawPad");
const pctx = pad.getContext("2d");
const DRAW_COLORS = ["#ef4444", "#fb923c", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#1f2937"];
let penColor = DRAW_COLORS[4];
let penSize = 10;
let erasing = false;
let drawing = false;
let lastPt = null;

function fitPad() {
  const rect = pad.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const snapshot = pad.width > 0 ? pctx.getImageData(0, 0, pad.width, pad.height) : null;
  pad.width = Math.max(300, Math.round(rect.width * dpr));
  pad.height = Math.round(500 * dpr);
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pctx.lineCap = "round";
  pctx.lineJoin = "round";
  if (snapshot) {
    pctx.save();
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.putImageData(snapshot, 0, 0);
    pctx.restore();
  }
}

const colorTools = $("#colorTools");
DRAW_COLORS.forEach((hex, i) => {
  const b = document.createElement("button");
  b.className = "color-btn" + (i === 4 ? " selected" : "");
  b.style.background = hex;
  b.dataset.hex = hex;
  b.addEventListener("click", () => {
    penColor = hex;
    erasing = false;
    $("#eraserBtn").classList.remove("selected");
    $$(".color-btn").forEach((x) => x.classList.toggle("selected", x === b));
    tone(640, 0.08);
  });
  colorTools.appendChild(b);
});

$$("[data-size]").forEach((b) => {
  if (b.dataset.size === "10") b.classList.add("selected");
  b.addEventListener("click", () => {
    penSize = Number(b.dataset.size);
    $$("[data-size]").forEach((x) => x.classList.toggle("selected", x === b));
    tone(520, 0.08);
  });
});

$("#eraserBtn").addEventListener("click", (e) => {
  erasing = !erasing;
  e.currentTarget.classList.toggle("selected", erasing);
  $$(".color-btn").forEach((x) => x.classList.remove("selected"));
  tone(400, 0.08);
});

$("#clearBtn").addEventListener("click", () => {
  pctx.clearRect(0, 0, pad.width, pad.height);
  tone(330, 0.14, "triangle");
});

$("#saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "my-masterpiece.png";
  link.href = pad.toDataURL("image/png");
  link.click();
  happySound();
});

function padPoint(e) {
  const rect = pad.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: p.clientX - rect.left, y: p.clientY - rect.top };
}

function beginStroke(e) {
  drawing = true;
  lastPt = padPoint(e);
  strokeTo(lastPt);
}

function strokeTo(pt) {
  pctx.strokeStyle = erasing ? "#ffffff" : penColor;
  pctx.lineWidth = erasing ? penSize * 2.4 : penSize;
  pctx.beginPath();
  pctx.moveTo(lastPt.x, lastPt.y);
  pctx.lineTo(pt.x, pt.y);
  pctx.stroke();
  lastPt = pt;
}

function moveStroke(e) {
  if (!drawing) return;
  e.preventDefault();
  strokeTo(padPoint(e));
}

function endStroke() { drawing = false; lastPt = null; }

pad.addEventListener("pointerdown", beginStroke);
pad.addEventListener("pointermove", moveStroke);
pad.addEventListener("pointerup", endStroke);
pad.addEventListener("pointerleave", endStroke);
pad.addEventListener("pointercancel", endStroke);

window.addEventListener("resize", () => {
  if ($("#view-draw").classList.contains("active")) fitPad();
  if (stageRunning) resizeStage();
});

/* ================= quiz ================= */
const QUIZ_BANK = [
  { prompt: "Which one is a <b>circle</b>? ⭕", options: [{ t: "circle" }, { t: "square" }, { t: "triangle" }, { t: "star" }], answer: 0, type: "shape" },
  { prompt: "Which shape has <b>3 sides</b>? 🔺", options: [{ t: "Square" }, { t: "Triangle" }, { t: "Circle" }, { t: "Star" }], answer: 1, type: "text" },
  { prompt: "What color is a <b>banana</b>? 🍌", options: [{ t: "Red", c: "#ef4444" }, { t: "Blue", c: "#3b82f6" }, { t: "Yellow", c: "#facc15" }, { t: "Green", c: "#22c55e" }], answer: 2, type: "text" },
  { prompt: "Which one is a <b>square</b>? ⬜", options: [{ t: "star" }, { t: "heart" }, { t: "diamond" }, { t: "square" }], answer: 3, type: "shape" },
  { prompt: "Red + Yellow makes... 🎨", options: [{ t: "Purple", c: "#a855f7" }, { t: "Orange", c: "#fb923c" }, { t: "Green", c: "#22c55e" }, { t: "Brown", c: "#7c4a2a" }], answer: 1, type: "text" },
  { prompt: "Which one is a <b>star</b>? ⭐", options: [{ t: "hexagon" }, { t: "star" }, { t: "oval" }, { t: "circle" }], answer: 1, type: "shape" },
  { prompt: "What color is the <b>sky</b> on a sunny day? ☀️", options: [{ t: "Blue", c: "#3b82f6" }, { t: "Pink", c: "#ec4899" }, { t: "Black", c: "#1f2937" }, { t: "Orange", c: "#fb923c" }], answer: 0, type: "text" },
  { prompt: "Which shape has <b>6 sides</b>? 🔶", options: [{ t: "Triangle" }, { t: "Circle" }, { t: "Hexagon" }, { t: "Square" }], answer: 2, type: "text" },
  { prompt: "Blue + Yellow makes... 🎨", options: [{ t: "Green", c: "#22c55e" }, { t: "Red", c: "#ef4444" }, { t: "Purple", c: "#a855f7" }, { t: "Orange", c: "#fb923c" }], answer: 0, type: "text" },
  { prompt: "Which one is a <b>heart</b>? 💗", options: [{ t: "oval" }, { t: "diamond" }, { t: "heart" }, { t: "triangle" }], answer: 2, type: "shape" },
];

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shapeSvgFor(id) {
  const s = SHAPES.find((x) => x.id === id) || SHAPES[0];
  return `<svg viewBox="0 0 64 64">${s.svg}</svg>`;
}

function startQuiz() {
  quizQuestions = shuffle(QUIZ_BANK).slice(0, 8);
  quizIndex = 0;
  quizScore = 0;
  $("#quizRestart").classList.add("hidden");
  $("#quizScore").textContent = "⭐ 0";
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[quizIndex];
  $("#quizPrompt").innerHTML = q.prompt;
  $("#quizProgress").textContent = `Question ${quizIndex + 1} of ${quizQuestions.length}`;
  $("#quizFeedback").textContent = "";

  const opts = $("#quizOptions");
  opts.innerHTML = "";
  q.options.forEach((o, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    if (q.type === "shape") {
      btn.innerHTML = shapeSvgFor(o.t);
    } else if (o.c) {
      btn.innerHTML = `<span style="display:inline-block;width:34px;height:34px;border-radius:50%;background:${o.c};border:3px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.15)"></span>${o.t}`;
    } else {
      btn.textContent = o.t;
    }
    btn.addEventListener("click", () => answerQuestion(i, btn));
    opts.appendChild(btn);
  });
}

function answerQuestion(i, btn) {
  const q = quizQuestions[quizIndex];
  const allBtns = $$(".quiz-opt");
  allBtns.forEach((b) => (b.disabled = true));

  if (i === q.answer) {
    btn.classList.add("correct");
    quizScore++;
    $("#quizScore").textContent = "⭐ " + quizScore;
    $("#quizFeedback").textContent = "Yay! That's right! 🎉";
    $("#quizFeedback").style.color = "#16a34a";
    happySound();
    burstConfetti(18);
  } else {
    btn.classList.add("wrong");
    allBtns[q.answer].classList.add("correct");
    $("#quizFeedback").textContent = "Almost! Try the next one 💪";
    $("#quizFeedback").style.color = "#dc2626";
    sadSound();
  }

  setTimeout(() => {
    quizIndex++;
    if (quizIndex < quizQuestions.length) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 1100);
}

function finishQuiz() {
  $("#quizProgress").textContent = "All done!";
  $("#quizPrompt").innerHTML = `You got <b>${quizScore}</b> of ${quizQuestions.length} stars! ${
    quizScore === quizQuestions.length ? "Perfect! 🏆" : quizScore >= 5 ? "Great job! 🌟" : "Keep practicing! 💛"
  }`;
  $("#quizOptions").innerHTML = "";
  $("#quizFeedback").textContent = "";
  $("#quizRestart").classList.remove("hidden");
  if (quizScore >= 5) { burstConfetti(70); happySound(); }
}

$("#quizRestart").addEventListener("click", () => { tone(650, 0.1); startQuiz(); });

/* ================= confetti ================= */
const confettiLayer = $("#confetti");
const CONFETTI_COLORS = ["#ef4444", "#fb923c", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
function burstConfetti(count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    p.style.left = Math.random() * 100 + "vw";
    p.style.top = "-20px";
    const dur = 1.8 + Math.random() * 1.8;
    p.style.animationDuration = dur + "s";
    p.style.borderRadius = Math.random() > 0.5 ? "50%" : "3px";
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 200);
  }
}

/* ================= boot ================= */
fitPad();
startQuiz();
window.addEventListener("load", () => { fitPad(); });
