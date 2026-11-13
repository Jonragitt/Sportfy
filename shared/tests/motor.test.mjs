import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluar } from "../../modules/antropometria/antropometria.js";
import { calcularTodo, necesitaPreferencias, guardarPreferencias, recomendacionDias } from "../motor.js";
import { sincronizar } from "../evaluaciones.js";

function memoria() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
}
const base = { sexo: "mujer", edad: 32, altura: 165, peso: 74, grasa: 34, agua: 47, muscular: 26, edadMetabolica: 38, visceral: 8 };
const apartados = [{ id: "ev-1", fecha: "2026-10-01", antro: { ...evaluar(base), fecha: "2026-10-01" }, postural: { fecha: "2026-10-01", nota: 7, desviaciones: [{ id: "hombrosAntepulsion" }] } }];
const ids = (r) => r.sesiones.flatMap((s) => s.bloques.map((b) => b.id));

test("reparte la rutina en los días de la semana elegidos", () => {
  const { rutina } = calcularTodo({ apartados, prefs: { diasSemana: [1, 3, 5] } });
  assert.deepEqual(rutina.sesiones.map((s) => s.diaNombre), ["Martes", "Jueves", "Sábado"]);
  assert.deepEqual(rutina.cardioExtra.diasSemana.every((d) => ![1, 3, 5].includes(d)), true);
});

test("más o menos días de los recomendados reajusta el reparto", () => {
  const rec = calcularTodo({ apartados }).recomendacion;
  for (const dias of [[0], [0, 1], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5, 6]]) {
    const { rutina } = calcularTodo({ apartados, prefs: { diasSemana: dias } });
    assert.equal(rutina.sesiones.length, Math.min(6, dias.length));
  }
  assert.equal(calcularTodo({ apartados, prefs: { diasSemana: [0, 1] } }).rutina.reparto.nombre, "Torso / Pierna 2 días");
  assert.ok(calcularTodo({ apartados, prefs: { diasSemana: [0, 1, 2, 3, 4, 5, 6] } }).rutina.recuperacionActiva);
  assert.ok(rec.dias >= 3);
});

test("el foco añade trabajo y series a esa zona", () => {
  const sin = calcularTodo({ apartados, prefs: { diasSemana: [0, 2, 4], minutos: 90 } }).rutina;
  const con = calcularTodo({ apartados, prefs: { diasSemana: [0, 2, 4], minutos: 90, foco: ["gluteo"] } }).rutina;
  assert.ok((con.volumen.gluteo ?? 0) > (sin.volumen.gluteo ?? 0));
  const brazo = calcularTodo({ apartados, prefs: { diasSemana: [0, 2, 4], minutos: 90, foco: ["brazo"] } }).rutina;
  assert.ok((brazo.volumen.brazos ?? 0) > 0);
});

test("las condiciones de salud quitan ejercicios de riesgo y suben el RIR", () => {
  const r = calcularTodo({ apartados, prefs: { diasSemana: [0, 1, 3, 4], condiciones: ["lumbar", "hipertension"] } }).rutina;
  for (const id of ["pesoMuerto", "remoBarra", "sentadillaBarra", "ruedaAbdominal"]) assert.ok(!ids(r).includes(id), id);
  assert.ok(r.sesiones.every((s) => s.bloques.every((b) => b.rir == null || b.rir >= 2)));
  assert.equal(r.condiciones.length, 2);
});

test("embarazo: sin déficit calórico y máximo 3 días recomendados", () => {
  const t = calcularTodo({ apartados, prefs: { diasSemana: [0, 2, 4], condiciones: ["embarazo"] } });
  assert.ok(t.perfil.plan.kcal >= t.perfil.plan.mantenimiento);
  assert.ok(t.recomendacion.dias <= 3);
  assert.ok(!ids(t.rutina).includes("pressBanca"));
});

test("el plan usa los días reales para el gasto", () => {
  const a = calcularTodo({ apartados, prefs: { diasSemana: [0, 3] } }).perfil.plan;
  const b = calcularTodo({ apartados, prefs: { diasSemana: [0, 1, 2, 3, 4, 5] } }).perfil.plan;
  assert.ok(b.mantenimiento > a.mantenimiento);
  assert.equal(recomendacionDias({ diasFuerza: 4, objetivo: { id: "recomposicion" } }, ["cardiaco"]).dias, 3);
});

test("pide preferencias tras cada evaluación completa", () => {
  const s = memoria();
  s.setItem("sportfy.antropometria.historial", JSON.stringify([apartados[0].antro]));
  s.setItem("sportfy.postural.historial", JSON.stringify([apartados[0].postural]));
  sincronizar(s);
  assert.equal(necesitaPreferencias(s), true);
  guardarPreferencias({ diasSemana: [0, 2, 4] }, s);
  assert.equal(necesitaPreferencias(s), false);
});
