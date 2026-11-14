# Celda 3 del cuaderno de Kaggle (NarrarKaggle) para los saludos de Forty5: pega esto en lugar de la celda 3.
# Kaggle graba la MITAD PAR de las frases; Colab (tools/voz/SaludosColab.ipynb) la impar, a la vez.
import os, subprocess, sys, json, urllib.request
RAMA = "claude/project-thread-iw4b9m"
frases = json.load(urllib.request.urlopen(f"https://raw.githubusercontent.com/Jonragitt/Sportfy/{RAMA}/shared/voz/saludos.json"))["lecciones"]
mitad = [l["id"] for i, l in enumerate(frases) if i % 2 == 0]
print(f"🎙️ Kaggle: {len(mitad)} de {len(frases)} frases")
env = dict(os.environ, REPO="jonragitt/sportfy", RAMA=RAMA, TEXTOS="shared/voz/saludos.json", SALIDA="shared/voz",
           VOZ="shared/voz/ref-kaggle", SOLO=",".join(mitad), EXPRESIVIDAD="0.5", PAUSAS="0.6")
p = subprocess.Popen([sys.executable, "-u", "kaggle/narrar_repo.py"], cwd="/kaggle/working/estudio-de-voz",
                     env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
for linea in p.stdout:
    print(linea, end="")
p.wait()
if p.returncode:
    raise SystemExit(f"❌ La narración se ha parado (código {p.returncode}). Vuelve a lanzarlo: sigue por donde iba.")
