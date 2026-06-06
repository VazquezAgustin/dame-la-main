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
  // Películas
  "El Padrino", "Titanic", "Matrix", "Frozen", "Toy Story",
  "El Rey León", "Jurassic Park", "Avatar", "Shrek", "Coco",
  "Buscando a Nemo", "Harry Potter", "El Señor de los Anillos", "Star Wars",
  "Volver al Futuro", "Forrest Gump", "Rocky", "Tiburón", "E.T.",
  "Piratas del Caribe", "Spider-Man", "Batman", "Los Vengadores",
  "El Resplandor", "Pesadilla antes de Navidad", "La La Land",
  "Parásitos", "Joker", "Gladiador", "Encanto", "Up",
  "Intensamente", "Monsters Inc", "Cars", "Ratatouille", "Wall-E",
  "El Laberinto del Fauno", "Relatos Salvajes", "El Secreto de sus Ojos",
  // Series
  "La Casa de Papel", "Stranger Things", "Breaking Bad", "Game of Thrones",
  "The Office", "Friends", "Los Simpsons", "El Chavo del Ocho",
  "Rick y Morty", "The Mandalorian", "Wednesday", "Dark",
  "Élite", "Narcos", "Peaky Blinders", "Black Mirror",
  "Los Soprano", "Lost", "The Walking Dead", "El Marginal",
  "Casados con Hijos", "Chiquititas", "Patito Feo", "Floricienta",
  "Merlí", "La Que Se Avecina", "Aquí no hay quien viva",
];

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
