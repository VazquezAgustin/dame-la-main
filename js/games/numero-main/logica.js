// Lógica pura de ¿Qué número soy? — sin dependencias de Firebase ni DOM.

export const NUMBER_MIN = 1;
export const NUMBER_MAX = 99;
// Rangos disponibles. "chico": 1–99 (estimación clásica). "grande": cifras redondas
// de 100 a 100 millones, pensadas como plata ("¿me alcanza para un auto?").
export const NUMBER_RANGES = {
  chico:  { min: NUMBER_MIN, max: NUMBER_MAX },
  grande: { min: 100, max: 100_000_000 },
};
export const DEFAULT_RANGE = "chico";

// Cualquier valor desconocido o ausente (salas viejas) cuenta como "chico".
export function normalizeRange(range) {
  return Object.prototype.hasOwnProperty.call(NUMBER_RANGES, range) ? range : DEFAULT_RANGE;
}

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

// Cifra redonda del rango grande. Distribución log-uniforme (igual de probable una
// cifra de 3 dígitos que una de 8) redondeada a 2 cifras significativas:
// 100, 4.500, 380.000, 72.000.000. NO arma un pool: 100 millones de elementos cuelga el navegador.
export function randomBigNumber(rng = Math.random) {
  const { min, max } = NUMBER_RANGES.grande;
  const v     = 10 ** (Math.log10(min) + rng() * (Math.log10(max) - Math.log10(min)));
  const step  = 10 ** (Math.floor(Math.log10(v)) - 1);
  const round = Math.round(v / step) * step;
  return Math.min(max, Math.max(min, round));
}

// Como assignNumbers pero para el rango grande: números distintos por muestreo con rechazo.
// Hay ~540 valores posibles; si hubiera más jugadores (defensivo), se tolera repetir.
export function assignBigNumbers(playerIds = [], rng = Math.random) {
  const used = new Set();
  const result = {};
  playerIds.forEach(pid => {
    let n = randomBigNumber(rng);
    for (let tries = 0; used.has(n) && tries < 200; tries++) n = randomBigNumber(rng);
    used.add(n);
    result[pid] = n;
  });
  return result;
}

// Reparte según el rango ("chico" | "grande").
export function assignNumbersByRange(playerIds, range, rng = Math.random) {
  return normalizeRange(range) === "grande"
    ? assignBigNumbers(playerIds, rng)
    : assignNumbers(playerIds, rng);
}

// Texto del número: en el rango grande, con punto de miles (20000 → "20.000").
// Formateo manual (no toLocaleString) para que sea idéntico en todos los dispositivos.
export function formatNumero(n, range) {
  if (n === undefined || n === null) return "";
  if (normalizeRange(range) !== "grande") return String(n);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

export function buildNumeroInitialState(config = {}) {
  return {
    gameType:          "numero-main",
    numeroRange:       normalizeRange(config?.numeroRange),
    selectorIndex:     0,
    numeroRoundNumber: 0,
    numeroRound:       null,
  };
}
