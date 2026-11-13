import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluar } from "../../modules/antropometria/antropometria.js";
import { analizar, perfilRutina, objetivoRutina, analizarAntropometria, series, comparar, evolucionPostural, guardarPerfilRutina, ANALISIS_KEY } from "../analisis.js";
import { metabolismoBasal, calcularPlan, ajusteEvolucion } from "../plan.js";

const base = { sexo: "hombre", edad: 35, altura: 178, peso: 92, grasa: 28, agua: 50, muscular: 34, metabolismo: 1850, edadMetabolica: 44, visceral: 13 };
const medir = (datos, fecha) => ({ ...evaluar(datos), fecha });

test("analiza fuertes, débiles y objetivo de pérdida de grasa", () => {
  const a = analizarAntropometria(medir(base, "2026-01-01"));
  assert.ok(a.debiles.some((p) => p.id === "grasa"));
  assert.equal(objetivoRutina(a).id, "perdidaGrasa");
});

test("objetivo ganar músculo con grasa correcta y músculo bajo", () => {
  const a = analizarAntropometria(medir({ ...base, peso: 68, grasa: 15, muscular: 31, visceral: 4, edadMetabolica: 30 }, "2026-01-01"));
  assert.equal(objetivoRutina(a).id, "ganarMusculo");
});

test("agrupa desviaciones posturales en patrones y detecta el lado", () => {
  const post = [{ fecha: "2026-01-02", nota: 6.3, max: 10, desviaciones: [
    { id: "cabezaAnteriorizada", nombre: "Cabeza: Cabeza anteriorizada" },
    { id: "hombrosAntepulsion", nombre: "Hombros: Antepulsión" },
    { id: "sohValgo:D", nombre: "Rodillas: Valgo (D)" },
  ] }];
  const r = analizar([medir(base, "2026-01-01")], post);
  assert.equal(r.postural.patrones[0].id, "cruzadoSuperior");
  assert.deepEqual(r.postural.patrones.find((p) => p.id === "rodillasDentro").unLado, ["D"]);
  assert.ok(r.total.completa);
  assert.ok(r.prioridades.length > 0 && r.prioridades.length <= 4);
});

test("metabolismo basal con masa magra y báscula", () => {
  const b = metabolismoBasal(base);
  assert.equal(b.masaMagra, 66.2);
  assert.match(b.metodo, /Katch/);
  assert.ok(b.kcal > 1700 && b.kcal < 2000);
  // báscula absurda: se ignora
  assert.doesNotMatch(metabolismoBasal({ ...base, metabolismo: 3500 }).metodo, /báscula/);
});

test("plan en déficit con macros coherentes", () => {
  const p = calcularPlan(base, "perdidaGrasa");
  assert.ok(p.kcal < p.mantenimiento && p.kcal >= p.basal.kcal);
  const kcalMacros = p.macros.proteina * 4 + p.macros.grasa * 9 + p.macros.hidratos * 4;
  assert.ok(Math.abs(kcalMacros - p.kcal) < 40, `macros ${kcalMacros} vs ${p.kcal}`);
  assert.ok(p.macros.proteina >= 150 && p.macros.proteina <= 200);
});

test("reajusta kcal si no se pierde peso al ritmo previsto", () => {
  const h = [medir(base, "2026-01-01"), medir({ ...base, peso: 91.9 }, "2026-02-05")];
  const aj = ajusteEvolucion(h, "perdidaGrasa");
  assert.ok(aj.kcal < 0);
  const rapido = [medir(base, "2026-01-01"), medir({ ...base, peso: 86 }, "2026-02-05")];
  assert.ok(ajusteEvolucion(rapido, "perdidaGrasa").kcal > 0);
  const sinTiempo = [medir(base, "2026-01-01"), medir({ ...base, peso: 91 }, "2026-01-05")];
  assert.equal(ajusteEvolucion(sinTiempo, "perdidaGrasa").kcal, 0);
});

test("evolución: series, comparación y alteraciones corregidas", () => {
  const h = [medir(base, "2026-01-01"), medir({ ...base, peso: 89, grasa: 26 }, "2026-02-05")];
  const s = series(h, []);
  assert.equal(s.peso.length, 2);
  assert.equal(comparar(s.peso, true).mejora, true);
  const ev = evolucionPostural([
    { fecha: "2026-01-01", nota: 5, desviaciones: [{ id: "a" }, { id: "b" }] },
    { fecha: "2026-02-01", nota: 7, desviaciones: [{ id: "b" }, { id: "c" }] },
  ]);
  assert.deepEqual(ev.corregidas.map((d) => d.id), ["a"]);
  assert.deepEqual(ev.nuevas.map((d) => d.id), ["c"]);
});

test("perfil para la rutina se guarda en localStorage", () => {
  const store = {};
  const storage = { setItem: (k, v) => (store[k] = v) };
  const perfil = perfilRutina([medir(base, "2026-01-01")], [{ fecha: "2026-01-02", nota: 8, desviaciones: [{ id: "slbTiembla:I", nombre: "x" }] }], { actividad: "activa" });
  guardarPerfilRutina(perfil, storage);
  const g = JSON.parse(store[ANALISIS_KEY]);
  assert.equal(g.objetivo.id, "perdidaGrasa");
  assert.equal(g.plan.actividad, "activa");
  assert.equal(g.correctivos[0].patron, "gluteoDebil");
  assert.deepEqual(g.correctivos[0].ladoDebil, ["I"]);
  assert.equal(perfilRutina([], []), null);
});

test("hombro bajo y cresta alta: lado y correctivos concretos", async () => {
  const { analizarPostural, correctivosPorLado } = await import("../analisis.js");
  const r = analizarPostural({ fecha: "2026-11-01T10:00:00Z", nota: 8, max: 10, desviaciones: [{ id: "acromionDerBajo", nombre: "x", nivel: 1 }, { id: "crestaDerAlta", nombre: "y", nivel: 1 }] });
  assert.deepEqual(r.patrones.find((p) => p.id === "asimetria").unLado, ["D", "D"]);
  const c = correctivosPorLado(["acromionIzqBajo", "crestaDerAlta"]);
  assert.match(c.fortalecer[0], /lado izquierdo/);
  assert.match(c.movilizar[0], /lado derecho/);
  assert.match(c.movilizar[1], /cuadrado lumbar \(lado derecho\)/);
  assert.equal(c.notas.length, 2);
});
