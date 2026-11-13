// Lógica pura de ¿Quién es Main? — sin dependencias de Firebase ni DOM.

export const POINTS_PER_CORRECT = 100;

// Calcula el puntaje de una ronda a partir del objeto results de Firebase.
// results: { "0": { famoso, result: "correcto"|"paso" }, ... }
export function calcRoundScore(results = {}) {
  return Object.values(results).filter(r => r.result === "correcto").length * POINTS_PER_CORRECT;
}

// Determina si el juego terminó dado el número de rondas completadas.
export function isGameOver(roundsCompleted, roundsPerPlayer, playerCount) {
  return roundsCompleted >= roundsPerPlayer * playerCount;
}

// Índice del siguiente selector en orden circular.
export function nextSelectorIndex(current, playerCount) {
  if (playerCount <= 0) return 0;
  return (current + 1) % playerCount;
}

// Estado inicial del juego para ¿Quién es Main?
export function buildQuienInitialState({ roundsPerPlayer = 2, famososPerRound = 8, roundDuration = 60 } = {}) {
  return {
    gameType:        "quien-es-main",
    quienConfig:     { roundsPerPlayer, famososPerRound, roundDuration },
    selectorIndex:   0,
    roundsCompleted: 0,
    currentRound:    null,
    quienUsed:       [], // famosos ya mostrados (Firebase no guarda arrays vacíos: leer con || [])
  };
}

// Famosos que llegaron a mostrarse en la ronda (los respondidos + el que estaba en pantalla).
export function shownFamosos(round) {
  const famosos = round?.famosos || [];
  const idx = round?.currentIndex ?? 0;
  return famosos.slice(0, Math.min(idx + 1, famosos.length));
}
