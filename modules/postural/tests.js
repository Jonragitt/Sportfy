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
          },
        ],
      },
      {
        id: "hombros",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Hombros",
        how: "El acromion debe quedar alineado con la oreja y la cadera.",
        options: [
          {
            id: "hombrosAntepulsion",
            name: "Antepulsión",
            hint: "Hombros adelantados y enrollados hacia dentro.",
          },
          {
            id: "hombrosRetropulsion",
            name: "Retropulsión",
            hint: "Hombros llevados hacia atrás por detrás de la línea.",
          },
        ],
      },
      {
        id: "cadera",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Cadera / pelvis",
        how: "Las espinas ilíacas anterior y posterior deben quedar casi a la misma altura (pelvis neutra).",
        options: [
          {
            id: "caderaAnteversion",
            name: "Anteversión",
            hint: "La pelvis bascula hacia delante y aumenta la curva lumbar.",
          },
          {
            id: "caderaRetroversion",
            name: "Retroversión",
            hint: "La pelvis bascula hacia atrás y la zona lumbar se aplana.",
          },
        ],
      },
      {
        id: "rodilla",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Rodilla",
        how: "La línea debe pasar ligeramente por delante del eje de la rodilla, sin bloquearla ni flexionarla.",
        options: [
          {
            id: "genuRecurvatum",
            name: "Genu recurvatum",
            hint: "Rodilla en hiperextensión, queda por detrás de la línea.",
          },
          {
            id: "genuFlexo",
            name: "Genu flexo",
            hint: "Rodilla flexionada en reposo, no llega a extender.",
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
        exclusive: true, // un solo hombro puede quedar más bajo
        name: "Hombros (acromion)",
        how: "Coloca los dedos en la punta de ambos hombros y compara su altura.",
        options: [
          {
            id: "acromionIzqBajo",
            name: "Izquierdo bajo",
            hint: "El hombro izquierdo queda más bajo que el derecho.",
          },
          {
            id: "acromionDerBajo",
            name: "Derecho bajo",
            hint: "El hombro derecho queda más bajo que el izquierdo.",
          },
        ],
      },
      {
        id: "escapulas",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Escápulas",
        how: "De espaldas, el borde interno de cada escápula debe quedar a unos 5-7 cm de la columna.",
        options: [
          {
            id: "escapulasAbduccion",
            name: "Abducción",
            hint: "Escápulas separadas de la columna, desplazadas hacia fuera.",
          },
          {
            id: "escapulasAduccion",
            name: "Aducción",
            hint: "Escápulas muy juntas, pegadas a la columna.",
          },
        ],
      },
      {
        id: "crestas",
        exclusive: true, // un solo lado de la pelvis puede quedar más alto
        name: "Pelvis (crestas ilíacas)",
        how: "Coloca las manos sobre la parte alta de la cadera y compara la altura de ambas crestas ilíacas.",
        options: [
          {
            id: "crestaIzqAlta",
            name: "Izquierdo alto",
            hint: "La cresta ilíaca izquierda queda más alta que la derecha.",
          },
          {
            id: "crestaDerAlta",
            name: "Derecho alto",
            hint: "La cresta ilíaca derecha queda más alta que la izquierda.",
          },
        ],
      },
      {
        id: "rodillaFrontal",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Rodillas",
        how: "De frente, con los pies juntos: deben tocarse a la vez rodillas y tobillos.",
        options: [
          {
            id: "genuValgo",
            name: "Valgo",
            hint: "Las rodillas se juntan hacia dentro y los tobillos quedan separados.",
          },
          {
            id: "genuVaro",
            name: "Varo",
            hint: "Los tobillos se tocan pero las rodillas quedan separadas.",
          },
        ],
      },
      {
        id: "tobillo",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Tobillos",
        how: "De espaldas, el tendón de Aquiles debe quedar vertical respecto al talón.",
        options: [
          {
            id: "tobilloEversion",
            name: "Eversión",
            hint: "El talón se inclina hacia fuera y el tobillo cae hacia dentro.",
          },
          {
            id: "tobilloInversion",
            name: "Inversión",
            hint: "El talón se inclina hacia dentro y el apoyo va al borde externo del pie.",
          },
        ],
      },
    ],
  },
  {
    id: "soh",
    title: "Sentadilla profunda (SOH)",
    bilateral: true,
    // Cómo se hace el test: imágenes propias que sustituyen a los ejemplos por opción.
    media: [
      { src: "ejercicios/soh-lateral.gif", alt: "Sentadilla profunda con brazos arriba vista de perfil, en bucle", caption: "Vista lateral", w: 380, h: 508 },
      { src: "ejercicios/soh-anterior.png", alt: "Secuencia de la sentadilla profunda vista de frente en cinco fases: bipedestación, inicio del descenso, descenso progresivo, sentadilla profunda y retorno", caption: "Vista anterior: fases del movimiento", w: 900, h: 937, wide: true },
    ],
    intro:
      "¿Por qué te pedimos esta sentadilla? Al bajar con los brazos arriba trabajan a la vez tobillos, rodillas, cadera, columna y hombros, y cualquier rigidez o debilidad sale a la luz en forma de compensación. Así puedes comprobar por ti mismo los defectos posturales que viste de pie: si tus pies se abren, tus rodillas se van hacia dentro o tu tronco se inclina, lo verás en tu propio movimiento. Marca en qué lado aparece cada compensación: I (izquierda) o D (derecha).",
    zones: [
      {
        id: "sohPies",
        // El arco no puede caer y quedar alto a la vez: solo una de las dos por lado.
        grupos: [["sohArcoCae", "sohPieCavo"]],
        name: "Pies",
        how: "Los pies deben quedar fijos, apuntando al frente y con el peso repartido por igual.",
        options: [
          {
            id: "sohPiesRotan",
            name: "Pies rotan hacia fuera o eleva talón",
            view: "Ant / Post",
            hint: "La punta del pie se abre o el talón se despega del suelo al bajar.",
          },
          {
            id: "sohArcoCae",
            name: "Caída del arco plantar",
            view: "Ant / Post",
            hint: "El arco se hunde y el tobillo cae hacia dentro al bajar.",
          },
          {
            id: "sohPieCavo",
            name: "Pie cavo",
            view: "Ant / Post",
            hint: "El arco se mantiene muy alto y el apoyo va al borde externo del pie.",
          },
          {
            id: "sohCargaAsimetrica",
            name: "Reparto asimétrico de carga",
            view: "Ant / Post",
            hint: "El peso se desplaza más hacia un pie. Marca el lado que carga más.",
          },
        ],
      },
      {
        id: "sohRodillas",
        exclusive: true, // alteraciones opuestas: solo se puede marcar una (por lado)
        name: "Rodillas",
        how: "Las rodillas deben seguir la línea de los pies, sin ir hacia dentro ni hacia fuera.",
        options: [
          {
            id: "sohValgo",
            name: "Valgo",
            view: "Ant",
            hint: "La rodilla se va hacia dentro al bajar.",
          },
          {
            id: "sohVaro",
            name: "Varo",
            view: "Ant",
            hint: "La rodilla se abre hacia fuera al bajar.",
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
          },
          {
            id: "sohHiperlordosis",
            name: "Hiperlordosis lumbar",
            view: "Lat",
            hint: "La zona lumbar se arquea en exceso al bajar.",
          },
          {
            id: "sohRetroversion",
            name: "Retroversión pélvica precoz",
            view: "Lat",
            hint: "La pelvis se mete hacia dentro (butt wink) antes de llegar abajo.",
          },
        ],
      },
    ],
  },
  {
    id: "slb",
    title: "Puente de cadera a una pierna (SLB)",
    bilateral: true,
    // Cómo se hace el test: imágenes propias que sustituyen a los ejemplos por opción.
    media: [
      { src: "ejercicios/slb-lateral.gif", alt: "Puente de cadera a una pierna visto de perfil, en bucle", caption: "Vista lateral", w: 380, h: 508 },
      { src: "ejercicios/slb-fases.png", alt: "Fases del puente a una pierna: posición inicial, inicio de la elevación, elevación progresiva, puente completo y retorno controlado", caption: "Fases del movimiento", w: 900, h: 1260, wide: true },
    ],
    intro:
      "¿Por qué te pedimos este puente? Al sostener la cadera con una sola pierna se ve si tu glúteo hace bien su trabajo o si lo compensan los isquiotibiales o la zona lumbar, y si eres capaz de mantener la pelvis nivelada. Así puedes comprobar por ti mismo si tu glúteo está débil o si un lado controla peor que el otro, algo que de pie no siempre se aprecia. Marca el lado de la pierna de apoyo: I (izquierda) o D (derecha).",
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
          },
          {
            id: "slbRotacion",
            name: "Rotación de la pelvis",
            view: "Ant",
            hint: "La pelvis gira hacia un lado en lugar de subir recta.",
          },
          {
            id: "slbLumbar",
            name: "Compensación lumbar",
            view: "Lat",
            hint: "Sube arqueando la zona lumbar en lugar de extender la cadera.",
          },
          {
            id: "slbIsquios",
            name: "Dominancia de isquiotibiales",
            view: "Lat",
            hint: "Siente el esfuerzo (o calambre) detrás del muslo en lugar del glúteo, o no llega a la altura.",
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
      "¿Por qué te pedimos el wall angel? Con la espalda contra la pared no puedes hacer trampas: si tus hombros, tu espalda alta o tus escápulas están rígidos, los brazos se despegan o la zona lumbar se arquea. Así puedes comprobar por ti mismo si los hombros adelantados o la espalda encorvada que viste de pie te limitan al levantar los brazos. Marca el lado en que aparece cada compensación.",
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
          },
          {
            id: "waCompensacion",
            name: "Movimiento compensado lumbar / dorsal",
            view: "Lat",
            hint: "Arquea la zona lumbar o despega la espalda alta para poder subir los brazos.",
          },
        ],
      },
    ],
  },
  {
    id: "lunge",
    title: "Lunge test / dorsiflexión (10 cm)",
    bilateral: true,
    intro:
      "¿Por qué te pedimos este test? Mide cuánto se dobla tu tobillo, y un tobillo rígido es una de las causas más frecuentes de que las rodillas se vayan hacia dentro, los talones se levanten o el tronco se incline al hacer sentadillas. Así puedes comprobar por ti mismo si el origen de esas compensaciones está en tus tobillos y si un lado está peor que el otro. Marca el resultado de cada lado.",
    zones: [
      {
        id: "lungeDorsi",
        name: "Dorsiflexión de tobillo",
        how: "Se marca un resultado por lado. Negativo = la rodilla toca la pared a 10 cm con el talón apoyado.",
        exclusive: true,
        colLabel: "Resultado",
        options: [
          {
            id: "lungePositivo",
            name: "Positivo",
            view: "Lat",
            hint: "La rodilla no llega a la pared o el talón se despega: dorsiflexión limitada.",
          },
          {
            id: "lungeNegativo",
            name: "Negativo",
            view: "Lat",
            normal: true,
            hint: "La rodilla toca la pared sin levantar el talón: dorsiflexión correcta.",
          },
        ],
      },
    ],
  },
];

export const ALL_ZONES = SECTIONS.flatMap((s) => s.zones);
export const ALL_OPTIONS = ALL_ZONES.flatMap((z) => z.options.map((o) => ({ ...o, zone: z })));

// Opciones con "normal: true" (p. ej. test negativo) se registran pero no cuentan como alteración.
function isAltered(zone, answers) {
  return (answers[zone.id] || []).some((v) => {
    const opt = zone.options.find((o) => o.id === v.split(":")[0]);
    return opt && !opt.normal;
  });
}

// answers: { zonaId: [opcionId, ...] }. Nota /10 (un decimal):
// cada zona sin alteraciones suma lo mismo.
export function computeScore(answers = {}) {
  if (!ALL_ZONES.length) return null;
  const ok = ALL_ZONES.filter((z) => !isAltered(z, answers)).length;
  return Math.round((ok / ALL_ZONES.length) * MAX_POINTS * 10) / 10;
}

export const SIDES = { I: "Izquierda", D: "Derecha" };

// Las secciones bilaterales guardan "opcionId:I" / "opcionId:D".
export function isBilateral(zone) {
  return SECTIONS.some((s) => s.bilateral && s.zones.includes(zone));
}

export function alteredZoneCount(answers = {}) {
  return ALL_ZONES.filter((z) => isAltered(z, answers)).length;
}

// Alteraciones marcadas, con los lados (["I","D"]) en las secciones bilaterales.
export function selectedOptions(answers = {}) {
  const out = [];
  for (const o of ALL_OPTIONS) {
    if (o.normal) continue;
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
