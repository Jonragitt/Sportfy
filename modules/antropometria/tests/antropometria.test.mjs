import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreRange, imc, grasaPliegues, grasaMarina, riesgoVisceral, evaluar, nota100, guardarNotaGlobal, BAREMOS,
} from '../antropometria.js';

test('IMC', () => {
  assert.equal(imc(70, 175), 22.9);
  assert.equal(imc(100, 170), 34.6);
});

test('scoreRange: 10 en rango ideal y 0 en los extremos', () => {
  const b = BAREMOS.imc;
  assert.equal(scoreRange(22, b), 10);
  assert.equal(scoreRange(40, b), 0);
  assert.equal(scoreRange(50, b), 0);
  assert.equal(scoreRange(15, b), 0);
  assert.ok(scoreRange(30, b) > 0 && scoreRange(30, b) < 8);
  // Fuera del ideal nunca pasa de 8
  assert.ok(scoreRange(25, b) <= 8);
});

test('Jackson-Pollock 3 pliegues', () => {
  // Hombre 30 años, suma 60 mm -> ~17,5 %
  const h = grasaPliegues('hombre', 30, [20, 25, 15]);
  assert.ok(h > 16 && h < 19, `hombre ${h}`);
  // Mujer 30 años, suma 60 mm -> ~24 %
  const m = grasaPliegues('mujer', 30, [20, 20, 20]);
  assert.ok(m > 22 && m < 26, `mujer ${m}`);
});

test('Fórmula de la Marina', () => {
  const h = grasaMarina('hombre', 178, 38, 85);
  assert.ok(h > 14 && h < 19, `hombre ${h}`);
  const m = grasaMarina('mujer', 165, 33, 75, 98);
  assert.ok(m > 23 && m < 30, `mujer ${m}`);
});

test('Riesgo visceral por cintura', () => {
  assert.equal(riesgoVisceral('hombre', 90), 'Bajo');
  assert.equal(riesgoVisceral('hombre', 96), 'Moderado');
  assert.equal(riesgoVisceral('hombre', 105), 'Alto');
  assert.equal(riesgoVisceral('mujer', 85), 'Moderado');
});

test('evaluar: media con todas las métricas', () => {
  const r = evaluar({ sexo: 'hombre', edad: 30, peso: 75, altura: 178, cintura: 84, cadera: 98, cuello: 38 });
  assert.deepEqual(r.metricas.map((m) => m.id), ['imc', 'cinturaAltura', 'cinturaCadera', 'grasa', 'visceral']);
  assert.ok(r.media >= 9, `media ${r.media}`);
  assert.equal(r.calificacion, 'Excelente');
});

test('evaluar: con varias métricas en riesgo no puede salir Excelente', () => {
  const r = evaluar({ sexo: 'hombre', edad: 30, peso: 82, altura: 178, cintura: 92, cadera: 100, cuello: 39 });
  assert.ok(r.media < 9, `media ${r.media}`);
});

test('evaluar: prioriza pliegues y nivel de bioimpedancia', () => {
  const r = evaluar({ sexo: 'mujer', edad: 40, peso: 80, altura: 160, cintura: 95, cadera: 110, cuello: 34,
    pliegues: [30, 35, 40], nivelVisceral: 14 });
  assert.match(r.metricas.find((m) => m.id === 'grasa').detalle, /Pliegues/);
  assert.equal(r.metricas.find((m) => m.id === 'visceral').clasificacion, 'Elevado');
  assert.ok(r.media < 7);
});

test('evaluar: solo datos básicos', () => {
  const r = evaluar({ sexo: 'hombre', edad: 25, peso: 70, altura: 175 });
  assert.equal(r.metricas.length, 1);
  assert.equal(r.media, 10);
});

test('evaluar: valida obligatorios', () => {
  assert.throws(() => evaluar({ sexo: 'hombre', edad: 25, peso: 70 }));
  assert.throws(() => evaluar({ sexo: 'x', edad: 25, peso: 70, altura: 170 }));
});

test('guardarNotaGlobal hace merge con otras notas', () => {
  const mem = { d: { 'sportfy.scores': '{"postural":80}' }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } };
  guardarNotaGlobal(7.4, mem, { calificacion: 'Bueno' });
  const g = JSON.parse(mem.d['sportfy.scores']);
  assert.equal(g.postural, 80);
  assert.equal(g.antropometria.score, 74);
  assert.deepEqual(g.antropometria.detail, { calificacion: 'Bueno' });
  assert.equal(nota100(null), null);
});
