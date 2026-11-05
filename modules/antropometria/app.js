import { evaluar, guardarNotaGlobal } from './antropometria.js';

const HIST_KEY = 'sportfy.antropometria.historial';
const $ = (s) => document.querySelector(s);
const form = $('#form');
let ultimo = null;

const PLIEGUES = {
  hombre: [
    ['Pecho', 'Diagonal, a medio camino entre la axila y el pezón.'],
    ['Abdomen', 'Vertical, 2 cm a la derecha del ombligo.'],
    ['Muslo', 'Vertical, en la parte delantera, a mitad entre ingle y rodilla.'],
  ],
  mujer: [
    ['Tríceps', 'Vertical, parte trasera del brazo, a mitad entre hombro y codo.'],
    ['Suprailíaco', 'Diagonal, justo por encima de la cresta de la cadera.'],
    ['Muslo', 'Vertical, en la parte delantera, a mitad entre ingle y rodilla.'],
  ],
};

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

function actualizarPliegues() {
  const lista = PLIEGUES[form.sexo.value];
  lista.forEach(([nombre], i) => { document.querySelector(`[data-pliegue="${i}"]`).textContent = nombre; });
  $('#guia-pliegues').innerHTML = lista.map(([n, d]) => `<li><b>${n}:</b> ${d}</li>`).join('');
}

function datosFormulario() {
  const f = new FormData(form);
  const pl = [num(f.get('p0')), num(f.get('p1')), num(f.get('p2'))];
  return {
    sexo: f.get('sexo'),
    edad: num(f.get('edad')),
    peso: num(f.get('peso')),
    altura: num(f.get('altura')),
    cintura: num(f.get('cintura')),
    cadera: num(f.get('cadera')),
    cuello: num(f.get('cuello')),
    pliegues: pl.every((v) => v !== undefined) ? pl : undefined,
    nivelVisceral: num(f.get('nivelVisceral')),
  };
}

function pintarResultado(r) {
  $('#resultado').hidden = false;
  const media = $('#media-num');
  media.innerHTML = `${fmt(r.nota)}<small>/${r.max}</small>`;
  media.className = `media-num ${color(r.nota, r.max)}`;
  $('#media-cal').textContent = r.calificacion;
  $('#media-aviso').hidden = r.completa;
  $('#media-aviso').textContent = r.completa ? '' :
    `Evaluación incompleta: faltan ${r.faltan} de 5 pruebas. La nota se ha escalado sobre las ${r.metricas.length} medidas (${r.puntos}/${r.posibles} puntos).`;
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
    const grasa = r.metricas.find((m) => m.id === 'grasa');
    return `<tr>
      <td>${new Date(r.fecha).toLocaleDateString('es-ES')}</td>
      <td>${fmt(r.datos.peso)} kg</td>
      <td>${r.datos.cintura ? `${fmt(r.datos.cintura)} cm` : '–'}</td>
      <td>${grasa ? `${fmt(grasa.valor)} %` : '–'}</td>
      <td>${r.nota != null ? `<b class="${color(r.nota, r.max)}">${fmt(r.nota)}</b>/${r.max}` : '–'}</td>
      <td><button type="button" class="borrar" data-i="${i}" aria-label="Borrar">✕</button></td>
    </tr>`;
  }).reverse().join('');
}

form.sexo.addEventListener('change', actualizarPliegues);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('#error');
  try {
    ultimo = evaluar(datosFormulario());
    err.hidden = true;
    pintarResultado(ultimo);
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

actualizarPliegues();
pintarHistorial();
