# Evaluación postural

Dos planos, 10 zonas. En cada zona se marcan con círculos una o varias alteraciones.

Plano sagital (vista lateral):

- Cabeza: cabeza anteriorizada
- Hombros: antepulsión / retropulsión
- Cadera: anteversión / retroversión
- Rodilla: genu recurvatum / genu flexo
- Pie: caída del arco plantar (navicular drop > 10 mm)

Plano frontal (vista anterior y posterior):

- Hombros: acromios asimétricos
- Escápulas: abducción / aducción
- Pelvis: crestas ilíacas asimétricas
- Rodillas: valgo / varo
- Tobillos: eversión / inversión

Nota /10 = zonas sin alteración / total de zonas × 10 (un decimal). Una zona con varias alteraciones cuenta una vez.

Baremo: 9-10 Excelente, 7-8,9 Bueno, 5-6,9 Aceptable, 0-4,9 Deficiente.

Se guarda en `localStorage["sportfy.scores"].postural` como `{ score: puntos /10, max: 10, date, detail: { answers } }`
y suma a la nota total /25 del panel principal (`index.html`).

Al terminar se muestran ejercicios correctivos para cada alteración marcada.

Tests: `node --test modules/postural/tests/*.test.js`
