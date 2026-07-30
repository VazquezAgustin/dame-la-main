// ═══════════════════════════════════════════════════════════════
// 🃏 BANCO CLÁSICO — trivia 100% Argentina ("Dame la Main")
// Categorías y preguntas nuevas desde cero. La selección de temática
// vive en js/preguntas.js (selector) + js/theme.config.js.
// ═══════════════════════════════════════════════════════════════
export const CATEGORY_POOL = [
  "Geografía Argentina",
  "Historia Argentina",
  "Próceres y Patriotas",
  "Fútbol Argentino",
  "Maradona y Messi",
  "Rock Nacional",
  "Tango y Folklore",
  "Comida y Bebida",
  "Tele y Cine Argentino",
  "Famosos Argentinos",
  "Provincias y Ciudades",
  "Naturaleza Argentina",
  "Tradiciones y Costumbres",
  "Ciencia y Premios Nobel",
  "Lunfardo y Dichos",
  "Símbolos Patrios",
];

// ═══════════════════════════════════════════════════════════════
// 📝 BANCO DE PREGUNTAS (clásico — Argentina)
// ═══════════════════════════════════════════════════════════════
export const QUESTIONS = {
  "Geografía Argentina": [
    {
      value: 200,
      question: "¿Qué cordillera forma el límite natural con Chile?",
      answer: "Los Andes",
    },
    {
      value: 400,
      question:
        "¿Qué río ancho separa a la Argentina del Uruguay frente a Buenos Aires?",
      answer: "El Río de la Plata",
    },
    {
      value: 600,
      question:
        "¿Cómo se llama la gran llanura fértil del centro del país, corazón agrícola?",
      answer: "La Pampa (llanura pampeana)",
    },
    {
      value: 800,
      question: "¿Cuál es la provincia argentina más extensa en superficie?",
      answer: "Buenos Aires",
    },
    {
      value: 1000,
      question:
        "¿Qué enorme salar, atracción turística, se extiende entre Jujuy y Salta?",
      answer: "Las Salinas Grandes",
    },
  ],
  "Historia Argentina": [
    {
      value: 200,
      question: "¿En qué año fue la Revolución de Mayo?",
      answer: "1810",
    },
    {
      value: 400,
      question:
        "¿Qué guerra enfrentó a la Argentina con el Reino Unido en 1982?",
      answer: "La Guerra de Malvinas",
    },
    {
      value: 600,
      question:
        "¿Qué primera dama impulsó la ley del voto femenino, sancionada en 1947?",
      answer: "Eva Perón (Evita)",
    },
    {
      value: 800,
      question:
        "¿Cómo se llamó la medida de fines de 2001 que limitó el retiro de dinero de los bancos?",
      answer: "El corralito",
    },
    {
      value: 1000,
      question:
        "¿Qué presidente fue derrocado en 1930, en el primer golpe militar del país?",
      answer: "Hipólito Yrigoyen",
    },
  ],
  "Próceres y Patriotas": [
    {
      value: 200,
      question:
        "¿A qué prócer se recuerda cada 17 de agosto, aniversario de su muerte?",
      answer: "José de San Martín",
    },
    {
      value: 400,
      question:
        "¿Qué militar salteño lideró la 'guerra gaucha' contra los realistas en el norte?",
      answer: "Martín Miguel de Güemes",
    },
    {
      value: 600,
      question:
        "¿Quién fue el secretario de la Primera Junta y autor del 'Plan de Operaciones'?",
      answer: "Mariano Moreno",
    },
    {
      value: 800,
      question:
        "¿Qué pensador escribió 'Bases', la obra que inspiró la Constitución de 1853?",
      answer: "Juan Bautista Alberdi",
    },
    {
      value: 1000,
      question:
        "¿Qué general cordobés de las guerras civiles era apodado 'el Manco'?",
      answer: "José María Paz",
    },
  ],
  "Fútbol Argentino": [
    {
      value: 200,
      question: "¿Cómo se llama el clásico entre Boca y River?",
      answer: "El Superclásico",
    },
    {
      value: 400,
      question: "¿Qué club es conocido como 'El Ciclón'?",
      answer: "San Lorenzo",
    },
    {
      value: 600,
      question: "¿Qué club platense tiene el apodo 'El Lobo'?",
      answer: "Gimnasia y Esgrima La Plata",
    },
    {
      value: 800,
      question:
        "¿Qué club argentino es el máximo ganador de la Copa Libertadores, con 7 títulos?",
      answer: "Independiente",
    },
    {
      value: 1000,
      question:
        "¿Qué equipo argentino ganó la Copa Intercontinental de 1968 ante el Manchester United?",
      answer: "Estudiantes de La Plata",
    },
  ],
  "Maradona y Messi": [
    {
      value: 200,
      question: "¿En qué ciudad nació Lionel Messi?",
      answer: "Rosario",
    },
    {
      value: 400,
      question:
        "¿Cómo se conoce al gol que Maradona hizo con la mano a Inglaterra en 1986?",
      answer: "La Mano de Dios",
    },
    {
      value: 600,
      question:
        "¿En qué club argentino jugó Messi de chico antes de irse a España?",
      answer: "Newell's Old Boys",
    },
    {
      value: 800,
      question: "¿A qué club francés llegó Messi en 2021?",
      answer: "Paris Saint-Germain (PSG)",
    },
    {
      value: 1000,
      question: "¿Qué club argentino dirigía Maradona cuando falleció en 2020?",
      answer: "Gimnasia y Esgrima La Plata",
    },
  ],
  "Rock Nacional": [
    {
      value: 200,
      question: "¿Qué banda canta 'De música ligera'?",
      answer: "Soda Stereo",
    },
    {
      value: 400,
      question: "¿Quién cantaba 'Rasguña las piedras' al frente de Sui Generis?",
      answer: "Charly García",
    },
    {
      value: 600,
      question:
        "¿Qué banda liderada por el Indio Solari marcó los años 80 y 90 del rock argentino?",
      answer: "Patricio Rey y sus Redonditos de Ricota",
    },
    {
      value: 800,
      question: "¿Qué banda lideró Luis Alberto Spinetta a fines de los 60?",
      answer: "Almendra",
    },
    {
      value: 1000,
      question:
        "¿Qué banda formó Andrés Calamaro en España junto a Ariel Rot?",
      answer: "Los Rodríguez",
    },
  ],
  "Tango y Folklore": [
    {
      value: 200,
      question: "¿Qué instrumento de fuelle es el alma del tango?",
      answer: "El bandoneón",
    },
    {
      value: 400,
      question:
        "¿En qué barrio porteño está el Caminito, postal turística del tango?",
      answer: "La Boca",
    },
    {
      value: 600,
      question:
        "¿Qué tango de Gerardo Matos Rodríguez es el más famoso del mundo?",
      answer: "La Cumparsita",
    },
    {
      value: 800,
      question:
        "¿En qué ciudad cordobesa se hace el festival de doma y folklore más famoso del país?",
      answer: "Jesús María",
    },
    {
      value: 1000,
      question:
        "¿Qué músico y poeta, autor de 'Luna tucumana' y 'Los ejes de mi carreta', es el máximo referente del folklore?",
      answer: "Atahualpa Yupanqui",
    },
  ],
  "Comida y Bebida": [
    {
      value: 200,
      question:
        "¿Qué comida de masa rellena y horneada tiene versiones salteña y tucumana?",
      answer: "La empanada",
    },
    {
      value: 400,
      question:
        "¿Qué guiso espeso con maíz blanco se come tradicionalmente el 25 de Mayo?",
      answer: "El locro",
    },
    {
      value: 600,
      question:
        "¿Cómo se llama la milanesa cubierta con salsa de tomate, jamón y queso?",
      answer: "Milanesa a la napolitana",
    },
    {
      value: 800,
      question:
        "¿Qué provincia produce la enorme mayoría de la yerba mate del país?",
      answer: "Misiones",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama el postre clásico de queso con dulce de membrillo?",
      answer: "Postre vigilante (queso y dulce)",
    },
  ],
  "Tele y Cine Argentino": [
    {
      value: 200,
      question: "¿Qué conductor estuvo al frente de 'ShowMatch' durante años?",
      answer: "Marcelo Tinelli",
    },
    {
      value: 400,
      question:
        "¿Qué película de Damián Szifrón, de 2014, está formada por seis historias?",
      answer: "Relatos Salvajes",
    },
    {
      value: 600,
      question:
        "¿Qué comedia de 1985 dirigida por Alejandro Doria es un clásico sobre una familia y una abuela desaparecida?",
      answer: "Esperando la carroza",
    },
    {
      value: 800,
      question:
        "¿Qué director argentino filmó 'El Hijo de la Novia' y 'El Secreto de sus Ojos'?",
      answer: "Juan José Campanella",
    },
    {
      value: 1000,
      question:
        "¿Qué telenovela juvenil de Cris Morena dio origen al grupo Erreway?",
      answer: "Rebelde Way",
    },
  ],
  "Famosos Argentinos": [
    {
      value: 200,
      question:
        "¿Qué basquetbolista argentino ganó cuatro anillos de la NBA con los San Antonio Spurs?",
      answer: "Emanuel 'Manu' Ginóbili",
    },
    {
      value: 400,
      question:
        "¿Qué actriz y cantante argentina se hizo famosa protagonizando 'Violetta'?",
      answer: "Tini Stoessel",
    },
    {
      value: 600,
      question:
        "¿Qué cocinero argentino es mundialmente conocido por cocinar con fuego y leña?",
      answer: "Francis Mallmann",
    },
    {
      value: 800,
      question: "¿Qué historietista argentino creó a Mafalda?",
      answer: "Quino (Joaquín Salvador Lavado)",
    },
    {
      value: 1000,
      question:
        "¿Qué pianista y director de orquesta argentino condujo la Ópera Estatal de Berlín?",
      answer: "Daniel Barenboim",
    },
  ],
  "Provincias y Ciudades": [
    {
      value: 200,
      question: "¿En qué provincia está la ciudad de Mar del Plata?",
      answer: "Buenos Aires",
    },
    {
      value: 400,
      question: "¿Cuál es la capital de la provincia de Tucumán?",
      answer: "San Miguel de Tucumán",
    },
    {
      value: 600,
      question:
        "¿En qué provincia está el Cerro de los Siete Colores, en Purmamarca?",
      answer: "Jujuy",
    },
    {
      value: 800,
      question: "¿Cuál es la provincia más pequeña de la Argentina?",
      answer: "Tucumán",
    },
    {
      value: 1000,
      question: "¿Cuál es la capital de la provincia de Chubut?",
      answer: "Rawson (no Trelew ni Comodoro)",
    },
  ],
  "Naturaleza Argentina": [
    {
      value: 200,
      question:
        "¿Qué ave corredora, parecida a un avestruz, vive en la Pampa y la Patagonia?",
      answer: "El ñandú",
    },
    {
      value: 400,
      question:
        "¿Cuál es el roedor más grande del mundo, habitante de los humedales argentinos?",
      answer: "El carpincho",
    },
    {
      value: 600,
      question: "¿En qué provincia están los Esteros del Iberá?",
      answer: "Corrientes",
    },
    {
      value: 800,
      question:
        "¿En qué provincia está el Parque Nacional Talampaya, con sus paredones rojos?",
      answer: "La Rioja",
    },
    {
      value: 1000,
      question:
        "¿Qué parque de San Juan es conocido como el 'Valle de la Luna'?",
      answer: "Ischigualasto",
    },
  ],
  "Tradiciones y Costumbres": [
    {
      value: 200,
      question:
        "¿Qué comida reúne a las familias los domingos alrededor de la parrilla?",
      answer: "El asado",
    },
    {
      value: 400,
      question:
        "¿Qué juego de cartas se juega cantando 'envido' y 'quiero retruco'?",
      answer: "El truco",
    },
    {
      value: 600,
      question:
        "¿Cómo se llama el pantalón amplio que usa el gaucho junto a las botas?",
      answer: "La bombacha (de campo)",
    },
    {
      value: 800,
      question:
        "¿Qué ciudad entrerriana es famosa por su carnaval con carrozas y comparsas?",
      answer: "Gualeguaychú",
    },
    {
      value: 1000,
      question:
        "¿Qué celebración del norte andino agradece a la tierra cada 1 de agosto?",
      answer: "El Día de la Pachamama",
    },
  ],
  "Ciencia y Premios Nobel": [
    {
      value: 200,
      question:
        "¿Cómo se llama el principal organismo científico del Estado argentino?",
      answer: "El CONICET",
    },
    {
      value: 400,
      question:
        "¿Qué científico argentino ganó el Nobel de Medicina en 1947, el primero del país?",
      answer: "Bernardo Houssay",
    },
    {
      value: 600,
      question:
        "¿Qué empresa argentina de Bariloche construye satélites y reactores nucleares?",
      answer: "INVAP",
    },
    {
      value: 800,
      question:
        "¿Qué argentino ganó el Nobel de Medicina en 1984 por los anticuerpos monoclonales?",
      answer: "César Milstein",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama la central nuclear argentina inaugurada en 1974, la primera de América Latina?",
      answer: "Atucha I",
    },
  ],
  "Lunfardo y Dichos": [
    {
      value: 200,
      question: "¿Qué significa 'guita'?",
      answer: "Dinero, plata",
    },
    {
      value: 400,
      question: "¿Qué significa 'chamuyar'?",
      answer: "Hablar para convencer o seducir",
    },
    {
      value: 600,
      question: "¿Qué significa 'tener fiaca'?",
      answer: "Tener pereza o desgano",
    },
    {
      value: 800,
      question: "¿Qué significa 'bondi'?",
      answer: "El colectivo (el bus)",
    },
    {
      value: 1000,
      question: "¿Qué significa que un empleado sea un 'ñoqui'?",
      answer: "Que cobra un sueldo sin trabajar",
    },
  ],
  "Símbolos Patrios": [
    {
      value: 200,
      question: "¿Qué día se celebra el Día de la Bandera?",
      answer: "El 20 de junio",
    },
    {
      value: 400,
      question: "¿En qué ciudad está el Monumento Nacional a la Bandera?",
      answer: "Rosario",
    },
    {
      value: 600,
      question: "¿Qué ramas rodean el óvalo del Escudo Nacional?",
      answer: "Ramas de laurel",
    },
    {
      value: 800,
      question: "¿Cuántos rayos tiene el Sol de Mayo de la bandera?",
      answer: "32 (16 rectos y 16 flamígeros)",
    },
    {
      value: 1000,
      question: "¿Qué día se celebra el Día de la Escarapela?",
      answer: "El 18 de mayo",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ BANCO DE PREGUNTAS — MODO RELÁMPAGO (clásico)
// (Respuesta corta. No repetir preguntas del banco QUESTIONS.)
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  // — Geografía y provincias —
  { question: "¿Cuál es la capital de la provincia de Entre Ríos?", answer: "Paraná" },
  { question: "¿Cuál es la capital de la provincia de Misiones?", answer: "Posadas" },
  { question: "¿Cuál es la capital de la provincia de Santa Cruz?", answer: "Río Gallegos" },
  { question: "¿Cuál es la capital de la provincia de La Pampa?", answer: "Santa Rosa" },
  { question: "¿En qué provincia está la ciudad de Ushuaia?", answer: "Tierra del Fuego" },
  { question: "¿En qué provincia está El Calafate?", answer: "Santa Cruz" },
  { question: "¿Cuál es la provincia más poblada de la Argentina?", answer: "Buenos Aires" },
  { question: "¿Qué provincia es famosa por el vino Malbec?", answer: "Mendoza" },
  { question: "¿Qué ciudad de la costa bonaerense es 'La Feliz'?", answer: "Mar del Plata" },

  // — Historia y próceres —
  { question: "¿Qué presidente renunció en diciembre de 2001?", answer: "Fernando de la Rúa" },
  { question: "¿Contra qué país fue la Guerra de Malvinas?", answer: "El Reino Unido" },
  { question: "¿Qué se conmemora el 24 de marzo?", answer: "El Día de la Memoria (golpe de 1976)" },
  { question: "¿Qué se conmemora el 2 de abril?", answer: "Los veteranos y caídos en Malvinas" },
  { question: "¿Qué ley de 1912 estableció el voto secreto y obligatorio?", answer: "La Ley Sáenz Peña" },
  { question: "¿Cómo se llama la casa de gobierno argentina?", answer: "La Casa Rosada" },
  { question: "¿Qué presidente fue llamado 'el primer trabajador'?", answer: "Juan Domingo Perón" },
  { question: "¿Qué caudillo riojano fue apodado 'el Tigre de los Llanos'?", answer: "Facundo Quiroga" },

  // — Fútbol —
  { question: "¿Qué club es 'La Academia'?", answer: "Racing Club" },
  { question: "¿Qué club es 'El Rojo'?", answer: "Independiente" },
  { question: "¿Qué club es 'El Bicho'?", answer: "Argentinos Juniors" },
  { question: "¿Qué club rosarino es 'Canalla'?", answer: "Rosario Central" },
  { question: "¿Cómo se llama el estadio de River Plate?", answer: "El Monumental" },
  { question: "¿En qué país se jugó el Mundial 2022?", answer: "Qatar" },
  { question: "¿A qué selección le ganó Argentina la final de Qatar 2022?", answer: "Francia" },
  { question: "¿Quién fue el DT campeón del mundo en 1978?", answer: "César Luis Menotti" },
  { question: "¿Quién fue el DT campeón del mundo en 1986?", answer: "Carlos Salvador Bilardo" },
  { question: "¿Qué arquero fue elegido el mejor del Mundial 2022?", answer: "Emiliano 'Dibu' Martínez" },

  // — Comida y bebida —
  { question: "¿Cómo se llaman las masas dulces del desayuno argentino?", answer: "Las facturas" },
  { question: "¿Cómo se llama el chorizo servido dentro de un pan?", answer: "El choripán" },
  { question: "¿Cómo se le dice a quien sirve el mate en la ronda?", answer: "El cebador" },
  { question: "¿Qué salsa de perejil, ajo y ají acompaña al asado?", answer: "El chimichurri" },
  { question: "¿Qué bebida amarga italiana se popularizó en Córdoba con gaseosa?", answer: "El fernet" },

  // — Música —
  { question: "¿Qué género musical es típico de Córdoba?", answer: "El cuarteto" },
  { question: "¿Quién es 'La Mona' del cuarteto?", answer: "Carlos 'La Mona' Jiménez" },
  { question: "¿Qué banda canta 'Mil horas'?", answer: "Los Abuelos de la Nada" },
  { question: "¿Quién canta 'Yo vengo a ofrecer mi corazón'?", answer: "Fito Páez" },
  { question: "¿Qué banda canta 'La Argentinidad al Palo'?", answer: "Bersuit Vergarabat" },
  { question: "¿Qué instrumento toca principalmente Charly García?", answer: "El piano (teclados)" },
  { question: "¿Quiénes compusieron 'Alfonsina y el mar'?", answer: "Ariel Ramírez y Félix Luna" },

  // — Tele, cine y famosos —
  { question: "¿Qué personaje de Quino odia la sopa?", answer: "Mafalda" },
  { question: "¿Qué historieta de Dante Quinterno tiene un indio tehuelche millonario?", answer: "Patoruzú" },
  { question: "¿Qué actor protagonizó 'Nueve Reinas'?", answer: "Ricardo Darín" },
  { question: "¿Qué conductora de almuerzos es apodada 'La Chiqui'?", answer: "Mirtha Legrand" },
  { question: "¿Cómo se llama la selección argentina de rugby?", answer: "Los Pumas" },
  { question: "¿Cómo se llama la selección argentina de hockey femenino?", answer: "Las Leonas" },

  // — Naturaleza y símbolos —
  { question: "¿Qué ballena visita Puerto Madryn cada año?", answer: "La ballena franca austral" },
  { question: "¿Qué pingüino anida en Punta Tombo?", answer: "El pingüino de Magallanes" },
  { question: "¿Qué planta gigante de la Pampa da sombra y no es un árbol?", answer: "El ombú" },
  { question: "¿De qué colores es la escarapela argentina?", answer: "Celeste y blanca" },
  { question: "¿Qué día se celebra la Independencia argentina?", answer: "El 9 de julio" },

  // — Lunfardo —
  { question: "¿Qué significa 'mango'?", answer: "Un peso (dinero)" },
  { question: "¿Qué significa 'chabón'?", answer: "Tipo, muchacho" },
  { question: "¿Qué significa 'pilcha'?", answer: "La ropa" },
  { question: "¿Qué significa 'birra'?", answer: "Cerveza" },
  { question: "¿Qué significa 'trucho'?", answer: "Falso, de mala calidad" },
];

// ═══════════════════════════════════════════════════════════════
// 🎯 PREGUNTAS DE ESTIMACIÓN — respuestas numéricas (clásico)
// ═══════════════════════════════════════════════════════════════
export const ESTIMATION_QUESTIONS = [
  // — Historia —
  { question: "¿En qué año fundó Juan de Garay la ciudad de Buenos Aires?", answer: 1580 },
  { question: "¿En qué año se sancionó la Constitución Nacional?", answer: 1853 },
  { question: "¿En qué año se aprobó la Ley Sáenz Peña del voto secreto?", answer: 1912 },
  { question: "¿En qué año asumió Perón su primera presidencia?", answer: 1946 },
  { question: "¿En qué año murió Eva Perón?", answer: 1952 },
  { question: "¿En qué año fue el Cordobazo?", answer: 1969 },
  { question: "¿En qué año empezó la última dictadura militar?", answer: 1976 },
  { question: "¿Cuántos años duró la última dictadura militar?", answer: 7 },
  { question: "¿En qué año fue la Guerra de Malvinas?", answer: 1982 },

  // — Fútbol —
  { question: "¿Cuántos Mundiales ganó la Selección Argentina?", answer: 3 },
  { question: "¿Cuántos goles hizo Messi en el Mundial de Qatar 2022?", answer: 7 },
  { question: "¿En qué año Argentina perdió la final del Mundial ante Alemania en Brasil?", answer: 2014 },
  { question: "¿En qué año Argentina le ganó la Finalissima a Italia?", answer: 2022 },
  { question: "¿En qué año nació Diego Maradona?", answer: 1960 },
  { question: "¿En qué año debutó Messi en la Selección mayor?", answer: 2005 },
  { question: "¿En qué año se fundó Racing Club?", answer: 1903 },

  // — Geografía y datos —
  { question: "¿Cuántos habitantes tiene la Argentina, en millones (censo 2022)?", answer: 46 },
  { question: "¿Cuántos kilómetros mide la Argentina de norte a sur (aprox)?", answer: 3700 },
  { question: "¿Cuántos metros mide el Obelisco de Buenos Aires?", answer: 67 },
  { question: "¿Cuántas líneas de subte tiene la ciudad de Buenos Aires?", answer: 6 },
  { question: "¿En qué año se inauguró el Obelisco?", answer: 1936 },
  { question: "¿En qué año se inauguró el subte de Buenos Aires?", answer: 1913 },

  // — Cultura y ciencia —
  { question: "¿Cuántos Premios Nobel de ciencias ganó la Argentina?", answer: 3 },
  { question: "¿En qué año se hizo la primera edición del Festival de Cosquín?", answer: 1961 },
];
