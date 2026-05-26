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
// Flujo:
//   1. Espera a que |gamma| > LANDSCAPE_MIN (≈60°): el jugador llevó el
//      teléfono de portrait a landscape (a la frente).
//   2. Calibra con el valor REAL de beta y gamma en ese momento (no asume ±90).
//   3. Detecta desviaciones respecto de esa pose de referencia en ambos ejes;
//      el eje con mayor desviación absoluta es el dominante.
//
// Convención: delta = baseline − valor.
// delta > 0 → correcto (up: true).
// delta < 0 → paso    (down: true).
export function onTilt(callback, thresholdDeg = 30, neutralBand = 14) {
  const axes = {
    beta:  { baseline: null, last: null },
    gamma: { baseline: null, last: null },
  };
  let armed     = false;
  let lastFired = null;
  const COOLDOWN_MS   = 800;
  const LANDSCAPE_MIN = 75; // |gamma| mínimo para considerar pose landscape

  function handler(e) {
    if (e.beta  != null) axes.beta.last  = e.beta;
    if (e.gamma != null) axes.gamma.last = e.gamma;

    const b = axes.beta.last, g = axes.gamma.last;
    if (b === null || g === null) return;

    // Calibrar solo cuando el teléfono esté claramente en landscape.
    // Mientras el jugador toca "Empezar" con el teléfono en portrait,
    // |gamma| es pequeño y este bloque devuelve sin hacer nada.
    if (axes.beta.baseline === null) {
      if (Math.abs(g) > LANDSCAPE_MIN) {
        axes.beta.baseline  = b;
        axes.gamma.baseline = g;
        armed = true;
      }
      return;
    }

    const dBeta  = axes.beta.baseline  - b;
    const dGamma = axes.gamma.baseline - g;
    const dom = Math.abs(dBeta) >= Math.abs(dGamma) ? dBeta : dGamma;
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
