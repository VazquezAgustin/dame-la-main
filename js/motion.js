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
// Usa ±90° como pose canónica (teléfono en landscape sobre la frente,
// bloqueado a portrait por CSS). Sin ventana de calibración: el primer
// evento con ambos ejes disponibles fija el eje dominante (el que esté
// más cerca de ±90) y su referencia canónica. Los eventos siguientes
// detectan desviaciones desde esa referencia fija.
//
// Convención de signos: delta = ref − valor.
// delta > 0 → valor bajó desde ref → "adelante" → correcto (up: true).
// delta < 0 → valor subió desde ref → "atrás"   → paso  (down: true).
export function onTilt(callback, thresholdDeg = 30, neutralBand = 14) {
  const axes = { beta: { last: null }, gamma: { last: null } };
  let dominantAxis = null; // 'beta' | 'gamma', fijado en el primer evento
  let canonicalRef = null; // ±90 según el signo del eje dominante en pose inicial
  let armed        = true;
  let lastFired    = null;
  const COOLDOWN_MS = 800;

  function handler(e) {
    if (e.beta  != null) axes.beta.last  = e.beta;
    if (e.gamma != null) axes.gamma.last = e.gamma;

    // Primer evento con ambos ejes: fijar eje dominante y referencia canónica.
    // El eje con mayor valor absoluto es el de landscape (cerca de ±90).
    if (dominantAxis === null) {
      const b = axes.beta.last, g = axes.gamma.last;
      if (b === null || g === null) return;
      dominantAxis = Math.abs(b) >= Math.abs(g) ? "beta" : "gamma";
      canonicalRef = axes[dominantAxis].last >= 0 ? 90 : -90;
      return; // este evento solo sirve para fijar la referencia
    }

    const v   = axes[dominantAxis].last;
    if (v === null) return;
    const dom = canonicalRef - v;
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
