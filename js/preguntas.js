// ═══════════════════════════════════════════════════════════════
// 🃏 POOL DE CATEGORÍAS
// ═══════════════════════════════════════════════════════════════
export const CATEGORY_POOL = [
  "Trota Mundos",
  "Tierra Albiceleste",
  "Historia Argentina",
  "Próceres y Patriotas",
  "Pies de Plomo",
  "Maradona y Messi",
  "Boca, River y Cía",
  "Rock Nacional",
  "El Mate y el Asado",
  "Tele Argenta",
  "Ibai y los Streamers",
  "Cine y Series",
  "Cultura Pop 2000s",
  "Ciencia y Espacio",
  "Cuerpo y Naturaleza",
  "Récords y Números",
];

export function pickRandomCategories(pool, count = 6, exclude = []) {
  const available = pool.filter((cat) => !exclude.includes(cat));
  const source = available.length >= count ? available : pool;
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}

// ═══════════════════════════════════════════════════════════════
// 📝 BANCO DE PREGUNTAS — EDITA AQUÍ
// ═══════════════════════════════════════════════════════════════
export const QUESTIONS = {
  "Trota Mundos": [
    {
      value: 200,
      question: "¿Cuál es la capital de Brasil?",
      answer: "Brasilia",
    },
    {
      value: 400,
      question: "¿En qué continente está Egipto?",
      answer: "África",
    },
    {
      value: 600,
      question: "¿Cuál es el país más grande del mundo por superficie?",
      answer: "Rusia",
    },
    {
      value: 800,
      question: "¿Cuál es la cordillera más larga del mundo?",
      answer: "Los Andes",
    },
    {
      value: 1000,
      question: "¿Cuál es el país más pequeño del mundo?",
      answer: "Ciudad del Vaticano",
    },
  ],
  "Tierra Albiceleste": [
    {
      value: 200,
      question: "¿Cuál es la capital de Argentina?",
      answer: "Buenos Aires",
    },
    {
      value: 400,
      question: "¿En qué provincia están las Cataratas del Iguazú?",
      answer: "Misiones",
    },
    {
      value: 600,
      question: "¿Cuál es la provincia argentina con mayor superficie?",
      answer: "Buenos Aires",
    },
    {
      value: 800,
      question: "¿En qué provincia argentina está el Glaciar Perito Moreno?",
      answer: "Santa Cruz",
    },
    {
      value: 1000,
      question: "¿Cómo se llama el lago más grande de la Patagonia argentina?",
      answer: "Lago Argentino (Santa Cruz)",
    },
  ],
  "Historia Argentina": [
    {
      value: 200,
      question: "¿En qué año declaró Argentina su independencia?",
      answer: "1816",
    },
    {
      value: 400,
      question:
        "¿Cómo se llamó la guerra de 1982 entre Argentina y Gran Bretaña?",
      answer: "Guerra de Malvinas",
    },
    {
      value: 600,
      question: "¿En qué año comenzó la última dictadura militar argentina?",
      answer: "1976",
    },
    {
      value: 800,
      question: "¿En qué año recuperó Argentina la democracia?",
      answer: "1983",
    },
    {
      value: 1000,
      question:
        "¿En qué año fue la crisis del corralito que terminó con varios presidentes en pocos días?",
      answer: "2001",
    },
  ],
  "Próceres y Patriotas": [
    {
      value: 200,
      question: "¿Quién cruzó los Andes para liberar Chile y Perú?",
      answer: "José de San Martín",
    },
    {
      value: 400,
      question: "¿Quién creó la Bandera Argentina?",
      answer: "Manuel Belgrano",
    },
    {
      value: 600,
      question: "¿Quién escribió 'Facundo: Civilización y Barbarie'?",
      answer: "Domingo Faustino Sarmiento",
    },
    {
      value: 800,
      question: "¿Quién escribió la letra del Himno Nacional Argentino?",
      answer: "Vicente López y Planes",
    },
    {
      value: 1000,
      question: "¿En qué pueblo de Corrientes nació José de San Martín?",
      answer: "Yapeyú",
    },
  ],
  "Pies de Plomo": [
    {
      value: 200,
      question: "¿Cuántos Mundiales ganó la Selección Argentina?",
      answer: "3 (1978, 1986 y 2022)",
    },
    {
      value: 400,
      question:
        "¿Quién fue el DT campeón del mundo con Argentina en Qatar 2022?",
      answer: "Lionel Scaloni",
    },
    {
      value: 600,
      question:
        "¿Contra qué selección Argentina ganó por penales en los cuartos del Mundial de Qatar?",
      answer: "Países Bajos",
    },
    {
      value: 800,
      question:
        "¿Cuántos goles marcó Gabriel Batistuta con la Selección Argentina?",
      answer: "56 goles",
    },
    {
      value: 1000,
      question: "¿Quién fue el arquero titular de Argentina campeona en México 86?",
      answer: "Nery Pumpido",
    },
  ],
  "Maradona y Messi": [
    {
      value: 200,
      question: "¿Qué número de camiseta usó Maradona en el Mundial 86?",
      answer: "10",
    },
    {
      value: 400,
      question: "¿Contra qué selección Maradona hizo el 'gol del siglo'?",
      answer: "Inglaterra (Mundial 1986)",
    },
    {
      value: 600,
      question: "¿Cuántos Balones de Oro ganó Lionel Messi hasta 2024?",
      answer: "8",
    },
    {
      value: 800,
      question:
        "¿Con qué club Messi ganó su primer Mundial de Clubes en 2009?",
      answer: "FC Barcelona",
    },
    {
      value: 1000,
      question: "¿En qué año Maradona ganó la Copa UEFA con el Napoli?",
      answer: "1989",
    },
  ],
  "Boca, River y Cía": [
    {
      value: 200,
      question: "¿Cómo se llama el estadio de Boca Juniors?",
      answer: "La Bombonera (Alberto J. Armando)",
    },
    {
      value: 400,
      question: "¿Cómo se llama el estadio de River Plate?",
      answer: "El Monumental",
    },
    {
      value: 600,
      question: "¿Cuántas Copas Libertadores ganó Boca Juniors?",
      answer: "6",
    },
    {
      value: 800,
      question:
        "¿En qué ciudad se jugó la final River-Boca de la Libertadores 2018?",
      answer: "Madrid",
    },
    {
      value: 1000,
      question: "¿Con qué apodo se conoce al estadio de Racing Club de Avellaneda?",
      answer: "El Cilindro (Presidente Perón)",
    },
  ],
  "Rock Nacional": [
    {
      value: 200,
      question: "¿De qué banda argentina es la canción 'De Música Ligera'?",
      answer: "Soda Stereo",
    },
    {
      value: 400,
      question:
        "¿Quién era el cantante de Patricio Rey y sus Redonditos de Ricota?",
      answer: "El Indio Solari",
    },
    {
      value: 600,
      question: "¿En qué año murió Gustavo Cerati?",
      answer: "2014",
    },
    {
      value: 800,
      question: "¿De qué banda fueron Charly García y Nito Mestre en los 70?",
      answer: "Sui Generis",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama el último álbum de estudio de Soda Stereo antes de separarse?",
      answer: "Sueño Stereo (1995)",
    },
  ],
  "El Mate y el Asado": [
    {
      value: 200,
      question:
        "¿Cómo se llama la salsa verde con ajo y perejil que acompaña al asado?",
      answer: "Chimichurri",
    },
    {
      value: 400,
      question:
        "¿Cómo se conoce al corte de costillas cortado transversal al hueso?",
      answer: "Asado de tira",
    },
    {
      value: 600,
      question:
        "¿Cómo se llaman las glándulas del timo de ternera que se cocinan a la parrilla?",
      answer: "Mollejas",
    },
    {
      value: 800,
      question: "¿Cómo se llama la pieza metálica del mate por la que se toma?",
      answer: "La bombilla",
    },
    {
      value: 1000,
      question: "¿Cuál es el nombre científico de la planta de la yerba mate?",
      answer: "Ilex paraguariensis",
    },
  ],
  "Tele Argenta": [
    {
      value: 200,
      question: "¿Quién condujo ShowMatch durante más de tres décadas?",
      answer: "Marcelo Tinelli",
    },
    {
      value: 400,
      question: "¿En qué canal argentino se emite Gran Hermano?",
      answer: "Telefe",
    },
    {
      value: 600,
      question: "¿Cómo se llamaba el ciclo de almuerzos de Mirtha Legrand?",
      answer: "Almorzando con Mirtha Legrand",
    },
    {
      value: 800,
      question: "¿Cómo se llama el programa de chimentos que condujo Ángel de Brito?",
      answer: "LAM (Los Ángeles de la Mañana)",
    },
    {
      value: 1000,
      question:
        "¿En qué año se emitió por primera vez Gran Hermano Argentina?",
      answer: "2001",
    },
  ],
  "Ibai y los Streamers": [
    {
      value: 200,
      question: "¿En qué plataforma hace streams Ibai Llanos?",
      answer: "Twitch",
    },
    {
      value: 400,
      question:
        "¿Cómo se llama el torneo de boxeo de famosos organizado por Ibai?",
      answer: "La Velada del Año",
    },
    {
      value: 600,
      question:
        "¿Cómo se llama el torneo de fútbol 7 cofundado por Ibai y Gerard Piqué?",
      answer: "Kings League",
    },
    {
      value: 800,
      question:
        "¿Cuál es el nombre real del streamer argentino conocido como 'Coscu'?",
      answer: "Martín Pérez Disalvo",
    },
    {
      value: 1000,
      question:
        "¿Cuál es el nombre real del streamer argentino conocido como 'Spreen'?",
      answer: "Iván Buhajeruk",
    },
  ],
  "Cine y Series": [
    {
      value: 200,
      question:
        "¿Qué actor interpreta a Tony Stark / Iron Man en el universo Marvel?",
      answer: "Robert Downey Jr.",
    },
    {
      value: 400,
      question:
        "¿Qué película argentina ganó el Oscar a Mejor Película Extranjera en 2010?",
      answer: "El Secreto de sus Ojos",
    },
    {
      value: 600,
      question: "¿Quién dirigió 'El Secreto de sus Ojos'?",
      answer: "Juan José Campanella",
    },
    {
      value: 800,
      question: "¿Cuántos premios Oscar ganó Titanic en 1998?",
      answer: "11",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama la serie argentina de presos que se hizo furor en Netflix?",
      answer: "El Marginal",
    },
  ],
  "Cultura Pop 2000s": [
    {
      value: 200,
      question:
        "¿Cómo se llama la app china de videos cortos que arrasó en todo el mundo?",
      answer: "TikTok",
    },
    {
      value: 400,
      question: "¿En qué año salió a la venta el primer iPhone?",
      answer: "2007",
    },
    {
      value: 600,
      question:
        "¿Cómo se llamaba el juego viral de 2016 que usaba realidad aumentada para atrapar Pokémon en la calle?",
      answer: "Pokémon GO",
    },
    {
      value: 800,
      question:
        "¿Cómo se llamaba el challenge viral de 2014 en el que la gente se tiraba un balde de agua helada?",
      answer: "Ice Bucket Challenge",
    },
    {
      value: 1000,
      question: "¿En qué año se publicó el primer tweet de la historia?",
      answer: "2006",
    },
  ],
  "Ciencia y Espacio": [
    {
      value: 200,
      question: "¿Qué planeta del sistema solar está más cerca del Sol?",
      answer: "Mercurio",
    },
    {
      value: 400,
      question:
        "¿Cuántos planetas tiene el sistema solar tras la reclasificación de Plutón?",
      answer: "8",
    },
    {
      value: 600,
      question: "¿En qué año el hombre llegó a la Luna por primera vez?",
      answer: "1969",
    },
    {
      value: 800,
      question:
        "¿Qué científico argentino ganó el Premio Nobel de Química en 1970?",
      answer: "Luis Federico Leloir",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama el telescopio espacial lanzado por NASA en 2021, sucesor del Hubble?",
      answer: "James Webb",
    },
  ],
  "Cuerpo y Naturaleza": [
    {
      value: 200,
      question: "¿Cuál es el animal terrestre más rápido del mundo?",
      answer: "El guepardo",
    },
    {
      value: 400,
      question: "¿Cuál es el hueso más largo del cuerpo humano?",
      answer: "El fémur",
    },
    {
      value: 600,
      question: "¿Cuántos huesos tiene un cuerpo humano adulto?",
      answer: "206",
    },
    {
      value: 800,
      question: "¿Cuál es el único mamífero capaz de volar?",
      answer: "El murciélago",
    },
    {
      value: 1000,
      question: "¿Cuántas neuronas tiene aproximadamente el cerebro humano?",
      answer: "86 mil millones (aceptar entre 80 y 100 mil millones)",
    },
  ],
  "Récords y Números": [
    {
      value: 200,
      question: "¿Cuántas provincias tiene Argentina?",
      answer: "23 (más la Ciudad Autónoma de Buenos Aires)",
    },
    {
      value: 400,
      question: "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022?",
      answer: "7",
    },
    {
      value: 600,
      question: "¿Cuántos Mundiales de fútbol ganó Brasil?",
      answer: "5",
    },
    {
      value: 800,
      question: "¿Cuántos Grand Slams ganó Rafael Nadal en total?",
      answer: "22",
    },
    {
      value: 1000,
      question:
        "¿Cuántos goles marcó Batistuta en la temporada 94/95 con la Fiorentina, récord de la Serie A en ese momento?",
      answer: "26",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ BANCO DE PREGUNTAS — MODO RELÁMPAGO
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  // — Argentina: geografía, historia, cultura —
  { question: "¿Cuál es la capital de Argentina?", answer: "Buenos Aires" },
  { question: "¿Cuántas provincias tiene Argentina?", answer: "23 (más CABA)" },
  { question: "¿En qué provincia están las Cataratas del Iguazú?", answer: "Misiones" },
  { question: "¿En qué provincia está el Glaciar Perito Moreno?", answer: "Santa Cruz" },
  { question: "¿Cuál es el río más largo de Argentina?", answer: "El Paraná" },
  { question: "¿Cuál es la montaña más alta de América?", answer: "El Aconcagua" },
  { question: "¿En qué ciudad argentina está el Obelisco?", answer: "Buenos Aires" },
  { question: "¿En qué año declaró Argentina su independencia?", answer: "1816" },
  { question: "¿En qué año comenzó la última dictadura militar argentina?", answer: "1976" },
  { question: "¿En qué año recuperó Argentina la democracia?", answer: "1983" },
  { question: "¿En qué año fue la crisis del corralito?", answer: "2001" },
  { question: "¿Cómo se llamó la guerra de 1982 contra Gran Bretaña?", answer: "Guerra de Malvinas" },
  { question: "¿Quién cruzó los Andes con el Ejército?", answer: "San Martín" },
  { question: "¿Quién creó la bandera argentina?", answer: "Manuel Belgrano" },
  { question: "¿Quién escribió 'Facundo'?", answer: "Sarmiento" },
  { question: "¿Cómo se llama el papa nacido en Buenos Aires?", answer: "Francisco (Jorge Bergoglio)" },
  { question: "¿Quién inventó el bypass coronario?", answer: "René Favaloro" },
  { question: "¿Quién fue el primer presidente argentino tras la dictadura?", answer: "Raúl Alfonsín" },

  // — Fútbol argentino —
  { question: "¿Cuántos Mundiales ganó la Selección Argentina?", answer: "3" },
  { question: "¿En qué año Argentina ganó el Mundial de Qatar?", answer: "2022" },
  { question: "¿Quién es el DT campeón con Argentina en Qatar 2022?", answer: "Lionel Scaloni" },
  { question: "¿Qué número de camiseta usó Maradona en el 86?", answer: "10" },
  { question: "¿En qué año nació Lionel Messi?", answer: "1987" },
  { question: "¿Con qué club debutó Messi en primera?", answer: "FC Barcelona" },
  { question: "¿Cuál es el apodo de Lionel Messi?", answer: "La Pulga" },
  { question: "¿Cuál es el apodo de Sergio Agüero?", answer: "El Kun" },
  { question: "¿Cuál es el apodo de Lautaro Martínez?", answer: "El Toro" },
  { question: "¿Cómo se llama el estadio de Boca?", answer: "La Bombonera" },
  { question: "¿Cómo se llama el estadio de River?", answer: "El Monumental" },
  { question: "¿Cuántas Copas Libertadores ganó Boca Juniors?", answer: "6" },
  { question: "¿En qué ciudad se jugó la final River-Boca de la Libertadores 2018?", answer: "Madrid" },
  { question: "¿Cómo se conoce al estadio de Racing?", answer: "El Cilindro" },

  // — Cultura argentina, asado, mate —
  { question: "¿Cómo se llama la salsa verde típica del asado?", answer: "Chimichurri" },
  { question: "¿Qué infusión argentina se toma con bombilla?", answer: "El mate" },
  { question: "¿Qué bebida espirituosa se toma con Coca en Argentina?", answer: "Fernet" },

  // — Tele, espectáculos, streamers AR —
  { question: "¿Quién conduce ShowMatch?", answer: "Marcelo Tinelli" },
  { question: "¿De qué club es hincha Tinelli?", answer: "San Lorenzo" },
  { question: "¿En qué canal va Gran Hermano Argentina?", answer: "Telefe" },
  { question: "¿Cómo se llama el segmento de baile más famoso de ShowMatch?", answer: "Bailando por un Sueño" },
  { question: "¿Quién condujo Almorzando durante décadas?", answer: "Mirtha Legrand" },
  { question: "¿De qué banda argentina es 'De Música Ligera'?", answer: "Soda Stereo" },
  { question: "¿En qué año murió Gustavo Cerati?", answer: "2014" },
  { question: "¿Quién cantaba en Los Redonditos de Ricota?", answer: "El Indio Solari" },
  { question: "¿Cómo se llama el actor argentino protagonista de 'El Clan'?", answer: "Guillermo Francella" },

  // — Streamers / cultura hispanohablante —
  { question: "¿En qué plataforma stremea Ibai?", answer: "Twitch" },
  { question: "¿Cómo se llama el torneo de fútbol 7 de Piqué e Ibai?", answer: "Kings League" },
  { question: "¿Cómo se llama el torneo de boxeo de famosos de Ibai?", answer: "La Velada del Año" },
  { question: "¿Cuál es el nombre real del streamer 'Coscu'?", answer: "Martín Pérez Disalvo" },
  { question: "¿De qué país es el cantante J Balvin?", answer: "Colombia" },
  { question: "¿Quién canta 'Despacito'?", answer: "Luis Fonsi" },

  // — Cine, series, música internacional —
  { question: "¿Cómo se llama el ogro verde animado de DreamWorks?", answer: "Shrek" },
  { question: "¿De qué país es la serie 'La Casa de Papel'?", answer: "España" },
  { question: "¿Cómo se llama la esposa de Homer Simpson?", answer: "Marge" },
  { question: "¿En qué ciudad vive Batman?", answer: "Gotham City" },
  { question: "¿Cómo se llama el villano de 'El Rey León'?", answer: "Scar" },
  { question: "¿En qué año se estrenó Titanic de James Cameron?", answer: "1997" },
  { question: "¿Cómo se llama el protagonista de 'El Señor de los Anillos'?", answer: "Frodo" },
  { question: "¿En qué ciudad viven los personajes de 'Friends'?", answer: "Nueva York" },
  { question: "¿De qué color es el traje de Spider-Man?", answer: "Rojo y azul" },
  { question: "¿Quién es el cantante de Coldplay?", answer: "Chris Martin" },
  { question: "¿Cuántas películas tiene la saga Toy Story?", answer: "4" },
  { question: "¿Cómo se llama el mayordomo de Batman?", answer: "Alfred" },
  { question: "¿Quién pintó la Mona Lisa?", answer: "Leonardo da Vinci" },
  { question: "¿Quién dirigió 'El Padrino'?", answer: "Francis Ford Coppola" },

  // — Cultura general mundial —
  { question: "¿En qué ciudad está la Torre Eiffel?", answer: "París" },
  { question: "¿Cuál es la capital de Italia?", answer: "Roma" },
  { question: "¿Cuál es la capital de Japón?", answer: "Tokio" },
  { question: "¿Cuál es la capital de Rusia?", answer: "Moscú" },
  { question: "¿Cuál es la capital de México?", answer: "Ciudad de México" },
  { question: "¿En qué país está la Gran Muralla?", answer: "China" },
  { question: "¿En qué país está Machu Picchu?", answer: "Perú" },
  { question: "¿En qué continente está Egipto?", answer: "África" },
  { question: "¿Qué país tiene forma de bota?", answer: "Italia" },
  { question: "¿Qué idioma se habla en Brasil?", answer: "Portugués" },
  { question: "¿De qué país es originaria la pizza?", answer: "Italia" },
  { question: "¿De qué país es originario el sushi?", answer: "Japón" },
  { question: "¿En qué año terminó la Segunda Guerra Mundial?", answer: "1945" },
  { question: "¿En qué año el hombre llegó a la Luna?", answer: "1969" },

  // — Ciencia, naturaleza, números —
  { question: "¿Cuántos planetas tiene el sistema solar?", answer: "8" },
  { question: "¿Qué planeta está más cerca del Sol?", answer: "Mercurio" },
  { question: "¿Qué planeta es el más grande del sistema solar?", answer: "Júpiter" },
  { question: "¿Qué planeta tiene los anillos más famosos?", answer: "Saturno" },
  { question: "¿Cuál es el animal terrestre más rápido?", answer: "El guepardo" },
  { question: "¿Cuál es el animal más grande del mundo?", answer: "La ballena azul" },
  { question: "¿Qué animal produce la miel?", answer: "La abeja" },
  { question: "¿Cuántas patas tiene una araña?", answer: "8" },
  { question: "¿Cuántas patas tiene un insecto?", answer: "6" },
  { question: "¿Qué gas necesitamos para respirar?", answer: "Oxígeno" },
  { question: "¿Cuántos huesos tiene el cuerpo humano adulto?", answer: "206" },
  { question: "¿Cuántas cuerdas tiene una guitarra estándar?", answer: "6" },
  { question: "¿Cuántas teclas tiene un piano estándar?", answer: "88" },
  { question: "¿Cuántas notas tiene la escala musical?", answer: "7" },
  { question: "¿Cuántos lados tiene un triángulo?", answer: "3" },
  { question: "¿Cuántos lados tiene un octágono?", answer: "8" },
  { question: "¿Cuántos segundos tiene un minuto?", answer: "60" },
  { question: "¿Cuántos meses tiene un año?", answer: "12" },
  { question: "¿Cuántos colores tiene el arcoíris?", answer: "7" },

  // — Tecnología —
  { question: "¿Qué empresa fabricó el iPhone?", answer: "Apple" },
  { question: "¿En qué año se lanzó el primer iPhone?", answer: "2007" },
  { question: "¿Cómo se llama el creador de Facebook?", answer: "Mark Zuckerberg" },
  { question: "¿Qué red social tenía un pajarito como logo?", answer: "Twitter (hoy X)" },
  { question: "¿En qué app china se ven videos cortos verticales?", answer: "TikTok" },
];

// ═══════════════════════════════════════════════════════════════
// 🎯 PREGUNTAS DE ESTIMACIÓN — respuestas numéricas
// ═══════════════════════════════════════════════════════════════
export const ESTIMATION_QUESTIONS = [
  // — Argentina: historia y deporte —
  { question: "¿En qué año declaró Argentina su independencia?", answer: 1816 },
  { question: "¿En qué año comenzó la última dictadura militar argentina?", answer: 1976 },
  { question: "¿En qué año recuperó Argentina la democracia?", answer: 1983 },
  { question: "¿En qué año fue la crisis del corralito?", answer: 2001 },
  { question: "¿En qué año ganó Argentina su primer Mundial de fútbol?", answer: 1978 },
  { question: "¿En qué año Argentina ganó el Mundial de México con Maradona?", answer: 1986 },
  { question: "¿En qué año Argentina ganó el Mundial de Qatar?", answer: 2022 },
  { question: "¿Cuántos metros tiene el Aconcagua?", answer: 6961 },
  { question: "¿En qué año nació Lionel Messi?", answer: 1987 },
  { question: "¿En qué año nació Diego Maradona?", answer: 1960 },
  { question: "¿En qué año murió Diego Maradona?", answer: 2020 },
  { question: "¿Cuántas Copas América ganó Argentina hasta 2024?", answer: 16 },
  { question: "¿Cuántos Balones de Oro ganó Messi hasta 2023?", answer: 8 },
  { question: "¿En qué año se fundó el Club Atlético River Plate?", answer: 1901 },
  { question: "¿En qué año se fundó el Club Atlético Boca Juniors?", answer: 1905 },
  { question: "¿En qué año se emitió la primera edición de Gran Hermano Argentina?", answer: 2001 },
  { question: "¿En qué año se emitió por primera vez ShowMatch?", answer: 1990 },
  { question: "¿En qué año murió Gustavo Cerati?", answer: 2014 },
  { question: "¿Cuántas provincias tiene Argentina (sin contar CABA)?", answer: 23 },
  { question: "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022?", answer: 7 },
  { question: "¿En qué año debutó Messi en el primer equipo del FC Barcelona?", answer: 2004 },
  { question: "¿En qué año ganó Juan Martín del Potro el US Open?", answer: 2009 },
  { question: "¿En qué año Argentina ganó el oro olímpico en básquet en Atenas?", answer: 2004 },
  { question: "¿Cuántos goles marcó Batistuta con la Selección Argentina?", answer: 56 },
  { question: "¿En qué año se fundó Independiente de Avellaneda?", answer: 1905 },

  // — Historia y cultura mundial —
  { question: "¿En qué año terminó la Segunda Guerra Mundial?", answer: 1945 },
  { question: "¿En qué año se inauguró la Torre Eiffel?", answer: 1889 },
  { question: "¿En qué año llegó el hombre a la Luna?", answer: 1969 },
  { question: "¿En qué año cayó el Muro de Berlín?", answer: 1989 },
  { question: "¿En qué año fue la Revolución Francesa?", answer: 1789 },
  { question: "¿En qué año se celebró el primer Mundial de fútbol?", answer: 1930 },
  { question: "¿En qué año se publicó la primera novela de Harry Potter?", answer: 1997 },
  { question: "¿En qué año se estrenó Titanic de James Cameron?", answer: 1997 },
  { question: "¿En qué año murió Freddie Mercury?", answer: 1991 },

  // — Deporte mundial —
  { question: "¿En qué año nació Cristiano Ronaldo?", answer: 1985 },
  { question: "¿Cuántos Mundiales de fútbol ganó Brasil?", answer: 5 },
  { question: "¿Cuántos Grand Slams ganó Rafael Nadal en total?", answer: 22 },
  { question: "¿Cuántas Champions League ganó el Real Madrid hasta 2024?", answer: 15 },
  { question: "¿Cuántos goles marcó Messi en la temporada 2011-12 (récord)?", answer: 73 },

  // — Tecnología / cultura pop —
  { question: "¿En qué año se lanzó el primer iPhone?", answer: 2007 },
  { question: "¿En qué año se lanzó YouTube?", answer: 2005 },
  { question: "¿En qué año se creó WhatsApp?", answer: 2009 },
  { question: "¿En qué año se fundó Twitch?", answer: 2011 },
  { question: "¿En qué año se emitió el primer episodio de Los Simpson?", answer: 1989 },
  { question: "¿Cuántos episodios tiene Breaking Bad en total?", answer: 62 },
  { question: "¿Cuántos episodios tiene Friends en total?", answer: 236 },
  { question: "¿En qué año se publicó el primer tweet de la historia?", answer: 2006 },
  { question: "¿Cuántas teclas tiene un piano estándar?", answer: 88 },

  // — Geografía y ciencia —
  { question: "¿Cuántos países tiene América del Sur?", answer: 12 },
  { question: "¿Cuántos países tiene África?", answer: 54 },
  { question: "¿Cuántos huesos tiene el cuerpo humano adulto?", answer: 206 },
  { question: "¿Cuántos metros mide el Everest?", answer: 8849 },
  { question: "¿Cuántos países son miembros de la ONU?", answer: 193 },
];
