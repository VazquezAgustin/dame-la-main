// ═══════════════════════════════════════════════════════════════
// 🔀 MEZCLA — Fisher-Yates (sin dependencias)
// ═══════════════════════════════════════════════════════════════
// `sort(() => Math.random() - 0.5)` NO mezcla parejo (depende del algoritmo
// de sort del navegador). Esta es la única mezcla del proyecto.
// Devuelve una copia; rng es inyectable para poder testear.
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
