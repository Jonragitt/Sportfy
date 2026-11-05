// Protocolo de evaluación postural de Forty5.
// Cada zona tiene una o varias alteraciones posibles; el evaluador marca las que observa
// (ninguna marcada = zona sin alteración). Cada zona vale lo mismo en la nota /10.

export const MAX_POINTS = 10;

export const SECTIONS = [
  {
    id: "sagital",
    title: "Plano sagital",
    intro:
      "Vista lateral, de pie, descalzo y relajado. Imagina una plomada que cae desde el lóbulo de la oreja y pasa por el hombro, la cadera, por delante de la rodilla y por delante del tobillo.",
    zones: [
      {
        id: "cabeza",
        name: "Cabeza",
        how: "El lóbulo de la oreja debe quedar sobre la línea del acromion (punta del hombro).",
        options: [
          {
            id: "cabezaAnteriorizada",
            name: "Cabeza anteriorizada",
            hint: "La oreja queda por delante del hombro.",
            fix: ["Retracciones cervicales (chin tucks) 3×12", "Estiramiento de pectoral en puerta 3×30 s", "Face pull con banda 3×15"],
          },
        ],
      },
      {
        id: "hombros",
        name: "Hombros",
        how: "El acromion debe quedar alineado con la oreja y la cadera.",
        options: [
          {
            id: "hombrosAntepulsion",
            name: "Antepulsión",
            hint: "Hombros adelantados y enrollados hacia dentro.",
            fix: ["Estiramiento de pectoral 3×30 s", "Remo con banda 3×15", "Rotación externa con banda 3×15"],
          },
          {
            id: "hombrosRetropulsion",
            name: "Retropulsión",
            hint: "Hombros llevados hacia atrás por detrás de la línea.",
            fix: ["Movilidad escapular (protracción-retracción) 2×12", "Flexiones escapulares (push-up plus) 3×12", "Estiramiento de romboides abrazándote 3×30 s"],
          },
        ],
      },
      {
        id: "cadera",
        name: "Cadera / pelvis",
        how: "Las espinas ilíacas anterior y posterior deben quedar casi a la misma altura (pelvis neutra).",
        options: [
          {
            id: "caderaAnteversion",
            name: "Anteversión",
            hint: "La pelvis bascula hacia delante y aumenta la curva lumbar.",
            fix: ["Estiramiento de psoas en zancada 3×30 s por lado", "Puente de glúteo 3×15", "Dead bug 3×10"],
          },
          {
            id: "caderaRetroversion",
            name: "Retroversión",
            hint: "La pelvis bascula hacia atrás y la zona lumbar se aplana.",
            fix: ["Estiramiento de isquiotibiales 3×30 s", "Gato-camello 2×10", "Superman en el suelo 3×12"],
          },
        ],
      },
      {
        id: "rodilla",
        name: "Rodilla",
        how: "La línea debe pasar ligeramente por delante del eje de la rodilla, sin bloquearla ni flexionarla.",
        options: [
          {
            id: "genuRecurvatum",
            name: "Genu recurvatum",
            hint: "Rodilla en hiperextensión, queda por detrás de la línea.",
            fix: ["Estar de pie con ligera flexión, sin bloquear", "Curl femoral 3×12", "Sentadilla a cajón controlada 3×10"],
          },
          {
            id: "genuFlexo",
            name: "Genu flexo",
            hint: "Rodilla flexionada en reposo, no llega a extender.",
            fix: ["Estiramiento de isquiotibiales 3×30 s", "Extensión de rodilla con toalla bajo el talón 3×10", "Estiramiento de gemelo 3×30 s"],
          },
        ],
      },
      {
        id: "pie",
        name: "Pie",
        how: "Navicular drop: marca el hueso navicular sentado (pie sin carga) y de pie (con carga). Mide la diferencia de altura.",
        options: [
          {
            id: "navicularDrop",
            name: "Caída del arco plantar (navicular drop)",
            hint: "El navicular baja más de 10 mm al cargar el peso.",
            fix: ["Short foot (pie corto) 3×10 s", "Elevaciones de talón 3×15", "Elevaciones de talón con pelota entre tobillos 3×12"],
          },
        ],
      },
    ],
  },
];

export const ALL_ZONES = SECTIONS.flatMap((s) => s.zones);
export const ALL_OPTIONS = ALL_ZONES.flatMap((z) => z.options.map((o) => ({ ...o, zone: z })));

// answers: { zonaId: [opcionId, ...] }. Nota /10 (un decimal):
// cada zona sin alteraciones suma lo mismo.
export function computeScore(answers = {}) {
  if (!ALL_ZONES.length) return null;
  const ok = ALL_ZONES.filter((z) => !(answers[z.id] || []).length).length;
  return Math.round((ok / ALL_ZONES.length) * MAX_POINTS * 10) / 10;
}

export function selectedOptions(answers = {}) {
  return ALL_OPTIONS.filter((o) => (answers[o.zone.id] || []).includes(o.id));
}
