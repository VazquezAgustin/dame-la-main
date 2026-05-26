// Wrappers para la API de orientación de pantalla.

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
