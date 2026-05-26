// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onTilt } from "../../js/motion.js";

// Dispara un evento deviceorientation.
function fire(beta, gamma) {
  const ev = new Event("deviceorientation");
  ev.beta  = beta;
  ev.gamma = gamma;
  ev.alpha = 0;
  window.dispatchEvent(ev);
}

// Simula el teléfono llegando a pose horizontal (|gamma| > 75).
// Ese primer evento solo desbloquea la detección, no dispara.
function setupLandscape(cb) {
  const cleanup = onTilt(cb);
  fire(0, -90); // gamma=-90 → |gamma|=90 > 75 → landscape=true, no dispara
  return cleanup;
}

describe("onTilt", () => {
  let cleanup;

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { if (cleanup) { cleanup(); cleanup = null; } vi.useRealTimers(); });

  it("no dispara mientras el teléfono está en portrait (|gamma| < 75)", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fire(90, 0);   // portrait: |gamma|=0 < 75 → ignorado
    fire(40, 0);   // sigue en portrait
    expect(cb).not.toHaveBeenCalled();
  });

  it("activa la detección cuando el teléfono pasa a landscape", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fire(90, 0);    // portrait → ignorado
    fire(5, -80);   // |gamma|=80 > 75 → landscape=true, no dispara
    fire(-35, -88); // beta=-35, dom=0-(-35)=35 ≥ threshold → correcto
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("dispara 'correcto' cuando beta baja (pantalla hacia el techo)", () => {
    const cb = vi.fn();
    cleanup = setupLandscape(cb);
    fire(-35, -90); // dom = 0-(-35) = 35 > 30 → up:true
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("dispara 'paso' cuando beta sube (pantalla hacia el piso)", () => {
    const cb = vi.fn();
    cleanup = setupLandscape(cb);
    fire(35, -90); // dom = 0-35 = -35 < -30 → down:true
    expect(cb).toHaveBeenCalledWith({ up: false, down: true });
  });

  it("requiere volver a la zona neutral (beta ≈ 0) antes del próximo tilt", () => {
    const cb = vi.fn();
    cleanup = setupLandscape(cb);
    fire(35, -90); // dispara paso, armed=false
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);

    fire(40, -90); // sigue lejos de neutral → no re-dispara
    expect(cb).toHaveBeenCalledTimes(1);

    fire(5, -90);  // vuelve a neutral (|dom|=5 < 14) → armed=true
    fire(35, -90); // ahora sí dispara
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("respeta el cooldown entre tilts consecutivos", () => {
    const cb = vi.fn();
    cleanup = setupLandscape(cb);
    fire(35, -90); // dispara
    expect(cb).toHaveBeenCalledTimes(1);

    fire(5, -90);  // neutral → armed=true
    fire(35, -90); // dentro del cooldown → no dispara
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);
    fire(5, -90);
    fire(35, -90);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("la función de cleanup detiene la escucha", () => {
    const cb = vi.fn();
    cleanup = setupLandscape(cb);
    cleanup();
    cleanup = null;
    fire(-35, -90);
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignora eventos con datos nulos", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    const ev = new Event("deviceorientation");
    ev.beta = null; ev.gamma = null;
    window.dispatchEvent(ev);
    fire(0, -90); // primer evento válido: solo activa landscape, no dispara
    expect(cb).not.toHaveBeenCalled();
  });
});
