// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mockear el SDK de Firebase desde CDN (no se puede importar en Node)
vi.mock("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js", () => ({
  ref: () => ({}),
  update: vi.fn(async () => {}),
  serverTimestamp: () => 0,
}));

// Mockear js/firebase.js (importa firebase.config.js — gitignored)
vi.mock("../../js/firebase.js", () => ({
  db: {},
  GameDAO: {},
  firebaseConfigurado: false,
}));

// Mockear audio.js (depende de Web Audio API)
vi.mock("../../js/audio.js", () => ({ playTick: vi.fn() }));

import { update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import NumeroGame, {
  _setTestContext, _resetTestState, renderBetween, renderRound,
} from "../../js/games/numero-main/index.js";

const HOST = "p_host";
const OTRO = "p_otro";
const ROOM = "TEST01";

function mountDom() {
  document.body.innerHTML = `
    <div id="vista-tablero"></div>
    <div id="vista-ruleta"></div>
    <div id="pregunta-overlay"></div>
    <div id="vista-numero-main" style="display:none">
      <div id="numero-between">
        <p id="numero-between-desc"></p>
        <div id="numero-range-between" style="display:none">
          <button class="numero-range-btn" data-range="chico"></button>
          <button class="numero-range-btn" data-range="grande"></button>
        </div>
        <button id="btn-numero-repartir" style="display:none"></button>
        <p id="numero-wait-host" style="display:none"></p>
      </div>
      <div id="numero-round" style="display:none">
        <div class="numero-topbar"><span id="numero-ronda"></span></div>
        <div id="numero-stage">
          <div id="numero-cover"></div>
          <div id="numero-countdown" style="display:none"><div id="numero-countdown-num"></div></div>
          <div id="numero-gigante" style="display:none"></div>
          <div id="numero-adivinado" style="display:none"></div>
          <div id="numero-esperar" style="display:none"></div>
        </div>
        <button id="btn-numero-ocultar" style="display:none"></button>
        <div id="numero-range-host" style="display:none">
          <button class="numero-range-btn" data-range="chico"></button>
          <button class="numero-range-btn" data-range="grande"></button>
        </div>
        <div id="numero-host-bar" style="display:none">
          <button id="btn-numero-adivino"></button>
          <button id="btn-numero-nueva-ronda"></button>
          <button id="btn-numero-terminar"></button>
        </div>
        <div id="numero-sheet" style="display:none">
          <div id="numero-sheet-list"></div>
          <button id="btn-numero-sheet-cerrar"></button>
        </div>
      </div>
    </div>
  `;
}

function baseState(extra = {}) {
  return {
    hostId: HOST,
    gameType: "numero-main",
    status: "playing",
    players: {
      [HOST]: { name: "Host", score: 0, connected: true },
      [OTRO]: { name: "Otro", score: 0, connected: true },
    },
    playerOrder: [HOST, OTRO],
    numeroRoundNumber: 1,
    numeroRound: { numbers: { [HOST]: 18, [OTRO]: 73 }, guessed: null },
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
  NumeroGame.initGame(ctx);
  return ctx;
}

const $ = (id) => document.getElementById(id);

describe("¿Qué número soy? — entre rondas", () => {
  it("el host ve 'Repartir números' y no el mensaje de espera", () => {
    setup();
    renderBetween(baseState({ numeroRound: null }));
    expect($("btn-numero-repartir").style.display).toBe("block");
    expect($("numero-wait-host").style.display).toBe("none");
  });

  it("un jugador que no es host ve el mensaje de espera", () => {
    setup({ isHost: false, myId: OTRO });
    renderBetween(baseState({ numeroRound: null }));
    expect($("btn-numero-repartir").style.display).toBe("none");
    expect($("numero-wait-host").style.display).toBe("block");
  });
});

describe("¿Qué número soy? — ronda en curso", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("al principio muestra la cobertura y no el número", () => {
    setup();
    renderRound(baseState());
    expect($("numero-cover").style.display).toBe("flex");
    expect($("numero-gigante").style.display).toBe("none");
    expect($("numero-ronda").textContent).toBe("Ronda 1 · Números chicos");
  });

  it("tocar la cobertura arranca la cuenta regresiva sin mostrar el número", () => {
    setup();
    renderRound(baseState());
    $("numero-cover").click();
    expect($("numero-cover").style.display).toBe("none");
    expect($("numero-countdown").style.display).toBe("flex");
    expect($("numero-countdown-num").textContent).toBe("3");
    expect($("numero-gigante").style.display).toBe("none");

    vi.advanceTimersByTime(1000);
    expect($("numero-countdown-num").textContent).toBe("2");
    expect($("numero-gigante").style.display).toBe("none");
  });

  it("al terminar la cuenta muestra MI número y no el de otro", () => {
    setup();
    renderRound(baseState());
    $("numero-cover").click();
    vi.advanceTimersByTime(3000);
    expect($("numero-countdown").style.display).toBe("none");
    expect($("numero-cover").style.display).toBe("none");
    expect($("numero-gigante").style.display).toBe("block");
    expect($("numero-gigante").textContent).toBe("18");
    expect(document.body.textContent).not.toContain("73");
  });

  it("'Ocultar' vuelve a mostrar la cobertura", () => {
    setup();
    renderRound(baseState());
    $("numero-cover").click();
    vi.advanceTimersByTime(3000);
    $("btn-numero-ocultar").click();
    expect($("numero-cover").style.display).toBe("flex");
    expect($("numero-gigante").style.display).toBe("none");
  });

  it("al cambiar de ronda vuelve a aparecer la cobertura", () => {
    setup();
    renderRound(baseState());
    $("numero-cover").click();
    vi.advanceTimersByTime(3000);
    expect($("numero-gigante").style.display).toBe("block");

    renderRound(baseState({
      numeroRoundNumber: 2,
      numeroRound: { numbers: { [HOST]: 5, [OTRO]: 40 }, guessed: null },
    }));
    expect($("numero-cover").style.display).toBe("flex");
    expect($("numero-gigante").style.display).toBe("none");
  });

  it("si llega una ronda nueva durante la cuenta, se cancela y vuelve la cobertura", () => {
    setup();
    renderRound(baseState());
    $("numero-cover").click();
    vi.advanceTimersByTime(1000);

    holder.s = baseState({
      numeroRoundNumber: 2,
      numeroRound: { numbers: { [HOST]: 5, [OTRO]: 40 }, guessed: null },
    });
    renderRound(holder.s);
    expect($("numero-countdown").style.display).toBe("none");
    expect($("numero-cover").style.display).toBe("flex");

    vi.advanceTimersByTime(5000);
    expect($("numero-gigante").style.display).toBe("none");
    expect($("numero-cover").style.display).toBe("flex");
  });

  it("la barra de host se ve solo para el host", () => {
    setup();
    renderRound(baseState());
    expect($("numero-host-bar").style.display).toBe("flex");

    setup({ isHost: false, myId: OTRO });
    renderRound(baseState());
    expect($("numero-host-bar").style.display).toBe("none");
  });

  it("quien ya adivinó ve su número en verde y el texto de acierto con puntos", () => {
    setup({ isHost: false, myId: OTRO });
    renderRound(baseState({
      numeroRound: {
        numbers: { [HOST]: 18, [OTRO]: 73 },
        guessed: { [OTRO]: { position: 1, points: 300 } },
      },
    }));
    expect($("numero-cover").style.display).toBe("none");
    expect($("numero-gigante").textContent).toBe("73");
    expect($("numero-gigante").classList.contains("adivinado")).toBe(true);
    expect($("numero-adivinado").textContent).toContain("+300");
    expect($("numero-adivinado").textContent).toContain("1.º");
  });

  it("un jugador sin número (se unió tarde) ve 'Esperá a la próxima ronda'", () => {
    setup({ isHost: false, myId: "p_tarde" });
    renderRound(baseState());
    expect($("numero-esperar").style.display).toBe("block");
    expect($("numero-cover").style.display).toBe("none");
    expect($("numero-gigante").style.display).toBe("none");
  });

  it("no existe ningún elemento de turno en el DOM", () => {
    setup();
    renderRound(baseState());
    expect($("numero-turno")).toBeNull();
    expect($("btn-numero-sig-turno")).toBeNull();
  });
});

describe("¿Qué número soy? — hoja '¿Quién adivinó?' (host)", () => {
  it("lista a todos; el número propio del host aparece como '?'", () => {
    setup();
    renderRound(baseState());
    $("btn-numero-adivino").click();
    expect($("numero-sheet").style.display).toBe("flex");
    const rows = document.querySelectorAll(".numero-sheet-row");
    expect(rows).toHaveLength(2);
    const rowHost = document.querySelector(`.numero-sheet-row[data-pid="${HOST}"] .numero-sheet-num`);
    const rowOtro = document.querySelector(`.numero-sheet-row[data-pid="${OTRO}"] .numero-sheet-num`);
    expect(rowHost.textContent).toBe("?");
    expect(rowOtro.textContent).toBe("73");
  });

  it("'Cerrar' oculta la hoja", () => {
    setup();
    renderRound(baseState());
    $("btn-numero-adivino").click();
    $("btn-numero-sheet-cerrar").click();
    expect($("numero-sheet").style.display).toBe("none");
  });

  it("'Nueva ronda' pulsa cuando todos adivinaron", () => {
    setup();
    renderRound(baseState({
      numeroRound: {
        numbers: { [HOST]: 18, [OTRO]: 73 },
        guessed: {
          [HOST]: { position: 1, points: 300 },
          [OTRO]: { position: 2, points: 200 },
        },
      },
    }));
    expect($("btn-numero-nueva-ronda").classList.contains("pulse")).toBe(true);
  });
});

describe("¿Qué número soy? — rango de números", () => {
  beforeEach(() => { vi.useFakeTimers(); update.mockClear(); });
  afterEach(() => { vi.useRealTimers(); });

  const grandeState = (extra = {}) => baseState({
    numeroRange: "grande",
    numeroRound: { numbers: { [HOST]: 4500000, [OTRO]: 20000 }, guessed: null, range: "grande" },
    ...extra,
  });

  function reveal() {
    $("numero-cover").click();
    vi.advanceTimersByTime(3000);
  }

  it("rango grande: el número sale formateado y con la clase 'grande'", () => {
    setup({ state: grandeState() });
    renderRound(holder.s);
    reveal();
    expect($("numero-gigante").textContent).toBe("4.500.000");
    expect($("numero-gigante").classList.contains("grande")).toBe(true);
    expect($("numero-ronda").textContent).toBe("Ronda 1 · Números grandes");
  });

  it("rango chico: sin clase 'grande' y sin formato", () => {
    setup();
    renderRound(baseState());
    reveal();
    expect($("numero-gigante").textContent).toBe("18");
    expect($("numero-gigante").classList.contains("grande")).toBe(false);
  });

  it("una sala vieja sin numeroRange ni round.range se comporta como chico", () => {
    setup();
    renderRound(baseState());
    reveal();
    expect($("numero-gigante").classList.contains("grande")).toBe(false);
    expect($("numero-ronda").textContent).toContain("chicos");
  });

  it("la hoja del host muestra los números ajenos formateados", () => {
    setup({ state: grandeState() });
    renderRound(holder.s);
    $("btn-numero-adivino").click();
    const rowOtro = document.querySelector(`.numero-sheet-row[data-pid="${OTRO}"] .numero-sheet-num`);
    expect(rowOtro.textContent).toBe("20.000");
  });

  it("cambiar numeroRange a mitad de ronda NO cambia el número en pantalla", () => {
    setup({ state: grandeState() });
    renderRound(holder.s);
    reveal();
    // el host pasa a "chico" para la próxima ronda; la ronda actual sigue siendo grande
    holder.s = grandeState({ numeroRange: "chico" });
    renderRound(holder.s);
    expect($("numero-gigante").textContent).toBe("4.500.000");
    expect($("numero-gigante").classList.contains("grande")).toBe(true);
  });

  it("el toggle del host marca como activo el rango de la próxima ronda", () => {
    setup({ state: grandeState({ numeroRange: "chico" }) });
    renderRound(holder.s);
    const active = document.querySelector("#numero-range-host .numero-range-btn.active");
    expect(active.dataset.range).toBe("chico");
  });

  it("el toggle durante la ronda es visible solo para el host", () => {
    setup({ state: grandeState() });
    renderRound(holder.s);
    expect($("numero-range-host").style.display).toBe("flex");

    setup({ isHost: false, myId: OTRO, state: grandeState() });
    renderRound(holder.s);
    expect($("numero-range-host").style.display).toBe("none");
  });

  it("entre rondas: el toggle es solo del host y la descripción cambia con el rango", () => {
    setup();
    renderBetween(baseState({ numeroRound: null, numeroRange: "grande" }));
    expect($("numero-range-between").style.display).toBe("flex");
    expect($("numero-between-desc").textContent).toContain("100 millones");

    setup({ isHost: false, myId: OTRO });
    renderBetween(baseState({ numeroRound: null }));
    expect($("numero-range-between").style.display).toBe("none");
    expect($("numero-between-desc").textContent).toContain("1 al 99");
  });

  it("tocar 'Grandes' escribe numeroRange en Firebase", () => {
    setup();
    renderBetween(baseState({ numeroRound: null }));
    document.querySelector("#numero-range-between .numero-range-btn[data-range='grande']").click();
    expect(update).toHaveBeenCalledWith({}, { numeroRange: "grande" });
  });

  it("un jugador que no es host no puede cambiar el rango", () => {
    setup({ isHost: false, myId: OTRO });
    renderBetween(baseState({ numeroRound: null }));
    document.querySelector("#numero-range-between .numero-range-btn[data-range='grande']").click();
    expect(update).not.toHaveBeenCalled();
  });
});
