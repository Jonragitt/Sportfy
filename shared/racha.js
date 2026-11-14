// Racha de gimnasio de Forty5: icono de fuego a la derecha del perfil con los días de gym
// seguidos que has cumplido. Un día de gym cuenta cuando terminas su entrenamiento guiado en
// Rutina (ejercicio a ejercicio hasta «Terminado»).
// Motor de cálculo (puro, sin DOM, testeado con node --test):
//  - Plazo: la sesión de un día de gym se puede terminar hasta las 22:00 de ese día. Si a esa
//    hora no está hecha, el día queda "fallo" y se pierde la racha.
//  - Ficha: a las 9:00 la ficha pasa a la sesión del día siguiente. Si el día siguiente es de
//    cardio o reposo, la ficha se queda con la sesión fallada (en rojo) hasta que se recupere,
//    con la opción «Recuperado» junto a «Siguiente».
//  - Recuperar no devuelve la racha perdida: el día recuperado cuenta 1 y la racha sigue desde él.
//  - Calendario: cumplido (verde), fallado (rojo) y recuperado (azul con flecha).
// Solo cuentan los días de gym elegidos en las preferencias (sportfy.preferencias.diasSemana).
const CLAVE = "sportfy.racha";
export const HORA_FALLO = 22;  // a esta hora se da por fallada la sesión del día
export const HORA_CAMBIO = 9;  // a esta hora la ficha pasa al día siguiente
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dos = (n) => String(n).padStart(2, "0");

/** "2026-11-13" en hora local. */
export const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
export const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const sumar = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diaSemana = (d) => (d.getDay() + 6) % 7; // lunes = 0
const esFallo = (v) => v === "fallo" || v === "no";
/** Momento en que vence la sesión del día (22:00 de ese día). */
export const plazoDe = (k) => { const d = deIso(k); d.setHours(HORA_FALLO, 0, 0, 0); return d; };

/**
 * Pone al día la racha: los días de gym sin hacer cuyo plazo (22:00) ya pasó quedan "fallo".
 * racha: { desde: "AAAA-MM-DD", dias: { "AAAA-MM-DD": "si" | "recuperado" | "fallo" | "no" } }
 * Devuelve la racha actualizada, si ha cambiado, la racha actual, la mejor, el total de días
 * hechos (cumplidos + recuperados), esGym(fecha) y estadoDia(clave) para el calendario.
 */
export function calcularRacha(racha, diasGym = [], ahora = new Date()) {
  const gym = new Set(diasGym);
  const r = { desde: racha?.desde ?? iso(ahora), dias: { ...(racha?.dias ?? {}) } };
  const esGym = (d) => gym.has(diaSemana(d));
  const hoyIso = iso(ahora);
  let cambiado = !racha?.desde;
  for (let d = deIso(r.desde); iso(d) <= hoyIso; d = sumar(d, 1)) {
    const k = iso(d);
    if (esGym(d) && !r.dias[k] && ahora >= plazoDe(k)) { r.dias[k] = "fallo"; cambiado = true; }
  }

  // Racha actual: hacia atrás desde hoy. Hoy sin hacer (aún en plazo) no la rompe; un fallo sí;
  // un recuperado cuenta 1 y corta (la racha anterior al fallo ya se perdió).
  let actual = 0;
  for (let d = deIso(hoyIso); iso(d) >= r.desde; d = sumar(d, -1)) {
    const v = r.dias[iso(d)];
    if (v === "si") actual++;
    else if (v === "recuperado") { actual++; break; }
    else if (esFallo(v)) break;
    else if (esGym(d) && iso(d) !== hoyIso) break;
  }
  let mejor = 0, seguidas = 0, total = 0;
  for (let d = deIso(r.desde); iso(d) <= hoyIso; d = sumar(d, 1)) {
    const v = r.dias[iso(d)];
    if (v === "si") { total++; seguidas++; }
    else if (v === "recuperado") { total++; seguidas = 1; }
    else if (esFallo(v)) seguidas = 0;
    mejor = Math.max(mejor, seguidas);
  }

  /** Estado de un día para el calendario. */
  const estadoDia = (k) => {
    const v = r.dias[k];
    if (v === "si") return "cumplido";
    if (v === "recuperado") return "recuperado";
    if (esFallo(v)) return "fallado";
    if (!esGym(deIso(k)) || k < r.desde) return "descanso";
    return k > hoyIso ? "futuro" : "pendiente";
  };
  return { racha: r, cambiado, actual, mejor: Math.max(mejor, actual), total, esGym, estadoDia };
}

/**
 * Ficha del entrenamiento guiado que toca ahora (o null si no hay ninguna):
 * { dia, estado: "pendiente" | "hecha" | "fallada" | "recuperada", puedeRecuperar, plazo }.
 * Hasta las 9:00 se sigue mirando el día anterior; desde las 9:00, el de hoy. Si ese día no es de
 * gym, se queda la última sesión de gym mientras esté fallada (hasta que se recupere).
 */
export function fichaActual(racha, diasGym = [], ahora = new Date()) {
  const e = calcularRacha(racha, diasGym, ahora);
  const ref = ahora.getHours() >= HORA_CAMBIO ? deIso(iso(ahora)) : sumar(deIso(iso(ahora)), -1);
  let g = null;
  for (let i = 0, d = ref; i < 7 && iso(d) >= e.racha.desde; i++, d = sumar(d, -1)) if (e.esGym(d)) { g = d; break; }
  if (!g) return null;
  const k = iso(g), v = e.racha.dias[k], siguienteLibre = !e.esGym(sumar(g, 1));
  const ficha = (estado) => ({ dia: k, estado, puedeRecuperar: estado === "fallada" && siguienteLibre, plazo: plazoDe(k) });
  if (k === iso(ref)) return ficha(v === "si" ? "hecha" : v === "recuperado" ? "recuperada" : esFallo(v) ? "fallada" : "pendiente");
  return esFallo(v) ? ficha("fallada") : null; // en cardio o reposo solo sigue la sesión fallada
}

// ---------- Interfaz ----------
const leerJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const escribirJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const diasDeGym = () => (leerJSON("sportfy.preferencias", {}).diasSemana ?? []).filter((d) => d >= 0 && d <= 6);

/** Marca un día (por defecto hoy) como cumplido ("si"), recuperado ("recuperado"), no cumplido ("no") o lo borra (null). */
export function marcarRacha(dia = iso(new Date()), valor = "si") {
  const r = leerJSON(CLAVE, null) ?? { desde: iso(new Date()), dias: {} };
  if (valor) r.dias[dia] = valor; else delete r.dias[dia];
  escribirJSON(CLAVE, r);
  dispatchEvent(new CustomEvent("forty5:racha"));
}

// Flecha curvada tipo «reciclar» para los días recuperados.
export const FLECHA = `<svg class="flecha-rec" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M19.6 3.2v5.4h-5.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LLAMA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 2.5c.6 3.2-1 5-2.6 6.8C8.3 11 7 12.6 7 15a5 5 0 0 0 10 0c0-2.2-1-3.9-2.2-5.2.1 1.6-.5 2.8-1.6 3.4.4-3.6-.6-7.4-.7-10.7Z" fill="currentColor"/><path d="M12 21.5a3 3 0 0 1-3-3c0-1.6 1.2-2.6 2.2-3.7.2 1 .9 1.7 1.7 2 .1-.8.4-1.5 1-2 .7.9 1.1 2 1.1 3.2a3 3 0 0 1-3 3.5Z" fill="#ffd166"/></svg>`;

function montar() {
  const gym = diasDeGym();
  if (!gym.length || document.querySelector(".esquina.racha")) return; // sin plan de días no hay racha
  document.body.classList.add("con-racha");
  const caja = document.createElement("div");
  caja.className = "racha-caja no-deslizar";
  caja.innerHTML = `<button type="button" class="esquina racha" aria-haspopup="true" aria-expanded="false">${LLAMA}<b class="racha-n">0</b></button>
    <div class="racha-panel" hidden role="dialog" aria-label="Calendario de rachas"></div>`;
  document.body.append(caja);
  const btn = caja.querySelector(".racha"), panel = caja.querySelector(".racha-panel");
  let mes = new Date(); mes.setDate(1);

  const estado = () => {
    const e = calcularRacha(leerJSON(CLAVE, null), diasDeGym());
    if (e.cambiado) escribirJSON(CLAVE, e.racha);
    return e;
  };

  function pintarPanel(e) {
    const hoy = new Date(), hoyIso = iso(hoy);
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const huecos = diaSemana(primero), diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const celdas = [];
    for (let i = 0; i < huecos; i++) celdas.push(`<span></span>`);
    const TXT = { cumplido: "Cumplido", fallado: "Fallado", recuperado: "Recuperado", pendiente: "Toca gym", futuro: "Día de gym", descanso: "Descanso" };
    for (let n = 1; n <= diasMes; n++) {
      const k = iso(new Date(mes.getFullYear(), mes.getMonth(), n)), est = e.estadoDia(k);
      const dentro = est === "cumplido" ? "✓" : est === "fallado" ? "✕" : est === "recuperado" ? FLECHA : n;
      celdas.push(`<span class="${est}${k === hoyIso ? " hoy" : ""}" title="${n} · ${TXT[est]}">${dentro}</span>`);
    }
    panel.innerHTML = `
      <div class="racha-cab"><button type="button" data-mes="-1" aria-label="Mes anterior">‹</button><b>${MESES[mes.getMonth()]} ${mes.getFullYear()}</b><button type="button" data-mes="1" aria-label="Mes siguiente">›</button></div>
      <div class="racha-sem"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="racha-cal">${celdas.join("")}</div>
      <div class="racha-ley"><span><i class="cumplido"></i>Cumplido</span><span><i class="fallado"></i>Fallado</span><span><i class="recuperado"></i>Recuperado</span><span><i class="pendiente"></i>Toca gym</span></div>
      <p class="racha-datos">Racha <b>${e.actual}</b> · Mejor <b>${e.mejor}</b> · Total <b>${e.total}</b> días de gym</p>
      <p class="racha-datos" style="opacity:.8">Para sumar el día, termina el entrenamiento guiado de Rutina antes de las 22:00.</p>`;
    panel.querySelectorAll("[data-mes]").forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); mes = new Date(mes.getFullYear(), mes.getMonth() + Number(b.dataset.mes), 1); pintarPanel(estado()); }));
  }

  function actualizar() {
    const e = estado();
    caja.querySelector(".racha-n").textContent = e.actual;
    btn.classList.toggle("apagada", e.actual === 0);
    btn.setAttribute("aria-label", `Racha de gym: ${e.actual} días. Ver calendario`);
    if (!panel.hidden) pintarPanel(e);
  }
  const abrir = (si) => { panel.hidden = !si; btn.setAttribute("aria-expanded", String(si)); if (si) { mes = new Date(); mes.setDate(1); pintarPanel(estado()); } };
  btn.addEventListener("click", () => abrir(panel.hidden));
  document.addEventListener("click", (ev) => { if (!caja.contains(ev.target)) abrir(false); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") abrir(false); });
  addEventListener("forty5:racha", actualizar);
  addEventListener("storage", (ev) => { if (ev.key === CLAVE) actualizar(); });
  actualizar();
  setInterval(actualizar, 30000); // a las 22:00 se pone al día aunque la página siga abierta
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
}
