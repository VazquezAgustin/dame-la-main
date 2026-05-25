// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onTilt } from "../../js/motion.js";

// Simula un evento deviceorientation con beta variable y gamma=0.
// En pose canónica landscape, beta es el eje dominante (|beta|≈90 > |gamma|≈0).
function fireBeta(beta) {
  const ev = new Event("deviceorientation");
  ev.beta  = beta;
  ev.gamma = 0;
  ev.alpha = 0;
  window.dispatchEvent(ev);
}

// El primer evento fija el eje dominante y la referencia canónica (sin disparar).
// setup() encapsula ese primer evento para que los tests arranquen listos.
function setup(cb, canonicalBeta = 90) {
  const cleanup = onTilt(cb);
  fireBeta(canonicalBeta);
  return cleanup;
}

describe("onTilt", () => {
  let cleanup;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (cleanup) cleanup();
    cleanup = null;
    vi.useRealTimers();
  });

  it("dispara inmediatamente sin ventana de calibración", () => {
    const cb = vi.fn();
    cleanup = setup(cb); // primer evento fija referencia (beta=90)
    fireBeta(50);        // delta = 90-50 = 40 > threshold → correcto
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("dispara 'paso' cuando el valor supera la pose canónica", () => {
    const cb = vi.fn();
    cleanup = setup(cb);
    fireBeta(130); // delta = 90-130 = -40 → paso
    expect(cb).toHaveBeenCalledWith({ up: false, down: true });
  });

  it("dispara 'correcto' cuando el valor cae por debajo de la pose canónica", () => {
    const cb = vi.fn();
    cleanup = setup(cb);
    fireBeta(50); // delta = 90-50 = 40 → correcto
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("requiere volver a la zona neutral antes del próximo tilt", () => {
    const cb = vi.fn();
    cleanup = setup(cb);
    fireBeta(130); // dispara paso
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900); // cooldown

    // Sigue lejos de canonical → armed sigue false, no dispara
    fireBeta(125);
    expect(cb).toHaveBeenCalledTimes(1);

    // Vuelve cerca de canonical → re-arme
    fireBeta(88); // |90-88| = 2 < neutralBand(14) → armed = true
    fireBeta(130); // ahora sí dispara
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("respeta el cooldown entre tilts consecutivos", () => {
    const cb = vi.fn();
    cleanup = setup(cb);
    fireBeta(130); // dispara
    expect(cb).toHaveBeenCalledTimes(1);

    // Vuelve a neutral e intenta de nuevo antes del cooldown
    fireBeta(88); // neutral → armed = true
    fireBeta(130); // dentro del cooldown → no dispara
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);
    fireBeta(88); // neutral
    fireBeta(130);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("la función de cleanup detiene la escucha", () => {
    const cb = vi.fn();
    cleanup = setup(cb);
    cleanup();
    cleanup = null;
    fireBeta(50);
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignora eventos hasta tener ambos ejes disponibles", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);

    // Evento sin datos — dominantAxis sigue null
    const ev = new Event("deviceorientation");
    ev.beta  = null;
    ev.gamma = null;
    window.dispatchEvent(ev);

    // Primer evento válido: solo fija la referencia, no dispara
    fireBeta(130);
    expect(cb).not.toHaveBeenCalled();
  });
});
