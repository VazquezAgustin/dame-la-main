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
  "Chayanne", "Ricky Martin", "Luis Miguel",
  "Sabrina Carpenter", "Olivia Rodrigo", "Ed Sheeran", "SZA", "Doja Cat",
  "Quevedo", "Lola Índigo", "Emilia", "Khea", "Wos",
  "L-Gante", "Manuel Turizo", "Feid", "Sebastián Yatra", "Camilo",
  "Juanes", "Manu Chao", "Rels B",

  // ── Rock y leyendas musicales ─────────────────────────────────
  "Freddie Mercury", "John Lennon", "Paul McCartney", "David Bowie",
  "Bob Dylan", "Bob Marley", "Kurt Cobain", "Mick Jagger",
  "Elton John", "Bono", "Axl Rose", "Jimi Hendrix", "Slash",
  "Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach",
  "Jim Morrison", "Brian May", "Roger Waters", "Ozzy Osbourne",
  "Gustavo Cerati", "Charly García", "Fito Páez", "Andrés Calamaro",

  // ── Fútbol ────────────────────────────────────────────────────
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Neymar",
  "Erling Haaland", "Vinicius Jr", "Karim Benzema", "Lautaro Martínez",
  "Paulo Dybala", "Julián Álvarez", "Pedri", "Gavi", "Lamine Yamal",
  "Álvaro Morata", "Sergio Ramos", "Andrés Iniesta", "Xavi Hernández",
  "Ronaldinho", "Zlatan Ibrahimović", "Thierry Henry", "Zinedine Zidane",
  "Pelé", "Diego Maradona",
  "Luka Modrić", "Robert Lewandowski", "Mohamed Salah", "Kevin De Bruyne",
  "Toni Kroos", "Sergio Agüero", "Ángel Di María", "Emiliano Martínez",
  "Rodri", "Jude Bellingham", "Antoine Griezmann", "Iker Casillas",
  "Johan Cruyff", "Franz Beckenbauer",

  // ── Otros deportes ────────────────────────────────────────────
  "Rafael Nadal", "Carlos Alcaraz", "Novak Djokovic", "Roger Federer",
  "Pau Gasol", "Sergio García", "Jon Rahm",
  "Serena Williams", "Michael Jordan", "LeBron James", "Kobe Bryant",
  "Stephen Curry", "Manu Ginóbili", "Lewis Hamilton", "Max Verstappen",
  "Fernando Alonso", "Marc Márquez", "Valentino Rossi",
  "Mike Tyson", "Muhammad Ali", "Usain Bolt", "Michael Phelps", "Tiger Woods",
  "Magic Johnson", "Shaquille O'Neal", "Giannis Antetokounmpo", "Conor McGregor",
  "Floyd Mayweather", "Naomi Osaka", "Simone Biles", "Nadia Comăneci",
  "Sebastian Vettel", "Ayrton Senna",

  // ── Streamers / YouTubers ─────────────────────────────────────
  "Ibai Llanos", "AuronPlay", "TheGrefg", "ElRubius", "Vegetta777",
  "Luzu", "Coscu", "Spreen", "Ottega", "Rivers",
  "ElXokas", "Illojuan", "DjMaRiiO", "Knekro", "Mixwell",
  "Juansguarnizo", "Quackity", "Westcol", "Plex", "Folagor",
  "Nilojeda", "Werlyb",

  // ── Cine y TV ─────────────────────────────────────────────────
  "Pedro Pascal", "Javier Bardem", "Penélope Cruz", "Úrsula Corberó",
  "Álvaro Morte", "Ana de Armas", "Mario Casas", "Macarena García",
  "Tom Cruise", "Leonardo DiCaprio", "Brad Pitt", "Angelina Jolie",
  "Scarlett Johansson", "Zendaya", "Ryan Reynolds", "Will Smith",
  "Meryl Streep", "Margot Robbie",
  "Robert De Niro", "Al Pacino", "Morgan Freeman", "Samuel L. Jackson",
  "Tom Hanks", "Johnny Depp", "Keanu Reeves", "Robert Downey Jr.",
  "Hugh Jackman", "Denzel Washington", "Anthony Hopkins",
  "Julia Roberts", "Nicole Kidman", "Antonio Banderas",
  "Quentin Tarantino", "Steven Spielberg", "Christopher Nolan", "Martin Scorsese",
  "Cillian Murphy", "Timothée Chalamet", "Florence Pugh", "Emma Stone",
  "Jennifer Lawrence", "Natalie Portman", "Anya Taylor-Joy", "Pedro Almodóvar",
  "Guillermo del Toro", "Ricardo Darín", "Guillermo Francella", "Antonio de la Torre",
  "Eva Longoria", "Salma Hayek", "Christoph Waltz", "Cate Blanchett",

  // ── Personajes ficticios ──────────────────────────────────────
  "Harry Potter", "Hermione Granger", "Darth Vader", "Batman",
  "Spider-Man", "Iron Man", "Elsa (Frozen)", "Shrek", "El Joker",
  "Walter White", "Sherlock Holmes", "James Bond",
  "Gandalf", "Scar (El Rey León)", "Hulk", "Capitán América",
  "Goku", "Mario (Bros)", "Pikachu", "Homer Simpson",
  "Mickey Mouse", "Wonder Woman", "Superman", "Deadpool",
  "Yoda", "Frodo", "Geralt de Rivia", "Lara Croft",

  // ── Históricos y famosos globales ────────────────────────────
  "Albert Einstein", "Charles Darwin", "William Shakespeare",
  "Napoleón Bonaparte", "Cleopatra", "Mahatma Gandhi",
  "Madre Teresa", "Nelson Mandela", "Marie Curie", "Isaac Newton",
  "Leonardo da Vinci", "Vincent van Gogh", "Frida Kahlo",
  "Nikola Tesla", "Stephen Hawking", "Galileo Galilei",
  "Sócrates", "Aristóteles", "Platón",
  "Winston Churchill", "Abraham Lincoln", "John F. Kennedy",
  "Julio César", "Cristóbal Colón", "Miguel de Cervantes",
  "Pablo Picasso", "Salvador Dalí", "Steve Jobs",
  "Bill Gates", "Elon Musk", "Mark Zuckerberg", "Barack Obama",
  "Martin Luther King", "Walt Disney", "Marilyn Monroe", "Charles Chaplin",
  "Alfred Hitchcock", "Stan Lee",
];

// Devuelve un array aleatorio de `count` famosos sin repetir.
export function pickFamosos(count = 10) {
  const shuffled = [...FAMOSOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, FAMOSOS.length));
}
