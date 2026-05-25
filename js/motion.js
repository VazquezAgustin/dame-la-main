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

// Llama a callback({ up: bool, down: bool }) cada vez que detecta un tilt
// por encima del umbral (deg). Devuelve una función para cancelar la escucha.
export function onTilt(callback, thresholdDeg = 40) {
  let lastFired = null;
  const COOLDOWN_MS = 800;

  function handler(e) {
    const beta = e.beta; // -180 a 180: inclinación frontal/trasera
    if (beta === null) return;
    const now = Date.now();
    if (lastFired && now - lastFired < COOLDOWN_MS) return;

    if (beta < -thresholdDeg) {
      lastFired = now;
      callback({ up: true, down: false });
    } else if (beta > thresholdDeg) {
      lastFired = now;
      callback({ up: false, down: true });
    }
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
