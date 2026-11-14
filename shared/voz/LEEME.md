# Voz de Epachuko para el saludo de Forty5

Cada audio es la frase entera («¡Buenos días, Jonás!»), grabada con el **Estudio de voz**
(`jonragitt/estudio-de-voz`, motor Chatterbox con la voz de Epachuko). Se reparte entre dos máquinas
con GPU gratis que trabajan a la vez y suben cada MP3 a `shared/voz/` en cuanto termina:

| Dónde | Qué graba | Cómo |
|---|---|---|
| **Kaggle** | frases pares | En tu cuaderno *NarrarKaggle*, sustituye la celda 3 por `tools/voz/kaggle-celda3.py` y pulsa *Save Version → Save & Run All*. |
| **Colab** | frases impares | Abre https://colab.research.google.com/github/Jonragitt/Sportfy/blob/claude/project-thread-iw4b9m/tools/voz/SaludosColab.ipynb, añade el secreto `GH_TOKEN`, elige GPU T4 y *Ejecutar todo*. |

- La clave `GH_TOKEN` tiene que poder escribir en `jonragitt/sportfy` (en Kaggle y en Colab).
- Cada máquina crea la voz desde la misma grabación de LibriVox que usa APUNTY (`shared/voz/ref-kaggle/`, `ref-colab/`).
- Si una se corta, al lanzarla otra vez sigue por donde iba. Si una termina antes, puedes lanzarla otra vez con la otra mitad cambiando `% 2 == 0` por `% 2 == 1` (o al revés).
- Las frases salen de `tools/saludos_voz.mjs` (unos 200 nombres, apodos y compuestos × buenos días / tardes / noches, y frases sin nombre).
  Para añadir nombres: edita la lista, ejecuta `node tools/saludos_voz.mjs` y vuelve a lanzar: solo graba los que faltan.

Sin estos audios la app usa la voz en español del propio dispositivo.
