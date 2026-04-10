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
  "El Asado",
  "Historia de España",
  "Historia Argentina",
  "La Roja y la Albiceleste",
  "Letras Hispanas",
  "El Mundo del Deporte",
  "Pantalla Chica",
  "El Hincha",
  "Los 90 Mandan",
  "El Podio",
  "Reyes y Presidentes",
  "Viral y Punto",
  "El Cabezón",
  "La Pista",
  "La Playlist",
  "El Vestuario",
  "Corre, Salta, Nada",
  "Tierra Nuestra",
  "La Bodega",
  "Mente de Científico",
  "Tótum Revolútum",
];

export function pickRandomCategories(pool, count = 6, exclude = []) {
  const available = pool.filter(cat => !exclude.includes(cat));
  const source = available.length >= count ? available : pool;
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
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

  "El Asado": [
    { value: 200,  question: "¿Cómo se llama la salsa verde con perejil y ajo que acompaña al asado argentino?", answer: "Chimichurri" },
    { value: 400,  question: "¿De qué región española es originaria la paella?", answer: "Valencia" },
    { value: 600,  question: "¿Cuál es el ingrediente base del dulce de leche?", answer: "Leche y azúcar" },
    { value: 800,  question: "¿Cómo se llama el embutido español curado hecho con la pata trasera del cerdo?", answer: "Jamón serrano / jamón ibérico (aceptar jamón)" },
    { value: 1000, question: "¿Cuál es el nombre del queso más famoso de La Mancha, con denominación de origen propia?", answer: "Queso manchego" },
  ],

  "Historia de España": [
    { value: 200,  question: "¿En qué año terminó la Guerra Civil Española?", answer: "1939" },
    { value: 400,  question: "¿Quién fue el dictador que gobernó España desde 1939 hasta su muerte?", answer: "Francisco Franco" },
    { value: 600,  question: "¿Cómo se llamaba el rey que reinó en España durante la Transición democrática?", answer: "Juan Carlos I" },
    { value: 800,  question: "¿En qué año se aprobó la Constitución española actual?", answer: "1978" },
    { value: 1000, question: "¿Cómo se llama el primer presidente del gobierno de la democracia española, elegido en 1977?", answer: "Adolfo Suárez" },
  ],

  "Historia Argentina": [
    { value: 200,  question: "¿En qué año declaró Argentina su independencia?", answer: "1816" },
    { value: 400,  question: "¿Cómo se llamó la guerra entre Argentina y el Reino Unido en 1982?", answer: "Guerra de las Malvinas" },
    { value: 600,  question: "¿En qué año comenzó la última dictadura militar argentina?", answer: "1976" },
    { value: 800,  question: "¿En qué año se produjo la crisis económica argentina conocida como 'el corralito'?", answer: "2001" },
    { value: 1000, question: "¿Cómo se llama la plaza principal de Buenos Aires, frente a la Casa Rosada?", answer: "Plaza de Mayo" },
  ],

  "La Roja y la Albiceleste": [
    { value: 200,  question: "¿Cuántos Mundiales de fútbol ha ganado España?", answer: "1 (Sudáfrica 2010)" },
    { value: 400,  question: "¿Cuántos Mundiales de fútbol ha ganado Argentina?", answer: "3 (1978, 1986 y 2022)" },
    { value: 600,  question: "¿Quién fue el máximo goleador de España en el Mundial de Sudáfrica 2010?", answer: "David Villa" },
    { value: 800,  question: "¿Qué jugador argentino fue elegido mejor jugador del Mundial de Qatar 2022?", answer: "Lionel Messi" },
    { value: 1000, question: "¿Cuántas Eurocopas ha ganado la selección española?", answer: "3 (1964, 2008 y 2012)" },
  ],

  "Letras Hispanas": [
    { value: 200,  question: "¿Quién escribió 'Don Quijote de la Mancha'?", answer: "Miguel de Cervantes" },
    { value: 400,  question: "¿De qué país era el escritor Jorge Luis Borges?", answer: "Argentina" },
    { value: 600,  question: "¿Cómo se llama la novela más famosa de Gabriel García Márquez?", answer: "Cien años de soledad" },
    { value: 800,  question: "¿De qué región española era Federico García Lorca?", answer: "Andalucía (nació en Granada)" },
    { value: 1000, question: "¿Cómo se llama la novela de Julio Cortázar que alterna entre París y Buenos Aires?", answer: "Rayuela" },
  ],

  "El Mundo del Deporte": [
    { value: 200,  question: "¿En qué deporte se entrega el trofeo Vince Lombardi?", answer: "Fútbol americano (NFL)" },
    { value: 400,  question: "¿Cuántos Mundiales de Fórmula 1 ganó Fernando Alonso?", answer: "2 (2005 y 2006)" },
    { value: 600,  question: "¿En qué deporte se convirtió en leyenda el argentino Juan Manuel Fangio?", answer: "Fórmula 1 (automovilismo)" },
    { value: 800,  question: "¿Cuántos campeonatos mundiales de Fórmula 1 ganó Juan Manuel Fangio?", answer: "5" },
    { value: 1000, question: "¿En qué año ganó Argentina el oro olímpico en básquetbol con la llamada 'Generación Dorada'?", answer: "2004 (Atenas)" },
  ],

  "Pantalla Chica": [
    { value: 200,  question: "¿En qué canal argentino se emite el reality Gran Hermano?", answer: "Telefe" },
    { value: 400,  question: "¿Cómo se llama el programa de cocina de famosos que arrasó en Telefe desde 2020?", answer: "MasterChef Celebrity" },
    { value: 600,  question: "¿Cómo se llama la telenovela argentina de los 90 protagonizada por Natalia Oreiro y Facundo Arana?", answer: "Muñeca Brava" },
    { value: 800,  question: "¿En qué año se estrenó la primera edición de Gran Hermano en Argentina?", answer: "2001" },
    { value: 1000, question: "¿Cómo se llamaba el ciclo de entrevistas y entretenimiento de Canal 13 Argentina que condujo Mirtha Legrand durante décadas?", answer: "Las comidas de Mirtha / Almorzando con Mirtha Legrand (aceptar ambas)" },
  ],

  "El Hincha": [
    { value: 200,  question: "¿Cómo se llama el clásico entre River Plate y Boca Juniors?", answer: "El Superclásico" },
    { value: 400,  question: "¿Cuántas Champions League ha ganado el Real Madrid (hasta 2024)?", answer: "15" },
    { value: 600,  question: "¿En qué estadio juega River Plate de Argentina?", answer: "El Monumental (Estadio Más Monumental)" },
    { value: 800,  question: "¿Cuántas Copas Libertadores ha ganado Boca Juniors?", answer: "6" },
    { value: 1000, question: "¿En qué ciudad se jugó la final de la Copa Libertadores 2018 entre River y Boca, disputada fuera de Argentina?", answer: "Madrid" },
  ],

  "Los 90 Mandan": [
    { value: 200,  question: "¿Cómo se llamaba el juguete virtual de bolsillo para cuidar una mascota que fue furor en los 90?", answer: "Tamagotchi" },
    { value: 400,  question: "¿Qué dúo español cantó 'La Macarena', el hit que conquistó el mundo entero?", answer: "Los del Río" },
    { value: 600,  question: "¿Qué película de Disney de 1994 cuenta la historia del cachorro de león Simba?", answer: "El Rey León" },
    { value: 800,  question: "¿Cómo se llama la consola de Nintendo que llegó en 1996 y popularizó los juegos en 3D?", answer: "Nintendo 64" },
    { value: 1000, question: "¿Cómo se llama la banda de rock argentina de los 90 conocida por 'Corazón Delator' y 'Yo te amo tanto'?", answer: "Vilma Palma e Vampiros" },
  ],

  "El Podio": [
    { value: 200,  question: "¿En qué deporte es leyenda el español Rafael Nadal?", answer: "Tenis" },
    { value: 400,  question: "¿En qué deporte ganó Argentina el oro olímpico en Río 2016 con Los Leones?", answer: "Hockey sobre césped masculino" },
    { value: 600,  question: "¿Cuántos Tours de Francia consecutivos ganó el ciclista español Miguel Induráin?", answer: "5 (de 1991 a 1995)" },
    { value: 800,  question: "¿En qué año ganó Juan Martín del Potro el US Open de tenis?", answer: "2009" },
    { value: 1000, question: "¿En qué deporte ganó Carolina Marín el oro olímpico en Río 2016?", answer: "Bádminton" },
  ],

  "Reyes y Presidentes": [
    { value: 200,  question: "¿Cómo se llama el rey actual de España?", answer: "Felipe VI" },
    { value: 400,  question: "¿Quién fue el primer presidente elegido en Argentina tras la última dictadura militar?", answer: "Raúl Alfonsín" },
    { value: 600,  question: "¿En qué año abdicó Juan Carlos I a favor de su hijo Felipe VI?", answer: "2014" },
    { value: 800,  question: "¿Cómo se llama el presidente del Gobierno de España desde 2018?", answer: "Pedro Sánchez" },
    { value: 1000, question: "¿Cuántos presidentes tuvo Argentina durante la crisis del 19 al 31 de diciembre de 2001?", answer: "5 presidentes" },
  ],

  "Viral y Punto": [
    { value: 200,  question: "¿Cómo se llamaba el challenge de 2014 donde la gente se tiraba un balde de agua helada para recaudar fondos?", answer: "Ice Bucket Challenge" },
    { value: 400,  question: "¿Cómo se llama la app china de videos cortos que se volvió viral en todo el mundo?", answer: "TikTok" },
    { value: 600,  question: "¿Qué presidente argentino se hizo viral bailando en la Quinta de Olivos durante la pandemia?", answer: "Alberto Fernández" },
    { value: 800,  question: "¿Cómo se llamaba el juego de móvil que fue viral en 2016 por atrapar Pokémon en la calle con realidad aumentada?", answer: "Pokémon GO" },
    { value: 1000, question: "¿En qué año se publicó el primer tweet de la historia, fundando la red social Twitter?", answer: "2006" },
  ],

  "El Cabezón": [
    { value: 200,  question: "¿Cómo se llama el conductor argentino apodado 'El Cabezón'?", answer: "Marcelo Tinelli" },
    { value: 400,  question: "¿Cómo se llama el programa que condujo Tinelli durante décadas en El Trece?", answer: "ShowMatch" },
    { value: 600,  question: "¿De qué club de fútbol argentino es fanático y fue presidente Marcelo Tinelli?", answer: "San Lorenzo de Almagro" },
    { value: 800,  question: "¿En qué ciudad de la provincia de Buenos Aires nació Marcelo Tinelli?", answer: "Bolívar" },
    { value: 1000, question: "¿En qué año se emitió ShowMatch por primera vez en la televisión argentina?", answer: "1990" },
  ],

  "La Pista": [
    { value: 200,  question: "¿Cómo se llama el segmento de baile más famoso de ShowMatch?", answer: "Bailando por un Sueño" },
    { value: 400,  question: "¿Cómo se llama la modelo y jurado del Bailando conocida como 'Pampita'?", answer: "Carolina Ardohain" },
    { value: 600,  question: "¿En qué canal argentino se emite ShowMatch con Tinelli?", answer: "El Trece (Canal 13)" },
    { value: 800,  question: "¿Qué cantante de cumbia apodada 'La Bomba Tucumana' fue figura icónica del Bailando?", answer: "Gladys" },
    { value: 1000, question: "¿En qué año se emitió la primera edición del Bailando por un Sueño?", answer: "2006" },
  ],

  "La Playlist": [
    { value: 200,  question: "¿De qué país es el cantante de reggaeton J Balvin?", answer: "Colombia" },
    { value: 400,  question: "¿Qué artista española arrasó en los Grammy Latinos 2018 con su álbum 'El Mal Querer'?", answer: "Rosalía" },
    { value: 600,  question: "¿Qué banda argentina de rock cantó 'De Música Ligera'?", answer: "Soda Stereo" },
    { value: 800,  question: "¿Cómo se llama el cantante argentino de cuarteto apodado 'La Mona'?", answer: "Carlos 'La Mona' Jiménez" },
    { value: 1000, question: "¿Cómo se llama el último álbum de estudio que grabó Gustavo Cerati antes de su accidente en 2010?", answer: "Fuerza Natural (2009)" },
  ],

  "El Vestuario": [
    { value: 200,  question: "¿Cuál es el apodo de Lionel Messi?", answer: "La Pulga" },
    { value: 400,  question: "¿Cuál es el apodo del delantero argentino Lautaro Martínez?", answer: "El Toro" },
    { value: 600,  question: "¿Cómo se llama el estadio del Atlético de Madrid inaugurado en 2017?", answer: "Cívitas Metropolitano (o Wanda Metropolitano, aceptar ambos)" },
    { value: 800,  question: "¿Cuánto costó el traspaso de Neymar del Barcelona al PSG en 2017, el más caro de la historia?", answer: "222 millones de euros" },
    { value: 1000, question: "¿Cuántos goles marcó Sergio 'Kun' Agüero en la Premier League con el Manchester City, siendo el máximo goleador extranjero de la historia?", answer: "184 goles" },
  ],

  "Corre, Salta, Nada": [
    { value: 200,  question: "¿En qué deporte se compite en el Tour de Francia?", answer: "Ciclismo" },
    { value: 400,  question: "¿En cuántos estilos diferentes se compite en natación en los Juegos Olímpicos?", answer: "4 (libre, espalda, pecho y mariposa)" },
    { value: 600,  question: "¿Qué país ganó el oro en el Mundial de Rugby de 2023 celebrado en Francia?", answer: "Sudáfrica" },
    { value: 800,  question: "¿Cómo se llama el torneo de tenis que se juega sobre tierra batida en París?", answer: "Roland Garros" },
    { value: 1000, question: "¿Cuántos Grand Slams ganó Carlos Alcaraz hasta el año 2024?", answer: "4 (US Open 2022, Wimbledon 2023, Roland Garros 2024, Wimbledon 2024)" },
  ],

  "Tierra Nuestra": [
    { value: 200,  question: "¿Cuál es la montaña más alta de España?", answer: "El Teide (en Tenerife, Canarias)" },
    { value: 400,  question: "¿En qué provincia argentina está el glaciar Perito Moreno?", answer: "Santa Cruz" },
    { value: 600,  question: "¿Cuántas Comunidades Autónomas tiene España?", answer: "17" },
    { value: 800,  question: "¿En qué provincia argentina está la región conocida como Valle de la Luna?", answer: "San Juan" },
    { value: 1000, question: "¿Cuál es la provincia más grande de Argentina en superficie?", answer: "Buenos Aires" },
  ],

  "La Bodega": [
    { value: 200,  question: "¿Qué bebida espirituosa argentina se mezcla típicamente con Coca-Cola?", answer: "Fernet (Fernet con Coca)" },
    { value: 400,  question: "¿De qué región española es originario el vino Rioja?", answer: "La Rioja" },
    { value: 600,  question: "¿En qué provincia argentina se produce la mayor parte del vino nacional?", answer: "Mendoza" },
    { value: 800,  question: "¿Cómo se llama el aperitivo catalán de pan frotado con tomate y rociado con aceite de oliva?", answer: "Pa amb tomàquet / Pan con tomate" },
    { value: 1000, question: "¿Cómo se llama el plato típico madrileño de cocido hecho con garbanzos, verduras y carne?", answer: "Cocido madrileño" },
  ],

  "Mente de Científico": [
    { value: 200,  question: "¿Qué científico argentino ganó el Premio Nobel de Química en 1970 por su trabajo sobre los nucleótidos del azúcar?", answer: "Luis Federico Leloir" },
    { value: 400,  question: "¿Cómo se llama el médico argentino que inventó el bypass coronario en 1967?", answer: "René Favaloro" },
    { value: 600,  question: "¿Cómo se llama el telescopio más grande del mundo, ubicado en La Palma, Canarias?", answer: "Gran Telescopio Canarias (GTC)" },
    { value: 800,  question: "¿Qué científico español fue pionero en el estudio de las neuronas y ganó el Premio Nobel en 1906?", answer: "Santiago Ramón y Cajal" },
    { value: 1000, question: "¿En qué año el argentino Bernardo Houssay se convirtió en el primer latinoamericano en ganar el Nobel de Fisiología o Medicina?", answer: "1947" },
  ],

  "Tótum Revolútum": [
    { value: 200,  question: "¿Cuántos lados tiene un octágono?", answer: "8" },
    { value: 400,  question: "¿En qué año se lanzó el primer iPhone?", answer: "2007" },
    { value: 600,  question: "¿Cuál es el hueso más largo del cuerpo humano?", answer: "El fémur" },
    { value: 800,  question: "¿Cuántos segundos tiene una hora?", answer: "3600" },
    { value: 1000, question: "¿Qué país fue el primero en el mundo en otorgar el voto a la mujer?", answer: "Nueva Zelanda (1893)" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ⚡ BANCO DE PREGUNTAS — MODO RELÁMPAGO
// ═══════════════════════════════════════════════════════════════
export const LIGHTNING_QUESTIONS = [
  { question: "¿En qué ciudad está la Torre Eiffel?", answer: "París" },
  { question: "¿Cuántos colores tiene el arcoíris?", answer: "7" },
  { question: "¿Cómo se llama el protagonista de 'El Rey León'?", answer: "Simba" },
  { question: "¿En qué deporte se usa un puck (disco de goma)?", answer: "Hockey sobre hielo" },
  { question: "¿De qué color es la 'caja negra' de los aviones?", answer: "Naranja" },
  { question: "¿Cuántos jugadores hay en cancha en un equipo de básquet?", answer: "5" },
  { question: "¿En qué año llegó el hombre a la Luna?", answer: "1969" },
  { question: "¿Quién pintó la Mona Lisa?", answer: "Leonardo da Vinci" },
  { question: "¿Cuál es el animal terrestre más rápido?", answer: "El guepardo (cheetah)" },
  { question: "¿Cómo se llama la moneda de Japón?", answer: "Yen" },
  { question: "¿Qué gas necesitamos para respirar y vivir?", answer: "Oxígeno" },
  { question: "¿Cuántas cuerdas tiene una guitarra estándar?", answer: "6" },
  { question: "¿En qué país está la Gran Muralla?", answer: "China" },
  { question: "¿Cómo se llama el fontanero saltarín de Nintendo?", answer: "Mario (Super Mario)" },
  { question: "¿Qué continente es el más grande del mundo?", answer: "Asia" },
  { question: "¿De qué país es originaria la pizza?", answer: "Italia" },
  { question: "¿Cómo se llama la cantante colombiana que hizo 'Hips Don't Lie'?", answer: "Shakira" },
  { question: "¿Cuántos planetas tiene el sistema solar?", answer: "8" },
  { question: "¿Qué país tiene la bandera con una hoja de arce roja?", answer: "Canadá" },
  { question: "¿Cómo se llama el protagonista de 'Harry Potter'?", answer: "Harry Potter" },
  { question: "¿Qué país tiene más habitantes en el mundo?", answer: "India" },
  { question: "¿Cuántas teclas tiene un piano estándar?", answer: "88" },
  { question: "¿Cómo se llama la serie donde los personajes viven en Springfield?", answer: "Los Simpson" },
  { question: "¿En qué año comenzó la Segunda Guerra Mundial?", answer: "1939" },
  { question: "¿Cuál es la montaña más alta de América?", answer: "El Aconcagua" },
  { question: "¿Cómo se llama el creador de Facebook?", answer: "Mark Zuckerberg" },
  { question: "¿Cuántos metros tiene un kilómetro?", answer: "1000" },
  { question: "¿Qué idioma se habla en Brasil?", answer: "Portugués" },
  { question: "¿De qué país es originario el sushi?", answer: "Japón" },
  { question: "¿Cuántos minutos dura un tiempo de fútbol?", answer: "45 minutos" },
  { question: "¿Qué animal produce la miel?", answer: "La abeja" },
  { question: "¿En qué deporte se puede hacer un jonrón (home run)?", answer: "Béisbol" },
  { question: "¿Cuántas estaciones tiene el año?", answer: "4" },
  { question: "¿Cómo se llama el estadio del FC Barcelona?", answer: "Camp Nou (Spotify Camp Nou)" },
  { question: "¿En qué ciudad argentina está el Obelisco?", answer: "Buenos Aires" },
  { question: "¿Qué fruta se usa para hacer el vino?", answer: "La uva" },
  { question: "¿Cuántos jugadores hay en un equipo de voleibol en cancha?", answer: "6" },
  { question: "¿Qué país organizó el Mundial de fútbol en 2022?", answer: "Qatar" },
  { question: "¿Qué color resulta de mezclar rojo y azul?", answer: "Morado / violeta" },
  { question: "¿Cuántos agujeros tiene un campo de golf estándar?", answer: "18" },
  { question: "¿Cuántas patas tiene una araña?", answer: "8" },
  { question: "¿Cuál es la capital de México?", answer: "Ciudad de México" },
  { question: "¿En qué ciudad se celebra el Carnaval más famoso de Brasil?", answer: "Río de Janeiro" },
  { question: "¿Cuántos colores tiene la bandera de Argentina?", answer: "3 (celeste, blanco y el sol dorado)" },
  { question: "¿Cuál es el río más largo del mundo?", answer: "El Nilo (o el Amazonas, aceptar ambos)" },
  { question: "¿Cuántos lados tiene un triángulo?", answer: "3" },
  { question: "¿De qué país es el flamenco?", answer: "España" },
  { question: "¿Cuántos meses tiene un año?", answer: "12" },
  { question: "¿Qué animal es el más grande del mundo?", answer: "La ballena azul" },
  { question: "¿Cuántos Grand Slams ganó Messi?", answer: "Ninguno, eso es tenis — Messi juega al fútbol" },
];
