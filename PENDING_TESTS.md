# Pruebas manuales pendientes

Tests que requieren ejecución manual con Firebase configurado
(`js/firebase.config.js`) y que no cubre la suite automática.

---

## 🎨 Pictionary — verificación multi-pestaña

Abrir 2-3 pestañas con distinto `playerId` (cada pestaña tiene su propio
`localStorage`; usar ventanas de incógnito o perfiles distintos para forzar
IDs diferentes).

### Setup
- [ ] En "Crear sala" aparece la opción **🎨 Pictionary** en el selector de juegos.
- [ ] Al elegirla se muestran los controles: rondas por jugador, tiempo para dibujar y categoría (Mixto / Simples / Pelis y series).
- [ ] El resto de jugadores se une con el código y entra al lobby.
- [ ] El host inicia la partida → todos ven la pantalla "Comenzar ronda".

### Dibujo en tiempo real
- [ ] El host inicia la ronda → al dibujante le aparecen **3 palabras** para elegir; al resto, "X está eligiendo qué dibujar...".
- [ ] El dibujante elige una palabra y empieza a dibujar.
- [ ] **Los trazos aparecen en vivo** en las otras pestañas mientras dibuja.
- [ ] Los guessers ven la palabra **enmascarada** (`______`), nunca la real.
- [ ] El dibujante ve la palabra real en la barra superior.
- [ ] Cambiar de **color** funciona y se refleja en las otras pantallas.
- [ ] **Deshacer (↶)** quita el último trazo en todas las pantallas.
- [ ] **Borrar (🗑️)** limpia el canvas en todas las pantallas.
- [ ] Funciona con **dedo en móvil** (no scrollea la página al dibujar) y con mouse.

### Adivinanzas (chat)
- [ ] Un guesser escribe la palabra (probar **con y sin acentos / mayúsculas**) y acierta.
- [ ] Al acertar, el chat muestra "X ¡acertó!" **sin revelar la palabra**.
- [ ] El acertante deja de ver el input de adivinanza.
- [ ] Las adivinanzas **erradas** se muestran en el chat para todos.
- [ ] El **dibujante NO puede** adivinar (no ve el input).
- [ ] El **primero** en acertar suma más puntos que los siguientes (ver scorebar).
- [ ] El dibujante suma puntos por cada acertante.

### Fin de ronda y juego
- [ ] La ronda termina **por tiempo** (timer a 0) → muestra la palabra y quién acertó.
- [ ] La ronda termina **cuando todos adivinaron** (sin esperar el timer).
- [ ] El host avanza con "Siguiente turno" y **rota el dibujante**.
- [ ] Al completar todas las rondas → **pantalla final con podio** y puntajes correctos.
- [ ] "Jugar de nuevo" (host) reinicia la sala con puntajes en 0.

### Casos borde
- [ ] **Join a mitad de ronda**: una pestaña nueva entra mientras se dibuja y ve el **dibujo completo** al instante.
- [ ] Si el **dibujante se desconecta**, el host cierra la ronda (fallback).
- [ ] Reconexión: cerrar y reabrir una pestaña del mismo jugador mantiene su estado.

---

## 🔢 ¿Qué número soy? — verificación multi-pestaña

### Setup y reparto
- [ ] En "Crear sala" aparece la tarjeta **🔢 ¿Qué número soy?** y la sala se crea con `gameType: "numero-main"`.
- [ ] El host inicia → ve "Repartir números"; el resto, "Esperando que el host reparta...".
- [ ] Al repartir, cada pestaña ve la **cobertura**; al tocarla ve su número. Los números **no se repiten**.

### Visualización
- [ ] En un celular real en vertical el número se lee bien desde lejos y no hay scroll horizontal.
- [ ] El **subrayado** deja clara la orientación (probar 6, 9, 66, 69, 96, 99).
- [ ] La pantalla **no se apaga** mientras se muestra el número (Android Chrome / iOS Safari 16.4+).
- [ ] "🙈 Ocultar" vuelve a tapar el número.

### Host y puntos
- [ ] "✓ Alguien adivinó" abre la lista con todos y sus números (el del host aparece como "?").
- [ ] Marcar suma 300 / 200 / 100 según el orden y el jugador ve "¡Adivinaste!" con su número en verde.
- [ ] Tocar de nuevo a un jugador marcado pide confirmación y **desmarca** (resta los puntos).
- [ ] Cuando todos adivinaron, "Nueva ronda" late.
- [ ] "Nueva ronda" reparte números nuevos y vuelve a cubrir todas las pantallas.
- [ ] No hay indicador de turno de preguntas en ninguna pantalla.

### Casos borde
- [ ] Recargar la pestaña de un jugador mantiene su número (vuelve a pedir tocar la cobertura).
- [ ] Un jugador que se une a mitad de ronda ve "Esperá a la próxima ronda".
- [ ] Si se cierra la pestaña del host, el nuevo host ve la barra de controles.
- [ ] "Terminar" → podio → "Jugar de nuevo" vuelve al lobby con el mismo juego.

