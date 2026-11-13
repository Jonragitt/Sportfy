// Deslizar a izquierda o derecha pasa a la pestaña vecina (Rutina · Mi plan · Dieta).
// Funciona con el dedo (móvil), arrastrando con el ratón, con el gesto de dos dedos del
// trackpad y con las flechas ← → del teclado.
const ORDEN = ["rutina.html", "analisis.html", "dieta.html"];
// Con shared/pestanas.js la pestaña cambia sin recargar, así que se pregunta cuál se ve ahora.
const actualAhora = () => ORDEN.indexOf(window.forty5PestanaActual?.() ?? ((location.pathname.split("/").pop() || "analisis.html").replace(/^([^.]+)$/, "$1.html")));
const enControl = (el) => el?.closest?.("input, select, textarea, button, a, label, .no-deslizar, .dias, .comparar, table, [contenteditable]");
const sinPlan = () => document.querySelector(".tabs a[href='index.html']");
let yendo = false;
function ir(sentido) {
  const actual = actualAhora();
  if (yendo || actual < 0 || sinPlan()) return;
  const destino = ORDEN[actual + sentido];
  if (!destino) return;
  if (window.forty5IrPestana?.(destino)) return;
  yendo = true;
  location.href = destino;
}

// Gesto claramente horizontal, rápido y de al menos 70 px (100 px arrastrando con el ratón).
let x0 = null, y0 = null, t0 = 0;
const empezar = (x, y, el) => { if (enControl(el)) { x0 = null; return; } x0 = x; y0 = y; t0 = Date.now(); };
const terminar = (x, y, min) => {
  if (x0 == null) return;
  const dx = x - x0, dy = y - y0;
  x0 = null;
  if (Math.abs(dx) < min || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - t0 > 800) return;
  if (String(getSelection?.() ?? "").trim()) return; // estaba seleccionando texto
  ir(dx < 0 ? 1 : -1);
};
// Dedo (móvil): eventos táctiles, que no se cancelan al empezar el scroll.
addEventListener("touchstart", (e) => { if (e.touches.length === 1) empezar(e.touches[0].clientX, e.touches[0].clientY, e.target); else x0 = null; }, { passive: true });
addEventListener("touchend", (e) => terminar(e.changedTouches[0].clientX, e.changedTouches[0].clientY, 70), { passive: true });
// Ratón (ordenador): arrastrar con el botón izquierdo.
addEventListener("mousedown", (e) => { if (e.button === 0 && !e.sourceCapabilities?.firesTouchEvents) empezar(e.clientX, e.clientY, e.target); });
addEventListener("mouseup", (e) => { if (e.button === 0 && !e.sourceCapabilities?.firesTouchEvents) terminar(e.clientX, e.clientY, 100); });

// Trackpad: desplazamiento horizontal con dos dedos.
let acumulado = 0, ultimo = 0;
addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || enControl(e.target)) return;
  const ahora = Date.now();
  if (ahora - ultimo > 250) acumulado = 0;
  ultimo = ahora;
  acumulado += e.deltaX;
  if (Math.abs(acumulado) > 140) { ir(acumulado > 0 ? 1 : -1); acumulado = 0; }
}, { passive: true });

// Teclado: flechas izquierda y derecha.
addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || enControl(document.activeElement)) return;
  if (e.key === "ArrowRight") ir(1);
  else if (e.key === "ArrowLeft") ir(-1);
});
