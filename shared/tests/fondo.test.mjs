import { test } from "node:test";
import assert from "node:assert/strict";
import { FOTOS, tipoDelDia, fotosDelDia, indiceFoto, CADA_MS } from "../fondo.js";

const rutina = {
  diasSemana: [0, 2, 4],
  sesiones: [{ diaSemana: 0, tipo: "torso" }, { diaSemana: 2, tipo: "pierna" }, { diaSemana: 4, tipo: "fullA" }],
  cardioExtra: { diasSemana: [5] },
};

test("el fondo sigue lo que toca según el motor", () => {
  assert.equal(FOTOS.length, 10);
  assert.equal(tipoDelDia(rutina, 0), "torso");
  assert.equal(tipoDelDia(rutina, 2), "pierna");
  assert.equal(tipoDelDia(rutina, 4), "full");
  assert.equal(tipoDelDia(rutina, 5), "cardio");
  assert.equal(tipoDelDia(rutina, 6), "descanso");
  assert.equal(tipoDelDia(null, 1), null);
  assert.ok(fotosDelDia("pierna").every((f) => ["pierna", "general"].includes(f.tipo)));
  assert.equal(fotosDelDia(null).length, 10);
});

test("cambia cada 3 minutos desde que se abrió", () => {
  assert.equal(CADA_MS, 180000);
  assert.equal(indiceFoto(0, 179999, 4), 0);
  assert.equal(indiceFoto(0, 180000, 4), 1);
  assert.equal(indiceFoto(0, 4 * 180000, 4), 0);
});

test("cada vez que se entra empieza con otra foto", async () => {
  const { saltoInicial } = await import("../fondo.js");
  const lista = fotosDelDia("pierna");
  assert.notEqual(lista[saltoInicial(lista, lista[0].id, 0)].id, lista[0].id);
  assert.equal(saltoInicial(lista, "otra", 0.99), lista.length - 1);
  assert.equal(indiceFoto(0, 180000, 4, 3), 0);
});
