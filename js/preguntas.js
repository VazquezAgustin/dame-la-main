// ═══════════════════════════════════════════════════════════════
// 🃏 POOL DE CATEGORÍAS
// ═══════════════════════════════════════════════════════════════
export const CATEGORY_POOL = [
  "Trota Mundos",
  "Historia Pura",
  "El Copión",
  "Bajo Presión",
  "Cultura Musical",
  "El Fan de la Velada",
  "Pies de Plomo",
  "Mente Maestra",
  "La Gran Pantalla",
  "Tierra y Mar",
  "Costumbres del Mundo",
  "De Aquí y de Allá",
  "En Boca de Todos",
  "Números que Hablan",
];

export function pickRandomCategories(pool, count = 6) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

// ═══════════════════════════════════════════════════════════════
// 📝 BANCO DE PREGUNTAS — EDITA AQUÍ
// ═══════════════════════════════════════════════════════════════
export const QUESTIONS = {
  "Trota Mundos": [
    { value: 200,  question: "¿Cuál es la capital de Australia?", answer: "Canberra" },
    { value: 400,  question: "¿Cuál es el país más pequeño del mundo?", answer: "Ciudad del Vaticano" },
    { value: 600,  question: "¿Cuántos países tiene América del Sur?", answer: "12" },
    { value: 800,  question: "¿En qué continente está Madagascar?", answer: "África" },
    { value: 1000, question: "¿Cuál es la ciudad más austral del mundo habitada permanentemente?", answer: "Puerto Williams, Chile" },
  ],
  "Historia Pura": [
    { value: 200,  question: "¿En qué año llegó Colón a América?", answer: "1492" },
    { value: 400,  question: "¿Qué ciudad fue destruida por el Vesubio en el año 79 d.C.?", answer: "Pompeya" },
    { value: 600,  question: "¿En qué año estalló la Primera Guerra Mundial?", answer: "1914" },
    { value: 800,  question: "¿En qué año cayó el Muro de Berlín?", answer: "1989" },
    { value: 1000, question: "¿Cómo se llamaba el último zar de Rusia?", answer: "Nicolás II" },
  ],
  "El Copión": [
    { value: 200,  question: "¿De qué película es la frase 'Que la fuerza te acompañe'?", answer: "Star Wars" },
    { value: 400,  question: "¿En qué serie trabaja el personaje Walter White como profesor?", answer: "Breaking Bad" },
    { value: 600,  question: "¿Qué actor interpretó a Jack Sparrow en 'Piratas del Caribe'?", answer: "Johnny Depp" },
    { value: 800,  question: "¿Cómo se llama el protagonista de la serie 'The Office' (versión americana)?", answer: "Michael Scott" },
    { value: 1000, question: "¿En qué año se estrenó la primera temporada de Game of Thrones?", answer: "2011" },
  ],
  "Bajo Presión": [
    { value: 200,  question: "¿Cuántos lados tiene un hexágono?", answer: "6" },
    { value: 400,  question: "¿Qué planeta es el más cercano al Sol?", answer: "Mercurio" },
    { value: 600,  question: "¿En qué deporte se usa el término 'slam dunk'?", answer: "Básquet / Basketball" },
    { value: 800,  question: "¿Cuántos minutos tiene un día?", answer: "1440" },
    { value: 1000, question: "¿Qué elemento tiene símbolo químico 'Au'?", answer: "Oro" },
  ],
  "Cultura Musical": [
    { value: 200,  question: "¿De qué país es el reggaeton originalmente?", answer: "Puerto Rico" },
    { value: 400,  question: "¿Cómo se llama la canción más famosa de Carlos Vives?", answer: "La Bicicleta (o La Gota Fría, aceptar ambas)" },
    { value: 600,  question: "¿Qué dúo cantó 'Lean On'?", answer: "Major Lazer (con MØ)" },
    { value: 800,  question: "¿En qué año se separaron Los Beatles?", answer: "1970" },
    { value: 1000, question: "¿Cómo se llama el álbum debut de Bad Bunny?", answer: "X 100PRE" },
  ],
  "El Fan de la Velada": [
    { value: 200,  question: "¿Cómo se llama el streamer español que organiza La Velada del Año?", answer: "Ibai Llanos" },
    { value: 400,  question: "¿En qué plataforma emite principalmente Ibai sus streams?", answer: "Twitch" },
    { value: 600,  question: "¿Cómo se llama la agencia de esports cofundada por Ibai y Piqué?", answer: "KOI" },
    { value: 800,  question: "¿En qué ciudad española nació Ibai Llanos?", answer: "Bilbao" },
    { value: 1000, question: "¿Cómo se llama el evento de fútbol de streamers que organiza Ibai con Kun Agüero?", answer: "Kings League" },
  ],
  "Pies de Plomo": [
    { value: 200,  question: "¿Cuántos jugadores tiene un equipo de fútbol en el campo?", answer: "11" },
    { value: 400,  question: "¿Qué país ganó el Mundial de Qatar 2022?", answer: "Argentina" },
    { value: 600,  question: "¿En qué club juega actualmente Lionel Messi (2024)?", answer: "Inter Miami" },
    { value: 800,  question: "¿Cuántos Balones de Oro ganó Messi hasta 2023?", answer: "8" },
    { value: 1000, question: "¿Qué jugador argentino marcó el 'Gol del siglo' en el Mundial de 1986?", answer: "Diego Armando Maradona" },
  ],
  "Mente Maestra": [
    { value: 200,  question: "¿Qué planeta es el más grande del sistema solar?", answer: "Júpiter" },
    { value: 400,  question: "¿Cuántos huesos tiene el cuerpo humano adulto?", answer: "206" },
    { value: 600,  question: "¿A qué velocidad viaja la luz (en km/s aproximados)?", answer: "300.000 km/s" },
    { value: 800,  question: "¿Qué científico formuló la teoría de la relatividad?", answer: "Albert Einstein" },
    { value: 1000, question: "¿Qué partícula subatómica tiene carga negativa?", answer: "Electrón" },
  ],
  "La Gran Pantalla": [
    { value: 200,  question: "¿Cuántas películas tiene la saga Toy Story?", answer: "4" },
    { value: 400,  question: "¿Qué película ganó el Oscar a Mejor Película en 2020?", answer: "Parásitos (Parasite)" },
    { value: 600,  question: "¿Quién dirige la trilogía 'El Señor de los Anillos'?", answer: "Peter Jackson" },
    { value: 800,  question: "¿En qué año se estrenó el Titanic de James Cameron?", answer: "1997" },
    { value: 1000, question: "¿Cómo se llamaba el personaje de Heath Ledger en The Dark Knight?", answer: "El Joker" },
  ],
  "Tierra y Mar": [
    { value: 200,  question: "¿Cuál es el océano más grande del mundo?", answer: "Océano Pacífico" },
    { value: 400,  question: "¿Cuál es el desierto más grande del mundo?", answer: "El Sahara (en caliente) / La Antártida (en frío, aceptar ambas)" },
    { value: 600,  question: "¿En qué continente está el desierto del Sahara?", answer: "África" },
    { value: 800,  question: "¿Cuál es la montaña más alta del mundo?", answer: "El Everest" },
    { value: 1000, question: "¿Qué porcentaje aproximado del planeta está cubierto por agua?", answer: "71% (aceptar 70-72%)" },
  ],
  "Costumbres del Mundo": [
    { value: 200,  question: "¿En qué país se celebra el Año Nuevo Chino con fuegos artificiales?", answer: "China (y comunidades chinas en todo el mundo)" },
    { value: 400,  question: "¿Cómo se llama la festividad mexicana que honra a los muertos?", answer: "Día de Muertos" },
    { value: 600,  question: "¿En qué país se practica el flamenco como arte tradicional?", answer: "España" },
    { value: 800,  question: "¿Qué bebida típica se asocia con Argentina y Uruguay?", answer: "El mate" },
    { value: 1000, question: "¿En qué país se originó el tango como danza?", answer: "Argentina (con influencia uruguaya, aceptar ambos)" },
  ],
  "De Aquí y de Allá": [
    { value: 200,  question: "¿Cuál es la capital de España?", answer: "Madrid" },
    { value: 400,  question: "¿Cuál es la capital de Argentina?", answer: "Buenos Aires" },
    { value: 600,  question: "¿Cómo se llama el estadio del Real Madrid?", answer: "Santiago Bernabéu" },
    { value: 800,  question: "¿En qué año Argentina recuperó la democracia tras la dictadura?", answer: "1983" },
    { value: 1000, question: "¿Qué escritor español ganó el Premio Nobel de Literatura en 1989?", answer: "Camilo José Cela" },
  ],
  "En Boca de Todos": [
    { value: 200,  question: "¿Cómo se llama el fundador de Microsoft?", answer: "Bill Gates" },
    { value: 400,  question: "¿Qué actriz española ganó el Oscar por 'Volver'?", answer: "Penélope Cruz" },
    { value: 600,  question: "¿Quién fue el primer hombre en pisar la Luna?", answer: "Neil Armstrong" },
    { value: 800,  question: "¿En qué ciudad nació el Papa Francisco?", answer: "Buenos Aires, Argentina" },
    { value: 1000, question: "¿Cómo se llama el CEO actual de Tesla y SpaceX?", answer: "Elon Musk" },
  ],
  "Números que Hablan": [
    { value: 200,  question: "¿Cuántos goles marcó Messi en el Mundial de Qatar 2022?", answer: "7 goles" },
    { value: 400,  question: "¿En qué año España ganó su primer Mundial de fútbol?", answer: "2010 (Sudáfrica)" },
    { value: 600,  question: "¿Cuántos metros mide una piscina olímpica?", answer: "50 metros" },
    { value: 800,  question: "¿Cuántos Grand Slams ganó Rafael Nadal en su carrera?", answer: "22" },
    { value: 1000, question: "¿Cuántos puntos vale un try en el rugby?", answer: "5 puntos" },
  ],
};
