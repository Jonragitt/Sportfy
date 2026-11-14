// Cuenta de Forty5: inicio de sesión con Google o Apple (Firebase) y progreso guardado en la nube,
// para que cada persona tenga sus evaluaciones, rutina, dieta y racha en cualquier dispositivo.
// - Con configuración de Firebase (shared/firebase-config.js) se puede entrar con Google o Apple.
//   Cada persona guarda su progreso en usuarios/<uid>/progreso/<clave> (Firestore); las reglas
//   (firestore.rules) solo dejan leer y escribir a su dueño.
// - Sin configuración, la pantalla los muestra como "muy pronto" y todo se queda en el dispositivo.
// Todo lo que la app guarda en localStorage bajo "sportfy." se sube a la nube y se baja en otro
// dispositivo al iniciar sesión. Las claves de la cuenta van bajo "forty5." y no se sincronizan.
import { saludar, saludoAlEntrar } from "./saludo.js?v=202611141900";
import { FIREBASE_CONFIG, APPLE_ACTIVO } from "./firebase-config.js?v=202611130630";

const NOMBRE = "sportfy.nombre";  // cómo quiere la persona que la llamemos (se sincroniza)
const CUENTA = "forty5.cuenta";   // { tipo: "google" | "apple" | "local", nombre, desde }
const NUBE = "forty5.nube";       // { version, hashes: { clave: hash } }
const SOLO_AQUI = new Set(["sportfy.fechaVista", "sportfy.fondoUltima"]); // cosas de este dispositivo
const PREFIJO = "sportfy.";
const META = "_meta";

const leer = (k, def = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const escribir = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const cuenta = () => leer(CUENTA);
export const googleAppleListos = () => Boolean(FIREBASE_CONFIG);

/** Claves de progreso guardadas en este dispositivo: { "sportfy.x": "texto" }. */
export function progresoLocal() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIJO) && !SOLO_AQUI.has(k)) out[k] = localStorage.getItem(k);
    }
  } catch { /* sin almacenamiento */ }
  return out;
}
/** Huella corta de un texto, para saber qué ha cambiado sin guardar copias. */
export function huella(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${(h >>> 0).toString(36)}`;
}
/** Qué subir y qué borrar en la nube comparando lo local con lo último subido. */
export function cambiosPendientes(local, hashes = {}) {
  const subir = Object.keys(local).filter((k) => hashes[k] !== huella(local[k]));
  const borrar = Object.keys(hashes).filter((k) => !(k in local));
  return { subir, borrar };
}
const idDoc = (k) => k.slice(PREFIJO.length).replace(/[^A-Za-z0-9_\-.~:@+]/g, "_");

// ---------- Firebase ----------
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
let fbPromesa = null;
/** Carga Firebase solo si hay configuración. Devuelve null si no se puede. */
export function firebase() {
  if (!FIREBASE_CONFIG) return Promise.resolve(null);
  fbPromesa ??= (async () => {
    const [app, auth, fs] = await Promise.all([
      import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js"),
    ]);
    const a = app.initializeApp(FIREBASE_CONFIG);
    const au = auth.getAuth(a);
    au.languageCode = "es";
    return { auth: au, A: auth, db: fs.getFirestore(a), F: fs };
  })().catch(() => null);
  return fbPromesa;
}

/** Acceso a la nube de una persona con sesión iniciada. */
function nubeDe(fb, uid) {
  const { db, F } = fb;
  const progreso = F.collection(db, "usuarios", uid, "progreso");
  const meta = F.doc(db, "usuarios", uid);
  return {
    async leer() {
      const [snap, m] = await Promise.all([F.getDocs(progreso), F.getDoc(meta)]);
      const datos = {};
      snap.forEach((d) => { const v = d.data(); if (typeof v?.clave === "string" && typeof v?.valor === "string") datos[v.clave] = v.valor; });
      return { meta: m.exists() ? m.data() : null, datos };
    },
    async escribir(cambios, borrar, version) {
      const lote = F.writeBatch(db);
      for (const [k, v] of cambios) lote.set(F.doc(progreso, idDoc(k)), { clave: k, valor: v });
      for (const k of borrar) lote.delete(F.doc(progreso, idDoc(k)));
      lote.set(meta, { actualizado: version }, { merge: true });
      await lote.commit();
    },
  };
}

let subiendo = false;
async function subir(n) {
  if (subiendo) return;
  subiendo = true;
  try {
    const local = progresoLocal();
    const est = leer(NUBE, { hashes: {} });
    const { subir: s, borrar: b } = cambiosPendientes(local, est.hashes);
    if (!s.length && !b.length) return;
    const cambios = s.filter((k) => local[k].length < 900000).map((k) => [k, local[k]]); // Firestore: 1 MB por documento
    const version = Date.now();
    await n.escribir(cambios, b, version);
    const hashes = { ...est.hashes };
    for (const [k, v] of cambios) hashes[k] = huella(v);
    for (const k of b) delete hashes[k];
    escribir(NUBE, { version, hashes });
    pintarEstado("guardado");
  } catch { pintarEstado("error"); }
  finally { subiendo = false; }
}

/** Sustituye el progreso local por el de la nube y recarga la página. */
function aplicarNube({ meta, datos }) {
  for (const k of Object.keys(progresoLocal())) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(datos)) localStorage.setItem(k, v);
  const hashes = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, huella(v)]));
  escribir(NUBE, { version: meta?.actualizado ?? Date.now(), hashes });
  location.reload();
}

let sincronizando = false;
/** Con sesión iniciada: baja lo nuevo de la nube o sube lo de aquí, y luego sube cada cambio. */
async function sincronizar(n) {
  if (sincronizando) return;
  sincronizando = true;
  try {
    const nube = await n.leer();
    const est = leer(NUBE, null);
    const hayNube = Object.keys(nube.datos).length > 0;
    const hayLocal = Object.keys(progresoLocal()).length > 0;
    if (!est) {
      // Primera vez en este dispositivo con esta cuenta.
      if (hayNube && hayLocal && JSON.stringify(nube.datos) !== JSON.stringify(progresoLocal())) return elegirProgreso(n, nube);
      if (hayNube) return aplicarNube(nube);
      // Deja creada la ficha de la persona aunque aún no tenga progreso que subir.
      const version = Date.now();
      await n.escribir([], [], version);
      escribir(NUBE, { version, hashes: {} });
    } else if ((nube.meta?.actualizado ?? 0) > (est.version ?? 0)) {
      return aplicarNube(nube); // otro dispositivo guardó después: manda la nube
    }
    await subir(n);
    pintarEstado("guardado");
  } catch { pintarEstado("error"); }
  vigilar(n);
}
let vigilando = false;
function vigilar(n) {
  if (vigilando) return;
  vigilando = true;
  setInterval(() => subir(n), 4000);
  addEventListener("pagehide", () => subir(n));
  document.addEventListener("visibilitychange", () => { if (document.hidden) subir(n); });
}

/** Abre la ventana de Google o Apple. En móviles que bloquean ventanas, redirige. */
async function entrarCon(via) {
  const fb = await firebase();
  if (!fb) throw new Error("sin-firebase");
  const { A, auth } = fb;
  const proveedor = via === "apple" ? new A.OAuthProvider("apple.com") : new A.GoogleAuthProvider();
  if (via === "apple") { proveedor.addScope("email"); proveedor.addScope("name"); proveedor.setCustomParameters({ locale: "es_ES" }); }
  try { await A.signInWithPopup(auth, proveedor); }
  catch (e) {
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") await A.signInWithRedirect(auth, proveedor);
    else throw e;
  }
}

// ---------- Pantallas ----------
const ICONO_GOOGLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4Z"/></svg>`;
const ICONO_APPLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.5a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.1-4.1ZM13.9 5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z"/></svg>`;

/** Deja la página quieta detrás de la ventana. Con `deslizar`, la página se ve y se puede deslizar, pero no tocar. */
function bloquear(modal, { deslizar = false } = {}) {
  const resto = [...document.body.children].filter((el) => el !== modal);
  resto.forEach((el) => { el.inert = true; });
  if (!deslizar) document.documentElement.classList.add("racha-bloqueo");
  return () => { resto.forEach((el) => { el.inert = false; }); document.documentElement.classList.remove("racha-bloqueo"); modal.remove(); };
}

/** Pantalla de inicio de sesión. Se muestra la primera vez y desde Mi perfil. */
export function mostrarInicioSesion({ cerrable = false } = {}) {
  document.querySelector(".login-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "login-modal login-ligero no-deslizar"; // la página se ve y se desliza detrás, pero solo funciona esto
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "login-titulo");
  const listos = googleAppleListos(), apple = listos && APPLE_ACTIVO;
  modal.innerHTML = `<div class="login-caja">
    <img class="login-logo" src="${new URL("./logo/forty5-titulo.png", import.meta.url)}" alt="Forty5" width="900" height="214">
    <h2 id="login-titulo">Guarda tu progreso</h2>
    <p class="login-sub">Inicia sesión para no perder tus evaluaciones, tu rutina, tu dieta y tu racha, y tenerlas en cualquier dispositivo.</p>
    <div class="login-btns">
      <button type="button" class="login-btn google" data-via="google" ${listos ? "" : "disabled"}>${ICONO_GOOGLE}<span>Continuar con Google</span>${listos ? "" : "<small>Muy pronto</small>"}</button>
      ${apple ? `<button type="button" class="login-btn apple" data-via="apple" >${ICONO_APPLE}<span>Continuar con Apple</span></button>` : ""}
    </div>
    <p class="login-error" hidden></p>
    <button type="button" class="login-sin" data-via="local">${cerrable ? "Cancelar" : "Seguir sin cuenta (solo en este dispositivo)"}</button>
  </div>`;
  const soltar = bloquear(modal, { deslizar: true });
  document.body.append(modal);
  modal.querySelector(".login-btn:not([disabled]), .login-sin").focus();
  const error = (t) => { const p = modal.querySelector(".login-error"); p.textContent = t; p.hidden = !t; };

  modal.querySelectorAll('[data-via="google"], [data-via="apple"]').forEach((b) => b.addEventListener("click", async () => {
    const via = b.dataset.via, texto = b.querySelector("span").textContent;
    b.disabled = true; b.querySelector("span").textContent = "Conectando…"; error("");
    try {
      await entrarCon(via);
      // onAuthStateChanged guarda la cuenta y sincroniza.
      soltar();
    } catch (e) {
      b.disabled = false; b.querySelector("span").textContent = texto;
      if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") error("No se ha podido iniciar sesión. Inténtalo de nuevo.");
    }
  }));
  modal.querySelector('[data-via="local"]').addEventListener("click", () => {
    if (!cerrable) escribir(CUENTA, { tipo: "local", desde: new Date().toISOString() });
    soltar();
    if (!cerrable && !leer(NOMBRE)) pedirNombre();
  });
}

/**
 * "¿Cómo te llamas?": se pide una vez a cada persona (tras iniciar sesión o al seguir sin cuenta).
 * Con el nombre la app te saluda por voz y, si has iniciado sesión, te llega el correo de bienvenida.
 */
export function pedirNombre({ sugerido = "", alGuardar } = {}) {
  if (document.querySelector(".login-modal")) return;
  const modal = document.createElement("div");
  modal.className = "login-modal no-deslizar";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "nombre-titulo");
  modal.innerHTML = `<form class="login-caja nombre-caja">
    <img class="login-logo" src="${new URL("./logo/forty5-titulo.png", import.meta.url)}" alt="Forty5" width="900" height="214">
    <h2 id="nombre-titulo">¿Cómo te llamas?</h2>
    <p class="login-sub">Así te saludaremos al entrar y sabremos cómo dirigirnos a ti.</p>
    <input class="nombre-input" name="nombre" type="text" autocomplete="given-name" autocapitalize="words" maxlength="30" required placeholder="Tu nombre">
    <p class="login-error" hidden></p>
    <div class="login-btns" style="margin-top:14px"><button type="submit" class="login-btn principal"><span>Continuar</span></button></div>
  </form>`;
  const soltar = bloquear(modal);
  document.body.append(modal);
  const input = modal.querySelector(".nombre-input");
  input.value = sugerido;
  input.focus();
  modal.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = limpiarNombre(input.value);
    if (!nombre) { const p = modal.querySelector(".login-error"); p.textContent = "Escribe tu nombre para continuar."; p.hidden = false; return; }
    escribir(NOMBRE, nombre);
    soltar();
    saludar(nombre); // el toque en «Continuar» deja que suene
    dispatchEvent(new CustomEvent("forty5:nombre", { detail: { nombre } }));
    alGuardar?.(nombre);
  });
}
/** "  jonás  ramos " → "Jonás Ramos" (solo se pone en mayúscula la primera letra de cada palabra). */
export function limpiarNombre(t) {
  return String(t ?? "").replace(/\s+/g, " ").trim().slice(0, 30)
    .split(" ").map((p) => p.charAt(0).toLocaleUpperCase("es") + p.slice(1)).join(" ");
}
export const nombre = () => leer(NOMBRE, "");
export function cambiarNombre(n) { const v = limpiarNombre(n); if (v) { escribir(NOMBRE, v); dispatchEvent(new CustomEvent("forty5:nombre", { detail: { nombre: v } })); } return v; }

// ---------- Correo de bienvenida ----------
// Se manda una sola vez por cuenta, cuando ya hay sesión iniciada y nombre. Lo envía la función de
// Netlify netlify/functions/bienvenida.mjs (comprueba la sesión con el token de Firebase y manda el
// correo a la dirección de esa cuenta). En la ficha usuarios/<uid> queda "bienvenida" con la fecha.
async function bienvenidaSiFalta(fb, u, meta) {
  const n = leer(NOMBRE);
  if (!n || !u.email || meta?.bienvenida) return;
  const { db, F } = fb, ficha = F.doc(db, "usuarios", u.uid);
  await F.setDoc(ficha, { nombre: n, correo: u.email }, { merge: true }).catch(() => {});
  try {
    const r = await fetch("/.netlify/functions/bienvenida", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: await u.getIdToken(), nombre: n }),
    });
    if (r.ok) await F.setDoc(ficha, { bienvenida: Date.now() }, { merge: true });
  } catch { /* sin servidor de correo (p. ej. en claude.ai): se reintenta en otra visita */ }
}

/** Si en este dispositivo había progreso y en la cuenta también, la persona elige. */
function elegirProgreso(n, nube) {
  const modal = document.createElement("div");
  modal.className = "login-modal no-deslizar";
  modal.setAttribute("role", "alertdialog"); modal.setAttribute("aria-modal", "true");
  const fecha = nube.meta?.actualizado ? new Date(nube.meta.actualizado).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : null;
  modal.innerHTML = `<div class="login-caja">
    <h2>Tienes progreso en dos sitios</h2>
    <p class="login-sub">Tu cuenta ya tiene progreso guardado${fecha ? ` (del ${fecha})` : ""} y este dispositivo también. ¿Con cuál te quedas?</p>
    <div class="login-btns">
      <button type="button" class="login-btn principal" data-usar="nube"><span>Usar el de mi cuenta</span></button>
      <button type="button" class="login-btn" data-usar="local"><span>Usar el de este dispositivo</span><small>sustituye al de la cuenta</small></button>
    </div></div>`;
  const soltar = bloquear(modal);
  document.body.append(modal);
  modal.querySelector('[data-usar="nube"]').addEventListener("click", () => aplicarNube(nube));
  modal.querySelector('[data-usar="local"]').addEventListener("click", async () => {
    escribir(NUBE, { version: 0, hashes: Object.fromEntries(Object.keys(nube.datos).map((k) => [k, "-"])) });
    soltar(); await subir(n);
    vigilar(n);
  });
}

// Pequeño aviso de estado (guardado en la nube, sin permiso…) para Mi perfil.
let ultimoEstado = null;
function pintarEstado(e) {
  ultimoEstado = e;
  dispatchEvent(new CustomEvent("forty5:cuenta", { detail: { estado: e } }));
}
export const estadoNube = () => ultimoEstado;

const RESPALDO = "forty5.respaldo"; // { uid, datos }: lo que no llegó a subirse al cerrar sesión

/**
 * Cerrar sesión: sube lo último a la cuenta, quita el progreso de este dispositivo y vuelve a la
 * pantalla de inicio (evaluación + iniciar sesión). Al volver a entrar con la misma cuenta, todo
 * baja de la nube y se pasa a Rutina / Mi plan / Dieta. Si algo no se pudo subir (sin conexión),
 * se guarda aparte en este dispositivo y se recupera al volver a entrar con esa cuenta.
 */
export async function cerrarSesion() {
  const fb = await firebase();
  const u = fb?.auth?.currentUser;
  if (u) {
    const n = nubeDe(fb, u.uid);
    for (let i = 0; i < 20 && subiendo; i++) await new Promise((r) => setTimeout(r, 150)); // espera a una subida en curso
    await subir(n).catch(() => {});
    const local = progresoLocal();
    const { subir: falta, borrar } = cambiosPendientes(local, leer(NUBE, { hashes: {} }).hashes);
    if (falta.length || borrar.length) escribir(RESPALDO, { uid: u.uid, datos: local });
  }
  if (fb) await fb.A.signOut(fb.auth).catch(() => {});
  for (const k of Object.keys(progresoLocal())) localStorage.removeItem(k);
  escribir(CUENTA, null);
  escribir(NUBE, null);
  try { sessionStorage.clear(); } catch { /* sin almacenamiento */ }
  location.replace(new URL("../index.html", import.meta.url).href);
}

/** Al entrar: si al cerrar sesión quedó algo sin subir de esta cuenta, vuelve a este dispositivo. */
function recuperarRespaldo(uid) {
  const r = leer(RESPALDO, null);
  if (!r || r.uid !== uid) return;
  if (!Object.keys(progresoLocal()).length) for (const [k, v] of Object.entries(r.datos ?? {})) localStorage.setItem(k, v);
  escribir(RESPALDO, null);
}
export function iniciarSesion() { mostrarInicioSesion({ cerrable: true }); }

if (typeof document !== "undefined") {
  const arrancar = async () => {
    const c = cuenta();
    saludoAlEntrar();
    if (c?.tipo === "local" && !leer(NOMBRE)) pedirNombre();
    const fb = await firebase();
    if (!fb) { if (!c) mostrarInicioSesion(); return; }
    fb.A.getRedirectResult(fb.auth).catch(() => {});
    let primera = true;
    fb.A.onAuthStateChanged(fb.auth, (u) => {
      if (u) {
        const via = u.providerData?.[0]?.providerId === "apple.com" ? "apple" : "google";
        escribir(CUENTA, { tipo: via, nombre: u.displayName || "", correo: u.email || "", desde: c?.desde ?? new Date().toISOString() });
        document.querySelector(".login-modal")?.remove();
        document.body.classList.add("con-cuenta");
        dispatchEvent(new CustomEvent("forty5:cuenta", { detail: { estado: "conectado" } }));
        recuperarRespaldo(u.uid);
        sincronizar(nubeDe(fb, u.uid)).then(async () => {
          const meta = await fb.F.getDoc(fb.F.doc(fb.db, "usuarios", u.uid)).then((d) => d.data()).catch(() => null);
          if (leer(NOMBRE)) return bienvenidaSiFalta(fb, u, meta);
          pedirNombre({ sugerido: limpiarNombre((u.displayName || "").split(" ")[0]), alGuardar: () => bienvenidaSiFalta(fb, u, meta) });
        });
      } else if (primera && (!c || c.tipo !== "local")) {
        mostrarInicioSesion();
      }
      primera = false;
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
}
