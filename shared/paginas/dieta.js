// Código de la pestaña dieta.html (shared/pestanas.js lo vuelve a montar al volver a ella sin recargar).
import { sincronizar, evaluaciones } from "../evaluaciones.js?v=202611130100";
import { calcularTodo, leerPreferencias, necesitaPreferencias } from "../motor.js?v=202611130440";
import { fechaActual, diaSemana, fechaLarga, esHoy } from "../reloj.js?v=202611130400";
import { calcularDieta, menusSemanales, menuDeLaSemana } from "../dieta.js?v=202611150140";
import { DIAS_SEMANA } from "../rutina.js?v=202611130440";

export function montar() {

    const $ = (s) => document.querySelector(s);
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const fmt = (n, d = 0) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: d });
    const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
    const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

    sincronizar();
    if (necesitaPreferencias()) location.replace("preferencias.html");
    const apartados = evaluaciones();
    if (!apartados.length) {
      $("#intro").textContent = "Tu dieta se abrirá cuando completes y confirmes las dos evaluaciones.";
      $("#contenido").innerHTML = `<div class="card empty"><p>Necesitamos tu evaluación antropométrica y tu evaluación postural, las dos confirmadas con el tick verde, para calcular tu dieta.</p>
        <a class="btn" href="index.html">Ir a las evaluaciones</a></div>`;
      document.querySelector(".tabs").innerHTML = `<a href="index.html">Inicio</a><a href="perfil.html">Perfil</a>`;
      document.querySelector(".esquina.menu").href = "index.html";
    } else {
      const actividad = leer("sportfy.actividad", "ligera");
      const prefs = leerPreferencias();
      const { perfil, rutina } = calcularTodo({ apartados, prefs, actividad });
      const p = perfil.plan;
      // El reloj marca el día: según él toca día de entreno o de descanso y el menú de ese día.
      let hoy, tipo;
      const elegirHoy = () => { hoy = diaSemana(fechaActual()); tipo = (rutina.diasSemana ?? []).includes(hoy) ? "entreno" : "descanso"; };
      elegirHoy();
      addEventListener("forty5:fecha", () => { elegirHoy(); pintar(); });
      let comidas = leer("sportfy.dieta.comidas", 5);
      let eleccion = leer("sportfy.dieta.opciones", {});

      // Una comida con su foto, kcal, macros, plato, cantidades y preparación.
      // elegir = true añade el desplegable de opciones (solo en «Tu día de comidas»).
      const htmlComida = (c, elegir) => `<div class="comida">
              <button type="button" class="comida-foto" data-foto="${esc(c.opcion)}" aria-label="Ver foto: ${esc(c.plato)}"><img src="shared/comidas/${esc(c.opcion)}.jpg" alt="" loading="lazy" width="160" height="160"></button>
              <div class="comida-head"><h3>${esc(c.nombre)}</h3><span>${fmt(c.kcal)} kcal</span></div>
              <p class="macros">P ${c.proteina} g · H ${c.hidratos} g · G ${c.grasa} g</p>
              ${elegir ? `<label class="opcion">Opción <select data-comida="${esc(c.nombre)}">
                <option value="" ${c.auto ? "selected" : ""}>Variar cada día</option>
                ${c.opciones.map((o) => `<option value="${esc(o.id)}" ${!c.auto && o.id === c.opcion ? "selected" : ""}>${esc(o.nombre)}</option>`).join("")}
              </select></label>` : ""}
              <p class="plato">${esc(c.plato)}${elegir && c.auto ? ` <span class="note">· ${esHoy() ? "hoy" : "ese día"}</span>` : ""}</p>
              <ul>${c.ejemplo.map((e) => `<li>${esc(e.nombre)}: <b>${esc(e.texto)}</b></li>`).join("")}${["Comida", "Cena"].includes(c.nombre) ? "<li>Verdura al gusto, fresca o congelada (medio plato)</li>" : ""}</ul>
              ${c.preparacion ? `<p class="note" style="margin:4px 0 0">🍳 ${esc(c.preparacion)}</p>` : ""}
            </div>`;
      const htmlLeyenda = (x) => {
        const t = x.proteina * 4 + x.hidratos * 4 + x.grasa * 9, q = (g, k) => Math.round(g * k / t * 100);
        return `<div class="macro-bar" aria-hidden="true"><i style="width:${q(x.proteina, 4)}%"></i><i style="width:${q(x.grasa, 9)}%"></i><i style="width:${q(x.hidratos, 4)}%"></i></div>
            <div class="leyenda">
              <span><b>${fmt(x.kcal)} kcal</b></span>
              <span><i class="punto" style="background:var(--accent)"></i>Proteína <b>${x.proteina} g</b></span>
              <span><i class="punto" style="background:var(--mid)"></i>Grasas <b>${x.grasa} g</b></span>
              <span><i class="punto" style="background:var(--good)"></i>Hidratos <b>${x.hidratos} g</b></span>
            </div>`;
      };
      const CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      let plegado = leer("sportfy.dieta.plegado", false);
      let menuAbierto = null, diaAbierto = null;

      function pintar() {
        if (!p) {
          $("#contenido").innerHTML = `<div class="card"><p style="margin:0">Para calcular tu dieta necesitamos la evaluación antropométrica con edad, altura y peso.</p></div>`;
          return;
        }
        const peso = apartados.at(-1)?.antro?.datos?.peso ?? null;
        const d = calcularDieta(p, { diasEntreno: rutina.diasSemana ?? [], comidas, peso, eleccion, dia: hoy, condiciones: (rutina.condiciones ?? []).map((c) => c.id) });
        const ETIQ = { sodio: "Sodio", potasio: "Potasio", fibra: "Fibra", saturadas: "Grasas saturadas", calcio: "Calcio", vitaminaD: "Vitamina D", hierro: "Hierro", acidoFolico: "Ácido fólico", omega3: "Omega-3" };
        const objetivos = Object.entries(d.objetivosSalud).map(([k, v]) => `<li><b>${ETIQ[k] ?? k}:</b> ${esc(typeof v === "number" ? `${v} g/día` : v)}</li>`).join("");
        const dia = tipo === "entreno" ? d.diaEntreno : d.diaDescanso;
        const nombresEntreno = (rutina.diasSemana ?? []).map((i) => DIAS_SEMANA[i]);
        const menus = menusSemanales(p, { diasEntreno: rutina.diasSemana ?? [], comidas, peso, condiciones: (rutina.condiciones ?? []).map((c) => c.id) });
        const semanaHoy = menuDeLaSemana(fechaActual());
        const tipoHoy = (rutina.diasSemana ?? []).includes(hoy) ? "entreno" : "descanso";
        const diaHoy = tipoHoy === "entreno" ? d.diaEntreno : d.diaDescanso;
        const sesionHoy = (rutina.sesiones ?? []).find((x) => x.diaSemana === hoy);
        $("#contenido").innerHTML = `
          <div class="card hoy-toca">
            <p class="hoy-fecha">${esHoy() ? "Hoy" : "El"} ${esc(fechaLarga(fechaActual()))}</p>
            <p class="hoy-titulo">${tipoHoy === "entreno" ? "Día de entreno" : "Día de descanso"}</p>
            <p class="hoy-sub"><b>${fmt(diaHoy.kcal)} kcal</b> · P ${diaHoy.proteina} g · H ${diaHoy.hidratos} g · G ${diaHoy.grasa} g${sesionHoy ? ` <span class="note">(${esc(sesionHoy.nombre)})</span>` : ""}</p>
            <ul class="hoy-lista">${diaHoy.comidas.map((c) => `<li><span><small>${esc(c.nombre)}</small>${esc(c.plato)}</span><span class="kc">${fmt(c.kcal)} kcal</span></li>`).join("")}</ul>
            ${tipo !== tipoHoy ? `<button class="btn secondary" type="button" id="ver-hoy" style="margin-top:12px">Ver las cantidades de ${esHoy() ? "hoy" : "ese día"}</button>` : `<a class="btn secondary" href="#menu" style="margin-top:12px">Ver cantidades y preparación ↓</a>`}
          </div>

          <div class="card">
            <span class="tag l2" style="font-size:.85rem">Objetivo: ${esc(perfil.objetivo.nombre)}</span>
            <div class="kpis">
              <div class="kpi destacado"><span>Calorías al día (media)</span><b>${fmt(d.kcal)} kcal</b><small>${p.diferencia === 0 ? "mantenimiento" : `${p.diferencia > 0 ? "+" : ""}${fmt(p.diferencia)} vs mantenimiento`}</small></div>
              <div class="kpi"><span>Proteína</span><b>${d.macros.proteina} g</b><small>unos ${d.proteinaPorComida} g en cada comida</small></div>
              <div class="kpi"><span>Agua</span><b>${fmt(d.agua, 1)} L/día</b><small>más en días de entreno</small></div>
              <div class="kpi"><span>Fibra</span><b>${d.fibra} g/día</b><small>verdura, fruta, legumbre e integrales</small></div>
            </div>
          </div>

          <div class="card" id="menu" style="scroll-margin-top:130px">
            <button type="button" class="plegar" id="plegar-menu" aria-expanded="${!plegado}"><h2>Tu día de comidas</h2><span class="flecha-pl" aria-hidden="true">▾</span></button>
            <div class="plegable"${plegado ? " hidden" : ""}>
            <div class="selector" role="group" aria-label="Tipo de día">
              <button type="button" data-tipo="entreno" aria-pressed="${tipo === "entreno"}">Día de entreno</button>
              <button type="button" data-tipo="descanso" aria-pressed="${tipo === "descanso"}">Día de descanso</button>
            </div>
            <p class="note" style="margin:8px 0 0">${d.ciclado ? `Los días de fuerza (${esc(nombresEntreno.join(", "))}) llevan más hidratos y los de descanso menos; la proteína es la misma todos los días y la media semanal cuadra con tu plan.` : d.cambios.length && (rutina.diasSemana ?? []).length ? "Por tu salud, los hidratos se reparten igual todos los días, entrenes o no." : "Todos los días comes lo mismo: tu plan no tiene días de fuerza definidos."}</p>
            ${htmlLeyenda(dia)}
            <label class="note" style="display:block;margin-top:12px">Comidas al día <select id="comidas"><option value="4" ${d.comidas === 4 ? "selected" : ""} ${d.comidas === 5 && comidas === 4 ? "disabled" : ""}>4 comidas</option><option value="5" ${d.comidas === 5 ? "selected" : ""}>5 comidas</option></select></label>
            ${d.comidas !== comidas ? `<p class="note" style="margin:4px 0 0">Por tu salud te recomendamos 5 comidas al día.</p>` : ""}
            ${dia.comidas.map((c) => htmlComida(c, true)).join("")}
            <p class="note" style="margin:10px 0 0">Cada comida tiene varias opciones sencillas y baratas: elige la que te apetezca o deja «Variar cada día» y el menú irá cambiando solo. Las cantidades se recalculan para que cuadren con tus macros.</p>
            </div>
          </div>

          <div class="card" id="semanal" style="scroll-margin-top:130px">
            <h2 style="margin:0 0 6px">Menú semanal</h2>
            <p class="note" style="margin:0 0 10px">Dos menús fijos que se alternan: una semana el 1 y la siguiente el 2. ${esHoy() ? "Esta semana" : "Esa semana"} toca el <b>menú ${semanaHoy + 1}</b>. Toca un menú para ver sus días y un día para ver sus comidas.</p>
            ${menus.map((sem, m) => `<div class="menu-sem${menuAbierto === m ? " abierto" : ""}">
              <button type="button" class="menu-sem-btn" data-menu="${m}" aria-expanded="${menuAbierto === m}">
                <span>Menú semana ${m + 1}${m === semanaHoy ? ` <span class="tag l2">${esHoy() ? "esta semana" : "esa semana"}</span>` : ""}</span><span class="flecha-pl" aria-hidden="true">▾</span></button>
              ${menuAbierto === m ? `<div class="dias-sem" role="group" aria-label="Días del menú ${m + 1}">
                ${sem.map((x) => `<button type="button" class="dia-sem ${x.tipo}${m === semanaHoy && x.dia === hoy ? " hoy" : ""}" data-dia="${x.dia}" aria-pressed="${diaAbierto === x.dia}">
                  <b>${CORTO[x.dia]}</b><small class="largo">${x.tipo === "entreno" ? "Entreno" : "Descanso"}</small><small class="corto">${x.tipo === "entreno" ? "Gym" : "Desc."}</small></button>`).join("")}
              </div>
              ${diaAbierto !== null ? `<div class="dia-detalle">
                <h3 style="margin:4px 0 6px">${esc(DIAS_SEMANA[diaAbierto])} · ${sem[diaAbierto].tipo === "entreno" ? "día de entreno" : "día de descanso"}</h3>
                ${htmlLeyenda(sem[diaAbierto])}
                ${sem[diaAbierto].comidas.map((c) => htmlComida(c, false)).join("")}
              </div>` : `<p class="note" style="margin:8px 0 0">Elige un día.</p>`}` : ""}
            </div>`).join("")}
          </div>

          ${tipo === "entreno" ? `<div class="card"><h2 style="margin:0 0 6px">Alrededor del entreno</h2>
            <div class="info"><p><b>Antes:</b> ${esc(d.entrenamiento.antes)}</p><p><b>Después:</b> ${esc(d.entrenamiento.despues)}</p></div></div>` : ""}

          ${d.salud.length || d.cambios.length ? `<div class="card"><h2 style="margin:0 0 6px">Ajustada a tu salud</h2>
            ${d.cambios.length ? `<div class="info">${d.cambios.map((c) => `<p>${esc(c)}</p>`).join("")}<p class="note" style="margin-top:6px">Sin tus condiciones serían ${fmt(d.base.kcal)} kcal · P ${d.base.macros.proteina} g · H ${d.base.macros.hidratos} g · G ${d.base.macros.grasa} g.</p></div>` : ""}
            ${objetivos ? `<ul style="margin:10px 0 0;padding-left:18px">${objetivos}</ul>` : ""}
            ${d.salud.map((s) => `<p class="aviso">${esc(s.texto)}</p>`).join("")}</div>` : ""}

          <div class="card"><h2 style="margin:0 0 6px">Comer bien sin gastar mucho</h2><ul style="margin:0;padding-left:18px">${d.ahorro.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>

          <div class="card"><h2 style="margin:0 0 6px">Consejos</h2><ul style="margin:0;padding-left:18px">${d.consejos.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
            <p class="note" style="margin:10px 0 0">Estimaciones a partir de tu evaluación. No sustituyen el consejo de un médico o nutricionista.</p></div>`;

        $("#ver-hoy")?.addEventListener("click", () => { elegirHoy(); pintar(); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); });
        document.querySelectorAll("[data-tipo]").forEach((b) => b.addEventListener("click", () => { tipo = b.dataset.tipo; pintar(); }));
        document.querySelectorAll("[data-comida]").forEach((sel) => sel.addEventListener("change", () => {
          if (sel.value) eleccion[sel.dataset.comida] = sel.value; else delete eleccion[sel.dataset.comida];
          escribir("sportfy.dieta.opciones", eleccion); pintar();
        }));
        $("#plegar-menu").addEventListener("click", () => { plegado = !plegado; escribir("sportfy.dieta.plegado", plegado); pintar(); });
        document.querySelectorAll("[data-menu]").forEach((b) => b.addEventListener("click", () => {
          const m = Number(b.dataset.menu); menuAbierto = menuAbierto === m ? null : m;
          diaAbierto = menuAbierto === null ? null : (menuAbierto === semanaHoy ? hoy : 0); pintar();
        }));
        document.querySelectorAll("[data-dia]").forEach((b) => b.addEventListener("click", () => {
          const d = Number(b.dataset.dia); diaAbierto = diaAbierto === d ? null : d; pintar();
        }));
        document.querySelectorAll("[data-foto]").forEach((b) => b.addEventListener("click", () => verFoto(b)));
        $("#comidas").addEventListener("change", (e) => { comidas = Number(e.target.value); escribir("sportfy.dieta.comidas", comidas); pintar(); });
      }
      // Foto del plato: pequeña junto a las kcal. En pantallas anchas se abre en grande encima;
      // en el móvil (vertical) va debajo del texto y al tocarla crece un poco en su sitio.
      let FOTOS = {};
      fetch("shared/comidas/fotos.json?v=202611150010").then((r) => r.json()).then((f) => { FOTOS = f; }).catch(() => {});
      const movil = () => matchMedia("(max-width: 640px), (orientation: portrait) and (max-width: 900px)").matches;
      function verFoto(b) {
        if (movil()) { const img = b.querySelector("img"); if (b.classList.toggle("abierta")) img.src = `shared/comidas/${b.dataset.foto}-grande.jpg`; return; }
        const id = b.dataset.foto, cr = FOTOS[id];
        const capa = document.createElement("div");
        capa.className = "foto-grande no-deslizar";
        capa.innerHTML = `<figure><img src="shared/comidas/${esc(id)}-grande.jpg" alt="${esc(b.getAttribute("aria-label").replace(/^Ver foto: /, ""))}">
          ${cr ? `<figcaption>Foto: ${esc(cr.autor)} · ${esc(cr.fuente)}</figcaption>` : ""}</figure>`;
        const cerrar = () => { capa.remove(); removeEventListener("keydown", esc_); };
        const esc_ = (e) => { if (e.key === "Escape") cerrar(); };
        capa.addEventListener("click", cerrar);
        addEventListener("keydown", esc_);
        document.body.append(capa);
      }
      pintar();
    }
}
