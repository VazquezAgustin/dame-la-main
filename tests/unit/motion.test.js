// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onTilt } from "../../js/motion.js";

// Dispara un evento deviceorientation con los valores dados.
function fireOrientation(beta, gamma) {
  const ev = new Event("deviceorientation");
  ev.beta  = beta;
  ev.gamma = gamma;
  ev.alpha = 0;
  window.dispatchEvent(ev);
}

// setup() envía el primer evento en pose landscape (|gamma|=90 > LANDSCAPE_MIN=60).
// Ese evento solo calibra la referencia, no dispara.
function setup(cb, beta = 0, gamma = -90) {
  const cleanup = onTilt(cb);
  fireOrientation(beta, gamma);
  return cleanup;
}

describe("onTilt", () => {
  let cleanup;

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { if (cleanup) { cleanup(); cleanup = null; } vi.useRealTimers(); });

  it("no dispara mientras el teléfono está en portrait (|gamma| < 60)", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);

    // Portrait: |gamma|=0, no calibra
    fireOrientation(90, 0);
    // Inclinación grande en portrait, no debe disparar
    fireOrientation(40, 0);

    expect(cb).not.toHaveBeenCalled();
  });

  it("calibra automáticamente cuando el teléfono pasa a landscape", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);

    // Portrait inicial
    fireOrientation(90, 0);
    // Transición a landscape: |gamma|=90 > 60 → calibra (no dispara)
    fireOrientation(0, -90);
    // Ahora sí detecta tilts
    fireOrientation(0, -50); // dGamma = -90-(-50) = -40 → paso
    expect(cb).toHaveBeenCalledWith({ up: false, down: true });
  });

  it("dispara 'correcto' cuando gamma cae por debajo del baseline", () => {
    const cb = vi.fn();
    cleanup = setup(cb, 0, -90); // baseline: beta=0, gamma=-90
    fireOrientation(0, -130);    // dGamma = -90-(-130) = 40 → up:true
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("dispara 'paso' cuando gamma sube por encima del baseline", () => {
    const cb = vi.fn();
    cleanup = setup(cb, 0, -90);
    fireOrientation(0, -50); // dGamma = -90-(-50) = -40 → down:true
    expect(cb).toHaveBeenCalledWith({ up: false, down: true });
  });

  it("requiere volver a la zona neutral antes del próximo tilt", () => {
    const cb = vi.fn();
    cleanup = setup(cb, 0, -90);
    fireOrientation(0, -50); // dispara paso
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);

    // Sigue lejos del baseline → no re-dispara
    fireOrientation(0, -55);
    expect(cb).toHaveBeenCalledTimes(1);

    // Vuelve cerca del baseline → re-arme
    fireOrientation(0, -88); // |(-90)-(-88)| = 2 < 14 → neutral
    fireOrientation(0, -50); // dispara de nuevo
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("respeta el cooldown entre tilts consecutivos", () => {
    const cb = vi.fn();
    cleanup = setup(cb, 0, -90);
    fireOrientation(0, -50); // dispara
    expect(cb).toHaveBeenCalledTimes(1);

    fireOrientation(0, -88); // neutral → armed
    fireOrientation(0, -50); // cooldown activo → no dispara
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);
    fireOrientation(0, -88); // neutral
    fireOrientation(0, -50);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("la función de cleanup detiene la escucha", () => {
    const cb = vi.fn();
    cleanup = setup(cb, 0, -90);
    cleanup();
    cleanup = null;
    fireOrientation(0, -50);
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignora eventos sin datos de gamma", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    const ev = new Event("deviceorientation");
    ev.beta  = null;
    ev.gamma = null;
    window.dispatchEvent(ev);
    // Primer evento válido en landscape: solo calibra, no dispara
    fireOrientation(0, -90);
    expect(cb).not.toHaveBeenCalled();
  });
});
