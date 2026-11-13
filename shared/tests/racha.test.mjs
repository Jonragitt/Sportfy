import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularRacha } from "../racha.js";

// Gym lunes (0), miércoles (2) y viernes (4). Hoy: viernes 13-11-2026.
const hoy = new Date(2026, 10, 13, 10);

test("pregunta por ayer si era día de gym y marca como fallo lo que venció", () => {
  const e = calcularRacha({ desde: "2026-11-02", dias: { "2026-11-02": "si", "2026-11-04": "si" } }, [0, 2, 3, 4], hoy);
  assert.equal(e.pendiente, "2026-11-12");             // jueves, aún dentro de plazo
  assert.equal(e.racha.dias["2026-11-06"], "fallo");   // viernes 6 sin contestar
  assert.equal(e.racha.dias["2026-11-11"], "fallo");   // miércoles 11: su plazo acabó el jueves a las 12
  assert.equal(e.actual, 0);
  assert.equal(e.mejor, 2);
  assert.equal(e.total, 2);
});

test("la racha cuenta días de gym seguidos y no la rompen hoy ni ayer sin contestar", () => {
  const dias = { "2026-11-02": "si", "2026-11-04": "si", "2026-11-06": "si", "2026-11-09": "si", "2026-11-11": "si" };
  const e = calcularRacha({ desde: "2026-11-01", dias }, [0, 2, 4], hoy);
  assert.equal(e.pendiente, null);  // jueves no es día de gym
  assert.equal(e.actual, 5);
  const f = calcularRacha({ desde: "2026-11-01", dias: { ...dias, "2026-11-06": "no" } }, [0, 2, 4], hoy);
  assert.equal(f.actual, 2);
  assert.equal(f.mejor, 2);
});

test("el primer día no pregunta ni marca fallos anteriores", () => {
  const e = calcularRacha(null, [0, 2, 3, 4], hoy);
  assert.equal(e.racha.desde, "2026-11-13");
  assert.equal(e.pendiente, null);
  assert.deepEqual(e.racha.dias, {});
});
