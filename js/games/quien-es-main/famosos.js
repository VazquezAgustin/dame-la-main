// Pool de famosos para ¿Quién es Main? — orientado a España y Argentina.
// Mezcla de música, deporte, cine, streamers, personajes ficticios e históricos.

export const FAMOSOS = [
  // ── Música ────────────────────────────────────────────────────
  "Bad Bunny", "Shakira", "J Balvin", "Rosalía", "Daddy Yankee",
  "Maluma", "Nicki Nicole", "Bizarrap", "Peso Pluma", "Rauw Alejandro",
  "Karol G", "Aitana", "C. Tangana", "Trueno", "Duki",
  "Paulo Londra", "Tini", "María Becerra", "Nathy Peluso", "Cazzu",
  "Taylor Swift", "Beyoncé", "Lady Gaga", "Rihanna", "Adele",
  "Justin Bieber", "Harry Styles", "Drake", "Eminem", "Bruno Mars",
  "The Weeknd", "Billie Eilish", "Dua Lipa", "Ariana Grande", "Miley Cyrus",
  "Michael Jackson", "Elvis Presley", "Madonna", "Jennifer Lopez", "Celia Cruz",
  "Alejandro Sanz", "Enrique Iglesias", "Julio Iglesias", "Marc Anthony", "Pitbull",

  // ── Fútbol ────────────────────────────────────────────────────
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Neymar",
  "Erling Haaland", "Vinicius Jr", "Karim Benzema", "Lautaro Martínez",
  "Paulo Dybala", "Julián Álvarez", "Pedri", "Gavi", "Lamine Yamal",
  "Álvaro Morata", "Sergio Ramos", "Andrés Iniesta", "Xavi Hernández",
  "Ronaldinho", "Zlatan Ibrahimović", "Thierry Henry", "Zinedine Zidane",
  "Pelé", "Diego Maradona",

  // ── Otros deportes ────────────────────────────────────────────
  "Rafael Nadal", "Carlos Alcaraz", "Novak Djokovic", "Roger Federer",
  "Pau Gasol", "Sergio García", "Jon Rahm",

  // ── Streamers / YouTubers ─────────────────────────────────────
  "Ibai Llanos", "AuronPlay", "TheGrefg", "ElRubius", "Vegetta777",
  "Luzu", "Coscu", "Spreen", "Ottega", "Rivers",

  // ── Cine y TV ─────────────────────────────────────────────────
  "Pedro Pascal", "Javier Bardem", "Penélope Cruz", "Úrsula Corberó",
  "Álvaro Morte", "Ana de Armas", "Mario Casas", "Macarena García",
  "Tom Cruise", "Leonardo DiCaprio", "Brad Pitt", "Angelina Jolie",
  "Scarlett Johansson", "Zendaya", "Ryan Reynolds", "Will Smith",
  "Meryl Streep", "Margot Robbie",

  // ── Personajes ficticios ──────────────────────────────────────
  "Harry Potter", "Hermione Granger", "Darth Vader", "Batman",
  "Spider-Man", "Iron Man", "Elsa (Frozen)", "Shrek", "El Joker",
  "Walter White", "Sherlock Holmes", "James Bond",
  "Gandalf", "Scar (El Rey León)", "Hulk", "Capitán América",

  // ── Históricos y famosos globales ────────────────────────────
  "Albert Einstein", "Charles Darwin", "William Shakespeare",
  "Napoleón Bonaparte", "Cleopatra", "Mahatma Gandhi",
  "Madre Teresa", "Nelson Mandela", "Marie Curie", "Isaac Newton",
  "Leonardo da Vinci", "Vincent van Gogh", "Frida Kahlo",
];

// Devuelve un array aleatorio de `count` famosos sin repetir.
export function pickFamosos(count = 10) {
  const shuffled = [...FAMOSOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, FAMOSOS.length));
}
