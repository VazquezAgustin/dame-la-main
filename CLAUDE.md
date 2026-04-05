# Dame la Pasta — Web Game

## Resumen del proyecto

Réplica web del concurso "Dame la Pasta" de Ibai Llanos. Juego de trivia multijugador en tiempo real con sistema de pulsador (buzzer). Los jugadores se unen con un código de sala, eligen categorías por turnos desde un tablero (6 columnas × 5 filas), y compiten pulsando un botón para responder primero. El host decide si la respuesta es correcta. Todo sincronizado en tiempo real via Firebase.

---

## Stack técnico

- **HTML + CSS + JS puro** — sin frameworks, sin build steps. El HTML está en `index.html`, los estilos en `styles.css`, y la lógica separada en módulos ES6 en `js/`
- **Firebase Realtime Database** — backend gratuito para sincronización en tiempo real vía WebSockets (reemplazable via DAO)
- **Firebase SDK** — cargado desde CDN como módulo ES6
- **GitHub Pages** — repositorio `dame-la-pasta`, Pages habilitado desde rama `main`

---

## Estructura del proyecto

```
dame-la-pasta/
├── index.html                    ← estructura HTML y pantallas
├── styles.css                    ← estilos globales
├── js/
│   ├── firebase.config.example.js  ← plantilla de credenciales (versionada)
│   ├── firebase.config.js          ← credenciales reales (en .gitignore)
│   ├── firebase.js                 ← DAO + implementación Firebase
│   ├── juego.js                    ← lógica del juego, render y handlers
│   └── preguntas.js                ← pool de categorías y banco de preguntas
└── README.md
```

---

## Firebase — configuración

### Setup inicial

1. Crear proyecto en [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Realtime Database → Crear base de datos** → modo test
3. **Configuración del proyecto → Agregar app → Web** → copiar `firebaseConfig`

### Credenciales en el código

Las credenciales viven en `js/firebase.config.js` (excluido del repo vía `.gitignore`). Copiar `js/firebase.config.example.js` como `js/firebase.config.js` y completar los valores:

```javascript
// js/firebase.config.js
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx",
};
```

### Reglas de seguridad

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".validate": "now - data.child('createdAt').val() < 86400000"
      }
    }
  }
}
```

### Import del SDK

```javascript
// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  runTransaction,
  serverTimestamp,
  onDisconnect,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
```

`serverTimestamp()` se usa en todos los campos `openedAt` para sincronizar los timers con el reloj del servidor en lugar del reloj local del cliente. `onDisconnect` se usa para marcar automáticamente `connected: false` cuando un jugador pierde la conexión.

---

## Sistema de salas — solo por código

**No hay listado de salas.** Para unirse hay que conocer el código. Esto elimina la necesidad de contraseñas.

```javascript
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,O,1,I (ambiguos)
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code; // ej: "K7XP2M"
}
```

### Flujo de sala

1. **Crear sala**: el host genera el código → aparece en pantalla grande para compartir
2. **Unirse**: los jugadores ingresan el código y su nombre → si la sala existe y está en lobby, entran
3. **Lobby**: todos ven quién se va uniendo en tiempo real
4. **Solo el host puede iniciar** la partida (botón "¡Empezar!" solo visible para el host)
5. **En juego**: sincronización total
6. **Fin**: pantalla de resultados para todos

---

## Roles

### Host (creador de la sala)

El primer jugador que crea la sala es el **host**. Su `playerId` se guarda en `rooms/{roomCode}/hostId`. El host:

- Es el único que puede **iniciar** la partida desde el lobby
- Ve un botón especial **"✓ Correcto" / "✗ Incorrecto"** después de que el respondedor dice su respuesta (los demás no lo ven)
- Puede **saltear una pregunta** si nadie responde o si hay algún problema
- También es un jugador normal que puede buzzear y ganar puntos

### Jugadores

- Toman turnos para **seleccionar la categoría** del tablero (rotación secuencial)
- Todos pueden **buzzear** en cualquier pregunta, incluyendo el selector de turno
- El que buzzea dice su respuesta en voz alta y toca "Mostrar respuesta"

---

## Identidad del jugador (sin autenticación)

```javascript
let myPlayerId = sessionStorage.getItem("playerId");
if (!myPlayerId) {
  myPlayerId = "p_" + Date.now().toString(36); // ej: "p_lk3j2h"
  sessionStorage.setItem("playerId", myPlayerId);
}

// Al unirse, guardar también si es host
const isHost = myPlayerId === state.hostId;
```

---

## Tablero — 6 categorías × 5 valores

El tablero tiene **6 columnas** (categorías) y **5 filas** de puntos: **200, 400, 600, 800, 1000**.

A mayor valor, mayor dificultad de la pregunta.

### Pool de categorías

Al crear la sala, se seleccionan **6 categorías al azar** del pool. El pool debe tener al menos **12 categorías** para garantizar variedad. Se guardan las 6 elegidas en Firebase (`rooms/{roomCode}/categories`) para que todos los clientes muestren el mismo tablero.

```javascript
// Pool de categorías disponibles (mínimo 12)
const CATEGORY_POOL = [
  "Trota Mundos", // geografía mundial
  "Historia Pura", // historia general
  "El Copión", // preguntas de cultura pop / series / cine
  "Bajo Presión", // preguntas con doble trampa
  "Cultura Musical", // música en español e internacional
  "El Fan de la Velada", // Ibai, Twitch, streaming en español
  "Pies de Plomo", // fútbol
  "Mente Maestra", // ciencia y tecnología
  "La Gran Pantalla", // películas y series
  "Tierra y Mar", // naturaleza y geografía física
  "Costumbres del Mundo", // cultura y tradiciones
  "De Aquí y de Allá", // España y Argentina específicamente
  "En Boca de Todos", // personajes famosos
  "Números que Hablan", // estadísticas y récords deportivos
];

function pickRandomCategories(pool, count = 6) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

### Banco de preguntas

Las preguntas **no se guardan en Firebase**, viven en el JS local de cada cliente. Se identifican por `{ category, value }`.

```javascript
/* 📝 EDITA AQUÍ LAS PREGUNTAS */
const QUESTIONS = {
  "Trota Mundos": [
    {
      value: 200,
      question: "¿Cuál es la capital de Australia?",
      answer: "Canberra",
    },
    {
      value: 400,
      question: "¿En qué país está el río Amazonas?",
      answer: "Brasil (aunque pasa por Perú y Colombia)",
    },
    { value: 600, question: "¿Cuántos países tiene África?", answer: "54" },
    {
      value: 800,
      question: "¿Cuál es el país más grande del mundo?",
      answer: "Rusia",
    },
    {
      value: 1000,
      question:
        "¿Cuál es la ciudad más austral del mundo habitada permanentemente?",
      answer: "Puerto Williams, Chile",
    },
  ],
  // ... una entrada por cada categoría del CATEGORY_POOL
};
```

**Notas sobre el banco de preguntas:**

- Cada categoría del pool debe tener exactamente **5 preguntas**, una por valor (200 a 1000)
- Las preguntas son de **respuesta abierta** (no múltiple choice) — el jugador responde en voz alta
- Solo se guarda el `answer` para mostrarlo cuando el respondedor hace clic en "Mostrar respuesta"
- El host evalúa si la respuesta es correcta basándose en el `answer` visible para todos tras revelar

### Público objetivo

España y Argentina. Las preguntas deben mencionar: La Liga y Liga Argentina, selecciones nacionales, artistas en español (reggaeton, flamenco, rock argentino), historia de ambos países, figuras del streaming en español (Ibai Llanos, etc.).

---

## Estructura de datos en Firebase

```javascript
{
  "rooms": {
    "K7XP2M": {
      "createdAt": 1712000000000,
      "hostId": "p_lk3j2h",
      "status": "lobby",           // "lobby" | "playing" | "finished"

      // Categorías elegidas al azar al crear la sala (6 elementos)
      "categories": ["Trota Mundos", "Cultura Musical", "Pies de Plomo",
                     "El Copión", "Mente Maestra", "De Aquí y de Allá"],

      // Jugadores: clave = playerId
      "players": {
        "p_lk3j2h": { "name": "Agustín", "score": 0,   "connected": true },
        "p_abc123":  { "name": "Marcos",  "score": 400, "connected": true },
        "p_xyz789":  { "name": "Sofía",   "score": 200, "connected": true }
      },

      // Orden de turnos para SELECCIONAR categoría (orden de llegada)
      "playerOrder": ["p_lk3j2h", "p_abc123", "p_xyz789"],

      // Índice del jugador que elige categoría en este turno
      "selectorIndex": 0,

      // Celdas ya jugadas: board[categoria][valor] = true/false
      "board": {
        "Trota Mundos":    { "200": true, "400": false, "600": false, "800": false, "1000": false },
        "Cultura Musical": { "200": false, "400": false, "600": false, "800": false, "1000": false }
        // ... una entrada por categoría activa
      },

      // Pregunta activa (null = estamos en el tablero)
      "currentQuestion": {
        "category": "Trota Mundos",
        "value": 200,
        "openedAt": 1712000030000   // timestamp para buzzer timeout
      },

      // Buzzer: quién tocó primero (null = nadie todavía)
      "buzzer": {
        "playerId": "p_abc123",
        "timestamp": 1712000031500
      },

      // Estado de la respuesta
      // "waiting_buzz"   → pregunta abierta, esperando que alguien buzzee
      // "waiting_answer" → alguien buzzeó, esperando que diga su respuesta
      // "answer_revealed"→ se mostró la respuesta, host decide
      // "judged"         → host decidió, mostrando resultado
      "questionPhase": "waiting_buzz",

      // Resultado de la pregunta (null mientras no se juzgó)
      "questionResult": {
        "responderId": "p_abc123",
        "correct": true,
        "pointsDelta": 200
      }
    }
  }
}
```

---

## Mecánicas del juego — flujo detallado

### 1. Selección de categoría (turno rotativo)

- Solo el jugador en `playerOrder[selectorIndex]` puede **tocar el tablero**
- Los demás ven el tablero pero no pueden hacer clic (cursor `not-allowed`, opacidad reducida)
- El selector elige una celda (categoría + valor) → esto escribe en `currentQuestion` y pone `questionPhase: "waiting_buzz"`
- El turno de **selección** rota al siguiente jugador DESPUÉS de que la pregunta se resuelva completamente

### 2. Buzzer — todos compiten

Cuando `questionPhase === "waiting_buzz"`:

- **Todos los jugadores** (incluyendo el selector) ven un botón GRANDE de pulsador en la parte inferior de la pantalla
- El botón dice "🔔 ¡PULSA!" con animación palpitante
- El primero en tocar escribe en `buzzer` usando una **transacción Firebase** para evitar condición de carrera:

```javascript
async function pressBuzzer() {
  const buzzerRef = ref(db, `rooms/${roomCode}/buzzer`);

  await runTransaction(buzzerRef, (currentValue) => {
    if (currentValue !== null) return; // ya buzzeó alguien, abortar
    return { playerId: myPlayerId, timestamp: Date.now() };
  });

  // Si la transacción tuvo éxito, también actualizar la fase
  // (solo el ganador de la transacción llegará acá porque runTransaction
  //  llama al callback repetidamente hasta que no hay conflicto)
  await update(ref(db, `rooms/${roomCode}`), {
    questionPhase: "waiting_answer",
  });
}
```

- Cuando `buzzer` se actualiza en Firebase, todos los clientes re-renderizan: destacar al jugador que buzzeó, deshabilitar el botón para los demás
- El que buzzeó ve el mensaje: **"¡Dijiste que sabés! Decí tu respuesta en voz alta y tocá 'Mostrar respuesta'"**

### 3. El respondedor dice su respuesta

- Solo el jugador que buzzeó (`buzzer.playerId`) ve el botón **"👁 Mostrar respuesta"**
- Al tocarlo: se actualiza `questionPhase: "answer_revealed"` → todos los dispositivos muestran la respuesta correcta
- No hay timer estricto para esta fase (el jugador ya dijo su respuesta en voz alta)

### 4. El host juzga

- Cuando `questionPhase === "answer_revealed"`, **solo el host** ve dos botones:
  - **✓ Correcto** — suma los puntos al respondedor
  - **✗ Incorrecto** — se resta el valor de la pregunta al puntaje del respondedor (igual que en el juego original)
- El host toca uno → escribe `questionResult` y `questionPhase: "judged"`
- Todos los dispositivos muestran el resultado: quién respondió, si fue correcto, y los puntos

### 5. Timeout del buzzer

Si nadie buzzea en **45 segundos** (calculado desde `currentQuestion.openedAt`):

- El host ve un botón adicional: **"⏭ Nadie respondió — siguiente"**
- Alternativamente, el cliente del host auto-detecta el timeout y puede avanzar
- La pregunta se marca como jugada (`board[cat][val] = true`) pero nadie gana puntos

### 6. Avanzar al siguiente turno

Solo el host puede tocar **"Siguiente"** después de que se muestra el resultado. Esto:

- Limpia `currentQuestion`, `buzzer`, `questionPhase`, `questionResult`
- Avanza `selectorIndex` al siguiente jugador (con módulo)
- Verifica si el tablero está completo → cambia `status: "finished"` si corresponde

```javascript
async function nextTurn() {
  const nextSelector = (state.selectorIndex + 1) % state.playerOrder.length;
  const finished = isBoardComplete(state.board, state.categories);

  await update(ref(db, `rooms/${roomCode}`), {
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
    selectorIndex: nextSelector,
    status: finished ? "finished" : "playing",
  });
}
```

---

## Marcador — barra sticky inferior colapsable

El marcador siempre es visible en la parte inferior de la pantalla como una **barra compacta sticky**. No ocupa espacio del contenido principal y se puede expandir con un toque.

### Estado colapsado (siempre visible)

```
┌──────────────────────────────────────────────────────┐
│  🏆 Agustín 800  •  Marcos 400  •  Sofía 200    ▲   │
└──────────────────────────────────────────────────────┘
```

- Altura fija de ~44px
- Muestra todos los jugadores con nombre abreviado (máx 8 chars) y puntaje
- El jugador activo (selector de turno) tiene su nombre en **dorado**
- El propio jugador tiene un punto `•` o subrayado para identificarse
- Flecha `▲` para expandir

### Estado expandido (overlay desde abajo)

Al tocar la barra, sube un panel (animación slide-up) con:

- Ranking completo: posición, avatar inicial, nombre completo, puntaje
- El jugador que buzzeó o está en turno se resalta
- Botón `▼` para cerrar

```
┌──────────────────────────────────────────────────┐
│          MARCADOR            ▼                   │
│                                                  │
│  🥇  A   Agustín            800 pts             │
│  🥈  M   Marcos             400 pts  ← Tú       │
│  🥉  S   Sofía              200 pts             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Implementación

```css
.scorebar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: rgba(10, 10, 26, 0.95);
  border-top: 1px solid #7c3aed;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 100;
  cursor: pointer;
  transition: height 0.3s ease;
}

.scorebar.expanded {
  height: 240px;
  align-items: flex-start;
  padding-top: 12px;
}
```

El contenido cambia entre vista compacta y expandida con JS al hacer clic en la barra.

---

## Pantallas del juego

### 1. Pantalla de inicio

- Título grande: **"DAME LA PASTA"** con animación de entrada
- Dos opciones principales:
  - **"Crear sala"** → input de nombre → genera código → va al lobby como host
  - **"Unirse"** → input de código (6 chars, auto-mayúsculas) + input de nombre → valida que la sala existe y está en lobby → entra
- Si la sala no existe o ya está en curso: mensaje de error claro

### 2. Lobby

- Código de sala enorme, centrado, con botón **"📋 Copiar"**
- Lista de jugadores que se van uniendo (slide-in en tiempo real)
- Etiqueta **"HOST"** junto al nombre del creador
- Solo el host ve el botón **"¡Empezar partida!"** (habilitado si hay ≥ 1 jugador)
- Los demás ven: **"Esperando que el host inicie..."**

### 3. Tablero

- Grilla **6 columnas × 6 filas** (1 header de categoría + 5 filas de valores)
- Header de categoría en la parte superior de cada columna con nombre abreviado
- Valores 200 / 400 / 600 / 800 / 1000 en dorado, fuente grande (Bebas Neue)
- Celdas ya jugadas: fondo oscuro, sin texto, no clickeables
- Indicador de turno arriba del tablero: **"Turno de Agustín para elegir"** o **"Tu turno — elegí una categoría"**
- Celdas solo clickeables para el selector actual

### 4. Pregunta abierta — fase buzzer

- Fondo oscuro cubre el tablero
- Header con categoría y valor: **"TROTA MUNDOS — 400 PTS"**
- Texto de la pregunta en grande y centrado
- Timer visual opcional (barra que se reduce en 45s) para presionar al resto
- **Botón ENORME de pulsador** en la parte inferior:
  - Color violeta brillante, animación palpitante (pulse animation)
  - Texto: **"🔔 ¡PULSA!"**
  - Al buzzear: se deshabilita para todos, destaca al ganador
- Si ya buzzeó alguien: mostrar **"¡[Nombre] buzzeó primero!"** con efecto de luz
- El que buzzeó ve: **"¡Sos el primero! Decí tu respuesta en voz alta"** + botón **"👁 Mostrar respuesta"**

### 5. Pregunta — respuesta revelada

- Se muestra la respuesta correcta en grande para todos
- El host ve: **"✓ Correcto (+400)"** y **"✗ Incorrecto"** (botones grandes)
- Los demás ven: **"Esperando que el host decida..."**

### 6. Resultado

- Flash verde (correcto) o rojo (incorrecto) en toda la pantalla
- Animación de puntos sumándose al marcador del respondedor
- **Solo el host** ve el botón **"Siguiente ▶"**
- Los demás ven: **"Esperando al host..."**

### 7. Pantalla final

- Confetti CSS animado
- Ranking de jugadores con puntajes finales, destacando al ganador
- Botón **"Jugar de nuevo"** (solo host) — reinicia sin cerrar la sala

---

## DAO — Capa de abstracción de datos

Todo acceso a la base de datos pasa por un objeto `GameDAO`. La lógica del juego **nunca llama directamente** a Firebase (ni a Supabase, ni a PartyKit). Si en el futuro se cambia el backend, solo se reescribe el `GameDAO` y el resto del código no se toca.

### Interfaz del DAO (contrato)

```javascript
// 🗄️ INTERFAZ DEL DAO — esta forma nunca cambia, solo cambia la implementación
const GameDAO = {
  // ── Sala ──────────────────────────────────────────────────────────

  // Crea una sala nueva. Devuelve el roomCode.
  createRoom: async (roomCode, initialState) => {},

  // Valida que una sala existe y está en lobby. Devuelve true/false.
  roomExists: async (roomCode) => {},

  // Agrega un jugador a una sala existente.
  joinRoom: async (roomCode, playerId, playerData) => {},

  // ── Lobby ─────────────────────────────────────────────────────────

  // El host inicia la partida.
  startGame: async (roomCode) => {},

  // ── Juego ─────────────────────────────────────────────────────────

  // El selector elige una celda del tablero.
  selectQuestion: async (roomCode, category, value) => {},

  // Un jugador toca el pulsador. Devuelve true si ganó la carrera, false si ya había alguien.
  pressBuzzer: async (roomCode, playerId) => {},

  // El respondedor revela la respuesta (todos la ven).
  revealAnswer: async (roomCode) => {},

  // El host juzga la respuesta.
  // category y value se pasan desde el estado local para evitar un get() extra.
  judgeAnswer: async (roomCode, responderId, correct, pointsDelta, category, value) => {},

  // El host avanza al siguiente turno.
  nextTurn: async (roomCode, nextSelectorIndex, isGameOver) => {},

  // El host saltea una pregunta sin respuesta.
  skipQuestion: async (roomCode, nextSelectorIndex) => {},

  // ── Presencia y host ──────────────────────────────────────────────

  // Registra presencia del jugador: Firebase marcará connected=false automáticamente
  // cuando el cliente pierda la conexión (usando onDisconnect).
  setupPresence: async (roomCode, playerId) => {},

  // Transfiere el rol de host a newHostId, solo si el hostId actual es currentHostId.
  // Usa transacción para evitar condición de carrera entre clientes.
  migrateHost: async (roomCode, currentHostId, newHostId) => {},

  // ── Tiempo real ───────────────────────────────────────────────────

  // Suscribe a cambios de la sala. Llama a `callback(gameState)` cada vez que cambia algo.
  // Devuelve una función para cancelar la suscripción.
  subscribe: (roomCode, callback) => {
    return () => {};
  },
};
```

### Implementación con Firebase (por defecto)

```javascript
// 🔥 IMPLEMENTACIÓN FIREBASE — reemplazar este bloque para cambiar de backend
// El resto del código del juego NO se modifica al cambiar de backend.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomRef = (code) => ref(db, `rooms/${code}`);

GameDAO.createRoom = async (roomCode, initialState) => {
  await set(roomRef(roomCode), initialState);
  return roomCode;
};

GameDAO.roomExists = async (roomCode) => {
  const snap = await get(roomRef(roomCode));
  return snap.exists() && snap.val().status === "lobby";
};

GameDAO.joinRoom = async (roomCode, playerId, playerData) => {
  const snap = await get(ref(db, `rooms/${roomCode}/playerOrder`));
  const order = snap.val() || [];
  await update(roomRef(roomCode), {
    [`players/${playerId}`]: playerData,
    playerOrder: [...order, playerId],
  });
};

GameDAO.startGame = async (roomCode) => {
  await update(roomRef(roomCode), { status: "playing" });
};

GameDAO.selectQuestion = async (roomCode, category, value) => {
  await update(roomRef(roomCode), {
    currentQuestion: { category, value, openedAt: serverTimestamp() }, // timestamp del servidor
    buzzer: null,
    questionPhase: "waiting_buzz",
    questionResult: null,
  });
};

GameDAO.pressBuzzer = async (roomCode, playerId) => {
  let won = false;
  await runTransaction(ref(db, `rooms/${roomCode}/buzzer`), (current) => {
    if (current !== null) return; // alguien ya buzzeó, abortar
    won = true;
    return { playerId, timestamp: Date.now() };
  });
  if (won) {
    try {
      await update(roomRef(roomCode), { questionPhase: "waiting_answer" });
    } catch (e) {
      // Si el update de fase falla, revertir el buzzer para no dejar el juego trabado
      try { await set(ref(db, `rooms/${roomCode}/buzzer`), null); } catch (_) {}
      throw e;
    }
  }
  return won;
};

GameDAO.revealAnswer = async (roomCode) => {
  await update(roomRef(roomCode), { questionPhase: "answer_revealed" });
};

// category y value vienen del estado local del caller — sin get() extra.
GameDAO.judgeAnswer = async (roomCode, responderId, correct, pointsDelta, category, value) => {
  const snap = await get(ref(db, `rooms/${roomCode}/players/${responderId}/score`));
  const currentScore = snap.val() || 0;
  await update(roomRef(roomCode), {
    [`players/${responderId}/score`]: currentScore + pointsDelta,
    [`board/${category}/${value}`]: true,
    questionResult: { responderId, correct, pointsDelta },
    questionPhase: "judged",
  });
};

GameDAO.nextTurn = async (roomCode, nextSelectorIndex, isGameOver) => {
  await update(roomRef(roomCode), {
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
    selectorIndex: nextSelectorIndex,
    status: isGameOver ? "finished" : "playing",
  });
};

GameDAO.skipQuestion = async (roomCode, nextSelectorIndex) => {
  const snap = await get(ref(db, `rooms/${roomCode}/currentQuestion`));
  const q = snap.val();
  await update(roomRef(roomCode), {
    [`board/${q.category}/${q.value}`]: true,
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
    selectorIndex: nextSelectorIndex,
  });
};

// Registra presencia: Firebase ejecuta el set(false) automáticamente al desconectarse.
GameDAO.setupPresence = async (roomCode, playerId) => {
  const presenceRef = ref(db, `rooms/${roomCode}/players/${playerId}/connected`);
  await onDisconnect(presenceRef).set(false);
  await set(presenceRef, true);
};

// Migra el host solo si hostId sigue siendo currentHostId (evita doble migración).
GameDAO.migrateHost = async (roomCode, currentHostId, newHostId) => {
  await runTransaction(ref(db, `rooms/${roomCode}/hostId`), (hostId) => {
    if (hostId !== currentHostId) return; // ya fue migrado
    return newHostId;
  });
};

GameDAO.subscribe = (roomCode, callback) => {
  const unsubscribe = onValue(roomRef(roomCode), (snap) => {
    callback(snap.val());
  });
  return unsubscribe;
};
```

### Cómo migrar a otro backend

Para cambiar de Firebase a Supabase, PartyKit u otro servicio, solo hay que:

1. Borrar o comentar el bloque **"IMPLEMENTACIÓN FIREBASE"**
2. Escribir un nuevo bloque que implemente las mismas funciones de `GameDAO`
3. El resto del código del juego (lógica, UI, animaciones) no cambia

**Ejemplo: implementación con Supabase Realtime**

```javascript
// 🟢 IMPLEMENTACIÓN SUPABASE — reemplaza el bloque Firebase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient("https://xxx.supabase.co", "public-anon-key");

GameDAO.createRoom = async (roomCode, initialState) => {
  await supabase.from("rooms").insert({ code: roomCode, state: initialState });
  return roomCode;
};

GameDAO.subscribe = (roomCode, callback) => {
  const channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `code=eq.${roomCode}`,
      },
      (payload) => callback(payload.new.state),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// ... resto de métodos adaptados a la API de Supabase
```

### Uso del DAO en la lógica del juego

```javascript
// ✅ ASÍ se usa el DAO en el código del juego — nunca Firebase directo

// Iniciar la app
const unsub = GameDAO.subscribe(roomCode, (gameState) => {
  if (!gameState) return showError("Sala no encontrada");
  state = gameState;
  render(state);
});

// Al salir de la sala
window.addEventListener("beforeunload", () => unsub());

// Acciones del jugador
await GameDAO.selectQuestion(roomCode, "Trota Mundos", 400);
const ganeBuzzer = await GameDAO.pressBuzzer(roomCode, myPlayerId);
await GameDAO.revealAnswer(roomCode);
await GameDAO.judgeAnswer(roomCode, responderId, true, 400);
await GameDAO.nextTurn(roomCode, nextIndex, false);
```

---

## Sincronización — listener único

```javascript
onValue(ref(db, `rooms/${roomCode}`), (snapshot) => {
  const s = snapshot.val();
  if (!s) return showError("Sala no encontrada");

  state = s;
  isHost = myPlayerId === s.hostId;

  switch (s.status) {
    case "lobby":
      renderLobby(s);
      break;
    case "playing":
      renderPlaying(s);
      break;
    case "finished":
      renderFinished(s);
      break;
  }
});

function renderPlaying(s) {
  updateScorebar(s); // siempre actualizar marcador

  if (!s.currentQuestion) {
    renderBoard(s); // mostrar tablero
  } else {
    renderQuestion(s); // mostrar pregunta + buzzer/respuesta/resultado
  }
}
```

**Regla de oro:** ningún cliente modifica estado local. Todo pasa por Firebase → listener → render.

---

## Diseño visual

### Paleta de colores

```css
--fondo: #0a0a1a /* negro azulado */ --primario: #7c3aed /* violeta Ibai */
  --primario-glow: #a855f7 /* violeta claro para glow */ --acento: #f59e0b
  /* dorado para puntos */ --correcto: #10b981 /* verde */ --incorrecto: #ef4444
  /* rojo */ --buzzer: #7c3aed /* fondo del botón pulsador */
  --buzzer-active: #5b21b6 /* pulsado */ --celda-normal: #1e1b4b
  --celda-hover: #312e81 --celda-jugada: #0f0f1a /* celda ya respondida */
  --texto: #f8fafc --texto-secundario: #94a3b8;
```

### Tipografía

- `Bebas Neue` — títulos, valores de puntos, nombre del juego
- `Inter` o `system-ui` — texto de preguntas, nombres, UI general

### Animaciones clave

```css
/* Pulsador palpitante */
@keyframes pulse-buzzer {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(124, 58, 237, 0);
    transform: scale(1.03);
  }
}

/* Flash de resultado */
@keyframes flash-correct {
  0%,
  100% {
    background: transparent;
  }
  50% {
    background: rgba(16, 185, 129, 0.3);
  }
}

/* Slide-up del marcador */
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Jugador nuevo en lobby */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

- **Tablero**: celdas con `transition: transform 0.15s` para hover
- **Buzzer**: animación `pulse-buzzer` infinita mientras nadie pulsó
- **Resultado correcto**: `flash-correct` 1s
- **Resultado incorrecto**: `shake` horizontal 0.4s
- **Confetti final**: partículas con `@keyframes` aleatorias (colores y velocidades random generadas por JS)

---

## GitHub Pages — cómo hostear

1. Crear repo en GitHub llamado `dame-la-pasta`
2. Subir todos los archivos **excepto** `js/firebase.config.js`
3. Crear `js/firebase.config.js` directamente en el servidor con las credenciales reales
4. En GitHub: **Settings → Pages → Source: rama main → / (root)**
5. URL: `https://[usuario].github.io/dame-la-pasta/`

---

## Notas finales

- **Código comentado en español** con secciones claramente marcadas
- **Responsivo mobile-first**: el botón de buzzer tiene al menos 80px de alto para ser fácil de tocar
- El tablero en mobile usa `overflow-x: auto` con las 6 columnas mostrándose en scroll horizontal
- Si Firebase no está configurado, mostrar error claro: `"Falta configurar Firebase. Ver README."`
- `sessionStorage` solo para `playerId`, `roomCode` y `myName` — nada más persiste entre páginas
- Las categorías del pool deben tener preguntas bien redactadas con respuestas cortas y verificables para facilitar el juicio del host
- **No duplicar preguntas** entre `QUESTIONS` y `LIGHTNING_QUESTIONS` — ambas pueden aparecer en la misma partida

## Comportamientos técnicos clave (juego.js)

- **Dirty-check de renders**: `renderBoard` y `updateScorebar` comparan una key JSON del estado relevante antes de reconstruir el DOM. Solo re-renderizan si algo cambió. `renderQuestion` y `renderLightning` limpian `_lastBoardKey` para forzar re-render al volver al tablero.
- **Presencia**: `GameDAO.setupPresence()` se llama al entrar a una sala. Firebase marca automáticamente `connected: false` cuando el cliente pierde conexión.
- **Migración de host**: `checkHostMigration()` se ejecuta en cada ciclo de `render()`. Si detecta `players[hostId].connected === false`, todos los clientes intentan migrar el host via transacción. El guard `_hostMigrating` evita llamadas repetidas desde el mismo cliente.
- **Timers sincronizados**: `openedAt` se guarda con `serverTimestamp()` en lugar de `Date.now()` del cliente. Todos los clientes calculan el tiempo transcurrido contra el mismo origen.
- **Rollback del buzzer**: si `pressBuzzer` gana la transacción pero falla el update de `questionPhase`, revierte el buzzer a `null` para que el juego pueda continuar.
- **Error recovery en handlers**: todos los handlers de acción (`handleBuzzer`, `handleRevelar`, `handleCorrecto`, `handleIncorrecto`, `handleSiguiente`, `handleSkip`) tienen try/catch que re-habilita los botones si Firebase falla.
