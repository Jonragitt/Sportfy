import { SECTIONS, SIDES, ALL_ZONES, MAX_POINTS, computeScore, selectedOptions, optionLabel } from "./tests.js";
import { saveScore, getScores, scoreLabel } from "../../shared/scores.js";
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
  input.addEventListener("change", () => onChange(zone));
  return input;
}

// Zona normal: un círculo por opción.
function zoneCard(zone) {
  const options = el("div", { class: "options" });
  for (const opt of zone.options) {
    options.append(
      el("label", {}, circle(zone, opt.id), el("span", {}, el("strong", {}, opt.name), el("br"), el("span", { class: "note" }, opt.hint)))
    );
  }
  return el("div", { class: "card" }, el("h3", {}, zone.name), el("p", { class: "how" }, zone.how), options);
}

// Zona bilateral: columnas I y D con un círculo por lado en cada opción.
function bilateralCard(zone) {
  const head = el("div", { class: "lado-head" }, el("span", {}, "Compensación"));
  for (const k of Object.keys(SIDES)) head.append(el("span", { class: "lado-tag", title: SIDES[k] }, k));
  const rows = el("div", { class: "lados" }, head);
  for (const opt of zone.options) {
    const row = el(
      "div",
      { class: "lado-row" },
      el("span", {}, el("strong", {}, opt.name), " ", el("span", { class: "vista" }, opt.view), el("br"), el("span", { class: "note" }, opt.hint))
    );
    for (const k of Object.keys(SIDES)) row.append(el("label", { class: "lado-cel" }, circle(zone, `${opt.id}:${k}`, `${opt.name}, lado ${SIDES[k].toLowerCase()}`)));
    rows.append(row);
  }
  return el("div", { class: "card" }, el("h3", {}, zone.name), el("p", { class: "how" }, zone.how), rows);
}

function render() {
  for (const section of SECTIONS) {
    form.append(el("h2", {}, section.title), el("p", { class: "lead" }, section.intro));
    for (const zone of section.zones) form.append(section.bilateral ? bilateralCard(zone) : zoneCard(zone));
  }
  form.append(el("p", { class: "note" }, "Si no marcas ninguna opción en una zona, se considera sin alteración."));
}

// Las zonas sin marcar cuentan como correctas, así que el resultado siempre está disponible.
function update() {
  const n = ALL_ZONES.filter((z) => (answers[z.id] || []).length).length;
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

  const fixes = document.getElementById("fixes");
  fixes.replaceChildren();
  const issues = selectedOptions(answers);
  if (!issues.length) {
    fixes.append(el("div", { class: "card" }, "¡Postura excelente! Mantén tu rutina de fuerza y movilidad."));
  }
  for (const opt of issues) {
    const list = el("ul", { class: "fix" });
    opt.fix.forEach((f) => list.append(el("li", {}, f)));
    fixes.append(el("div", { class: "card" }, el("h3", {}, optionLabel(opt)), list));
  }
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
