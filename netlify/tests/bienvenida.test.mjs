import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verificarToken } from "../functions/bienvenida.mjs";
import { correoBienvenida, asunto } from "../functions/plantilla-bienvenida.mjs";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const certs = { k1: publicKey.export({ type: "spki", format: "pem" }) };
const u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const firmar = (datos, kid = "k1") => {
  const h = u({ alg: "RS256", kid }), p = u(datos);
  return `${h}.${p}.${crypto.createSign("RSA-SHA256").update(`${h}.${p}`).sign(privateKey).toString("base64url")}`;
};
const ahora = 1_800_000_000;
const bueno = { aud: "forty5-de02b", iss: "https://securetoken.google.com/forty5-de02b", sub: "abc", iat: ahora - 10, exp: ahora + 3000, email: "a@b.es", email_verified: true };

test("acepta un token de Firebase válido del proyecto", async () => {
  assert.equal((await verificarToken(firmar(bueno), { certs, ahora })).email, "a@b.es");
});
test("rechaza tokens de otro proyecto, caducados, sin correo verificado o mal firmados", async () => {
  await assert.rejects(verificarToken(firmar({ ...bueno, aud: "otro" }), { certs, ahora }));
  await assert.rejects(verificarToken(firmar({ ...bueno, exp: ahora - 1 }), { certs, ahora }));
  await assert.rejects(verificarToken(firmar({ ...bueno, email_verified: false }), { certs, ahora }));
  const t = firmar(bueno).split("."); t[1] = u({ ...bueno, email: "otro@x.es" });
  await assert.rejects(verificarToken(t.join("."), { certs, ahora }));
});
test("el correo lleva el nombre escapado y las imágenes de la web", () => {
  const h = correoBienvenida({ nombre: "Jonás <b>", web: "https://forty5.netlify.app/" });
  assert.match(h, /¡Hola, Jonás &lt;b&gt;!/);
  assert.match(h, /https:\/\/forty5\.netlify\.app\/shared\/correo\/portada\.jpg/);
  assert.equal(asunto("Ana"), "¡Te damos la bienvenida a Forty5, Ana!");
});
