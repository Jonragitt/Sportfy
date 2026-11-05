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
  {
    id: "frontal",
    title: "Plano frontal",
    intro:
      "Vista anterior y posterior, de pie, descalzo, pies a la anchura de la cadera y brazos relajados. Compara la altura y la alineación de ambos lados del cuerpo.",
    zones: [
      {
        id: "acromion",
        name: "Hombros (acromion)",
        how: "Coloca los dedos en la punta de ambos hombros y compara su altura.",
        options: [
          {
            id: "acromionAsimetrico",
            name: "Acromios asimétricos",
            hint: "Un hombro queda más alto que el otro.",
            fix: ["Estiramiento de trapecio superior del lado alto 3×30 s", "Paseo del granjero con una mano 3×30 m por lado", "Remo unilateral con mancuerna 3×12 por lado"],
          },
        ],
      },
      {
        id: "escapulas",
        name: "Escápulas",
        how: "De espaldas, el borde interno de cada escápula debe quedar a unos 5-7 cm de la columna.",
        options: [
          {
            id: "escapulasAbduccion",
            name: "Abducción",
            hint: "Escápulas separadas de la columna, desplazadas hacia fuera.",
            fix: ["Remo con banda juntando escápulas 3×15", "Y-T-W en banco inclinado 2×10", "Estiramiento de pectoral 3×30 s"],
          },
          {
            id: "escapulasAduccion",
            name: "Aducción",
            hint: "Escápulas muy juntas, pegadas a la columna.",
            fix: ["Flexiones escapulares (push-up plus) 3×12", "Estiramiento de romboides abrazándote 3×30 s", "Press de pecho con mancuerna 3×12"],
          },
        ],
      },
      {
        id: "crestas",
        name: "Pelvis (crestas ilíacas)",
        how: "Coloca las manos sobre la parte alta de la cadera y compara la altura de ambas crestas ilíacas.",
        options: [
          {
            id: "crestasAsimetricas",
            name: "Crestas ilíacas asimétricas",
            hint: "Un lado de la cadera queda más alto que el otro.",
            fix: ["Plancha lateral 3×20 s por lado", "Puente de glúteo a una pierna 3×10 por lado", "Estiramiento de cuadrado lumbar del lado alto 3×30 s"],
          },
        ],
      },
      {
        id: "rodillaFrontal",
        name: "Rodillas",
        how: "De frente, con los pies juntos: deben tocarse a la vez rodillas y tobillos.",
        options: [
          {
            id: "genuValgo",
            name: "Valgo",
            hint: "Las rodillas se juntan hacia dentro y los tobillos quedan separados.",
            fix: ["Monster walk con banda 3×15 pasos", "Sentadilla con banda en rodillas 3×12", "Abducción de cadera tumbado 3×15"],
          },
          {
            id: "genuVaro",
            name: "Varo",
            hint: "Los tobillos se tocan pero las rodillas quedan separadas.",
            fix: ["Estiramiento de aductores (mariposa) 3×30 s", "Sentadilla sumo controlada 3×12", "Aducción de cadera con banda 3×15"],
          },
        ],
      },
      {
        id: "tobillo",
        name: "Tobillos",
        how: "De espaldas, el tendón de Aquiles debe quedar vertical respecto al talón.",
        options: [
          {
            id: "tobilloEversion",
            name: "Eversión",
            hint: "El talón se inclina hacia fuera y el tobillo cae hacia dentro.",
            fix: ["Short foot (pie corto) 3×10 s", "Inversión con banda 3×15", "Elevaciones de talón 3×15"],
          },
          {
            id: "tobilloInversion",
            name: "Inversión",
            hint: "El talón se inclina hacia dentro y el apoyo va al borde externo del pie.",
            fix: ["Eversión con banda 3×15", "Equilibrio a una pierna 3×30 s por lado", "Movilidad de tobillo contra la pared 2×10"],
          },
        ],
      },
    ],
  },
  {
    id: "soh",
    title: "Sentadilla profunda (SOH)",
    bilateral: true,
    intro:
      "Pies a la anchura de los hombros y apuntando al frente, brazos estirados por encima de la cabeza. Haz 5 sentadillas lo más profundas posible, a ritmo lento. Obsérvalas de frente (Ant), de espaldas (Post) y de perfil (Lat), y marca en qué lado aparece cada compensación: I (izquierda) o D (derecha).",
    zones: [
      {
        id: "sohPies",
        name: "Pies",
        how: "Los pies deben quedar fijos, apuntando al frente y con el peso repartido por igual.",
        options: [
          {
            id: "sohPiesRotan",
            name: "Pies rotan hacia fuera o eleva talón",
            view: "Ant / Post",
            hint: "La punta del pie se abre o el talón se despega del suelo al bajar.",
            fix: ["Movilidad de tobillo contra la pared 2×10 por lado", "Estiramiento de gemelo y sóleo 3×30 s", "Sentadilla goblet con talones apoyados 3×10"],
          },
          {
            id: "sohArcoCae",
            name: "Caída del arco plantar",
            view: "Ant / Post",
            hint: "El arco se hunde y el tobillo cae hacia dentro al bajar.",
            fix: ["Short foot (pie corto) 3×10 s", "Elevaciones de talón 3×15", "Sentadilla con el arco activo (trípode del pie) 3×10"],
          },
          {
            id: "sohPieCavo",
            name: "Pie cavo",
            view: "Ant / Post",
            hint: "El arco se mantiene muy alto y el apoyo va al borde externo del pie.",
            fix: ["Masaje plantar con pelota 2 min por pie", "Estiramiento de la fascia plantar 3×30 s", "Eversión con banda 3×15"],
          },
          {
            id: "sohCargaAsimetrica",
            name: "Reparto asimétrico de carga",
            view: "Ant / Post",
            hint: "El peso se desplaza más hacia un pie. Marca el lado que carga más.",
            fix: ["Sentadilla en split (búlgara) 3×10 por lado", "Sentadilla frente a espejo repartiendo el peso 3×10", "Peso muerto a una pierna 3×10 por lado"],
          },
        ],
      },
      {
        id: "sohRodillas",
        name: "Rodillas",
        how: "Las rodillas deben seguir la línea de los pies, sin ir hacia dentro ni hacia fuera.",
        options: [
          {
            id: "sohValgo",
            name: "Valgo",
            view: "Ant",
            hint: "La rodilla se va hacia dentro al bajar.",
            fix: ["Sentadilla con banda en rodillas 3×12", "Monster walk con banda 3×15 pasos", "Clamshell 3×15 por lado"],
          },
          {
            id: "sohVaro",
            name: "Varo",
            view: "Ant",
            hint: "La rodilla se abre hacia fuera al bajar.",
            fix: ["Estiramiento de aductores (mariposa) 3×30 s", "Sentadilla sumo controlada 3×12", "Aducción de cadera con banda 3×15"],
          },
        ],
      },
      {
        id: "sohCLP",
        name: "Complejo lumbo-pélvico (C.L.P.)",
        how: "El tronco debe quedar paralelo a las tibias y la zona lumbar neutra durante toda la bajada.",
        options: [
          {
            id: "sohInclinacion",
            name: "Inclinación anterior excesiva",
            view: "Lat",
            hint: "El tronco cae hacia delante más que las tibias.",
            fix: ["Sentadilla goblet 3×10", "Movilidad de tobillo contra la pared 2×10", "Plancha frontal 3×30 s"],
          },
          {
            id: "sohHiperlordosis",
            name: "Hiperlordosis lumbar",
            view: "Lat",
            hint: "La zona lumbar se arquea en exceso al bajar.",
            fix: ["Estiramiento de psoas en zancada 3×30 s", "Dead bug 3×10", "Estiramiento de dorsal 3×30 s"],
          },
          {
            id: "sohRetroversion",
            name: "Retroversión pélvica precoz",
            view: "Lat",
            hint: "La pelvis se mete hacia dentro (butt wink) antes de llegar abajo.",
            fix: ["Estiramiento de isquiotibiales 3×30 s", "Movilidad de cadera en cuadrupedia (rock back) 2×10", "Sentadilla a cajón a la altura sin retroversión 3×10"],
          },
        ],
      },
    ],
  },
  {
    id: "slb",
    title: "Puente de cadera a una pierna (SLB)",
    bilateral: true,
    intro:
      "Tumbado boca arriba, rodillas flexionadas y brazos cruzados sobre el pecho. Estira una pierna y eleva la cadera con la otra hasta alinear hombro, cadera y rodilla. Mantén 5 segundos y repite con cada pierna. Marca el lado de la pierna de apoyo: I (izquierda) o D (derecha).",
    zones: [
      {
        id: "slbPuente",
        name: "Puente a una pierna",
        how: "La pelvis debe quedar nivelada y la cadera extendida sin arquear la zona lumbar.",
        options: [
          {
            id: "slbCaidaPelvis",
            name: "Caída de la pelvis",
            view: "Ant",
            hint: "La cadera del lado de la pierna estirada cae hacia el suelo.",
            fix: ["Plancha lateral 3×20 s por lado", "Puente a una pierna con pausa arriba 3×8 por lado", "Abducción de cadera tumbado 3×15"],
          },
          {
            id: "slbRotacion",
            name: "Rotación de la pelvis",
            view: "Ant",
            hint: "La pelvis gira hacia un lado en lugar de subir recta.",
            fix: ["Dead bug 3×10", "Puente a una pierna con banda en rodillas 3×8 por lado", "Bird dog 3×10 por lado"],
          },
          {
            id: "slbLumbar",
            name: "Compensación lumbar",
            view: "Lat",
            hint: "Sube arqueando la zona lumbar en lugar de extender la cadera.",
            fix: ["Basculaciones pélvicas 2×15", "Puente de glúteo con retroversión 3×12", "Estiramiento de psoas en zancada 3×30 s"],
          },
          {
            id: "slbIsquios",
            name: "Dominancia de isquiotibiales",
            view: "Lat",
            hint: "Siente el esfuerzo (o calambre) detrás del muslo en lugar del glúteo, o no llega a la altura.",
            fix: ["Activación de glúteo con banda (clamshell) 2×15", "Puente con talones cerca del glúteo 3×12", "Hip thrust a una pierna 3×8 por lado"],
          },
        ],
      },
    ],
  },
  {
    id: "wallAngel",
    title: "Wall angel test",
    bilateral: true,
    intro:
      "De pie con talones, glúteos, espalda alta y cabeza apoyados en la pared. Coloca los brazos en W con codos y dorso de las manos contra la pared y deslízalos hacia arriba y abajo 5 veces. Marca el lado en que aparece cada compensación.",
    zones: [
      {
        id: "wallAngelZona",
        name: "Hombros y columna",
        how: "Codos y manos deben mantener el contacto con la pared, sin que la espalda se despegue ni se arquee.",
        options: [
          {
            id: "waNoApoya",
            name: "No apoya codos / manos en la pared",
            view: "Lat",
            hint: "El codo o el dorso de la mano se separan de la pared.",
            fix: ["Ángeles en la pared 3×10", "Estiramiento de pectoral en puerta 3×30 s", "Rotación externa con banda 3×15"],
          },
          {
            id: "waCompensacion",
            name: "Movimiento compensado lumbar / dorsal",
            view: "Lat",
            hint: "Arquea la zona lumbar o despega la espalda alta para poder subir los brazos.",
            fix: ["Extensiones torácicas sobre foam roller 2×10", "Dead bug 3×10", "Estiramiento de dorsal 3×30 s"],
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

export const SIDES = { I: "Izquierda", D: "Derecha" };

// Las secciones bilaterales guardan "opcionId:I" / "opcionId:D".
export function isBilateral(zone) {
  return SECTIONS.some((s) => s.bilateral && s.zones.includes(zone));
}

// Opciones marcadas, con los lados (["I","D"]) en las secciones bilaterales.
export function selectedOptions(answers = {}) {
  const out = [];
  for (const o of ALL_OPTIONS) {
    const marked = answers[o.zone.id] || [];
    if (isBilateral(o.zone)) {
      const sides = Object.keys(SIDES).filter((k) => marked.includes(`${o.id}:${k}`));
      if (sides.length) out.push({ ...o, sides });
    } else if (marked.includes(o.id)) {
      out.push({ ...o, sides: null });
    }
  }
  return out;
}

export function optionLabel(o) {
  const sides = o.sides?.length ? ` (${o.sides.join(", ")})` : "";
  return `${o.zone.name}: ${o.name}${sides}`;
}
