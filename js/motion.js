// Wrappers para la API de orientación/movimiento del dispositivo.
// requestMotionPermission() debe llamarse desde un gesto explícito del usuario
// (iOS exige que el prompt lo dispare una interacción, no código automático).

export async function requestMotionPermission() {
  if (typeof DeviceOrientationEvent === "undefined") return "unavailable";
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      return result; // "granted" | "denied"
    } catch (_) {
      return "denied";
    }
  }
  return "granted"; // Android y escritorio no necesitan permiso explícito
}

// Llama a callback({ up: bool, down: bool }) cada vez que detecta un tilt.
//
// La pose de juego es siempre horizontal sobre la frente (Heads Up), así que
// los valores de referencia son fijos y conocidos:
//   - beta ≈ 0  (horizontal = sin inclinación frente/atrás)
//   - gamma ≈ ±90 (teléfono girado 90° desde portrait)
//
// Flujo:
//   1. Espera a que |gamma| > 75°: el teléfono está claramente en horizontal.
//      Mientras el jugador toca "Empezar" en portrait (gamma ≈ 0), no hace nada.
//   2. Una vez en landscape: detecta desviaciones de beta desde 0.
//      beta < 0 → pantalla hacia el techo → correcto (up: true)
//      beta > 0 → pantalla hacia el piso   → paso    (down: true)
export function onTilt(callback, thresholdDeg = 30, neutralBand = 14) {
  let lastBeta      = null;
  let lastGamma     = null;
  let landscape     = false; // true cuando el teléfono llegó a pose horizontal
  let armed         = true;
  let lastFired     = null;
  const COOLDOWN_MS   = 800;
  const LANDSCAPE_MIN = 75;
  const BETA_REF      = 0; // beta en pose horizontal = 0

  function handler(e) {
    if (e.beta  != null) lastBeta  = e.beta;
    if (e.gamma != null) lastGamma = e.gamma;
    if (lastBeta === null || lastGamma === null) return;

    if (!landscape) {
      if (Math.abs(lastGamma) > LANDSCAPE_MIN) landscape = true;
      return; // esperar hasta que el teléfono esté horizontal
    }

    const dom = BETA_REF - lastBeta; // positivo = beta bajó = pantalla hacia techo
    const now = Date.now();

    if (Math.abs(dom) < neutralBand) { armed = true; return; }
    if (!armed) return;
    if (lastFired && now - lastFired < COOLDOWN_MS) return;
    if (Math.abs(dom) < thresholdDeg) return;

    lastFired = now;
    armed = false;
    if (dom > 0) callback({ up: true,  down: false });
    else         callback({ up: false, down: true  });
  }

  window.addEventListener("deviceorientation", handler);
  return () => window.removeEventListener("deviceorientation", handler);
}

// Solicita bloquear la orientación a landscape (o portrait/any).
// Falla silenciosamente si el navegador no lo soporta.
export function lockOrientation(mode = "landscape") {
  try {
    const api = screen.orientation || screen.lockOrientation;
    if (api?.lock) api.lock(mode).catch(() => {});
  } catch (_) {}
}

export function unlockOrientation() {
  try {
    if (screen.orientation?.unlock) screen.orientation.unlock();
  } catch (_) {}
}
