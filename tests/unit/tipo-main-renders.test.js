// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js", () => ({
  ref: () => ({}),
  update: vi.fn(async () => {}),
  serverTimestamp: () => 0,
}));
vi.mock("../../js/firebase.js", () => ({ db: {}, GameDAO: {}, firebaseConfigurado: false }));
vi.mock("../../js/audio.js", () => ({ playTick: vi.fn() }));

import { update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import TipoGame, {
  _setTestContext, _resetTestState, renderBetween, renderRound,
} from "../../js/games/tipo-main/index.js";

const HOST = "p_host";
const OTRO = "p_otro";
const ROOM = "TEST01";

function mountDom() {
  document.body.innerHTML = `
    <div id="vista-tablero"></div>
    <div id="vista-numero-main"></div>
    <div id="pregunta-overlay"></div>
    <div id="vista-tipo-main" style="display:none">
      <div id="tipo-between">
        <button id="btn-tipo-repartir" style="display:none"></button>
        <p id="tipo-wait-host" style="display:none"></p>
      </div>
      <div id="tipo-round" style="display:none">
        <span id="tipo-ronda"></span>
        <div id="tipo-stage">
          <div id="tipo-cover"></div>
          <div id="tipo-countdown" style="display:none"><div id="tipo-countdown-num"></div></div>
          <div id="tipo-palabra" style="display:none"></div>
          <div id="tipo-adivinado" style="display:none"></div>
          <div id="tipo-esperar" style="display:none"></div>
        </div>
        <button id="btn-tipo-ocultar" style="display:none"></button>
        <div id="tipo-host-bar" style="display:none">
          <button id="btn-tipo-adivino"></button>
          <button id="btn-tipo-nueva-ronda"></button>
          <button id="btn-tipo-terminar"></button>
        </div>
        <div id="tipo-sheet" style="display:none">
          <div id="tipo-sheet-list"></div>
          <button id="btn-tipo-sheet-cerrar"></button>
        </div>
      </div>
    </div>
  `;
}

function baseState(extra = {}) {
  return {
    hostId: HOST,
    gameType: "tipo-main",
    status: "playing",
    players: {
      [HOST]: { name: "Host", score: 0, connected: true },
      [OTRO]: { name: "Otro", score: 0, connected: true },
    },
    playerOrder: [HOST, OTRO],
    tipoRoundNumber: 1,
    tipoRound: { words: { [HOST]: "Falopero", [OTRO]: "Gordo" }, guessed: null },
    ...extra,
  };
}

let holder;
function setup({ isHost = true, myId = HOST, state = baseState() } = {}) {
  mountDom();
  _resetTestState();
  holder = { s: state };
  const ctx = {
    getMyPlayerId: () => myId,
    getRoomCode:   () => ROOM,
    getIsHost:     () => isHost,
    getState:      () => holder.s,
    triggerFlash:  vi.fn(),
  };
  _setTestContext(ctx);
  TipoGame.initGame(ctx);
  return ctx;
}

const $ = (id) => document.getElementById(id);

describe("¿Qué tipo soy? — entre rondas", () => {
  it("el host ve 'Repartir' y los demás el mensaje de espera", () => {
    setup();
    renderBetween(baseState({ tipoRound: null }));
    expect($("btn-tipo-repartir").style.display).toBe("block");
    expect($("tipo-wait-host").style.display).toBe("none");

    setup({ isHost: false, myId: OTRO });
    renderBetween(baseState({ tipoRound: null }));
    expect($("btn-tipo-repartir").style.display).toBe("none");
    expect($("tipo-wait-host").style.display).toBe("block");
  });

  it("muestra la vista del juego y oculta las de otros juegos", () => {
    setup();
    renderBetween(baseState({ tipoRound: null }));
    expect($("vista-tipo-main").style.display).toBe("flex");
    expect($("vista-numero-main").style.display).toBe("none");
  });

  it("'Repartir' escribe categorías distintas en Firebase", async () => {
    setup({ state: baseState({ tipoRound: null, tipoRoundNumber: 0 }) });
    renderBetween(holder.s);
    update.mockClear();
    $("btn-tipo-repartir").click();
    await Promise.resolve();
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][1];
    expect(payload.tipoRoundNumber).toBe(1);
    const words = Object.values(payload.tipoRound.words);
    expect(words.length).toBe(2);
    expect(new Set(words).size).toBe(2);
  });
});

describe("¿Qué tipo soy? — ronda en curso", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("al principio muestra la cobertura y no la categoría", () => {
    setup();
    renderRound(baseState());
    expect($("tipo-cover").style.display).toBe("flex");
    expect($("tipo-palabra").style.display).toBe("none");
    expect($("tipo-ronda").textContent).toBe("Ronda 1");
  });

  it("cobertura → cuenta regresiva → MI categoría (y no la del otro)", () => {
    setup();
    renderRound(baseState());
    $("tipo-cover").click();
    expect($("tipo-countdown").style.display).toBe("flex");
    expect($("tipo-countdown-num").textContent).toBe("3");
    expect($("tipo-palabra").style.display).toBe("none");
    vi.advanceTimersByTime(3000);
    expect($("tipo-countdown").style.display).toBe("none");
    expect($("tipo-palabra").style.display).toBe("block");
    expect($("tipo-palabra").textContent).toBe("Falopero");
    expect(document.body.textContent).not.toContain("Gordo");
  });

  it("'Ocultar' vuelve a la cobertura", () => {
    setup();
    renderRound(baseState());
    $("tipo-cover").click();
    vi.advanceTimersByTime(3000);
    $("btn-tipo-ocultar").click();
    expect($("tipo-cover").style.display).toBe("flex");
    expect($("tipo-palabra").style.display).toBe("none");
  });

  it("las categorías largas llevan la clase 'larga'", () => {
    setup({ myId: OTRO, isHost: false });
    const s = baseState({ tipoRound: { words: { [HOST]: "Aura", [OTRO]: "Se casó con alguien mucho menor" }, guessed: null } });
    holder.s = s;
    renderRound(s);
    $("tipo-cover").click();
    vi.advanceTimersByTime(3000);
    expect($("tipo-palabra").classList.contains("larga")).toBe(true);
  });

  it("quien adivinó ve su categoría en verde con los puntos", () => {
    setup({ myId: OTRO, isHost: false });
    renderRound(baseState({
      tipoRound: { words: { [HOST]: "Falopero", [OTRO]: "Gordo" }, guessed: { [OTRO]: { position: 1, points: 300 } } },
    }));
    expect($("tipo-palabra").style.display).toBe("block");
    expect($("tipo-palabra").classList.contains("adivinado")).toBe(true);
    expect($("tipo-adivinado").textContent).toContain("+300");
  });

  it("un jugador sin categoría ve 'Esperá a la próxima ronda'", () => {
    setup({ myId: "p_nuevo", isHost: false });
    renderRound(baseState());
    expect($("tipo-esperar").style.display).toBe("block");
    expect($("tipo-cover").style.display).toBe("none");
  });

  it("la barra de host se ve solo para el host", () => {
    setup({ isHost: false, myId: OTRO });
    renderRound(baseState());
    expect($("tipo-host-bar").style.display).toBe("none");
  });
});

describe("¿Qué tipo soy? — hoja '¿Quién adivinó?'", () => {
  it("lista las categorías ajenas; la propia del host aparece como '?'", () => {
    setup();
    renderRound(baseState());
    $("btn-tipo-adivino").click();
    expect($("tipo-sheet").style.display).toBe("flex");
    const txt = $("tipo-sheet-list").textContent;
    expect(txt).toContain("Gordo");
    expect(txt).not.toContain("Falopero");
    expect(txt).toContain("?");
  });

  it("marcar a un jugador suma 300 al primero", async () => {
    setup();
    renderRound(holder.s);
    $("btn-tipo-adivino").click();
    update.mockClear();
    $("tipo-sheet-list").querySelector(`[data-pid="${OTRO}"]`).click();
    await Promise.resolve();
    const payload = update.mock.calls[0][1];
    expect(payload[`tipoRound/guessed/${OTRO}`]).toEqual({ position: 1, points: 300 });
    expect(payload[`players/${OTRO}/score`]).toBe(300);
  });
});
