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
//
// Robusto a orientación: rastreamos beta y gamma simultáneamente y, en cada
// muestra, evaluamos el eje con mayor desviación absoluta. Esto cubre tanto
// portrait (beta domina) como landscape heads-up (gamma domina), incluso si
// `screen.orientation` no refleja la pose física por rotation lock.
//
// Convención de signos: en ambos ejes, "adelante" (correcto) corresponde a
// que el valor DECREZCA respecto al baseline. Esto coincide con el sentido
// físico habitual: en portrait sobre la frente, inclinar el top hacia
// adelante baja beta; en landscape sobre la frente (rotación horaria del
// celular), inclinar el top hacia adelante baja gamma.
export function onTilt(callback, thresholdDeg = 30, neutralBand = 14) {
  const axes = {
    beta:  { baseline: null, last: null },
    gamma: { baseline: null, last: null },
  };
  let armed     = false;
  let lastFired = null;
  const COOLDOWN_MS  = 800;
  const CALIBRATE_MS = 1000;

  function deltaForward(name) {
    const ax = axes[name];
    if (ax.baseline === null || ax.last === null) return 0;
    // "adelante = correcto" → valor decrece → delta_forward = baseline - value
    return ax.baseline - ax.last;
  }

  function handler(e) {
    if (e.beta  !== null && e.beta  !== undefined) axes.beta.last  = e.beta;
    if (e.gamma !== null && e.gamma !== undefined) axes.gamma.last = e.gamma;

    if (axes.beta.baseline === null && axes.gamma.baseline === null) return;

    const dBeta  = deltaForward("beta");
    const dGamma = deltaForward("gamma");
    // Eje dominante = el que más se desvió del baseline
    const dom = Math.abs(dBeta) >= Math.abs(dGamma) ? dBeta : dGamma;
    const now = Date.now();

    if (Math.abs(dom) < neutralBand) {
      armed = true;
      return;
    }
    if (!armed) return;
    if (lastFired && now - lastFired < COOLDOWN_MS) return;
    if (Math.abs(dom) < thresholdDeg) return;

    lastFired = now;
    armed = false;
    // dom > 0 = inclinó hacia adelante (valor decreció) = correcto
    if (dom > 0) callback({ up: true,  down: false });
    else         callback({ up: false, down: true  });
  }

  window.addEventListener("deviceorientation", handler);

  const calibrateTimer = setTimeout(() => {
    if (axes.beta.last  !== null) axes.beta.baseline  = axes.beta.last;
    if (axes.gamma.last !== null) axes.gamma.baseline = axes.gamma.last;
    armed = true;
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
