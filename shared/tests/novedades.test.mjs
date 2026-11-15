import { test } from "node:test";
import assert from "node:assert/strict";
import funcion from "../../netlify/functions/novedades.mjs";

const pedir = (cuerpo) => new Request("https://x/.netlify/functions/novedades", { method: "POST", body: JSON.stringify(cuerpo) });

test("novedades: sin configurar responde 503 y con token falso 401", async () => {
  delete process.env.BREVO_API_KEY; delete process.env.BREVO_LISTA;
  assert.equal((await funcion(pedir({ token: "x", alta: true }))).status, 503);
  process.env.BREVO_API_KEY = "k"; process.env.BREVO_LISTA = "3";
  assert.equal((await funcion(pedir({ token: "a.b.c", alta: true }))).status, 401);
  assert.equal((await funcion(new Request("https://x", { method: "GET" }))).status, 405);
  delete process.env.BREVO_API_KEY; delete process.env.BREVO_LISTA;
});
