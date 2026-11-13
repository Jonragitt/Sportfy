// Motor de Forty5: une en un solo cálculo el análisis de la evaluación, el plan
// (kcal, macros, entrenamiento) y la rutina de gimnasio, teniendo en cuenta las
// preferencias de la persona (días de la semana, zonas a priorizar, tiempo,
// material) y sus condiciones de salud.

import { perfilRutina, guardarPerfilRutina } from "./analisis.js?v=202611130500";
import { calcularPlan } from "./plan.js";
import { generarRutina, semanaDelCiclo, CONDICIONES, DIAS_SEMANA } from "./rutina.js";
import { evaluaciones } from "./evaluaciones.js";

export const PREFS_KEY = "sportfy.preferencias";
export const RUTINA_KEY = "sportfy.rutina";

const st = (s) => s ?? globalThis.localStorage;
const leer = (k, def, s) => { try { return JSON.parse(st(s).getItem(k)) ?? def; } catch { return def; } };
const escribir = (k, v, s) => { try { st(s).setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

// Días de la semana recomendados según cuántos días toca entrenar (0 = lunes).
export const PATRON_DIAS = { 1: [2], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };

export function leerPreferencias(s) {
  return leer(PREFS_KEY, {}, s);
}

/** True si la última evaluación completa aún no tiene preferencias confirmadas. */
export function necesitaPreferencias(s) {
  const ult = evaluaciones(s).at(-1);
  return Boolean(ult) && leerPreferencias(s).evaluacionId !== ult.id;
}

/** Guarda las preferencias y las asocia a la última evaluación completa. */
export function guardarPreferencias(prefs, s) {
  const ult = evaluaciones(s).at(-1);
  const p = { ...leerPreferencias(s), ...prefs, evaluacionId: ult?.id ?? null, confirmadas: new Date().toISOString() };
  escribir(PREFS_KEY, p, s);
  return p;
}

/** Días recomendados según el análisis (objetivo, nivel y condiciones de salud). */
export function recomendacionDias(perfil, condiciones = []) {
  let n = perfil?.diasFuerza ?? 3;
  const medico = condiciones.some((c) => CONDICIONES[c]?.medico);
  if (medico) n = Math.min(n, 3);
  if (perfil?.nivelInicial === "principiante" && perfil?.objetivo?.id === "ganarMusculo") n = Math.min(n, 4);
  const motivo = {
    perdidaGrasa: "para perder grasa: 3 días de fuerza y el resto de días cardio suave y pasos",
    recomposicion: "para recomponer: 4 días de fuerza alternando torso y pierna",
    ganarMusculo: "para ganar músculo: 4 días de fuerza con cada grupo 2 veces por semana",
    rendimiento: "para mejorar tu rendimiento: 4 días de fuerza",
  }[perfil?.objetivo?.id] ?? "para empezar con buena recuperación";
  return {
    dias: n,
    diasSemana: PATRON_DIAS[n],
    nombres: PATRON_DIAS[n].map((d) => DIAS_SEMANA[d]),
    texto: `${n} días a la semana ${medico ? "(máximo 3 por tu condición de salud, con supervisión médica)" : motivo}, dejando al menos un día de descanso entre sesiones parecidas.`,
  };
}

/**
 * Calcula todo de una vez. apartados: evaluaciones completas (shared/evaluaciones.js).
 * Devuelve { perfil, rutina, recomendacion, prefs } o null si no hay evaluación.
 */
export function calcularTodo({ apartados, prefs = {}, actividad = "ligera", semana, guardar = false, storage } = {}) {
  if (!apartados?.length) return null;
  const histAntro = apartados.map((e) => e.antro), histPost = apartados.map((e) => e.postural);
  const perfil = perfilRutina(histAntro, histPost, { actividad });
  if (!perfil) return null;
  const condiciones = (prefs.condiciones ?? []).filter((c) => CONDICIONES[c] && c !== "ninguna");
  const sinDeficit = condiciones.some((c) => CONDICIONES[c].sinDeficit);
  if (sinDeficit) {
    perfil.objetivo = { id: "rendimiento", nombre: "Salud y mantenimiento", texto: "Mantener tu fuerza y tu forma física sin déficit calórico y con ejercicio seguro." };
  }
  const recomendacion = recomendacionDias(perfil, condiciones);
  const sem = semana ?? semanaDelCiclo(perfil.fecha);
  const rutina = generarRutina(perfil, { ...prefs, dias: prefs.diasSemana?.length || recomendacion.dias, semana: sem });
  // El plan se recalcula con los días reales de fuerza y cardio de la rutina.
  const ultAntro = histAntro.filter((r) => r?.datos).at(-1);
  if (ultAntro) {
    perfil.plan = calcularPlan(ultAntro.datos, perfil.objetivo.id, {
      actividad, nivel: perfil.nivelInicial, historial: histAntro,
      diasFuerza: rutina.reparto.dias, diasCardio: rutina.cardioExtra?.dias ?? 0, sinDeficit,
    });
  }
  perfil.diasFuerza = rutina.reparto.dias;
  perfil.preferencias = { diasSemana: rutina.diasSemana, foco: rutina.focos, condiciones: rutina.condiciones, minutos: rutina.minutos, material: rutina.material };
  perfil.avisosSalud = rutina.condiciones;
  if (guardar) { guardarPerfilRutina(perfil, st(storage)); escribir(RUTINA_KEY, rutina, storage); }
  return { perfil, rutina, recomendacion, prefs };
}
