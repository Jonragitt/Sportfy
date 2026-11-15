// Función de Netlify: apunta o quita a alguien de la lista de novedades de Forty5 en Brevo.
// Solo con su permiso: la app la llama cuando la persona marca o desmarca «Quiero recibir novedades»
// (shared/cuenta.js). Comprueba la sesión con el token de Firebase, así solo se puede apuntar o quitar
// la dirección de la propia cuenta. Luego, desde Brevo → Campañas, se escribe a toda la lista.
// Variables de entorno en Netlify: BREVO_API_KEY (con permiso de Contactos) y BREVO_LISTA (número de la lista).
import { verificarToken } from "./bienvenida.mjs";

const responder = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return responder(405, { error: "método" });
  const clave = process.env.BREVO_API_KEY, lista = Number(process.env.BREVO_LISTA);
  if (!clave || !Number.isInteger(lista) || lista <= 0) return responder(503, { error: "lista sin configurar" });
  let entrada;
  try { entrada = await req.json(); } catch { return responder(400, { error: "json" }); }
  let usuario;
  try { usuario = await verificarToken(entrada.token); } catch { return responder(401, { error: "sesión" }); }
  const nombre = String(entrada.nombre ?? "").replace(/[\r\n<>]/g, "").trim().slice(0, 30);
  const cab = { "api-key": clave, "Content-Type": "application/json", accept: "application/json" };
  const r = entrada.alta === true
    ? await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST", headers: cab,
        body: JSON.stringify({ email: usuario.email, attributes: nombre ? { FIRSTNAME: nombre } : {}, listIds: [lista], updateEnabled: true }),
      })
    : await fetch(`https://api.brevo.com/v3/contacts/lists/${lista}/contacts/remove`, {
        method: "POST", headers: cab, body: JSON.stringify({ emails: [usuario.email] }),
      });
  // Quitar a alguien que ya no estaba en la lista no es un error.
  if (!r.ok && !(entrada.alta !== true && r.status === 400)) return responder(502, { error: "brevo", detalle: (await r.text()).slice(0, 200) });
  return responder(200, { ok: true, alta: entrada.alta === true });
};
