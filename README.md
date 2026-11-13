# Dame la Main

Réplica web del concurso "Dame la Main" de Ibai Llanos. Juego de trivia multijugador en tiempo real con sistema de pulsador (buzzer). Los jugadores se unen con un código de sala, eligen categorías por turnos desde un tablero y compiten pulsando un botón para responder primero.

---

## Cómo jugar

1. El **host** abre la app y crea una sala — recibe un código de 6 letras
2. Los **jugadores** ingresan ese código y su nombre para unirse
3. El host inicia la partida
4. Por turnos, un jugador elige una celda del tablero (categoría + valor)
5. Todos pueden pulsar el buzzer para responder primero
6. El que pulsa dice su respuesta en voz alta y toca "Mostrar respuesta"
7. El host decide si fue correcto o no

### Reglas extra de la trivia

Al crear la sala se pueden prender o apagar:

- **↩️ Rebote** — si alguien responde mal, la pregunta se reabre para los demás. Mientras el host juzga, solo él ve la respuesta (por eso en el rebote el host no puede pulsar).
- **👑 Elige el que acierta** — quien responde bien elige la próxima pregunta; si nadie acierta, sigue la rotación.
- **🎲 Ronda final con apuesta** — al terminar, una última pregunta: cada uno apuesta en secreto hasta su puntaje y escribe su respuesta en el celular. Acertar suma lo apostado; fallar lo resta.

Al final, el podio reparte premios: dedo más rápido, mejor racha, el ladrón y el que más perdió.

### 🔢 ¿Qué número soy?

Al crear la sala se puede elegir este juego en lugar del tablero.

1. El host toca **Repartir números**: cada jugador recibe un número del 1 al 99 (sin repetir dentro de la ronda)
2. Cada uno toca la pantalla de cobertura para mostrar su número **sin mirarlo** y gira el celular hacia los demás
3. Los jugadores se turnan (por su cuenta, la app no maneja turnos) para hacer preguntas de sí o no y acotar su número: "¿con este número me puedo jubilar?"
4. Cuando alguien adivina, el host toca **Alguien adivinó** y lo marca: suma 300 / 200 / 100 puntos según el orden de acierto
5. **Nueva ronda** reparte números nuevos; **Terminar** muestra el podio

---

## Configuración de Firebase

El juego requiere Firebase Realtime Database para sincronización en tiempo real.

### 1. Crear el proyecto Firebase

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crear nuevo proyecto (el nombre no importa)
3. Desactivar Google Analytics si no lo necesitás

### 2. Crear la base de datos

1. En el menú lateral: **Build → Realtime Database**
2. Click en **Crear base de datos**
3. Elegir la región más cercana (ej: `us-central1`)
4. Seleccionar **Modo de prueba** → Siguiente

### 3. Registrar la app web

1. En la pantalla principal del proyecto: click en el ícono `</>`  (Web)
2. Ponerle un nombre (ej: `dame-la-pasta`)
3. **No** activar Firebase Hosting
4. Click en **Registrar app**
5. Copiar el objeto `firebaseConfig` que aparece

### 4. Pegar las credenciales en js/firebase.config.js

Copiá el archivo `js/firebase.config.example.js` como `js/firebase.config.js` y reemplazá los valores:

```javascript
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

`firebase.config.js` está en `.gitignore` para no exponer las credenciales.

### 5. Habilitar el login anónimo

En Firebase Console → **Build → Authentication → Comenzar → Sign-in method**, habilitá el proveedor **Anónimo**.

El juego inicia sesión anónima solo (nadie tiene que registrarse). Si este paso falta, el juego sigue andando con reglas abiertas, pero las reglas del paso siguiente lo bloquean.

### 6. Configurar reglas de seguridad

En Firebase Console → **Realtime Database → Reglas**, pegá el contenido de [`database.rules.json`](database.rules.json) y hacé click en **Publicar**.

Qué hacen: solo usuarios autenticados (el login anónimo del paso 5) pueden leer o escribir salas, las salas vencen a las 24h, y se valida la forma de los datos (estado, host, jugadores).

Qué **no** hacen: no impiden que un jugador con el código de la sala se cambie el puntaje desde la consola del navegador. Para una juntada entre amigos alcanza; para un torneo abierto, no.

> Publicá las reglas **después** de habilitar el login anónimo y probá una partida corta. Si algo falla, volvé a las reglas anteriores desde el historial de la consola.

---

## Publicar en GitHub Pages

1. Crear repositorio en GitHub llamado `dame-la-pasta`
2. Subir todos los archivos del proyecto (**sin** `js/firebase.config.js` — contiene credenciales privadas)
3. Ir a **Settings → Pages → Source: rama main → / (root)**
4. La URL será: `https://[tu-usuario].github.io/dame-la-pasta/`

> **Nota:** `js/firebase.config.js` nunca debe subirse al repo. Configurá las credenciales directamente en el servidor o usá GitHub Secrets si usás CI/CD.

---

## Temática (mundialista ⚽ / clásica)

El juego trae dos temáticas que conviven y se alternan con **un solo flag**:

- `"mundial"` — temática mundialista (fútbol / Copa del Mundo), paleta **celeste y blanco**.
- `"classic"` — temática original (paleta violeta/dorado, banco de preguntas argentino).

Para cambiar de una a otra, editá una sola línea en **`js/theme.config.js`**:

```javascript
export const ACTIVE_THEME = "mundial"; // "mundial" | "classic"
```

> **Rollback post-Mundial:** poné `"classic"` y listo — vuelven los colores y las preguntas
> originales. La temática clásica queda preservada intacta en `js/preguntas.classic.js`.

El flag controla:
- **Colores** (`styles.css`, bloque `[data-theme="mundial"]`, aplicado por `js/main.js`).
- **Banco de preguntas** (`js/preguntas.js` selecciona entre `preguntas.classic.js` y `preguntas.mundial.js`).
- **Microcopys** (subtítulo, texto del buzzer, descripción del juego).

---

## Personalizar preguntas

Las preguntas viven en dos bancos según la temática: `js/preguntas.classic.js` y
`js/preguntas.mundial.js`. Editá el que corresponda a la temática activa (`js/theme.config.js`).
El resto del juego importa siempre desde `js/preguntas.js` (selector). Cada banco exporta:

- **`QUESTIONS`** — preguntas del tablero principal. Cada categoría tiene exactamente 5 preguntas (valores 200, 400, 600, 800, 1000).
- **`LIGHTNING_QUESTIONS`** — preguntas del modo relámpago (respuesta rápida, sin valor fijo).
- **`ESTIMATION_QUESTIONS`** — preguntas de estimación (respuesta numérica).

Formato del tablero:
```javascript
"Nombre Categoría": [
  { value: 200,  question: "¿Pregunta?", answer: "Respuesta" },
  { value: 400,  question: "¿Pregunta?", answer: "Respuesta" },
  // ...
],
```

Asegurate de que no haya preguntas duplicadas entre `QUESTIONS` y `LIGHTNING_QUESTIONS` — pueden aparecer en la misma partida.

---

## Estructura del proyecto

```
dame-la-pasta/
├── index.html                    ← estructura HTML y pantallas
├── styles.css                    ← estilos globales
├── js/
│   ├── firebase.config.example.js  ← plantilla de credenciales (subir al repo)
│   ├── firebase.config.js          ← credenciales reales (NO subir al repo)
│   ├── firebase.js                 ← DAO + implementación Firebase
│   ├── juego.js                    ← lógica del juego y render
│   ├── preguntas.js                ← pool de categorías y banco de preguntas
│   └── games/numero-main/          ← ¿Qué número soy? (logica.js + index.js)
└── README.md
```

---

## Stack técnico

- HTML + CSS + JS puro — sin frameworks, sin build steps
- Firebase Realtime Database — sincronización en tiempo real (reemplazable vía DAO)
- GitHub Pages — hosting gratuito
