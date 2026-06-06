// Lógica pura de Pictionary — sin dependencias de Firebase ni DOM.
// Todo lo testeable (normalización, matching, scoring, máquina de estados)
// vive acá para poder unit-testearlo sin mocks de Firebase ni jsdom.

// ── Puntajes ──────────────────────────────────────────────────────
export const POINTS_FIRST_GUESS    = 150; // primer jugador en acertar
export const POINTS_LATER_GUESS    = 75;  // aciertos posteriores
export const POINTS_DRAWER_PER_HIT = 50;  // el dibujante por cada acertante

// Normaliza un texto para comparar adivinanzas:
// minúsculas, sin acentos/diacríticos, sin puntuación (conserva la ñ),
// espacios colapsados y sin espacios al borde.
export function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/ñ/g, "")                            // protege la ñ del paso NFD
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // quita tildes/diacríticos
    .replace(//g, "ñ")                            // restaura la ñ
    .replace(/[^a-z0-9ñ\s]/g, " ")                      // quita puntuación, conserva ñ
    .replace(/\s+/g, " ")
    .trim();
}

// ¿La adivinanza coincide con la palabra secreta?
export function isCorrectGuess(guess, secret) {
  const ns = normalize(secret);
  return ns.length > 0 && normalize(guess) === ns;
}

// Puntaje de un acertante según su orden (0 = primero) y la fracción de
// tiempo restante (0..1). El primero gana base alta; los siguientes menos.
// A ambos se les suma un bonus proporcional al tiempo que quedaba.
export function calcGuesserScore(orderIndex, remainingFraction = 0) {
  const base = orderIndex === 0 ? POINTS_FIRST_GUESS : POINTS_LATER_GUESS;
  const frac = Math.max(0, Math.min(1, remainingFraction));
  const timeBonus = Math.round(base * 0.5 * frac);
  return base + timeBonus;
}

// Puntaje del dibujante: una recompensa fija por cada jugador que acertó.
export function calcDrawerScore(numGuessed = 0) {
  return Math.max(0, numGuessed) * POINTS_DRAWER_PER_HIT;
}

// ¿Terminó la ronda? True si todos los no-dibujantes ya acertaron
// (o si no hay nadie que pueda adivinar).
export function isRoundOver(guessed = {}, playerOrder = [], drawerId) {
  const guessers = (playerOrder || []).filter((pid) => pid !== drawerId);
  if (guessers.length === 0) return true;
  return guessers.every((pid) => !!(guessed && guessed[pid]));
}

// Determina si el juego terminó dado el número de rondas completadas.
export function isGameOver(roundsCompleted, roundsPerPlayer, playerCount) {
  return roundsCompleted >= roundsPerPlayer * playerCount;
}

// Índice del siguiente dibujante en orden circular.
export function nextSelectorIndex(current, playerCount) {
  if (playerCount <= 0) return 0;
  return (current + 1) % playerCount;
}

// Clasifica una entrada de chat para renderizarla. NUNCA devuelve el texto
// de una adivinanza correcta, para no spoilear la palabra a quien no acertó.
export function classifyChatEntry(entry = {}) {
  if (entry.correct) return { type: "acierto", playerId: entry.playerId };
  return { type: "guess", playerId: entry.playerId, text: entry.text };
}

// Devuelve la pista enmascarada de la palabra: una _ por cada letra,
// conservando los espacios entre palabras. Ej: "el padrino" → "__ _______".
export function maskWord(secret = "") {
  return String(secret)
    .split(/(\s+)/)
    .map((chunk) => (/\s+/.test(chunk) ? chunk : chunk.replace(/\S/g, "_")))
    .join("");
}

// Estado inicial del juego para Pictionary.
export function buildPictionaryInitialState({
  roundsPerPlayer = 2,
  drawSeconds = 80,
  categoria = "mixto",
} = {}) {
  return {
    gameType:         "pictionary",
    pictionaryConfig: { roundsPerPlayer, drawSeconds, categoria },
    selectorIndex:    0,
    roundsCompleted:  0,
    currentRound:     null,
  };
}
