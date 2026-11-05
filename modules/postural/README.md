# Evaluación postural

16 pruebas en 3 bloques (vista lateral, vista frontal/posterior y tests funcionales).
Cada prueba se valora 2 (correcto), 1 (desviación leve) o 0 (desviación marcada) y tiene un peso.

Nota /10 = suma(valor × peso) / suma(2 × peso) × 10 (un decimal)

Baremo: 9-10 Excelente, 7-8,9 Bueno, 5-6,9 Aceptable, 0-4,9 Deficiente.

La nota se guarda en `localStorage["sportfy.scores"].postural` como `{ score: puntos /10, max: 10, date, detail }`
y suma a la nota total /25 del panel principal (`index.html`).

Al terminar se muestran los ejercicios correctivos de cada desviación, de mayor a menor prioridad.

Tests: `node --test modules/postural/tests/*.test.js`
