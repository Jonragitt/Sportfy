// Función de Netlify: manda el correo de bienvenida de Forty5.
// La app la llama al terminar de poner el nombre con la sesión de Google iniciada (shared/cuenta.js).
// - Comprueba la sesión con el token de Firebase (firma de Google, proyecto, caducidad y correo
//   verificado), así solo se puede mandar a la dirección de la propia cuenta.
// - Envía con Brevo (https://www.brevo.com, gratis hasta 300 correos al día).
// Variables de entorno en Netlify: BREVO_API_KEY y REMITENTE (correo verificado en Brevo).
import crypto from "node:crypto";
import { correoBienvenida, textoPlano, asunto } from "./plantilla-bienvenida.mjs";

const PROYECTO = "forty5-de02b";
const CERTS = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const b64 = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export async function verificarToken(token, { certs, ahora = Date.now() / 1000 } = {}) {
  const [h, p, firma] = String(token).split(".");
  if (!h || !p || !firma) throw new Error("token");
  const cab = JSON.parse(b64(h)), datos = JSON.parse(b64(p));
  if (cab.alg !== "RS256") throw new Error("alg");
  certs ??= await (await fetch(CERTS)).json();
  const pem = certs[cab.kid];
  if (!pem) throw new Error("kid");
  const ok = crypto.createVerify("RSA-SHA256").update(`${h}.${p}`).verify(pem, b64(firma));
  if (!ok) throw new Error("firma");
  if (datos.aud !== PROYECTO || datos.iss !== `https://securetoken.google.com/${PROYECTO}`) throw new Error("proyecto");
  if (!(datos.exp > ahora) || !(datos.iat <= ahora + 300) || !datos.sub) throw new Error("caducado");
  if (!datos.email || datos.email_verified !== true) throw new Error("correo");
  return datos;
}

const responder = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return responder(405, { error: "método" });
  const clave = process.env.BREVO_API_KEY, remitente = process.env.REMITENTE;
  if (!clave || !remitente) return responder(503, { error: "correo sin configurar" });
  let entrada;
  try { entrada = await req.json(); } catch { return responder(400, { error: "json" }); }
  let usuario;
  try { usuario = await verificarToken(entrada.token); } catch { return responder(401, { error: "sesión" }); }
  const nombre = String(entrada.nombre ?? "").replace(/[\r\n<>]/g, "").trim().slice(0, 30) || usuario.name?.split(" ")[0] || "";
  const web = process.env.URL || "https://forty5.netlify.app";
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": clave, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Forty5", email: remitente },
      to: [{ email: usuario.email, name: nombre }],
      subject: asunto(nombre),
      htmlContent: correoBienvenida({ nombre, web }),
      textContent: textoPlano({ nombre, web }),
      tags: ["bienvenida"],
    }),
  });
  if (!r.ok) return responder(502, { error: "envío", detalle: (await r.text()).slice(0, 200) });
  return responder(200, { ok: true });
};
