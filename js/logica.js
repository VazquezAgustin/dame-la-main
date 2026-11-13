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

// ═══════════════════════════════════════════════════════════════
// 🖐 ROBO DE RESPUESTA
// ═══════════════════════════════════════════════════════════════

// Tiempo (ms) desde que alguien toma el turno hasta que otro puede robarlo
export const STEAL_AFTER_MS = 10000;

// Puntos que pierde el robado: la mitad del valor (en bonus, la mitad de value*2)
export function stealPenalty(value, bonus) {
  return Math.round((bonus ? value * 2 : value) / 2);
}

// ¿Puede `playerId` robar el turno de respuesta en este momento?
export function canSteal(buzzer, playerId, now) {
  if (!buzzer || buzzer.revealed) return false;
  if (buzzer.playerId === playerId) return false;
  if ((buzzer.stolenFrom || []).includes(playerId)) return false;
  return now - buzzer.timestamp >= STEAL_AFTER_MS;
}

// ═══════════════════════════════════════════════════════════════
// 📜 REGLAS OPCIONALES DE LA SALA
// ═══════════════════════════════════════════════════════════════
// Se eligen al crear la sala y viven en `rules`. Las salas sin el campo
// (creadas antes de que existieran) se comportan como siempre: todo apagado.
export function getRules(s) {
  const r = s?.rules || {};
  return {
    rebote:       r.rebote === true,        // si alguien falla, otro puede responder
    ganadorElige: r.ganadorElige === true,  // el que acierta elige la próxima
    finalApuesta: r.finalApuesta === true,  // ronda final con apuesta secreta
  };
}

// ── Elige el que acertó ────────────────────────────────────────
// Índice del próximo selector. Con `ganadorElige`, si la pregunta se respondió
// bien elige el que acertó; si nadie acertó, rotación normal.
export function nextSelectorIndex(s) {
  const order = s.playerOrder || [];
  if (!order.length) return 0;
  const rotacion = ((s.selectorIndex || 0) + 1) % order.length;
  if (!getRules(s).ganadorElige) return rotacion;
  const r = s.questionResult;
  if (!r?.correct) return rotacion;
  const idx = order.indexOf(r.responderId);
  return idx >= 0 ? idx : rotacion;
}

// ── Rebote ─────────────────────────────────────────────────────
// Quién ya no puede responder esta pregunta: los que fallaron y los que
// vieron la respuesta (el host que la juzgó).
export function blockedFromQuestion(question) {
  return [...new Set([...(question?.failed || []), ...(question?.sawAnswer || [])])];
}

export function canAttempt(question, playerId) {
  return !blockedFromQuestion(question).includes(playerId);
}

// Jugadores conectados que todavía podrían responder en un rebote, si
// `responderId` falla ahora y `hostId` es quien vio la respuesta para juzgar.
export function reboundCandidates(s, responderId, hostId) {
  const q = s.currentQuestion || {};
  const blocked = new Set([...blockedFromQuestion(q), responderId, hostId]);
  return (s.playerOrder || []).filter(pid =>
    !blocked.has(pid) && s.players?.[pid] && s.players[pid].connected !== false
  );
}

// ── Ronda final con apuesta ────────────────────────────────────
// El que va en cero o negativo igual puede apostar hasta este piso.
export const FINAL_MIN_WAGER_CAP = 500;

export function maxWager(score) {
  return Math.max(score || 0, FINAL_MIN_WAGER_CAP);
}

export function clampWager(raw, score) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(maxWager(score), n));
}

// Pregunta de la ronda final: la celda sin jugar de mayor valor del tablero;
// si el tablero se completó, la de 1000 de una categoría que no estaba en juego.
export function pickFinalQuestion(board, categories, pool, rng = Math.random) {
  const cats = categories || [];
  for (const value of [1000, 800, 600, 400, 200]) {
    const libres = cats.filter(cat => board?.[cat]?.[String(value)] !== true && getQuestion(cat, value));
    if (libres.length) return { category: libres[Math.floor(rng() * libres.length)], value };
  }
  const fuera = (pool || []).filter(cat => !cats.includes(cat) && getQuestion(cat, 1000));
  if (fuera.length) return { category: fuera[Math.floor(rng() * fuera.length)], value: 1000 };
  return null;
}

// Cambio de puntaje de cada jugador: +apuesta si el host lo marcó correcto,
// −apuesta si no. Sin apuesta (o apuesta 0) no cambia nada.
export function finalDeltas(order, wagers, verdicts) {
  const deltas = {};
  (order || []).forEach(pid => {
    const w = wagers?.[pid] || 0;
    if (!w) return;
    deltas[pid] = verdicts?.[pid] === true ? w : -w;
  });
  return deltas;
}

// ═══════════════════════════════════════════════════════════════
// 🏅 PREMIOS DEL PODIO
// ═══════════════════════════════════════════════════════════════
// stats[pid] = { buzzes, steals, stolen, correct, wrong, lost, streak, bestStreak }
// Devuelve [{ icono, titulo, ganadores: [pid], detalle }] solo con los premios
// que alguien se ganó. En empate se listan todos.
const AWARDS = [
  { campo: "buzzes",     min: 1, icono: "⚡", titulo: "Dedo más rápido",   detalle: n => `${n} ${n === 1 ? "pulsada" : "pulsadas"}` },
  { campo: "bestStreak", min: 2, icono: "🔥", titulo: "Mejor racha",       detalle: n => `${n} seguidas` },
  { campo: "steals",     min: 1, icono: "🖐", titulo: "El ladrón",         detalle: n => `${n} ${n === 1 ? "robo" : "robos"}` },
  { campo: "lost",       min: 1, icono: "💸", titulo: "El que más perdió", detalle: n => `−${n} pts` },
];

export function computeAwards(stats, order) {
  const out = [];
  AWARDS.forEach(({ campo, min, icono, titulo, detalle }) => {
    let best = 0;
    (order || []).forEach(pid => { best = Math.max(best, stats?.[pid]?.[campo] || 0); });
    if (best < min) return;
    const ganadores = order.filter(pid => (stats?.[pid]?.[campo] || 0) === best);
    out.push({ icono, titulo, ganadores, detalle: detalle(best) });
  });
  return out;
}

// Mejor racha del jugador si acierta ahora (para guardar en stats).
export function nextBestStreak(stats, playerId) {
  const st = stats?.[playerId] || {};
  return Math.max(st.bestStreak || 0, (st.streak || 0) + 1);
}
