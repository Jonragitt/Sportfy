import { test } from "node:test";
import assert from "node:assert/strict";
const mem = new Map();
globalThis.localStorage = { get length() { return mem.size; }, key: (i) => [...mem.keys()][i], getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { crearCodigo, leerCodigo, aplicarProgreso } = await import("../traspaso.js");

test("el código lleva el progreso de una web a otra", async () => {
  const origen = { "sportfy.evaluaciones": JSON.stringify([{ nota: 20 }]), "sportfy.racha": "{\"dias\":{}}" };
  const codigo = await crearCodigo(origen);
  assert.match(codigo, /^F45[ZJ]:/);
  const { progreso } = await leerCodigo(" " + codigo + "\n");
  assert.deepEqual(progreso, origen);
  localStorage.setItem("sportfy.viejo", "x"); localStorage.setItem("otra.cosa", "y");
  aplicarProgreso(progreso);
  assert.equal(localStorage.getItem("sportfy.viejo"), null);
  assert.equal(localStorage.getItem("otra.cosa"), "y");
  assert.equal(localStorage.getItem("sportfy.racha"), origen["sportfy.racha"]);
  await assert.rejects(leerCodigo("hola"));
});
