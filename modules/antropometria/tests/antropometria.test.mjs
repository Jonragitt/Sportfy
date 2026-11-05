import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  imc, grasaPliegues, grasaMarina, puntuarTramos, describirTramos, evaluar, guardarNotaGlobal, calificacion, BAREMOS,
} from '../antropometria.js';

test('IMC', () => {
  assert.equal(imc(70, 175), 22.9);
  assert.equal(imc(100, 170), 34.6);
});

test('Tramos de IMC (OMS)', () => {
  const t = BAREMOS.imc.tramos;
  assert.deepEqual(puntuarTramos(22, t), { puntos: 3, categoria: 'Normopeso' });
  assert.equal(puntuarTramos(24.99, t).puntos, 3);
  assert.equal(puntuarTramos(25, t).puntos, 2);
  assert.equal(puntuarTramos(28, t).puntos, 1);
  assert.equal(puntuarTramos(31, t).puntos, 0);
  assert.equal(puntuarTramos(17.5, t).puntos, 2);
  assert.equal(puntuarTramos(15, t).puntos, 0);
});

test('Tramos de % grasa (ACE) según sexo', () => {
  assert.equal(puntuarTramos(12, BAREMOS.grasa.hombre).categoria, 'Atleta');
  assert.equal(puntuarTramos(20, BAREMOS.grasa.hombre).puntos, 2);
  assert.equal(puntuarTramos(26, BAREMOS.grasa.hombre).puntos, 0);
  assert.equal(puntuarTramos(20, BAREMOS.grasa.mujer).puntos, 3);
  assert.equal(puntuarTramos(10, BAREMOS.grasa.mujer).puntos, 1);
});

test('Tramos de grasa visceral', () => {
  assert.equal(puntuarTramos(90, BAREMOS.visceralCintura.hombre).puntos, 3);
  assert.equal(puntuarTramos(96, BAREMOS.visceralCintura.hombre).puntos, 2);
  assert.equal(puntuarTramos(105, BAREMOS.visceralCintura.hombre).puntos, 1);
  assert.equal(puntuarTramos(85, BAREMOS.visceralCintura.mujer).puntos, 2);
  assert.equal(puntuarTramos(14, BAREMOS.visceralNivel.tramos).categoria, 'Elevado');
});

test('describirTramos genera rangos legibles', () => {
  const d = describirTramos(BAREMOS.visceralCintura.hombre, 'cm');
  assert.deepEqual(d.map((x) => x.rango), ['< 94 cm', '94–102 cm', '102–110 cm', '≥ 110 cm']);
});

test('Jackson-Pollock 3 pliegues', () => {
  const h = grasaPliegues('hombre', 30, [20, 25, 15]);
  assert.ok(h > 16 && h < 19, `hombre ${h}`);
  const m = grasaPliegues('mujer', 30, [20, 20, 20]);
  assert.ok(m > 22 && m < 26, `mujer ${m}`);
});

test('Fórmula de la Marina', () => {
  const h = grasaMarina('hombre', 178, 38, 85);
  assert.ok(h > 14 && h < 19, `hombre ${h}`);
  const m = grasaMarina('mujer', 165, 33, 75, 98);
  assert.ok(m > 23 && m < 30, `mujer ${m}`);
});

test('evaluar: perfil en forma saca 15/15', () => {
  const r = evaluar({ sexo: 'hombre', edad: 30, peso: 75, altura: 178, cintura: 82, cadera: 98, cuello: 39 });
  assert.deepEqual(r.metricas.map((m) => m.id), ['imc', 'cinturaAltura', 'cinturaCadera', 'grasa', 'visceral']);
  assert.ok(r.metricas.every((m) => m.max === 3));
  assert.equal(r.nota, 15);
  assert.equal(r.completa, true);
  assert.equal(r.calificacion, 'Excelente');
});

test('evaluar: perfil con sobrepeso abdominal baja la nota', () => {
  const r = evaluar({ sexo: 'hombre', edad: 30, peso: 82, altura: 178, cintura: 92, cadera: 100, cuello: 39 });
  assert.ok(r.nota < 13.5 && r.nota >= 7.5, `nota ${r.nota}`);
});

test('evaluar: prioriza pliegues y nivel de bioimpedancia', () => {
  const r = evaluar({ sexo: 'mujer', edad: 40, peso: 80, altura: 160, cintura: 95, cadera: 110, cuello: 34,
    pliegues: [30, 35, 40], nivelVisceral: 14 });
  assert.match(r.metricas.find((m) => m.id === 'grasa').detalle, /Pliegues/);
  assert.equal(r.metricas.find((m) => m.id === 'visceral').categoria, 'Elevado');
  assert.ok(r.nota < 7.5, `nota ${r.nota}`);
});

test('evaluar: incompleta escala sobre 15 y lo indica', () => {
  const r = evaluar({ sexo: 'hombre', edad: 25, peso: 70, altura: 175 });
  assert.equal(r.metricas.length, 1);
  assert.equal(r.nota, 15);
  assert.equal(r.completa, false);
  assert.equal(r.faltan, 4);
});

test('evaluar: valida obligatorios', () => {
  assert.throws(() => evaluar({ sexo: 'hombre', edad: 25, peso: 70 }));
  assert.throws(() => evaluar({ sexo: 'x', edad: 25, peso: 70, altura: 170 }));
});

test('calificación por % de la nota máxima', () => {
  assert.equal(calificacion(13.5), 'Excelente');
  assert.equal(calificacion(10.5), 'Bueno');
  assert.equal(calificacion(7.5), 'Aceptable');
  assert.equal(calificacion(7), 'Deficiente');
});

test('guardarNotaGlobal guarda score/max y respeta otros módulos', () => {
  const mem = { d: { 'sportfy.scores': '{"postural":{"score":8,"max":10}}' }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  guardarNotaGlobal({ nota: 12 }, mem, { calificacion: 'Bueno' });
  const g = JSON.parse(mem.d['sportfy.scores']);
  assert.deepEqual(g.postural, { score: 8, max: 10 });
  assert.equal(g.antropometria.score, 12);
  assert.equal(g.antropometria.max, 15);
});
