// Evaluaciones completas de Forty5 ("apartados" del perfil) y modo de la app.
//
// Una evaluación completa = antropometría + postural confirmadas con el tick.
// Al completarse se guarda como apartado y la app pasa al modo "plan" (el menú
// de evaluaciones desaparece). Desde el perfil se puede:
//   - repetir la evaluación: abre una nueva ronda conservando los apartados;
//   - reiniciar todo: borra todos los datos de Forty5.
// Módulo con el almacenamiento inyectable para poder testearlo con `node --test`.

import { evaluar } from "../modules/antropometria/antropometria.js";

export const EVALS_KEY = "sportfy.evaluaciones";
export const RONDA_KEY = "sportfy.rondaInicio";
const HIST_ANTRO = "sportfy.antropometria.historial";
const HIST_POST = "sportfy.postural.historial";

const st = (s) => s ?? globalThis.localStorage;
const leer = (k, def, s) => { try { return JSON.parse(st(s).getItem(k)) ?? def; } catch { return def; } };
const escribir = (k, v, s) => { try { st(s).setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const borrar = (k, s) => { try { st(s).removeItem(k); } catch { /* sin almacenamiento */ } };
const t = (r) => new Date(r?.fecha ?? 0).getTime();
const ultimoDesde = (hist, desde) => (hist || []).filter((r) => r?.fecha && t(r) >= desde).sort((a, b) => t(a) - t(b)).at(-1) ?? null;

/** Apartados guardados, en orden de realización. */
export function evaluaciones(s) {
  return leer(EVALS_KEY, [], s).filter((e) => e?.antro && e?.postural).sort((a, b) => t(a) - t(b));
}

/** Fecha (ISO) en que empezó la ronda de evaluación en curso, o null. */
export function rondaEnCurso(s) {
  return leer(RONDA_KEY, null, s);
}

/** "evaluacion" (menú de evaluaciones) o "plan" (ya evaluado: menú del plan). */
export function modo(s) {
  return evaluaciones(s).length && !rondaEnCurso(s) ? "plan" : "evaluacion";
}

/**
 * Revisa los historiales: si en la ronda actual ya están confirmadas las dos
 * evaluaciones, las guarda como un nuevo apartado y cierra la ronda.
 * Devuelve el apartado creado o null.
 */
export function sincronizar(s) {
  const lista = evaluaciones(s);
  const ronda = rondaEnCurso(s);
  if (lista.length && !ronda) return null;
  const desde = ronda ? new Date(ronda).getTime() : 0;
  const antro = ultimoDesde(leer(HIST_ANTRO, [], s), desde);
  const postural = ultimoDesde(leer(HIST_POST, [], s), desde);
  if (!antro || !postural) return null;
  const nueva = {
    id: `ev-${Math.max(t(antro), t(postural))}`,
    fecha: new Date(Math.max(t(antro), t(postural))).toISOString(),
    antro,
    postural,
  };
  if (lista.some((e) => e.id === nueva.id)) { borrar(RONDA_KEY, s); return null; }
  escribir(EVALS_KEY, [...lista, nueva], s);
  borrar(RONDA_KEY, s);
  return nueva;
}

/** Abre una nueva ronda para repetir la evaluación conservando los apartados. */
export function repetirEvaluacion(s, ahora = new Date()) {
  escribir(RONDA_KEY, ahora.toISOString(), s);
}

/** Cancela la repetición y vuelve al plan (solo si ya hay algún apartado). */
export function cancelarRepeticion(s) {
  if (evaluaciones(s).length) borrar(RONDA_KEY, s);
}

/** Borra todos los datos de Forty5 (claves "sportfy.*"). */
export function reiniciarTodo(s) {
  const store = st(s);
  const claves = [];
  try {
    for (let i = 0; i < store.length; i++) { const k = store.key(i); if (k?.startsWith("sportfy.")) claves.push(k); }
  } catch { /* sin almacenamiento */ }
  claves.forEach((k) => borrar(k, s));
}

/**
 * Edita los datos físicos (altura, peso…) de un apartado y recalcula su
 * antropometría con los mismos baremos. Actualiza también el historial y, si es
 * el último apartado, la nota global. Devuelve el apartado actualizado.
 */
export function editarDatos(id, cambios, s) {
  const lista = evaluaciones(s);
  const i = lista.findIndex((e) => e.id === id);
  if (i < 0) return null;
  const ev = lista[i];
  const datos = { ...ev.antro.datos, ...cambios };
  const antro = { ...evaluar(datos), fecha: ev.antro.fecha, editado: new Date().toISOString() };
  lista[i] = { ...ev, antro };
  escribir(EVALS_KEY, lista, s);
  const hist = leer(HIST_ANTRO, [], s).map((r) => (r?.fecha === ev.antro.fecha ? antro : r));
  escribir(HIST_ANTRO, hist, s);
  if (i === lista.length - 1 && antro.nota != null) {
    const scores = leer("sportfy.scores", {}, s);
    scores.antropometria = { ...(scores.antropometria || {}), score: antro.nota, max: 15, date: antro.fecha };
    escribir("sportfy.scores", scores, s);
  }
  return lista[i];
}

const metrica = (ev, id) => ev.antro?.metricas?.find((m) => m.id === id)?.valor ?? null;

// Filas de la comparación: [id, nombre, unidad, función, ¿menos es mejor?]
export const FILAS_COMPARACION = [
  ["total", "Nota total", "/25", (e) => notaTotal(e), false],
  ["antro", "Antropometría", "/15", (e) => e.antro?.nota ?? null, false],
  ["postural", "Postural", "/10", (e) => e.postural?.nota ?? null, false],
  ["peso", "Peso", "kg", (e) => e.antro?.datos?.peso ?? null, true],
  ["grasa", "% graso", "%", (e) => metrica(e, "grasa"), true],
  ["muscular", "% muscular", "%", (e) => metrica(e, "muscular"), false],
  ["agua", "% agua", "%", (e) => metrica(e, "agua"), false],
  ["visceral", "Grasa visceral", "nivel", (e) => metrica(e, "visceral"), true],
  ["edadMetabolica", "Edad metabólica", "años", (e) => metrica(e, "edadMetabolica"), true],
  ["alteraciones", "Alteraciones posturales", "", (e) => (Array.isArray(e.postural?.desviaciones) ? e.postural.desviaciones.length : null), true],
];

export function notaTotal(ev) {
  if (ev.antro?.nota == null || ev.postural?.nota == null) return null;
  return Math.round((ev.antro.nota + ev.postural.nota) * 10) / 10;
}

/**
 * Compara 2 o más apartados en orden de realización. Cada fila trae los valores
 * y el cambio respecto al apartado anterior (mejora: true/false/null).
 */
export function compararEvaluaciones(ids, s) {
  const sel = evaluaciones(s).filter((e) => ids.includes(e.id));
  if (sel.length < 2) return null;
  const filas = FILAS_COMPARACION.map(([id, nombre, unidad, f, menos]) => {
    const valores = sel.map(f);
    const cambios = valores.map((v, i) => {
      if (i === 0 || v == null || valores[i - 1] == null) return null;
      const d = Math.round((v - valores[i - 1]) * 10) / 10;
      return { delta: d, mejora: d === 0 ? null : menos ? d < 0 : d > 0 };
    });
    const ini = valores[0], fin = valores.at(-1);
    const total = ini == null || fin == null ? null : (() => { const d = Math.round((fin - ini) * 10) / 10; return { delta: d, mejora: d === 0 ? null : menos ? d < 0 : d > 0 }; })();
    return { id, nombre, unidad, valores, cambios, total };
  }).filter((f) => f.valores.some((v) => v != null));
  // Alteraciones posturales corregidas y nuevas entre la primera y la última seleccionadas.
  const d0 = sel[0].postural?.desviaciones, d1 = sel.at(-1).postural?.desviaciones;
  let postural = null;
  if (Array.isArray(d0) && Array.isArray(d1)) {
    const a = new Set(d0.map((d) => d.id)), b = new Set(d1.map((d) => d.id));
    postural = { corregidas: d0.filter((d) => !b.has(d.id)), nuevas: d1.filter((d) => !a.has(d.id)) };
  }
  return { evaluaciones: sel, filas, postural };
}
