// Ajustes rápidos de la rutina: un desplegable en la misma página (sin ir a preferencias.html) con
// un resumen de la pantalla de preferencias: días, tiempo, sitio, tiempo parado, zonas y salud.
// Se abre con cualquier enlace o botón marcado con data-ajustes. Al guardar recalcula el plan y
// vuelve a montar la pestaña (o recarga la página si no es una pestaña).
import { sincronizar, evaluaciones } from "./evaluaciones.js?v=202611130100";
import { calcularTodo, guardarPreferencias, leerPreferencias } from "./motor.js?v=202611130440";
import { DIAS_SEMANA, FOCOS, CONDICIONES, MATERIAL, PARADA } from "./rutina.js?v=202611130440";

const LETRA = ["L", "M", "X", "J", "V", "S", "D"];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };

/** Selección múltiple con una primera opción "ninguno" excluyente. */
export function alternar(lista, valor, ninguno) {
  if (valor === ninguno) return [ninguno];
  const s = new Set(lista.filter((x) => x !== ninguno));
  s.has(valor) ? s.delete(valor) : s.add(valor);
  return s.size ? [...s] : [ninguno];
}

const CSS = `
.ajustes-rapidos { margin: 12px 0 4px; padding: 14px; border-radius: 16px; border: 1px solid var(--accent, #e4572e);
  background: var(--surface, #fff); color: var(--text, #111); text-align: left; animation: ajustes-entra .22s ease both; }
@keyframes ajustes-entra { from { opacity: 0; transform: translateY(-6px); } }
.ajustes-rapidos h4 { margin: 12px 0 6px; font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted, #666); }
.ajustes-rapidos h4:first-child { margin-top: 0; }
.ajustes-rapidos .aj-dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.ajustes-rapidos .aj-dias button { padding: 9px 0; border-radius: 10px; border: 1px solid var(--border, #ddd); background: transparent; color: inherit; font: inherit; font-weight: 800; cursor: pointer; }
.ajustes-rapidos .aj-dias button.rec { border-style: dashed; border-color: var(--accent, #e4572e); }
.ajustes-rapidos .aj-dias button[aria-pressed="true"] { background: var(--accent, #e4572e); border-color: var(--accent, #e4572e); color: #fff; }
.ajustes-rapidos .aj-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ajustes-rapidos select { width: 100%; min-width: 0; font: inherit; font-size: .9rem; padding: 7px 8px; border-radius: 10px; border: 1px solid var(--border, #ddd); background: var(--surface, #fff); color: inherit; }
.ajustes-rapidos .aj-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ajustes-rapidos .aj-chips button { padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border, #ddd); background: transparent; color: inherit; font: inherit; font-size: .82rem; cursor: pointer; }
.ajustes-rapidos .aj-chips button[aria-pressed="true"] { background: var(--accent, #e4572e); border-color: var(--accent, #e4572e); color: #fff; }
.ajustes-rapidos .aj-nota { font-size: .8rem; color: var(--muted, #666); margin: 6px 0 0; }
.ajustes-rapidos .aj-botones { display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-top: 14px; }
.ajustes-rapidos .aj-botones button { margin: 0; }
`;

let abierto = null; // { panel, origen }

function cerrar() {
  abierto?.panel.remove();
  abierto?.origen?.setAttribute("aria-expanded", "false");
  abierto = null;
}

function abrir(origen) {
  if (abierto?.origen === origen) { cerrar(); return; }
  cerrar();
  sincronizar();
  const apartados = evaluaciones();
  if (!apartados.length) { location.href = "preferencias.html"; return; }
  if (!document.getElementById("ajustes-css")) {
    const st = document.createElement("style"); st.id = "ajustes-css"; st.textContent = CSS; document.head.append(st);
  }
  const actividad = leer("sportfy.actividad", "ligera");
  const previas = leerPreferencias();
  const rec = calcularTodo({ apartados, prefs: { condiciones: previas.condiciones ?? [] }, actividad }).recomendacion;
  const estado = {
    diasSemana: previas.diasSemana?.length ? [...previas.diasSemana] : [...rec.diasSemana],
    foco: previas.foco?.length ? [...previas.foco] : ["ninguno"],
    condiciones: previas.condiciones?.length ? [...previas.condiciones] : ["ninguna"],
    minutos: previas.minutos ?? 60,
    material: previas.material ?? "gimnasio",
    parada: previas.parada ?? "entrenando",
  };

  const panel = document.createElement("div");
  panel.className = "ajustes-rapidos no-deslizar";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Cambiar días, zonas o salud");
  const pintar = () => {
    const n = estado.diasSemana.length;
    panel.innerHTML = `
      <h4>Días de entreno</h4>
      <div class="aj-dias" role="group" aria-label="Días de la semana">${DIAS_SEMANA.map((d, i) => `<button type="button" class="${rec.diasSemana.includes(i) ? "rec" : ""}" data-aj-dia="${i}" aria-pressed="${estado.diasSemana.includes(i)}" aria-label="${esc(d)}">${LETRA[i]}</button>`).join("")}</div>
      <p class="aj-nota">${n ? `${n} ${n === 1 ? "día" : "días"}` : "Marca al menos un día"} · te recomendamos ${rec.dias} (con borde discontinuo).</p>
      <div class="aj-fila" style="margin-top:10px">
        <label><h4>Tiempo</h4><select data-aj="minutos">${[45, 60, 75, 90].map((m) => `<option value="${m}" ${m === estado.minutos ? "selected" : ""}>${m} min</option>`).join("")}</select></label>
        <label><h4>Dónde</h4><select data-aj="material">${Object.entries(MATERIAL).map(([k, v]) => `<option value="${k}" ${k === estado.material ? "selected" : ""}>${esc(v.nombre)}</option>`).join("")}</select></label>
      </div>
      <label><h4>Tiempo sin ir al gimnasio</h4><select data-aj="parada">${Object.entries(PARADA).map(([k, v]) => `<option value="${k}" ${k === estado.parada ? "selected" : ""}>${esc(v.nombre)}</option>`).join("")}</select></label>
      <h4>Zonas a priorizar</h4>
      <div class="aj-chips">${Object.entries(FOCOS).map(([k, v]) => `<button type="button" data-aj-foco="${k}" aria-pressed="${estado.foco.includes(k)}">${esc(k === "ninguno" ? "Ninguna" : v.nombre)}</button>`).join("")}</div>
      <h4>Salud</h4>
      <div class="aj-chips">${Object.entries(CONDICIONES).map(([k, v]) => `<button type="button" data-aj-cond="${k}" aria-pressed="${estado.condiciones.includes(k)}">${esc(v.nombre)}</button>`).join("")}</div>
      <div class="aj-botones"><button type="button" class="btn secondary" data-aj-cancelar>Cancelar</button><button type="button" class="btn" data-aj-guardar ${n ? "" : "disabled"}>Guardar cambios</button></div>`;
  };
  pintar();
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ajDia != null) {
      const d = Number(b.dataset.ajDia), s = new Set(estado.diasSemana);
      s.has(d) ? s.delete(d) : s.add(d);
      estado.diasSemana = [...s].sort((a, z) => a - z);
    } else if (b.dataset.ajFoco) estado.foco = alternar(estado.foco, b.dataset.ajFoco, "ninguno");
    else if (b.dataset.ajCond) estado.condiciones = alternar(estado.condiciones, b.dataset.ajCond, "ninguna");
    else if (b.hasAttribute("data-aj-cancelar")) return cerrar();
    else if (b.hasAttribute("data-aj-guardar")) {
      if (!estado.diasSemana.length) return;
      guardarPreferencias({ ...estado, dias: estado.diasSemana.length });
      calcularTodo({ apartados, prefs: estado, actividad, guardar: true });
      cerrar();
      // Las pestañas (rutina, plan, dieta) se vuelven a montar sin recargar; el resto se recarga.
      if (!window.forty5Remontar?.()) location.reload();
      return;
    } else return;
    pintar();
  });
  panel.addEventListener("change", (e) => {
    const k = e.target.dataset.aj; if (!k) return;
    estado[k] = k === "minutos" ? Number(e.target.value) : e.target.value;
  });
  // Debajo del párrafo o bloque donde está el enlace.
  const ancla = origen.closest("p, .acciones, .note") ?? origen;
  ancla.after(panel);
  origen.setAttribute("aria-expanded", "true");
  abierto = { panel, origen };
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-ajustes]");
  if (!a) return;
  e.preventDefault();
  e.stopPropagation();
  abrir(a);
}, true);
// Al cambiar de pestaña el panel desaparece con el contenido: se olvida.
addEventListener("forty5:pestana", () => { abierto = null; });
