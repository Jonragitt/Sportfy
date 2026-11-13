// Motor de dieta de Forty5: parte de las kcal y macros del plan (shared/plan.js) y de la
// rutina (días de entreno) para repartir la comida en el día y en la semana.
// Módulo puro (sin DOM) para testearlo con `node --test`.

const r5 = (n) => Math.round(n / 5) * 5;
const r10 = (n) => Math.round(n / 10) * 10;

// Alimentos de referencia por 100 g (o por unidad indicada en `unidad`): básicos de
// supermercado, baratos y fáciles de preparar (nada de recetas complejas).
export const ALIMENTOS = {
  pollo: { nombre: "Pechuga de pollo o pavo", p: 23, h: 0, g: 2, tipo: "proteina" },
  pescado: { nombre: "Merluza o abadejo congelado", p: 18, h: 0, g: 1, tipo: "proteina" },
  atun: { nombre: "Atún en lata al natural", p: 24, h: 0, g: 1, tipo: "proteina" },
  picada: { nombre: "Carne picada de pollo o pavo", p: 20, h: 0, g: 5, tipo: "proteina" },
  lomo: { nombre: "Lomo de cerdo o pechuga en filetes", p: 22, h: 0, g: 5, tipo: "proteina" },
  huevos: { nombre: "Huevos", p: 13, h: 1, g: 10, tipo: "proteina", unidad: { nombre: "huevo", g: 60 }, max: 240 },
  yogur: { nombre: "Queso fresco batido o yogur natural", p: 8, h: 4, g: 0.5, tipo: "proteina", max: 350 },
  quesoFresco: { nombre: "Queso fresco tipo Burgos", p: 12, h: 3, g: 8, tipo: "proteina", max: 150 },
  pavo: { nombre: "Pechuga de pavo en lonchas", p: 20, h: 2, g: 2, tipo: "proteina", max: 120 },
  leche: { nombre: "Leche semidesnatada o bebida de soja", p: 3.3, h: 4.8, g: 1.5, tipo: "proteina", ml: true },
  legumbre: { nombre: "Legumbres cocidas de bote (garbanzos, lentejas)", p: 8, h: 18, g: 1, tipo: "hidratos" },
  arroz: { nombre: "Arroz (cocido)", p: 3, h: 28, g: 0.5, tipo: "hidratos" },
  pasta: { nombre: "Pasta (cocida)", p: 5, h: 30, g: 1, tipo: "hidratos" },
  patata: { nombre: "Patata o boniato (cocidos)", p: 2, h: 18, g: 0.1, tipo: "hidratos" },
  avena: { nombre: "Copos de avena", p: 13, h: 60, g: 7, tipo: "hidratos" },
  pan: { nombre: "Pan integral", p: 9, h: 43, g: 3, tipo: "hidratos" },
  tortilla: { nombre: "Tortillas de trigo (wrap)", p: 8, h: 50, g: 7, tipo: "hidratos", unidad: { nombre: "tortilla", g: 40 } },
  fruta: { nombre: "Fruta de temporada (plátano, manzana, naranja)", p: 1, h: 14, g: 0.2, tipo: "hidratos", max: 300 },
  aceite: { nombre: "Aceite de oliva virgen extra", p: 0, h: 0, g: 100, tipo: "grasa", unidad: { nombre: "cucharada", g: 10 } },
  frutosSecos: { nombre: "Cacahuetes naturales o crema de cacahuete", p: 26, h: 12, g: 49, tipo: "grasa" },
  };

// Reparto de las comidas del día (fracción de las kcal). Con 5 comidas cabe pre y post entreno.
const COMIDAS = {
  4: [["Desayuno", 0.25], ["Comida", 0.35], ["Merienda", 0.15], ["Cena", 0.25]],
  5: [["Desayuno", 0.22], ["Media mañana", 0.1], ["Comida", 0.3], ["Merienda", 0.13], ["Cena", 0.25]],
};

// Opciones de cada comida, todas sencillas y baratas. Cada alimento tiene un papel: cubre la
// proteína (p), los hidratos (h) o la grasa (g) que faltan, repartida según `parte`; `fijo` son
// gramos o ml fijos. `evitar`: condiciones de salud en las que no se propone esa opción.
const A = (id, rol, parte = 1) => ({ id, rol, parte });
const F = (id, fijo) => ({ id, fijo });
const SIN_FIAMBRE = ["hipertension", "cardiaco", "embarazo"];
export const OPCIONES = {
  Desayuno: [
    { id: "bol", nombre: "Bol de queso batido con avena y cacahuetes", alimentos: [A("yogur", "p"), A("avena", "h", 0.8), A("fruta", "h", 0.2), A("frutosSecos", "g")],
      prep: "Mezcla en un bol el queso batido con la avena, la fruta troceada y los cacahuetes. 2 minutos." },
    { id: "tostadasHuevo", nombre: "Tostadas con huevos revueltos", alimentos: [A("huevos", "p", 0.6), A("yogur", "p", 0.4), A("pan", "h"), A("aceite", "g")],
      prep: "Revuelve los huevos en la sartén con un poco del aceite y ponlos sobre el pan tostado; el yogur, de postre. 5 minutos." },
    { id: "porridge", nombre: "Porridge de avena con leche y plátano", alimentos: [F("leche", 250), A("yogur", "p"), A("avena", "h", 0.7), A("fruta", "h", 0.3), A("frutosSecos", "g")],
      prep: "Calienta la avena con la leche 2 minutos en el microondas, añade el plátano en rodajas, el queso batido y los cacahuetes. 4 minutos." },
    { id: "tostadaQueso", nombre: "Tostadas de queso fresco y pavo con fruta", evitar: SIN_FIAMBRE, alimentos: [A("quesoFresco", "p", 0.5), A("pavo", "p", 0.5), A("pan", "h", 0.7), A("fruta", "h", 0.3), A("aceite", "g")],
      prep: "Pan tostado con un chorrito de aceite, tomate rallado si quieres, el queso fresco y el pavo; la fruta, de postre. 3 minutos." },
  ],
  "Media mañana": [
    { id: "huevosPan", nombre: "Huevos cocidos con pan", alimentos: [A("huevos", "p"), A("pan", "h"), A("aceite", "g")],
      prep: "Huevos cocidos (déjalos hechos para varios días) o en tortilla, con el pan. 5 minutos." },
    { id: "bocadillo", nombre: "Bocadillo de pavo y queso fresco", evitar: SIN_FIAMBRE, alimentos: [A("pavo", "p", 0.6), A("quesoFresco", "p", 0.4), A("pan", "h"), A("aceite", "g")],
      prep: "Bocadillo con un chorrito de aceite, el pavo y el queso fresco. Se lleva fácil al trabajo. 2 minutos." },
    { id: "yogurFruta", nombre: "Yogur con fruta y cacahuetes", alimentos: [A("yogur", "p"), A("fruta", "h"), A("frutosSecos", "g")],
      prep: "Yogur o queso batido con la fruta troceada y unos cacahuetes. 2 minutos." },
  ],
  Comida: [
    { id: "polloArroz", nombre: "Pollo con arroz y verdura", alimentos: [A("pollo", "p"), A("arroz", "h"), A("aceite", "g")],
      prep: "Pollo a la plancha y arroz cocido (o de vaso de microondas), con verdura congelada salteada. 15 minutos." },
    { id: "legumbreAtun", nombre: "Lentejas o garbanzos con atún", alimentos: [A("atun", "p"), A("legumbre", "h"), A("aceite", "g")],
      prep: "Legumbre de bote enjuagada, salteada 3 minutos con verdura congelada y el atún, con el aceite en crudo. 8 minutos." },
    { id: "pastaPicada", nombre: "Pasta con carne picada y tomate", alimentos: [A("picada", "p"), A("pasta", "h"), A("aceite", "g")],
      prep: "Cuece la pasta y, mientras, dora la picada con el aceite y tomate triturado de bote (sin azúcar). 15 minutos." },
    { id: "lomoPatata", nombre: "Lomo a la plancha con patata", alimentos: [A("lomo", "p"), A("patata", "h"), A("aceite", "g")],
      prep: "Patata troceada 8 minutos al microondas con un poco de agua y el lomo a la plancha, con ensalada. 12 minutos." },
  ],
  Merienda: [
    { id: "yogurFruta", nombre: "Yogur con fruta y cacahuetes", alimentos: [A("yogur", "p"), A("fruta", "h"), A("frutosSecos", "g")],
      prep: "Queso batido o yogur con la fruta troceada y unos cacahuetes. 2 minutos." },
    { id: "batido", nombre: "Batido de leche, plátano y avena", alimentos: [F("leche", 250), A("yogur", "p"), A("fruta", "h", 0.6), A("avena", "h", 0.4), A("frutosSecos", "g")],
      prep: "Todo a la batidora: leche, queso batido, plátano, avena y una cucharadita de crema de cacahuete. 3 minutos." },
    { id: "tostadaPavo", nombre: "Tostada de pavo con fruta", evitar: SIN_FIAMBRE, alimentos: [A("pavo", "p"), A("pan", "h", 0.6), A("fruta", "h", 0.4), A("aceite", "g")],
      prep: "Tostada con un chorrito de aceite y el pavo; la fruta, aparte. 2 minutos." },
    { id: "huevosFruta", nombre: "Huevo cocido, yogur y fruta", alimentos: [A("huevos", "p", 0.4), A("yogur", "p", 0.6), A("fruta", "h"), A("frutosSecos", "g")],
      prep: "Un huevo cocido que tengas hecho, un yogur o queso batido y una pieza de fruta. 1 minuto." },
  ],
  Cena: [
    { id: "merluzaPatata", nombre: "Merluza con patata y verdura", alimentos: [A("pescado", "p"), A("patata", "h"), A("aceite", "g")],
      prep: "Merluza, patata y verdura cocidas al microondas o al vapor, aliñadas con el aceite. 10 minutos." },
    { id: "tortillaFrancesa", nombre: "Tortilla de atún con pan", alimentos: [A("huevos", "p", 0.5), A("atun", "p", 0.5), A("pan", "h"), A("aceite", "g")],
      prep: "Tortilla francesa con el atún escurrido y una cucharadita del aceite, con el pan y ensalada o verdura al lado. 7 minutos." },
    { id: "wrap", nombre: "Wraps de pollo y verdura", alimentos: [A("pollo", "p"), A("tortilla", "h"), A("aceite", "g")],
      prep: "Pollo en tiras a la plancha con pimiento y cebolla (valen congelados), dentro de las tortillas con lechuga. 12 minutos." },
    { id: "ensaladaGarbanzos", nombre: "Ensalada de garbanzos, atún y huevo", alimentos: [A("atun", "p", 0.7), A("huevos", "p", 0.3), A("legumbre", "h"), A("aceite", "g")],
      prep: "Garbanzos de bote enjuagados con atún, huevo cocido, tomate, cebolla y el aceite. 5 minutos." },
  ],
};
/** Opciones de una comida que encajan con las condiciones de salud. */
export function opcionesDe(nombre, condiciones = []) {
  const todas = OPCIONES[nombre] ?? OPCIONES.Comida;
  const ok = todas.filter((o) => !o.evitar?.some((c) => condiciones.includes(c)));
  return ok.length ? ok : todas;
}
export const AHORRO = [
  "Compra pollo, merluza y verdura congelados: cuestan menos, no se estropean y se cocinan igual.",
  "Huevos, legumbre de bote, arroz, avena y patata son de lo más barato por gramo de proteína o hidrato.",
  "Cocina el arroz, la legumbre o el pollo para 2–3 días y guárdalo en táperes.",
  "Marcas blancas del supermercado: mismo valor nutricional por mucho menos.",
];

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
 * opciones: { diasEntreno: [0..6], comidas: 4|5, condiciones: [ids], eleccion: {comida: idOpción},
 *   dia: 0 (lunes)..6 }. Sin elección, la opción de cada comida rota sola según el día.
 */
export function calcularDieta(planBase, { diasEntreno = [], comidas = 5, condiciones = [], peso = null, eleccion = {}, dia = (new Date().getDay() + 6) % 7 } = {}) {
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
  const delDia = (h) => {
    const g = Math.max(0, (kcal - macros.proteina * 4 - h * 4) / 9);
    return { kcal: r10(macros.proteina * 4 + h * 4 + g * 9), proteina: macros.proteina, hidratos: r5(h), grasa: r5(g) };
  };
  const entreno = delDia(hEntreno), descanso = delDia(hDescanso);

  const reparto = COMIDAS[comidas] ?? COMIDAS[5];
  const porComida = (d) => reparto.map(([nombre, f], i) => {
    const ops = opcionesDe(nombre, condiciones);
    const elegida = ops.find((o) => o.id === eleccion[nombre]);
    const op = elegida ?? ops[(dia + i) % ops.length];
    return {
      nombre, kcal: r10(d.kcal * f),
      proteina: r5(d.proteina * f), hidratos: r5(d.hidratos * f), grasa: r5(d.grasa * f),
      opciones: ops.map((o) => ({ id: o.id, nombre: o.nombre })), opcion: op.id, plato: op.nombre, auto: !elegida,
      ejemplo: ejemplo(op, { proteina: d.proteina * f, hidratos: d.hidratos * f, grasa: d.grasa * f }),
      preparacion: op.prep,
    };
  });

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
      antes: `1–3 h antes: unos ${r5(macros.proteina * 0.2)} g de proteína y ${r5(entreno.hidratos * 0.25)} g de hidratos fáciles de digerir (por ejemplo, queso batido con avena y un plátano).`,
      despues: `En las 2 h siguientes: unos ${r5(macros.proteina * 0.25)} g de proteína y ${r5(entreno.hidratos * 0.3)} g de hidratos para recuperar.`,
    },
    salud: conds.map((c) => ({ id: c, texto: DIETA_CONDICIONES[c] })),
    consejos: consejos(planBase),
    ahorro: AHORRO,
  };
}

/**
 * Raciones aproximadas de una opción (o del nombre de una comida: su primera opción) que cuadran
 * con sus macros. Cada alimento cubre lo que falta de su macro descontando lo que aportan los
 * demás; se repite unas vueltas hasta que se estabiliza.
 */
export function ejemplo(opcion, m) {
  const op = typeof opcion === "string" ? (OPCIONES[opcion] ?? OPCIONES.Comida)[0] : opcion;
  const items = op.alimentos.map((x) => ({ ...x, a: ALIMENTOS[x.id], gr: x.fijo ?? 0 }));
  const objetivo = { p: m.proteina, h: m.hidratos, g: m.grasa };
  for (let vuelta = 0; vuelta < 6; vuelta++) {
    for (const rol of ["p", "h", "g"]) {
      const suyos = items.filter((x) => x.rol === rol);
      if (!suyos.length) continue;
      const ajeno = items.filter((x) => x.rol !== rol).reduce((s, x) => s + x.gr * x.a[rol] / 100, 0);
      const falta = Math.max(0, objetivo[rol] - ajeno);
      const partes = suyos.reduce((s, x) => s + x.parte, 0);
      for (const x of suyos) x.gr = Math.min(x.a.max ?? Infinity, falta * x.parte / partes / x.a[rol] * 100);
    }
  }
  return items.filter((x) => x.gr >= 5).map((x) => racion(x.id, x.gr));
}

function racion(id, gramos) {
  const a = ALIMENTOS[id];
  if (a.unidad) {
    const n = Math.max(1, Math.round(gramos / a.unidad.g * 2) / 2);
    return { id, nombre: a.nombre, texto: `${n.toLocaleString("es-ES")} ${a.unidad.nombre}${n > 1 ? "s" : ""}`, gramos: n * a.unidad.g };
  }
  return { id, nombre: a.nombre, texto: `${r5(gramos)} ${a.ml ? "ml" : "g"}`, gramos: r5(gramos) };
}

function consejos(plan) {
  const c = ["Verdura en la comida y en la cena (al menos medio plato): sacia, aporta fibra y apenas suma calorías."];
  if (plan.diferencia < 0) c.push("Estás en déficit: prioriza proteína y verdura en cada plato para controlar el hambre, y no recortes más calorías por tu cuenta.");
  if (plan.diferencia > 0) c.push("Estás en superávit: si te cuesta llegar a las calorías, añade frutos secos, aceite de oliva o batidos en lugar de comer más volumen.");
  c.push("Pésate en ayunas 2–3 veces por semana y fíjate en la media: el motor ajusta las calorías cuando repites la evaluación.");
  return c;
}
