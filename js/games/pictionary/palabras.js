// Banco de palabras para Pictionary — orientado a España y Argentina.
// NOTA: la palabra secreta de cada ronda se guarda en claro en Firebase
// (currentRound/word). Es aceptable para un juego de fiesta — mismo criterio
// que el banco de respuestas de la trivia, visible en el JS del cliente.

// ── Palabras simples (objetos, animales, comida, acciones, lugares) ──
export const PALABRAS_SIMPLES = [
  // Animales
  "perro", "gato", "elefante", "jirafa", "tortuga", "pingüino", "cocodrilo",
  "caballo", "vaca", "oveja", "gallina", "pulpo", "tiburón", "ballena",
  "mariposa", "abeja", "araña", "serpiente", "canguro", "mono",
  // Comida (ES/AR)
  "pizza", "empanada", "milanesa", "tortilla", "churros", "mate", "asado",
  "helado", "hamburguesa", "alfajor", "paella", "croqueta", "dulce de leche",
  "manzana", "banana", "sandía", "huevo frito", "café", "fideos",
  // Objetos / casa
  "paraguas", "guitarra", "escalera", "linterna", "teléfono", "reloj",
  "silla", "lámpara", "tijeras", "martillo", "llave", "anteojos",
  "mochila", "pelota", "bicicleta", "cohete", "robot", "globo",
  "cepillo de dientes", "sombrero", "zapato", "candado", "brújula",
  // Naturaleza / lugares
  "montaña", "playa", "volcán", "arcoíris", "isla", "cascada",
  "árbol", "cactus", "estrella", "luna", "sol", "nube",
  "faro", "puente", "castillo", "iglú", "molino", "carpa",
  // Acciones / verbos
  "correr", "dormir", "nadar", "cocinar", "bailar", "saltar",
  "llorar", "cantar", "pescar", "estornudar", "abrazar", "pintar",
  "esquiar", "bostezar", "manejar", "volar",
  // Transporte / varios
  "avión", "barco", "tren", "helicóptero", "submarino", "tractor",
  "semáforo", "ancla", "paracaídas", "fantasma", "esqueleto", "vampiro",
  "pirata", "astronauta", "payaso", "superhéroe",
];

// ── Películas y series (populares, conocidas en España/Argentina) ──
export const PELICULAS_Y_SERIES = [
  // Animadas / infantiles (icónicas y muy fáciles de dibujar)
  "Frozen", "Toy Story", "El Rey León", "Shrek", "Coco",
  "Buscando a Nemo", "Up", "Cars", "Ratatouille", "Los Increíbles",
  "Los Minions", "La Sirenita", "La Bella y la Bestia", "Aladdín", "Blancanieves",
  "El Libro de la Selva", "Madagascar", "La Era de Hielo", "Kung Fu Panda", "Enredados",
  "Encanto", "Bambi", "Pinocho", "Dumbo", "101 Dálmatas",
  "Wall-E", "Monsters Inc", "Peter Pan", "El Grinch",
  // Películas (taquillazos globales)
  "Titanic", "Star Wars", "Harry Potter", "El Señor de los Anillos", "Jurassic Park",
  "Spider-Man", "Batman", "Superman", "Piratas del Caribe", "Avatar",
  "Los Vengadores", "King Kong", "Tiburón", "E.T.", "Volver al Futuro",
  "Rocky", "Indiana Jones", "Terminator", "La Máscara", "Forrest Gump",
  "El Mago de Oz", "Cazafantasmas",
  // Series (súper masivas)
  "Los Simpsons", "Friends", "La Casa de Papel", "Stranger Things", "Juego de Tronos",
  "Breaking Bad", "The Office", "El Chavo del Ocho", "Bob Esponja", "Pokémon",
  "Dragon Ball", "Peppa Pig",
];

// Etiquetas legibles de la categoría a la que pertenece una palabra.
export const CATEGORIA_LABEL = {
  simples: "Palabra simple",
  pelis:   "Película o serie",
};

// Clasifica una palabra según el banco al que pertenece. Sirve para mostrarle
// al que adivina una pista de qué tipo de cosa está dibujada (sin revelar la
// palabra). Útil sobre todo en modo "mixto", donde la palabra puede venir de
// cualquiera de los dos bancos.
export function palabraCategoria(word = "") {
  return PELICULAS_Y_SERIES.includes(word) ? "pelis" : "simples";
}

// Etiqueta legible de la categoría de una palabra (ej: "Película o serie").
export function palabraCategoriaLabel(word = "") {
  return CATEGORIA_LABEL[palabraCategoria(word)] || "Palabra simple";
}

// Devuelve `count` palabras al azar sin repetir, según la categoría:
//   "simples" → solo palabras simples
//   "pelis"   → solo películas y series
//   "mixto"   → ambas mezcladas (por defecto)
export function pickPalabras(count = 1, categoria = "mixto") {
  let pool;
  if (categoria === "simples")    pool = PALABRAS_SIMPLES;
  else if (categoria === "pelis") pool = PELICULAS_Y_SERIES;
  else                            pool = [...PALABRAS_SIMPLES, ...PELICULAS_Y_SERIES];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}
