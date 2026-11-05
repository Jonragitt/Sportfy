// Cálculos de la evaluación antropométrica de Sportfy.
// Módulo puro (sin DOM) para poder testearlo con `node --test`.
// Unidades: kg, cm, mm (pliegues), años.

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const es = (n) => String(n).replace('.', ',');
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Nota de 0 a 10: 10 dentro del rango ideal [idealMin, idealMax]. Al salir del
 * rango la nota cae a 8 como máximo (penalización por estar fuera de lo saludable)
 * y baja en línea recta hasta 0 en worstLow (por debajo) o worstHigh (por encima).
 */
const FUERA_IDEAL = 8;
export function scoreRange(value, { idealMin, idealMax, worstLow, worstHigh }) {
  if (!Number.isFinite(value)) return null;
  if (value >= idealMin && value <= idealMax) return 10;
  if (value < idealMin) {
    if (worstLow === undefined) return 10;
    return round(Math.max(0, (FUERA_IDEAL * (value - worstLow)) / (idealMin - worstLow)));
  }
  return round(Math.max(0, (FUERA_IDEAL * (worstHigh - value)) / (worstHigh - idealMax)));
}

// ---------- Métricas ----------

export function imc(pesoKg, alturaCm) {
  const m = alturaCm / 100;
  return round(pesoKg / (m * m), 1);
}

export function clasificarImc(v) {
  if (v < 18.5) return 'Bajo peso';
  if (v < 25) return 'Normal';
  if (v < 30) return 'Sobrepeso';
  if (v < 35) return 'Obesidad grado I';
  if (v < 40) return 'Obesidad grado II';
  return 'Obesidad grado III';
}

export const cinturaAltura = (cinturaCm, alturaCm) => round(cinturaCm / alturaCm, 2);
export const cinturaCadera = (cinturaCm, caderaCm) => round(cinturaCm / caderaCm, 2);

/**
 * % grasa con 3 pliegues (Jackson & Pollock) + ecuación de Siri.
 * Hombre: pecho, abdomen, muslo. Mujer: tríceps, suprailíaco, muslo.
 */
export function grasaPliegues(sexo, edad, pliegues) {
  const s = pliegues.reduce((a, b) => a + b, 0);
  const dc =
    sexo === 'hombre'
      ? 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * edad
      : 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * edad;
  return round(495 / dc - 450, 1);
}

/** % grasa con cinta métrica (fórmula de la Marina de EE.UU., en cm). */
export function grasaMarina(sexo, alturaCm, cuelloCm, cinturaCm, caderaCm) {
  const log = Math.log10;
  const v =
    sexo === 'hombre'
      ? 495 / (1.0324 - 0.19077 * log(cinturaCm - cuelloCm) + 0.15456 * log(alturaCm)) - 450
      : 495 / (1.29579 - 0.35004 * log(cinturaCm + caderaCm - cuelloCm) + 0.221 * log(alturaCm)) - 450;
  return round(v, 1);
}

/** Riesgo de grasa visceral según perímetro de cintura (criterios OMS / IDF). */
export function riesgoVisceral(sexo, cinturaCm) {
  const [moderado, alto] = sexo === 'hombre' ? [94, 102] : [80, 88];
  if (cinturaCm >= alto) return 'Alto';
  if (cinturaCm >= moderado) return 'Moderado';
  return 'Bajo';
}

export function clasificarNivelVisceral(nivel) {
  // Escala habitual de básculas de bioimpedancia (1–59): 1–12 saludable.
  if (nivel <= 12) return 'Saludable';
  if (nivel <= 15) return 'Elevado';
  return 'Excesivo';
}

// ---------- Baremos de puntuación ----------

export const BAREMOS = {
  imc: { idealMin: 18.5, idealMax: 24.9, worstLow: 15, worstHigh: 40 },
  cinturaAltura: { idealMin: 0.4, idealMax: 0.5, worstLow: 0.35, worstHigh: 0.65 },
  cinturaCadera: {
    hombre: { idealMin: 0, idealMax: 0.9, worstHigh: 1.1 },
    mujer: { idealMin: 0, idealMax: 0.8, worstHigh: 1.0 },
  },
  grasa: {
    hombre: { idealMin: 10, idealMax: 20, worstLow: 4, worstHigh: 35 },
    mujer: { idealMin: 18, idealMax: 28, worstLow: 12, worstHigh: 45 },
  },
  visceralCintura: {
    hombre: { idealMin: 0, idealMax: 94, worstHigh: 120 },
    mujer: { idealMin: 0, idealMax: 80, worstHigh: 108 },
  },
  visceralNivel: { idealMin: 1, idealMax: 12, worstHigh: 25 },
};

export function calificacion(nota) {
  if (nota >= 9) return 'Excelente';
  if (nota >= 7) return 'Bueno';
  if (nota >= 5) return 'Mejorable';
  return 'Prioridad de mejora';
}

/**
 * Evalúa todos los datos disponibles y devuelve cada métrica con su nota
 * y la nota media antropométrica. Los campos opcionales que falten se omiten.
 *
 * datos: { sexo: 'hombre'|'mujer', edad, peso, altura, cintura?, cadera?, cuello?,
 *          pliegues?: number[3], nivelVisceral? }
 */
export function evaluar(datos) {
  const { sexo, edad, peso, altura, cintura, cadera, cuello, pliegues, nivelVisceral } = datos;
  if (sexo !== 'hombre' && sexo !== 'mujer') throw new Error('Sexo no válido');
  if (![edad, peso, altura].every(isNum)) throw new Error('Edad, peso y altura son obligatorios');

  const metricas = [];
  const add = (id, nombre, valor, unidad, clasificacion, nota, detalle) =>
    metricas.push({ id, nombre, valor, unidad, clasificacion, nota, detalle });

  const vImc = imc(peso, altura);
  add('imc', 'IMC', vImc, 'kg/m²', clasificarImc(vImc), scoreRange(vImc, BAREMOS.imc), 'Ideal 18,5–24,9');

  if (isNum(cintura)) {
    const ica = cinturaAltura(cintura, altura);
    add('cinturaAltura', 'Índice cintura/altura', ica, '', ica <= 0.5 ? 'Saludable' : 'Riesgo aumentado',
      scoreRange(ica, BAREMOS.cinturaAltura), 'Ideal ≤ 0,50');
  }

  if (isNum(cintura) && isNum(cadera)) {
    const icc = cinturaCadera(cintura, cadera);
    const b = BAREMOS.cinturaCadera[sexo];
    add('cinturaCadera', 'Índice cintura/cadera', icc, '', icc <= b.idealMax ? 'Saludable' : 'Riesgo aumentado',
      scoreRange(icc, b), `Ideal ≤ ${es(b.idealMax)}`);
  }

  // % grasa: pliegues si los hay (más preciso); si no, cinta métrica.
  let grasa = null;
  let metodo = null;
  if (Array.isArray(pliegues) && pliegues.length === 3 && pliegues.every(isNum)) {
    grasa = grasaPliegues(sexo, edad, pliegues);
    metodo = 'Pliegues (Jackson-Pollock 3)';
  } else if (isNum(cuello) && isNum(cintura) && (sexo === 'hombre' || isNum(cadera))) {
    grasa = grasaMarina(sexo, altura, cuello, cintura, cadera);
    metodo = 'Cinta métrica (Marina EE.UU.)';
  }
  if (grasa !== null && Number.isFinite(grasa)) {
    const b = BAREMOS.grasa[sexo];
    const clas = grasa < b.idealMin ? 'Bajo' : grasa <= b.idealMax ? 'Saludable' : 'Alto';
    const masaGrasa = round((peso * grasa) / 100, 1);
    add('grasa', '% grasa corporal', grasa, '%', clas, scoreRange(grasa, b),
      `${metodo} · ${es(masaGrasa)} kg grasa · ${es(round(peso - masaGrasa, 1))} kg masa magra · Ideal ${b.idealMin}–${b.idealMax} %`);
  }

  // Grasa visceral: nivel de bioimpedancia si se aporta; si no, estimación por cintura.
  if (isNum(nivelVisceral)) {
    add('visceral', 'Grasa visceral (bioimpedancia)', nivelVisceral, 'nivel', clasificarNivelVisceral(nivelVisceral),
      scoreRange(nivelVisceral, BAREMOS.visceralNivel), 'Saludable 1–12');
  } else if (isNum(cintura)) {
    const b = BAREMOS.visceralCintura[sexo];
    add('visceral', 'Riesgo de grasa visceral', cintura, 'cm cintura', riesgoVisceral(sexo, cintura),
      scoreRange(cintura, b), `Estimado por cintura · Riesgo bajo < ${b.idealMax} cm`);
  }

  const notas = metricas.map((m) => m.nota).filter((n) => n !== null);
  const media = notas.length ? round(notas.reduce((a, b) => a + b, 0) / notas.length, 1) : null;

  return { fecha: new Date().toISOString(), datos, metricas, media, calificacion: media === null ? null : calificacion(media) };
}

/** Nota 0–100 para combinar con el resto de evaluaciones de Sportfy. */
export const nota100 = (media) => (media === null ? null : Math.round(media * 10));

/**
 * Guarda la nota en localStorage "sportfy.scores" sin pisar las de otros módulos.
 * Mismo formato que shared/scores.js: { score, date, detail }.
 */
export function guardarNotaGlobal(media, storage = globalThis.localStorage, detail = {}) {
  try {
    const actual = JSON.parse(storage.getItem('sportfy.scores') || '{}');
    actual.antropometria = { score: nota100(media), date: new Date().toISOString(), detail };
    storage.setItem('sportfy.scores', JSON.stringify(actual));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}
