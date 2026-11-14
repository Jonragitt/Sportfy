// Código de la pestaña rutina.html (shared/pestanas.js lo vuelve a montar al volver a ella sin recargar).
import { sincronizar, evaluaciones, rondaEnCurso } from "../evaluaciones.js?v=202611130100";
import { marcarRacha, fichaActual, deIso, iso, FLECHA } from "../racha.js?v=202611142300";
import { fechaActual, diaSemana, fechaLarga, esHoy } from "../reloj.js?v=202611130400";
import { semanaDelCiclo, MATERIAL, SEMANAS, FOCOS, DIAS_SEMANA } from "../rutina.js?v=202611130440";
import { calcularTodo, leerPreferencias, guardarPreferencias, necesitaPreferencias } from "../motor.js?v=202611130440";

export function montar() {

    const $ = (s) => document.querySelector(s);
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
    const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

    sincronizar();
    if (necesitaPreferencias()) location.replace("preferencias.html");
    const apartados = evaluaciones();
    // La rutina solo se abre con las dos evaluaciones completadas y confirmadas.
    if (!apartados.length) {
      $("#intro").textContent = "Tu rutina se abrirá cuando completes y confirmes las dos evaluaciones.";
      $("#contenido").innerHTML = `<div class="card empty"><p>Necesitamos tu evaluación antropométrica y tu evaluación postural, las dos confirmadas con el tick verde, para diseñar tu rutina.</p>
        <a class="btn" href="index.html">Ir a las evaluaciones</a></div>`;
      document.querySelector(".tabs").innerHTML = `<a href="index.html">Inicio</a><a href="perfil.html">Perfil</a>`;
      document.querySelector(".esquina.menu").href = "index.html";
    } else {
      const actividad = leer("sportfy.actividad", "ligera");
      let prefs = { minutos: 60, material: "gimnasio", ...leerPreferencias() };
      // El reloj marca el día: según él tocan la semana del ciclo y la sesión (o el descanso).
      const inicio = calcularTodo({ apartados, prefs, actividad }).perfil.fecha;
      let auto, semana, dia, reposo = null; // reposo: día de la semana (0 = lunes) elegido sin sesión
      const elegirHoy = () => {
        const f = fechaActual();
        auto = semanaDelCiclo(inicio, f); semana = auto;
        const sHoy = calcularTodo({ apartados, prefs, actividad, semana }).rutina.sesiones.find((x) => x.diaSemana === diaSemana(f));
        dia = sHoy ? sHoy.dia : (dia ?? 1);
        const conDias = calcularTodo({ apartados, prefs, actividad, semana }).rutina.diasSemana.length;
        reposo = !sHoy && conDias ? diaSemana(f) : null;
      };
      elegirHoy();
      addEventListener("forty5:fecha", () => { elegirHoy(); pintar(); });
      const hechos = () => leer("sportfy.sesionesHechas", {});
      const claveSemana = () => { const d = fechaActual(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

      // Tarjeta grande con lo que toca el día que marca el reloj.
      function tarjetaHoy(r, hechosSemana) {
        const f = fechaActual(), ds = diaSemana(f);
        const rHoy = semana === auto ? r : calcularTodo({ apartados, prefs, actividad, semana: auto }).rutina;
        const sHoy = rHoy.sesiones.find((x) => x.diaSemana === ds);
        const cuando = `${esHoy() ? "Hoy" : "El"} ${fechaLarga(f)} · Semana ${auto} · ${rHoy.semana.nombre}`;
        if (!rHoy.diasSemana.length) return `<div class="card hoy-toca"><p class="hoy-fecha">${esc(cuando)}</p>
          <p class="hoy-titulo">Elige tus días</p><p class="hoy-sub">Para saber qué sesión toca cada día, marca en qué días entrenas.</p><a class="btn" href="preferencias.html">Elegir días</a></div>`;
        if (sHoy) {
          const hecha = hechosSemana.includes(sHoy.dia);
          return `<div class="card hoy-toca"><p class="hoy-fecha">${esc(cuando)}</p>
            <p class="hoy-titulo">${esc(sHoy.nombre)}</p>
            <p class="hoy-sub">${sHoy.bloques.length} ejercicios · ≈ ${sHoy.minutos} min${hecha ? " · <b>✓ hecha</b>" : ""}</p>
            ${dia === sHoy.dia && semana === auto && reposo == null ? `<a class="btn" href="#sesion">Ver la sesión ↓</a>` : `<button class="btn" type="button" id="ir-hoy">Ver la sesión de ${esHoy() ? "hoy" : "ese día"}</button>`}</div>`;
        }
        const cardio = rHoy.cardioExtra?.diasSemana?.includes(ds);
        return `<div class="card hoy-toca"><p class="hoy-fecha">${esc(cuando)}</p>
          <p class="hoy-titulo">${cardio ? "Cardio" : "Descanso"}</p>
          <p class="hoy-sub">${cardio ? esc(rHoy.cardioExtra.tipo) + "." : esc(rHoy.recuperacionActiva ?? "Sin pesas: descansa, camina y duerme bien para recuperar.")}</p>
          ${rHoy.cardioExtra?.pasos ? `<p class="note" style="margin:0">Y ${esc(rHoy.cardioExtra.pasos)}.</p>` : ""}</div>`;
      }

      function pintar() {
        const r = calcularTodo({ apartados, prefs, actividad, semana, guardar: true }).rutina;
        const hechosSemana = hechos()[claveSemana()] ?? [];
        const s = r.sesiones[Math.min(dia, r.sesiones.length) - 1];
        const opt = (obj, val, txt) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${String(k) === String(val) ? "selected" : ""}>${esc(txt(k, v))}</option>`).join("");
        const html = [];
        html.push(tarjetaHoy(r, hechosSemana));
        if (rondaEnCurso()) html.push(`<div class="card" style="border-color:var(--accent)"><b>Tienes una nueva evaluación en curso.</b> <span class="note">Tu rutina se recalculará cuando confirmes las dos evaluaciones.</span> <a href="index.html">Continuar →</a></div>`);
        html.push(`<div class="card">
          <div class="prefs">
            <label>Tiempo por sesión<select id="p-min">${opt({ 45: 0, 60: 0, 75: 0, 90: 0 }, prefs.minutos, (k) => `${k} min`)}</select></label>
            <label>Dónde entrenas<select id="p-mat">${opt(MATERIAL, prefs.material, (k, v) => v.nombre)}</select></label>
          </div>
          <div class="resumen">
            <span class="tag l2">${esc(r.objetivo?.nombre)}</span>
            <span class="tag l1">Nivel ${esc(r.nivel)}</span>
            <span class="tag l1">${esc(r.reparto.nombre)}</span>
            ${r.ladoDebil ? `<span class="tag l0">Lado débil: ${r.ladoDebil === "I" ? "izquierdo" : "derecho"}</span>` : ""}
            ${r.focos.map((f) => `<span class="tag l2">Prioridad: ${esc(FOCOS[f].nombre.toLowerCase())}</span>`).join("")}
          </div>
          <p class="note" style="margin:8px 0 0">${r.sesiones.map((x) => `<b>${esc(x.diaNombre ?? `Día ${x.dia}`)}</b>`).join(", ")} · <a href="preferencias.html">Cambiar días, zonas o salud</a></p>
          ${r.consejos.map((c) => `<p class="aviso">${esc(c)}</p>`).join("")}
          ${r.condiciones.length ? `<p class="aviso"><b>Adaptada a tu salud:</b> ${r.condiciones.map((c) => `${esc(c.nombre)}${c.medico ? " (consulta médica previa)" : ""}`).join(", ")}.</p>` : ""}
          <div class="semanas" role="group" aria-label="Semana del ciclo">${SEMANAS.map((w) => `<button type="button" data-semana="${w.n}" aria-pressed="${w.n === semana}">Sem. ${w.n}${w.n === auto ? " · hoy" : ""}<small>${esc(w.nombre)}</small></button>`).join("")}</div>
          <p class="note" style="margin:8px 0 0">${esc(r.semana.nota)}</p>
        </div>`);

        // Los 7 días de la semana: los de pesas abren su sesión y los de reposo dicen qué toca.
        const porDia = new Map(r.sesiones.filter((x) => x.diaSemana != null).map((x) => [x.diaSemana, x]));
        const hoyDs = diaSemana(fechaActual());
        if (r.diasSemana.length) html.push(`<div class="dias semana7" role="group" aria-label="Día">${DIAS_SEMANA.map((nombre, d) => {
          const x = porDia.get(d);
          const marcado = x ? reposo == null && x.dia === s.dia : reposo === d;
          return `<button type="button" ${x ? `data-dia="${x.dia}"` : `data-reposo="${d}" class="reposo"`} aria-pressed="${marcado}" ${x && hechosSemana.includes(x.dia) ? `class="hecho"` : ""}>${esc(nombre.slice(0, 3))}${d === hoyDs ? " · hoy" : ""}<small>${x ? esc(x.nombre) : r.cardioExtra?.diasSemana?.includes(d) ? "Cardio" : "Reposo"}</small></button>`;
        }).join("")}</div>`);
        else html.push(`<div class="dias" role="group" aria-label="Día">${r.sesiones.map((x) => `<button type="button" data-dia="${x.dia}" aria-pressed="${x.dia === s.dia}" class="${hechosSemana.includes(x.dia) ? "hecho" : ""}">${esc(x.diaNombre ?? `Día ${x.dia}`)}</button>`).join("")}</div>`);

        let n = 0;
        const ejercicios = s.bloques.map((b, i) => {
          const ss = b.superserieDe;
          if (!ss) n++;
          return `<div class="ej">
            <span class="num ${ss ? "ss" : ""}" title="${ss ? "Superserie con el anterior" : ""}">${ss ? `${n}b` : b.superserie ? `${n}a` : n}</span>
            <div>
              <h4>${esc(b.nombre)}</h4>
              <div class="pauta"><span><b>${b.series} × ${esc(b.reps)}</b></span>${b.rir != null ? `<span>RIR ${b.rir}</span>` : ""}<span>Descanso ${esc(ss ? "al terminar el par" : b.descanso)}</span>${b.superserie ? `<span class="note">Superserie con el siguiente</span>` : ""}</div>
              <p class="note">${esc(b.tecnica)}</p>
              ${b.motivo ? `<p class="por-que">${esc(b.motivo)}</p>` : ""}
              ${b.lado ? `<p class="lado">${esc(b.lado)}</p>` : ""}
            </div></div>`;
        }).join("");

        if (reposo != null) {
          const cardio = r.cardioExtra?.diasSemana?.includes(reposo);
          html.push(`<div class="card" id="sesion" style="scroll-margin-top:130px">
            <h2 style="margin:0">${esc(DIAS_SEMANA[reposo])} · ${cardio ? "Cardio" : "Reposo"}</h2>
            <p style="margin:8px 0 0">${cardio ? `No hay pesas. Toca cardio: ${esc(r.cardioExtra.tipo)}.` : "No hay nada que hacer en el gimnasio: descansar también es parte del plan, porque es cuando el músculo se recupera y crece."}</p>
            ${r.recuperacionActiva ? `<p class="note" style="margin:8px 0 0"><b>Si te apetece moverte:</b> ${esc(r.recuperacionActiva)}</p>` : ""}
            ${r.cardioExtra?.pasos ? `<p class="note" style="margin:6px 0 0">Y como cada día, ${esc(r.cardioExtra.pasos)}.</p>` : ""}
          </div>`);
        } else
        html.push(`<div class="card" id="sesion" style="scroll-margin-top:130px">
          <div class="row" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline"><h2 style="margin:0">${esc(s.diaNombre ?? `Día ${s.dia}`)} · ${esc(s.nombre)}</h2><span class="note">≈ ${s.minutos} min</span></div>
          <div class="bloque-titulo">Calentamiento</div>
          <ul class="lista"><li>${esc(s.calentamiento.general)}</li>${s.calentamiento.movilidad.map((m) => `<li>${esc(m)} · 1 min</li>`).join("")}</ul>
          ${s.activacion.length ? `<div class="bloque-titulo">Activación correctiva</div><ul class="lista">${s.activacion.map((a) => `<li>${esc(a.nombre)} · ${a.series} × ${esc(a.reps)} <span class="note">(${esc(a.motivo)})</span></li>`).join("")}</ul>` : ""}
          <p class="note" style="margin:6px 0 0">${esc(s.calentamiento.aproximacion)}</p>
          <div class="bloque-titulo">Entrenamiento</div>
          ${ejercicios}
          ${s.cardio ? `<div class="bloque-titulo">Final</div><p style="margin:0">${esc(s.cardio)}</p>` : ""}
          ${s.recortados.length ? `<p class="aviso">Para que quepa en ${prefs.minutos} min se han quitado: ${esc(s.recortados.join(", "))}. Si tienes más tiempo, súbelo arriba.</p>` : ""}
          <button class="btn ${hechosSemana.includes(s.dia) ? "secondary" : ""} hecho-btn" type="button" id="hecho">${hechosSemana.includes(s.dia) ? "✓ Sesión completada esta semana" : "Marcar sesión como hecha"}</button>
        </div>`);

        if (r.cardioExtra) html.push(`<div class="card"><h3>Cardio en los días sin pesas</h3><p style="margin:4px 0 0">${r.cardioExtra.diasNombre?.length ? `<b>${esc(r.cardioExtra.diasNombre.join(" y "))}</b>: ` : `${r.cardioExtra.dias} ${r.cardioExtra.dias === 1 ? "día" : "días"} a la semana: `}${esc(r.cardioExtra.tipo)}.${r.cardioExtra.pasos ? ` Y cada día, ${esc(r.cardioExtra.pasos)}.` : ""}</p></div>`);
        if (r.recuperacionActiva) html.push(`<div class="card"><h3>Recuperación activa</h3><p style="margin:4px 0 0">${esc(r.recuperacionActiva)}</p></div>`);
        if (r.condiciones.length) html.push(`<div class="card"><h3>Tu salud</h3>${r.condiciones.map((c) => `<p class="aviso"><b>${esc(c.nombre)}:</b> ${esc(c.aviso)}</p>`).join("")}<p class="note" style="margin:8px 0 0">Los ejercicios con riesgo para tu condición se han sustituido automáticamente.</p></div>`);

        const NOM = { piernas: "Piernas", gluteo: "Glúteo", isquios: "Isquios", pecho: "Pecho", espalda: "Espalda", hombro: "Hombro", brazos: "Brazos", core: "Core", gemelo: "Gemelo" };
        html.push(`<div class="card"><h3>Cómo progresar</h3><p style="margin:4px 0 0">${esc(r.progresion)}</p>
          <p class="note" style="margin:8px 0 0"><b>RIR</b> = repeticiones que te quedan en recámara al terminar la serie. RIR 2 = podrías hacer 2 más con buena técnica.</p>
          <div class="bloque-titulo">Series a la semana por grupo</div>
          <div class="vol">${Object.entries(r.volumen).sort((a, b) => b[1] - a[1]).map(([g, v]) => `<div>${esc(NOM[g] ?? g)}<b>${v}</b></div>`).join("")}</div>
          ${r.precauciones.length ? `<p class="aviso"><b>Precauciones por tu postura:</b> ${r.precauciones.map(esc).join(" ")}</p>` : ""}
        </div>`);

        $("#contenido").innerHTML = html.join("");
        const on = (sel, ev, f) => document.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, f));
        const guardar = () => { prefs = guardarPreferencias({ minutos: prefs.minutos, material: prefs.material }); pintar(); };
        on("#p-min", "change", (e) => { prefs.minutos = Number(e.target.value); guardar(); });
        on("#p-mat", "change", (e) => { prefs.material = e.target.value; guardar(); });
        on("#ir-hoy", "click", () => { elegirHoy(); pintar(); document.getElementById("sesion")?.scrollIntoView({ behavior: "smooth" }); });
        on("[data-semana]", "click", (e) => { semana = Number(e.currentTarget.dataset.semana); pintar(); });
        on("[data-dia]", "click", (e) => { dia = Number(e.currentTarget.dataset.dia); reposo = null; pintar(); });
        on("[data-reposo]", "click", (e) => { reposo = Number(e.currentTarget.dataset.reposo); pintar(); });
        on("#hecho", "click", () => {
          const h = hechos(), k = claveSemana(), lista = new Set(h[k] ?? []);
          lista.has(s.dia) ? lista.delete(s.dia) : lista.add(s.dia);
          h[k] = [...lista];
          escribir("sportfy.sesionesHechas", h);
          // La racha solo se suma al terminar el entrenamiento guiado (arriba).
          if (lista.has(s.dia) && dia < r.sesiones.length) dia++;
          pintar();
        });
      }
      pintar();

      // Entrenamiento guiado: un ejercicio cada vez, «Siguiente» hasta «Terminado», que suma la
      // racha del día. El motor de racha (fichaActual) decide qué sesión sale y en qué estado:
      // pendiente (naranja, hasta las 22:00), hecha, o fallada (roja; con «Recuperado» si detrás
      // viene cardio o reposo). A las 9:00 la ficha pasa al día siguiente.
      const GUIA = "sportfy.guiado";
      let celebrando = false;
      // Vídeos libres por ejercicio (shared/videos/videos.json): pequeño a la derecha, ampliable.
      let VIDEOS = {};
      fetch("shared/videos/videos.json?v=202611142300").then((x) => x.json()).then((v) => { VIDEOS = v; pintarGuia(); }).catch(() => {});
      const videoDe = (b) => {
        const v = VIDEOS[b.id];
        if (!v) return "";
        const cred = `${v.fuente} · ${v.licencia}${v.autor ? " · " + v.autor : ""}`;
        return `<figure class="guia-video"><video src="shared/videos/${esc(v.archivo)}" data-grande="shared/videos/${esc(v.grande)}" muted loop playsinline autoplay disablepictureinpicture disableremoteplayback preload="auto" aria-label="Vídeo de ${esc(b.nombre)}"></video>
          <button type="button" class="guia-video-ampliar" aria-label="Ampliar vídeo" data-ampliar>⤢</button>
          <figcaption title="${esc(v.titulo)}"><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(cred)}</a></figcaption></figure>`;
      };
      // Ningún modo de pararlo: sin controles, sin menú del navegador y, si algo lo pausa
      // (pestaña en segundo plano, ahorro de batería…), vuelve a arrancar solo.
      function sinParar(v) {
        const seguir = () => { if (v.isConnected && v.paused) v.play?.().catch(() => {}); };
        seguir();
        ["pause", "ended", "suspend", "stalled"].forEach((ev) => v.addEventListener(ev, seguir));
        v.addEventListener("contextmenu", (e) => e.preventDefault());
        document.addEventListener("visibilitychange", seguir);
      }
      function ampliarVideo(fig) {
        const v = fig.querySelector("video"), cap = fig.querySelector("figcaption").innerHTML;
        const capa = document.createElement("div");
        capa.className = "video-grande no-deslizar";
        capa.innerHTML = `<div class="video-grande-caja"><video src="${v.dataset.grande}" autoplay loop playsinline muted disablepictureinpicture></video>
          <p>${cap}</p><button type="button" class="btn" data-cerrar>Cerrar</button></div>`;
        const cerrar = () => capa.remove();
        capa.addEventListener("click", (e) => { if (e.target === capa || e.target.closest("[data-cerrar]")) cerrar(); });
        addEventListener("keydown", function esc(e) { if (e.key === "Escape") { cerrar(); removeEventListener("keydown", esc); } });
        document.body.append(capa);
        sinParar(capa.querySelector("video"));
      }
      const horaPlazo = (d) => `${String(d.getHours()).padStart(2, "0")}:00`;
      function pintarGuia(anim = false) {
        if (celebrando) return;
        const caja = $("#guia");
        const g = fichaActual(leer("sportfy.racha", null), prefs.diasSemana ?? []);
        if (!g) { caja.innerHTML = ""; return; }
        if (g.estado === "hecha" || g.estado === "recuperada") {
          caja.innerHTML = `<div class="card guia guia-hecha ${g.estado === "recuperada" ? "guia-recuperada" : ""}"><div class="guia-llama">${g.estado === "hecha" ? "🔥" : FLECHA}</div><p class="guia-nombre" style="font-size:1.25rem">${g.estado === "hecha" ? "Racha del día hecha" : "Sesión recuperada"}</p><p>Buen trabajo. A las 9:00 del próximo día de gym te esperará aquí el primer ejercicio.</p></div>`;
          return;
        }
        const f = deIso(g.dia), fallada = g.estado === "fallada";
        const r = calcularTodo({ apartados, prefs, actividad, semana: semanaDelCiclo(inicio, f) }).rutina;
        const ses = r.sesiones.find((x) => x.diaSemana === diaSemana(f));
        if (!ses?.bloques.length) { caja.innerHTML = ""; return; }
        const total = ses.bloques.length;
        const est = leer(GUIA, {});
        const paso = est.dia === g.dia ? Math.min(Math.max(0, est.paso ?? 0), total - 1) : 0;
        const b = ses.bloques[paso], ultimo = paso === total - 1;
        const esHoyG = g.dia === iso(new Date());
        const plazo = !fallada ? `Tienes hasta las ${horaPlazo(g.plazo)} de ${esHoyG ? "hoy" : "ese día"} para terminarla o perderás la racha.`
          : g.puedeRecuperar ? "Has perdido la racha, pero puedes recuperar la sesión: hazla y pulsa «Recuperado»."
          : "Has perdido la racha. A las 9:00 la ficha pasa a la sesión siguiente.";
        const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
        const titulo = fallada ? `Fallada · ${DIAS[diaSemana(f)]}` : esHoyG ? "Entrenamiento de hoy" : `Sesión del ${DIAS[diaSemana(f)]}`;
        caja.innerHTML = `<div class="card guia ${fallada ? "guia-fallada" : ""}">
          <div class="guia-cab"><span>${esc(titulo)} · ${esc(ses.nombre)}</span><span>${paso + 1} / ${total}</span></div>
          <div class="guia-barra" aria-hidden="true">${ses.bloques.map((_, i) => `<i class="${i <= paso ? "ya" : ""}"></i>`).join("")}</div>
          <div class="guia-cuerpo ${anim ? "guia-anim" : ""}">
            ${videoDe(b)}
            <p class="guia-nombre">${esc(b.nombre)}</p>
            <div class="guia-pauta"><span class="grande">${b.series} × ${esc(b.reps)}</span>${b.rir != null ? `<span>RIR ${b.rir}</span>` : ""}<span>Descanso ${esc(b.superserieDe ? "al terminar el par" : b.descanso)}</span></div>
            ${b.superserie ? `<p><b>Superserie:</b> hazlo seguido del siguiente ejercicio.</p>` : ""}
            ${b.tecnica ? `<p>${esc(b.tecnica)}</p>` : ""}
            ${b.lado ? `<p class="lado">${esc(b.lado)}</p>` : ""}
            ${paso === 0 ? `<p class="guia-plazo">Antes de empezar, calienta: ${esc(ses.calentamiento.general)}</p>` : ""}
          </div>
          <div class="guia-btns ${g.puedeRecuperar ? "con-rec" : ""}">${paso > 0 ? `<button class="btn secondary" type="button" id="guia-atras" aria-label="Ejercicio anterior">‹</button>` : "<span></span>"}
            ${g.puedeRecuperar ? `<button class="btn rec" type="button" id="guia-rec">${FLECHA} Recuperado</button>` : ""}
            <button class="btn" type="button" id="guia-sig">${ultimo ? (g.puedeRecuperar ? "Terminado · recuperar" : fallada ? "Terminado" : "Terminado ✓") : "Siguiente ›"}</button></div>
          <p class="guia-plazo">${plazo}</p>
        </div>`;
        // En bucle como un GIF: no se para hasta pasar al siguiente ejercicio (si el navegador lo
        // pausa, por ejemplo al volver a la pestaña, vuelve a arrancar).
        caja.querySelectorAll(".guia-video video").forEach((v) => {
          sinParar(v);
          v.addEventListener("click", () => ampliarVideo(v.closest("figure")));
        });
        caja.querySelector("[data-ampliar]")?.addEventListener("click", (e) => ampliarVideo(e.currentTarget.closest("figure")));
        const ir = (n) => { escribir(GUIA, { dia: g.dia, paso: n }); pintarGuia(true); };
        // Termina la sesión: "si" si estaba en plazo, "recuperado" si estaba fallada.
        const terminar = (valor) => {
          const lunes = new Date(f.getFullYear(), f.getMonth(), f.getDate() - diaSemana(f));
          const h = hechos(), k = iso(lunes), lista = new Set(h[k] ?? []);
          lista.add(ses.dia); h[k] = [...lista]; escribir("sportfy.sesionesHechas", h);
          try { localStorage.removeItem(GUIA); } catch { /* sin almacenamiento */ }
          marcarRacha(g.dia, valor);
          const n = Number(document.querySelector(".racha-n")?.textContent) || 1;
          celebrando = true;
          caja.innerHTML = valor === "si"
            ? `<div class="card guia guia-hecha guia-anim"><div class="guia-llama">🔥</div><p class="guia-nombre">¡Racha del día hecha!</p><p>${n} ${n === 1 ? "día" : "días"} de racha. Sesión completada.</p></div>`
            : `<div class="card guia guia-hecha guia-recuperada guia-anim"><div class="guia-llama">${FLECHA}</div><p class="guia-nombre">¡Sesión recuperada!</p><p>Queda marcada en azul en el calendario. La racha vuelve a contar desde hoy.</p></div>`;
          pintar();
          setTimeout(() => { celebrando = false; pintarGuia(); }, 3500);
        };
        $("#guia-atras")?.addEventListener("click", () => ir(paso - 1));
        $("#guia-rec")?.addEventListener("click", () => terminar("recuperado"));
        $("#guia-sig").addEventListener("click", () => {
          if (!ultimo) return ir(paso + 1);
          if (!fallada) return terminar("si");
          if (g.puedeRecuperar) return terminar("recuperado");
          ir(0);
        });
      }
      pintarGuia();
      addEventListener("forty5:racha", () => pintarGuia());
      setInterval(() => pintarGuia(), 60000); // a las 22:00 falla y a las 9:00 cambia la ficha
    }
}
