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
