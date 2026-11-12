import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluar } from "../../modules/antropometria/antropometria.js";
import { perfilRutina } from "../analisis.js";
import { generarRutina, candidatos, minutosSesion, semanaDelCiclo, EJERCICIOS, MATERIAL } from "../rutina.js";

const base = { sexo: "hombre", edad: 35, altura: 178, peso: 92, grasa: 28, agua: 50, muscular: 34, edadMetabolica: 44, visceral: 13 };
const perfil = (desv = [], datos = base) => perfilRutina([{ ...evaluar(datos), fecha: "2026-10-01" }], [{ fecha: "2026-10-01", nota: 6, desviaciones: desv }]);

test("ids de ejercicios únicos", () => {
  assert.equal(new Set(EJERCICIOS.map((e) => e.id)).size, EJERCICIOS.length);
});

test("reparto según días y principal al inicio de cada sesión", () => {
  for (const dias of [2, 3, 4, 5, 6]) {
    const r = generarRutina(perfil(), { dias, minutos: 75 });
    assert.equal(r.sesiones.length, dias);
    for (const s of r.sesiones) {
      assert.ok(s.bloques.length >= 4, `día ${s.dia} con ${s.bloques.length} ejercicios`);
      assert.equal(s.bloques[0].tipo, "principal");
      assert.equal(new Set(s.bloques.map((b) => b.id)).size, s.bloques.length, "sin repetir ejercicio en la sesión");
    }
  }
});

test("la postura cambia la selección: evita press banca y añade hombro posterior", () => {
  const r = generarRutina(perfil([{ id: "hombrosAntepulsion" }, { id: "cabezaAnteriorizada" }]), { dias: 4, minutos: 90 });
  const ids = r.sesiones.flatMap((s) => s.bloques.map((b) => b.id));
  assert.ok(!ids.includes("pressBanca"));
  assert.ok(r.sesiones.filter((s) => s.tipo === "torso").every((s) => s.bloques.some((b) => b.hueco === "hombroPost")));
  assert.ok(candidatos("sentadilla", { material: MATERIAL.gimnasio.incluye, nivelNum: 1, patrones: new Set(["rodillasDentro"]), objetivo: "perdidaGrasa" })[0].corrige.includes("rodillasDentro"));
});

test("material: en casa solo ejercicios de casa", () => {
  const r = generarRutina(perfil(), { dias: 3, material: "casa", minutos: 60 });
  const ids = new Set(r.sesiones.flatMap((s) => s.bloques.map((b) => b.id)));
  for (const id of ids) assert.ok(EJERCICIOS.find((e) => e.id === id).eq.includes("casa"), id);
});

test("la sesión cabe en el tiempo elegido", () => {
  for (const minutos of [45, 60]) {
    const r = generarRutina(perfil([{ id: "sohValgo:D" }]), { dias: 3, minutos });
    for (const s of r.sesiones) assert.ok(minutosSesion(s) <= minutos + 2, `${s.minutos} > ${minutos}`);
  }
});

test("lado débil y periodización", () => {
  const r = generarRutina(perfil([{ id: "slbCaidaPelvis:I" }]), { dias: 3, semana: 4 });
  assert.equal(r.ladoDebil, "I");
  assert.ok(r.sesiones.some((s) => s.bloques.some((b) => b.lado?.includes("izquierdo"))));
  assert.equal(r.semana.nombre, "Descarga");
  assert.equal(semanaDelCiclo("2026-01-01", new Date("2026-01-20")), 3);
  assert.equal(semanaDelCiclo("2026-01-01", new Date("2026-01-30")), 1);
});

test("ganar músculo: series y reps de hipertrofia", () => {
  const r = generarRutina(perfil([], { ...base, peso: 68, grasa: 15, muscular: 31, visceral: 4, edadMetabolica: 30 }), { dias: 4 });
  assert.equal(r.objetivo.id, "ganarMusculo");
  assert.equal(r.sesiones[0].bloques[0].reps, "6–8");
});
