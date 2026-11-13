// ═══════════════════════════════════════════════════════════════
// 🗂️ HISTORIAL LOCAL — qué ya se jugó en este dispositivo
// ═══════════════════════════════════════════════════════════════
// Vive en el localStorage del host para no repetir categorías ni preguntas
// entre partidas (aunque se cree una sala nueva). Una clave por temática,
// porque cada banco tiene sus propias categorías e índices.
import { ACTIVE_THEME } from "./theme.config.js";

const KEY = `historial.${ACTIVE_THEME}`;

function _read() {
  try {
    if (typeof localStorage === "undefined") return {};
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch (_) { return {}; }
}

// campo: "categories" | "lightning" | "estimacion"
export function getHistorial(campo) {
  const v = _read()[campo];
  return Array.isArray(v) ? v : [];
}

export function setHistorial(campo, lista) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify({ ..._read(), [campo]: lista }));
  } catch (_) {}
}

// Acumula lo recién usado. Cuando ya no quedan suficientes sin usar para otra
// tanda (`porTanda`), el historial se reinicia con lo de esta partida.
export function acumularUsados(previos, nuevos, totalPool, porTanda) {
  const todos = [...new Set([...previos, ...nuevos])];
  return totalPool - todos.length < porTanda ? [...nuevos] : todos;
}
