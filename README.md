# Dame la Pasta

Réplica web del concurso "Dame la Pasta" de Ibai Llanos. Juego de trivia multijugador en tiempo real con sistema de pulsador (buzzer). Los jugadores se unen con un código de sala, eligen categorías por turnos desde un tablero y compiten pulsando un botón para responder primero.

---

## Cómo jugar

1. El **host** abre la app y crea una sala — recibe un código de 6 letras
2. Los **jugadores** ingresan ese código y su nombre para unirse
3. El host inicia la partida
4. Por turnos, un jugador elige una celda del tablero (categoría + valor)
5. Todos pueden pulsar el buzzer para responder primero
6. El que pulsa dice su respuesta en voz alta y toca "Mostrar respuesta"
7. El host decide si fue correcto o no

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

### 4. Pegar las credenciales en index.html

Abrí `index.html` y buscá esta sección (~línea 812):

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  ...
};
```

Reemplazá los valores con los de tu proyecto.

### 5. Configurar reglas de seguridad

En Firebase Console → **Realtime Database → Reglas**, pegá esto:

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

Click en **Publicar**.

---

## Publicar en GitHub Pages

1. Crear repositorio en GitHub llamado `dame-la-pasta`
2. Subir `index.html` y `README.md`
3. Ir a **Settings → Pages → Source: rama main → / (root)**
4. La URL será: `https://[tu-usuario].github.io/dame-la-pasta/`

---

## Personalizar preguntas

En `index.html`, buscá el comentario `/* 📝 EDITA AQUÍ LAS PREGUNTAS */`. Cada categoría tiene 5 preguntas con valores 200, 400, 600, 800 y 1000.

Formato:
```javascript
"Nombre Categoría": [
  { value: 200,  question: "¿Pregunta?", answer: "Respuesta" },
  { value: 400,  question: "¿Pregunta?", answer: "Respuesta" },
  // ...
],
```

---

## Stack técnico

- HTML + CSS + JS puro — sin frameworks, sin build steps
- Firebase Realtime Database — sincronización en tiempo real
- GitHub Pages — hosting gratuito
