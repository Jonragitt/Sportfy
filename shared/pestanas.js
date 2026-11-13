// Rutina, Mi plan y Dieta como una sola página: al cambiar de pestaña no se recarga nada.
// Se trae el HTML de la otra pestaña (precargado), se cambia solo el <main> y sus estilos, y se
// ejecutan sus scripts. El fondo, el reloj, la racha y las esquinas se quedan tal cual, así que
// no hay fundido a negro ni parón. Si algo falla, se navega a la página normal.
// Script clásico en el <head>: tiene que cargarse antes que los de la página para saber qué
// escuchas e intervalos pone cada pestaña y quitarlos al salir de ella.
(() => {
  const PAGINAS = ["rutina.html", "analisis.html", "dieta.html"];
  // Netlify sirve las páginas sin ".html" (/rutina): se normaliza para reconocerlas igual.
  const nombre = (u) => { const n = new URL(u, location.href).pathname.split("/").pop() || "index.html"; return n.includes(".") ? n : n + ".html"; };
  let actual = nombre(location.href);
  // Netlify también reescribe los enlaces (href="/analisis"), así que se compara por nombre.
  const conPlan = (t) => !!t && [...t.querySelectorAll("a[href]")].some((a) => nombre(a.href) === "analisis.html");
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
    // La cabecera (logo, título y pestañas) es la misma: se conserva y solo cambian el título y
    // la pestaña marcada, así no se mueve nada.
    const cabVieja = document.querySelector("main .cabecera");
    const main = document.importNode(doc.querySelector("main"), true);
    const cabNueva = main.querySelector(".cabecera");
    if (cabVieja && cabNueva) {
      cabVieja.querySelector("h1").textContent = cabNueva.querySelector("h1")?.textContent ?? "";
      const logo = cabNueva.querySelector(".topbar-logo")?.getAttribute("href");
      if (logo) cabVieja.querySelector(".topbar-logo")?.setAttribute("href", logo);
      cabVieja.querySelectorAll(".tabs.arriba a").forEach((a) => { if (nombre(a.href) === p) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      cabNueva.replaceWith(cabVieja);
    }
    main.classList.add("entrando");
    main.addEventListener("animationend", () => main.classList.remove("entrando"), { once: true });
    const viejo = document.querySelector("main");
    main.style.minHeight = `${viejo.offsetHeight}px`; // mismo alto hasta que pinte la pestaña nueva
    viejo.replaceWith(main);
    colocarLente(); // la píldora se desliza hasta la pestaña nueva
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
    Promise.resolve(montando).finally(() => requestAnimationFrame(() => { main.style.minHeight = ""; }));
    return montando; // la transición espera a que la pestaña pinte su contenido
  }

  // Menú principal: la dirección no cambia al pasar de una pestaña a otra.
  async function ir(p) {
    if (!PAGINAS.includes(p) || p === actual || ocupado) return;
    ocupado = true;
    let doc;
    try { doc = await traer(p); } catch { location.href = p; return; }
    try {
      await cambiar(doc, p);
    } catch { location.href = p; return; } finally { ocupado = false; }
    dispatchEvent(new CustomEvent("forty5:pestana", { detail: p }));
  }
  window.forty5IrPestana = (p) => { if (PAGINAS.includes(actual) && PAGINAS.includes(p)) { ir(p); return true; } return false; };
  window.forty5PestanaActual = () => actual;

  // ---------- Píldora arrastrable (como en Apunty) ----------
  const barra = () => document.querySelector(".tabs.arriba");
  function colocarLente(sinAnim = false) {
    const t = barra(), l = t?.querySelector(".lente"), a = t?.querySelector("a[aria-current='page']");
    if (!l || !a) return;
    if (sinAnim) t.classList.add("sin-anim");
    t.style.setProperty("--lx", `${a.offsetLeft}px`); t.style.setProperty("--lw", `${a.offsetWidth}px`);
    t.style.setProperty("--ly", `${a.offsetTop}px`); t.style.setProperty("--lh", `${a.offsetHeight}px`);
    if (sinAnim) requestAnimationFrame(() => requestAnimationFrame(() => t.classList.remove("sin-anim")));
  }
  function montarLente() {
    const t = barra();
    if (!t || t.querySelector(".lente") || !conPlan(t)) return;
    const l = document.createElement("i"); l.className = "lente"; l.setAttribute("aria-hidden", "true");
    t.prepend(l); t.classList.add("con-lente");
    // Que el navegador no empiece a "arrastrar el enlace" (eso cancela el gesto).
    t.querySelectorAll("a").forEach((a) => a.setAttribute("draggable", "false"));
    t.addEventListener("dragstart", (e) => e.preventDefault());
    colocarLente(true);
  }
  let arrastre = null;
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const a = e.target.closest?.(".tabs.con-lente a[aria-current='page']"); if (!a) return;
    const t = a.closest(".tabs"), enlaces = [...t.querySelectorAll("a")], l = t.querySelector(".lente");
    arrastre = { t, l, enlaces, id: e.pointerId, x0: e.clientX, lx0: a.offsetLeft, lx: a.offsetLeft, lw: l.offsetWidth, on: false, v: 0, tt: e.timeStamp,
      min: enlaces[0].offsetLeft, max: enlaces.at(-1).offsetLeft + enlaces.at(-1).offsetWidth - l.offsetWidth };
    t.classList.add("agarrada");
  }, true);
  const masCerca = (d, c) => { let mejor = 0, md = 1e9; d.enlaces.forEach((a, i) => { const dd = Math.abs(a.offsetLeft + a.offsetWidth / 2 - c); if (dd < md) { md = dd; mejor = i; } }); return mejor; };
  document.addEventListener("pointermove", (e) => {
    const d = arrastre; if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    if (!d.on) { if (Math.abs(dx) < 4) return; d.on = true; d.t.classList.add("arrastrando"); try { d.t.setPointerCapture(d.id); } catch { /* sin captura */ } }
    let lx = d.lx0 + dx;
    if (lx < d.min) lx = d.min - (d.min - lx) * 0.3; else if (lx > d.max) lx = d.max + (lx - d.max) * 0.3; // tope elástico
    const dt = Math.max(1, e.timeStamp - d.tt); d.v = d.v * 0.6 + ((lx - d.lx) / dt) * 0.4; d.tt = e.timeStamp; d.lx = lx;
    d.t.style.setProperty("--lx", `${lx}px`);
    const i = masCerca(d, lx + d.lw / 2);
    d.enlaces.forEach((a, k) => a.classList.toggle("cerca", k === i));
    e.preventDefault();
  }, { passive: false });
  const soltar = (e) => {
    const d = arrastre; if (!d || (e && e.pointerId !== d.id)) return;
    arrastre = null; d.t.classList.remove("agarrada");
    if (!d.on) return;
    d.t.classList.remove("arrastrando"); d.enlaces.forEach((a) => a.classList.remove("cerca"));
    d.t.dataset.arrastrada = "1"; setTimeout(() => delete d.t.dataset.arrastrada, 80);
    const i = masCerca(d, d.lx + Math.max(-d.lw * 0.45, Math.min(d.lw * 0.45, d.v * 90)) + d.lw / 2);
    const p = nombre(d.enlaces[i].href);
    if (p === actual) colocarLente(); else {
      // La píldora va ya a su sitio mientras cambia el contenido.
      d.t.style.setProperty("--lx", `${d.enlaces[i].offsetLeft}px`); d.t.style.setProperty("--lw", `${d.enlaces[i].offsetWidth}px`);
      ir(p).finally(() => colocarLente());
    }
  };
  document.addEventListener("pointerup", soltar);
  document.addEventListener("pointercancel", soltar);

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".tabs[data-arrastrada]")) { e.preventDefault(); return; }
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.hash) return;
    const p = nombre(u.href);
    if (!PAGINAS.includes(p) || !conPlan(document.querySelector(".tabs.arriba"))) return; // sin plan, navegación normal
    e.preventDefault();
    ir(p);
  });

  // Alto de la cabecera fija, para que el contenido empiece justo debajo.
  const medir = () => { const c = document.querySelector(".cabecera"); if (c) document.documentElement.style.setProperty("--alto-cabecera", `${Math.ceil(c.getBoundingClientRect().height)}px`); };
  addEventListener("resize", () => { medir(); colocarLente(true); });
  document.addEventListener("DOMContentLoaded", () => {
    medir();
    montarLente();
    document.fonts?.ready.then(() => colocarLente(true));
    if (window.ResizeObserver) { const c = document.querySelector(".cabecera"); if (c) new ResizeObserver(medir).observe(c); }
    document.querySelectorAll("body script:not([src])").forEach((s) => { s.dataset.pestana = ""; });
    // En la web propia la dirección se queda en la raíz (forty5.netlify.app/), que vuelve a abrir el
    // plan; dentro del visor de claude.ai (un marco) no se toca.
    if (window.top === window) { try { history.replaceState(null, "", new URL("./", location.href).href); } catch { /* sin historial */ } }
    for (const p of PAGINAS) if (p !== actual) traer(p).catch(() => {});
  });
})();
