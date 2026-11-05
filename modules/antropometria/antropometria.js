// Cálculos de la evaluación antropométrica de Sportfy.
// Módulo puro (sin DOM) para poder testearlo con `node --test`.
// Unidades: kg, cm, mm (pliegues), años.

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const es = (n) => String(n).replace('.', ',');
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

// ---------- Métricas ----------

export function imc(pesoKg, alturaCm) {
  const m = alturaCm / 100;
  return round(pesoKg / (m * m), 1);
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

// ---------- Baremos de puntuación (estilo profesional) ----------
//
// Cada métrica se clasifica por tramos y suma de 0 a 3 puntos:
//   3 = Óptimo · 2 = Aceptable · 1 = Riesgo · 0 = Riesgo alto
// 5 métricas × 3 puntos = nota antropométrica sobre 15.
// Cada tramo: [hasta (exclusivo), puntos, categoría]. El último tramo usa Infinity.

export const PUNTOS_MAX_METRICA = 3;
export const NOTA_MAX = 15;

export const BAREMOS = {
  // OMS. Por debajo de 18,5 también penaliza (delgadez).
  imc: {
    fuente: 'OMS',
    tramos: [
      [16, 0, 'Delgadez severa'],
      [17, 1, 'Delgadez moderada'],
      [18.5, 2, 'Delgadez leve'],
      [25, 3, 'Normopeso'],
      [27.5, 2, 'Sobrepeso grado I'],
      [30, 1, 'Sobrepeso grado II'],
      [Infinity, 0, 'Obesidad'],
    ],
  },
  // Ashwell: "mantén tu cintura por debajo de la mitad de tu altura".
  cinturaAltura: {
    fuente: 'Ashwell',
    tramos: [
      [0.4, 2, 'Muy delgado'],
      [0.5, 3, 'Saludable'],
      [0.55, 2, 'Riesgo ligero'],
      [0.6, 1, 'Riesgo aumentado'],
      [Infinity, 0, 'Riesgo alto'],
    ],
  },
  // OMS: riesgo cardiometabólico desde 0,90 (H) / 0,85 (M).
  cinturaCadera: {
    fuente: 'OMS',
    hombre: [[0.9, 3, 'Saludable'], [0.95, 2, 'Riesgo ligero'], [1.0, 1, 'Riesgo aumentado'], [Infinity, 0, 'Riesgo alto']],
    mujer: [[0.8, 3, 'Saludable'], [0.85, 2, 'Riesgo ligero'], [0.9, 1, 'Riesgo aumentado'], [Infinity, 0, 'Riesgo alto']],
  },
  // American Council on Exercise (ACE), con "Aceptable" partido en dos.
  grasa: {
    fuente: 'ACE',
    hombre: [
      [6, 1, 'Grasa esencial (demasiado baja)'],
      [14, 3, 'Atleta'],
      [18, 3, 'Fitness'],
      [22, 2, 'Aceptable'],
      [25, 1, 'Aceptable alto'],
      [Infinity, 0, 'Obesidad'],
    ],
    mujer: [
      [14, 1, 'Grasa esencial (demasiado baja)'],
      [21, 3, 'Atleta'],
      [25, 3, 'Fitness'],
      [29, 2, 'Aceptable'],
      [32, 1, 'Aceptable alto'],
      [Infinity, 0, 'Obesidad'],
    ],
  },
  // Escala de básculas de bioimpedancia (1–59).
  visceralNivel: {
    fuente: 'Bioimpedancia',
    tramos: [[10, 3, 'Saludable'], [13, 2, 'Límite'], [16, 1, 'Elevado'], [Infinity, 0, 'Excesivo']],
  },
  // OMS / IDF por perímetro de cintura (cm).
  visceralCintura: {
    fuente: 'OMS / IDF',
    hombre: [[94, 3, 'Riesgo bajo'], [102, 2, 'Riesgo moderado'], [110, 1, 'Riesgo alto'], [Infinity, 0, 'Riesgo muy alto']],
    mujer: [[80, 3, 'Riesgo bajo'], [88, 2, 'Riesgo moderado'], [96, 1, 'Riesgo alto'], [Infinity, 0, 'Riesgo muy alto']],
  },
};

/** Devuelve { puntos, categoria } del tramo donde cae el valor. */
export function puntuarTramos(valor, tramos) {
  const [, puntos, categoria] = tramos.find(([hasta]) => valor < hasta);
  return { puntos, categoria };
}

/** Texto legible de los tramos para mostrar el baremo. */
export function describirTramos(tramos, unidad = '') {
  let desde = null;
  return tramos.map(([hasta, puntos, categoria]) => {
    const u = unidad ? ` ${unidad}` : '';
    const rango =
      desde === null ? `< ${es(hasta)}${u}` : hasta === Infinity ? `≥ ${es(desde)}${u}` : `${es(desde)}–${es(hasta)}${u}`;
    desde = hasta;
    return { rango, puntos, categoria };
  });
}

/** Calificación según el % de la nota máxima (mismo baremo que el panel global). */
export function calificacion(puntos, max = NOTA_MAX) {
  const pct = puntos / max;
  if (pct >= 0.9) return 'Excelente';
  if (pct >= 0.7) return 'Bueno';
  if (pct >= 0.5) return 'Aceptable';
  return 'Deficiente';
}

/**
 * Evalúa los datos disponibles y devuelve cada métrica con sus puntos (0–3)
 * y la nota antropométrica sobre 15. Si falta alguna métrica, la nota se
 * calcula proporcionalmente sobre las medidas y se marca como incompleta.
 *
 * datos: { sexo: 'hombre'|'mujer', edad, peso, altura, cintura?, cadera?, cuello?,
 *          pliegues?: number[3], nivelVisceral? }
 */
export function evaluar(datos) {
  const { sexo, edad, peso, altura, cintura, cadera, cuello, pliegues, nivelVisceral } = datos;
  if (sexo !== 'hombre' && sexo !== 'mujer') throw new Error('Sexo no válido');
  if (![edad, peso, altura].every(isNum)) throw new Error('Edad, peso y altura son obligatorios');

  const metricas = [];
  const add = (id, nombre, valor, unidad, tramos, fuente, detalle, unidadBaremo = unidad) => {
    const { puntos, categoria } = puntuarTramos(valor, tramos);
    metricas.push({
      id, nombre, valor, unidad, puntos, max: PUNTOS_MAX_METRICA, categoria, fuente, detalle,
      baremo: describirTramos(tramos, unidadBaremo),
    });
  };

  add('imc', 'IMC', imc(peso, altura), 'kg/m²', BAREMOS.imc.tramos, BAREMOS.imc.fuente, '');

  if (isNum(cintura)) {
    add('cinturaAltura', 'Índice cintura/altura', cinturaAltura(cintura, altura), '',
      BAREMOS.cinturaAltura.tramos, BAREMOS.cinturaAltura.fuente, '');
  }

  if (isNum(cintura) && isNum(cadera)) {
    add('cinturaCadera', 'Índice cintura/cadera', cinturaCadera(cintura, cadera), '',
      BAREMOS.cinturaCadera[sexo], BAREMOS.cinturaCadera.fuente, '');
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
    const masaGrasa = round((peso * grasa) / 100, 1);
    add('grasa', '% grasa corporal', grasa, '%', BAREMOS.grasa[sexo], BAREMOS.grasa.fuente,
      `${metodo} · ${es(masaGrasa)} kg grasa · ${es(round(peso - masaGrasa, 1))} kg masa magra`);
  }

  // Grasa visceral: nivel de bioimpedancia si se aporta; si no, estimación por cintura.
  if (isNum(nivelVisceral)) {
    add('visceral', 'Grasa visceral', nivelVisceral, 'nivel', BAREMOS.visceralNivel.tramos,
      BAREMOS.visceralNivel.fuente, 'Medida con báscula de bioimpedancia');
  } else if (isNum(cintura)) {
    add('visceral', 'Grasa visceral (estimada)', cintura, 'cm', BAREMOS.visceralCintura[sexo],
      BAREMOS.visceralCintura.fuente, 'Estimada por perímetro de cintura');
  }

  const conseguidos = metricas.reduce((a, m) => a + m.puntos, 0);
  const posibles = metricas.length * PUNTOS_MAX_METRICA;
  const nota = round((conseguidos / posibles) * NOTA_MAX, 1);
  const faltan = 5 - metricas.length;

  return {
    fecha: new Date().toISOString(),
    datos,
    metricas,
    puntos: conseguidos,
    posibles,
    nota,
    max: NOTA_MAX,
    completa: faltan === 0,
    faltan,
    calificacion: calificacion(nota),
  };
}

/**
 * Guarda la nota en localStorage "sportfy.scores" sin pisar las de otros módulos.
 * Formato común: { score: puntos, max, date, detail } (el panel suma score/max para la nota /25).
 */
export function guardarNotaGlobal(resultado, storage = globalThis.localStorage, detail = {}) {
  try {
    const actual = JSON.parse(storage.getItem('sportfy.scores') || '{}');
    actual.antropometria = {
      score: resultado.nota,
      max: NOTA_MAX,
      date: new Date().toISOString(),
      detail,
    };
    storage.setItem('sportfy.scores', JSON.stringify(actual));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}
