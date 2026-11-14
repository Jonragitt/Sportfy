// Junta los MP3 de shared/voz/ en pocos paquetes (shared/voz/paquetes/<momento>-<inicial>.mp3) y un
// índice (indice.json: clave → [paquete, inicio, bytes]). Así la página sirve 72 archivos en vez de 594
// (el artefacto de claude.ai admite unos 500 por versión) y cada saludo descarga solo su paquete.
// Uso: node tools/voz_paquetes.mjs   (después de grabar o regrabar audios)
import fs from "node:fs";
import path from "node:path";

const VOZ = new URL("../shared/voz/", import.meta.url).pathname;
const SALIDA = path.join(VOZ, "paquetes");
fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA, { recursive: true });

const grupos = new Map();
for (const f of fs.readdirSync(VOZ).filter((f) => f.endsWith(".mp3")).sort()) {
  const clave = f.slice(0, -4), [momento, ...resto] = clave.split("-");
  const grupo = `${momento}-${resto.join("-")[0]}`;
  if (!grupos.has(grupo)) grupos.set(grupo, []);
  grupos.get(grupo).push(clave);
}
const indice = {};
for (const [grupo, claves] of grupos) {
  const trozos = [];
  let inicio = 0;
  for (const clave of claves) {
    const b = fs.readFileSync(path.join(VOZ, `${clave}.mp3`));
    indice[clave] = [grupo, inicio, b.length];
    trozos.push(b); inicio += b.length;
  }
  fs.writeFileSync(path.join(SALIDA, `${grupo}.mp3`), Buffer.concat(trozos));
}
fs.writeFileSync(path.join(SALIDA, "indice.json"), JSON.stringify(indice));
console.log(`${Object.keys(indice).length} audios en ${grupos.size} paquetes`);
