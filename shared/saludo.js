// Saludo de Forty5: al entrar en la app te saluda por tu nombre con una frase que depende de la
// hora del reloj de la página (shared/reloj.js): buenos días, buenas tardes…
// - Con voz: suena con el primer toque o tecla (los navegadores no dejan reproducir sonido antes)
//   y se apunta la hora en "sportfy.saludo" (no se enseña en la página).
// - Durante las 2 horas siguientes a ese saludo con voz no vuelve a sonar: al entrar aparece la
//   frase como texto grande a la izquierda («¡Buenos días, Pepito!») y se va sola.
// Un saludo por visita (sessionStorage), no en cada cambio de página.
//
// Voz de Epachuko (grabada con el Estudio de voz, ver shared/voz/LEEME.md), por orden:
//   1. <momento>-<nombre>  («¡Buenos días, Jonás!», para los nombres más comunes)
//   2. <momento>-<0|1>     (frase sin nombre, si el tuyo no está grabado)
//   3. la voz en español del propio dispositivo, que sí dice cualquier nombre.
// Los MP3 van juntos en shared/voz/paquetes/ (tools/voz_paquetes.mjs): se baja solo el paquete
// de tu inicial y se recorta tu audio con el índice.
import { fechaActual } from "./reloj.js?v=202611130400";

const CLAVE_NOMBRE = "sportfy.nombre";
const YA = "forty5.saludado"; // sessionStorage: ya se ha saludado en esta visita
const REGISTRO = "sportfy.saludo"; // { voz: milisegundos del último saludo con voz }
export const SIN_VOZ_MS = 2 * 60 * 60 * 1000; // 2 horas de reloj sin repetir el audio

/** Frases que graba Epachuko (tools/saludos_voz.mjs las pasa a shared/voz/saludos.json). La madrugada usa las de noche. */
export const SALUDO_CON_NOMBRE = { manana: "¡Buenos días, {n}!", tarde: "¡Buenas tardes, {n}!", noche: "¡Buenas noches, {n}!" };
export const SALUDO_SIN_NOMBRE = {
  manana: ["¡Buenos días! A por el día.", "¡Buenos días! Hoy es un gran día para entrenar."],
  tarde: ["¡Buenas tardes! ¿Vamos a por ello?", "¡Buenas tardes! Hoy se entrena."],
  noche: ["¡Buenas noches! Último empujón del día.", "¡Buenas noches! Bien hecho por venir."],
};
/** "Jonás" → "jonas", "José Luis" → "jose-luis" (nombre de archivo: sin tildes ni mayúsculas). */
export const claveNombre = (n) => String(n ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z\s]/g, "").trim().split(/\s+/).filter(Boolean).join("-");
/**
 * Cómo reconoce el motor tu nombre: primero el nombre entero («José Luis Pérez» → «jose-luis-perez»,
 * «jose-luis»), y si no está grabado, el primer nombre («jose»).
 */
export function clavesNombre(n) {
  const p = claveNombre(n).split("-").filter(Boolean);
  return [...new Set([p.join("-"), p.slice(0, 2).join("-"), p[0]].filter(Boolean))];
}
/** Audios a probar, en orden, para un nombre y un momento del día («manana-jonas», «manana-0»). */
export function audiosSaludo(nombre, m = momento(), azar = Math.random()) {
  const g = m === "madrugada" ? "noche" : m, sin = SALUDO_SIN_NOMBRE[g];
  return [...clavesNombre(nombre).map((k) => `${g}-${k}`), `${g}-${Math.floor(azar * sin.length) % sin.length}`];
}

const VOZ_V = "202611141900"; // cambiar al regrabar
const PAQUETES = new URL("./voz/paquetes/", import.meta.url);
let indice = null;
const paquetes = new Map();
const cargarIndice = () => (indice ??= fetch(new URL(`indice.json?v=${VOZ_V}`, PAQUETES))
  .then((r) => (r.ok ? r.json() : {})).catch(() => { indice = null; return {}; }));
function paquete(nombre) {
  if (!paquetes.has(nombre)) {
    const p = fetch(new URL(`${nombre}.mp3?v=${VOZ_V}`, PAQUETES)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
    p.catch(() => paquetes.delete(nombre));
    paquetes.set(nombre, p);
  }
  return paquetes.get(nombre);
}
/** Recorta del índice dado (clave → [paquete, inicio, bytes]) el audio de una clave, o null si no está grabado. */
export async function audioDe(clave, ind = cargarIndice(), bajar = paquete) {
  const i = (await ind)[clave];
  if (!i) return null;
  const buf = await bajar(i[0]);
  return new Blob([buf.slice(i[1], i[1] + i[2])], { type: "audio/mpeg" });
}
/** Baja con antelación el paquete que va a sonar, para que el audio salga nada más tocar. */
async function precargar(nombre) {
  const ind = await cargarIndice();
  const c = audiosSaludo(nombre).find((k) => ind[k]);
  if (c) paquete(ind[c][0]).catch(() => {});
}

/** Parte del día según la hora: madrugada (0–6), mañana (6–13), tarde (13–21) y noche (21–24). */
export function momento(f = fechaActual()) {
  const h = f.getHours();
  if (h < 6) return "madrugada";
  if (h < 13) return "manana";
  if (h < 21) return "tarde";
  return "noche";
}

const FRASES = {
  madrugada: [
    "¿Entrenando a estas horas, {n}? Eres una máquina.",
    "Buenas noches, {n}. Descansa bien, que mañana toca darlo todo.",
  ],
  manana: [
    "¡Buenos días, {n}! A por el día.",
    "¡Buenos días, {n}! Hoy es un gran día para entrenar.",
    "¡Hola, {n}! Arrancamos con energía.",
  ],
  tarde: [
    "¡Buenas tardes, {n}!",
    "¡Hola, {n}! ¿Vamos a por ello?",
    "¡Buenas tardes, {n}! Hoy se entrena.",
  ],
  noche: [
    "¡Buenas noches, {n}!",
    "¡Hola, {n}! Último empujón del día.",
    "Buenas noches, {n}. Bien hecho por venir.",
  ],
};

/** Frase de saludo para un nombre y una hora. `azar` (0–1) elige entre las variantes. */
export function fraseSaludo(nombre, f = fechaActual(), azar = Math.random()) {
  const lista = FRASES[momento(f)];
  const frase = lista[Math.floor(azar * lista.length) % lista.length];
  const n = String(nombre ?? "").trim();
  return n ? frase.replace("{n}", n) : frase.replace(/,? ?\{n\}/, "").replace(" ?", "?").replace(" !", "!");
}

export const nombreGuardado = () => { try { return JSON.parse(localStorage.getItem(CLAVE_NOMBRE)) || ""; } catch { return ""; } };

function vozEspanola() {
  const voces = speechSynthesis.getVoices();
  return voces.find((v) => v.lang === "es-ES" && /google|natural|premium|enhanced/i.test(v.name))
    ?? voces.find((v) => v.lang === "es-ES") ?? voces.find((v) => v.lang?.startsWith("es"));
}

/** Hora del reloj en milisegundos (la misma que marca el reloj de la página). */
const ahora = () => { const f = fechaActual(), h = new Date(); return f.toDateString() === h.toDateString() ? f.getTime() : h.getTime(); };
const ultimaVoz = () => { try { return JSON.parse(localStorage.getItem(REGISTRO))?.voz ?? 0; } catch { return 0; } };
/** ¿Toca saludo con voz? Solo si han pasado 2 horas desde el último (o nunca ha sonado). */
export function tocaVoz(ultima = ultimaVoz(), t = ahora()) { return !ultima || t - ultima >= SIN_VOZ_MS || t < ultima; }

/** Dice el saludo ahora (tiene que llamarse tras un toque o tecla) y apunta la hora. */
export function saludar(nombre = nombreGuardado()) {
  try { sessionStorage.setItem(YA, "1"); } catch { /* sin almacenamiento */ }
  try { localStorage.setItem(REGISTRO, JSON.stringify({ voz: ahora() })); } catch { /* sin almacenamiento */ }
  const a = new Audio(); // se crea dentro del toque, para que el navegador deje que suene
  (async () => {
    for (const clave of audiosSaludo(nombre)) {
      let b = null;
      try { b = await audioDe(clave); } catch { b = null; }
      if (!b) continue; // no grabado o no se ha podido bajar: el siguiente
      a.src = URL.createObjectURL(b);
      try { await a.play(); return; } catch (e) { if (e?.name === "NotAllowedError") return; }
    }
    hablar(nombre); // ningún audio grabado: voz del dispositivo
  })();
}

function hablar(nombre) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(fraseSaludo(nombre));
  u.lang = "es-ES"; u.rate = 1.02; u.pitch = 1;
  const v = vozEspanola(); if (v) u.voice = v;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/** Saludo escrito: frase grande a la izquierda que aparece y se va sola. */
export function saludoTexto(nombre = nombreGuardado()) {
  try { sessionStorage.setItem(YA, "1"); } catch { /* sin almacenamiento */ }
  document.querySelector(".saludo-texto")?.remove();
  const el = document.createElement("p");
  el.className = "saludo-texto"; el.setAttribute("role", "status");
  el.textContent = fraseSaludo(nombre).replace(/^(¡?[^!.?]*[!.?]).*$/, "$1"); // solo «¡Buenos días, Pepito!»
  document.body.append(el);
  setTimeout(() => el.classList.add("fuera"), 4200);
  setTimeout(() => el.remove(), 5200);
}

/** Prepara el saludo de esta visita: con voz al primer toque o, si sonó hace menos de 2 h, por escrito. */
export function saludoAlEntrar() {
  let ya = false;
  try { ya = sessionStorage.getItem(YA) === "1"; } catch { /* sin almacenamiento */ }
  if (ya || !nombreGuardado()) return;
  if (!tocaVoz()) { saludoTexto(); return; }
  if ("speechSynthesis" in window) speechSynthesis.getVoices(); // carga las voces con antelación
  precargar(nombreGuardado()).catch(() => {});
  const quitar = () => ["pointerdown", "keydown"].forEach((t) => removeEventListener(t, alTocar, true));
  function alTocar(e) {
    if (e.target?.closest?.(".login-modal")) return; // la pantalla del nombre ya saluda al terminar
    quitar();
    let otra = false;
    try { otra = sessionStorage.getItem(YA) === "1"; } catch { /* sin almacenamiento */ }
    if (!otra && nombreGuardado()) { if (tocaVoz()) saludar(); else saludoTexto(); }
  }
  ["pointerdown", "keydown"].forEach((t) => addEventListener(t, alTocar, true));
}
