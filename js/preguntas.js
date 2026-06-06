// ═══════════════════════════════════════════════════════════════
// 🎚️ SELECTOR DE BANCO DE PREGUNTAS
// ═══════════════════════════════════════════════════════════════
// Elige el banco según js/theme.config.js. El resto del juego importa
// SIEMPRE desde acá (esta interfaz pública no cambia):
//   CATEGORY_POOL, QUESTIONS, LIGHTNING_QUESTIONS, ESTIMATION_QUESTIONS,
//   pickRandomCategories.
//
// Para alternar la temática, editá ACTIVE_THEME en js/theme.config.js.
// ═══════════════════════════════════════════════════════════════
import { ACTIVE_THEME } from "./theme.config.js";
import * as classic from "./preguntas.classic.js";
import * as mundial from "./preguntas.mundial.js";

const active = ACTIVE_THEME === "mundial" ? mundial : classic;

export const CATEGORY_POOL = active.CATEGORY_POOL;
export const QUESTIONS = active.QUESTIONS;
export const LIGHTNING_QUESTIONS = active.LIGHTNING_QUESTIONS;
export const ESTIMATION_QUESTIONS = active.ESTIMATION_QUESTIONS;

// pickRandomCategories es agnóstico a la temática → vive acá (sin duplicar).
export function pickRandomCategories(pool, count = 6, exclude = []) {
  const available = pool.filter((cat) => !exclude.includes(cat));
  const source = available.length >= count ? available : pool;
  return [...source].sort(() => Math.random() - 0.5).slice(0, count);
}
