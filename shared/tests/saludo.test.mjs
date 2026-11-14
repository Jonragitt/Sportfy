import { test } from "node:test";
import assert from "node:assert/strict";
import { momento, fraseSaludo } from "../saludo.js";
import { limpiarNombre } from "../cuenta.js";

const a = (h) => new Date(2026, 10, 14, h, 0);
test("momento del día según la hora del reloj", () => {
  assert.equal(momento(a(3)), "madrugada");
  assert.equal(momento(a(8)), "manana");
  assert.equal(momento(a(16)), "tarde");
  assert.equal(momento(a(22)), "noche");
});
test("la frase lleva el nombre y cuadra con la hora", () => {
  assert.equal(fraseSaludo("Jonás", a(9), 0), "¡Buenos días, Jonás! A por el día.");
  assert.equal(fraseSaludo("Jonás", a(17), 0), "¡Buenas tardes, Jonás!");
  assert.match(fraseSaludo("Ana", a(23), 0.99), /Ana/);
});
test("el nombre se limpia y se pone en mayúscula", () => {
  assert.equal(limpiarNombre("  jonás   ramos "), "Jonás Ramos");
  assert.equal(limpiarNombre("   "), "");
});
import { tocaVoz, SIN_VOZ_MS } from "../saludo.js";
test("el audio no se repite hasta pasadas 2 horas del último", () => {
  const t = Date.UTC(2026, 10, 14, 9, 0);
  assert.equal(tocaVoz(0, t), true);
  assert.equal(tocaVoz(t, t + 30 * 60e3), false);
  assert.equal(tocaVoz(t, t + SIN_VOZ_MS - 1), false);
  assert.equal(tocaVoz(t, t + SIN_VOZ_MS), true);
});
import { audiosSaludo, claveNombre, clavesNombre } from "../saludo.js";
test("audios de Epachuko: primero con tu nombre, luego sin nombre", () => {
  assert.equal(claveNombre("  José  Luis "), "jose-luis");
  assert.deepEqual(clavesNombre("José Luis Pérez"), ["jose-luis-perez", "jose-luis", "jose"]);
  assert.deepEqual(audiosSaludo("Jonás", "manana", 0), ["voz/manana-jonas.mp3", "voz/manana-0.mp3"]);
  assert.deepEqual(audiosSaludo("", "madrugada", 0.9), ["voz/noche-1.mp3"]);
});
