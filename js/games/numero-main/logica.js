// Lógica pura de ¿Qué número soy? — sin dependencias de Firebase ni DOM.

export const NUMBER_MIN = 1;
export const NUMBER_MAX = 99;
// Puntos según el orden de acierto dentro de la ronda. Del 3.º en adelante: el último valor.
export const POINTS_BY_POSITION = [300, 200, 100];

// Devuelve { playerId: número } con números distintos en [min, max].
// rng es inyectable para poder testear. Si hay más jugadores que números
// disponibles (defensivo), los sobrantes repiten un número al azar.
export function assignNumbers(playerIds = [], rng = Math.random, min = NUMBER_MIN, max = NUMBER_MAX) {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);

  const result = {};
  playerIds.forEach((pid, i) => {
    if (i < pool.length) {
      // Fisher-Yates parcial: elegir del resto y dejarlo en la posición i
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      result[pid] = pool[i];
    } else {
      result[pid] = pool[Math.floor(rng() * pool.length)];
    }
  });
  return result;
}

// Puntos por posición de acierto: 1 → 300, 2 → 200, 3+ → 100, <1 → 0.
export function pointsForPosition(position) {
  if (!position || position < 1) return 0;
  return POINTS_BY_POSITION[Math.min(position, POINTS_BY_POSITION.length) - 1];
}

export function guessedCount(guessed) {
  return Object.keys(guessed || {}).length;
}

// true si todos los jugadores de playerOrder ya adivinaron.
export function allGuessed(playerOrder, guessed) {
  if (!playerOrder || playerOrder.length === 0) return false;
  return playerOrder.every(pid => !!guessed?.[pid]);
}

export function buildNumeroInitialState() {
  return {
    gameType:          "numero-main",
    selectorIndex:     0,
    numeroRoundNumber: 0,
    numeroRound:       null,
  };
}
