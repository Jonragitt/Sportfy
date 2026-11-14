import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularRacha, fichaActual } from "../racha.js";

// Gym lunes (0), miércoles (2) y viernes (4). Noviembre de 2026: lunes 9, miércoles 11, viernes 13.
const L_X_V = [0, 2, 4];
const h = (dia, hora, min = 0) => new Date(2026, 10, dia, hora, min);

test("la sesión falla a las 22:00 de su día, no a medianoche", () => {
  const r = { desde: "2026-11-09", dias: { "2026-11-09": "si" } };
  assert.equal(calcularRacha(r, L_X_V, h(11, 21, 59)).racha.dias["2026-11-11"], undefined);
  const e = calcularRacha(r, L_X_V, h(11, 22, 0));
  assert.equal(e.racha.dias["2026-11-11"], "fallo");
  assert.equal(e.cambiado, true);
  assert.equal(e.actual, 0);
  assert.equal(e.mejor, 1);
});

test("la racha cuenta días de gym seguidos y hoy sin hacer (en plazo) no la rompe", () => {
  const dias = { "2026-11-02": "si", "2026-11-04": "si", "2026-11-06": "si", "2026-11-09": "si", "2026-11-11": "si" };
  const e = calcularRacha({ desde: "2026-11-01", dias }, L_X_V, h(13, 10));
  assert.equal(e.actual, 5);
  assert.equal(e.total, 5);
  const f = calcularRacha({ desde: "2026-11-01", dias: { ...dias, "2026-11-06": "no" } }, L_X_V, h(13, 10));
  assert.equal(f.actual, 2);
  assert.equal(f.mejor, 2);
});

test("recuperar no devuelve la racha perdida: cuenta 1 y sigue desde ahí", () => {
  const dias = { "2026-11-02": "si", "2026-11-04": "si", "2026-11-06": "recuperado", "2026-11-09": "si" };
  const e = calcularRacha({ desde: "2026-11-01", dias }, L_X_V, h(10, 12));
  assert.equal(e.actual, 2);   // recuperado (1) + lunes 9
  assert.equal(e.mejor, 2);
  assert.equal(e.total, 4);
  assert.equal(e.estadoDia("2026-11-06"), "recuperado");
  assert.equal(e.estadoDia("2026-11-09"), "cumplido");
  assert.equal(e.estadoDia("2026-11-10"), "descanso");
  assert.equal(e.estadoDia("2026-11-11"), "futuro");
});

test("el primer día no marca fallos anteriores", () => {
  const e = calcularRacha(null, L_X_V, h(13, 10));
  assert.equal(e.racha.desde, "2026-11-13");
  assert.deepEqual(e.racha.dias, {});
  assert.equal(e.estadoDia("2026-11-13"), "pendiente");
});

test("ficha: hasta las 9:00 sigue el día anterior y a las 9:00 pasa al de hoy", () => {
  const r = { desde: "2026-11-09", dias: { "2026-11-11": "si" } };
  // Jueves 12 (reposo) a las 8:00: la del miércoles, hecha.
  assert.equal(fichaActual(r, L_X_V, h(12, 8)).estado, "hecha");
  // Jueves 12 a las 9:00: reposo y la del miércoles está hecha → no hay ficha.
  assert.equal(fichaActual(r, L_X_V, h(12, 9)), null);
  // Viernes 13 a las 8:59: aún no hay ficha nueva (el jueves fue reposo).
  assert.equal(fichaActual(r, L_X_V, h(13, 8, 59)), null);
  // Viernes 13 a las 9:00: la de hoy, pendiente, con plazo a las 22:00.
  const f = fichaActual(r, L_X_V, h(13, 9));
  assert.equal(f.dia, "2026-11-13");
  assert.equal(f.estado, "pendiente");
  assert.equal(f.plazo.getHours(), 22);
});

test("fallada con reposo detrás: la ficha se queda en rojo con Recuperado hasta recuperarla", () => {
  const r = { desde: "2026-11-09", dias: { "2026-11-09": "si" } };
  // Viernes 13 sin hacer → sábado 14 a mediodía sigue la del viernes, fallada y recuperable.
  const f = fichaActual(r, L_X_V, h(14, 12));
  assert.deepEqual([f.dia, f.estado, f.puedeRecuperar], ["2026-11-13", "fallada", true]);
  // Domingo 15 sigue igual.
  assert.equal(fichaActual(r, L_X_V, h(15, 20)).dia, "2026-11-13");
  // Lunes 16 a las 9:00 pasa a la del lunes aunque el viernes siga fallado.
  const l = fichaActual(r, L_X_V, h(16, 9));
  assert.deepEqual([l.dia, l.estado], ["2026-11-16", "pendiente"]);
  // Recuperada el sábado: ya no hay ficha ese fin de semana.
  assert.equal(fichaActual({ ...r, dias: { ...r.dias, "2026-11-13": "recuperado" } }, L_X_V, h(14, 12)), null);
});

test("fallada con gym al día siguiente: roja sin Recuperado y a las 9:00 pasa a la siguiente", () => {
  const dias = [0, 1]; // lunes y martes
  const r = { desde: "2026-11-09", dias: {} };
  const f = fichaActual(r, dias, h(9, 23));
  assert.deepEqual([f.dia, f.estado, f.puedeRecuperar], ["2026-11-09", "fallada", false]);
  assert.equal(fichaActual(r, dias, h(10, 8)).dia, "2026-11-09");
  assert.equal(fichaActual(r, dias, h(10, 9)).dia, "2026-11-10");
});
