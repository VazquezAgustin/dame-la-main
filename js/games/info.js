// ════════════════════════════════════════════════════════════════
// ℹ️ INFO DE CADA JUEGO — fuente única de textos
// Se muestra en el modal #modal-info (ver js/main.js). Para cambiar una
// regla, editar solo acá. Clave = gameType.
// ════════════════════════════════════════════════════════════════

export const GAME_INFO = {
  "dame-la-main": {
    icono: "📋",
    titulo: "Dame la Main",
    descripcion: "Trivia por categorías con pulsador, al estilo «Dame la Pasta».",
    pasos: [
      "Por turnos, un jugador elige una categoría y un valor del tablero.",
      "Todos pueden pulsar el botón: el primero en tocar responde en voz alta.",
      "Toca «Mostrar respuesta» y el host dice si fue correcta.",
      "Correcta suma los puntos; incorrecta los resta.",
      "Gana quien tenga más puntos al terminar el tablero.",
    ],
  },
  "quien-es-main": {
    icono: "🎭",
    titulo: "¿Quién es Main?",
    descripcion: "Adiviná el famoso: es como Heads Up, con pistas de tus amigos.",
    pasos: [
      "Por turnos, un jugador adivina y el resto ve en su pantalla a quién es.",
      "El que adivina mira su celular y los demás le dan pistas sin decir el nombre.",
      "Marcá «Correcto» o «Paso» antes de que se acabe el tiempo.",
      "Cada acierto suma 100 puntos. Gana quien más puntos junte.",
    ],
  },
  "pictionary": {
    icono: "🎨",
    titulo: "Pictionary",
    descripcion: "Uno dibuja, los demás adivinan escribiendo.",
    pasos: [
      "En cada ronda un jugador elige una palabra y la dibuja.",
      "Los demás escriben lo que creen que es, sin hablar.",
      "El primero en acertar gana 150 pts, los siguientes 75.",
      "El dibujante gana 50 pts por cada jugador que acierta.",
    ],
  },
  "numero-main": {
    icono: "🔢",
    titulo: "¿Qué número soy?",
    descripcion: "Todos ven tu número menos vos: adivinalo preguntando en voz alta.",
    pasos: [
      "Cada uno recibe un número distinto. Tocá tu pantalla y mostralo a los demás sin mirarlo.",
      "Hacé preguntas de sí o no: «¿Soy mayor que 50?», «¿Me alcanza para un auto?».",
      "Las preguntas y respuestas son en voz alta; la app no maneja turnos.",
      "El host marca quién adivinó: 300, 200 y 100 pts según el orden.",
      "«Nueva ronda» reparte números nuevos.",
    ],
  },
  "tipo-main": {
    icono: "🏷️",
    titulo: "¿Qué tipo soy?",
    descripcion: "Todos ven tu categoría de persona menos vos: adivinala preguntando.",
    pasos: [
      "Cada uno recibe una categoría (ej: «Falopero», «Hincha de Boca»). Mostrala sin mirarla.",
      "Preguntá en voz alta: «¿Maradona entra en mi categoría?».",
      "Los demás responden sí o no.",
      "El host marca quién adivinó: 300, 200 y 100 pts según el orden.",
      "«Nueva ronda» reparte categorías nuevas.",
    ],
  },
};
