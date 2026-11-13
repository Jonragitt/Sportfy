// Motor de cálculo del plan de Forty5: a partir de los datos de la báscula y del
// objetivo calcula calorías, macros y parámetros de entrenamiento, y los
// reajusta automáticamente con la evolución real entre evaluaciones.
// Módulo puro (sin DOM) para testearlo con `node --test`.

const r0 = (n) => Math.round(n);
const r1 = (n) => Math.round(n * 10) / 10;
const r5 = (n, m = 5) => Math.round(n / m) * m;
const isNum = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

// Actividad diaria fuera del gimnasio (factor NEAT sobre el metabolismo basal).
export const ACTIVIDAD = {
  sedentario: { nombre: "Sedentaria (< 5.000 pasos, trabajo sentado)", factor: 1.2 },
  ligera: { nombre: "Ligera (5.000–8.000 pasos)", factor: 1.3 },
  activa: { nombre: "Activa (8.000–12.000 pasos o trabajo de pie)", factor: 1.4 },
  muyActiva: { nombre: "Muy activa (> 12.000 pasos o trabajo físico)", factor: 1.55 },
};

// Gasto medio de cada sesión de entrenamiento, repartido en la semana (kcal/kg por sesión).
const KCAL_SESION_KG = { fuerza: 4, cardio: 5 };

/**
 * Metabolismo basal. Con % graso usa Katch-McArdle (masa magra), la fórmula más
 * precisa con bioimpedancia; sin él, Mifflin-St Jeor. Si la báscula da su propio
 * metabolismo, se promedia con la fórmula para suavizar errores de cada método.
 */
export function metabolismoBasal({ sexo, edad, altura, peso, grasa, metabolismo }) {
  const mifflin = 10 * peso + 6.25 * altura - 5 * edad + (sexo === "hombre" ? 5 : -161);
  const magra = isNum(grasa) ? peso * (1 - grasa / 100) : null;
  const katch = magra ? 370 + 21.6 * magra : null;
  const formula = katch ?? mifflin;
  const bascula = isNum(metabolismo) ? metabolismo : null;
  // Si la báscula difiere más de un 15 % de la fórmula, se descarta (dato poco fiable).
  const usarBascula = bascula && Math.abs(bascula - formula) / formula <= 0.15;
  return {
    kcal: r0(usarBascula ? (formula + bascula) / 2 : formula),
    metodo: usarBascula ? `${katch ? "Katch-McArdle" : "Mifflin-St Jeor"} + báscula` : katch ? "Katch-McArdle" : "Mifflin-St Jeor",
    mifflin: r0(mifflin), katch: katch && r0(katch), bascula: bascula && r0(bascula),
    masaMagra: magra && r1(magra),
  };
}

// Parámetros por objetivo.
export const OBJETIVOS = {
  perdidaGrasa: { ajusteKcal: -0.2, ritmo: -0.0075, rangoRitmo: [-0.01, -0.0025], proteinaKg: 2.2, diasFuerza: 3, diasCardio: 3, reps: "10–15", rir: "1–3" },
  recomposicion: { ajusteKcal: -0.1, ritmo: -0.0025, rangoRitmo: [-0.006, 0], proteinaKg: 2.2, diasFuerza: 4, diasCardio: 2, reps: "8–12", rir: "1–2" },
  ganarMusculo: { ajusteKcal: 0.1, ritmo: 0.0025, rangoRitmo: [0.001, 0.005], proteinaKg: 1.8, diasFuerza: 4, diasCardio: 1, reps: "6–12", rir: "1–2" },
  rendimiento: { ajusteKcal: 0, ritmo: 0, rangoRitmo: [-0.0025, 0.0025], proteinaKg: 1.8, diasFuerza: 4, diasCardio: 2, reps: "5–12", rir: "1–3" },
};

/** Gasto total diario: basal × actividad + entrenamientos repartidos en 7 días. */
export function gastoTotal(basal, peso, actividad = "ligera", diasFuerza = 3, diasCardio = 2) {
  const f = ACTIVIDAD[actividad]?.factor ?? ACTIVIDAD.ligera.factor;
  const entreno = (diasFuerza * KCAL_SESION_KG.fuerza + diasCardio * KCAL_SESION_KG.cardio) * peso / 7;
  return r0(basal * f + entreno);
}

/**
 * Ajuste automático según la evolución real entre las dos últimas mediciones.
 * Compara el ritmo semanal de cambio de peso con el esperado y corrige las kcal
 * (±100–250 kcal), y vigila que no se pierda músculo.
 */
export function ajusteEvolucion(historial, objetivoId) {
  const h = (historial || []).filter((r) => r?.fecha && isNum(r?.datos?.peso)).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  if (h.length < 2) return { kcal: 0, proteinaExtra: 0, motivos: [], ritmoSemanal: null };
  const a = h.at(-2), b = h.at(-1);
  const semanas = (new Date(b.fecha) - new Date(a.fecha)) / (7 * 86400000);
  if (semanas < 1.5) return { kcal: 0, proteinaExtra: 0, motivos: ["Han pasado menos de 2 semanas entre mediciones: aún no se reajusta."], ritmoSemanal: null };
  const ritmo = (b.datos.peso - a.datos.peso) / a.datos.peso / semanas; // fracción por semana
  const [min, max] = OBJETIVOS[objetivoId]?.rangoRitmo ?? [-0.0025, 0.0025];
  const motivos = [];
  let kcal = 0;
  const pct = (x) => `${(Math.round(x * 1000) / 10).toLocaleString("es-ES")} %`;
  const objetivo = max <= 0 ? `bajar entre ${pct(-max)} y ${pct(-min)}` : min >= 0 ? `subir entre ${pct(min)} y ${pct(max)}` : `mantenerte (±${pct(max)})`;
  const sube = (x) => (x > 0 ? `subes ${pct(x)}` : x < 0 ? `bajas ${pct(-x)}` : "mantienes el peso");
  if (ritmo > max) {
    kcal = -Math.min(250, r5(((ritmo - max) * b.datos.peso * 7700) / 7, 50) || 100);
    motivos.push(`Cada semana ${sube(ritmo)} de tu peso y lo previsto es ${objetivo}: bajamos ${-kcal} kcal al día.`);
  } else if (ritmo < min) {
    kcal = Math.min(250, r5(((min - ritmo) * b.datos.peso * 7700) / 7, 50) || 100);
    motivos.push(`Cada semana ${sube(ritmo)} de tu peso y lo previsto es ${objetivo}: subimos ${kcal} kcal al día.`);
  } else {
    motivos.push(`Cada semana ${sube(ritmo)} de tu peso, dentro de lo previsto (${objetivo}): se mantienen las calorías.`);
  }
  // Pérdida de masa muscular: menos déficit y más proteína.
  const musc = (r) => r.metricas?.find((m) => m.id === "muscular")?.valor;
  const ma = musc(a), mb = musc(b);
  let proteinaExtra = 0;
  if (isNum(ma) && isNum(mb) && (ma - mb) * b.datos.peso / 100 > 0.5 && ritmo < 0) {
    kcal = Math.max(kcal, 0) + 100;
    proteinaExtra = 0.2;
    motivos.push("Has perdido algo de masa muscular: reducimos el déficit 100 kcal y subimos la proteína.");
  }
  return { kcal, proteinaExtra, motivos, ritmoSemanal: ritmo };
}

/**
 * Calcula el plan completo.
 * datos: los de la báscula (sexo, edad, altura, peso, grasa?, muscular?, metabolismo?).
 * objetivoId: perdidaGrasa | recomposicion | ganarMusculo | rendimiento.
 * opciones: { actividad, nivel: 'principiante'|'intermedio', historial }.
 */
export function calcularPlan(datos, objetivoId = "rendimiento", { actividad = "ligera", nivel = "principiante", historial = [], diasFuerza, diasCardio, sinDeficit = false } = {}) {
  if (!datos || ![datos.edad, datos.altura, datos.peso].every(isNum)) return null;
  const base = OBJETIVOS[objetivoId] ?? OBJETIVOS.rendimiento;
  // Días reales elegidos por la persona (si los hay) para un gasto más preciso.
  const obj = { ...base, diasFuerza: diasFuerza ?? base.diasFuerza, diasCardio: diasCardio ?? base.diasCardio, ...(sinDeficit ? { ajusteKcal: Math.max(0, base.ajusteKcal), ritmo: 0, rangoRitmo: [-0.0025, 0.005] } : {}) };
  const { peso } = datos;
  const basal = metabolismoBasal(datos);
  const mantenimiento = gastoTotal(basal.kcal, peso, actividad, obj.diasFuerza, obj.diasCardio);
  const ajuste = ajusteEvolucion(historial, objetivoId);

  // Déficit/superávit: % del mantenimiento, limitado a ±750 kcal y nunca por debajo del basal.
  let kcal = mantenimiento * (1 + obj.ajusteKcal);
  kcal = Math.max(mantenimiento - 750, Math.min(mantenimiento + 500, kcal)) + ajuste.kcal;
  kcal = r5(Math.max(kcal, basal.kcal), 10);

  // Proteína: con mucha grasa corporal se calcula sobre la masa magra (más precisa).
  const mucha = isNum(datos.grasa) && datos.grasa > (datos.sexo === "mujer" ? 32 : 25);
  const gProteina = r5(mucha && basal.masaMagra ? basal.masaMagra * (obj.proteinaKg + 0.4 + ajuste.proteinaExtra) : peso * (obj.proteinaKg + ajuste.proteinaExtra));
  const gGrasa = r5(Math.max(0.7 * peso, (kcal * 0.25) / 9));
  const gHidratos = r5(Math.max(0, (kcal - gProteina * 4 - gGrasa * 9) / 4));
  const agua = r1((peso * 35) / 1000 + (obj.diasFuerza + obj.diasCardio) * 0.5 / 7);

  const series = nivel === "intermedio" ? "12–16" : "8–12";
  return {
    objetivo: objetivoId,
    basal,
    actividad,
    mantenimiento,
    kcal,
    diferencia: kcal - mantenimiento,
    macros: { proteina: gProteina, grasa: gGrasa, hidratos: gHidratos },
    agua,
    ritmoPrevisto: { semanalKg: Math.round(peso * obj.ritmo * 100) / 100, porcentaje: obj.ritmo * 100 },
    entrenamiento: {
      diasFuerza: obj.diasFuerza, diasCardio: obj.diasCardio,
      repeticiones: obj.reps, rir: obj.rir,
      seriesSemanaGrupo: series,
      descanso: nivel === "intermedio" ? "2–3 min en básicos, 60–90 s en accesorios" : "90 s–2 min",
      progresion: "Cuando completes todas las series en el tope del rango de repeticiones, sube un 2,5–5 % la carga.",
    },
    ajuste,
  };
}
