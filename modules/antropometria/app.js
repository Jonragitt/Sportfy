import { evaluar, guardarNotaGlobal } from './antropometria.js';
import { marcarPendiente, quitarPendiente, montarTick } from '../../shared/perfil.js';

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

const BASICOS = ['edad', 'altura', 'peso'];
const BIO = ['grasa', 'agua', 'muscular', 'metabolismo', 'edadMetabolica', 'visceral'];
const soloKg = () => $('#soloKg').checked;
// Campos obligatorios: todos, salvo los de bioimpedancia si la báscula solo mide kg.
const obligatorios = () => (soloKg() ? BASICOS : [...BASICOS, ...BIO]);

function datosFormulario() {
  const f = new FormData(form);
  const d = { sexo: f.get('sexo') };
  CAMPOS.forEach((c) => { d[c] = soloKg() && BIO.includes(c) ? undefined : num(f.get(c)); });
  return d;
}

function pendientes() {
  return obligatorios().filter((c) => {
    const v = num(form.elements[c].value);
    return !(typeof v === 'number' && Number.isFinite(v) && v > 0);
  });
}

// Botón "Resultados": cristal gris mientras falten datos, verde y grande cuando está todo.
function actualizarBoton() {
  const faltan = pendientes();
  const listo = faltan.length === 0;
  const ver = $('#ver');
  ver.classList.toggle('listo', listo);
  ver.setAttribute('aria-disabled', String(!listo));
  $('#faltan').textContent = listo
    ? 'Toca para ver tu evaluación'
    : `${faltan.length === 1 ? 'Falta' : 'Faltan'} ${faltan.length} de ${obligatorios().length} datos`;
  $('#bio').classList.toggle('off', soloKg());
  BIO.forEach((c) => { form.elements[c].disabled = soloKg(); });
  $('#soloKg-nota').hidden = !soloKg();
  return listo;
}

function pintarResultado(r) {
  $('#resultado').hidden = false;
  const conNota = r.nota !== null;
  $('.media').style.display = conNota ? '' : 'none';
  $('#metricas').style.display = conNota ? '' : 'none';
  $('#resultado > .nota').textContent = conNota
    ? '5 pruebas (% graso, % agua, % muscular, edad metabólica y grasa visceral) × 3 puntos = 15 puntos. Cuenta para la nota global sobre 25 junto a la evaluación postural (/10).'
    : 'Tu báscula solo mide el peso, así que no hay nota sobre 15. Con una báscula de bioimpedancia podrás completar la evaluación.';
  if (!conNota) {
    $('#media-aviso').hidden = true;
    $('#metricas').innerHTML = '';
  }
  const media = $('#media-num');
  if (conNota) media.innerHTML = `${fmt(r.nota)}<small>/${r.max}</small>`;
  if (conNota) media.className = `media-num ${color(r.nota, r.max)}`;
  $('#media-cal').textContent = r.calificacion;
  if (conNota) $('#media-aviso').hidden = r.completa;
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


form.addEventListener('input', (e) => { e.target.classList?.remove('vacio'); $('#ver').classList.remove('oculto'); actualizarBoton(); $('#error').hidden = true; });
form.addEventListener('change', actualizarBoton);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('#error');
  form.querySelectorAll('input.vacio').forEach((i) => i.classList.remove('vacio'));
  if (!actualizarBoton()) {
    const faltan = pendientes();
    faltan.forEach((c) => form.elements[c].classList.add('vacio'));
    err.textContent = 'Rellena todos los datos para ver tus resultados. Si tu báscula solo mide el peso, marca la casilla.';
    err.hidden = false;
    form.elements[faltan[0]].focus();
    return;
  }
  try {
    const r = evaluar(datosFormulario());
    err.hidden = true;
    pintarResultado(r);
    ultimo = r;
    marcarPendiente('antropometria');
    montarTick($('#tick'), $('#ver'), confirmar, '../../perfil.html');
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

// Solo el tick verde guarda los resultados en el perfil (historial + nota global).
function confirmar() {
  if (!ultimo) return;
  const h = leer(HIST_KEY, []);
  h.push(ultimo);
  escribir(HIST_KEY, h);
  if (ultimo.nota !== null) guardarNotaGlobal(ultimo, localStorage, {
    calificacion: ultimo.calificacion,
    completa: ultimo.completa,
    puntos: Object.fromEntries(ultimo.metricas.map((m) => [m.id, m.puntos])),
  });
  quitarPendiente('antropometria');
  pintarHistorial();
}

$('#historial tbody').addEventListener('click', (e) => {
  const b = e.target.closest('.borrar');
  if (!b) return;
  const h = leer(HIST_KEY, []);
  h.splice(Number(b.dataset.i), 1);
  escribir(HIST_KEY, h);
  pintarHistorial();
actualizarBoton();
});

pintarHistorial();
actualizarBoton();
