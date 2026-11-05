import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_ITEMS, computeScore } from "../tests.js";

const all = (v) => Object.fromEntries(ALL_ITEMS.map((i) => [i.id, v]));

test("todo correcto da 10", () => assert.equal(computeScore(all(2)), 10));
test("todo marcado da 0", () => assert.equal(computeScore(all(0)), 0));
test("todo leve da 5", () => assert.equal(computeScore(all(1)), 5));
test("sin respuestas da null", () => assert.equal(computeScore({}), null));
test("cada ítem tiene 3 niveles y ejercicios", () => {
  for (const i of ALL_ITEMS) {
    assert.equal(i.levels.length, 3, i.id);
    assert.ok(i.fix.length > 0, i.id);
  }
  assert.equal(new Set(ALL_ITEMS.map((i) => i.id)).size, ALL_ITEMS.length);
});

test("panel suma /25 y acepta formatos antiguos", async () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) };
  const { saveScore, totalScore, pointsFor } = await import("../../../shared/scores.js");
  saveScore("postural", 8);
  store["sportfy.scores"] = JSON.stringify({ ...JSON.parse(store["sportfy.scores"]), antropometria: { score: 11, max: 15 } });
  assert.deepEqual(totalScore(), { points: 19, max: 25, done: 2, complete: true });
  assert.equal(pointsFor("antropometria", { score: 60 }), 9); // sin max: /100
  assert.equal(pointsFor("postural", 50), 5);
});
