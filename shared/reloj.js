// Reloj de Forty5: al lado del icono de perfil muestra la hora, el día, el mes y el año.
// El día que marca es el que usa el motor para decidir qué rutina y qué dieta tocan.
// Al tocarlo se puede mirar otro día (por ejemplo mañana); se vuelve a hoy con un botón.
// Cuando cambia el día (a medianoche o al elegir otro), avisa con el evento "forty5:fecha".
const CLAVE = "sportfy.fechaVista";
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dosCifras = (n) => String(n).padStart(2, "0");
const isoLocal = (d) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`;

function leerVista() { try { return sessionStorage.getItem(CLAVE); } catch { return null; } }
function guardarVista(v) { try { v ? sessionStorage.setItem(CLAVE, v) : sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ } }

/** Fecha que marca el reloj: hoy o el día que se ha elegido para mirar. */
export function fechaActual() {
  const ahora = new Date();
  const v = leerVista();
  if (!v || v === isoLocal(ahora)) return ahora;
  const [a, m, d] = v.split("-").map(Number);
  return new Date(a, m - 1, d, ahora.getHours(), ahora.getMinutes());
}
/** Día de la semana de la fecha del reloj, con el lunes como 0. */
export const diaSemana = (f = fechaActual()) => (f.getDay() + 6) % 7;
export const esHoy = () => isoLocal(fechaActual()) === isoLocal(new Date());
/** "viernes 13 de noviembre" */
export const fechaLarga = (f = fechaActual()) => `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`;

function montar() {
  if (document.querySelector(".reloj")) return;
  const caja = document.createElement("div");
  caja.className = "reloj no-deslizar" + (document.querySelector(".esquina.perfil") ? "" : " solo");
  caja.innerHTML = `<button type="button" class="reloj-btn" aria-haspopup="true" aria-expanded="false" aria-label="Fecha y hora">
      <b class="reloj-hora"></b><span class="reloj-fecha"></span></button>
    <div class="reloj-panel" hidden>
      <label>Ver otro día<input type="date" class="reloj-input"></label>
      <button type="button" class="reloj-hoy">Volver a hoy</button>
    </div>`;
  document.body.append(caja);
  const btn = caja.querySelector(".reloj-btn"), panel = caja.querySelector(".reloj-panel"), input = caja.querySelector(".reloj-input");
  let ultimoDia = isoLocal(fechaActual());

  const pintar = () => {
    const ahora = new Date(), f = fechaActual();
    caja.querySelector(".reloj-hora").textContent = `${dosCifras(ahora.getHours())}:${dosCifras(ahora.getMinutes())}`;
    caja.querySelector(".reloj-fecha").textContent = `${DIAS[f.getDay()].slice(0, 3)} ${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)} ${f.getFullYear()}`;
    caja.classList.toggle("otro-dia", !esHoy());
    caja.querySelector(".reloj-hoy").hidden = esHoy();
    const dia = isoLocal(f);
    if (dia !== ultimoDia) { ultimoDia = dia; dispatchEvent(new CustomEvent("forty5:fecha", { detail: { fecha: f } })); }
  };
  const abrir = (si) => { panel.hidden = !si; btn.setAttribute("aria-expanded", String(si)); if (si) input.value = isoLocal(fechaActual()); };
  btn.addEventListener("click", () => abrir(panel.hidden));
  input.addEventListener("change", () => { if (input.value) { guardarVista(input.value === isoLocal(new Date()) ? null : input.value); pintar(); } });
  caja.querySelector(".reloj-hoy").addEventListener("click", () => { guardarVista(null); pintar(); abrir(false); });
  document.addEventListener("click", (e) => { if (!caja.contains(e.target)) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir(false); });
  pintar();
  setInterval(pintar, 1000);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
}
