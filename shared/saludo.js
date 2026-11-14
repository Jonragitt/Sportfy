// Saludo de Forty5: al entrar en la app te saluda por tu nombre con una frase que depende de la
// hora del reloj de la página (shared/reloj.js): buenos días, buenas tardes…
// - Con voz: suena con el primer toque o tecla (los navegadores no dejan reproducir sonido antes)
//   y se apunta la hora en "sportfy.saludo" (no se enseña en la página).
// - Durante las 2 horas siguientes a ese saludo con voz no vuelve a sonar: al entrar aparece la
//   frase como texto grande a la izquierda («¡Buenos días, Pepito!») y se va sola.
// Un saludo por visita (sessionStorage), no en cada cambio de página.
//
// Voz de Epachuko (grabada con el Estudio de voz, ver shared/voz/LEEME.md), por orden:
//   1. shared/voz/<momento>-<nombre>.mp3  («¡Buenos días, Jonás!», para los nombres más comunes)
//   2. shared/voz/<momento>-<0|1|2>.mp3   (frase sin nombre, si el tuyo no está grabado)
//   3. la voz en español del propio dispositivo, que sí dice cualquier nombre.
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
/** "Jonás Ramos" → "jonas" (nombre de archivo del audio: primer nombre, sin tildes ni mayúsculas). */
export const claveNombre = (n) => String(n ?? "").trim().split(/\s+/)[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
/** Audios a probar, en orden, para un nombre y un momento del día. */
export function audiosSaludo(nombre, m = momento(), azar = Math.random()) {
  const g = m === "madrugada" ? "noche" : m, k = claveNombre(nombre), sin = SALUDO_SIN_NOMBRE[g];
  return [k && `voz/${g}-${k}.mp3`, `voz/${g}-${Math.floor(azar * sin.length) % sin.length}.mp3`].filter(Boolean);
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
  const lista = audiosSaludo(nombre);
  const probar = () => {
    const ruta = lista.shift();
    if (!ruta) return hablar(nombre); // ningún audio grabado: voz del dispositivo
    const a = new Audio(new URL(`./${ruta}`, import.meta.url));
    let fallo = false;
    const siguiente = () => { if (!fallo) { fallo = true; probar(); } }; // no existe: el siguiente
    a.addEventListener("error", siguiente, { once: true });
    a.play().catch((e) => { if (e?.name !== "NotAllowedError") siguiente(); });
  };
  probar();
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
