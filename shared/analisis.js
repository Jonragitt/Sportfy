// Análisis de resultados de Forty5: interpreta la última evaluación (antropometría
// /15 + postural /10), detecta puntos fuertes y débiles, ordena las prioridades
// de la rutina y calcula la evolución entre evaluaciones.
// Módulo puro (sin DOM) para poder testearlo con `node --test`.

export const NIVELES = ["Débil", "Mejorable", "Correcto", "Fuerte"];

// ---------- Antropometría: interpretación por prueba y puntos (0–3) ----------

export const TEXTO_METRICA = {
  grasa: {
    area: "Grasa corporal",
    texto: [
      "Tu porcentaje de grasa está en rango de obesidad. Es el factor que más condiciona tu salud y tu rendimiento ahora mismo.",
      "Tu grasa está en la parte alta de lo aceptable. Bajar unos puntos mejorará tu energía, tu forma física y tu salud.",
      "Tu grasa está en un rango aceptable. Con constancia puedes llevarla a valores de fitness.",
      "Tu porcentaje de grasa está en rango de fitness o atleta. Mantenlo.",
    ],
    foco: "Déficit calórico moderado (300–500 kcal), fuerza 3 días por semana, cardio 2–3 días y 8.000–10.000 pasos diarios.",
    // Grasa demasiado baja (grasa esencial): puntúa 1 pero el foco es el contrario.
    focoBajo: "Tu grasa es demasiado baja: sube calorías poco a poco y prioriza fuerza y descanso.",
  },
  agua: {
    area: "Hidratación",
    texto: [
      "Tu nivel de agua corporal es muy bajo. Puede afectar a la recuperación, a la fuerza y también falsear el resto de medidas de la báscula.",
      "Tu hidratación está por debajo de lo recomendado.",
      "Tu hidratación es normal, aunque puede mejorar.",
      "Tu hidratación es óptima.",
    ],
    foco: "Bebe unos 35 ml de agua por kg de peso al día, más en los días de entrenamiento, y pésate siempre en las mismas condiciones (en ayunas, tras ir al baño).",
  },
  muscular: {
    area: "Masa muscular",
    texto: [
      "Tu masa muscular es muy baja. Ganar músculo es la base para quemar más grasa, proteger las articulaciones y mejorar la postura.",
      "Tu masa muscular está por debajo de lo normal.",
      "Tu masa muscular es normal. Hay margen para ganar más.",
      "Tienes una masa muscular alta: es tu gran punto fuerte.",
    ],
    foco: "Entrenamiento de fuerza con sobrecarga progresiva 3–4 días por semana (grandes básicos: sentadilla, bisagra de cadera, empujes y tirones) y 1,6–2 g de proteína por kg de peso.",
  },
  edadMetabolica: {
    area: "Metabolismo",
    texto: [
      "Tu edad metabólica es mucho mayor que tu edad real: tu cuerpo funciona como el de alguien bastante mayor.",
      "Tu edad metabólica es mayor que tu edad real.",
      "Tu edad metabólica es algo mayor que tu edad real.",
      "Tu edad metabólica es igual o menor que tu edad real: buen metabolismo.",
    ],
    foco: "Más músculo y menos grasa bajan la edad metabólica: fuerza, más movimiento diario y dormir 7–8 horas.",
  },
  visceral: {
    area: "Grasa visceral",
    texto: [
      "Tu grasa visceral es excesiva. Es la grasa que rodea los órganos y la más ligada a riesgo cardiovascular y diabetes: es la prioridad número uno.",
      "Tu grasa visceral está elevada. Conviene reducirla cuanto antes.",
      "Tu grasa visceral está en el límite de lo saludable.",
      "Tu grasa visceral está en rango saludable.",
    ],
    foco: "Cardio moderado 3–4 días por semana (o HIIT 1–2 días si ya tienes base), fuerza, menos azúcares y alcohol, y buen descanso. Si está excesiva, consúltalo con tu médico.",
  },
};

// Importancia de cada área para ordenar las prioridades (salud primero).
const PESO = { visceral: 1.5, grasa: 1.3, muscular: 1.2, edadMetabolica: 1, agua: 0.8 };

/** Interpreta cada prueba de una medición antropométrica del historial. */
export function analizarAntropometria(registro) {
  if (!registro?.metricas?.length) return null;
  const pruebas = registro.metricas.map((m) => {
    const t = TEXTO_METRICA[m.id];
    const p = Math.max(0, Math.min(3, m.puntos ?? 0));
    const bajo = m.id === "grasa" && /esencial/i.test(m.categoria || "");
    return {
      id: m.id,
      nombre: m.nombre,
      area: t?.area ?? m.nombre,
      valor: m.valor,
      unidad: m.unidad,
      categoria: m.categoria,
      puntos: p,
      max: m.max ?? 3,
      nivel: NIVELES[p],
      texto: bajo ? "Tu porcentaje de grasa es demasiado bajo (grasa esencial): no es saludable mantenerlo." : t?.texto[p] ?? "",
      foco: bajo ? t.focoBajo : t?.foco ?? "",
    };
  });
  return {
    fecha: registro.fecha,
    nota: registro.nota,
    max: registro.max ?? 15,
    completa: registro.completa !== false,
    pruebas,
    fuertes: pruebas.filter((p) => p.puntos === 3),
    debiles: pruebas.filter((p) => p.puntos <= 1),
  };
}

// ---------- Postural: patrones que agrupan las alteraciones ----------

export const PATRONES = [
  {
    id: "cruzadoSuperior",
    nombre: "Hombros y cabeza adelantados",
    alteraciones: ["cabezaAnteriorizada", "hombrosAntepulsion", "escapulasAbduccion", "waNoApoya", "waCompensacion"],
    texto: "Tu tren superior tiende a cerrarse hacia delante (patrón típico de muchas horas sentado o con el móvil). Sobrecarga cuello y hombros y limita los ejercicios por encima de la cabeza.",
    fortalecer: "Espalda alta y escápulas: remos, face pull, Y-T-W y retracción de barbilla.",
    movilizar: "Pectoral y columna dorsal: estiramiento de pectoral en marco de puerta, extensiones dorsales en foam roller y wall angels.",
  },
  {
    id: "hombrosAtras",
    nombre: "Hombros retraídos",
    alteraciones: ["hombrosRetropulsion", "escapulasAduccion"],
    texto: "Tus hombros y escápulas tienden a ir demasiado hacia atrás, lo que puede generar rigidez entre las escápulas y en la parte alta de la espalda.",
    fortalecer: "Serrato y empujes: flexiones con protracción (push-up plus) y press inclinado.",
    movilizar: "Romboides y dorsal: movilidad torácica en cuadrupedia y estiramiento de dorsal.",
  },
  {
    id: "cruzadoInferior",
    nombre: "Pelvis adelantada y zona lumbar arqueada",
    alteraciones: ["caderaAnteversion", "sohInclinacion", "sohHiperlordosis", "slbLumbar"],
    texto: "Tu pelvis tiende a inclinarse hacia delante y la zona lumbar se arquea de más. Suele ir con flexores de cadera acortados y glúteo y abdomen poco activos, y es una causa frecuente de molestias lumbares.",
    fortalecer: "Glúteo y core: puente de glúteo, hip thrust, dead bug y plancha con retroversión.",
    movilizar: "Flexores de cadera y cuádriceps: estiramiento de psoas en zancada y de cuádriceps.",
  },
  {
    id: "retroversion",
    nombre: "Pelvis en retroversión",
    alteraciones: ["caderaRetroversion", "sohRetroversion", "genuFlexo"],
    texto: "Tu pelvis tiende a bascular hacia atrás y la zona lumbar se aplana. Suele deberse a isquiotibiales acortados y limita la sentadilla profunda.",
    fortalecer: "Erectores y flexores de cadera: peso muerto rumano con buena técnica, bird dog y elevaciones de rodilla.",
    movilizar: "Isquiotibiales y cadera: estiramiento de isquios y movilidad de cadera en sentadilla asistida.",
  },
  {
    id: "rodillasDentro",
    nombre: "Rodillas hacia dentro y arco que cae",
    alteraciones: ["navicularDrop", "tobilloEversion", "genuValgo", "sohValgo", "sohArcoCae", "sohPiesRotan", "lungePositivo"],
    texto: "Tus rodillas tienden a irse hacia dentro y el arco del pie cae. Suele venir de un glúteo medio débil y un tobillo rígido, y es el patrón que más sobrecarga rodillas y tobillos.",
    fortalecer: "Glúteo medio y pie: monster walk con banda, sentadilla con banda en rodillas, short foot y elevaciones de talón.",
    movilizar: "Tobillo y gemelos: movilidad de tobillo en rodilla a la pared y estiramiento de gemelo y sóleo.",
  },
  {
    id: "rodillasFuera",
    nombre: "Rodillas hacia fuera y pie cavo",
    alteraciones: ["genuVaro", "tobilloInversion", "sohVaro", "sohPieCavo"],
    texto: "Tus rodillas tienden a abrirse y apoyas más con el borde externo del pie, lo que reduce la amortiguación del pie.",
    fortalecer: "Aductores y estabilidad del pie: sentadilla sumo, aductores con banda y equilibrio a una pierna.",
    movilizar: "Cadera y cara externa de la pierna: foam roller en cintilla iliotibial y glúteo, y movilidad del pie.",
  },
  {
    id: "asimetria",
    nombre: "Asimetrías entre lados",
    alteraciones: ["acromionAsimetrico", "acromionIzqBajo", "acromionDerBajo", "crestasAsimetricas", "crestaIzqAlta", "crestaDerAlta", "sohCargaAsimetrica", "slbCaidaPelvis", "slbRotacion"],
    texto: "Hay diferencias entre tu lado izquierdo y el derecho (altura de hombros o pelvis, reparto de la carga o control de la pelvis). A la larga sobrecargan siempre el mismo lado.",
    fortalecer: "Trabajo unilateral empezando por el lado débil: zancadas, sentadilla búlgara, puente a una pierna y paseo del granjero con una mano.",
    movilizar: "Cuadrado lumbar y cadera del lado más cargado; revisa también hábitos como cargar la mochila siempre del mismo lado.",
  },
  {
    id: "gluteoDebil",
    nombre: "Glúteo poco activo",
    alteraciones: ["slbIsquios"],
    texto: "En el puente trabajan más los isquiotibiales que el glúteo. Es la base de muchos de los otros patrones: un glúteo débil desestabiliza pelvis y rodillas.",
    fortalecer: "Activación de glúteo: puente con los pies cerca, hip thrust, clamshell y patada de glúteo.",
    movilizar: "Isquiotibiales y flexores de cadera.",
  },
];

const PATRON_DE = Object.fromEntries(PATRONES.flatMap((p) => p.alteraciones.map((a) => [a, p.id])));

/** Id base de una desviación guardada: "sohValgo:ID" → "sohValgo". */
export const idBase = (id) => String(id).split(":")[0];
/** Lados de una desviación guardada: "sohValgo:ID" → ["I","D"]; null si no es bilateral. */
export const ladosDe = (id) => (String(id).includes(":") ? String(id).split(":")[1].split("") : null);

/** Agrupa las desviaciones posturales de un registro del historial por patrones. */
export function analizarPostural(registro, totalZonas = 16) {
  if (!registro || registro.nota == null) return null;
  const desv = Array.isArray(registro.desviaciones) ? registro.desviaciones : null;
  const porPatron = new Map();
  for (const d of desv || []) {
    const pid = PATRON_DE[idBase(d.id)];
    if (!pid) continue;
    if (!porPatron.has(pid)) porPatron.set(pid, []);
    porPatron.get(pid).push({ ...d, lados: ladosDe(d.id) });
  }
  const patrones = PATRONES.filter((p) => porPatron.has(p.id)).map((p) => {
    const items = porPatron.get(p.id);
    const unLado = items.filter((i) => i.lados?.length === 1);
    return { ...p, items, unLado: unLado.map((i) => i.lados[0]) };
  }).sort((a, b) => b.items.length - a.items.length);
  return {
    fecha: registro.fecha,
    nota: registro.nota,
    max: registro.max ?? 10,
    conDetalle: desv !== null,
    numDesviaciones: desv?.length ?? null,
    patrones,
    sinAlteraciones: desv !== null && desv.length === 0,
    totalZonas,
  };
}

// ---------- Global ----------

/** Calificación por % del máximo (mismo baremo que el resto de la app). */
export function calificar(puntos, max) {
  if (puntos == null) return null;
  const pct = (puntos / max) * 100;
  if (pct >= 90) return "Excelente";
  if (pct >= 70) return "Bueno";
  if (pct >= 50) return "Aceptable";
  return "Deficiente";
}

export const TEXTO_GLOBAL = {
  Excelente: "Estás en una forma física y postural de alto nivel. El objetivo ahora es mantener y afinar los detalles.",
  Bueno: "Tienes una buena base. Trabajando los puntos débiles de abajo puedes llegar a la excelencia.",
  Aceptable: "Hay un margen de mejora claro. Si sigues las prioridades de abajo, en 8–12 semanas notarás un cambio grande.",
  Deficiente: "Este es tu punto de partida, y es donde más rápido se nota el progreso. Empieza por la prioridad número 1 y ve sumando.",
};

/**
 * Ordena qué trabajar primero en la rutina. Mezcla las pruebas antropométricas
 * débiles (por importancia para la salud) y los patrones posturales (por número
 * de alteraciones). Devuelve como mucho `max` prioridades.
 */
export function prioridades(antro, postural, max = 4) {
  const lista = [];
  for (const p of antro?.pruebas ?? []) {
    if (p.puntos >= 3) continue;
    lista.push({
      tipo: "antropometria", id: p.id, titulo: p.area,
      motivo: `${p.nombre}: ${p.unidad === "nivel" ? `nivel ${fmtNum(p.valor)}` : `${fmtNum(p.valor)} ${p.unidad}`} (${p.categoria})`,
      foco: p.foco, peso: (3 - p.puntos) * (PESO[p.id] ?? 1),
    });
  }
  for (const pt of postural?.patrones ?? []) {
    lista.push({
      tipo: "postural", id: pt.id, titulo: pt.nombre,
      motivo: `${pt.items.length} ${pt.items.length === 1 ? "alteración" : "alteraciones"} en la evaluación postural`,
      foco: `Fortalecer: ${pt.fortalecer} Movilizar: ${pt.movilizar}`,
      peso: Math.min(pt.items.length, 4) * 1.1,
    });
  }
  return lista.sort((a, b) => b.peso - a.peso).slice(0, max);
}

/** Análisis completo de la última evaluación a partir de los historiales. */
export function analizar(histAntro = [], histPostural = []) {
  const ua = ultimoCon(histAntro, (r) => r.metricas?.length);
  const up = ultimoCon(histPostural, (r) => r.nota != null);
  const antro = analizarAntropometria(ua);
  const postural = analizarPostural(up);
  const puntos = (antro?.nota ?? 0) + (postural?.nota ?? 0);
  const completa = antro?.nota != null && postural != null;
  const etiqueta = completa ? calificar(puntos, 25) : null;
  return {
    total: { puntos: round1(puntos), max: 25, completa, etiqueta, texto: etiqueta ? TEXTO_GLOBAL[etiqueta] : null },
    antro,
    postural,
    prioridades: prioridades(antro, postural),
  };
}

// ---------- Evolución ----------

const ordenar = (h) => (h || []).filter((r) => r && r.fecha).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
const metrica = (r, id) => r?.metricas?.find((m) => m.id === id);

/** Series temporales para las gráficas. */
export function series(histAntro = [], histPostural = []) {
  const a = ordenar(histAntro);
  const p = ordenar(histPostural).filter((r) => r.nota != null);
  const serie = (regs, f) => regs.map((r) => ({ fecha: r.fecha, valor: f(r) })).filter((x) => Number.isFinite(x.valor));
  return {
    antro: serie(a, (r) => r.nota),
    postural: serie(p, (r) => r.nota),
    peso: serie(a, (r) => r.datos?.peso),
    grasa: serie(a, (r) => metrica(r, "grasa")?.valor),
    muscular: serie(a, (r) => metrica(r, "muscular")?.valor),
    visceral: serie(a, (r) => metrica(r, "visceral")?.valor),
  };
}

/** Compara la primera y la última medición de cada serie. */
export function comparar(serie, menosEsMejor = false) {
  if (!serie || serie.length < 2) return null;
  const ini = serie[0], fin = serie.at(-1);
  const d = round1(fin.valor - ini.valor);
  const dias = Math.round((new Date(fin.fecha) - new Date(ini.fecha)) / 86400000);
  return { inicio: ini.valor, actual: fin.valor, delta: d, dias, mejora: d === 0 ? null : menosEsMejor ? d < 0 : d > 0 };
}

/** Alteraciones corregidas, nuevas y que persisten entre la primera y la última evaluación postural. */
export function evolucionPostural(histPostural = []) {
  const p = ordenar(histPostural).filter((r) => Array.isArray(r.desviaciones));
  if (p.length < 2) return null;
  const ini = p[0].desviaciones, fin = p.at(-1).desviaciones;
  const idsFin = new Set(fin.map((d) => d.id)), idsIni = new Set(ini.map((d) => d.id));
  return {
    corregidas: ini.filter((d) => !idsFin.has(d.id)),
    nuevas: fin.filter((d) => !idsIni.has(d.id)),
    persisten: fin.filter((d) => idsIni.has(d.id)),
  };
}

/** Fecha recomendada para repetir las evaluaciones (5 semanas tras la última). */
export function proximaEvaluacion(histAntro = [], histPostural = [], semanas = 5) {
  const fechas = [...ordenar(histAntro), ...ordenar(histPostural)].map((r) => new Date(r.fecha).getTime());
  if (!fechas.length) return null;
  return new Date(Math.max(...fechas) + semanas * 7 * 86400000).toISOString();
}

// ---------- utilidades ----------

function ultimoCon(hist, cond) {
  return ordenar(hist).filter(cond).at(-1) ?? null;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function fmtNum(n) {
  return Number.isFinite(n) ? String(round1(n)).replace(".", ",") : "–";
}

// ---------- Datos para el plan de rutina de gimnasio ----------
//
// El plan de rutina lee `sportfy.analisis` (localStorage) con lo que necesita
// de la evaluación: objetivo, frecuencia, cardio, ejercicios correctivos y
// precauciones. Formato estable: añade campos, no cambies los existentes.

import { calcularPlan } from "./plan.js";

export const ANALISIS_KEY = "sportfy.analisis";

// Ejercicios correctivos (nombres cortos) y precauciones para el gimnasio por patrón.
export const CORRECTIVOS = {
  cruzadoSuperior: {
    fortalecer: ["Remo con mancuerna", "Face pull", "Y-T-W en banco inclinado", "Retracción de barbilla"],
    movilizar: ["Estiramiento de pectoral en marco de puerta", "Extensión dorsal en foam roller", "Wall angel"],
    precaucion: "Prioriza tirones sobre empujes (2:1). Press militar y press banca con rango controlado hasta mejorar la postura de hombros.",
  },
  hombrosAtras: {
    fortalecer: ["Push-up plus", "Press inclinado con mancuernas", "Puñetazo de serrato en polea"],
    movilizar: ["Movilidad torácica en cuadrupedia", "Estiramiento de dorsal"],
    precaucion: "No abuses de los remos con retracción forzada: equilibra con empujes.",
  },
  cruzadoInferior: {
    fortalecer: ["Puente de glúteo", "Hip thrust", "Dead bug", "Plancha con retroversión"],
    movilizar: ["Estiramiento de psoas en zancada", "Estiramiento de cuádriceps"],
    precaucion: "En sentadilla y peso muerto mantén la pelvis neutra y el abdomen activo; evita arquear la zona lumbar al bloquear.",
  },
  retroversion: {
    fortalecer: ["Peso muerto rumano", "Bird dog", "Elevación de rodillas colgado"],
    movilizar: ["Estiramiento de isquiotibiales", "Sentadilla asistida para movilidad de cadera"],
    precaucion: "Limita la profundidad de la sentadilla hasta donde la zona lumbar no se redondee (sin 'butt wink').",
  },
  rodillasDentro: {
    fortalecer: ["Monster walk con banda", "Sentadilla con banda en rodillas", "Short foot", "Elevación de talones"],
    movilizar: ["Movilidad de tobillo rodilla a la pared", "Estiramiento de gemelo y sóleo"],
    precaucion: "En sentadillas, zancadas y saltos empuja las rodillas hacia fuera, en la línea del pie. Evita saltos y pliometría hasta controlar el valgo.",
  },
  rodillasFuera: {
    fortalecer: ["Sentadilla sumo", "Aductores con banda o máquina", "Equilibrio a una pierna"],
    movilizar: ["Foam roller en cintilla iliotibial y glúteo", "Movilidad del pie con pelota"],
    precaucion: "Vigila que el apoyo sea en todo el pie (no solo el borde externo) en sentadillas y zancadas.",
  },
  asimetria: {
    fortalecer: ["Zancada", "Sentadilla búlgara", "Puente a una pierna", "Paseo del granjero a una mano"],
    movilizar: ["Estiramiento de cuadrado lumbar", "Movilidad de cadera del lado más cargado"],
    precaucion: "Incluye trabajo unilateral y empieza siempre por el lado débil, haciendo las mismas repeticiones con los dos.",
  },
  gluteoDebil: {
    fortalecer: ["Puente de glúteo con pies cerca", "Hip thrust", "Clamshell con banda", "Patada de glúteo en polea"],
    movilizar: ["Estiramiento de isquiotibiales", "Estiramiento de flexores de cadera"],
    precaucion: "Haz activación de glúteo en el calentamiento antes de sentadillas y peso muerto.",
  },
};

/**
 * Objetivo principal de la rutina a partir de la antropometría:
 * - perdidaGrasa: grasa o visceral en riesgo.
 * - ganarMusculo: músculo bajo y grasa correcta.
 * - recomposicion: grasa mejorable y músculo bajo/normal.
 * - rendimiento: todo en buen rango.
 */
export function objetivoRutina(antro) {
  const pts = (id) => antro?.pruebas.find((p) => p.id === id)?.puntos;
  const grasa = pts("grasa"), visc = pts("visceral"), musc = pts("muscular");
  const grasaBaja = antro?.pruebas.some((p) => p.id === "grasa" && /esencial/i.test(p.categoria || ""));
  if (!antro) return null;
  if (!grasaBaja && ((grasa != null && grasa <= 1) || (visc != null && visc <= 1))) {
    return { id: "perdidaGrasa", nombre: "Pérdida de grasa", texto: "Bajar grasa (sobre todo visceral) conservando y ganando músculo." };
  }
  if (grasaBaja || (musc != null && musc <= 1 && (grasa == null || grasa >= 2))) {
    return { id: "ganarMusculo", nombre: "Ganar músculo", texto: "Ganar masa muscular con superávit calórico ligero y fuerza progresiva." };
  }
  if ((grasa != null && grasa === 2) || (musc != null && musc <= 2)) {
    return { id: "recomposicion", nombre: "Recomposición corporal", texto: "Perder algo de grasa y ganar músculo a la vez." };
  }
  return { id: "rendimiento", nombre: "Rendimiento y mantenimiento", texto: "Mantener la composición y mejorar fuerza y rendimiento." };
}

const PLAN_OBJETIVO = {
  perdidaGrasa: { diasFuerza: 3, diasCardio: 3, repeticiones: "10–15", cardio: "Cardio moderado 30–45 min (zona 2) y 8.000–10.000 pasos diarios" },
  ganarMusculo: { diasFuerza: 4, diasCardio: 1, repeticiones: "6–12", cardio: "Cardio suave 20–30 min, 1–2 días" },
  recomposicion: { diasFuerza: 4, diasCardio: 2, repeticiones: "8–12", cardio: "Cardio moderado 25–35 min, 2 días" },
  rendimiento: { diasFuerza: 4, diasCardio: 2, repeticiones: "5–12", cardio: "Intervalos 1 día y cardio moderado 1 día" },
};

/**
 * Resumen de la evaluación que necesita el plan de rutina de gimnasio.
 * Devuelve null si no hay ninguna evaluación guardada.
 */
export function perfilRutina(histAntro = [], histPostural = [], { actividad = "ligera" } = {}) {
  const a = analizar(histAntro, histPostural);
  if (!a.antro && !a.postural) return null;
  const objetivo = objetivoRutina(a.antro) ?? { id: "rendimiento", nombre: "Forma física general", texto: "Completa la evaluación antropométrica para afinar el objetivo." };
  const nivelInicial = a.total.completa
    ? (a.total.puntos / 25 >= 0.7 ? "intermedio" : "principiante")
    : "principiante";
  const correctivos = (a.postural?.patrones ?? []).map((p) => ({
    patron: p.id,
    nombre: p.nombre,
    ...CORRECTIVOS[p.id],
    ladoDebil: p.unLado.length ? [...new Set(p.unLado)] : null,
  }));
  const ultimo = ordenar([...histAntro, ...histPostural]).at(-1);
  const ultAntro = ordenar(histAntro).at(-1);
  const plan = ultAntro?.datos ? calcularPlan(ultAntro.datos, objetivo.id, { actividad, nivel: nivelInicial, historial: histAntro }) : null;
  return {
    version: 1,
    fecha: ultimo?.fecha ?? new Date().toISOString(),
    nota: { total: a.total.puntos, max: 25, completa: a.total.completa, calificacion: a.total.etiqueta,
      antropometria: a.antro?.nota ?? null, postural: a.postural?.nota ?? null },
    objetivo,
    nivelInicial,
    ...PLAN_OBJETIVO[objetivo.id],
    plan,
    datos: a.antro ? Object.fromEntries(a.antro.pruebas.map((p) => [p.id, { valor: p.valor, puntos: p.puntos, categoria: p.categoria }])) : {},
    peso: ordenar(histAntro).at(-1)?.datos?.peso ?? null,
    correctivos,
    precauciones: correctivos.map((c) => c.precaucion).filter(Boolean),
    prioridades: a.prioridades.map(({ tipo, id, titulo, foco }) => ({ tipo, id, titulo, foco })),
    proximaEvaluacion: proximaEvaluacion(histAntro, histPostural),
  };
}

/** Guarda el perfil para el plan de rutina; devuelve lo guardado. */
export function guardarPerfilRutina(perfil, storage = globalThis.localStorage) {
  if (!perfil) return null;
  try { storage.setItem(ANALISIS_KEY, JSON.stringify(perfil)); } catch { /* sin almacenamiento */ }
  return perfil;
}
