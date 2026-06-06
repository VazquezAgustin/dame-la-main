// ═══════════════════════════════════════════════════════════════
// ⚽ BANCO MUNDIALISTA — temática fútbol / Copa del Mundo
// Activo cuando ACTIVE_THEME === "mundial" (ver js/theme.config.js).
// Para el rollback post-Mundial, poné ACTIVE_THEME = "classic".
// ═══════════════════════════════════════════════════════════════
export const CATEGORY_POOL = [
  "La Albiceleste", // Selección Argentina
  "Maradona y Messi",
  "Boca, River y Cía",
  "Récords y Números del Fútbol",
  "Mundiales", // historia de las Copas del Mundo
  "Mundial Qatar 2022",
  "Cracks del Mundo",
  "Selecciones del Mundo",
  "Clubes de Europa",
  "Estadios Míticos",
  "Camisetas y Colores",
  "Técnicos y Tácticas",
  "Trofeos y Balones de Oro",
  "Reglas del Juego",
  "Goles y Jugadas Históricas",
  "Fútbol en la Cultura",
];

// ═══════════════════════════════════════════════════════════════
// 📝 BANCO DE PREGUNTAS (mundialista)
// ═══════════════════════════════════════════════════════════════
export const QUESTIONS = {
  "La Albiceleste": [
    {
      value: 200,
      question: "¿De qué color es la camiseta titular de la Selección Argentina?",
      answer: "Celeste y blanca",
    },
    {
      value: 400,
      question: "¿Quién es el capitán de la Selección campeona en Qatar 2022?",
      answer: "Lionel Messi",
    },
    {
      value: 600,
      question: "¿Quién es el arquero apodado 'Dibu' de la Selección?",
      answer: "Emiliano Martínez",
    },
    {
      value: 800,
      question: "¿Quién es el director técnico campeón del mundo en 2022?",
      answer: "Lionel Scaloni",
    },
    {
      value: 1000,
      question:
        "¿Quién fue el goleador argentino (Bota de Oro) del Mundial 1978 con 6 goles?",
      answer: "Mario Kempes",
    },
  ],
  "Maradona y Messi": [
    {
      value: 200,
      question: "¿En qué club del ascenso debutó Maradona, los Cebollitas aparte?",
      answer: "Argentinos Juniors",
    },
    {
      value: 400,
      question: "¿En qué club italiano Maradona se convirtió en ídolo absoluto?",
      answer: "Napoli",
    },
    {
      value: 600,
      question:
        "¿Con qué club europeo Messi ganó la mayoría de sus títulos antes del PSG?",
      answer: "FC Barcelona",
    },
    {
      value: 800,
      question:
        "¿En qué club de la MLS de Estados Unidos juega Messi desde 2023?",
      answer: "Inter Miami",
    },
    {
      value: 1000,
      question:
        "¿En qué año Maradona dirigió a la Selección Argentina en un Mundial?",
      answer: "2010 (Sudáfrica)",
    },
  ],
  "Boca, River y Cía": [
    {
      value: 200,
      question: "¿De qué colores es la camiseta de Boca Juniors?",
      answer: "Azul y amarillo (oro)",
    },
    {
      value: 400,
      question: "¿Cuál es la franja característica de la camiseta de River?",
      answer: "Banda roja en diagonal sobre fondo blanco",
    },
    {
      value: 600,
      question: "¿Cómo se llama el clásico entre Boca y River?",
      answer: "El Superclásico",
    },
    {
      value: 800,
      question:
        "¿Qué club de Avellaneda es conocido como 'El Rojo' y 'Rey de Copas'?",
      answer: "Independiente",
    },
    {
      value: 1000,
      question:
        "¿Qué entrenador llevó a River a ganar la Libertadores 2018 frente a Boca?",
      answer: "Marcelo Gallardo",
    },
  ],
  "Récords y Números del Fútbol": [
    {
      value: 200,
      question: "¿Cuántos jugadores hay por equipo en una cancha de fútbol?",
      answer: "11",
    },
    {
      value: 400,
      question: "¿Cuántos minutos dura un partido sin contar descuentos?",
      answer: "90",
    },
    {
      value: 600,
      question:
        "¿Cuántas estrellas (mundiales) tiene la camiseta de Argentina desde 2022?",
      answer: "3",
    },
    {
      value: 800,
      question: "¿Cuántos Mundiales ganó Brasil, el país más ganador?",
      answer: "5",
    },
    {
      value: 1000,
      question: "¿Cuántos Balones de Oro tiene Messi hasta 2024?",
      answer: "8",
    },
  ],
  "Mundiales": [
    {
      value: 200,
      question: "¿Cada cuántos años se juega el Mundial de fútbol?",
      answer: "Cada 4 años",
    },
    {
      value: 400,
      question: "¿En qué país se jugó el primer Mundial, en 1930?",
      answer: "Uruguay",
    },
    {
      value: 600,
      question: "¿Qué selección ganó el primer Mundial de la historia?",
      answer: "Uruguay",
    },
    {
      value: 800,
      question: "¿Qué país europeo ganó el Mundial de 1966 como local?",
      answer: "Inglaterra",
    },
    {
      value: 1000,
      question:
        "¿Qué tres países serán las sedes compartidas del Mundial 2026?",
      answer: "Estados Unidos, México y Canadá",
    },
  ],
  "Mundial Qatar 2022": [
    {
      value: 200,
      question: "¿En qué país se jugó el Mundial 2022?",
      answer: "Catar (Qatar)",
    },
    {
      value: 400,
      question: "¿Contra qué selección jugó Argentina la final?",
      answer: "Francia",
    },
    {
      value: 600,
      question: "¿Quién atajó el penal decisivo en la tanda de la final?",
      answer: "Emiliano 'Dibu' Martínez",
    },
    {
      value: 800,
      question: "¿Quién ganó la Bota de Oro (goleador) del Mundial 2022?",
      answer: "Kylian Mbappé",
    },
    {
      value: 1000,
      question: "¿Cuántos goles hizo Messi en todo el Mundial 2022?",
      answer: "7",
    },
  ],
  "Cracks del Mundo": [
    {
      value: 200,
      question: "¿Qué futbolista portugués es apodado 'CR7'?",
      answer: "Cristiano Ronaldo",
    },
    {
      value: 400,
      question:
        "¿Qué francés hizo un triplete (hat-trick) en la final del Mundial 2022?",
      answer: "Kylian Mbappé",
    },
    {
      value: 600,
      question: "¿Qué brasileño es considerado 'O Rei' (El Rey) del fútbol?",
      answer: "Pelé",
    },
    {
      value: 800,
      question:
        "¿Qué delantero noruego rompió récords de gol en el Manchester City?",
      answer: "Erling Haaland",
    },
    {
      value: 1000,
      question:
        "¿Qué brasileño apodado 'El Fenómeno' fue goleador del Mundial 2002?",
      answer: "Ronaldo (Ronaldo Nazário)",
    },
  ],
  "Selecciones del Mundo": [
    {
      value: 200,
      question: "¿De qué país es la selección apodada 'La Canarinha', de amarillo?",
      answer: "Brasil",
    },
    {
      value: 400,
      question: "¿Qué selección europea es conocida como 'La Furia Roja'?",
      answer: "España",
    },
    {
      value: 600,
      question:
        "¿Qué selección sudamericana es 'La Roja' y ganó la Copa América 2015 y 2016?",
      answer: "Chile",
    },
    {
      value: 800,
      question:
        "¿Qué selección africana llegó a semifinales del Mundial 2022, la primera de África?",
      answer: "Marruecos",
    },
    {
      value: 1000,
      question: "¿Qué selección europea ganó el Mundial 2018 en Rusia?",
      answer: "Francia",
    },
  ],
  "Clubes de Europa": [
    {
      value: 200,
      question: "¿Qué club español es el más ganador de la Champions League?",
      answer: "Real Madrid",
    },
    {
      value: 400,
      question: "¿Qué club inglés es apodado 'Los Diablos Rojos'?",
      answer: "Manchester United",
    },
    {
      value: 600,
      question: "¿Qué club alemán de Baviera domina la Bundesliga?",
      answer: "Bayern Múnich",
    },
    {
      value: 800,
      question:
        "¿Qué club italiano es apodado 'La Vecchia Signora' (La Vieja Señora)?",
      answer: "Juventus",
    },
    {
      value: 1000,
      question:
        "¿Cuántas Champions/Copas de Europa ganó el Real Madrid hasta 2024?",
      answer: "15",
    },
  ],
  "Estadios Míticos": [
    {
      value: 200,
      question: "¿Cómo se llama el estadio de Boca Juniors?",
      answer: "La Bombonera",
    },
    {
      value: 400,
      question: "¿En qué país está el estadio Maracaná?",
      answer: "Brasil",
    },
    {
      value: 600,
      question: "¿Cómo se llama el estadio del Real Madrid?",
      answer: "Santiago Bernabéu",
    },
    {
      value: 800,
      question: "¿En qué ciudad está el mítico estadio de Wembley?",
      answer: "Londres",
    },
    {
      value: 1000,
      question: "¿Cómo se llama el estadio histórico del FC Barcelona?",
      answer: "Camp Nou",
    },
  ],
  "Camisetas y Colores": [
    {
      value: 200,
      question: "¿De qué color es la camiseta titular de Brasil?",
      answer: "Amarilla (con detalles verdes)",
    },
    {
      value: 400,
      question: "¿Qué marca alemana viste a la Selección Argentina?",
      answer: "Adidas",
    },
    {
      value: 600,
      question: "¿De qué color es la camiseta de Italia, 'La Azzurra'?",
      answer: "Azul",
    },
    {
      value: 800,
      question: "¿De qué color es la camiseta titular de Países Bajos (Holanda)?",
      answer: "Naranja",
    },
    {
      value: 1000,
      question:
        "¿Qué club inglés de Liverpool juega de rojo y tiene el lema 'You'll Never Walk Alone'?",
      answer: "Liverpool",
    },
  ],
  "Técnicos y Tácticas": [
    {
      value: 200,
      question: "¿Quién es el DT campeón del mundo con Argentina en 2022?",
      answer: "Lionel Scaloni",
    },
    {
      value: 400,
      question:
        "¿Cómo se llama la formación táctica con 4 defensores, 4 mediocampistas y 2 delanteros?",
      answer: "4-4-2",
    },
    {
      value: 600,
      question:
        "¿Qué entrenador español es famoso por el 'tiki-taka' en Barcelona y Manchester City?",
      answer: "Pep Guardiola",
    },
    {
      value: 800,
      question:
        "¿Cómo se llama la zona del campo donde juega el mediocampista que arma el juego?",
      answer: "El mediocampo (el centro del campo)",
    },
    {
      value: 1000,
      question:
        "¿Qué DT italiano apodado 'Carletto' ganó la Champions con varios clubes y dirige al Real Madrid?",
      answer: "Carlo Ancelotti",
    },
  ],
  "Trofeos y Balones de Oro": [
    {
      value: 200,
      question: "¿Qué premio individual gana el mejor jugador del año?",
      answer: "El Balón de Oro",
    },
    {
      value: 400,
      question: "¿Cómo se llama el principal torneo de clubes de Europa?",
      answer: "La Champions League (Liga de Campeones)",
    },
    {
      value: 600,
      question: "¿Cómo se llama el premio al mejor arquero del Mundial?",
      answer: "El Guante de Oro",
    },
    {
      value: 800,
      question: "¿Quién ganó el Balón de Oro 2023?",
      answer: "Lionel Messi",
    },
    {
      value: 1000,
      question:
        "¿Cómo se llama el principal torneo de selecciones de Sudamérica?",
      answer: "La Copa América",
    },
  ],
  "Reglas del Juego": [
    {
      value: 200,
      question: "¿De qué color es la tarjeta que expulsa a un jugador?",
      answer: "Roja",
    },
    {
      value: 400,
      question: "¿Cómo se llama la tecnología de video que asiste al árbitro?",
      answer: "El VAR",
    },
    {
      value: 600,
      question: "¿Desde qué distancia se patea un penal?",
      answer: "11 metros (12 yardas)",
    },
    {
      value: 800,
      question:
        "¿Cómo se llama la infracción de un atacante que está adelantado al recibir el pase?",
      answer: "Offside (fuera de juego / posición adelantada)",
    },
    {
      value: 1000,
      question:
        "¿Cuántos cambios puede hacer cada equipo en un partido oficial actual (sin contar prórroga)?",
      answer: "5 (en 3 ventanas)",
    },
  ],
  "Goles y Jugadas Históricas": [
    {
      value: 200,
      question: "¿Con qué parte del cuerpo metió Maradona 'La Mano de Dios' en 1986?",
      answer: "Con la mano",
    },
    {
      value: 400,
      question: "¿Contra qué selección hizo Maradona 'El Gol del Siglo' en 1986?",
      answer: "Inglaterra",
    },
    {
      value: 600,
      question:
        "¿Cómo se llama el gol que se anota directamente desde un tiro de esquina?",
      answer: "Gol olímpico",
    },
    {
      value: 800,
      question:
        "¿Cómo se llama el remate de cabeza acrobático que se hace de espaldas al arco?",
      answer: "La chilena (tijera)",
    },
    {
      value: 1000,
      question:
        "¿Quién hizo el gol del 3-2 ante Francia en la final 2022 que luego Mbappé empató?",
      answer: "Lionel Messi",
    },
  ],
  "Fútbol en la Cultura": [
    {
      value: 200,
      question:
        "¿Qué película animada argentina de Campanella trata sobre el metegol?",
      answer: "Metegol",
    },
    {
      value: 400,
      question:
        "¿Qué torneo de fútbol 7 fundaron Gerard Piqué e Ibai Llanos?",
      answer: "La Kings League",
    },
    {
      value: 600,
      question: "¿Cómo se llama el club de la Kings League fundado por Ibai?",
      answer: "Porcinos FC",
    },
    {
      value: 800,
      question:
        "¿Qué videojuego de fútbol de EA cambió su nombre de 'FIFA' a otro en 2023?",
      answer: "EA Sports FC",
    },
    {
      value: 1000,
      question:
        "¿Qué streamer argentino batió récords de espectadores en Twitch con eventos solidarios?",
      answer: "Spreen (Iván Buhajeruk)",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ MODO RELÁMPAGO — respuestas cortas (mundialista)
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  // — Selección Argentina —
  { question: "¿En qué país se jugó el Mundial que Argentina ganó en 2022?", answer: "Catar (Qatar)" },
  { question: "¿Quién es el capitán de la Selección campeona en Qatar?", answer: "Lionel Messi" },
  { question: "¿Quién es el arquero apodado 'Dibu' de la Selección?", answer: "Emiliano Martínez" },
  { question: "¿En qué club juega Messi en Estados Unidos?", answer: "Inter Miami" },
  { question: "¿En qué club italiano fue ídolo Maradona?", answer: "Napoli" },
  { question: "¿Qué apodo tiene la Selección Argentina por sus colores?", answer: "La Albiceleste" },
  { question: "¿Quién dirige técnicamente a la Selección campeona del mundo?", answer: "Lionel Scaloni" },
  { question: "¿Cuántos Mundiales ganó Argentina?", answer: "3" },

  // — Clubes argentinos —
  { question: "¿Qué club argentino es 'El Millonario'?", answer: "River Plate" },
  { question: "¿Qué club argentino es 'El Xeneize'?", answer: "Boca Juniors" },
  { question: "¿Cómo se llama el clásico entre Boca y River?", answer: "El Superclásico" },
  { question: "¿Cómo se llama el estadio de Boca?", answer: "La Bombonera" },

  // — Mundiales —
  { question: "¿Cada cuántos años se juega el Mundial?", answer: "Cada 4 años" },
  { question: "¿Qué país ganó el primer Mundial (1930)?", answer: "Uruguay" },
  { question: "¿En qué país se jugó el primer Mundial?", answer: "Uruguay" },
  { question: "¿Qué país es el más ganador de Mundiales?", answer: "Brasil" },
  { question: "¿Qué selección ganó el Mundial 2018?", answer: "Francia" },
  { question: "¿Qué selección africana llegó a semis en 2022?", answer: "Marruecos" },
  { question: "¿Quién ganó la Bota de Oro del Mundial 2022?", answer: "Kylian Mbappé" },

  // — Cracks —
  { question: "¿Quién es 'CR7'?", answer: "Cristiano Ronaldo" },
  { question: "¿Qué francés hizo un triplete en la final 2022?", answer: "Kylian Mbappé" },
  { question: "¿Quién es 'O Rei', el Rey del fútbol?", answer: "Pelé" },
  { question: "¿Qué delantero noruego juega en el Manchester City?", answer: "Erling Haaland" },

  // — Selecciones del mundo —
  { question: "¿De qué país es la 'Canarinha' amarilla?", answer: "Brasil" },
  { question: "¿Qué selección es 'La Furia Roja'?", answer: "España" },
  { question: "¿Qué selección europea es 'La Azzurra'?", answer: "Italia" },
  { question: "¿De qué color es la camiseta de Países Bajos?", answer: "Naranja" },

  // — Clubes de Europa —
  { question: "¿Qué club es el más ganador de la Champions?", answer: "Real Madrid" },
  { question: "¿En qué ciudad juega el Bayern?", answer: "Múnich" },
  { question: "¿Qué club inglés es de Liverpool y viste de rojo?", answer: "Liverpool" },
  { question: "¿Qué club es apodado 'Los Diablos Rojos'?", answer: "Manchester United" },
  { question: "¿Cómo se llama el estadio del Real Madrid?", answer: "Santiago Bernabéu" },
  { question: "¿En qué país está el Maracaná?", answer: "Brasil" },

  // — Reglas y premios —
  { question: "¿Qué color de tarjeta expulsa a un jugador?", answer: "Roja" },
  { question: "¿Cómo se llama la tecnología de video para el árbitro?", answer: "El VAR" },
  { question: "¿Desde cuántos metros se patea un penal?", answer: "11 metros" },
  { question: "¿Cuántos jugadores hay por equipo en cancha?", answer: "11" },
  { question: "¿Qué premio gana el mejor jugador del año?", answer: "El Balón de Oro" },
  { question: "¿Cuántos Balones de Oro tiene Messi?", answer: "8" },
  { question: "¿Qué entrenador es famoso por el 'tiki-taka'?", answer: "Pep Guardiola" },

  // — Goles y cultura —
  { question: "¿Contra quién hizo Maradona 'El Gol del Siglo'?", answer: "Inglaterra" },
  { question: "¿Con qué parte metió Maradona 'La Mano de Dios'?", answer: "Con la mano" },
  { question: "¿Qué torneo de fútbol 7 fundaron Piqué e Ibai?", answer: "Kings League" },
  { question: "¿Cómo se llama el club de Ibai en la Kings League?", answer: "Porcinos FC" },
];

// ═══════════════════════════════════════════════════════════════
// 🎯 PREGUNTAS DE ESTIMACIÓN — respuestas numéricas (mundialista)
// ═══════════════════════════════════════════════════════════════
export const ESTIMATION_QUESTIONS = [
  // — Argentina —
  { question: "¿En qué año ganó Argentina su primer Mundial?", answer: 1978 },
  { question: "¿En qué año ganó Argentina el Mundial con Maradona en México?", answer: 1986 },
  { question: "¿En qué año ganó Argentina el Mundial de Qatar?", answer: 2022 },
  { question: "¿En qué año ganó Argentina la Copa América en el Maracaná?", answer: 2021 },
  { question: "¿Cuántos goles hizo Messi en el Mundial de Qatar 2022?", answer: 7 },
  { question: "¿Cuántas Copas América ganó Argentina hasta 2024?", answer: 16 },
  { question: "¿Cuántos Balones de Oro tiene Messi hasta 2024?", answer: 8 },
  { question: "¿En qué año se fundó Boca Juniors?", answer: 1905 },
  { question: "¿En qué año se fundó River Plate?", answer: 1901 },
  { question: "¿En qué año murió Diego Maradona?", answer: 2020 },
  { question: "¿En qué año nació Lionel Messi?", answer: 1987 },
  { question: "¿Cuántas estrellas tiene la camiseta argentina desde 2022?", answer: 3 },
  { question: "¿Cuántas Libertadores ganó Boca Juniors?", answer: 6 },
  { question: "¿En qué año Argentina ganó el oro olímpico de fútbol en Atenas?", answer: 2004 },
  { question: "¿En qué año Argentina ganó el oro olímpico de fútbol en Beijing?", answer: 2008 },

  // — Mundo —
  { question: "¿En qué año nació Cristiano Ronaldo?", answer: 1985 },
  { question: "¿Cuántos Mundiales ganó Brasil?", answer: 5 },
  { question: "¿Cuántas Champions League ganó el Real Madrid hasta 2024?", answer: 15 },
  { question: "¿Cada cuántos años se juega un Mundial de fútbol?", answer: 4 },
  { question: "¿Cuántos minutos dura cada tiempo de un partido de fútbol?", answer: 45 },
  { question: "¿Cuántos jugadores hay por equipo en una cancha de fútbol?", answer: 11 },
  { question: "¿En qué año se jugó el primer Mundial de fútbol?", answer: 1930 },
  { question: "¿Cuántos equipos participaron en el Mundial de Qatar 2022?", answer: 32 },
  { question: "¿Cuántos equipos jugarán el Mundial 2026?", answer: 48 },
  { question: "¿Desde cuántos metros se patea un penal?", answer: 11 },
  { question: "¿En qué año ganó Brasil su último Mundial?", answer: 2002 },
  { question: "¿En qué año ganó España su único Mundial?", answer: 2010 },
  { question: "¿En qué año ganó Francia el Mundial en Rusia?", answer: 2018 },
  { question: "¿En qué año ganó Italia el Mundial en Alemania?", answer: 2006 },
  { question: "¿Cuántos Mundiales disputó Messi en su carrera hasta 2022?", answer: 5 },
];
