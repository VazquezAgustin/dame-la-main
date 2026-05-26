# Pending Bugs

## 1. Host es echado al terminar la partida

**Descripción:** Cuando la partida finaliza (status: "finished"), el host es redirigido a la pantalla principal en lugar de quedarse en la pantalla de resultados con la opción de reiniciar.

**Comportamiento esperado:** El host debería ver la pantalla final con el ranking y el botón "Jugar de nuevo" que reinicia la sala sin cerrarla. Los demás jugadores esperan en la misma pantalla.

**Comportamiento actual:** El host es forzado a la pantalla de inicio y debe crear una sala nueva, perdiendo el contexto de la partida anterior.

**Archivos a revisar:** `js/juego.js` — función `renderFinished` y el handler del botón "Jugar de nuevo".

---

## 2. Agregar preguntas más difíciles a "En Boca de Todos"

**Descripción:** La categoría "En Boca de Todos" (personajes famosos) tiene preguntas de dificultad insuficiente, especialmente en los valores altos (600–1000). Hay que agregar preguntas más desafiantes a las ya existentes, no reemplazarlas.

**Acción:** Agregar más famosos difíciles al array `FAMOSOS` en `js/games/quien-es-main/famosos.js`. No reemplazar los actuales, sino sumar nombres menos obvios (figuras históricas, actores secundarios, deportistas de nicho, etc.) para que las rondas avanzadas sean más desafiantes.
