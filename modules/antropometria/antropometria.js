// Cálculos de la evaluación antropométrica de Forty5.
// Datos de entrada: los que da una báscula de bioimpedancia.
// Módulo puro (sin DOM) para poder testearlo con `node --test`.
// Unidades: kg, cm, %, kcal, años.

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const es = (n) => String(n).replace('.', ',');
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

// ---------- Cálculos informativos ----------

export function imc(pesoKg, alturaCm) {
  const m = alturaCm / 100;
  return round(pesoKg / (m * m), 1);
}

export function clasificarImc(v) {
  if (v < 18.5) return 'Bajo peso';
  if (v < 25) return 'Normopeso';
  if (v < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/** Metabolismo basal estimado (Mifflin-St Jeor), en kcal/día. */
export function metabolismoEstimado(sexo, edad, pesoKg, alturaCm) {
  return Math.round(10 * pesoKg + 6.25 * alturaCm - 5 * edad + (sexo === 'hombre' ? 5 : -161));
}

/**
 * Las básculas dan el "% muscular" de dos formas: músculo esquelético
 * (≈ 25–45 %, p. ej. Omron) o masa muscular total (≈ 60–85 %, p. ej. Tanita,
 * Xiaomi, Renpho). Por encima de 50 % se interpreta como masa muscular total.
 */
export const tipoMuscular = (pct) => (pct > 50 ? 'total' : 'esqueletico');

// ---------- Baremos de puntuación (estilo profesional) ----------
//
// Cada prueba se clasifica por tramos y suma de 0 a 3 puntos:
//   3 = Óptimo · 2 = Aceptable · 1 = Riesgo/Bajo · 0 = Riesgo alto/Muy bajo
// 5 pruebas × 3 puntos = nota antropométrica sobre 15.
// Cada tramo: [hasta (exclusivo), puntos, categoría]. El último tramo usa Infinity.

export const PUNTOS_MAX_METRICA = 3;
export const NUM_PRUEBAS = 5;
export const NOTA_MAX = 15;

export const BAREMOS = {
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
  // Rangos de hidratación de básculas de bioimpedancia (Tanita): sano 50–65 % H, 45–60 % M.
  agua: {
    fuente: 'Tanita',
    hombre: [[45, 0, 'Muy baja'], [50, 1, 'Baja'], [55, 2, 'Normal'], [65, 3, 'Óptima'], [Infinity, 2, 'Alta']],
    mujer: [[40, 0, 'Muy baja'], [45, 1, 'Baja'], [50, 2, 'Normal'], [60, 3, 'Óptima'], [Infinity, 2, 'Alta']],
  },
  // Músculo esquelético (Omron, adultos 18–39 años; el rango normal baja 0,2 puntos a los 40 y a los 60).
  muscularEsqueletico: {
    fuente: 'Omron',
    hombre: [[30.3, 0, 'Muy bajo'], [33.3, 1, 'Bajo'], [39.4, 2, 'Normal'], [Infinity, 3, 'Alto']],
    mujer: [[21.3, 0, 'Muy bajo'], [24.3, 1, 'Bajo'], [30.4, 2, 'Normal'], [Infinity, 3, 'Alto']],
  },
  // Masa muscular total (% del peso), escalas tipo Tanita / Xiaomi / Renpho.
  muscularTotal: {
    fuente: 'Bioimpedancia',
    hombre: [[65, 0, 'Muy baja'], [70, 1, 'Baja'], [75, 2, 'Normal'], [Infinity, 3, 'Alta']],
    mujer: [[58, 0, 'Muy baja'], [63, 1, 'Baja'], [68, 2, 'Normal'], [Infinity, 3, 'Alta']],
  },
  // Diferencia edad metabólica − edad real (años).
  edadMetabolica: {
    fuente: 'Tanita',
    tramos: [[1, 3, 'Igual o más joven'], [6, 2, 'Algo mayor'], [11, 1, 'Mayor'], [Infinity, 0, 'Mucho mayor']],
  },
  // Escala de grasa visceral de básculas de bioimpedancia (1–59).
  visceral: {
    fuente: 'Tanita',
    tramos: [[10, 3, 'Saludable'], [13, 2, 'Límite'], [16, 1, 'Elevada'], [Infinity, 0, 'Excesiva']],
  },
};

/** Ajuste por edad del baremo Omron de músculo esquelético. */
function tramosEsqueletico(sexo, edad) {
  const ajuste = edad >= 60 ? -0.4 : edad >= 40 ? -0.2 : 0;
  return BAREMOS.muscularEsqueletico[sexo].map(([h, p, c]) => [h === Infinity ? h : round(h + ajuste, 1), p, c]);
}

/** Devuelve { puntos, categoria } del tramo donde cae el valor. */
export function puntuarTramos(valor, tramos) {
  const [, puntos, categoria] = tramos.find(([hasta]) => valor < hasta);
  return { puntos, categoria };
}

/** Texto legible de los tramos para mostrar el baremo. */
export function describirTramos(tramos, unidad = '', signo = false) {
  const f = (n) => (signo && n > 0 ? `+${es(n)}` : es(n));
  const u = unidad ? ` ${unidad}` : '';
  let desde = null;
  return tramos.map(([hasta, puntos, categoria]) => {
    const rango =
      desde === null ? `< ${f(hasta)}${u}` : hasta === Infinity ? `≥ ${f(desde)}${u}` : `${f(desde)} a ${f(hasta)}${u}`;
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
 * Evalúa los datos de la báscula. Puntúa 5 pruebas (% graso, % agua, % muscular,
 * edad metabólica y grasa visceral) sobre 15 y añade datos informativos (IMC,
 * metabolismo basal, kg de grasa, músculo y agua). Si falta alguna prueba, la
 * nota se escala sobre las medidas y se marca como incompleta.
 *
 * datos: { sexo: 'hombre'|'mujer', edad, altura, peso, grasa?, agua?, muscular?,
 *          metabolismo?, edadMetabolica?, visceral? }
 */
export function evaluar(datos) {
  const { sexo, edad, altura, peso, grasa, agua, muscular, metabolismo, edadMetabolica, visceral } = datos;
  if (sexo !== 'hombre' && sexo !== 'mujer') throw new Error('Sexo no válido');
  if (![edad, peso, altura].every(isNum)) throw new Error('Edad, altura y peso son obligatorios');

  const metricas = [];
  const add = (id, nombre, valor, unidad, tramos, fuente, detalle = '', opts = {}) => {
    const { puntos, categoria } = puntuarTramos(opts.valorBaremo ?? valor, tramos);
    metricas.push({
      id, nombre, valor, unidad, puntos, max: PUNTOS_MAX_METRICA, categoria, fuente, detalle,
      baremo: describirTramos(tramos, opts.unidadBaremo ?? unidad, opts.signo),
    });
  };
  const kg = (pct) => es(round((peso * pct) / 100, 1));

  if (isNum(grasa)) {
    add('grasa', '% graso', grasa, '%', BAREMOS.grasa[sexo], BAREMOS.grasa.fuente,
      `${kg(grasa)} kg de grasa · ${es(round(peso - (peso * grasa) / 100, 1))} kg de masa magra`);
  }
  if (isNum(agua)) {
    add('agua', '% agua', agua, '%', BAREMOS.agua[sexo], BAREMOS.agua.fuente, `${kg(agua)} kg de agua`);
  }
  if (isNum(muscular)) {
    const tipo = tipoMuscular(muscular);
    const tramos = tipo === 'total' ? BAREMOS.muscularTotal[sexo] : tramosEsqueletico(sexo, edad);
    const fuente = tipo === 'total' ? BAREMOS.muscularTotal.fuente : BAREMOS.muscularEsqueletico.fuente;
    add('muscular', '% muscular', muscular, '%', tramos, fuente,
      `${kg(muscular)} kg · interpretado como ${tipo === 'total' ? 'masa muscular total' : 'músculo esquelético'}`);
  }
  if (isNum(edadMetabolica)) {
    const dif = Math.round(edadMetabolica - edad);
    add('edadMetabolica', 'Edad metabólica', edadMetabolica, 'años', BAREMOS.edadMetabolica.tramos,
      BAREMOS.edadMetabolica.fuente,
      dif === 0 ? 'Igual a tu edad real' : `${Math.abs(dif)} años ${dif < 0 ? 'menos' : 'más'} que tu edad real (${edad})`,
      { valorBaremo: dif, unidadBaremo: 'años vs edad real', signo: true });
  }
  if (isNum(visceral)) {
    add('visceral', 'Grasa visceral', visceral, 'nivel', BAREMOS.visceral.tramos, BAREMOS.visceral.fuente);
  }

  // Datos informativos (no puntúan).
  const vImc = imc(peso, altura);
  const informativos = [{ id: 'imc', nombre: 'IMC', valor: vImc, unidad: 'kg/m²', categoria: clasificarImc(vImc) }];
  if (isNum(metabolismo)) {
    const est = metabolismoEstimado(sexo, edad, peso, altura);
    const dif = Math.round(((metabolismo - est) / est) * 100);
    informativos.push({
      id: 'metabolismo', nombre: 'Metabolismo basal', valor: Math.round(metabolismo), unidad: 'kcal/día',
      categoria: `${dif >= 0 ? '+' : ''}${dif} % vs ${est} kcal esperadas (Mifflin-St Jeor)`,
    });
  }

  const conseguidos = metricas.reduce((a, m) => a + m.puntos, 0);
  const posibles = metricas.length * PUNTOS_MAX_METRICA;
  const nota = posibles ? round((conseguidos / posibles) * NOTA_MAX, 1) : null;
  const faltan = NUM_PRUEBAS - metricas.length;

  return {
    fecha: new Date().toISOString(),
    datos,
    metricas,
    informativos,
    puntos: conseguidos,
    posibles,
    nota,
    max: NOTA_MAX,
    completa: faltan === 0,
    faltan,
    calificacion: nota === null ? null : calificacion(nota),
  };
}

/**
 * Guarda la nota en localStorage "sportfy.scores" sin pisar las de otros módulos.
 * Formato común: { score: puntos, max, date, detail } (el panel suma score/max para la nota /25).
 */
export function guardarNotaGlobal(resultado, storage = globalThis.localStorage, detail = {}) {
  try {
    const actual = JSON.parse(storage.getItem('sportfy.scores') || '{}');
    actual.antropometria = { score: resultado.nota, max: NOTA_MAX, date: new Date().toISOString(), detail };
    storage.setItem('sportfy.scores', JSON.stringify(actual));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}
