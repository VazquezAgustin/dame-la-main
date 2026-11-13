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
- [ ] Al tocar la cobertura aparece **"¡Dá vuelta el celular!"** con cuenta 3·2·1 (con tick y vibración en Android) y recién después se muestra el número.
- [ ] En iPhone (con barra de inicio) la barra del host no queda tapada por el marcador.

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


---

## 🔥 Firebase — cambios de la capa de datos

Lo siguiente está cubierto con tests y con una pasada en navegador contra el DAO
en memoria, pero **no se probó contra Firebase real**.

### Login anónimo y reglas (`database.rules.json`)
- [ ] Con el proveedor **Anónimo** habilitado, la consola del navegador no muestra el warning "Login anónimo no disponible".
- [ ] Con las reglas nuevas publicadas: crear sala, unirse desde otro dispositivo, jugar una pregunta completa y "Jugar de nuevo" funcionan.
- [ ] Recargar la página en medio de la partida reconecta (la suscripción espera al login).
- [ ] Expulsar a un jugador y pasar el host siguen funcionando con las reglas nuevas.
- [ ] Los otros modos (¿Quién es Main?, Pictionary, ¿Qué número soy?, ¿Qué tipo soy?) pasan una ronda completa con las reglas nuevas.

### Puntajes atómicos y unión a la sala
- [ ] Dos jugadores escanean el QR casi a la vez: los dos aparecen en el lobby y en el orden de turnos.
- [ ] Robo + juicio del host en la misma pregunta: los dos cambios de puntaje se reflejan.
- [ ] Marcar y desmarcar "adivinó" en ¿Qué número soy? / ¿Qué tipo soy? deja el puntaje como estaba.

---

## 📋 Trivia — reglas extra (multi-dispositivo)

### ↩️ Rebote
- [ ] Mientras el host juzga, los demás **no** ven la respuesta ("El host está verificando...").
- [ ] Tras un "Incorrecto", todos ven "¡Rebote! X falló"; el que falló y el host no tienen pulsador.
- [ ] Otro jugador pulsa, responde bien y suma; recién ahí todos ven la respuesta.
- [ ] Con host + 1 jugador no hay rebote (va directo al resultado).

### 🎲 Ronda final
- [ ] Al terminar el tablero aparece "RONDA FINAL" en todos los dispositivos (no el podio).
- [ ] Cada uno apuesta sin ver la apuesta de los demás; el máximo es su puntaje (o 500).
- [ ] El teclado del celular no tapa el campo de respuesta.
- [ ] La respuesta correcta aparece recién cuando el host revela; el host marca ✓/✗ y los demás ven los íconos en vivo.
- [ ] Los puntajes del marcador cambian al "Aplicar resultados" y el podio muestra los premios.

### 🗂️ No repetir entre partidas
- [ ] Crear dos salas seguidas desde el mismo dispositivo: las 6 categorías de la segunda son distintas.

---

## 📦 Service worker
- [ ] Tras abrir la app una vez con conexión, se puede abrir en modo avión (carga la pantalla de inicio).
- [ ] Después de un deploy, recargar con conexión trae la versión nueva (no queda pegada la vieja).
- [ ] En Android, "Agregar a pantalla de inicio" instala la app.
