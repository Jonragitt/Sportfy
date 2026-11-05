// Almacén común de notas de evaluación para calcular la nota total /25.
// Formato de cada entrada: { score: puntos, max: máximo del baremo, date, detail }.
// Entradas antiguas sin "max" se interpretan como /100.

const STORAGE_KEY = "sportfy.scores";

// Baremo profesional: cada evaluación puntúa sobre un máximo y la nota final es /25.
export const EVALUATIONS = {
  antropometria: { name: "Evaluación antropométrica", max: 15 },
  postural: { name: "Evaluación postural", max: 10 },
};
export const TOTAL_MAX = Object.values(EVALUATIONS).reduce((a, e) => a + e.max, 0);

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

// points: puntos obtenidos sobre el máximo del baremo de esa evaluación.
export function saveScore(key, points, detail = {}) {
  const all = read();
  const max = EVALUATIONS[key]?.max ?? 10;
  all[key] = {
    score: round1(points),
    max,
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

export function round1(n) {
  return Math.round(n * 10) / 10;
}

// Puntos de una evaluación sobre su máximo del baremo (acepta formatos antiguos).
export function pointsFor(key, entry) {
  const max = EVALUATIONS[key]?.max ?? 10;
  if (entry == null) return null;
  if (typeof entry === "number") return round1((entry / 100) * max);
  if (!Number.isFinite(entry.score)) return null;
  const m = Number.isFinite(entry.max) && entry.max > 0 ? entry.max : 100;
  return round1((entry.score / m) * max);
  return null;
}

// Nota total /25 sumando los puntos de cada evaluación completada.
export function totalScore(scores = read()) {
  let points = 0;
  let done = 0;
  for (const key of Object.keys(EVALUATIONS)) {
    const p = pointsFor(key, scores[key]);
    if (p == null) continue;
    points += p;
    done++;
  }
  return { points: round1(points), max: TOTAL_MAX, done, complete: done === Object.keys(EVALUATIONS).length };
}

// Baremo por porcentaje del máximo.
export function scoreLabel(points, max = 100) {
  if (points == null) return "Sin datos";
  const pct = (points / max) * 100;
  if (pct >= 90) return "Excelente";
  if (pct >= 70) return "Bueno";
  if (pct >= 50) return "Aceptable";
  return "Deficiente";
}

export const BAREMO = [
  { label: "Excelente", from: 90 },
  { label: "Bueno", from: 70 },
  { label: "Aceptable", from: 50 },
  { label: "Deficiente", from: 0 },
];
