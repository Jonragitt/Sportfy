import { test } from "node:test";
import assert from "node:assert/strict";
import { cambiosPendientes, huella } from "../cuenta.js";

test("detecta qué claves subir y cuáles borrar en la nube", () => {
  const local = { "sportfy.a": "1", "sportfy.b": "nuevo" };
  const hashes = { "sportfy.a": huella("1"), "sportfy.b": huella("viejo"), "sportfy.c": huella("x") };
  assert.deepEqual(cambiosPendientes(local, hashes), { subir: ["sportfy.b"], borrar: ["sportfy.c"] });
  assert.deepEqual(cambiosPendientes(local, {}).subir.sort(), ["sportfy.a", "sportfy.b"]);
  assert.notEqual(huella("ab"), huella("ba"));
});
