// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onTilt } from "../../js/motion.js";

function fireBeta(beta) {
  const ev = new Event("deviceorientation");
  ev.beta  = beta;
  ev.gamma = 0;
  ev.alpha = 0;
  window.dispatchEvent(ev);
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

  it("no dispara durante la ventana de calibración", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fireBeta(90);
    fireBeta(90);
    vi.advanceTimersByTime(500);
    fireBeta(140); // delta sería +50 pero todavía no calibró
    expect(cb).not.toHaveBeenCalled();
  });

  it("calibra al baseline observado al final de la ventana", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fireBeta(90);
    vi.advanceTimersByTime(1000); // baseline = 90
    fireBeta(140); // delta +50 → paso
    expect(cb).toHaveBeenCalledWith({ up: false, down: true });
  });

  it("dispara 'correcto' cuando el delta es negativo", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fireBeta(0);
    vi.advanceTimersByTime(1000); // baseline = 0
    fireBeta(-50); // delta -50 → correcto
    expect(cb).toHaveBeenCalledWith({ up: true, down: false });
  });

  it("requiere volver a la zona neutral antes del próximo tilt", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fireBeta(0);
    vi.advanceTimersByTime(1000); // baseline = 0
    fireBeta(50); // dispara paso
    expect(cb).toHaveBeenCalledTimes(1);

    // Cooldown
    vi.advanceTimersByTime(900);

    // Sigue lejos del baseline → no debe re-disparar
    fireBeta(60);
    expect(cb).toHaveBeenCalledTimes(1);

    // Vuelve cerca del baseline → re-arme
    fireBeta(5);
    fireBeta(50); // ahora sí dispara
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("respeta el cooldown entre tilts consecutivos", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    fireBeta(0);
    vi.advanceTimersByTime(1000);
    fireBeta(50); // dispara
    expect(cb).toHaveBeenCalledTimes(1);

    // Inmediatamente vuelve a neutral y vuelve a tiltar
    fireBeta(0);
    fireBeta(50);
    // Aunque esté armado, el cooldown todavía corre
    expect(cb).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);
    fireBeta(0);
    fireBeta(50);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("la función de cleanup detiene la escucha", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    vi.advanceTimersByTime(1000);
    cleanup();
    cleanup = null;
    fireBeta(0);
    fireBeta(80);
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignora eventos con beta null", () => {
    const cb = vi.fn();
    cleanup = onTilt(cb);
    const ev = new Event("deviceorientation");
    ev.beta = null;
    window.dispatchEvent(ev);
    vi.advanceTimersByTime(1000);
    // sin samples válidos, baseline queda null → tilts no disparan
    fireBeta(140);
    // ahora hay una muestra y el baseline ya pasó: nunca calibró → no dispara
    expect(cb).not.toHaveBeenCalled();
  });
});
