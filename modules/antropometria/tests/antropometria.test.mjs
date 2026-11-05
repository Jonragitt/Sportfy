import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  imc, metabolismoEstimado, tipoMuscular, puntuarTramos, describirTramos, evaluar, guardarNotaGlobal, calificacion, BAREMOS,
} from '../antropometria.js';

const base = { sexo: 'hombre', edad: 30, altura: 178, peso: 75 };

test('IMC y metabolismo estimado', () => {
  assert.equal(imc(70, 175), 22.9);
  assert.equal(metabolismoEstimado('hombre', 30, 75, 178), 1718);
  assert.equal(metabolismoEstimado('mujer', 30, 60, 165), 1320);
});

test('Tramos de % graso (ACE) según sexo', () => {
  assert.equal(puntuarTramos(12, BAREMOS.grasa.hombre).categoria, 'Atleta');
  assert.equal(puntuarTramos(20, BAREMOS.grasa.hombre).puntos, 2);
  assert.equal(puntuarTramos(26, BAREMOS.grasa.hombre).puntos, 0);
  assert.equal(puntuarTramos(20, BAREMOS.grasa.mujer).puntos, 3);
});

test('Tramos de % agua', () => {
  assert.equal(puntuarTramos(58, BAREMOS.agua.hombre).puntos, 3);
  assert.equal(puntuarTramos(52, BAREMOS.agua.hombre).puntos, 2);
  assert.equal(puntuarTramos(47, BAREMOS.agua.hombre).puntos, 1);
  assert.equal(puntuarTramos(52, BAREMOS.agua.mujer).puntos, 3);
});

test('% muscular: detecta esquelético o total', () => {
  assert.equal(tipoMuscular(38), 'esqueletico');
  assert.equal(tipoMuscular(76), 'total');
  const esq = evaluar({ ...base, muscular: 40 }).metricas[0];
  assert.equal(esq.puntos, 3);
  assert.equal(esq.fuente, 'Omron');
  const tot = evaluar({ ...base, muscular: 68 }).metricas[0];
  assert.equal(tot.puntos, 1);
  assert.match(tot.detalle, /masa muscular total/);
});

test('Edad metabólica puntúa la diferencia con la edad real', () => {
  const p = (em) => evaluar({ ...base, edadMetabolica: em }).metricas[0].puntos;
  assert.equal(p(25), 3);
  assert.equal(p(30), 3);
  assert.equal(p(34), 2);
  assert.equal(p(38), 1);
  assert.equal(p(45), 0);
});

test('Grasa visceral', () => {
  assert.equal(puntuarTramos(5, BAREMOS.visceral.tramos).puntos, 3);
  assert.equal(puntuarTramos(14, BAREMOS.visceral.tramos).categoria, 'Elevada');
});

test('describirTramos', () => {
  assert.deepEqual(describirTramos(BAREMOS.visceral.tramos).map((x) => x.rango), ['< 10', '10 a 13', '13 a 16', '≥ 16']);
  assert.equal(describirTramos(BAREMOS.edadMetabolica.tramos, 'años', true)[1].rango, '+1 a +6 años');
});

test('evaluar: perfil en forma saca 15/15', () => {
  const r = evaluar({ ...base, grasa: 14, agua: 60, muscular: 41, metabolismo: 1800, edadMetabolica: 26, visceral: 4 });
  assert.deepEqual(r.metricas.map((m) => m.id), ['grasa', 'agua', 'muscular', 'edadMetabolica', 'visceral']);
  assert.equal(r.nota, 15);
  assert.equal(r.completa, true);
  assert.equal(r.calificacion, 'Excelente');
  assert.deepEqual(r.informativos.map((i) => i.id), ['imc', 'metabolismo']);
  assert.match(r.informativos[1].categoria, /^\+5 % vs 1718/);
});

test('evaluar: perfil con sobrepeso', () => {
  const r = evaluar({ sexo: 'hombre', edad: 40, altura: 175, peso: 92, grasa: 27, agua: 49, muscular: 31,
    metabolismo: 1750, edadMetabolica: 49, visceral: 13 });
  assert.equal(r.puntos, 0 + 1 + 1 + 1 + 1);
  assert.equal(r.nota, 4);
  assert.equal(r.calificacion, 'Deficiente');
});

test('evaluar: incompleta escala sobre 15 y lo indica', () => {
  const r = evaluar({ ...base, grasa: 20, visceral: 5 });
  assert.equal(r.nota, 12.5);
  assert.equal(r.completa, false);
  assert.equal(r.faltan, 3);
  assert.equal(evaluar(base).nota, null);
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
