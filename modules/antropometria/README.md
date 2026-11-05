# Evaluación antropométrica

Página estática (HTML + CSS + JS con ES modules, sin build). Abre `index.html` con cualquier servidor estático, por ejemplo `python3 -m http.server` desde la raíz del repo y entra en `/modules/antropometria/`.

## Datos de entrada

Obligatorios: sexo, edad (años), altura (cm) y peso (kg). Báscula de bioimpedancia: % graso, % agua, % muscular, metabolismo basal (kcal), edad metabólica (años) y grasa visceral (nivel).

## Puntuación (sobre 15)

5 pruebas, cada una de 0 a 3 puntos según el tramo en que caiga. Los tramos están en `BAREMOS` (`antropometria.js`) y la página muestra el de cada prueba.

| Prueba | 3 puntos | Fuente |
|---|---|---|
| % graso | Atleta / Fitness: 6–17,9 % H · 14–24,9 % M | ACE |
| % agua | 55–64,9 % H · 50–59,9 % M | Tanita |
| % muscular | Esquelético alto (≥ 39,4 % H · ≥ 30,4 % M, ajustado por edad) o masa muscular total ≥ 75 % H · ≥ 68 % M. Por encima de 50 % se interpreta como masa total. | Omron / bioimpedancia |
| Edad metabólica | igual o menor que la edad real | Tanita |
| Grasa visceral | nivel 1–9 | Tanita |

No puntúan (informativos): IMC (OMS) y metabolismo basal comparado con el estimado por Mifflin-St Jeor.

Calificación: Excelente ≥ 13,5 · Bueno ≥ 10,5 · Aceptable ≥ 7,5 · Deficiente < 7,5. Si falta alguna prueba, la nota se escala sobre las medidas hechas y se avisa de que es incompleta.

Al guardar se escribe `localStorage["sportfy.scores"].antropometria = { score, max: 15, date, detail }`. El panel raíz suma esta nota con la postural (/10) para la nota global sobre 25. El historial va en `sportfy.antropometria.historial`.

## Tests

```
node --test modules/antropometria/tests/*.test.mjs
```
