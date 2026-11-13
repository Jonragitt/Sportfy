import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularDieta, ejemplo } from "../dieta.js";
import { calcularPlan } from "../plan.js";

const plan = calcularPlan({ sexo: "hombre", edad: 35, altura: 178, peso: 92, grasa: 28 }, "perdidaGrasa", { diasFuerza: 3, diasCardio: 3 });

test("la media semanal de hidratos coincide con el plan y la proteína es fija", () => {
  const d = calcularDieta(plan, { diasEntreno: [0, 2, 4] });
  const media = (d.diaEntreno.hidratos * 3 + d.diaDescanso.hidratos * 4) / 7;
  assert.ok(Math.abs(media - plan.macros.hidratos) <= 5);
  assert.ok(d.diaEntreno.hidratos > d.diaDescanso.hidratos);
  assert.equal(d.diaEntreno.proteina, plan.macros.proteina);
  assert.ok(Math.abs(d.diaEntreno.kcal - plan.kcal) <= 40 && Math.abs(d.diaDescanso.kcal - plan.kcal) <= 40);
});

test("reparte en comidas que suman el día y da raciones", () => {
  const d = calcularDieta(plan, { diasEntreno: [1, 3], comidas: 4 });
  assert.equal(d.diaEntreno.comidas.length, 4);
  const suma = d.diaEntreno.comidas.reduce((s, c) => s + c.kcal, 0);
  assert.ok(Math.abs(suma - d.diaEntreno.kcal) <= 30);
  assert.ok(d.diaEntreno.comidas.every((c) => c.ejemplo.length >= 2));
  assert.match(ejemplo("Comida", { proteina: 40, hidratos: 60, grasa: 15 })[0].texto, /g$/);
});

test("sin días de entreno no hay ciclado y las condiciones añaden consejos", () => {
  const d = calcularDieta(plan, { condiciones: ["hipertension", "lumbar"] });
  assert.equal(d.ciclado, false);
  assert.deepEqual(d.salud.map((s) => s.id), ["hipertension"]);
});

test("las condiciones de salud recalculan kcal y macros", async () => {
  const { ajustarPorSalud } = await import("../dieta.js");
  const diab = calcularDieta(plan, { diasEntreno: [0, 2, 4], condiciones: ["diabetes"], comidas: 4, peso: 92 });
  assert.equal(diab.ciclado, false);
  assert.equal(diab.comidas, 5);
  assert.ok(diab.macros.hidratos * 4 <= diab.kcal * 0.4 + 20);
  assert.ok(Math.abs(diab.macros.proteina * 4 + diab.macros.hidratos * 4 + diab.macros.grasa * 9 - diab.kcal) <= 40);
  const emb = ajustarPorSalud(plan, ["embarazo"], 70);
  assert.ok(emb.plan.kcal >= plan.mantenimiento + 290);
  const card = ajustarPorSalud(plan, ["cardiaco"], 92);
  assert.ok(card.plan.macros.grasa * 9 <= card.plan.kcal * 0.3 + 45);
  const osteo = ajustarPorSalud(plan, ["osteoporosis"], 92);
  assert.ok(osteo.plan.macros.proteina >= 110 && osteo.plan.kcal >= plan.mantenimiento - 410);
  assert.equal(ajustarPorSalud(plan, ["lumbar"], 92).cambios.length, 0);
});

test("cada opción de comida da raciones que cuadran con sus macros y se puede elegir", async () => {
  const { OPCIONES, ALIMENTOS, opcionesDe } = await import("../dieta.js");
  const m = { proteina: 40, hidratos: 60, grasa: 18 };
  for (const ops of Object.values(OPCIONES)) for (const o of ops) {
    const t = { p: 0, h: 0, g: 0 };
    for (const x of ejemplo(o, m)) for (const k of "phg") t[k] += x.gramos * ALIMENTOS[x.id][k] / 100;
    const kcal = t.p * 4 + t.h * 4 + t.g * 9;
    assert.ok(Math.abs(kcal - (40 * 4 + 60 * 4 + 18 * 9)) < 120, `${o.id}: ${Math.round(kcal)} kcal`);
  }
  const d = calcularDieta(plan, { eleccion: { Desayuno: "porridge" }, dia: 2 });
  const des = d.diaDescanso.comidas[0];
  assert.equal(des.opcion, "porridge");
  assert.equal(des.auto, false);
  assert.ok(des.opciones.length >= 3);
  // Sin elección, la opción rota según el día.
  const lunes = calcularDieta(plan, { dia: 0 }).diaDescanso.comidas[2].opcion;
  const martes = calcularDieta(plan, { dia: 1 }).diaDescanso.comidas[2].opcion;
  assert.notEqual(lunes, martes);
  // Con hipertensión no se proponen fiambres.
  assert.ok(opcionesDe("Media mañana", ["hipertension"]).every((o) => o.id !== "bocadillo"));
});
