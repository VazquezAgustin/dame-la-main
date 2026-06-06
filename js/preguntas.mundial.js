// ═══════════════════════════════════════════════════════════════
// ⚽ BANCO "MUNDIAL" — trivia 100% Argentina (set alternativo)
// Activo cuando ACTIVE_THEME === "mundial" (ver js/theme.config.js).
// Categorías y preguntas nuevas desde cero, distintas del banco clásico
// para dar variedad entre temáticas.
// ═══════════════════════════════════════════════════════════════
export const CATEGORY_POOL = [
  "Ciudades de Argentina",
  "Montañas, Ríos y Lagos",
  "Revolución e Independencia",
  "Presidentes Argentinos",
  "La Scaloneta",
  "Ídolos del Fútbol",
  "Música y Tango",
  "Cine y Series",
  "Humor y Espectáculo",
  "Sabores Argentinos",
  "Inventos Argentinos",
  "Fauna y Flora",
  "Mitos y Leyendas",
  "Otros Deportes",
  "Letras Argentinas",
  "Argentina Curiosa",
];

// ═══════════════════════════════════════════════════════════════
// 📝 BANCO DE PREGUNTAS (set alternativo — Argentina)
// ═══════════════════════════════════════════════════════════════
export const QUESTIONS = {
  "Ciudades de Argentina": [
    {
      value: 200,
      question: "¿Cuál es la capital de la Argentina?",
      answer: "Buenos Aires",
    },
    {
      value: 400,
      question: "¿Qué ciudad santafesina es la 'cuna de la bandera'?",
      answer: "Rosario",
    },
    {
      value: 600,
      question:
        "¿Qué ciudad es capital nacional del chocolate y está junto al lago Nahuel Huapi?",
      answer: "Bariloche",
    },
    {
      value: 800,
      question: "¿Qué ciudad es conocida como 'La Docta' por su universidad?",
      answer: "Córdoba",
    },
    {
      value: 1000,
      question: "¿Cuál es la ciudad más austral de la Argentina y del mundo?",
      answer: "Ushuaia",
    },
  ],
  "Montañas, Ríos y Lagos": [
    {
      value: 200,
      question: "¿Cuál es la montaña más alta de la Argentina?",
      answer: "El Aconcagua",
    },
    {
      value: 400,
      question: "¿Qué cordillera recorre el oeste argentino?",
      answer: "Los Andes",
    },
    {
      value: 600,
      question: "¿Cuál es el río más largo de la Argentina?",
      answer: "El Paraná",
    },
    {
      value: 800,
      question:
        "¿Qué lago profundo está junto a Bariloche, en la región andina?",
      answer: "El Nahuel Huapi",
    },
    {
      value: 1000,
      question: "¿En qué provincia está el cerro Fitz Roy (El Chaltén)?",
      answer: "Santa Cruz",
    },
  ],
  "Revolución e Independencia": [
    {
      value: 200,
      question: "¿En qué año fue la Revolución de Mayo?",
      answer: "1810",
    },
    {
      value: 400,
      question: "¿En qué año se declaró la Independencia argentina?",
      answer: "1816",
    },
    {
      value: 600,
      question: "¿Quién presidió la Primera Junta de gobierno en 1810?",
      answer: "Cornelio Saavedra",
    },
    {
      value: 800,
      question: "¿En qué ciudad se firmó la Independencia en 1816?",
      answer: "San Miguel de Tucumán (Casa de Tucumán)",
    },
    {
      value: 1000,
      question:
        "¿Qué batalla de 1817 ganó San Martín tras cruzar los Andes hacia Chile?",
      answer: "La Batalla de Chacabuco",
    },
  ],
  "Presidentes Argentinos": [
    {
      value: 200,
      question:
        "¿Qué presidente impulsó el voto femenino, votado por primera vez en 1951?",
      answer: "Juan Domingo Perón",
    },
    {
      value: 400,
      question: "¿Quién fue presidente al volver la democracia en 1983?",
      answer: "Raúl Alfonsín",
    },
    {
      value: 600,
      question: "¿Quién fue Eva Duarte, esposa de Perón?",
      answer: "Eva Perón (Evita)",
    },
    {
      value: 800,
      question:
        "¿Qué presidente renunció durante la crisis de diciembre de 2001?",
      answer: "Fernando de la Rúa",
    },
    {
      value: 1000,
      question: "¿Quién fue el primer presidente bajo la Constitución de 1853?",
      answer: "Justo José de Urquiza",
    },
  ],
  "La Scaloneta": [
    {
      value: 200,
      question: "¿Quién es el director técnico campeón del mundo en 2022?",
      answer: "Lionel Scaloni",
    },
    {
      value: 400,
      question: "¿Quién atajó el penal decisivo en la final de Qatar?",
      answer: "Emiliano 'Dibu' Martínez",
    },
    {
      value: 600,
      question: "¿Contra qué selección jugó Argentina la final del Mundial 2022?",
      answer: "Francia",
    },
    {
      value: 800,
      question: "¿Cuántos goles hizo Messi en todo el Mundial 2022?",
      answer: "7",
    },
    {
      value: 1000,
      question:
        "¿Qué título ganó Argentina en 2021 cortando una sequía de 28 años?",
      answer: "La Copa América",
    },
  ],
  "Ídolos del Fútbol": [
    {
      value: 200,
      question: "¿Quién metió 'La Mano de Dios' en el Mundial 1986?",
      answer: "Diego Maradona",
    },
    {
      value: 400,
      question: "¿Qué apodo tiene Ángel Di María?",
      answer: "'Fideo'",
    },
    {
      value: 600,
      question:
        "¿Qué delantero argentino apodado 'el Kun' jugó en el Manchester City?",
      answer: "Sergio Agüero",
    },
    {
      value: 800,
      question:
        "¿Qué arquero campeón del Mundial 1978 es apodado 'el Pato'?",
      answer: "Ubaldo Fillol",
    },
    {
      value: 1000,
      question:
        "¿Qué histórico ídolo de Independiente es apodado 'el Bocha'?",
      answer: "Ricardo Bochini",
    },
  ],
  "Música y Tango": [
    {
      value: 200,
      question: "¿Quién es el máximo ídolo del tango, fallecido en 1935?",
      answer: "Carlos Gardel",
    },
    {
      value: 400,
      question: "¿Qué instrumento de fuelle es el alma del tango?",
      answer: "El bandoneón",
    },
    {
      value: 600,
      question:
        "¿Qué compositor renovó el tango con 'Libertango' y 'Adiós Nonino'?",
      answer: "Astor Piazzolla",
    },
    {
      value: 800,
      question: "¿Qué cantora folklórica es conocida como 'La Negra'?",
      answer: "Mercedes Sosa",
    },
    {
      value: 1000,
      question:
        "¿Qué dúo compuso clásicos como 'El día que me quieras' para Gardel?",
      answer: "Gardel y Alfredo Le Pera",
    },
  ],
  "Cine y Series": [
    {
      value: 200,
      question: "¿Qué actor protagonizó 'Relatos Salvajes'?",
      answer: "Ricardo Darín",
    },
    {
      value: 400,
      question:
        "¿Qué película argentina animada de Campanella trata sobre el metegol?",
      answer: "Metegol",
    },
    {
      value: 600,
      question:
        "¿Qué película argentina ganó el Oscar a mejor film extranjero en 2010?",
      answer: "El Secreto de sus Ojos",
    },
    {
      value: 800,
      question:
        "¿Qué film de 2022 narra el juicio a las juntas militares?",
      answer: "Argentina, 1985",
    },
    {
      value: 1000,
      question:
        "¿Qué novela juvenil de Cris Morena lanzó al grupo Erreway?",
      answer: "Rebelde Way",
    },
  ],
  "Humor y Espectáculo": [
    {
      value: 200,
      question: "¿Qué conductor está ligado a ShowMatch y el 'Bailando'?",
      answer: "Marcelo Tinelli",
    },
    {
      value: 400,
      question:
        "¿Qué humorista interpretó a 'Mamá Cora' en 'Esperando la Carroza'?",
      answer: "Antonio Gasalla",
    },
    {
      value: 600,
      question:
        "¿Qué grupo humorístico es famoso por crear instrumentos informales?",
      answer: "Les Luthiers",
    },
    {
      value: 800,
      question: "¿Qué premio entrega APTRA a lo mejor de la TV argentina?",
      answer: "El Martín Fierro",
    },
    {
      value: 1000,
      question: "¿Qué capocómico de los 70 y 80 es apodado 'el Negro' Olmedo?",
      answer: "Alberto Olmedo",
    },
  ],
  "Sabores Argentinos": [
    {
      value: 200,
      question: "¿Qué dulce untable es un emblema nacional?",
      answer: "El dulce de leche",
    },
    {
      value: 400,
      question: "¿Qué dulce lleva dos tapas y dulce de leche, bañado?",
      answer: "El alfajor",
    },
    {
      value: 600,
      question: "¿Qué empanada jugosa al horno es típica del norte argentino?",
      answer: "La empanada salteña / tucumana",
    },
    {
      value: 800,
      question: "¿Qué pizza porteña lleva muchísima cebolla?",
      answer: "La fugazzeta (fugazza)",
    },
    {
      value: 1000,
      question:
        "¿Qué corte de costillar cortado en tiras es un clásico del asado?",
      answer: "La tira de asado (asado de tira)",
    },
  ],
  "Inventos Argentinos": [
    {
      value: 200,
      question:
        "¿Qué objeto de escritura cotidiano patentó en Argentina László Bíró?",
      answer: "La birome (bolígrafo)",
    },
    {
      value: 400,
      question: "¿Qué cirugía cardíaca desarrolló el argentino René Favaloro?",
      answer: "El bypass coronario",
    },
    {
      value: 600,
      question:
        "¿Qué sistema de identificación por huellas dactilares creó Juan Vucetich?",
      answer: "La dactiloscopía",
    },
    {
      value: 800,
      question:
        "¿Qué médico argentino logró en 1914 conservar sangre sin que se coagulara para transfundirla?",
      answer: "Luis Agote",
    },
    {
      value: 1000,
      question:
        "¿Qué argentino dirigió 'El Apóstol' (1917), el primer largometraje animado del mundo?",
      answer: "Quirino Cristiani",
    },
  ],
  "Fauna y Flora": [
    {
      value: 200,
      question: "¿Cuál es el ave nacional de la Argentina?",
      answer: "El hornero",
    },
    {
      value: 400,
      question: "¿Qué animal andino, pariente de la llama, vive en el norte?",
      answer: "La vicuña",
    },
    {
      value: 600,
      question: "¿Qué glaciar de Santa Cruz es el más famoso del país?",
      answer: "El Perito Moreno",
    },
    {
      value: 800,
      question: "¿De qué árbol es la flor nacional argentina?",
      answer: "Del ceibo",
    },
    {
      value: 1000,
      question:
        "¿Cuál es el felino más grande de América que habita el norte argentino?",
      answer: "El yaguareté (jaguar)",
    },
  ],
  "Mitos y Leyendas": [
    {
      value: 200,
      question: "¿Qué 'difunta' popular es venerada en Vallecito, San Juan?",
      answer: "La Difunta Correa",
    },
    {
      value: 400,
      question:
        "¿Qué 'santo' popular gauchesco se venera con banderas rojas?",
      answer: "El Gauchito Gil",
    },
    {
      value: 600,
      question:
        "¿Qué criatura mítica del noroeste protege los cerros y las minas?",
      answer: "El Familiar",
    },
    {
      value: 800,
      question:
        "¿Qué luz misteriosa aparece de noche en los campos según la leyenda?",
      answer: "La luz mala",
    },
    {
      value: 1000,
      question:
        "¿Qué leyenda guaraní explica el origen de la yerba mate?",
      answer: "La leyenda de la yerba mate (Caá Yarí)",
    },
  ],
  "Otros Deportes": [
    {
      value: 200,
      question: "¿En qué deporte brilla el seleccionado femenino 'Las Leonas'?",
      answer: "El hockey sobre césped",
    },
    {
      value: 400,
      question: "¿Qué tenista argentino ganó el US Open en 2009?",
      answer: "Juan Martín del Potro",
    },
    {
      value: 600,
      question: "¿Qué piloto argentino ganó 5 títulos de Fórmula 1?",
      answer: "Juan Manuel Fangio",
    },
    {
      value: 800,
      question: "¿Cuál es el deporte nacional oficial de la Argentina?",
      answer: "El pato",
    },
    {
      value: 1000,
      question:
        "¿Qué basquetbolista argentino fue campeón de la NBA con San Antonio Spurs?",
      answer: "Emanuel 'Manu' Ginóbili",
    },
  ],
  "Letras Argentinas": [
    {
      value: 200,
      question: "¿Qué autor escribió 'Ficciones' y 'El Aleph'?",
      answer: "Jorge Luis Borges",
    },
    {
      value: 400,
      question: "¿Qué historieta de Quino tiene una nena que odia la sopa?",
      answer: "Mafalda",
    },
    {
      value: 600,
      question: "¿Qué autor argentino escribió 'Rayuela'?",
      answer: "Julio Cortázar",
    },
    {
      value: 800,
      question: "¿Qué poema gauchesco escribió José Hernández?",
      answer: "El Martín Fierro",
    },
    {
      value: 1000,
      question:
        "¿Qué autor escribió 'El Túnel' y 'Sobre Héroes y Tumbas'?",
      answer: "Ernesto Sábato",
    },
  ],
  "Argentina Curiosa": [
    {
      value: 200,
      question: "¿Cuál es el deporte más popular en la Argentina?",
      answer: "El fútbol",
    },
    {
      value: 400,
      question: "¿Cómo se llama la avenida más ancha del mundo, en Buenos Aires?",
      answer: "La Avenida 9 de Julio",
    },
    {
      value: 600,
      question:
        "¿Qué barrio porteño es famoso por el tango, el Caminito y Boca?",
      answer: "La Boca",
    },
    {
      value: 800,
      question:
        "¿Qué teatro de Buenos Aires es uno de los más importantes del mundo para la ópera?",
      answer: "El Teatro Colón",
    },
    {
      value: 1000,
      question:
        "¿En qué año la Argentina organizó y ganó su primer Mundial de fútbol?",
      answer: "1978",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ MODO RELÁMPAGO — respuestas cortas (set alternativo)
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  // — Ciudades y geografía —
  { question: "¿En qué ciudad está la Casa Rosada?", answer: "Buenos Aires" },
  { question: "¿Qué ciudad es la 'cuna de la bandera'?", answer: "Rosario" },
  { question: "¿Qué ciudad es la capital del chocolate junto al Nahuel Huapi?", answer: "Bariloche" },
  { question: "¿Qué ciudad es 'La Docta'?", answer: "Córdoba" },
  { question: "¿Cuál es la ciudad más austral del país?", answer: "Ushuaia" },
  { question: "¿En qué provincia está el cerro Aconcagua?", answer: "Mendoza" },
  { question: "¿Qué río forma el Delta al norte de Buenos Aires?", answer: "El Paraná" },
  { question: "¿En qué provincia están las Cataratas del Iguazú?", answer: "Misiones" },
  { question: "¿En qué provincia está el cerro Fitz Roy?", answer: "Santa Cruz" },

  // — Historia y política —
  { question: "¿Qué se celebra el 25 de Mayo?", answer: "La Revolución de Mayo" },
  { question: "¿En qué año se declaró la Independencia?", answer: "1816" },
  { question: "¿Quién fue presidente al volver la democracia?", answer: "Raúl Alfonsín" },
  { question: "¿Quién fue la esposa de Perón, ícono popular?", answer: "Eva Perón (Evita)" },
  { question: "¿Quién creó la Bandera Argentina?", answer: "Manuel Belgrano" },
  { question: "¿Quién cruzó los Andes?", answer: "José de San Martín" },

  // — Fútbol —
  { question: "¿Quién dirige a la Scaloneta?", answer: "Lionel Scaloni" },
  { question: "¿Quién es el arquero 'Dibu'?", answer: "Emiliano Martínez" },
  { question: "¿Contra quién jugó Argentina la final de Qatar?", answer: "Francia" },
  { question: "¿Qué apodo tiene Sergio Agüero?", answer: "'el Kun'" },
  { question: "¿Quién hizo el segundo gol de Argentina en la final 2022?", answer: "Ángel Di María" },
  { question: "¿Quién metió 'La Mano de Dios'?", answer: "Diego Maradona" },
  { question: "¿Cuántos Mundiales ganó la Argentina?", answer: "3" },

  // — Música y cultura —
  { question: "¿Qué instrumento es el alma del tango?", answer: "El bandoneón" },
  { question: "¿Quién compuso 'Adiós Nonino'?", answer: "Astor Piazzolla" },
  { question: "¿Quién es el máximo ídolo del tango?", answer: "Carlos Gardel" },
  { question: "¿Qué cantora es 'La Negra'?", answer: "Mercedes Sosa" },
  { question: "¿Qué película de Campanella narra el juicio a las juntas?", answer: "Argentina, 1985" },
  { question: "¿Qué conductor está ligado al 'Bailando'?", answer: "Marcelo Tinelli" },
  { question: "¿Qué premio entrega APTRA?", answer: "El Martín Fierro" },

  // — Sabores —
  { question: "¿Qué empanada jugosa es típica del norte?", answer: "La salteña / tucumana" },
  { question: "¿Qué pizza porteña lleva mucha cebolla?", answer: "La fugazzeta" },
  { question: "¿Qué dulce lleva dos tapas y dulce de leche?", answer: "El alfajor" },

  // — Inventos, ciencia y deportes —
  { question: "¿Qué objeto de escritura patentó Bíró en Argentina?", answer: "La birome" },
  { question: "¿Qué médico desarrolló el bypass coronario?", answer: "René Favaloro" },
  { question: "¿Qué deporte juegan 'Las Leonas'?", answer: "El hockey sobre césped" },
  { question: "¿Qué basquetbolista argentino fue campeón de la NBA?", answer: "Manu Ginóbili" },
  { question: "¿Qué tenista ganó el US Open 2009?", answer: "Juan Martín del Potro" },
  { question: "¿Qué piloto fue 5 veces campeón de F1?", answer: "Juan Manuel Fangio" },

  // — Letras, naturaleza y curiosidades —
  { question: "¿Quién escribió 'Rayuela'?", answer: "Julio Cortázar" },
  { question: "¿Qué historieta de Quino odia la sopa?", answer: "Mafalda" },
  { question: "¿Quién escribió 'El Túnel'?", answer: "Ernesto Sábato" },
  { question: "¿Cuál es el ave nacional argentina?", answer: "El hornero" },
  { question: "¿Qué felino grande habita el norte argentino?", answer: "El yaguareté" },
  { question: "¿Qué difunta es venerada en San Juan?", answer: "La Difunta Correa" },
  { question: "¿Cómo se llama la avenida más ancha del mundo?", answer: "La 9 de Julio" },
  { question: "¿Qué teatro porteño es célebre por la ópera?", answer: "El Teatro Colón" },
];

// ═══════════════════════════════════════════════════════════════
// 🎯 PREGUNTAS DE ESTIMACIÓN — respuestas numéricas (set alternativo)
// ═══════════════════════════════════════════════════════════════
export const ESTIMATION_QUESTIONS = [
  // — Historia —
  { question: "¿En qué año fue la Revolución de Mayo?", answer: 1810 },
  { question: "¿En qué año se declaró la Independencia argentina?", answer: 1816 },
  { question: "¿En qué año fue la Batalla de Chacabuco?", answer: 1817 },
  { question: "¿En qué año volvió la democracia con Alfonsín?", answer: 1983 },
  { question: "¿En qué año fue elegido el Papa Francisco?", answer: 2013 },
  { question: "¿En qué año votaron las mujeres por primera vez en Argentina?", answer: 1951 },

  // — Fútbol —
  { question: "¿En qué año ganó Argentina su primer Mundial?", answer: 1978 },
  { question: "¿En qué año ganó Argentina el Mundial con Maradona?", answer: 1986 },
  { question: "¿En qué año ganó Argentina el Mundial de Qatar?", answer: 2022 },
  { question: "¿En qué año ganó Argentina la Copa América en el Maracaná?", answer: 2021 },
  { question: "¿Cuántos goles hizo Messi en el Mundial 2022?", answer: 7 },
  { question: "¿Cuántos Mundiales ganó la Argentina?", answer: 3 },
  { question: "¿Cuántas Copas América ganó Argentina hasta 2024?", answer: 16 },
  { question: "¿Cuántos Balones de Oro tiene Messi hasta 2024?", answer: 8 },

  // — Ciencia, deporte y cultura —
  { question: "¿En qué año se inauguró el subte de Buenos Aires?", answer: 1913 },
  { question: "¿En qué año se estrenó 'El Apóstol', el primer largometraje animado?", answer: 1917 },
  { question: "¿Cuántos títulos de F1 ganó Fangio?", answer: 5 },
  { question: "¿Cuántos anillos de la NBA ganó Manu Ginóbili?", answer: 4 },
  { question: "¿Cuántos Premios Nobel ganó la Argentina en total?", answer: 5 },

  // — Geografía y datos —
  { question: "¿Cuántas provincias tiene Argentina (sin contar CABA)?", answer: 23 },
  { question: "¿Con cuántos países limita Argentina?", answer: 5 },
  { question: "¿Cuántos metros mide el Aconcagua (aprox)?", answer: 6961 },
];
