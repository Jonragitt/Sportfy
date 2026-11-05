import { SECTIONS, ALL_ZONES, MAX_POINTS, computeScore, selectedOptions } from "./tests.js";
import { saveScore, getScores, scoreLabel } from "../../shared/scores.js";

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

function render() {
  for (const section of SECTIONS) {
    form.append(el("h2", {}, section.title), el("p", { class: "lead" }, section.intro));
    for (const zone of section.zones) {
      const options = el("div", { class: "options" });
      for (const opt of zone.options) {
        const input = el("input", { type: "checkbox", class: "circle", name: zone.id, value: opt.id });
        input.addEventListener("change", () => {
          answers[zone.id] = [...form.querySelectorAll(`input[name="${zone.id}"]:checked`)].map((i) => i.value);
          update();
        });
        options.append(
          el("label", {}, input, el("span", {}, el("strong", {}, opt.name), el("br"), el("span", { class: "note" }, opt.hint)))
        );
      }
      form.append(el("div", { class: "card" }, el("h3", {}, zone.name), el("p", { class: "how" }, zone.how), options));
    }
  }
  form.append(el("p", { class: "note" }, "Si no marcas ninguna opción en una zona, se considera sin alteración."));
}

function update() {
  const n = ALL_ZONES.filter((z) => (answers[z.id] || []).length).length;
  progress.textContent = n ? `${n} de ${ALL_ZONES.length} zonas con alteración` : "Sin alteraciones marcadas";
}

function showResult() {
  const score = computeScore(answers);
  saveScore("postural", score, { answers });
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
    fixes.append(el("div", { class: "card" }, el("h3", {}, `${opt.zone.name}: ${opt.name}`), list));
  }
  const result = document.getElementById("result");
  result.classList.remove("hidden");
  result.scrollIntoView({ behavior: "smooth" });
}

function restore() {
  const saved = getScores().postural?.detail?.answers;
  if (!saved) return;
  for (const zone of ALL_ZONES) {
    const ids = Array.isArray(saved[zone.id]) ? saved[zone.id] : [];
    for (const id of ids) {
      const input = form.querySelector(`input[name="${zone.id}"][value="${id}"]`);
      if (input) input.checked = true;
    }
    answers[zone.id] = ids.filter((id) => zone.options.some((o) => o.id === id));
  }
  update();
}

render();
restore();
update();
calcBtn.disabled = false;
calcBtn.addEventListener("click", showResult);
