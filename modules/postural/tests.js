// Protocolo de evaluación postural.
// Cada ítem se valora: 2 = correcto, 1 = desviación leve, 0 = desviación marcada.
// "weight" indica la importancia del ítem en la nota final.

export const SECTIONS = [
  {
    id: "lateral",
    title: "Vista lateral",
    intro:
      "De pie, descalzo y relajado, de perfil a la cámara o al evaluador. Imagina una plomada que cae desde la oreja.",
    items: [
      {
        id: "cabeza",
        name: "Cabeza adelantada",
        how: "La oreja debería quedar alineada con el hombro. Si la oreja está por delante del hombro, hay protracción cervical.",
        levels: ["Oreja más de 5 cm por delante del hombro", "Oreja 2-5 cm por delante", "Oreja alineada con el hombro"],
        weight: 1.2,
        fix: ["Retracciones cervicales (chin tucks) 3×12", "Estiramiento de pectoral en puerta 3×30 s", "Remo con banda a cara (face pull) 3×15"],
      },
      {
        id: "hombrosAdelantados",
        name: "Hombros adelantados",
        how: "El hombro debería quedar bajo la oreja. Si los nudillos miran al frente con los brazos relajados, los hombros están rotados hacia dentro.",
        levels: ["Hombros muy enrollados, nudillos al frente", "Ligeramente adelantados", "Hombros alineados, pulgares al frente"],
        weight: 1,
        fix: ["Estiramiento de pectoral 3×30 s", "Remo con banda 3×15", "Rotaciones externas con banda 3×15"],
      },
      {
        id: "cifosis",
        name: "Curvatura dorsal (cifosis)",
        how: "Observa la espalda alta. Una joroba marcada indica hipercifosis.",
        levels: ["Joroba muy marcada", "Algo redondeada", "Curva natural suave"],
        weight: 1.2,
        fix: ["Extensiones torácicas sobre foam roller 2×10", "Ángeles en la pared 3×10", "Remo con mancuerna 3×12"],
      },
      {
        id: "lordosis",
        name: "Curvatura lumbar (lordosis)",
        how: "Tumbado boca arriba con piernas estiradas, pasa la mano bajo la zona lumbar. Debe caber la mano plana, no el puño.",
        levels: ["Cabe el puño o la espalda queda totalmente plana", "Hueco algo mayor o menor que la mano", "Cabe la mano plana justa"],
        weight: 1.2,
        fix: ["Puente de glúteo 3×15", "Plancha frontal 3×30 s", "Estiramiento de flexores de cadera 3×30 s por lado"],
      },
      {
        id: "pelvis",
        name: "Inclinación de la pelvis",
        how: "De perfil, mira el cinturón: debe estar horizontal. Si baja por delante, anteversión; si baja por detrás, retroversión.",
        levels: ["Inclinación muy evidente", "Inclinación ligera", "Cinturón horizontal"],
        weight: 1.2,
        fix: ["Basculaciones pélvicas 2×15", "Puente de glúteo 3×15", "Dead bug 3×10"],
      },
      {
        id: "rodillaHiper",
        name: "Hiperextensión de rodillas",
        how: "De perfil, las rodillas no deberían quedar por detrás de la línea tobillo-cadera.",
        levels: ["Rodillas claramente hacia atrás", "Ligera hiperextensión", "Rodillas rectas, sin bloquear"],
        weight: 0.8,
        fix: ["Mantener ligera flexión al estar de pie", "Curl femoral 3×12", "Sentadilla a cajón controlada 3×10"],
      },
    ],
  },
  {
    id: "frontal",
    title: "Vista frontal y posterior",
    intro: "De frente y de espaldas, pies a la anchura de la cadera, brazos relajados.",
    items: [
      {
        id: "hombrosAltura",
        name: "Altura de los hombros",
        how: "Compara la altura de ambos hombros. Ayúdate de una línea horizontal en la foto.",
        levels: ["Diferencia de más de 2 cm", "Diferencia de 1-2 cm", "Hombros a la misma altura"],
        weight: 0.8,
        fix: ["Paseo del granjero con una mano 3×30 m por lado", "Estiramiento de trapecio del lado alto 3×30 s"],
      },
      {
        id: "pelvisAltura",
        name: "Altura de la pelvis",
        how: "Coloca los dedos en las crestas ilíacas (parte alta de la cadera) y compara su altura.",
        levels: ["Diferencia evidente", "Diferencia leve", "Misma altura"],
        weight: 1,
        fix: ["Plancha lateral 3×20 s por lado", "Puente a una pierna 3×10 por lado", "Revisar diferencia de longitud de piernas con un profesional"],
      },
      {
        id: "escapulas",
        name: "Escápulas aladas",
        how: "De espaldas, empuja una pared con los brazos estirados. Las escápulas no deberían despegarse de la espalda.",
        levels: ["Borde de la escápula muy despegado", "Se despega ligeramente", "Escápulas pegadas a las costillas"],
        weight: 0.8,
        fix: ["Flexiones escapulares (push-up plus) 3×12", "Ángeles en la pared 3×10", "Remo con banda 3×15"],
      },
      {
        id: "escoliosis",
        name: "Test de Adams (escoliosis)",
        how: "De espaldas, inclínate hacia delante con los brazos colgando. Observa si un lado de la espalda queda más alto (giba).",
        levels: ["Giba claramente visible", "Ligera asimetría", "Espalda simétrica"],
        weight: 1.2,
        fix: ["Consultar con un médico o fisioterapeuta si hay giba visible", "Plancha lateral 3×20 s", "Bird dog 3×10 por lado"],
      },
      {
        id: "rodillasEje",
        name: "Eje de las rodillas (valgo/varo)",
        how: "De frente, con los pies juntos. Si se tocan las rodillas pero no los tobillos, valgo; si se tocan los tobillos pero no las rodillas, varo.",
        levels: ["Separación de más de 5 cm", "Separación de 2-5 cm", "Rodillas y tobillos se tocan a la vez"],
        weight: 1,
        fix: ["Monster walk con banda 3×15 pasos", "Sentadilla con banda en rodillas 3×12", "Abducción de cadera tumbado 3×15"],
      },
      {
        id: "pies",
        name: "Pisada y arco del pie",
        how: "De espaldas, mira el tendón de Aquiles: debe ser vertical. Si se inclina hacia dentro y el arco desaparece, pie pronado/plano.",
        levels: ["Arco hundido o muy alto, Aquiles muy inclinado", "Ligera pronación o supinación", "Arco visible y Aquiles vertical"],
        weight: 0.8,
        fix: ["Short foot (pie corto) 3×10 s", "Elevaciones de talón 3×15", "Caminar descalzo sobre superficies seguras"],
      },
    ],
  },
  {
    id: "funcional",
    title: "Tests funcionales",
    intro: "Valoran cómo se comporta tu postura en movimiento.",
    items: [
      {
        id: "pared",
        name: "Test de la pared",
        how: "Apoya talones, glúteos, espalda alta y cabeza en la pared sin forzar. Intenta subir los brazos estirados hasta tocar la pared por encima de la cabeza.",
        levels: ["No puedes apoyar la cabeza o los brazos no se acercan a la pared", "Apoyas todo, pero los brazos no llegan o arqueas la lumbar", "Apoyas todo y los brazos tocan la pared"],
        weight: 1.2,
        fix: ["Ángeles en la pared 3×10", "Extensiones torácicas en foam roller 2×10", "Estiramiento de dorsal 3×30 s"],
      },
      {
        id: "sentadilla",
        name: "Sentadilla con brazos arriba",
        how: "Pies a la anchura de hombros, brazos estirados sobre la cabeza. Haz 5 sentadillas lentas. Observa si los pies giran, las rodillas van hacia dentro, el tronco cae hacia delante o los brazos bajan.",
        levels: ["2 o más compensaciones", "1 compensación", "Sin compensaciones"],
        weight: 1.5,
        fix: ["Sentadilla goblet a cajón 3×10", "Movilidad de tobillo contra pared 2×10 por lado", "Estiramiento de gemelo 3×30 s"],
      },
      {
        id: "thomas",
        name: "Test de Thomas (flexores de cadera)",
        how: "Sentado en el borde de una cama, túmbate abrazando una rodilla al pecho. La otra pierna debería quedar apoyada y colgando relajada.",
        levels: ["El muslo queda claramente elevado", "Queda algo elevado o la rodilla se estira", "El muslo apoya y la rodilla cae a 90°"],
        weight: 1,
        fix: ["Estiramiento de psoas en zancada 3×30 s por lado", "Estiramiento de cuádriceps 3×30 s", "Puente de glúteo 3×15"],
      },
      {
        id: "hombroMovilidad",
        name: "Movilidad de hombros",
        how: "Lleva una mano por encima del hombro y la otra por la espalda desde abajo, intentando juntar los puños. Repite cambiando de lado.",
        levels: ["Los puños quedan a más de un palmo", "Quedan a menos de un palmo", "Los puños se tocan o casi"],
        weight: 0.8,
        fix: ["Estiramiento de pectoral 3×30 s", "Sleeper stretch 3×30 s por lado", "Dislocaciones con palo o banda 2×10"],
      },
    ],
  },
];

export const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

export const MAX_POINTS = 10;

// Nota /10 (un decimal) a partir de las respuestas {itemId: 0|1|2}.
export function computeScore(answers) {
  let total = 0;
  let max = 0;
  for (const item of ALL_ITEMS) {
    const v = answers[item.id];
    if (v === undefined) continue;
    total += v * item.weight;
    max += 2 * item.weight;
  }
  return max ? Math.round((total / max) * MAX_POINTS * 10) / 10 : null;
}
