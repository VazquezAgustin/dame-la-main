// Lógica pura de ¿Qué tipo soy? — sin dependencias de Firebase ni DOM.
import { PALABRAS_TIPO, TIPO_PACKS } from "./palabras.js";

// Mismo sistema de puntos que ¿Qué número soy?: 300/200/100 por orden de acierto.
export { POINTS_BY_POSITION, pointsForPosition, guessedCount, allGuessed } from "../numero-main/logica.js";

// Devuelve { playerId: categoría } con categorías distintas dentro de la ronda.
// Evita las de `exclude` (la ronda anterior) salvo que el pool no alcance.
// rng es inyectable para poder testear.
export function assignPalabras(playerIds = [], rng = Math.random, pool = PALABRAS_TIPO, exclude = []) {
  const excluded = new Set(exclude);
  let disponibles = pool.filter(p => !excluded.has(p));
  if (disponibles.length < playerIds.length) disponibles = [...pool];

  const result = {};
  playerIds.forEach((pid, i) => {
    if (i < disponibles.length) {
      // Fisher-Yates parcial: elegir del resto y dejarlo en la posición i
      const j = i + Math.floor(rng() * (disponibles.length - i));
      [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
      result[pid] = disponibles[i];
    } else {
      // Más jugadores que categorías (defensivo): se repite una al azar
      result[pid] = disponibles[Math.floor(rng() * disponibles.length)];
    }
  });
  return result;
}

// tipoPack: tono de las categorías ("suave" | "mixto" | "picante").
export function buildTipoInitialState(tipoPack = "mixto") {
  return {
    gameType:        "tipo-main",
    tipoPack:        TIPO_PACKS.includes(tipoPack) ? tipoPack : "mixto",
    selectorIndex:   0,
    tipoRoundNumber: 0,
    tipoRound:       null,
  };
}
