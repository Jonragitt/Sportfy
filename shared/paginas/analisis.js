// Código de la pestaña analisis.html (shared/pestanas.js lo vuelve a montar al volver a ella sin recargar).
import { analizar, perfilRutina, guardarPerfilRutina, series, comparar, evolucionPostural, proximaEvaluacion, CORRECTIVOS, correctivosPorLado } from "../analisis.js?v=202611130900";
import { ACTIVIDAD } from "../plan.js?v=202611130030";
import { sincronizar, evaluaciones, rondaEnCurso } from "../evaluaciones.js?v=202611130100";
import { calcularTodo, leerPreferencias, necesitaPreferencias } from "../motor.js?v=202611130440";

export function montar() {

    const $ = (s) => document.querySelector(s);
    const fmt = (n, d = 1) => (n == null || !Number.isFinite(n) ? "–" : Number(n).toLocaleString("es-ES", { maximumFractionDigits: d }));
    const fecha = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const fechaLarga = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const leer = (k, def = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
    const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const nivelTag = (pct) => (pct >= 70 ? 2 : pct >= 50 ? 1 : 0);

    // El plan se calcula con las evaluaciones completas (apartados del perfil).
    sincronizar();
    // Tras completar una evaluación, primero se piden días, foco y condiciones de salud.
    if (necesitaPreferencias()) location.replace("preferencias.html");
    const apartados = evaluaciones();
    const histAntro = apartados.map((e) => e.antro);
    const histPost = apartados.map((e) => e.postural);
    if (apartados.length && rondaEnCurso()) {
      $("#repeticion").innerHTML = `<div class="card" style="border-color:var(--accent)"><b>Tienes una nueva evaluación en curso.</b>
        <p class="note" style="margin:4px 0 8px">Tu plan se actualizará cuando confirmes la antropometría y la postural.</p>
        <a class="btn" style="text-decoration:none;display:inline-block" href="index.html">Continuar evaluación</a></div>`;
    }

    const a = analizar(histAntro, histPost);

    if (!a.antro && !a.postural) {
      $("#contenido").innerHTML = `<div class="card empty"><p>Tu plan aparecerá cuando completes la evaluación antropométrica y la postural y confirmes las dos con el tick verde.</p>
        <a class="btn" href="index.html">Ir a las evaluaciones</a></div>`;
    } else {
      pintar();
    }

    function delta(c, unidad = "") {
      if (!c) return "";
      if (c.delta === 0) return `<span class="delta flat">= sin cambio</span>`;
      return `<span class="delta ${c.mejora ? "up" : "down"}">${c.delta > 0 ? "▲ +" : "▼ "}${fmt(c.delta)}${unidad}</span>`;
    }

    // Gráfico de línea en SVG con escala automática (o 0..max si se indica).
    function grafico(puntos, { max, unidad = "" } = {}) {
      const W = 360, H = 160, L = 34, R = 14, T = 20, B = 24;
      const vals = puntos.map((p) => p.valor);
      let lo = max != null ? 0 : Math.min(...vals), hi = max ?? Math.max(...vals);
      if (max == null) { const pad = Math.max((hi - lo) * 0.2, Math.abs(hi) * 0.02, 0.5); lo -= pad; hi += pad; }
      const n = puntos.length;
      const x = (i) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
      const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
      let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución">`;
      for (const t of [lo, (lo + hi) / 2, hi]) s += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t, max != null ? 1 : 0)}</text>`;
      if (n > 1) s += `<polyline class="line" points="${puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ")}"/>`;
      const paso = Math.ceil(n / 4);
      puntos.forEach((p, i) => {
        s += `<circle class="dot" cx="${x(i)}" cy="${y(p.valor)}" r="4.5"><title>${fecha(p.fecha)}: ${fmt(p.valor)}${unidad}</title></circle>`;
        if (i % paso === 0 || i === n - 1) {
          s += `<text class="val" x="${x(i)}" y="${y(p.valor) - 9}" text-anchor="middle">${fmt(p.valor)}</text>`;
          s += `<text class="axis" x="${x(i)}" y="${H - 6}" text-anchor="middle">${fecha(p.fecha)}</text>`;
        }
      });
      return s + `</svg>`;
    }

    function pintar() {
      const t = a.total;
      const parcial = a.antro?.nota ?? null, post = a.postural?.nota ?? null;
      const html = [];

      // ---------- Resumen ----------
      html.push(`<div class="card hero">
        <div class="big">${fmt(t.puntos)}<small>/25</small></div>
        <div>
          ${t.etiqueta ? `<span class="tag l${nivelTag(t.puntos / 25 * 100)}">${t.etiqueta}</span>` : `<span class="tag l1">Evaluación incompleta</span>`}
          <p style="margin:8px 0 0">${t.texto ?? "Completa las dos evaluaciones para tener la nota total y un plan más preciso."}</p>
          <p class="note" style="margin:6px 0 0">Antropometría ${fmt(parcial)}/15 · Postural ${fmt(post)}/10</p>
        </div>
      </div>`);

      // ---------- Plan calculado ----------
      html.push(`<section class="sec"><h2>Tu plan calculado</h2>
        <p class="lead">Calculado con tus datos de la báscula y tus resultados. Se reajusta solo cada vez que repites la evaluación.</p>
        <div id="plan"></div></section>`);

      // ---------- Prioridades ----------
      if (a.prioridades.length) {
        html.push(`<section class="sec"><h2>Prioridades para tu rutina</h2>
          <p class="lead">Ordenadas por su impacto en tu salud y en tu forma física.</p>
          <div class="card"><ol class="prio">${a.prioridades.map((p) => `<li><div><b>${esc(p.titulo)}</b>
            <p class="note">${esc(p.motivo)}</p><p class="foco">${esc(p.foco)}</p></div></li>`).join("")}</ol></div></section>`);
      }

      // ---------- Antropometría ----------
      if (a.antro) {
        const f = a.antro.fuertes.map((p) => p.area), d = a.antro.debiles.map((p) => p.area);
        html.push(`<section class="sec"><h2>Composición corporal</h2>
          <p class="lead">Medición del ${fechaLarga(a.antro.fecha)} · ${fmt(a.antro.nota)}/15${a.antro.completa ? "" : " (faltan pruebas)"}</p>
          <div class="card"><div class="grid2">
            <div><b style="color:var(--good)">Puntos fuertes</b><p style="margin:4px 0 0">${f.length ? esc(f.join(", ")) : "Aún ninguno en nivel óptimo."}</p></div>
            <div><b style="color:var(--bad)">Puntos débiles</b><p style="margin:4px 0 0">${d.length ? esc(d.join(", ")) : "Ninguno en riesgo."}</p></div>
          </div></div>
          <div class="grid2" style="margin-top:12px">${a.antro.pruebas.map((p) => `
            <div class="card prueba p${p.puntos}">
              <div class="prueba-head"><h3>${esc(p.area)}</h3><span class="tag l${p.puntos >= 3 ? 2 : p.puntos === 2 ? 2 : p.puntos === 1 ? 1 : 0}">${p.puntos}/3 · ${esc(p.nivel)}</span></div>
              <div class="note">${esc(p.nombre)}: <b>${fmt(p.valor)} ${esc(p.unidad)}</b> · ${esc(p.categoria)}</div>
              <p>${esc(p.texto)}</p>
              ${p.puntos < 3 ? `<p class="foco"><b>Qué hacer:</b> ${esc(p.foco)}</p>` : ""}
            </div>`).join("")}</div></section>`);
      }

      // ---------- Postural ----------
      if (a.postural) {
        const pz = a.postural;
        let cuerpo;
        if (!pz.conDetalle) cuerpo = `<div class="card"><p style="margin:0">Esta evaluación se guardó sin el detalle de las alteraciones. Repite la evaluación postural para ver el análisis completo.</p></div>`;
        else if (pz.sinAlteraciones) cuerpo = `<div class="card"><p style="margin:0">No se marcó ninguna alteración: postura excelente. Mantén el trabajo de movilidad en tus calentamientos.</p></div>`;
        else cuerpo = pz.patrones.map((p) => {
          const c = CORRECTIVOS[p.id] || {};
          const notasLado = correctivosPorLado(p.items.map((i) => i.id)).notas;
          const lado = notasLado.length ? notasLado.map((n) => `<p class="note" style="margin:6px 0 0">${esc(n)}</p>`).join("")
            : p.unLado.length ? `<p class="note" style="margin:6px 0 0">Más marcado en el lado ${[...new Set(p.unLado)].map((l) => (l === "I" ? "izquierdo" : "derecho")).join(" y ")}: empieza los ejercicios unilaterales por ese lado.</p>` : "";
          return `<div class="card">
            <div class="prueba-head"><h3>${esc(p.nombre)}</h3><span class="tag l${p.items.length >= 3 ? 0 : 1}">${p.items.length} ${p.items.length === 1 ? "alteración" : "alteraciones"}</span></div>
            <ul class="chips">${p.items.map((i) => `<li class="tag l1">${esc(i.nombre)}</li>`).join("")}</ul>
            <p style="margin:10px 0 0">${esc(p.texto)}</p>${lado}
            <div class="ejercicios">
              <div><h4>Fortalecer</h4><ul>${(c.fortalecer || []).map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>
              <div><h4>Movilizar / estirar</h4><ul>${(c.movilizar || []).map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>
            </div>
            ${c.precaucion ? `<p class="precaucion"><b>En el gimnasio:</b> ${esc(c.precaucion)}</p>` : ""}
          </div>`;
        }).join("");
        html.push(`<section class="sec"><h2>Postura y movimiento</h2>
          <p class="lead">Evaluación del ${fechaLarga(pz.fecha)} · ${fmt(pz.nota)}/10${pz.numDesviaciones ? ` · ${pz.numDesviaciones} alteraciones agrupadas en ${pz.patrones.length} ${pz.patrones.length === 1 ? "patrón" : "patrones"}` : ""}</p>
          <div class="grid2">${cuerpo}</div></section>`);
      }

      // ---------- Evolución ----------
      const s = series(histAntro, histPost);
      const graf = [
        ["Nota antropométrica", s.antro, { max: 15, unidad: "/15" }, false, ""],
        ["Nota postural", s.postural, { max: 10, unidad: "/10" }, false, ""],
        ["Peso", s.peso, { unidad: " kg" }, true, " kg"],
        ["% graso", s.grasa, { unidad: " %" }, true, " %"],
        ["Grasa visceral", s.visceral, { unidad: "" }, true, ""],
        ["% muscular", s.muscular, { unidad: " %" }, false, " %"],
      ].filter(([, serie]) => serie.length);
      const hayEvol = graf.some(([, serie]) => serie.length > 1);
      const evP = evolucionPostural(histPost);
      const prox = proximaEvaluacion(histAntro, histPost);
      html.push(`<section class="sec"><h2>Tu evolución</h2>
        <p class="lead">${hayEvol ? "Cambios desde tu primera evaluación." : "Cuando repitas la evaluación desde tu perfil, aquí verás cómo cambias."}${prox ? ` Próxima evaluación recomendada: <b>${fechaLarga(prox)}</b>.` : ""}</p>
        ${evP ? `<div class="card" style="margin-bottom:12px"><div class="grid2">
          <div><b style="color:var(--good)">Corregido (${evP.corregidas.length})</b><ul class="chips">${evP.corregidas.map((d) => `<li class="tag l2">${esc(d.nombre)}</li>`).join("") || `<li class="note">Nada todavía</li>`}</ul></div>
          <div><b style="color:var(--bad)">Nuevo (${evP.nuevas.length})</b><ul class="chips">${evP.nuevas.map((d) => `<li class="tag l0">${esc(d.nombre)}</li>`).join("") || `<li class="note">Ninguna alteración nueva</li>`}</ul></div>
        </div></div>` : ""}
        <div class="graficas">${graf.map(([nombre, serie, opt, menos, u]) => {
          const c = comparar(serie, menos);
          return `<div class="card"><div class="row"><h3>${nombre}</h3><b>${fmt(serie.at(-1).valor)}${esc(opt.unidad)}</b>${c ? delta(c, u) + `<span class="note">en ${Math.max(1, Math.round(c.dias / 7))} sem.</span>` : ""}</div>${grafico(serie, opt)}</div>`;
        }).join("")}</div></section>`);

      $("#contenido").innerHTML = html.join("");
      pintarPlan();
    }

    // ---------- Plan (se recalcula al cambiar la actividad diaria) ----------
    function pintarPlan() {
      const actividad = leer("sportfy.actividad", "ligera");
      const prefs = leerPreferencias();
      const todo = calcularTodo({ apartados, prefs, actividad: ACTIVIDAD[actividad] ? actividad : "ligera", guardar: true });
      const perfil = todo.perfil, rutina = todo.rutina;
      const p = perfil.plan;
      const opciones = Object.entries(ACTIVIDAD).map(([k, v]) => `<option value="${k}" ${k === actividad ? "selected" : ""}>${esc(v.nombre)}</option>`).join("");
      if (!p) {
        $("#plan").innerHTML = `<div class="card"><p style="margin:0"><b>Objetivo: ${esc(perfil.objetivo.nombre)}.</b> ${esc(perfil.objetivo.texto)}</p>
          <p class="note">Para calcular calorías y macros necesitamos tu evaluación antropométrica con edad, altura y peso.</p>
          </div>`;
        return;
      }
      const kcalM = p.macros.proteina * 4 + p.macros.grasa * 9 + p.macros.hidratos * 4;
      const pct = (g, k) => Math.round((g * k / kcalM) * 100);
      const e = p.entrenamiento;
      const ritmo = p.ritmoPrevisto.semanalKg;
      $("#plan").innerHTML = `<div class="card">
        <div class="row"><span class="tag l2" style="font-size:.85rem">Objetivo: ${esc(perfil.objetivo.nombre)}</span><span class="note">${esc(perfil.objetivo.texto)}</span></div>
        <label class="note" style="display:block;margin-top:12px">Tu actividad diaria fuera del gimnasio<br><select id="actividad">${opciones}</select></label>
        <div class="kpis">
          <div class="kpi destacado"><span>Calorías al día</span><b>${fmt(p.kcal, 0)} kcal</b><small>${p.diferencia === 0 ? "mantenimiento" : `${p.diferencia > 0 ? "+" : ""}${fmt(p.diferencia, 0)} vs mantenimiento`}</small></div>
          <div class="kpi"><span>Mantenimiento</span><b>${fmt(p.mantenimiento, 0)} kcal</b><small>basal ${fmt(p.basal.kcal, 0)} (${esc(p.basal.metodo)})</small></div>
          <div class="kpi"><span>Ritmo previsto</span><b>${ritmo === 0 ? "Mantener" : `${ritmo > 0 ? "+" : ""}${fmt(ritmo, 2)} kg/sem`}</b><small>${p.basal.masaMagra ? `masa magra ${fmt(p.basal.masaMagra)} kg` : "sin % graso"}</small></div>
          <div class="kpi"><span>Agua</span><b>${fmt(p.agua)} L/día</b><small>más en días de entreno</small></div>
        </div>
        <div class="macro-bar" aria-hidden="true"><i style="width:${pct(p.macros.proteina, 4)}%"></i><i style="width:${pct(p.macros.grasa, 9)}%"></i><i style="width:${pct(p.macros.hidratos, 4)}%"></i></div>
        <div class="leyenda">
          <span><i class="punto" style="background:var(--accent)"></i>Proteína <b>${p.macros.proteina} g</b> (${pct(p.macros.proteina, 4)} %)</span>
          <span><i class="punto" style="background:var(--mid)"></i>Grasas <b>${p.macros.grasa} g</b> (${pct(p.macros.grasa, 9)} %)</span>
          <span><i class="punto" style="background:var(--good)"></i>Hidratos <b>${p.macros.hidratos} g</b> (${pct(p.macros.hidratos, 4)} %)</span>
        </div>
        <div class="kpis">
          <div class="kpi"><span>Fuerza</span><b>${e.diasFuerza} días/sem</b><small>${esc(e.seriesSemanaGrupo)} series por grupo muscular a la semana</small></div>
          <div class="kpi"><span>Repeticiones</span><b>${esc(e.repeticiones)}</b><small>dejando ${esc(e.rir)} en recámara (RIR)</small></div>
          <div class="kpi"><span>Cardio</span><b>${e.diasCardio} días/sem</b><small>${esc(rutina.cardioExtra?.tipo ?? perfil.cardio)}</small></div>
          <div class="kpi"><span>Nivel inicial</span><b style="text-transform:capitalize">${esc(perfil.nivelInicial)}</b><small>descanso ${esc(e.descanso)}</small></div>
        </div>
        <p class="foco" style="margin:10px 0 0"><b>Progresión:</b> ${esc(e.progresion)}</p>
        ${p.ajuste.motivos.length ? `<div class="ajuste"><p><b>Ajuste automático por tu evolución${p.ajuste.kcal ? ` (${p.ajuste.kcal > 0 ? "+" : ""}${p.ajuste.kcal} kcal)` : ""}</b></p>${p.ajuste.motivos.map((m) => `<p>${esc(m)}</p>`).join("")}</div>`
          : `<div class="ajuste"><p>Cuando repitas la evaluación antropométrica (en 4–6 semanas), las calorías se reajustarán solas según cómo haya cambiado tu peso y tu músculo.</p></div>`}
        <div class="ajuste"><p><b>Tus días:</b> ${rutina.sesiones.map((x) => `${esc(x.diaNombre ?? `Día ${x.dia}`)} (${esc(x.nombre.split(" (")[0])})`).join(", ")}${rutina.cardioExtra?.diasNombre?.length ? `. Cardio: ${esc(rutina.cardioExtra.diasNombre.join(", "))}` : ""}.</p>
          <p><b>Prioridad:</b> ${rutina.focos.length ? esc(rutina.focos.map((f) => ({ brazo: "brazo", hombro: "hombro", espalda: "espalda", abdomen: "abdomen", pecho: "pecho", gluteo: "glúteo", pierna: "pierna" })[f]).join(", ")) : "ninguna zona en específico"} · <a href="preferencias.html">Cambiar días, zonas o salud</a></p></div>
        ${rutina.condiciones.length ? `<p class="precaucion"><b>Tu salud:</b> ${rutina.condiciones.map((c) => `<b>${esc(c.nombre)}</b>: ${esc(c.aviso)}`).join(" ")}</p>` : ""}
        ${perfil.precauciones.length ? `<p class="precaucion"><b>Precauciones en el gimnasio:</b> ${perfil.precauciones.map(esc).join(" ")}</p>` : ""}
        <a class="btn" href="rutina.html" style="display:block;text-align:center;text-decoration:none;margin-top:14px">Ver mi rutina de gimnasio →</a>
        <a class="btn ghost" href="dieta.html" style="display:block;text-align:center;text-decoration:none;margin-top:8px">Ver mi dieta →</a>
        <p class="note" style="margin:4px 0 0">Estimaciones con fórmulas validadas (Katch-McArdle, Mifflin-St Jeor). No sustituyen el consejo médico o de un nutricionista.</p>
      </div>`;
      $("#actividad").addEventListener("change", (ev) => { escribir("sportfy.actividad", ev.target.value); pintarPlan(); });
    }
}
