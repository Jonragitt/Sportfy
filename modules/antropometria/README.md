# Evaluación antropométrica

Página estática (HTML + CSS + JS con ES modules, sin build). Abre `index.html` con cualquier servidor estático, por ejemplo `python3 -m http.server` desde la raíz del repo y entra en `/modules/antropometria/`.

## Puntuación (sobre 15)

5 pruebas, cada una de 0 a 3 puntos según el tramo en que caiga (3 Óptimo · 2 Aceptable · 1 Riesgo · 0 Riesgo alto). Los tramos están en `BAREMOS` (`antropometria.js`) y la página muestra el de cada prueba.

| Prueba | Datos | 3 puntos | Fuente |
|---|---|---|---|
| IMC | peso, altura | 18,5–24,9 | OMS |
| Índice cintura/altura | cintura | 0,40–0,49 | Ashwell |
| Índice cintura/cadera | cintura, cadera | < 0,90 H · < 0,80 M | OMS |
| % grasa corporal | 3 pliegues (Jackson-Pollock + Siri) o cuello + cintura (+ cadera M) con fórmula de la Marina | Atleta / Fitness: 6–17 % H · 14–24 % M | ACE |
| Grasa visceral | nivel de bioimpedancia, o estimada por cintura | nivel 1–9 · cintura < 94 cm H / < 80 cm M | OMS / IDF |

Calificación: Excelente ≥ 13,5 · Bueno ≥ 10,5 · Aceptable ≥ 7,5 · Deficiente < 7,5 (90 / 70 / 50 % de la nota máxima). Si falta alguna prueba, la nota se escala sobre las medidas hechas y se avisa de que es incompleta.

Al guardar se escribe `localStorage["sportfy.scores"].antropometria = { score, max: 15, date, detail }`. El panel raíz suma esta nota con la postural (/10) para la nota global sobre 25. El historial va en `sportfy.antropometria.historial`.

## Tests

```
node --test modules/antropometria/tests/*.test.mjs
```
