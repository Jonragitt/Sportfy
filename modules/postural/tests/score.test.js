import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_ZONES, ALL_OPTIONS, computeScore, selectedOptions, optionLabel } from "../tests.js";

test("sin alteraciones da 10", () => assert.equal(computeScore({}), 10));

test("todas las zonas alteradas da 0", () => {
  const all = Object.fromEntries(ALL_ZONES.map((z) => [z.id, [z.options[0].id]]));
  assert.equal(computeScore(all), 0);
});

test("una zona con dos opciones cuenta una sola vez", () => {
  const one = computeScore({ hombros: ["hombrosAntepulsion"] }); // 12 de 13 zonas
  const two = computeScore({ hombros: ["hombrosAntepulsion", "hombrosRetropulsion"] });
  assert.equal(one, two);
  assert.equal(one, 9.2);
});

test("planos sagital y frontal tienen las zonas pedidas", () => {
  assert.deepEqual(ALL_ZONES.map((z) => z.id), [
    "cabeza", "hombros", "cadera", "rodilla", "pie",
    "acromion", "escapulas", "crestas", "rodillaFrontal", "tobillo",
    "sohPies", "sohRodillas", "sohCLP",
  ]);
});

test("sentadilla profunda: lados I/D", () => {
  const answers = { sohRodillas: ["sohValgo:I", "sohValgo:D"], sohPies: ["sohCargaAsimetrica:D"] };
  const sel = selectedOptions(answers);
  assert.deepEqual(sel.map((o) => [o.id, o.sides]), [["sohCargaAsimetrica", ["D"]], ["sohValgo", ["I", "D"]]]);
  assert.equal(optionLabel(sel[1]), "Rodillas: Valgo (I, D)");
  assert.equal(computeScore(answers), Math.round((11 / 13) * 100) / 10);
});

test("cada opción tiene ejercicios y los ids son únicos", () => {
  for (const o of ALL_OPTIONS) assert.ok(o.fix.length > 0, o.id);
  assert.equal(new Set(ALL_OPTIONS.map((o) => o.id)).size, ALL_OPTIONS.length);
  assert.deepEqual(selectedOptions({ pie: ["navicularDrop"] }).map((o) => o.id), ["navicularDrop"]);
});

test("panel suma /25 y acepta formatos antiguos", async () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) };
  const { saveScore, totalScore, pointsFor } = await import("../../../shared/scores.js");
  saveScore("postural", 8);
  store["sportfy.scores"] = JSON.stringify({ ...JSON.parse(store["sportfy.scores"]), antropometria: { score: 11, max: 15 } });
  assert.deepEqual(totalScore(), { points: 19, max: 25, done: 2, complete: true });
  assert.equal(pointsFor("antropometria", { score: 60 }), 9);
  assert.equal(pointsFor("postural", 50), 5);
});
