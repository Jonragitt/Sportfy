// Motor de dieta de Forty5: parte de las kcal y macros del plan (shared/plan.js) y de la
// rutina (días de entreno) para repartir la comida en el día y en la semana.
// Módulo puro (sin DOM) para testearlo con `node --test`.

const r5 = (n) => Math.round(n / 5) * 5;
const r10 = (n) => Math.round(n / 10) * 10;

// Alimentos de referencia por 100 g (o por unidad indicada en `unidad`).
export const ALIMENTOS = {
  pollo: { nombre: "Pechuga de pollo o pavo", p: 23, h: 0, g: 2, tipo: "proteina" },
  pescado: { nombre: "Pescado blanco o salmón", p: 21, h: 0, g: 5, tipo: "proteina" },
  huevos: { nombre: "Huevos", p: 13, h: 1, g: 10, tipo: "proteina", unidad: { nombre: "huevo", g: 60 } },
  yogur: { nombre: "Yogur griego natural o skyr", p: 10, h: 4, g: 2, tipo: "proteina" },
  legumbre: { nombre: "Legumbres cocidas", p: 8, h: 18, g: 1, tipo: "hidratos" },
  arroz: { nombre: "Arroz o pasta (cocidos)", p: 3, h: 28, g: 0.5, tipo: "hidratos" },
  patata: { nombre: "Patata o boniato (cocidos)", p: 2, h: 18, g: 0.1, tipo: "hidratos" },
  avena: { nombre: "Copos de avena", p: 13, h: 60, g: 7, tipo: "hidratos" },
  pan: { nombre: "Pan integral", p: 9, h: 43, g: 3, tipo: "hidratos" },
  fruta: { nombre: "Fruta", p: 1, h: 12, g: 0.2, tipo: "hidratos" },
  aceite: { nombre: "Aceite de oliva virgen extra", p: 0, h: 0, g: 100, tipo: "grasa", unidad: { nombre: "cucharada", g: 10 } },
  frutosSecos: { nombre: "Frutos secos naturales", p: 20, h: 10, g: 50, tipo: "grasa" },
  aguacate: { nombre: "Aguacate", p: 2, h: 2, g: 15, tipo: "grasa" },
};

// Reparto de las comidas del día (fracción de las kcal). Con 5 comidas cabe pre y post entreno.
const COMIDAS = {
  4: [["Desayuno", 0.25], ["Comida", 0.35], ["Merienda", 0.15], ["Cena", 0.25]],
  5: [["Desayuno", 0.22], ["Media mañana", 0.1], ["Comida", 0.3], ["Merienda", 0.13], ["Cena", 0.25]],
};

// Alimentos del ejemplo de cada comida: [proteína, hidrato, grasa].
const MENU = {
  Desayuno: ["yogur", "avena", "frutosSecos"],
  "Media mañana": ["huevos", "pan", "aceite"],
  Comida: ["pollo", "arroz", "aceite"],
  Merienda: ["yogur", "fruta", "frutosSecos"],
  Cena: ["pescado", "patata", "aceite"],
};

// Ajustes de la dieta por condición de salud (ids de CONDICIONES en shared/rutina.js).
export const DIETA_CONDICIONES = {
  hipertension: "Sal por debajo de 5 g al día: evita embutidos, precocinados y snacks salados, y prioriza fruta, verdura y legumbre (potasio).",
  diabetes: "Hidratos repartidos en todas las comidas y siempre acompañados de proteína y fibra. Prioriza integrales y legumbre, y controla la glucosa antes y después de entrenar.",
  cardiaco: "Grasas sobre todo de aceite de oliva, pescado azul y frutos secos; limita las grasas saturadas y la sal.",
  embarazo: "Sin déficit calórico. Evita alcohol, pescados grandes (pez espada, atún rojo), carnes y huevos poco hechos y lácteos sin pasteurizar. Sigue las indicaciones de tu matrona o médico.",
  postparto: "No hagas déficit fuerte, sobre todo si das el pecho: prioriza proteína, hierro y calcio.",
  osteoporosis: "Calcio (lácteos, bebida vegetal enriquecida, sardinas) y vitamina D cada día, y suficiente proteína.",
  artrosis: "Mantén un peso saludable para descargar las articulaciones y prioriza pescado azul, fruta y verdura.",
};

/**
 * Recalcula kcal y macros del plan según las condiciones de salud. Devuelve el plan
 * ajustado, si se reparten los hidratos por igual (sin ciclado), las comidas mínimas,
 * los objetivos extra (sodio, calcio, fibra…) y la lista de cambios aplicados.
 */
export function ajustarPorSalud(plan, condiciones = [], peso = null) {
  const c = new Set(condiciones);
  let { kcal } = plan;
  let { proteina, grasa, hidratos } = plan.macros;
  const mant = plan.mantenimiento ?? kcal;
  const cambios = [];
  let sinCiclado = false, comidasMin = null;
  const extra = {};
  const kg = peso ?? (plan.agua ? (plan.agua - 0.5) / 0.035 : null);

  // Embarazo: nunca déficit; +300 kcal sobre mantenimiento (2.º–3.er trimestre) y proteína ≥ 1,1 g/kg.
  if (c.has("embarazo")) {
    const k = Math.max(kcal, mant + 300);
    if (k !== kcal) cambios.push(`Embarazo: sin déficit y unas 300 kcal más sobre tu mantenimiento (${r10(k)} kcal).`);
    kcal = k; sinCiclado = true;
    if (kg && proteina < kg * 1.1) proteina = r5(kg * 1.1);
    extra.hierro = "27 mg/día"; extra.acidoFolico = "suplemento según tu médico";
  }
  // Postparto: déficit suave como máximo (–300 kcal) para no afectar la recuperación ni la lactancia.
  if (c.has("postparto") && kcal < mant - 300) {
    cambios.push(`Postparto: déficit limitado a 300 kcal (${r10(mant - 300)} kcal en lugar de ${r10(kcal)}).`);
    kcal = mant - 300;
  }
  // Osteoporosis: proteína ≥ 1,2 g/kg y déficit moderado (perder hueso al adelgazar rápido).
  if (c.has("osteoporosis")) {
    if (kg && proteina < kg * 1.2) { proteina = r5(kg * 1.2); cambios.push(`Osteoporosis: proteína mínima de 1,2 g por kg (${proteina} g).`); }
    if (kcal < mant - 400) { cambios.push("Osteoporosis: déficit limitado a 400 kcal para no perder masa ósea."); kcal = mant - 400; }
    extra.calcio = "1.200 mg/día"; extra.vitaminaD = "800–1.000 UI/día (consulta a tu médico)";
  }
  kcal = r10(kcal);
  // Grasa: se recalcula para cuadrar las nuevas kcal, después de fijar la proteína.
  grasa = Math.max(grasa * kcal / plan.kcal, 0.7 * (kg ?? 70));   // si suben o bajan las kcal, la grasa acompaña en proporción
  hidratos = Math.max(0, (kcal - proteina * 4 - grasa * 9) / 4);

  // Diabetes: hidratos ≤ 40 % de las kcal y repartidos igual cada día y en 5 comidas.
  if (c.has("diabetes")) {
    const max = kcal * 0.4 / 4;
    if (hidratos > max) {
      cambios.push(`Diabetes: hidratos limitados al 40 % de las calorías (${r5(max)} g en lugar de ${r5(hidratos)} g); el resto pasa a grasas saludables.`);
      hidratos = max;
    } else cambios.push("Diabetes: hidratos repartidos por igual en todas las comidas.");
    sinCiclado = true; comidasMin = 5;
    extra.fibra = Math.round(kcal / 1000 * 18);
  }
  // Cardíaco: grasa ≤ 30 % (saturadas < 7 %), sodio < 2.000 mg.
  if (c.has("cardiaco")) {
    const max = kcal * 0.3 / 9;
    if (grasa > max) { cambios.push(`Problema cardíaco: grasa limitada al 30 % de las calorías (${r5(max)} g).`); grasa = max; }
    extra.saturadas = `menos de ${r5(kcal * 0.07 / 9)} g/día`; extra.sodio = "menos de 2.000 mg/día (5 g de sal)";
  }
  // Hipertensión: patrón DASH, sodio < 2.000 mg y más potasio y fibra.
  if (c.has("hipertension")) {
    extra.sodio = "menos de 2.000 mg/día (5 g de sal)"; extra.potasio = "3.500–4.700 mg/día (fruta, verdura, legumbre)";
    extra.fibra = Math.max(extra.fibra ?? 0, Math.round(kcal / 1000 * 16));
    cambios.push("Hipertensión: dieta tipo DASH, con menos de 5 g de sal y más fruta, verdura y legumbre.");
  }
  // Artrosis: más omega-3 y control del peso.
  if (c.has("artrosis")) { extra.omega3 = "pescado azul 2–3 veces por semana"; }

  // Lo que falte o sobre tras los límites se compensa con la grasa (diabetes) o los hidratos (cardíaco).
  const resto = kcal - proteina * 4 - hidratos * 4 - grasa * 9;
  if (Math.abs(resto) > 20) {
    if (c.has("cardiaco") && !c.has("diabetes")) hidratos += resto / 4;
    else grasa += resto / 9;
  }
  const ajustado = { ...plan, kcal, macros: { proteina: r5(proteina), grasa: r5(Math.max(0, grasa)), hidratos: r5(Math.max(0, hidratos)) } };
  return { plan: ajustado, sinCiclado, comidasMin, extra, cambios };
}

/**
 * Plan de dieta a partir del plan calórico y la rutina.
 * plan: resultado de calcularPlan (kcal, macros, agua, objetivo).
 * opciones: { diasEntreno: [0..6], comidas: 4|5, condiciones: [ids] }.
 */
export function calcularDieta(planBase, { diasEntreno = [], comidas = 5, condiciones = [], peso = null } = {}) {
  if (!planBase) return null;
  const salud = ajustarPorSalud(planBase, condiciones, peso);
  const plan = salud.plan;
  const { kcal, macros } = plan;
  if (salud.comidasMin && comidas < salud.comidasMin) comidas = salud.comidasMin;
  const nEntreno = Math.min(7, new Set(diasEntreno).size);
  const nDescanso = 7 - nEntreno;

  // Días de entreno con más hidratos y días de descanso con menos, con la misma media semanal.
  // Proteína igual todos los días; la grasa compensa un poco en los días de descanso.
  const ciclo = nEntreno && nDescanso && !salud.sinCiclado ? 0.15 : 0;
  const hEntreno = macros.hidratos * (1 + ciclo * nDescanso / 7);
  const hDescanso = macros.hidratos * (1 - ciclo * nEntreno / 7);
  const dia = (h) => {
    const g = Math.max(0, (kcal - macros.proteina * 4 - h * 4) / 9);
    return { kcal: r10(macros.proteina * 4 + h * 4 + g * 9), proteina: macros.proteina, hidratos: r5(h), grasa: r5(g) };
  };
  const entreno = dia(hEntreno), descanso = dia(hDescanso);

  const reparto = COMIDAS[comidas] ?? COMIDAS[5];
  const porComida = (d) => reparto.map(([nombre, f]) => ({
    nombre, kcal: r10(d.kcal * f),
    proteina: r5(d.proteina * f), hidratos: r5(d.hidratos * f), grasa: r5(d.grasa * f),
    ejemplo: ejemplo(nombre, { proteina: d.proteina * f, hidratos: d.hidratos * f, grasa: d.grasa * f }),
  }));

  const conds = condiciones.filter((c) => DIETA_CONDICIONES[c]);
  return {
    kcal, macros, comidas,
    base: { kcal: planBase.kcal, macros: planBase.macros },
    cambios: salud.cambios, objetivosSalud: salud.extra,
    proteinaPorComida: r5(macros.proteina / reparto.length),
    agua: plan.agua,
    fibra: salud.extra.fibra ?? Math.round(kcal / 1000 * 14),
    diaEntreno: { ...entreno, comidas: porComida(entreno) },
    diaDescanso: { ...descanso, comidas: porComida(descanso) },
    ciclado: ciclo > 0,
    entrenamiento: {
      antes: `1–3 h antes: unos ${r5(macros.proteina * 0.2)} g de proteína y ${r5(entreno.hidratos * 0.25)} g de hidratos fáciles de digerir (por ejemplo, yogur con avena y fruta).`,
      despues: `En las 2 h siguientes: unos ${r5(macros.proteina * 0.25)} g de proteína y ${r5(entreno.hidratos * 0.3)} g de hidratos para recuperar.`,
    },
    salud: conds.map((c) => ({ id: c, texto: DIETA_CONDICIONES[c] })),
    consejos: consejos(planBase),
  };
}

/** Raciones aproximadas (en gramos) de un ejemplo de comida que cuadran con sus macros. */
export function ejemplo(nombre, m) {
  const [ip, ih, ig] = MENU[nombre] ?? MENU.Comida;
  const P = ALIMENTOS[ip], H = ALIMENTOS[ih], G = ALIMENTOS[ig];
  // Primero la proteína, después los hidratos y por último la grasa que falte.
  const gP = Math.max(0, m.proteina / P.p * 100);
  const gH = Math.max(0, (m.hidratos - gP * P.h / 100) / H.h * 100);
  const gG = Math.max(0, (m.grasa - gP * P.g / 100 - gH * H.g / 100) / G.g * 100);
  return [[ip, gP], [ih, gH], [ig, gG]].filter(([, g]) => g >= 5).map(([id, g]) => racion(id, g));
}

function racion(id, gramos) {
  const a = ALIMENTOS[id];
  if (a.unidad) {
    const n = Math.max(1, Math.round(gramos / a.unidad.g * 2) / 2);
    return { id, nombre: a.nombre, texto: `${n.toLocaleString("es-ES")} ${a.unidad.nombre}${n > 1 ? "s" : ""}` };
  }
  return { id, nombre: a.nombre, texto: `${r5(gramos)} g` };
}

function consejos(plan) {
  const c = ["Verdura en la comida y en la cena (al menos medio plato): sacia, aporta fibra y apenas suma calorías."];
  if (plan.diferencia < 0) c.push("Estás en déficit: prioriza proteína y verdura en cada plato para controlar el hambre, y no recortes más calorías por tu cuenta.");
  if (plan.diferencia > 0) c.push("Estás en superávit: si te cuesta llegar a las calorías, añade frutos secos, aceite de oliva o batidos en lugar de comer más volumen.");
  c.push("Pésate en ayunas 2–3 veces por semana y fíjate en la media: el motor ajusta las calorías cuando repites la evaluación.");
  return c;
}
