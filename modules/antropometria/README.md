# Evaluación antropométrica

Página estática (HTML + CSS + JS con ES modules, sin build). Abre `index.html` con cualquier servidor estático, por ejemplo `python3 -m http.server` desde la raíz del repo y entra en `/modules/antropometria/`.

## Qué mide

| Métrica | Datos necesarios | Ideal (nota 10) |
|---|---|---|
| IMC | peso, altura | 18,5–24,9 |
| Índice cintura/altura | cintura | ≤ 0,50 |
| Índice cintura/cadera | cintura, cadera | ≤ 0,90 hombre · ≤ 0,80 mujer |
| % grasa corporal | 3 pliegues (Jackson-Pollock + Siri) o, si no hay, cuello + cintura (+ cadera en mujer) con la fórmula de la Marina de EE.UU. | 10–20 % hombre · 18–28 % mujer |
| Grasa visceral | nivel de báscula de bioimpedancia (1–12 saludable) o, si no hay, estimación por cintura (OMS/IDF: riesgo desde 94 cm hombre, 80 cm mujer) | riesgo bajo |

## Puntuación

- Cada métrica saca 10 dentro del rango ideal. Fuera de él empieza como máximo en 8 y baja en línea recta hasta 0 en el valor extremo (ver `BAREMOS` en `antropometria.js`).
- La nota media es la media de las métricas que se hayan podido calcular: ≥ 9 Excelente, ≥ 7 Bueno, ≥ 5 Mejorable, < 5 Prioridad de mejora.
- Al guardar, la nota (0–100) se escribe en `localStorage["sportfy.scores"].antropometria` como `{ score, date, detail }`, el mismo formato que usan los demás módulos para la nota media global. El historial se guarda en `sportfy.antropometria.historial`.

## Tests

```
node --test modules/antropometria/tests/*.test.mjs
```
