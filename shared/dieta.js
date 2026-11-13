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
 * Plan de dieta a partir del plan calórico y la rutina.
 * plan: resultado de calcularPlan (kcal, macros, agua, objetivo).
 * opciones: { diasEntreno: [0..6], comidas: 4|5, condiciones: [ids] }.
 */
export function calcularDieta(plan, { diasEntreno = [], comidas = 5, condiciones = [] } = {}) {
  if (!plan) return null;
  const { kcal, macros } = plan;
  const nEntreno = Math.min(7, new Set(diasEntreno).size);
  const nDescanso = 7 - nEntreno;

  // Días de entreno con más hidratos y días de descanso con menos, con la misma media semanal.
  // Proteína igual todos los días; la grasa compensa un poco en los días de descanso.
  const ciclo = nEntreno && nDescanso ? 0.15 : 0;
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
    kcal, macros,
    proteinaPorComida: r5(macros.proteina / reparto.length),
    agua: plan.agua,
    fibra: Math.round(kcal / 1000 * 14),
    diaEntreno: { ...entreno, comidas: porComida(entreno) },
    diaDescanso: { ...descanso, comidas: porComida(descanso) },
    ciclado: ciclo > 0,
    entrenamiento: {
      antes: `1–3 h antes: unos ${r5(macros.proteina * 0.2)} g de proteína y ${r5(entreno.hidratos * 0.25)} g de hidratos fáciles de digerir (por ejemplo, yogur con avena y fruta).`,
      despues: `En las 2 h siguientes: unos ${r5(macros.proteina * 0.25)} g de proteína y ${r5(entreno.hidratos * 0.3)} g de hidratos para recuperar.`,
    },
    salud: conds.map((c) => ({ id: c, texto: DIETA_CONDICIONES[c] })),
    consejos: consejos(plan),
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
