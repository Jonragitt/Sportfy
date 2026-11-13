// Motor de rutinas de Forty5: genera la rutina semanal de gimnasio a partir del
// perfil de la evaluación (objetivo, nivel, patrones posturales, lado débil) y
// de las preferencias de la persona (días, minutos por sesión y material).
//
// Criterio de entrenador personal:
//  - Reparto por días según disponibilidad (full body, torso/pierna, PPL…).
//  - Cada hueco de la sesión es un patrón de movimiento (sentadilla, bisagra,
//    empuje, tirón…) y se elige el ejercicio con mejor puntuación según material,
//    nivel, objetivo y postura (premia los que corrigen y penaliza los que
//    agravan un patrón postural).
//  - Series, repeticiones, RIR y descansos por objetivo y tipo de ejercicio.
//  - Periodización en ciclos de 4 semanas (acumulación → intensificación →
//    descarga) y recorte de accesorios si la sesión no cabe en el tiempo.
// Módulo puro (sin DOM) para testearlo con `node --test`.

export const MATERIAL = {
  gimnasio: { nombre: "Gimnasio completo", incluye: ["gym", "mancuernas", "casa"] },
  mancuernas: { nombre: "Mancuernas y bandas en casa", incluye: ["mancuernas", "casa"] },
  casa: { nombre: "En casa (peso corporal y bandas)", incluye: ["casa"] },
};

// ---------- Base de ejercicios ----------
// hueco: patrón de movimiento · eq: material · nivel 1–2 · tipo: principal | compuesto | aislamiento | core
// corrige: patrones posturales que mejora · evita: patrones que puede agravar · uni: unilateral
const E = (id, nombre, hueco, eq, nivel, tipo, grupo, tecnica, extra = {}) => ({ id, nombre, hueco, eq, nivel, tipo, grupo, tecnica, corrige: [], evita: [], uni: false, ...extra });

export const EJERCICIOS = [
  // Sentadilla (dominante de rodilla)
  E("sentadillaBarra", "Sentadilla con barra", "sentadilla", ["gym"], 2, "principal", "piernas", "Pies a la anchura de hombros, rodillas en la línea de los pies y espalda neutra.", { evita: ["rodillasDentro", "retroversion"] }),
  E("sentadillaGoblet", "Sentadilla goblet", "sentadilla", ["gym", "mancuernas"], 1, "principal", "piernas", "Mancuerna pegada al pecho, tronco erguido y rodillas hacia fuera.", { corrige: ["rodillasDentro", "cruzadoInferior"] }),
  E("sentadillaTalones", "Sentadilla con talones elevados", "sentadilla", ["gym", "mancuernas"], 1, "principal", "piernas", "Talones sobre un disco o cuña: compensa la falta de movilidad de tobillo.", { corrige: ["rodillasDentro", "retroversion"] }),
  E("sentadillaCajonBanda", "Sentadilla al cajón con banda en rodillas", "sentadilla", ["gym"], 1, "principal", "piernas", "Empuja la banda hacia fuera durante todo el recorrido y siéntate controlado.", { corrige: ["rodillasDentro", "gluteoDebil"] }),
  E("sentadillaSumo", "Sentadilla sumo con mancuerna", "sentadilla", ["gym", "mancuernas"], 1, "compuesto", "piernas", "Pies abiertos y puntas hacia fuera; trabaja aductores.", { corrige: ["rodillasFuera"] }),
  E("prensa", "Prensa de piernas", "sentadilla", ["gym"], 1, "compuesto", "piernas", "Baja hasta donde la zona lumbar no se despegue del respaldo.", { corrige: ["asimetria"] }),
  E("hackSquat", "Sentadilla hack", "sentadilla", ["gym"], 2, "principal", "piernas", "Pies adelantados para más glúteo, centrados para más cuádriceps."),
  E("sentadillaPC", "Sentadilla con peso corporal (tempo 3-1-1)", "sentadilla", ["casa"], 1, "principal", "piernas", "Baja en 3 segundos, pausa 1 y sube con fuerza.", { corrige: ["rodillasDentro"] }),
  // Bisagra de cadera
  E("pmrBarra", "Peso muerto rumano con barra", "bisagra", ["gym"], 2, "principal", "isquios", "Cadera atrás, barra pegada a las piernas y espalda neutra; para cuando notes los isquios.", { corrige: ["retroversion"] }),
  E("pmrMancuernas", "Peso muerto rumano con mancuernas", "bisagra", ["gym", "mancuernas"], 1, "principal", "isquios", "Cadera atrás y mancuernas cerca de las piernas.", { corrige: ["retroversion"] }),
  E("hipThrust", "Hip thrust con barra", "bisagra", ["gym"], 1, "principal", "gluteo", "Barbilla al pecho, costillas abajo y bloquea apretando glúteo sin arquear la zona lumbar.", { corrige: ["cruzadoInferior", "gluteoDebil", "rodillasDentro"] }),
  E("pesoMuerto", "Peso muerto convencional", "bisagra", ["gym"], 2, "principal", "isquios", "Empuja el suelo con las piernas, barra pegada y espalda neutra.", { evita: ["cruzadoInferior", "asimetria"] }),
  E("puenteGluteo", "Puente de glúteo con pausa", "bisagra", ["casa", "mancuernas"], 1, "principal", "gluteo", "Pausa de 2 s arriba apretando glúteo, sin arquear la zona lumbar.", { corrige: ["cruzadoInferior", "gluteoDebil"] }),
  // Unilateral de pierna
  E("bulgara", "Sentadilla búlgara", "unilateral", ["gym", "mancuernas", "casa"], 2, "compuesto", "piernas", "Pie trasero en un banco, rodilla delantera alineada con el pie.", { uni: true, corrige: ["asimetria", "rodillasDentro"] }),
  E("zancadaAtras", "Zancada hacia atrás", "unilateral", ["gym", "mancuernas", "casa"], 1, "compuesto", "piernas", "Paso largo atrás y rodilla delantera estable, sin irse hacia dentro.", { uni: true, corrige: ["asimetria"] }),
  E("stepUp", "Subida al cajón (step-up)", "unilateral", ["gym", "mancuernas", "casa"], 1, "compuesto", "piernas", "Empuja con la pierna de arriba sin impulsarte con la de abajo.", { uni: true, corrige: ["asimetria"], evita: ["rodillasDentro"] }),
  E("puenteUnaPierna", "Puente de glúteo a una pierna", "unilateral", ["casa", "mancuernas", "gym"], 1, "compuesto", "gluteo", "Pelvis nivelada: que no caiga ni rote hacia el lado libre.", { uni: true, corrige: ["asimetria", "gluteoDebil"] }),
  // Empuje horizontal
  E("pressBanca", "Press banca con barra", "empujeH", ["gym"], 2, "principal", "pecho", "Escápulas juntas y abajo, pies firmes y baja la barra a la parte baja del pecho.", { evita: ["cruzadoSuperior"] }),
  E("pressMancuernas", "Press banca con mancuernas", "empujeH", ["gym", "mancuernas"], 1, "principal", "pecho", "Codos a unos 45° del cuerpo y escápulas retraídas.", { corrige: ["asimetria"] }),
  E("pressInclinado", "Press inclinado con mancuernas", "empujeH", ["gym", "mancuernas"], 1, "compuesto", "pecho", "Banco a 30°, recorrido completo controlado.", { corrige: ["hombrosAtras"] }),
  E("flexiones", "Flexiones", "empujeH", ["casa", "mancuernas", "gym"], 1, "principal", "pecho", "Cuerpo en bloque, codos a 45° y pecho al suelo. Si cuestan, con manos elevadas."),
  E("pushUpPlus", "Flexiones con protracción (push-up plus)", "empujeH", ["casa", "mancuernas", "gym"], 1, "compuesto", "pecho", "Al final de cada flexión, separa las escápulas empujando el suelo.", { corrige: ["hombrosAtras", "cruzadoSuperior"] }),
  // Empuje vertical
  E("pressMilitar", "Press militar con mancuernas sentado", "empujeV", ["gym", "mancuernas"], 1, "compuesto", "hombro", "Costillas abajo, sin arquear la zona lumbar.", { evita: ["cruzadoSuperior", "cruzadoInferior"] }),
  E("landmine", "Press landmine a una mano", "empujeV", ["gym"], 1, "compuesto", "hombro", "Empuje en diagonal: más amable para hombros con poca movilidad.", { uni: true, corrige: ["cruzadoSuperior", "asimetria"] }),
  E("pikePushUp", "Flexiones pica (pike push-up)", "empujeV", ["casa", "mancuernas", "gym"], 2, "compuesto", "hombro", "Cadera alta y cabeza entre las manos al bajar.", { evita: ["cruzadoSuperior"] }),
  E("pressArnold", "Press Arnold", "empujeV", ["gym", "mancuernas"], 2, "compuesto", "hombro", "Rotación controlada; solo con buena movilidad de hombro.", { evita: ["cruzadoSuperior"] }),
  // Tirón horizontal
  E("remoMancuerna", "Remo con mancuerna a una mano", "tironH", ["gym", "mancuernas"], 1, "principal", "espalda", "Lleva el codo hacia la cadera y junta la escápula al final.", { uni: true, corrige: ["cruzadoSuperior", "asimetria"] }),
  E("remoPolea", "Remo en polea sentado", "tironH", ["gym"], 1, "principal", "espalda", "Pecho alto, tira con los codos y junta las escápulas.", { corrige: ["cruzadoSuperior"] }),
  E("remoBarra", "Remo con barra inclinado", "tironH", ["gym"], 2, "principal", "espalda", "Tronco a 45°, espalda neutra y barra al abdomen.", { evita: ["cruzadoInferior", "retroversion"] }),
  E("remoPechoApoyado", "Remo con pecho apoyado en banco inclinado", "tironH", ["gym", "mancuernas"], 1, "compuesto", "espalda", "Pecho en el banco: sin carga para la zona lumbar.", { corrige: ["cruzadoSuperior", "cruzadoInferior"] }),
  E("remoInvertido", "Remo invertido (bajo una mesa o barra)", "tironH", ["casa", "mancuernas", "gym"], 1, "principal", "espalda", "Cuerpo recto y pecho a la barra.", { corrige: ["cruzadoSuperior"] }),
  E("remoBanda", "Remo con banda elástica", "tironH", ["casa", "mancuernas"], 1, "compuesto", "espalda", "Pausa de 1 s con las escápulas juntas.", { corrige: ["cruzadoSuperior"] }),
  // Tirón vertical
  E("jalon", "Jalón al pecho", "tironV", ["gym"], 1, "principal", "espalda", "Pecho alto, baja la barra a la clavícula llevando los codos abajo.", { corrige: ["cruzadoSuperior"] }),
  E("dominadas", "Dominadas", "tironV", ["gym"], 2, "principal", "espalda", "Desde brazos estirados hasta barbilla sobre la barra, sin balanceo."),
  E("dominadasAsistidas", "Dominadas asistidas (máquina o banda)", "tironV", ["gym"], 1, "principal", "espalda", "Recorrido completo y bajada lenta."),
  E("jalonBanda", "Jalón con banda elástica", "tironV", ["casa", "mancuernas"], 1, "compuesto", "espalda", "Banda anclada arriba, codos hacia los bolsillos."),
  E("pulloverMancuerna", "Pullover con mancuerna", "tironV", ["mancuernas", "gym"], 1, "compuesto", "espalda", "Costillas abajo, sin arquear la zona lumbar.", { evita: ["cruzadoInferior"] }),
  // Hombro posterior y escápulas
  E("facePull", "Face pull", "hombroPost", ["gym"], 1, "aislamiento", "hombro", "Tira a la altura de los ojos separando las manos y rotando hacia fuera.", { corrige: ["cruzadoSuperior"] }),
  E("ytw", "Y-T-W en banco inclinado", "hombroPost", ["gym", "mancuernas"], 1, "aislamiento", "hombro", "Peso ligero, pulgares arriba y escápulas abajo.", { corrige: ["cruzadoSuperior"] }),
  E("pajaros", "Pájaros (elevaciones posteriores)", "hombroPost", ["gym", "mancuernas"], 1, "aislamiento", "hombro", "Codos ligeramente flexionados y sin impulso."),
  E("bandPullApart", "Aperturas con banda (band pull-apart)", "hombroPost", ["casa", "mancuernas", "gym"], 1, "aislamiento", "hombro", "Brazos estirados, junta las escápulas sin subir los hombros.", { corrige: ["cruzadoSuperior"] }),
  E("serratoPolea", "Puñetazo de serrato en polea", "hombroPost", ["gym"], 1, "aislamiento", "hombro", "Empuja hacia delante separando la escápula.", { corrige: ["hombrosAtras"] }),
  // Glúteo medio / aductores
  E("monsterWalk", "Monster walk con banda", "gluteoMedio", ["casa", "mancuernas", "gym"], 1, "aislamiento", "gluteo", "Semisentadilla y pasos laterales sin que las rodillas se junten.", { corrige: ["rodillasDentro", "gluteoDebil", "asimetria"] }),
  E("abduccionMaquina", "Abducción de cadera en máquina", "gluteoMedio", ["gym"], 1, "aislamiento", "gluteo", "Tronco ligeramente inclinado adelante para más glúteo.", { corrige: ["rodillasDentro", "gluteoDebil"] }),
  E("clamshell", "Clamshell con banda", "gluteoMedio", ["casa", "mancuernas", "gym"], 1, "aislamiento", "gluteo", "Pelvis quieta: solo se abre la rodilla.", { corrige: ["rodillasDentro", "gluteoDebil"] }),
  E("aductores", "Aductores en máquina o con banda", "gluteoMedio", ["gym", "mancuernas"], 1, "aislamiento", "piernas", "Recorrido controlado, sin rebotes.", { corrige: ["rodillasFuera"] }),
  // Isquios / cuádriceps aislamiento
  E("curlFemoral", "Curl femoral en máquina", "isquio", ["gym"], 1, "aislamiento", "isquios", "Cadera pegada al banco y bajada lenta."),
  E("nordico", "Curl nórdico asistido", "isquio", ["casa", "mancuernas", "gym"], 2, "aislamiento", "isquios", "Baja lo más lento posible y ayúdate con las manos para subir."),
  E("extensionCuad", "Extensión de cuádriceps", "cuadriceps", ["gym"], 1, "aislamiento", "piernas", "Pausa de 1 s arriba."),
  E("sissy", "Sentadilla española con banda", "cuadriceps", ["casa", "mancuernas", "gym"], 1, "aislamiento", "piernas", "Banda detrás de las rodillas; tronco recto.", { corrige: ["rodillasDentro"] }),
  // Gemelo
  E("gemelo", "Elevación de talones de pie (pausa abajo)", "gemelo", ["casa", "mancuernas", "gym"], 1, "aislamiento", "gemelo", "Pausa de 2 s abajo estirando y sube sin que el tobillo se vaya hacia fuera.", { corrige: ["rodillasDentro", "rodillasFuera"] }),
  // Core
  E("deadBug", "Dead bug", "core", ["casa", "mancuernas", "gym"], 1, "core", "core", "Zona lumbar pegada al suelo todo el tiempo.", { corrige: ["cruzadoInferior"] }),
  E("plancha", "Plancha frontal con retroversión", "core", ["casa", "mancuernas", "gym"], 1, "core", "core", "Mete la pelvis y aprieta glúteos: no dejes caer la cadera.", { corrige: ["cruzadoInferior"] }),
  E("birdDog", "Bird dog", "core", ["casa", "mancuernas", "gym"], 1, "core", "core", "Brazo y pierna contrarios sin rotar la pelvis.", { corrige: ["retroversion", "asimetria"] }),
  E("pallof", "Press Pallof", "core", ["gym", "mancuernas", "casa"], 1, "core", "core", "Resiste la rotación: el tronco no se mueve.", { corrige: ["asimetria"] }),
  E("planchaLateral", "Plancha lateral", "core", ["casa", "mancuernas", "gym"], 1, "core", "core", "Cuerpo en línea; empieza por tu lado débil.", { uni: true, corrige: ["asimetria"] }),
  E("granjero", "Paseo del granjero a una mano", "core", ["gym", "mancuernas"], 1, "core", "core", "Camina erguido sin inclinarte hacia el peso.", { uni: true, corrige: ["asimetria"] }),
  E("ruedaAbdominal", "Rueda abdominal", "core", ["gym", "mancuernas", "casa"], 2, "core", "core", "Solo hasta donde no se arquee la zona lumbar.", { evita: ["cruzadoInferior"] }),
  // Brazos
  E("curlBiceps", "Curl de bíceps con mancuernas", "biceps", ["gym", "mancuernas"], 1, "aislamiento", "brazos", "Codos quietos pegados al cuerpo."),
  E("curlBanda", "Curl de bíceps con banda", "biceps", ["casa"], 1, "aislamiento", "brazos", "Pausa arriba, bajada lenta."),
  E("tricepsPolea", "Extensión de tríceps en polea", "triceps", ["gym"], 1, "aislamiento", "brazos", "Codos fijos a los lados."),
  E("fondosBanco", "Fondos en banco", "triceps", ["casa", "mancuernas"], 1, "aislamiento", "brazos", "Hombros abajo; baja solo hasta 90° de codo.", { evita: ["cruzadoSuperior"] }),
  E("tricepsMancuerna", "Extensión de tríceps con mancuerna tumbado", "triceps", ["mancuernas", "gym"], 1, "aislamiento", "brazos", "Codos apuntando al techo."),
];

// ---------- Plantillas de sesión y repartos ----------
// Cada hueco: [patrón de movimiento, opcional (se recorta si falta tiempo)]
export const SESIONES = {
  fullA: { nombre: "Cuerpo completo A", huecos: [["sentadilla"], ["empujeH"], ["tironV"], ["bisagra"], ["hombroPost", true], ["core", true]] },
  fullB: { nombre: "Cuerpo completo B", huecos: [["bisagra"], ["tironH"], ["empujeV"], ["unilateral"], ["gluteoMedio", true], ["core", true]] },
  fullC: { nombre: "Cuerpo completo C", huecos: [["sentadilla"], ["tironH"], ["empujeH"], ["unilateral"], ["gemelo", true], ["core", true]] },
  torso: { nombre: "Torso", huecos: [["empujeH"], ["tironH"], ["empujeV"], ["tironV"], ["hombroPost", true], ["biceps", true], ["triceps", true]] },
  pierna: { nombre: "Pierna", huecos: [["sentadilla"], ["bisagra"], ["unilateral"], ["isquio", true], ["gluteoMedio", true], ["gemelo", true], ["core", true]] },
  empuje: { nombre: "Empuje (pecho, hombro, tríceps)", huecos: [["empujeH"], ["empujeV"], ["empujeH"], ["hombroPost", true], ["triceps", true], ["core", true]] },
  tiron: { nombre: "Tirón (espalda, bíceps)", huecos: [["tironV"], ["tironH"], ["tironH"], ["hombroPost", true], ["biceps", true], ["core", true]] },
};
export const REPARTOS = {
  1: { nombre: "Cuerpo completo 1 día", dias: ["fullA"] },
  2: { nombre: "Cuerpo completo 2 días", dias: ["fullA", "fullB"] },
  3: { nombre: "Cuerpo completo 3 días", dias: ["fullA", "fullB", "fullC"] },
  4: { nombre: "Torso / Pierna", dias: ["torso", "pierna", "torso", "pierna"] },
  5: { nombre: "Torso / Pierna + Empuje / Tirón / Pierna", dias: ["torso", "pierna", "empuje", "tiron", "pierna"] },
  6: { nombre: "Empuje / Tirón / Pierna ×2", dias: ["empuje", "tiron", "pierna", "empuje", "tiron", "pierna"] },
};

// Si se entrena 2 días seguidos con 2 días a la semana, mejor torso/pierna que dos cuerpos completos.
const REPARTO_2_SEGUIDOS = { nombre: "Torso / Pierna 2 días", dias: ["torso", "pierna"] };
const REGION = { fullA: "full", fullB: "full", fullC: "full", torso: "torso", pierna: "pierna", empuje: "empuje", tiron: "tiron" };

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Zonas del cuerpo a las que dar más atención.
export const FOCOS = {
  ninguno: { nombre: "Ninguno en específico" },
  brazo: { nombre: "Brazo", grupos: ["brazos"], huecos: ["biceps", "triceps"], regiones: ["torso", "empuje", "tiron", "full"] },
  hombro: { nombre: "Hombro", grupos: ["hombro"], huecos: ["empujeV", "hombroPost"], regiones: ["torso", "empuje", "full"] },
  espalda: { nombre: "Espalda", grupos: ["espalda"], huecos: ["tironV", "tironH"], regiones: ["torso", "tiron", "full"] },
  abdomen: { nombre: "Abdomen", grupos: ["core"], huecos: ["core"], regiones: ["torso", "pierna", "empuje", "tiron", "full"] },
  pecho: { nombre: "Pecho", grupos: ["pecho"], huecos: ["empujeH"], regiones: ["torso", "empuje", "full"] },
  gluteo: { nombre: "Glúteo", grupos: ["gluteo"], huecos: ["gluteoMedio", "bisagra"], regiones: ["pierna", "full"] },
  pierna: { nombre: "Pierna", grupos: ["piernas", "isquios", "gemelo"], huecos: ["cuadriceps", "isquio"], regiones: ["pierna", "full"] },
};

// Condiciones de salud: ejercicios a evitar o preferir, RIR mínimo, cardio y avisos.
// Tiempo que llevas sin ir al gimnasio: tras un parón largo se empieza como principiante
// y sin apurar las series (más repeticiones en recámara) para readaptar músculos y tendones.
export const PARADA = {
  entrenando: { nombre: "Entreno ahora", rirExtra: 0 },
  menos3m: { nombre: "Menos de 3 meses", rirExtra: 0, consejo: "Llevas poco sin entrenar: la primera semana usa algo menos de peso del que movías y en 2–3 semanas estarás como antes." },
  de3a12m: { nombre: "De 3 a 12 meses", rirExtra: 1, consejo: "Vuelves tras unos meses parado: las 2 primeras semanas deja 1 repetición más en recámara y sube el peso poco a poco. Recuperarás la fuerza antes de lo que crees." },
  masAno: { nombre: "Más de 1 año", rirExtra: 1, principiante: true, consejo: "Tras más de un año sin entrenar empiezas como principiante: técnica primero y cargas cómodas las primeras 3–4 semanas para que tendones y articulaciones se readapten." },
  nunca: { nombre: "Nunca he ido", rirExtra: 1, principiante: true, consejo: "Es tu primera vez en el gimnasio: aprende bien la técnica de cada ejercicio con poco peso y pide ayuda en sala si dudas. Lo importante estas semanas es la constancia." },
};

export const CONDICIONES = {
  ninguna: { nombre: "Ninguna" },
  lumbar: { nombre: "Dolor lumbar o hernia discal", evita: ["pesoMuerto", "remoBarra", "sentadillaBarra", "ruedaAbdominal", "pmrBarra", "pressMilitar", "hackSquat", "pulloverMancuerna"], prefiere: ["remoPechoApoyado", "hipThrust", "prensa", "deadBug", "birdDog", "sentadillaGoblet", "pallof"], aviso: "Nada de flexión de columna con carga: prioriza la estabilidad del core. Si el dolor baja a la pierna, consulta con un fisioterapeuta." },
  rodilla: { nombre: "Dolor o lesión de rodilla", evita: ["sissy", "nordico", "bulgara", "stepUp", "sentadillaBarra", "hackSquat", "extensionCuad", "sentadillaPC"], prefiere: ["sentadillaCajonBanda", "hipThrust", "prensa", "puenteGluteo", "curlFemoral"], bajoImpacto: true, aviso: "Trabaja sin dolor (como mucho 3 sobre 10) y en rangos controlados." },
  hombro: { nombre: "Dolor o lesión de hombro", evita: ["pressMilitar", "pikePushUp", "pressArnold", "fondosBanco", "pressBanca", "dominadas", "pulloverMancuerna"], prefiere: ["landmine", "pressMancuernas", "remoPolea", "facePull", "remoPechoApoyado"], aviso: "Evita empujes por encima de la cabeza y cualquier rango que duela." },
  cervical: { nombre: "Dolor cervical", evita: ["pressMilitar", "pikePushUp", "pressArnold"], prefiere: ["facePull", "ytw", "remoPechoApoyado"], aviso: "Cuello neutro y sin encoger los hombros al tirar o cargar." },
  hipertension: { nombre: "Hipertensión", rirMin: 2, sinHIIT: true, aviso: "No bloquees la respiración (exhala al subir el peso) y no llegues al fallo. Mantén el control médico de tu tensión." },
  diabetes: { nombre: "Diabetes", aviso: "Controla tu glucosa antes y después de entrenar y lleva algo de azúcar rápido. Moverte después de las comidas ayuda a controlarla." },
  cardiaco: { nombre: "Problema cardíaco", rirMin: 3, sinHIIT: true, medico: true, aviso: "Necesitas el visto bueno de tu cardiólogo antes de empezar. Intensidad moderada y nada de esfuerzos máximos." },
  asma: { nombre: "Asma", aviso: "Calienta 10 minutos, ten el inhalador a mano y evita el cardio intenso en ambientes fríos." },
  embarazo: { nombre: "Embarazo", rirMin: 3, sinHIIT: true, medico: true, bajoImpacto: true, sinDeficit: true, evita: ["ruedaAbdominal", "pesoMuerto", "sentadillaBarra", "dominadas", "pressBanca", "pressMancuernas", "tricepsMancuerna", "deadBug", "plancha", "hackSquat"], prefiere: ["pressInclinado", "birdDog", "pallof", "remoPolea", "sentadillaGoblet"], aviso: "Siempre con el visto bueno de tu ginecólogo/a. Evita tumbarte boca arriba a partir del 2.º trimestre, el calor excesivo, los saltos y los ejercicios con riesgo de caída. Tu plan no aplica déficit calórico." },
  postparto: { nombre: "Postparto (menos de un año)", rirMin: 2, medico: true, evita: ["ruedaAbdominal", "pesoMuerto", "sentadillaBarra", "nordico"], prefiere: ["deadBug", "birdDog", "puenteGluteo", "pallof"], bajoImpacto: true, aviso: "Empieza por suelo pélvico y core profundo, y haz una revisión de suelo pélvico y diástasis antes de cargar peso o correr." },
  osteoporosis: { nombre: "Osteoporosis u osteopenia", evita: ["ruedaAbdominal", "pesoMuerto", "pulloverMancuerna"], prefiere: ["sentadillaGoblet", "prensa", "hipThrust", "remoPechoApoyado"], aviso: "La fuerza es tu mejor aliada para los huesos: evita doblar la columna con carga y los giros forzados." },
  artrosis: { nombre: "Artrosis", rirMin: 2, bajoImpacto: true, evita: ["nordico", "sissy"], aviso: "Muévete sin dolor y con rangos cómodos; el cardio, mejor de bajo impacto." },
};

// Repeticiones por objetivo y tipo de ejercicio.
export const REPS = {
  perdidaGrasa: { principal: "8–10", compuesto: "10–12", aislamiento: "12–15", core: "30–40 s" },
  recomposicion: { principal: "6–8", compuesto: "8–12", aislamiento: "10–15", core: "30–45 s" },
  ganarMusculo: { principal: "6–8", compuesto: "8–10", aislamiento: "10–12", core: "30–45 s" },
  rendimiento: { principal: "4–6", compuesto: "6–10", aislamiento: "10–12", core: "40–60 s" },
};
const DESCANSO = { principal: [120, 180], compuesto: [90, 120], aislamiento: [60, 75], core: [45, 60] };

// Ciclo de 4 semanas: el RIR baja y la 4.ª es de descarga.
export const SEMANAS = [
  { n: 1, nombre: "Adaptación", rir: 3, series: 0, nota: "Técnica impecable y cargas cómodas: deja 3 repeticiones en recámara." },
  { n: 2, nombre: "Acumulación", rir: 2, series: 0, nota: "Sube la carga si completaste todas las repeticiones la semana pasada." },
  { n: 3, nombre: "Intensificación", rir: 1, series: 1, nota: "Semana más dura: una serie más en los ejercicios principales y cerca del fallo técnico." },
  { n: 4, nombre: "Descarga", rir: 4, series: -1, nota: "Menos series y carga ligera para recuperar y volver más fuerte al siguiente ciclo." },
];

// Si no hay ejercicio posible para un hueco (por material o nivel), se usa este.
const ALTERNATIVA = { empujeV: "empujeH", tironV: "tironH", isquio: "bisagra", cuadriceps: "unilateral", triceps: "empujeH", biceps: "tironH" };

// Calentamiento general según los patrones posturales.
const MOVILIDAD_BASE = ["Movilidad de cadera (90/90)", "Rotaciones torácicas en cuadrupedia"];

// ---------- Selección de ejercicios ----------

/** Puntúa un ejercicio para la persona (más alto = mejor). */
export function puntuar(ej, ctx) {
  if (!ej.eq.some((m) => ctx.material.includes(m))) return -Infinity;
  if (ej.nivel > ctx.nivelNum) return -Infinity;
  if (ctx.evitar?.has(ej.id)) return -Infinity;
  let p = 10;
  if (ctx.prefiere?.has(ej.id)) p += 3;
  if (ctx.focoGrupos?.has(ej.grupo)) p += 2;
  for (const c of ej.corrige) if (ctx.patrones.has(c)) p += 4;
  for (const c of ej.evita) if (ctx.patrones.has(c)) p -= 8;
  if (ej.uni && ctx.patrones.has("asimetria")) p += 2;
  // Con más nivel se prefieren los básicos con barra (más carga progresable).
  if (ctx.nivelNum === 2 && ej.nivel === 2 && ej.tipo === "principal") p += 3;
  // Para ganar músculo o rendimiento, ejercicios más cargables en gimnasio.
  if ((ctx.objetivo === "ganarMusculo" || ctx.objetivo === "rendimiento") && ej.eq[0] === "gym") p += 1;
  // Preferencia por máquinas y mancuernas en principiantes (curva de aprendizaje corta).
  if (ctx.nivelNum === 1 && ej.nivel === 1) p += 1;
  return p;
}

/** Ejercicios de un hueco ordenados de mejor a peor para la persona. */
export function candidatos(hueco, ctx) {
  return EJERCICIOS.filter((e) => e.hueco === hueco)
    .map((e) => ({ e, p: puntuar(e, ctx) }))
    .filter((x) => x.p > -Infinity)
    .sort((a, b) => b.p - a.p || a.e.id.localeCompare(b.e.id))
    .map((x) => x.e);
}

function rangoTxt([a, b]) {
  const f = (s) => (s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
  return a === b ? f(a) : `${f(a)} – ${f(b)}`;
}

/**
 * Genera la rutina.
 * perfil: el de `perfilRutina` (shared/analisis.js).
 * prefs: { dias: 2–6, minutos: 45|60|75|90, material: 'gimnasio'|'mancuernas'|'casa', semana: 1–4 }.
 */
export function generarRutina(perfil, prefs = {}) {
  if (!perfil) return null;
  const objetivo = perfil.objetivo?.id ?? "rendimiento";
  const parada = PARADA[prefs.parada] ?? null;
  const nivel = perfil.nivelInicial === "intermedio" && !parada?.principiante ? "intermedio" : "principiante";
  const nivelNum = nivel === "intermedio" ? 2 : 1;
  const diasSemana = [...new Set((prefs.diasSemana ?? []).filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  const pedidos = diasSemana.length || Math.round(prefs.dias ?? perfil.diasFuerza ?? 3);
  const dias = Math.min(6, Math.max(1, pedidos));
  const focos = (prefs.foco ?? []).filter((f) => FOCOS[f] && f !== "ninguno");
  const conds = (prefs.condiciones ?? []).filter((c) => CONDICIONES[c] && c !== "ninguna").map((c) => ({ id: c, ...CONDICIONES[c] }));
  const rirMin = Math.max(0, ...conds.map((c) => c.rirMin ?? 0));
  const minutos = prefs.minutos ?? 60;
  const materialId = MATERIAL[prefs.material] ? prefs.material : "gimnasio";
  const semana = SEMANAS[Math.min(4, Math.max(1, prefs.semana ?? 1)) - 1];
  const correctivos = perfil.correctivos ?? [];
  const patrones = new Set(correctivos.map((c) => c.patron));
  const ladoDebil = correctivos.find((c) => c.patron === "asimetria" && c.ladoDebil?.length === 1)?.ladoDebil[0]
    ?? correctivos.find((c) => c.ladoDebil?.length === 1)?.ladoDebil[0] ?? null;
  const ctx = {
    material: MATERIAL[materialId].incluye, nivelNum, objetivo, patrones,
    evitar: new Set(conds.flatMap((c) => c.evita ?? [])), prefiere: new Set(conds.flatMap((c) => c.prefiere ?? [])),
    focoGrupos: new Set(focos.flatMap((f) => FOCOS[f].grupos)),
  };
  const reps = REPS[objetivo] ?? REPS.rendimiento;
  const seguidos = diasSemana.some((d, i) => i > 0 && d - diasSemana[i - 1] === 1) || (diasSemana[0] === 0 && diasSemana.at(-1) === 6 && diasSemana.length > 1);
  const reparto = dias === 2 && seguidos ? REPARTO_2_SEGUIDOS : REPARTOS[dias];

  // Huecos extra por postura: más tirón que empuje con hombros adelantados, glúteo medio con rodillas hacia dentro.
  const ajustarHuecos = (huecos, tipo) => {
    const h = huecos.map(([x, opt]) => [x, Boolean(opt)]);
    const tiene = (x) => h.some(([y]) => y === x);
    // Foco elegido: sus huecos dejan de ser opcionales y se añade uno más (máx. 2 extra por sesión).
    let extra = 0;
    for (const f of focos) {
      const F = FOCOS[f];
      if (!F.regiones.includes(REGION[tipo])) continue;
      h.forEach((x) => { if (F.huecos.includes(x[0])) x[1] = false; });
      const nuevo = F.huecos.find((x) => !tiene(x)) ?? (extra < 2 ? F.huecos[0] : null);
      if (nuevo && extra < 2) { h.splice(Math.max(1, h.length - 1), 0, [nuevo, false]); extra++; }
    }
    if (patrones.has("cruzadoSuperior") && (tiene("empujeH") || tiene("empujeV")) && !tiene("hombroPost")) h.splice(h.length - 1, 0, ["hombroPost", false]);
    if (patrones.has("cruzadoSuperior")) h.forEach((x) => { if (x[0] === "hombroPost") x[1] = false; });
    if ((patrones.has("rodillasDentro") || patrones.has("gluteoDebil")) && tiene("sentadilla") && !tiene("gluteoMedio")) h.splice(h.length - 1, 0, ["gluteoMedio", true]);
    if ((objetivo === "perdidaGrasa" || objetivo === "recomposicion") && !focos.includes("brazo")) return h.filter(([x]) => !(dias <= 3 && (x === "biceps" || x === "triceps")));
    return h;
  };

  // Uso de cada ejercicio en la semana para variar entre días del mismo tipo.
  const usos = new Map();
  const sesiones = reparto.dias.map((tipo, i) => {
    const plantilla = SESIONES[tipo];
    const usadosHoy = new Set();
    const bloques = [];
    for (const [hueco, opcional] of ajustarHuecos(plantilla.huecos, tipo)) {
      // El primer hueco abre la sesión con un ejercicio principal (el más cargable).
      const prim = (l) => (bloques.length ? l : [...l.filter((e) => e.tipo === "principal"), ...l.filter((e) => e.tipo !== "principal")]);
      let lista = prim(candidatos(hueco, ctx).filter((e) => !usadosHoy.has(e.id)));
      if (!lista.length && ALTERNATIVA[hueco]) lista = prim(candidatos(ALTERNATIVA[hueco], ctx).filter((e) => !usadosHoy.has(e.id)));
      if (!lista.length) continue;
      // Si el mismo patrón se repite en la semana, se alterna con la siguiente mejor
      // opción (variedad de estímulo), pero solo entre ejercicios casi igual de buenos.
      const mejor = puntuar(lista[0], ctx);
      const buenos = lista.filter((e) => puntuar(e, ctx) >= mejor - 4 && (bloques.length || e.tipo === lista[0].tipo));
      const ej = [...buenos].sort((a, b) => (usos.get(a.id) ?? 0) - (usos.get(b.id) ?? 0) || buenos.indexOf(a) - buenos.indexOf(b))[0];
      usadosHoy.add(ej.id);
      usos.set(ej.id, (usos.get(ej.id) ?? 0) + 1);
      // El primer ejercicio compuesto de la sesión hace de principal.
      const tipoEj = ej.tipo === "principal" && bloques.some((b) => b.tipo === "principal") ? "compuesto" : ej.tipo;
      let series = tipoEj === "principal" ? (nivelNum === 2 ? 4 : 3) : tipoEj === "compuesto" ? 3 : tipoEj === "core" ? 2 : objetivo === "ganarMusculo" ? 3 : 2;
      if (semana.series > 0 && tipoEj === "principal") series += semana.series;
      const enFoco = ctx.focoGrupos.has(ej.grupo);
      if (enFoco) series += 1;
      if (semana.series < 0) series = Math.max(1, series - 1);
      const motivos = ej.corrige.filter((c) => patrones.has(c)).map((c) => correctivos.find((x) => x.patron === c)?.nombre).filter(Boolean);
      const lado = ej.uni && ladoDebil ? `Empieza por el lado ${ladoDebil === "I" ? "izquierdo" : "derecho"} y haz 1 serie extra con él.` : null;
      bloques.push({
        id: ej.id, nombre: ej.nombre, hueco, tipo: tipoEj, grupo: ej.grupo, opcional,
        series, reps: reps[tipoEj] ?? reps.compuesto, rir: tipoEj === "core" ? null : Math.max(Math.min(4, semana.rir + (semana.n <= 2 ? parada?.rirExtra ?? 0 : 0)), rirMin), foco: enFoco,
        descanso: rangoTxt(DESCANSO[tipoEj]), descansoSeg: (DESCANSO[tipoEj][0] + DESCANSO[tipoEj][1]) / 2,
        tecnica: ej.tecnica, motivo: motivos.length ? `Corrige: ${[...new Set(motivos)].join(", ").toLowerCase()}` : null, lado, uni: ej.uni,
      });
    }
    // Superseries de accesorios para ahorrar tiempo cuando se busca perder grasa.
    if (objetivo === "perdidaGrasa") {
      const acc = bloques.filter((b) => b.tipo === "aislamiento" || b.tipo === "core");
      for (let k = 0; k + 1 < acc.length; k += 2) { acc[k].superserie = acc[k + 1].id; acc[k + 1].superserieDe = acc[k].id; }
    }
    const calentamiento = calentar(correctivos);
    // Activación: el correctivo que no esté ya en el entrenamiento del día.
    const yaEsta = (f) => bloques.some((b) => b.nombre.toLowerCase().startsWith(f.toLowerCase().split(" ").slice(0, 2).join(" ")));
    const activacion = correctivos.slice(0, 2).map((c) => ({ nombre: (c.fortalecer ?? []).find((f) => !yaEsta(f)), series: 2, reps: "12–15", motivo: c.nombre })).filter((x) => x.nombre);
    if (conds.some((c) => c.id === "asma")) calentamiento.general = "10 min de cardio suave y progresivo (bici, elíptica o remo)";
    const diaSemana = diasSemana[i] ?? null;
    const sesion = { dia: i + 1, diaSemana, diaNombre: diaSemana != null ? DIAS_SEMANA[diaSemana] : null, tipo, nombre: plantilla.nombre, calentamiento, activacion, bloques, cardio: cardioSesion(objetivo, perfil, conds) };
    ajustarATiempo(sesion, minutos);
    return sesion;
  });

  return {
    version: 1,
    generada: new Date().toISOString(),
    objetivo: perfil.objetivo,
    nivel,
    reparto: { dias, nombre: reparto.nombre, pedidos },
    diasSemana,
    diasLibres: diasSemana.length ? DIAS_SEMANA.map((n, d) => d).filter((d) => !diasSemana.includes(d)) : [],
    recuperacionActiva: pedidos > 6 ? "El 7.º día, recuperación activa: 30–40 min de paseo, movilidad y estiramientos suaves." : null,
    focos,
    condiciones: conds.map((c) => ({ id: c.id, nombre: c.nombre, aviso: c.aviso, medico: Boolean(c.medico) })),
    consejos: [...(parada?.consejo ? [parada.consejo] : []), ...consejosDias(diasSemana, reparto)],
    parada: prefs.parada ?? null,
    minutos,
    material: materialId,
    semana,
    sesiones,
    cardioExtra: cardioExtra(objetivo, perfil, dias, conds, diasSemana),
    volumen: volumenSemanal(sesiones),
    progresion: "Doble progresión: cuando hagas todas las series en el tope del rango de repeticiones con el RIR indicado, sube la carga un 2,5–5 % y vuelve al inicio del rango.",
    precauciones: perfil.precauciones ?? [],
    ladoDebil,
  };
}

/** Consejos de reparto según los días elegidos. */
function consejosDias(diasSemana, reparto) {
  const c = [];
  if (!diasSemana.length) return c;
  const full = reparto.dias.every((t) => REGION[t] === "full");
  for (let i = 1; i < diasSemana.length; i++) {
    if (diasSemana[i] - diasSemana[i - 1] === 1 && full) {
      c.push(`${DIAS_SEMANA[diasSemana[i - 1]]} y ${DIAS_SEMANA[diasSemana[i]]} son seguidos: las sesiones alternan ejercicios (A/B/C), pero baja un poco la carga del segundo día si notas las piernas cargadas.`);
      break;
    }
  }
  let racha = 1, max = 1;
  for (let i = 1; i < diasSemana.length; i++) { racha = diasSemana[i] - diasSemana[i - 1] === 1 ? racha + 1 : 1; max = Math.max(max, racha); }
  if (max >= 4) c.push("Entrenas 4 o más días seguidos: duerme 7–8 horas y respeta el RIR para recuperarte bien.");
  return c;
}

function calentar(correctivos) {
  const mov = correctivos.flatMap((c) => c.movilizar ?? []).slice(0, 2);
  return {
    general: "5 min de cardio suave (bici, elíptica o remo)",
    movilidad: (mov.length ? mov : MOVILIDAD_BASE).concat(mov.length < 2 ? MOVILIDAD_BASE.slice(0, 2 - mov.length) : []),
    aproximacion: "2 series de aproximación del primer ejercicio (50 % y 75 % de la carga de trabajo)",
  };
}

function cardioSesion(objetivo, perfil, conds = []) {
  const bajo = conds.some((c) => c.bajoImpacto) ? " en bici o elíptica (sin impacto)" : "";
  if (objetivo === "perdidaGrasa" && bajo) return `15–20 min de cardio en zona 2${bajo} al terminar`;
  if (objetivo === "perdidaGrasa") return "15–20 min de cardio en zona 2 al terminar (puedes hablar pero con esfuerzo)";
  if (objetivo === "recomposicion") return "10–15 min de cardio suave al terminar (opcional)";
  return null;
}

function cardioExtra(objetivo, perfil, diasFuerza, conds = [], diasSemana = []) {
  const dias = perfil.plan?.entrenamiento?.diasCardio ?? perfil.diasCardio ?? 2;
  const libres = Math.max(0, 7 - diasFuerza);
  const n = Math.min(dias, libres);
  const sinHIIT = conds.some((c) => c.sinHIIT), bajo = conds.some((c) => c.bajoImpacto);
  let tipo = {
    perdidaGrasa: "30–45 min en zona 2 (caminar en cuesta, bici o elíptica)",
    recomposicion: "25–35 min en zona 2",
    ganarMusculo: "20–30 min suave (caminar rápido o bici)",
    rendimiento: "1 día de intervalos (8×30 s fuerte / 90 s suave) y 1 día de 30 min en zona 2",
  }[objetivo];
  if (sinHIIT && objetivo === "rendimiento") tipo = "30–40 min en zona 2 (sin intervalos intensos)";
  if (bajo) tipo += ", siempre de bajo impacto: bici, elíptica, remo o piscina";
  // Días de cardio: los libres más separados de las sesiones de fuerza (empezando por los no consecutivos).
  const libresSemana = diasSemana.length ? [0, 1, 2, 3, 4, 5, 6].filter((d) => !diasSemana.includes(d)) : [];
  const elegidos = libresSemana.slice(0, n);
  return n ? { dias: n, tipo, pasos: perfil.plan ? "8.000–10.000 pasos al día" : null, diasSemana: elegidos, diasNombre: elegidos.map((d) => DIAS_SEMANA[d]) } : null;
}

// Tiempo estimado: ~45 s por serie de trabajo + descanso; los unilaterales cuentan doble.
export function minutosSesion(s) {
  let seg = 5 * 60 + s.calentamiento.movilidad.length * 60 + 3 * 60 + s.activacion.length * 2 * 60;
  for (const b of s.bloques) {
    const porSerie = 45 * (b.uni ? 2 : 1) + (b.superserieDe ? 0 : b.descansoSeg);
    seg += b.series * porSerie;
  }
  return Math.round(seg / 60);
}

/** Quita accesorios opcionales (de atrás hacia delante) hasta que la sesión quepa en el tiempo. */
export function ajustarATiempo(s, minutos) {
  const recortados = [];
  while (minutosSesion(s) > minutos) {
    const i = s.bloques.map((b) => b.opcional).lastIndexOf(true);
    if (i < 0) {
      // Sin opcionales: una serie menos en los ejercicios compuestos.
      const c = s.bloques.find((b) => b.tipo === "compuesto" && b.series > 2);
      if (!c) break;
      c.series -= 1;
      continue;
    }
    recortados.push(s.bloques[i].nombre);
    const [b] = s.bloques.splice(i, 1);
    if (b.superserie || b.superserieDe) s.bloques.forEach((x) => { if (x.superserie === b.id) delete x.superserie; if (x.superserieDe === b.id) delete x.superserieDe; });
  }
  s.minutos = minutosSesion(s);
  s.recortados = recortados;
  return s;
}

/** Series semanales por grupo muscular. */
export function volumenSemanal(sesiones) {
  const v = {};
  for (const s of sesiones) for (const b of s.bloques) v[b.grupo] = (v[b.grupo] ?? 0) + b.series;
  return v;
}

/** Semana del ciclo (1–4) según las semanas transcurridas desde el inicio del plan. */
export function semanaDelCiclo(inicioISO, hoy = new Date()) {
  const dias = Math.floor((hoy - new Date(inicioISO)) / 86400000);
  return dias < 0 ? 1 : (Math.floor(dias / 7) % 4) + 1;
}
