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
      question: "¿Cuál es la capital de la Argentina?",
      answer: "Buenos Aires",
    },
    {
      value: 400,
      question: "¿Qué océano baña las costas argentinas?",
      answer: "El Atlántico",
    },
    {
      value: 600,
      question: "¿Cuál es el pico más alto de Argentina y de América?",
      answer: "El Aconcagua",
    },
    {
      value: 800,
      question: "¿Con cuántos países limita la Argentina?",
      answer: "5 (Chile, Bolivia, Paraguay, Brasil y Uruguay)",
    },
    {
      value: 1000,
      question: "¿Cuál es el río más largo de la Argentina?",
      answer: "El Paraná",
    },
  ],
  "Historia Argentina": [
    {
      value: 200,
      question: "¿Qué se celebra el 25 de Mayo?",
      answer: "La Revolución de Mayo (1810)",
    },
    {
      value: 400,
      question: "¿Qué se conmemora el 9 de Julio?",
      answer: "La Declaración de la Independencia (1816)",
    },
    {
      value: 600,
      question: "¿En qué ciudad se declaró la Independencia en 1816?",
      answer: "San Miguel de Tucumán",
    },
    {
      value: 800,
      question: "¿En qué año volvió la democracia con Raúl Alfonsín?",
      answer: "1983",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llamó el plan económico de 1985 que reemplazó al peso por el austral?",
      answer: "El Plan Austral",
    },
  ],
  "Próceres y Patriotas": [
    {
      value: 200,
      question: "¿Quién creó la Bandera Argentina?",
      answer: "Manuel Belgrano",
    },
    {
      value: 400,
      question:
        "¿Qué prócer cruzó los Andes para liberar Chile y Perú?",
      answer: "José de San Martín",
    },
    {
      value: 600,
      question:
        "¿Quién fue el primer presidente bajo la Constitución de 1853?",
      answer: "Justo José de Urquiza",
    },
    {
      value: 800,
      question:
        "¿Qué presidente es llamado 'el padre del aula' por impulsar la educación?",
      answer: "Domingo Faustino Sarmiento",
    },
    {
      value: 1000,
      question: "¿Quién escribió la letra del Himno Nacional Argentino?",
      answer: "Vicente López y Planes",
    },
  ],
  "Fútbol Argentino": [
    {
      value: 200,
      question: "¿Qué club es conocido como 'El Xeneize'?",
      answer: "Boca Juniors",
    },
    {
      value: 400,
      question: "¿Qué club es conocido como 'El Millonario'?",
      answer: "River Plate",
    },
    {
      value: 600,
      question: "¿Cómo se llama el clásico de Avellaneda?",
      answer: "Independiente vs Racing",
    },
    {
      value: 800,
      question:
        "¿Qué club argentino ganó la primera Copa Libertadores del país, en 1964?",
      answer: "Independiente",
    },
    {
      value: 1000,
      question: "¿Cómo se llama el estadio donde es local Boca Juniors?",
      answer: "La Bombonera (Estadio Alberto J. Armando)",
    },
  ],
  "Maradona y Messi": [
    {
      value: 200,
      question: "¿En qué club debutó Maradona en primera división?",
      answer: "Argentinos Juniors",
    },
    {
      value: 400,
      question: "¿En qué club italiano fue ídolo absoluto Maradona?",
      answer: "Napoli",
    },
    {
      value: 600,
      question: "¿En qué club europeo se formó y consagró Messi?",
      answer: "FC Barcelona",
    },
    {
      value: 800,
      question: "¿En qué club de Estados Unidos juega Messi desde 2023?",
      answer: "Inter Miami",
    },
    {
      value: 1000,
      question: "¿En qué año Maradona ganó el Mundial como jugador?",
      answer: "1986",
    },
  ],
  "Rock Nacional": [
    {
      value: 200,
      question: "¿Quién fue el cantante y líder de Soda Stereo?",
      answer: "Gustavo Cerati",
    },
    {
      value: 400,
      question: "¿De qué banda es la canción 'Matador'?",
      answer: "Los Fabulosos Cadillacs",
    },
    {
      value: 600,
      question: "¿Qué músico es apodado 'El Flaco'?",
      answer: "Luis Alberto Spinetta",
    },
    {
      value: 800,
      question: "¿De qué banda de los 80 era líder Luca Prodan?",
      answer: "Sumo",
    },
    {
      value: 1000,
      question:
        "¿Qué banda formó Charly García junto a David Lebón a fines de los 70?",
      answer: "Serú Girán",
    },
  ],
  "Tango y Folklore": [
    {
      value: 200,
      question: "¿Qué baile es el emblema musical del Río de la Plata?",
      answer: "El tango",
    },
    {
      value: 400,
      question: "¿Qué ídolo máximo del tango falleció en un accidente en 1935?",
      answer: "Carlos Gardel",
    },
    {
      value: 600,
      question: "¿Qué festival de folklore se celebra cada enero en Córdoba?",
      answer: "El Festival de Cosquín",
    },
    {
      value: 800,
      question:
        "¿Qué compositor revolucionó el tango con 'Libertango' y 'Adiós Nonino'?",
      answer: "Astor Piazzolla",
    },
    {
      value: 1000,
      question:
        "¿Qué cantora folklórica es conocida como 'La Negra' e interpretó 'Alfonsina y el Mar'?",
      answer: "Mercedes Sosa",
    },
  ],
  "Comida y Bebida": [
    {
      value: 200,
      question: "¿Qué infusión típica se toma con bombilla?",
      answer: "El mate",
    },
    {
      value: 400,
      question: "¿Qué dulce untable es un emblema de la Argentina?",
      answer: "El dulce de leche",
    },
    {
      value: 600,
      question:
        "¿Qué dulce de dos tapas rellenas de dulce de leche y bañadas es típico?",
      answer: "El alfajor",
    },
    {
      value: 800,
      question: "¿Qué bebida con fernet es típica de Córdoba?",
      answer: "Fernet con Coca",
    },
    {
      value: 1000,
      question:
        "¿Qué corte de carne con forma alargada y triangular es típico del asado?",
      answer: "El vacío",
    },
  ],
  "Tele y Cine Argentino": [
    {
      value: 200,
      question: "¿En qué canal se emite Gran Hermano Argentina?",
      answer: "Telefe",
    },
    {
      value: 400,
      question:
        "¿Qué actor protagonizó 'El Secreto de sus Ojos' y 'Relatos Salvajes'?",
      answer: "Ricardo Darín",
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
        "¿Qué película argentina de 1985 sobre la dictadura ganó el Oscar extranjero ese año?",
      answer: "La Historia Oficial",
    },
    {
      value: 1000,
      question: "¿Qué productora creó Chiquititas y Casi Ángeles?",
      answer: "Cris Morena",
    },
  ],
  "Famosos Argentinos": [
    {
      value: 200,
      question: "¿Qué Papa argentino fue elegido en 2013?",
      answer: "Francisco (Jorge Bergoglio)",
    },
    {
      value: 400,
      question:
        "¿Qué productor musical argentino es famoso por sus 'Music Sessions'?",
      answer: "Bizarrap",
    },
    {
      value: 600,
      question: "¿Qué tenista argentino ganó el US Open en 2009?",
      answer: "Juan Martín del Potro",
    },
    {
      value: 800,
      question:
        "¿Qué piloto argentino ganó 5 títulos de Fórmula 1 en los años 50?",
      answer: "Juan Manuel Fangio",
    },
    {
      value: 1000,
      question: "¿Qué escritor argentino es autor de 'Ficciones' y 'El Aleph'?",
      answer: "Jorge Luis Borges",
    },
  ],
  "Provincias y Ciudades": [
    {
      value: 200,
      question: "¿En qué provincia está la ciudad de Bariloche?",
      answer: "Río Negro",
    },
    {
      value: 400,
      question: "¿Cuál es la segunda ciudad más poblada de la Argentina?",
      answer: "Córdoba",
    },
    {
      value: 600,
      question: "¿En qué provincia están las Cataratas del Iguazú?",
      answer: "Misiones",
    },
    {
      value: 800,
      question: "¿Cuál es la capital de la provincia de Santa Fe?",
      answer: "La ciudad de Santa Fe (no Rosario)",
    },
    {
      value: 1000,
      question: "¿Cuántas provincias tiene la Argentina, sin contar la CABA?",
      answer: "23",
    },
  ],
  "Naturaleza Argentina": [
    {
      value: 200,
      question: "¿Qué animal parecido a una llama es símbolo de la Patagonia?",
      answer: "El guanaco",
    },
    {
      value: 400,
      question: "¿Qué glaciar famoso está en la provincia de Santa Cruz?",
      answer: "El Perito Moreno",
    },
    {
      value: 600,
      question: "¿Cuál es el ave nacional de la Argentina?",
      answer: "El hornero",
    },
    {
      value: 800,
      question:
        "¿Cuál es el felino más grande de la Argentina, que habita el norte?",
      answer: "El yaguareté",
    },
    {
      value: 1000,
      question:
        "¿Qué península de Chubut es famosa por sus ballenas y pingüinos?",
      answer: "Península Valdés",
    },
  ],
  "Tradiciones y Costumbres": [
    {
      value: 200,
      question: "¿Qué se come tradicionalmente los días 29 de cada mes?",
      answer: "Ñoquis",
    },
    {
      value: 400,
      question: "¿Cómo se llama el jinete del campo, símbolo de la tradición?",
      answer: "El gaucho",
    },
    {
      value: 600,
      question: "¿Qué obra de José Hernández narra la vida de un gaucho?",
      answer: "El Martín Fierro",
    },
    {
      value: 800,
      question: "¿Qué baile folklórico se baila en pareja agitando pañuelos?",
      answer: "La zamba",
    },
    {
      value: 1000,
      question: "¿Qué día se celebra el Día de la Tradición en la Argentina?",
      answer: "El 10 de noviembre",
    },
  ],
  "Ciencia y Premios Nobel": [
    {
      value: 200,
      question: "¿Cuántos Premios Nobel ganó la Argentina en total?",
      answer: "5",
    },
    {
      value: 400,
      question:
        "¿Qué argentino ganó el Nobel de Química en 1970 por el estudio de los azúcares?",
      answer: "Luis Federico Leloir",
    },
    {
      value: 600,
      question:
        "¿Qué argentino ganó el Nobel de la Paz en 1980 por la defensa de los derechos humanos?",
      answer: "Adolfo Pérez Esquivel",
    },
    {
      value: 800,
      question: "¿Qué médico argentino desarrolló el bypass coronario?",
      answer: "René Favaloro",
    },
    {
      value: 1000,
      question:
        "¿Qué argentino fue el primer latinoamericano en ganar el Nobel de la Paz, en 1936?",
      answer: "Carlos Saavedra Lamas",
    },
  ],
  "Lunfardo y Dichos": [
    {
      value: 200,
      question: "¿Qué significa 'laburar' en lunfardo?",
      answer: "Trabajar",
    },
    {
      value: 400,
      question: "¿Qué significa 'morfar' en lunfardo?",
      answer: "Comer",
    },
    {
      value: 600,
      question: "¿Qué significa 'quilombo'?",
      answer: "Lío, desorden",
    },
    {
      value: 800,
      question: "¿Qué significa 'estar al pedo'?",
      answer: "No tener nada que hacer (estar ocioso)",
    },
    {
      value: 1000,
      question: "¿Qué significa 'hacer la gamba'?",
      answer: "Ayudar / dar una mano",
    },
  ],
  "Símbolos Patrios": [
    {
      value: 200,
      question: "¿De qué colores es la Bandera Argentina?",
      answer: "Celeste y blanca (con el sol amarillo)",
    },
    {
      value: 400,
      question: "¿Qué figura está en el centro de la Bandera Argentina?",
      answer: "El Sol de Mayo",
    },
    {
      value: 600,
      question: "¿Cuál es la flor nacional de la Argentina?",
      answer: "El ceibo (la flor del ceibo)",
    },
    {
      value: 800,
      question:
        "¿Qué gorro rojo, símbolo de libertad, aparece en el Escudo Nacional?",
      answer: "El gorro frigio",
    },
    {
      value: 1000,
      question: "¿Quién compuso la música del Himno Nacional Argentino?",
      answer: "Blas Parera",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ BANCO DE PREGUNTAS — MODO RELÁMPAGO (clásico)
// (Respuesta corta. No repetir preguntas del banco QUESTIONS.)
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  // — Geografía y provincias —
  { question: "¿Cuál es la capital de la provincia de Córdoba?", answer: "Córdoba" },
  { question: "¿En qué provincia está la ciudad de Mendoza?", answer: "Mendoza" },
  { question: "¿En qué provincia está la ciudad de Rosario?", answer: "Santa Fe" },
  { question: "¿Cuál es la provincia más al norte de la Argentina?", answer: "Jujuy" },
  { question: "¿Qué cordillera recorre el oeste argentino?", answer: "Los Andes" },
  { question: "¿Cómo se llama la gran llanura agrícola del centro del país?", answer: "La Pampa" },
  { question: "¿Cuál es la ciudad más austral de la Argentina?", answer: "Ushuaia" },
  { question: "¿Qué estrecho separa el continente de Tierra del Fuego?", answer: "El Estrecho de Magallanes" },
  { question: "¿En qué provincia están las salinas del norte?", answer: "Jujuy / Salta" },

  // — Historia y próceres —
  { question: "¿Qué día patrio se celebra el 9 de Julio?", answer: "La Independencia" },
  { question: "¿Quién condujo el cruce de los Andes?", answer: "José de San Martín" },
  { question: "¿En qué ciudad ondeó por primera vez la bandera?", answer: "Rosario" },
  { question: "¿Qué primera dama impulsó el voto femenino?", answer: "Eva Perón (Evita)" },
  { question: "¿Cómo se llama la plaza frente a la Casa Rosada?", answer: "Plaza de Mayo" },
  { question: "¿De qué color es la Casa de Gobierno?", answer: "Rosa (Casa Rosada)" },
  { question: "¿Qué prócer ganó la Batalla de Tucumán en 1812?", answer: "Manuel Belgrano" },

  // — Fútbol —
  { question: "¿Qué club es 'El Millonario'?", answer: "River Plate" },
  { question: "¿Qué club es 'El Xeneize'?", answer: "Boca Juniors" },
  { question: "¿Cómo se llama el clásico entre Boca y River?", answer: "El Superclásico" },
  { question: "¿Cómo se llama el estadio de Boca?", answer: "La Bombonera" },
  { question: "¿Quién es el capitán campeón en Qatar 2022?", answer: "Lionel Messi" },
  { question: "¿Quién es el arquero apodado 'Dibu'?", answer: "Emiliano Martínez" },
  { question: "¿Quién dirige a la Selección campeona del mundo?", answer: "Lionel Scaloni" },
  { question: "¿En qué club italiano fue ídolo Maradona?", answer: "Napoli" },

  // — Comida, mate y tradiciones —
  { question: "¿Con qué recipiente se toma el mate?", answer: "El mate (calabaza)" },
  { question: "¿Qué planta se usa para el mate?", answer: "La yerba mate" },
  { question: "¿Qué dulce untable es emblema del país?", answer: "El dulce de leche" },
  { question: "¿Qué dulce se hace con dos tapas y dulce de leche?", answer: "El alfajor" },
  { question: "¿Qué se come tradicionalmente los 29 de cada mes?", answer: "Ñoquis" },

  // — Música —
  { question: "¿Quién cantaba en Soda Stereo?", answer: "Gustavo Cerati" },
  { question: "¿De qué banda es 'Matador'?", answer: "Los Fabulosos Cadillacs" },
  { question: "¿Qué banda lideró Spinetta a fines de los 60?", answer: "Almendra" },
  { question: "¿Quién lideró Sumo?", answer: "Luca Prodan" },
  { question: "¿Qué cantora folklórica es 'La Negra'?", answer: "Mercedes Sosa" },
  { question: "¿Qué baile nació en el Río de la Plata?", answer: "El tango" },
  { question: "¿Qué ídolo del tango murió en 1935?", answer: "Carlos Gardel" },

  // — Tele, cine y famosos —
  { question: "¿En qué canal va Gran Hermano Argentina?", answer: "Telefe" },
  { question: "¿Qué actor protagonizó 'Relatos Salvajes'?", answer: "Ricardo Darín" },
  { question: "¿Qué Papa es argentino?", answer: "Francisco" },
  { question: "¿Qué productor es famoso por las 'Music Sessions'?", answer: "Bizarrap" },
  { question: "¿Qué tenista argentino ganó el US Open 2009?", answer: "Juan Martín del Potro" },
  { question: "¿Qué piloto argentino fue 5 veces campeón de F1?", answer: "Juan Manuel Fangio" },
  { question: "¿Qué escritor argentino escribió 'Ficciones'?", answer: "Jorge Luis Borges" },

  // — Naturaleza y símbolos —
  { question: "¿Cuál es el ave nacional argentina?", answer: "El hornero" },
  { question: "¿Cuál es la flor nacional argentina?", answer: "El ceibo" },
  { question: "¿Qué figura está en el centro de la bandera?", answer: "El Sol de Mayo" },
  { question: "¿Qué glaciar famoso está en Santa Cruz?", answer: "El Perito Moreno" },
  { question: "¿Cómo se llama el jinete del campo argentino?", answer: "El gaucho" },

  // — Lunfardo —
  { question: "¿Qué significa 'laburar'?", answer: "Trabajar" },
  { question: "¿Qué significa 'morfar'?", answer: "Comer" },
  { question: "¿Qué significa 'pibe'?", answer: "Chico / joven" },
];

// ═══════════════════════════════════════════════════════════════
// 🎯 PREGUNTAS DE ESTIMACIÓN — respuestas numéricas (clásico)
// ═══════════════════════════════════════════════════════════════
export const ESTIMATION_QUESTIONS = [
  // — Historia —
  { question: "¿En qué año fue la Revolución de Mayo?", answer: 1810 },
  { question: "¿En qué año se declaró la Independencia argentina?", answer: 1816 },
  { question: "¿En qué año volvió la democracia con Alfonsín?", answer: 1983 },
  { question: "¿En qué año fue la crisis del 'corralito'?", answer: 2001 },
  { question: "¿En qué año votaron las mujeres por primera vez en Argentina?", answer: 1951 },
  { question: "¿En qué año fue elegido el Papa Francisco?", answer: 2013 },

  // — Fútbol —
  { question: "¿En qué año Argentina ganó su primer Mundial?", answer: 1978 },
  { question: "¿En qué año Argentina ganó el Mundial con Maradona en México?", answer: 1986 },
  { question: "¿En qué año Argentina ganó el Mundial de Qatar?", answer: 2022 },
  { question: "¿En qué año Argentina ganó la Copa América en el Maracaná?", answer: 2021 },
  { question: "¿En qué año murió Diego Maradona?", answer: 2020 },
  { question: "¿En qué año nació Lionel Messi?", answer: 1987 },
  { question: "¿Cuántos Balones de Oro tiene Messi hasta 2024?", answer: 8 },
  { question: "¿Cuántas Copas América ganó Argentina hasta 2024?", answer: 16 },
  { question: "¿En qué año se fundó Boca Juniors?", answer: 1905 },
  { question: "¿En qué año se fundó River Plate?", answer: 1901 },
  { question: "¿Cuántas estrellas tiene la camiseta argentina desde 2022?", answer: 3 },

  // — Geografía y datos —
  { question: "¿Cuántas provincias tiene Argentina (sin contar CABA)?", answer: 23 },
  { question: "¿Con cuántos países limita Argentina?", answer: 5 },
  { question: "¿Cuántos metros mide el Aconcagua (aprox)?", answer: 6961 },
  { question: "¿Cuántos Premios Nobel ganó Argentina en total?", answer: 5 },

  // — Cultura —
  { question: "¿En qué año fue la primera edición de Gran Hermano Argentina?", answer: 2001 },
  { question: "¿En qué año murió Carlos Gardel?", answer: 1935 },
];
