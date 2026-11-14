// Pasar el progreso de una web de Forty5 a otra (por ejemplo, de claude.ai a la web propia).
// Cada web guarda lo suyo en el navegador, así que en la de origen se genera un código con todo
// el progreso ("sportfy.*") y en la de destino se pega. Si allí hay sesión iniciada, cuenta.js lo
// sube solo a la nube en unos segundos.
import { progresoLocal } from "./cuenta.js?v=202611141555";

const B64 = { de: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) };
const trozos = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const comprime = typeof CompressionStream !== "undefined";

async function porStream(datos, stream) {
  const r = new Response(new Blob([datos]).stream().pipeThrough(stream));
  return new Uint8Array(await r.arrayBuffer());
}

/** Código con todo el progreso de este navegador. */
export async function crearCodigo(progreso = progresoLocal()) {
  const json = JSON.stringify({ v: 1, fecha: new Date().toISOString(), progreso });
  if (comprime) return "F45Z:" + trozos(await porStream(json, new CompressionStream("gzip")));
  return "F45J:" + trozos(new TextEncoder().encode(json));
}

/** Lee un código y devuelve { fecha, progreso }. Lanza un error si no es válido. */
export async function leerCodigo(codigo) {
  const c = String(codigo ?? "").replace(/\s+/g, "");
  let json;
  if (c.startsWith("F45Z:")) json = new TextDecoder().decode(await porStream(B64.de(c.slice(5)), new DecompressionStream("gzip")));
  else if (c.startsWith("F45J:")) json = new TextDecoder().decode(B64.de(c.slice(5)));
  else throw new Error("codigo");
  const d = JSON.parse(json);
  if (d?.v !== 1 || typeof d.progreso !== "object") throw new Error("codigo");
  const progreso = Object.fromEntries(Object.entries(d.progreso).filter(([k, v]) => k.startsWith("sportfy.") && typeof v === "string"));
  return { fecha: d.fecha, progreso };
}

/** Sustituye el progreso de este navegador por el del código. */
export function aplicarProgreso(progreso, storage = localStorage) {
  for (const k of Object.keys(progresoLocal())) storage.removeItem(k);
  for (const [k, v] of Object.entries(progreso)) storage.setItem(k, v);
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Tarjeta "Pasar mi progreso a otra web" (en Mi perfil). */
export function montarTraspaso(caja) {
  if (!caja) return;
  const n = Object.keys(progresoLocal()).length;
  caja.innerHTML = `<div class="card">
    <h3>Pasar mi progreso a otra web</h3>
    <p style="margin:4px 0 0">Cada web de Forty5 guarda tu progreso por separado. Para llevarlo de una a otra (por ejemplo, de claude.ai a tu web), copia el código en la web donde lo tienes y pégalo en la otra.</p>
    <div style="display:grid;gap:10px;margin-top:12px">
      <button class="btn" type="button" id="tr-copiar" ${n ? "" : "disabled"}>1. Copiar mi progreso de aquí</button>
      <textarea id="tr-codigo" rows="3" placeholder="Pega aquí el código" style="width:100%;font:inherit;font-size:.85rem;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text)"></textarea>
      <button class="btn secondary" type="button" id="tr-pegar">2. Traer el progreso del código</button>
    </div>
    <p class="note" id="tr-nota" style="margin:8px 0 0">${n ? "" : "Aquí todavía no hay progreso que copiar."}</p>
  </div>`;
  const nota = caja.querySelector("#tr-nota"), area = caja.querySelector("#tr-codigo");
  const decir = (t) => { nota.textContent = t; };
  caja.querySelector("#tr-copiar").addEventListener("click", async () => {
    const codigo = await crearCodigo();
    area.value = codigo;
    let copiado = false;
    try { await navigator.clipboard.writeText(codigo); copiado = true; } catch { /* sin portapapeles */ }
    if (!copiado) { area.focus(); area.select(); try { copiado = document.execCommand("copy"); } catch { /* nada */ } }
    decir(copiado
      ? "✓ Código copiado. Abre la otra web, entra en Mi perfil, pégalo en el cuadro y pulsa «Traer el progreso del código»."
      : "Selecciona todo el texto del cuadro, cópialo y pégalo en Mi perfil de la otra web.");
  });
  caja.querySelector("#tr-pegar").addEventListener("click", async () => {
    let datos;
    try { datos = await leerCodigo(area.value); } catch { return decir("Ese código no es válido. Cópialo entero otra vez desde la otra web."); }
    const cuantos = Object.keys(datos.progreso).length;
    const fecha = datos.fecha ? new Date(datos.fecha).toLocaleString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
    if (!confirmar(caja, `Se cambiará el progreso de esta web por el del código${fecha ? ` (copiado el ${esc(fecha)})` : ""}. ¿Seguro?`)) return;
    aplicarProgreso(datos.progreso);
    decir(`✓ Progreso traído (${cuantos} apartados). Recargando…`);
    setTimeout(() => location.reload(), 1500); // al recargar, cuenta.js lo sube a la nube si hay sesión
  });
}

// Confirmación sin ventanas del navegador: el botón pide un segundo toque.
function confirmar(caja, texto) {
  const b = caja.querySelector("#tr-pegar");
  if (b.dataset.seguro === "1") { delete b.dataset.seguro; return true; }
  b.dataset.seguro = "1"; b.textContent = "Sí, traerlo (toca otra vez)";
  caja.querySelector("#tr-nota").innerHTML = texto;
  setTimeout(() => { if (b.dataset.seguro) { delete b.dataset.seguro; b.textContent = "2. Traer el progreso del código"; } }, 8000);
  return false;
}
