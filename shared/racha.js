// Racha de gimnasio de Forty5: icono de fuego a la derecha del perfil con los días de gym
// seguidos que has cumplido. Un día de gym cuenta cuando terminas su entrenamiento guiado en
// Rutina (ejercicio a ejercicio hasta «Terminado»). Ese entrenamiento aparece desde las 12 de la
// noche del día de gym y dura hasta que acaba el día siguiente; si para entonces no lo has
// terminado, el día queda marcado como fallado en el calendario de rachas.
// Solo cuentan los días de gym elegidos en las preferencias (sportfy.preferencias.diasSemana).
const CLAVE = "sportfy.racha";
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dos = (n) => String(n).padStart(2, "0");

/** "2026-11-13" en hora local. */
export const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
export const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const sumar = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
const diaSemana = (d) => (d.getDay() + 6) % 7; // lunes = 0

/**
 * Pone al día la racha: los días de gym sin contestar cuyo plazo ya pasó (todo el día siguiente)
 * quedan como "fallo". Devuelve la racha actualizada, el día que hay que preguntar (o null),
 * la racha actual, la mejor y el total de días cumplidos.
 * racha: { desde: "AAAA-MM-DD", dias: { "AAAA-MM-DD": "si" | "no" | "fallo" } }
 */
export function calcularRacha(racha, diasGym = [], hoy = new Date()) {
  const gym = new Set(diasGym);
  const r = { desde: racha?.desde ?? iso(hoy), dias: { ...(racha?.dias ?? {}) } };
  const esGym = (d) => gym.has(diaSemana(d));
  const hoyIso = iso(hoy), ayer = sumar(hoy, -1);
  let cambiado = !racha?.desde;
  // Plazo vencido: días de gym anteriores a ayer sin respuesta.
  for (let d = deIso(r.desde); iso(d) < iso(ayer); d = sumar(d, 1)) {
    if (esGym(d) && !r.dias[iso(d)]) { r.dias[iso(d)] = "fallo"; cambiado = true; }
  }
  const pendiente = iso(ayer) >= r.desde && esGym(ayer) && !r.dias[iso(ayer)] ? iso(ayer) : null;

  // Racha actual: días de gym cumplidos seguidos hacia atrás (hoy y ayer sin contestar no la rompen).
  let actual = 0;
  for (let d = hoy; iso(d) >= r.desde; d = sumar(d, -1)) {
    if (!esGym(d) && !r.dias[iso(d)]) continue;
    const v = r.dias[iso(d)];
    if (v === "si") actual++;
    else if (v === "no" || v === "fallo") break;
    else if (iso(d) !== hoyIso && iso(d) !== pendiente) break;
  }
  // Mejor racha y total, recorriendo en orden.
  let mejor = 0, seguidas = 0, total = 0;
  for (let d = deIso(r.desde); iso(d) <= hoyIso; d = sumar(d, 1)) {
    const v = r.dias[iso(d)];
    if (v === "si") { total++; seguidas++; mejor = Math.max(mejor, seguidas); }
    else if (v === "no" || v === "fallo") seguidas = 0;
  }
  return { racha: r, cambiado, pendiente, actual, mejor: Math.max(mejor, actual), total, esGym };
}

/**
 * Día de gym cuyo entrenamiento guiado toca hacer ahora (o null): primero el de ayer si sigue
 * sin terminar (hoy es su último día) y si no, el de hoy.
 */
export function diaGuiado(racha, diasGym = [], hoy = new Date()) {
  const e = calcularRacha(racha, diasGym, hoy);
  if (e.pendiente) return { dia: e.pendiente, ayer: true };
  const k = iso(hoy);
  if (e.esGym(hoy) && k >= e.racha.desde && !e.racha.dias[k]) return { dia: k, ayer: false };
  return null;
}

// ---------- Interfaz ----------
const leerJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const escribirJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const diasDeGym = () => (leerJSON("sportfy.preferencias", {}).diasSemana ?? []).filter((d) => d >= 0 && d <= 6);

/** Marca un día (por defecto hoy) como cumplido ("si"), no cumplido ("no") o lo borra (null). */
export function marcarRacha(dia = iso(new Date()), valor = "si") {
  const r = leerJSON(CLAVE, null) ?? { desde: iso(new Date()), dias: {} };
  if (valor) r.dias[dia] = valor; else delete r.dias[dia];
  escribirJSON(CLAVE, r);
  dispatchEvent(new CustomEvent("forty5:racha"));
}

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
    for (let n = 1; n <= diasMes; n++) {
      const d = new Date(mes.getFullYear(), mes.getMonth(), n), k = iso(d), v = e.racha.dias[k];
      const gymDia = e.esGym(d) && k >= e.racha.desde;
      const cls = [v === "si" ? "si" : v === "no" || v === "fallo" ? "mal" : gymDia ? (k > hoyIso ? "futuro" : "toca") : "", k === hoyIso ? "hoy" : ""].join(" ");
      const titulo = v === "si" ? "Cumplido" : v === "no" ? "No fuiste" : v === "fallo" ? "Fallado (sin confirmar)" : gymDia ? "Día de gym" : "Descanso";
      celdas.push(`<span class="${cls}" title="${n} · ${titulo}">${v === "si" ? "🔥" : v === "no" || v === "fallo" ? "✕" : n}</span>`);
    }
    panel.innerHTML = `
      <div class="racha-cab"><button type="button" data-mes="-1" aria-label="Mes anterior">‹</button><b>${MESES[mes.getMonth()]} ${mes.getFullYear()}</b><button type="button" data-mes="1" aria-label="Mes siguiente">›</button></div>
      <div class="racha-sem"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
      <div class="racha-cal">${celdas.join("")}</div>
      <div class="racha-ley"><span><i class="si"></i>Cumplido</span><span><i class="mal"></i>Fallado</span><span><i class="toca"></i>Toca gym</span></div>
      <p class="racha-datos">Racha <b>${e.actual}</b> · Mejor <b>${e.mejor}</b> · Total <b>${e.total}</b> días de gym</p>
      <p class="racha-datos" style="opacity:.8">Para sumar el día, termina el entrenamiento guiado de Rutina.</p>`;
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
  setInterval(actualizar, 30000); // a las 12 de la noche se pone al día aunque la página siga abierta
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
}
