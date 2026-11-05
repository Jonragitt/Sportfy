import { SECTIONS, ALL_ITEMS, computeScore } from "./tests.js";
import { saveScore, getScores, scoreLabel } from "../../shared/scores.js";

const LEVEL_TAG = ["Marcada", "Leve", "Correcto"];
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
    for (const item of section.items) {
      const options = el("div", { class: "options", role: "radiogroup" });
      // Mostrar de mejor a peor: correcto, leve, marcada
      for (const value of [2, 1, 0]) {
        const input = el("input", { type: "radio", name: item.id, value: String(value) });
        input.addEventListener("change", () => {
          answers[item.id] = value;
          update();
        });
        options.append(
          el("label", {}, input, el("span", {}, el("span", { class: `tag l${value}` }, LEVEL_TAG[value]), " ", item.levels[value]))
        );
      }
      form.append(el("div", { class: "card" }, el("h3", {}, item.name), el("p", { class: "how" }, item.how), options));
    }
  }
}

function update() {
  const n = Object.keys(answers).length;
  progress.textContent = `${n} / ${ALL_ITEMS.length} respondidas`;
  calcBtn.disabled = n < ALL_ITEMS.length;
}

function showResult() {
  const score = computeScore(answers);
  saveScore("postural", score, { answers });
  const rounded = Math.round(score);
  document.getElementById("scoreValue").textContent = `${rounded} / 100`;
  document.getElementById("scoreLabel").textContent = scoreLabel(rounded);
  document.getElementById("scoreBar").style.width = `${rounded}%`;

  const fixes = document.getElementById("fixes");
  fixes.replaceChildren();
  const issues = ALL_ITEMS.filter((i) => answers[i.id] < 2).sort(
    (a, b) => answers[a.id] - answers[b.id] || b.weight - a.weight
  );
  if (!issues.length) {
    fixes.append(el("div", { class: "card" }, "¡Postura excelente! Mantén tu rutina de fuerza y movilidad."));
  }
  for (const item of issues) {
    const v = answers[item.id];
    const list = el("ul", { class: "fix" });
    item.fix.forEach((f) => list.append(el("li", {}, f)));
    fixes.append(
      el("div", { class: "card" }, el("h3", {}, item.name, " ", el("span", { class: `tag l${v}` }, LEVEL_TAG[v])), list)
    );
  }
  const result = document.getElementById("result");
  result.classList.remove("hidden");
  result.scrollIntoView({ behavior: "smooth" });
}

function restore() {
  const saved = getScores().postural?.detail?.answers;
  if (!saved) return;
  for (const [id, value] of Object.entries(saved)) {
    const input = form.querySelector(`input[name="${id}"][value="${value}"]`);
    if (input) {
      input.checked = true;
      answers[id] = value;
    }
  }
  update();
}

render();
restore();
calcBtn.addEventListener("click", showResult);
