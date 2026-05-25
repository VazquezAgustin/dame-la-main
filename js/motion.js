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
// relativo a la posición inicial (se calibra al arrancar). El jugador debe
// volver a la zona neutral entre tilts para evitar disparos duplicados.
// Devuelve una función para cancelar la escucha.
export function onTilt(callback, thresholdDeg = 40, neutralBand = 18) {
  let baseline   = null;     // beta de referencia, capturado tras calibrar
  let armed      = false;    // requiere zona neutral antes de disparar
  let lastFired  = null;
  let lastBeta   = null;
  const COOLDOWN_MS    = 800;
  const CALIBRATE_MS   = 1000;   // tiempo para colocar el celular antes de medir

  function handler(e) {
    const beta = e.beta; // -180 a 180: inclinación frontal/trasera
    if (beta === null) return;
    lastBeta = beta;

    if (baseline === null) return; // aún no calibrado, ignorar
    const delta = beta - baseline;
    const now   = Date.now();

    // Re-arme: el celular volvió cerca de la posición inicial
    if (Math.abs(delta) < neutralBand) {
      armed = true;
      return;
    }

    if (!armed) return;
    if (lastFired && now - lastFired < COOLDOWN_MS) return;

    if (delta < -thresholdDeg) {
      lastFired = now;
      armed = false;
      callback({ up: true, down: false });
    } else if (delta > thresholdDeg) {
      lastFired = now;
      armed = false;
      callback({ up: false, down: true });
    }
  }

  window.addEventListener("deviceorientation", handler);

  // Calibrar después de un breve delay para que el jugador acomode el celular.
  const calibrateTimer = setTimeout(() => {
    if (lastBeta !== null) {
      baseline = lastBeta;
      armed = true; // ya está en la zona neutral (es la propia baseline)
    }
  }, CALIBRATE_MS);

  return () => {
    clearTimeout(calibrateTimer);
    window.removeEventListener("deviceorientation", handler);
  };
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
