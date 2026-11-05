// Almacén común de notas de evaluación (0-100) para calcular la nota media.
// Cada módulo guarda su nota con saveScore("clave", nota, detalle).

const STORAGE_KEY = "sportfy.scores";

export const EVALUATIONS = {
  antropometria: "Evaluación antropométrica",
  fisica: "Evaluación física",
  postural: "Evaluación postural",
  grasaVisceral: "Grasa visceral",
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function getScores() {
  return read();
}

export function saveScore(key, score, detail = {}) {
  const all = read();
  all[key] = {
    score: Math.round(score),
    date: new Date().toISOString(),
    detail,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* almacenamiento no disponible: la nota solo se muestra en pantalla */
  }
  return all[key];
}

export function averageScore() {
  const values = Object.values(read())
    .map((e) => (typeof e === "number" ? e : e?.score))
    .filter((n) => Number.isFinite(n));
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function scoreLabel(score) {
  if (score == null) return "Sin datos";
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Bueno";
  if (score >= 50) return "Mejorable";
  return "Necesita trabajo";
}
