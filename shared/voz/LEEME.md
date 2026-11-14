# Voz de Epachuko para el saludo de Forty5

Los audios se graban con el **Estudio de voz** (repositorio `jonragitt/estudio-de-voz`), con el mismo
cuaderno de Kaggle que narra APUNTY. Solo cambia la celda **3. Narrar y subir a GitHub**:

```python
env = dict(os.environ,
           REPO="jonragitt/sportfy",
           RAMA="claude/project-thread-iw4b9m",
           TEXTOS="shared/voz/saludos.json",
           SALIDA="shared/voz",
           VOZ="shared/voz/ref",
           EXPRESIVIDAD="0.5",
           PAUSAS="0.6")
```

- La clave `GH_TOKEN` tiene que poder escribir en `jonragitt/sportfy` (si es de las de un solo repositorio, añádele este).
- La primera vez crea la voz desde la misma grabación de LibriVox que usa APUNTY y guarda los recortes en `shared/voz/ref/`.
- Son 594 frases cortas (unos minutos con GPU T4). Si se corta, al lanzarlo otra vez sigue por donde iba.
- Las frases salen de `tools/saludos_voz.mjs` (unos 200 nombres, apodos y compuestos × buenos días / tardes / noches, y frases sin nombre).
  Para añadir nombres: edita la lista, ejecuta `node tools/saludos_voz.mjs` y vuelve a lanzar el cuaderno.

Sin estos audios la app usa la voz en español del propio dispositivo.
