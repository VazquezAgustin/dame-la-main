import { QUESTIONS } from "./preguntas.js";

// ═══════════════════════════════════════════════════════════════
// 🛠️ UTILIDADES PURAS — sin DOM, sin Firebase
// ═══════════════════════════════════════════════════════════════

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function isBoardComplete(board, categories) {
  if (!board || !categories) return false;
  return categories.every(cat =>
    [200, 400, 600, 800, 1000].every(v => board[cat]?.[String(v)] === true)
  );
}

export function countAnsweredCells(board, categories) {
  if (!board || !categories) return 0;
  let count = 0;
  categories.forEach(cat =>
    [200, 400, 600, 800, 1000].forEach(v => {
      if (board[cat]?.[String(v)] === true) count++;
    })
  );
  return count;
}

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getQuestion(category, value) {
  return (QUESTIONS[category] || []).find(q => q.value === value) || null;
}

export function categoryHasUnplayed(board, cat) {
  return [200, 400, 600, 800, 1000].some(v => board?.[cat]?.[String(v)] !== true);
}

export function availableCategories(s) {
  return (s.categories || []).filter(cat => categoryHasUnplayed(s.board || {}, cat));
}

// Versión pura de rebalanceLengths: no toca DOM ni estado global.
// Recibe el estado actual de sliders, los bounds y el slot modificado;
// devuelve el nuevo estado con la suma preservada.
export function rebalanceLengths(currentState, bounds, changedSlot, newValue) {
  const b = bounds[changedSlot];
  newValue = Math.max(b.min, Math.min(b.max, newValue));

  const others = Object.keys(currentState).filter(k => k !== changedSlot);
  let delta = newValue - currentState[changedSlot];

  const next = { ...currentState, [changedSlot]: newValue };
  while (delta !== 0) {
    const sign = Math.sign(delta);
    const candidates = others
      .map(k => ({
        k,
        room: sign > 0 ? next[k] - bounds[k].min : bounds[k].max - next[k],
      }))
      .filter(c => c.room > 0)
      .sort((a, b) => b.room - a.room);
    if (candidates.length === 0) break;
    next[candidates[0].k] -= sign;
    delta -= sign;
  }

  if (delta !== 0) next[changedSlot] -= delta;
  return next;
}
