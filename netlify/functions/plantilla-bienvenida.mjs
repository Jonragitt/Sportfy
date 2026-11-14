// Correo de bienvenida de Forty5 (HTML para clientes de correo: tablas y estilos en línea).
// Las imágenes están en la propia web (shared/correo/*.jpg): móviles iPhone con la app abierta.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const PASOS = [
  { img: "paso-postural", num: "1", titulo: "Haz tus dos evaluaciones",
    texto: "Mete los datos de tu báscula de bioimpedancia (antropométrica, sobre 15) y revisa tu postura de frente y de perfil (postural, sobre 10). Juntas te dan tu nota sobre 25: tu punto de partida." },
  { img: "paso-plan", num: "2", titulo: "Mira tu plan",
    texto: "En «Mi plan» verás qué dicen tus resultados, qué trabajar primero y cuánto comer: calorías y macros calculados para ti." },
  { img: "paso-rutina", num: "3", titulo: "Entrena ejercicio a ejercicio",
    texto: "Los días de gym, «Rutina» te guía paso a paso: series, repeticiones, descanso y cómo hacerlo bien. Pulsa «Siguiente» y, al final, «Terminado»." },
  { img: "paso-dieta", num: "4", titulo: "Come según tu día",
    texto: "«Dieta» te propone qué comer en cada comida según si entrenas o descansas, y puedes elegir entre varias opciones." },
];

export function asunto(nombre) { return `¡Te damos la bienvenida a Forty5, ${nombre}!`; }

export function correoBienvenida({ nombre, web }) {
  const n = esc(nombre), w = String(web).replace(/\/$/, ""), img = (f) => `${w}/shared/correo/${f}.jpg`;
  const paso = (p, i) => {
    const foto = `<td class="col foto" width="200" valign="top" style="padding:0"><img src="${img(p.img)}" width="200" alt="" style="display:block;width:200px;max-width:100%;height:auto;border-radius:16px"></td>`;
    const texto = `<td class="col" valign="middle" style="padding:0">
        <div style="display:inline-block;width:34px;height:34px;line-height:34px;border-radius:17px;background:#e4572e;color:#fff;font-weight:800;font-size:17px;text-align:center">${p.num}</div>
        <h2 style="margin:12px 0 8px;font-size:21px;line-height:1.25;color:#ffffff">${p.titulo}</h2>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#c9c9cf">${p.texto}</p></td>`;
    // La foto va siempre primero (en el móvil queda encima); en pantalla ancha, una fila sí y otra no
    // se ve a la derecha gracias a dir="rtl".
    const fila = foto.replace('padding:0"', `padding:${i % 2 ? "0 0 0 22px" : "0 22px 0 0"}" dir="ltr"`) + texto.replace('<td class="col"', '<td class="col" dir="ltr"');
    return `<tr><td style="padding:0 28px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"${i % 2 ? ' dir="rtl"' : ""}><tr>${fila}</tr></table></td></tr>`;
  };
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><title>Bienvenida a Forty5</title>
<style>@media (max-width:620px){.caja{width:100%!important}.col{display:block!important;width:100%!important;padding:0!important}.col.foto{padding:0 0 18px!important;text-align:center}.col.foto img{margin:0 auto;width:62%!important}h1{font-size:28px!important}}</style></head>
<body style="margin:0;padding:0;background:#0b0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">Tu plan de entreno y dieta, hecho a partir de tus evaluaciones. Así funciona.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d"><tr><td align="center" style="padding:24px 12px">
<table class="caja" role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#141418;border-radius:24px;overflow:hidden">
  <tr><td align="center" style="padding:30px 28px 6px"><img src="${w}/shared/logo/forty5-titulo.png" width="220" alt="Forty5" style="display:block;width:220px;height:auto"></td></tr>
  <tr><td style="padding:14px 28px 4px"><h1 style="margin:0;font-size:32px;line-height:1.15;color:#ffffff">¡Hola, ${n}!</h1>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#d6d6db">Ya tienes tu cuenta de <b style="color:#fff">Forty5</b>. Tu progreso se guarda solo y lo tendrás en cualquier dispositivo. Te contamos en cuatro pasos cómo sacarle partido.</p></td></tr>
  <tr><td style="padding:22px 0 26px"><img src="${img("portada")}" width="600" alt="La app de Forty5 abierta en un iPhone: Rutina, Mi plan y Dieta" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
  ${PASOS.map(paso).join("\n  ")}
  <tr><td style="padding:4px 28px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1c1c22;border-radius:16px"><tr><td style="padding:18px 20px">
    <p style="margin:0;font-size:15px;line-height:1.6;color:#d6d6db"><b style="color:#fff">🔥 Tu racha.</b> Cada día de gym que terminas suma a tu racha (el fuego de arriba a la derecha). Tienes hasta el final del día siguiente para completar cada entreno.</p>
  </td></tr></table></td></tr>
  <tr><td align="center" style="padding:24px 28px 10px"><a href="${w}/" style="display:inline-block;background:#e4572e;color:#ffffff;text-decoration:none;font-weight:800;font-size:17px;padding:15px 34px;border-radius:14px">Abrir Forty5</a></td></tr>
  <tr><td style="padding:6px 28px 30px"><p style="margin:0;font-size:13px;line-height:1.6;color:#8b8b93;text-align:center">Truco: en el móvil, ábrela en el navegador y pulsa «Añadir a pantalla de inicio» para tenerla como una app.<br>Recibes este correo porque has creado tu cuenta en Forty5.</p></td></tr>
</table></td></tr></table></body></html>`;
}

export function textoPlano({ nombre, web }) {
  return `¡Hola, ${nombre}!\n\nYa tienes tu cuenta de Forty5. Así funciona:\n\n${PASOS.map((p) => `${p.num}. ${p.titulo}: ${p.texto}`).join("\n\n")}\n\nAbre Forty5: ${web}\n`;
}
