// Estado del perfil: los resultados solo cuentan como completos cuando el usuario
// los confirma con el tick verde. Hasta entonces quedan como "pendientes".
const PEND_KEY = "sportfy.pendientes";

const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

/** Marca que hay resultados vistos pero sin confirmar. */
export function marcarPendiente(evaluacion) {
  const p = leer(PEND_KEY, {});
  p[evaluacion] = new Date().toISOString();
  escribir(PEND_KEY, p);
}

export function quitarPendiente(evaluacion) {
  const p = leer(PEND_KEY, {});
  delete p[evaluacion];
  escribir(PEND_KEY, p);
}

export function pendientes() {
  return leer(PEND_KEY, {});
}

/** Pinta el tick verde dentro de `contenedor`; al pulsarlo llama a onConfirmar y oculta `botonResultados`. */
export function montarTick(contenedor, botonResultados, onConfirmar, rutaPerfil) {
  contenedor.innerHTML = `
    <div class="confirmar">
      <button type="button" class="tick" aria-label="Confirmar y guardar en mi perfil">✓</button>
      <p><b>¿Todo correcto?</b> Pulsa el tick para guardar estos resultados en tu perfil.</p>
    </div>`;
  contenedor.querySelector(".tick").addEventListener("click", () => {
    onConfirmar();
    botonResultados.classList.add("oculto");
    contenedor.innerHTML = `<div class="confirmado"><span>✓ Guardado en tu perfil</span><a href="${rutaPerfil}">Ver perfil →</a></div>`;
    // Si con esto quedan confirmadas las dos evaluaciones, se guarda el apartado
    // y la app pasa al modo plan: el motor de cálculo empieza el análisis.
    const base = new URL(rutaPerfil, location.href);
    import(new URL("evaluaciones.js", import.meta.url).href).then(({ sincronizar, modo }) => {
      if (sincronizar() && modo() === "plan") {
        contenedor.innerHTML = `<div class="confirmado"><span>✓ Evaluación completa</span><a href="${new URL("preferencias.html", base).href}">Personalizar mi rutina →</a></div>`;
      }
    }).catch(() => { /* sin cambios de modo */ });
  });
}
