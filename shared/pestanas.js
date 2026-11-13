// Rutina, Mi plan y Dieta como una sola página: al cambiar de pestaña no se recarga nada.
// Se trae el HTML de la otra pestaña (precargado), se cambia solo el <main> y sus estilos, y se
// ejecutan sus scripts. El fondo, el reloj, la racha y las esquinas se quedan tal cual, así que
// no hay fundido a negro ni parón. Si algo falla, se navega a la página normal.
// Script clásico en el <head>: tiene que cargarse antes que los de la página para saber qué
// escuchas e intervalos pone cada pestaña y quitarlos al salir de ella.
(() => {
  const PAGINAS = ["rutina.html", "analisis.html", "dieta.html"];
  const nombre = (u) => new URL(u, location.href).pathname.split("/").pop() || "index.html";
  let actual = nombre(location.href);
  if (!PAGINAS.includes(actual)) return;

  // Lo que pone el código de la propia pestaña (scripts dentro del .html) se apunta para quitarlo
  // al cambiar; lo de los módulos compartidos (shared/*.js) se queda.
  const deLaPestana = () => /\.html(\?[^:\s)]*)?:\d+|\/paginas\/[a-z]+\.js/.test(new Error().stack || "");
  const escuchas = [], intervalos = [];
  for (const obj of [window, document]) {
    const poner = obj.addEventListener;
    obj.addEventListener = function (tipo, fn, op) {
      if (deLaPestana()) escuchas.push({ obj, tipo, fn, op });
      return poner.call(this, tipo, fn, op);
    };
  }
  const setIntervalOriginal = window.setInterval;
  window.setInterval = function (...a) {
    const id = setIntervalOriginal.apply(this, a);
    if (deLaPestana()) intervalos.push(id);
    return id;
  };
  const limpiar = () => {
    for (const e of escuchas.splice(0)) e.obj.removeEventListener(e.tipo, e.fn, e.op);
    for (const id of intervalos.splice(0)) clearInterval(id);
  };

  const cache = new Map();
  const traer = (p) => {
    if (!cache.has(p)) {
      cache.set(p, fetch(p, { credentials: "same-origin" })
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then((t) => new DOMParser().parseFromString(t, "text/html"))
        .catch((e) => { cache.delete(p); throw e; }));
    }
    return cache.get(p);
  };

  let ocupado = false, montando = null;
  function cambiar(doc, p) {
    limpiar();
    montando = null;
    // Estilos propios de cada pestaña (los <style> del <head>): fuera los que sobran, dentro los nuevos.
    const nuevos = [...doc.head.querySelectorAll("style")].map((s) => s.textContent);
    document.head.querySelectorAll("style").forEach((s) => { if (!nuevos.includes(s.textContent)) s.remove(); });
    const ya = [...document.head.querySelectorAll("style")].map((s) => s.textContent);
    for (const t of nuevos) if (!ya.includes(t)) { const s = document.createElement("style"); s.textContent = t; document.head.append(s); }
    document.title = doc.title;
    document.querySelector("main").replaceWith(document.importNode(doc.querySelector("main"), true));
    actual = p;
    // Scripts: los compartidos ya están cargados; los de la pestaña se ejecutan de nuevo.
    document.querySelectorAll("script[data-pestana]").forEach((s) => s.remove());
    for (const viejo of doc.body.querySelectorAll("script")) {
      // El código de cada pestaña está en shared/paginas/*.js y exporta montar(): se importa y se
      // monta otra vez (sin scripts en línea, que algunos visores como claude.ai bloquean).
      const pagina = viejo.dataset.pagina;
      if (pagina) { montando = import(new URL(pagina, location.href).href).then((m) => m.montar()); continue; }
      const src = viejo.getAttribute("src");
      if (src && document.querySelector(`script[src="${CSS.escape(src)}"]`)) continue;
      const s = document.createElement("script");
      for (const { name, value } of viejo.attributes) s.setAttribute(name, value);
      // sourceURL: así sus errores y escuchas llevan el nombre de la pestaña (ver deLaPestana).
      if (!src) { s.textContent = `${viejo.textContent}\n//# sourceURL=${p}`; s.dataset.pestana = ""; }
      document.body.append(s);
    }
    scrollTo(0, 0);
    return montando; // la transición espera a que la pestaña pinte su contenido
  }

  async function ir(p, { historial = true } = {}) {
    if (!PAGINAS.includes(p) || p === actual || ocupado) return;
    ocupado = true;
    let doc;
    try { doc = await traer(p); } catch { location.href = p; return; }
    try {
      if (historial) { try { history.pushState({ pestana: p }, "", p); } catch { /* sin historial */ } }
      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await document.startViewTransition(() => cambiar(doc, p)).updateCallbackDone;
      } else await cambiar(doc, p);
    } catch { location.href = p; return; } finally { ocupado = false; }
    dispatchEvent(new CustomEvent("forty5:pestana", { detail: p }));
  }
  window.forty5IrPestana = (p) => { if (PAGINAS.includes(actual) && PAGINAS.includes(p)) { ir(p); return true; } return false; };
  window.forty5PestanaActual = () => actual;

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.hash) return;
    const p = nombre(u.href);
    if (!PAGINAS.includes(p) || !document.querySelector(".tabs.arriba a[href='analisis.html']")) return; // sin plan, navegación normal
    e.preventDefault();
    ir(p);
  });
  addEventListener("popstate", () => { const p = nombre(location.href); if (PAGINAS.includes(p)) ir(p, { historial: false }); else location.reload(); });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("body script:not([src])").forEach((s) => { s.dataset.pestana = ""; });
    try { history.replaceState({ pestana: actual }, "", location.href); } catch { /* sin historial */ }
    for (const p of PAGINAS) if (p !== actual) traer(p).catch(() => {});
  });
})();
