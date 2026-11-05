# Evaluación postural

16 pruebas en 3 bloques (vista lateral, vista frontal/posterior y tests funcionales).
Cada prueba se valora 2 (correcto), 1 (desviación leve) o 0 (desviación marcada) y tiene un peso.

Nota = suma(valor × peso) / suma(2 × peso) × 100

La nota se guarda en `localStorage["sportfy.scores"].postural` como `{ score, date, detail }`
y entra en la nota media del panel principal (`index.html`).

Al terminar se muestran los ejercicios correctivos de cada desviación, de mayor a menor prioridad.

Tests: `node --test modules/postural/tests/*.test.js`
