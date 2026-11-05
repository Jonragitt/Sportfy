import { evaluar, guardarNotaGlobal } from './antropometria.js';

const HIST_KEY = 'sportfy.antropometria.historial';
const $ = (s) => document.querySelector(s);
const form = $('#form');
let ultimo = null;

const leer = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
};
const escribir = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ }
};
const num = (v) => (v === '' || v == null ? undefined : Number(String(v).replace(',', '.')));
const fmt = (n) => (typeof n === 'number' ? String(n).replace('.', ',') : n);
// Color según el % conseguido: ≥90 % verde, ≥70 % verde claro, ≥50 % ámbar, resto rojo.
const color = (pts, max) => {
  const p = pts / max;
  return p >= 0.9 ? 'ok' : p >= 0.7 ? 'bien' : p >= 0.5 ? 'medio' : 'mal';
};
const COLOR_PUNTOS = ['mal', 'medio', 'bien', 'ok'];

const CAMPOS = ['edad', 'altura', 'peso', 'grasa', 'agua', 'muscular', 'metabolismo', 'edadMetabolica', 'visceral'];

function datosFormulario() {
  const f = new FormData(form);
  const d = { sexo: f.get('sexo') };
  CAMPOS.forEach((c) => { d[c] = num(f.get(c)); });
  return d;
}

function pintarResultado(r) {
  if (r.nota === null) throw new Error('Introduce al menos uno de los valores de la báscula (% graso, % agua, % muscular, edad metabólica o grasa visceral).');
  $('#resultado').hidden = false;
  const media = $('#media-num');
  media.innerHTML = `${fmt(r.nota)}<small>/${r.max}</small>`;
  media.className = `media-num ${color(r.nota, r.max)}`;
  $('#media-cal').textContent = r.calificacion;
  $('#media-aviso').hidden = r.completa;
  $('#media-aviso').textContent = r.completa ? '' :
    `Evaluación incompleta: faltan ${r.faltan} de 5 pruebas. La nota se ha escalado sobre las ${r.metricas.length} medidas (${r.puntos}/${r.posibles} puntos).`;
  $('#informativos').innerHTML = r.informativos.map((i) => `
    <li><span>${i.nombre}</span><b>${fmt(i.valor)} <small>${i.unidad}</small></b><em>${i.categoria}</em></li>`).join('');
  $('#metricas').innerHTML = r.metricas.map((m) => `
    <li class="metrica">
      <div class="m-head">
        <span class="m-nombre">${m.nombre}</span>
        <span class="m-nota ${COLOR_PUNTOS[m.puntos]}">${m.puntos}/${m.max} pts</span>
      </div>
      <div class="m-valor">${fmt(m.valor)} <small>${m.unidad}</small> · <b>${m.categoria}</b></div>
      <div class="pips" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= m.puntos ? COLOR_PUNTOS[m.puntos] : ''}"></span>`).join('')}</div>
      ${m.detalle ? `<div class="m-detalle">${m.detalle}</div>` : ''}
      <details class="baremo">
        <summary>Ver baremo (${m.fuente})</summary>
        <table>
          <thead><tr><th>Rango</th><th>Categoría</th><th class="pts">Pts</th></tr></thead>
          <tbody>${m.baremo.map((t) => `<tr class="${t.categoria === m.categoria ? 'actual' : ''}">
            <td>${t.rango}</td><td>${t.categoria}</td><td class="pts">${t.puntos}</td></tr>`).join('')}</tbody>
        </table>
      </details>
    </li>`).join('');
  $('#resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function pintarHistorial() {
  const h = leer(HIST_KEY, []);
  $('#historial-vacio').hidden = h.length > 0;
  $('#historial').hidden = h.length === 0;
  $('#historial tbody').innerHTML = h.map((r, i) => {
    const v = (id) => r.metricas.find((m) => m.id === id);
    const grasa = v('grasa');
    const musc = v('muscular');
    return `<tr>
      <td>${new Date(r.fecha).toLocaleDateString('es-ES')}</td>
      <td>${fmt(r.datos.peso)} kg</td>
      <td>${grasa ? `${fmt(grasa.valor)} %` : '–'}</td>
      <td>${musc ? `${fmt(musc.valor)} %` : '–'}</td>
      <td>${r.nota != null ? `<b class="${color(r.nota, r.max)}">${fmt(r.nota)}</b>/${r.max}` : '–'}</td>
      <td><button type="button" class="borrar" data-i="${i}" aria-label="Borrar">✕</button></td>
    </tr>`;
  }).reverse().join('');
}


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('#error');
  try {
    const r = evaluar(datosFormulario());
    err.hidden = true;
    pintarResultado(r);
    ultimo = r;
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

$('#guardar').addEventListener('click', () => {
  if (!ultimo) return;
  const h = leer(HIST_KEY, []);
  h.push(ultimo);
  escribir(HIST_KEY, h);
  guardarNotaGlobal(ultimo, localStorage, {
    calificacion: ultimo.calificacion,
    completa: ultimo.completa,
    puntos: Object.fromEntries(ultimo.metricas.map((m) => [m.id, m.puntos])),
  });
  pintarHistorial();
  $('#guardar').textContent = 'Guardado ✓';
  setTimeout(() => { $('#guardar').textContent = 'Guardar en mi historial'; }, 1500);
});

$('#historial tbody').addEventListener('click', (e) => {
  const b = e.target.closest('.borrar');
  if (!b) return;
  const h = leer(HIST_KEY, []);
  h.splice(Number(b.dataset.i), 1);
  escribir(HIST_KEY, h);
  pintarHistorial();
});

pintarHistorial();
