import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluar } from "../../modules/antropometria/antropometria.js";
import { sincronizar, modo, evaluaciones, repetirEvaluacion, cancelarRepeticion, reiniciarTodo, editarDatos, compararEvaluaciones, rondaEnCurso } from "../evaluaciones.js";

function memoria() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; }, _m: m };
}
const base = { sexo: "hombre", edad: 35, altura: 178, peso: 92, grasa: 28, agua: 50, muscular: 34, edadMetabolica: 44, visceral: 13 };
const push = (s, k, r) => s.setItem(k, JSON.stringify([...(JSON.parse(s.getItem(k)) || []), r]));
const antro = (s, datos, fecha) => push(s, "sportfy.antropometria.historial", { ...evaluar(datos), fecha });
const post = (s, nota, fecha, desv = []) => push(s, "sportfy.postural.historial", { fecha, nota, max: 10, desviaciones: desv });

test("pasa a modo plan solo con las dos evaluaciones confirmadas", () => {
  const s = memoria();
  assert.equal(modo(s), "evaluacion");
  antro(s, base, "2026-01-01T10:00:00Z");
  assert.equal(sincronizar(s), null);
  post(s, 6, "2026-01-01T11:00:00Z");
  assert.ok(sincronizar(s));
  assert.equal(modo(s), "plan");
  assert.equal(sincronizar(s), null, "no duplica el apartado");
  assert.equal(evaluaciones(s).length, 1);
});

test("repetir conserva los apartados y solo cierra con datos nuevos", () => {
  const s = memoria();
  antro(s, base, "2026-01-01T10:00:00Z"); post(s, 6, "2026-01-01T11:00:00Z", [{ id: "a", nombre: "A" }]); sincronizar(s);
  repetirEvaluacion(s, new Date("2026-02-10T00:00:00Z"));
  assert.equal(modo(s), "evaluacion");
  antro(s, { ...base, peso: 89, grasa: 26 }, "2026-02-10T10:00:00Z");
  assert.equal(sincronizar(s), null, "falta la postural nueva");
  post(s, 8, "2026-02-10T11:00:00Z", [{ id: "b", nombre: "B" }]);
  assert.ok(sincronizar(s));
  assert.equal(modo(s), "plan");
  assert.equal(rondaEnCurso(s), null);
  const lista = evaluaciones(s);
  assert.equal(lista.length, 2);
  const c = compararEvaluaciones(lista.map((e) => e.id), s);
  const peso = c.filas.find((f) => f.id === "peso");
  assert.deepEqual(peso.valores, [92, 89]);
  assert.equal(peso.cambios[1].mejora, true);
  assert.deepEqual(c.postural.corregidas.map((d) => d.id), ["a"]);
  assert.equal(compararEvaluaciones([lista[0].id], s), null, "hacen falta 2 o más");
});

test("cancelar repetición vuelve al plan; reiniciar borra todo", () => {
  const s = memoria();
  antro(s, base, "2026-01-01T10:00:00Z"); post(s, 6, "2026-01-01T11:00:00Z"); sincronizar(s);
  repetirEvaluacion(s); cancelarRepeticion(s);
  assert.equal(modo(s), "plan");
  s.setItem("otra.app", "1");
  reiniciarTodo(s);
  assert.equal(modo(s), "evaluacion");
  assert.equal(s._m.size, 1, "solo quedan claves ajenas a Forty5");
});

test("editar datos físicos recalcula la antropometría", () => {
  const s = memoria();
  antro(s, base, "2026-01-01T10:00:00Z"); post(s, 6, "2026-01-01T11:00:00Z"); sincronizar(s);
  const id = evaluaciones(s)[0].id;
  const ev = editarDatos(id, { peso: 80, grasa: 16, visceral: 5, edadMetabolica: 33, agua: 58 }, s);
  assert.ok(ev.antro.nota > evaluaciones(s)[0].antro.nota - 0.01);
  assert.equal(JSON.parse(s.getItem("sportfy.antropometria.historial"))[0].datos.peso, 80);
  assert.equal(JSON.parse(s.getItem("sportfy.scores")).antropometria.score, ev.antro.nota);
});
