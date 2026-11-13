// Fondo de Forty5: fotos de deporte que cambian cada 3 minutos.
// El tiempo cuenta desde que se abrió la página (se guarda en la sesión, así sigue al pasar de un
// apartado a otro) y las fotos dependen de lo que el motor dice que toca el día del reloj:
// pierna, torso, cardio, descanso o, si aún no hay rutina, todas.
// Fotos de Unsplash (licencia libre de Unsplash, uso gratuito), servidas desde su CDN.
// Mismo día que marca el reloj (shared/reloj.js), sin montar el reloj en páginas que no lo llevan.
function diaDelReloj() {
  let v = null; try { v = sessionStorage.getItem("sportfy.fechaVista"); } catch { /* sin almacenamiento */ }
  const f = v ? new Date(...v.split("-").map((n, i) => Number(n) - (i === 1 ? 1 : 0))) : new Date();
  return (f.getDay() + 6) % 7;
}

export const CADA_MS = 3 * 60 * 1000;
const INICIO = "sportfy.fondoInicio";
const U = (id) => `https://images.unsplash.com/photo-${id}?ixlib=rb-4.1.0&fm=jpg&q=70&fit=crop&w=1080&h=1620&crop=entropy`;

export const FOTOS = [
  { id: "pierna1", tipo: "pierna", url: U("1770026136877-8ddf98cd6500"), autor: "Unsplash · snHdA7fCneY" },
  { id: "pierna2", tipo: "pierna", url: U("1770664612843-b44e26070024"), autor: "Unsplash · YFeoyqrFsGA" },
  { id: "torso1", tipo: "torso", url: U("1704223523449-ca3925f89dcc"), autor: "Unsplash · Pv97-3sdjdY" },
  { id: "torso2", tipo: "torso", url: U("1692372372344-41aed374b848"), autor: "Unsplash · fGAgXh6QQEU" },
  { id: "cardio1", tipo: "cardio", url: U("1698671823406-035c77ff6fcd"), autor: "Unsplash · 6PujGXV5kyc" },
  { id: "cardio2", tipo: "cardio", url: U("1526676317768-d9b14f15615a"), autor: "Unsplash · -4trKf0Kbow" },
  { id: "descanso1", tipo: "descanso", url: U("1600881333168-2ef49b341f30"), autor: "Unsplash · amgv9YUg-MA" },
  { id: "descanso2", tipo: "descanso", url: U("1713201679128-38da5657f611"), autor: "Unsplash · 8BW8wGBmy-E" },
  { id: "general1", tipo: "general", url: U("1576678927484-cc907957088c"), autor: "Unsplash · VJ2s0c20qCo" },
  { id: "general2", tipo: "general", url: U("1674834727149-00812f907676"), autor: "Unsplash · t9bG_FOXqMA" },
];

const TIPO_SESION = { pierna: "pierna", torso: "torso", empuje: "torso", tiron: "torso" };

/** Qué toca el día ds (0 = lunes) según la rutina que guardó el motor. */
export function tipoDelDia(rutina, ds) {
  if (!rutina?.sesiones?.length) return null;
  const s = rutina.sesiones.find((x) => x.diaSemana === ds);
  if (s) return TIPO_SESION[s.tipo] ?? "full";
  if (!rutina.diasSemana?.length) return null;
  return rutina.cardioExtra?.diasSemana?.includes(ds) ? "cardio" : "descanso";
}

/** Fotos que se turnan ese día: las de lo que toca y las generales de gimnasio. */
export function fotosDelDia(tipo) {
  if (!tipo) return FOTOS;
  const de = (...t) => FOTOS.filter((f) => t.includes(f.tipo));
  if (tipo === "full") return de("pierna", "torso", "general");
  if (tipo === "descanso") return de("descanso", "cardio");
  return de(tipo, "general");
}

/** Qué foto toca a la hora `ahora` si la página se abrió en `inicio`. */
export const indiceFoto = (inicio, ahora, n, salto = 0) => (salto + Math.floor(Math.max(0, ahora - inicio) / CADA_MS)) % n;

/** Foto con la que se empieza al entrar: al azar, pero nunca la última que se vio. */
export function saltoInicial(lista, ultima, azar = Math.random()) {
  let r = Math.floor(azar * lista.length) % lista.length;
  if (lista.length > 1 && lista[r].id === ultima) r = (r + 1) % lista.length;
  return r;
}
const ULTIMA = "sportfy.fondoUltima", SALTO = "sportfy.fondoSalto", ACTUAL = "sportfy.fondoActual";

function leerRutina() { try { return JSON.parse(localStorage.getItem("sportfy.rutina")); } catch { return null; } }
// Al abrir la app empieza la cuenta del reloj y se elige con qué foto se entra. Al pasar de un
// apartado a otro se sigue la misma cuenta, así que el cambio va cada 3 min desde que se abrió.
function inicioSesion(lista) {
  let ultima = null; try { ultima = localStorage.getItem(ULTIMA); } catch { /* sin almacenamiento */ }
  try {
    const v = Number(sessionStorage.getItem(INICIO)), s = sessionStorage.getItem(SALTO);
    if (v > 0 && s != null) return { inicio: v, salto: Number(s) };
    const r = { inicio: Date.now(), salto: saltoInicial(lista, ultima) };
    sessionStorage.setItem(INICIO, String(r.inicio)); sessionStorage.setItem(SALTO, String(r.salto));
    return r;
  } catch { return { inicio: Date.now(), salto: saltoInicial(lista, ultima) }; }
}

function montar() {
  if (!document.body.classList.contains("con-fondo") || document.querySelector(".fondo-capa")) return;
  const { inicio, salto } = inicioSesion(fotosDelDia(tipoDelDia(leerRutina(), diaDelReloj())));
  const capas = [0, 1].map(() => {
    const c = document.createElement("div");
    c.className = "fondo-capa"; c.setAttribute("aria-hidden", "true");
    document.body.prepend(c); return c;
  });
  let visible = 0, actual = null, reloj = null;
  // Al pasar de un apartado a otro, la foto que ya se veía se pone al momento (está en la caché),
  // sin fundido desde negro. Si toca otra, luego se funde como siempre.
  let previa = null; try { previa = sessionStorage.getItem(ACTUAL); } catch { /* sin almacenamiento */ }
  const yaVista = previa && FOTOS.find((f) => f.url === previa);
  if (yaVista) {
    actual = previa;
    capas[0].style.backgroundImage = `url("${previa}")`;
    capas[0].dataset.foto = yaVista.id;
    capas[0].classList.add("al-momento", "ver");
    document.body.classList.add("fondo-vivo");
    requestAnimationFrame(() => requestAnimationFrame(() => capas[0].classList.remove("al-momento")));
  }

  const poner = (foto, primera) => {
    if (foto.url === actual) return;
    const img = new Image();
    img.onload = () => {
      actual = foto.url;
      try { localStorage.setItem(ULTIMA, foto.id); sessionStorage.setItem(ACTUAL, foto.url); } catch { /* sin almacenamiento */ }
      const sig = primera && !yaVista ? visible : 1 - visible;
      capas[sig].style.backgroundImage = `url("${foto.url}")`;
      capas[sig].dataset.foto = foto.id;
      capas[sig].classList.add("ver"); if (sig !== visible) capas[visible].classList.remove("ver");
      visible = sig;
      document.body.classList.add("fondo-vivo");
      // Deja lista la siguiente para que el cambio sea suave.
      const lista = fotosDelDia(tipoDelDia(leerRutina(), diaDelReloj()));
      const i = lista.indexOf(foto); if (lista.length > 1) new Image().src = lista[(i + 1) % lista.length].url;
    };
    img.src = foto.url;
  };
  const elegir = (primera = false) => {
    const lista = fotosDelDia(tipoDelDia(leerRutina(), diaDelReloj()));
    const ahora = Date.now();
    poner(lista[indiceFoto(inicio, ahora, lista.length, salto)], primera);
    clearTimeout(reloj);
    reloj = setTimeout(() => elegir(), CADA_MS - ((ahora - inicio) % CADA_MS) + 50);
  };
  elegir(true);
  addEventListener("forty5:fecha", () => elegir());
  addEventListener("storage", (e) => { if (e.key === "sportfy.rutina") elegir(); });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
}
