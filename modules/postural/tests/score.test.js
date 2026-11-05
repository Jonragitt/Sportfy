import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_ITEMS, computeScore } from "../tests.js";

const all = (v) => Object.fromEntries(ALL_ITEMS.map((i) => [i.id, v]));

test("todo correcto da 100", () => assert.equal(computeScore(all(2)), 100));
test("todo marcado da 0", () => assert.equal(computeScore(all(0)), 0));
test("todo leve da 50", () => assert.equal(computeScore(all(1)), 50));
test("sin respuestas da null", () => assert.equal(computeScore({}), null));
test("cada ítem tiene 3 niveles y ejercicios", () => {
  for (const i of ALL_ITEMS) {
    assert.equal(i.levels.length, 3, i.id);
    assert.ok(i.fix.length > 0, i.id);
  }
  assert.equal(new Set(ALL_ITEMS.map((i) => i.id)).size, ALL_ITEMS.length);
});
