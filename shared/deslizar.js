// Deslizar el dedo a izquierda o derecha pasa a la pestaña vecina (Rutina · Mi plan · Dieta).
const ORDEN = ["rutina.html", "analisis.html", "dieta.html"];
const actual = ORDEN.indexOf(location.pathname.split("/").pop() || "analisis.html");
let x0 = null, y0 = null, t0 = 0;
const enControl = (el) => el.closest("input, select, textarea, button, .no-deslizar, .dias, .comparar, table, [contenteditable]");
addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1 || enControl(e.target)) { x0 = null; return; }
  x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
}, { passive: true });
addEventListener("touchend", (e) => {
  if (x0 == null || actual < 0) return;
  const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
  x0 = null;
  // Gesto claramente horizontal, rápido y de al menos 70 px (no confunde con el scroll).
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - t0 > 700) return;
  if (document.querySelector(".tabs a[href='index.html']")) return; // sin plan todavía
  const destino = ORDEN[actual + (dx < 0 ? 1 : -1)];
  if (destino) location.href = destino;
}, { passive: true });
