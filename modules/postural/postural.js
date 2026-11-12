import { SECTIONS, SIDES, ALL_ZONES, MAX_POINTS, computeScore, selectedOptions, optionLabel, alteredZoneCount } from "./tests.js?v=202611052135";
import { saveScore, getScores, scoreLabel } from "../../shared/scores.js?v=202611052135";
import { marcarPendiente, quitarPendiente, montarTick } from "../../shared/perfil.js";

const form = document.getElementById("form");
const progress = document.getElementById("progress");
const calcBtn = document.getElementById("calc");
const answers = {};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function onChange(zone) {
  answers[zone.id] = [...form.querySelectorAll(`input[name="${zone.id}"]:checked`)].map((i) => i.value);
  calcBtn.classList.remove("oculto");
  update();
}

function circle(zone, value, label) {
  const input = el("input", { type: "checkbox", class: "circle", name: zone.id, value });
  if (label) input.setAttribute("aria-label", label);
  input.addEventListener("change", () => {
    // Zonas exclusivas (positivo/negativo): un solo resultado por lado.
    if (zone.exclusive && input.checked) {
      const side = value.includes(":") ? value.split(":")[1] : null;
      form.querySelectorAll(`input[name="${zone.id}"]:checked`).forEach((other) => {
        if (other !== input && (side == null || other.value.endsWith(`:${side}`))) other.checked = false;
      });
    }
    onChange(zone);
  });
  return input;
}

// Botón "Ver ejemplo": despliega el GIF de la alteración (en bilaterales, izquierda y derecha).
const GIF_V = "202611052135";
// Solo un ejemplo abierto a la vez: al abrir uno se cierra el anterior.
let demoAbierto = null;
function demo(opt, sides) {
  const panel = el("div", { class: "demo hidden" });
  const btn = el("button", { type: "button", class: "ver-demo", "aria-expanded": "false" }, "▶ Ver ejemplo");
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!panel.childElementCount) {
      // Por cada lado: el GIF animado y, debajo, el PNG explicativo (correcto frente a alteración).
      const pngs = [];
      for (const k of sides || [null]) {
        const base = `gifs/${opt.id}${k ? "-" + k : ""}`;
        const lado = k ? ", lado " + SIDES[k].toLowerCase() : "";
        panel.append(el("figure", {}, el("img", { src: `${base}.gif?v=${GIF_V}`, alt: `${opt.name}${lado}: de postura correcta a alteración`, width: "380", height: "508", loading: "lazy" }), el("figcaption", {}, k ? SIDES[k] : "")));
        pngs.push(el("figure", { class: "explica" }, el("img", { src: `${base}.png?v=${GIF_V}`, alt: `${opt.name}${lado}: comparación entre la postura correcta y la alteración, con lo que hay que mirar`, loading: "lazy" })));
      }
      panel.append(...pngs);
    }
    const open = panel.classList.contains("hidden");
    if (open && demoAbierto && demoAbierto.panel !== panel) demoAbierto.cerrar();
    if (open) {
      panel.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
      btn.textContent = "✕ Ocultar ejemplo";
      demoAbierto = { panel, cerrar };
      // Si al cerrar el anterior se ha movido la página, deja este botón a la vista.
      btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      cerrar();
    }
  });
  function cerrar() {
    panel.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "▶ Ver ejemplo";
    if (demoAbierto?.panel === panel) demoAbierto = null;
  }
  return { btn, panel };
}

// Cómo se hace el ejercicio: GIF y fotos del test, siempre visibles al inicio del bloque.
function exerciseCard(section) {
  const fig = el("div", { class: "ejercicio-media" });
  for (const m of section.media) {
    fig.append(el("figure", { class: m.wide ? "ancho" : "" }, el("img", { src: `${m.src}?v=${GIF_V}`, alt: m.alt, width: String(m.w), height: String(m.h), loading: "lazy" }), el("figcaption", {}, m.caption)));
  }
  return el("div", { class: "card ejercicio" }, el("h3", {}, "Cómo se hace"), fig);
}

// Zona normal: un círculo por opción.
function zoneCard(zone) {
  const options = el("div", { class: "options" });
  for (const opt of zone.options) {
    const { btn, panel } = demo(opt);
    options.append(
      el("label", {}, circle(zone, opt.id), el("span", {}, el("strong", {}, opt.name), el("br"), el("span", { class: "note" }, opt.hint), el("br"), btn)),
      panel
    );
  }
  return el("div", { class: "card" }, el("h3", {}, zone.name), el("p", { class: "how" }, zone.how), options);
}

// Zona bilateral: columnas I y D con un círculo por lado en cada opción.
function bilateralCard(zone, section) {
  const head = el("div", { class: "lado-head" }, el("span", {}, zone.colLabel || "Compensación"));
  for (const k of Object.keys(SIDES)) head.append(el("span", { class: "lado-tag", title: SIDES[k] }, k));
  const rows = el("div", { class: "lados" }, head);
  for (const opt of zone.options) {
    const { btn, panel } = section.media ? { btn: "", panel: "" } : demo(opt, Object.keys(SIDES));
    const row = el(
      "div",
      { class: "lado-row" },
      el("span", {}, el("strong", {}, opt.name), " ", el("span", { class: "vista" }, opt.view), el("br"), el("span", { class: "note" }, opt.hint), ...(btn ? [el("br"), btn] : []))
    );
    for (const k of Object.keys(SIDES)) row.append(el("label", { class: "lado-cel" }, circle(zone, `${opt.id}:${k}`, `${opt.name}, lado ${SIDES[k].toLowerCase()}`)));
    rows.append(row, panel);
  }
  return el("div", { class: "card" }, el("h3", {}, zone.name), el("p", { class: "how" }, zone.how), rows);
}

function render() {
  for (const section of SECTIONS) {
    form.append(el("h2", {}, section.title), el("p", { class: "lead" }, section.intro));
    if (section.media) form.append(exerciseCard(section));
    for (const zone of section.zones) form.append(section.bilateral ? bilateralCard(zone, section) : zoneCard(zone));
  }
  form.append(el("p", { class: "note" }, "Si no marcas ninguna opción en una zona, se considera sin alteración."));
}

// Las zonas sin marcar cuentan como correctas, así que el resultado siempre está disponible.
function update() {
  const n = alteredZoneCount(answers);
  progress.textContent = n
    ? `${n} de ${ALL_ZONES.length} zonas con alteración · Toca para ver tu evaluación`
    : "Toca para ver tu evaluación";
  calcBtn.classList.add("listo");
  calcBtn.setAttribute("aria-disabled", "false");
}

function showResult() {
  const score = computeScore(answers);
  marcarPendiente("postural");
  montarTick(document.getElementById("tick"), calcBtn, () => {
    saveScore("postural", score, { answers: structuredClone(answers) });
    guardarHistorial(score);
    quitarPendiente("postural");
  }, "../../perfil.html");
  const shown = score.toLocaleString("es-ES", { maximumFractionDigits: 1 });
  document.getElementById("scoreValue").textContent = `${shown} / ${MAX_POINTS}`;
  document.getElementById("scoreLabel").textContent = scoreLabel(score, MAX_POINTS);
  document.getElementById("scoreBar").style.width = `${(score / MAX_POINTS) * 100}%`;

  const result = document.getElementById("result");
  result.classList.remove("hidden");
  result.scrollIntoView({ behavior: "smooth" });
}

// Historial de evaluaciones posturales para la evolución del panel principal.
const HIST_KEY = "sportfy.postural.historial";
function guardarHistorial(score) {
  try {
    const h = JSON.parse(localStorage.getItem(HIST_KEY)) || [];
    const desviaciones = selectedOptions(answers).map((o) => ({ id: o.sides ? `${o.id}:${o.sides.join("")}` : o.id, nombre: optionLabel(o), nivel: 1 }));
    h.push({ fecha: new Date().toISOString(), nota: score, max: MAX_POINTS, respuestas: structuredClone(answers), desviaciones });
    localStorage.setItem(HIST_KEY, JSON.stringify(h));
  } catch {
    /* sin almacenamiento */
  }
}

// Recupera la última evaluación guardada (las del protocolo anterior se ignoran).
function restore() {
  const saved = getScores().postural?.detail?.answers;
  if (!saved) return;
  for (const zone of ALL_ZONES) {
    const ids = (Array.isArray(saved[zone.id]) ? saved[zone.id] : []).filter((id) => zone.options.some((o) => o.id === id.split(":")[0]));
    for (const id of ids) {
      const input = form.querySelector(`input[name="${zone.id}"][value="${id}"]`);
      if (input) input.checked = true;
    }
    answers[zone.id] = ids;
  }
}

render();
restore();
update();
calcBtn.addEventListener("click", showResult);
