// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

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
vi.mock("../../js/audio.js", () => ({
  playCorrect:   vi.fn(),
  playIncorrect: vi.fn(),
  playTick:      vi.fn(),
}));

import {
  _setTestContext,
  renderBetweenRounds,
  renderReady,
  renderRoundResult,
} from "../../js/games/quien-es-main/index.js";

const HOST = "p_host";
const ROOM = "TEST01";

function mountPanels() {
  // Estructura mínima requerida por los renders, copiada de index.html.
  document.body.innerHTML = `
    <div id="vista-tablero"></div>
    <div id="vista-ruleta"></div>
    <div id="pregunta-overlay"></div>
    <div id="vista-quien-es-main">
      <div id="quien-between" class="quien-panel">
        <div id="quien-ronda-info"></div>
        <div id="quien-next-player"></div>
        <button id="btn-quien-start-round">🎯 Comenzar ronda</button>
        <p id="quien-wait-host" style="display:none"></p>
      </div>
      <div id="quien-ready" class="quien-panel" style="display:none">
        <p id="quien-ready-desc"></p>
        <button id="btn-quien-begin">▶ ¡Empezar!</button>
      </div>
      <div id="quien-active" style="display:none">
        <div id="quien-famoso"></div>
        <div id="quien-score-live"></div>
      </div>
      <div id="quien-passive" style="display:none">
        <div id="quien-passive-title"></div>
        <div id="quien-timer-big"></div>
        <div id="quien-results-live"></div>
      </div>
      <div id="quien-round-result" style="display:none">
        <div id="quien-result-player"></div>
        <div id="quien-result-stats"></div>
        <div id="quien-result-list"></div>
        <button id="btn-quien-siguiente" style="display:none">Siguiente ▶</button>
        <p id="quien-wait-siguiente" style="display:none"></p>
      </div>
    </div>
  `;
}

function makeCtx({ isHost = true, myId = HOST, state = null } = {}) {
  return {
    getMyPlayerId: () => myId,
    getRoomCode:   () => ROOM,
    getIsHost:     () => isHost,
    getState:      () => state,
  };
}

function stateBetweenRounds() {
  return {
    hostId: HOST,
    players: { [HOST]: { name: "Solo", score: 0, connected: true } },
    playerOrder: [HOST],
    selectorIndex: 0,
    roundsCompleted: 1,
    quienConfig: { roundsPerPlayer: 2, famososPerRound: 8, roundDuration: 60 },
  };
}

function stateReady() {
  return {
    hostId: HOST,
    players: { [HOST]: { name: "Solo", score: 0, connected: true } },
    playerOrder: [HOST],
    selectorIndex: 0,
    currentRound: {
      activePlayerId: HOST,
      famosos: ["Messi"],
      currentIndex: 0,
      phase: "ready",
    },
  };
}

function stateRoundFinished() {
  return {
    hostId: HOST,
    players: { [HOST]: { name: "Solo", score: 0, connected: true } },
    playerOrder: [HOST],
    currentRound: {
      activePlayerId: HOST,
      famosos: ["Messi", "Ronaldo"],
      currentIndex: 2,
      phase: "finished",
      results: {
        0: { famoso: "Messi",   result: "correcto" },
        1: { famoso: "Ronaldo", result: "paso" },
      },
    },
  };
}

describe("Renders re-habilitan botones disabled (bug del juego solo)", () => {
  beforeEach(() => {
    mountPanels();
    _setTestContext(makeCtx());
  });

  it("renderBetweenRounds re-habilita btn-quien-start-round", () => {
    const btn = document.getElementById("btn-quien-start-round");
    btn.disabled = true; // simulamos click previo que lo dejó disabled

    renderBetweenRounds(stateBetweenRounds());

    expect(btn.disabled).toBe(false);
    expect(btn.style.display).toBe("block");
  });

  it("renderReady re-habilita btn-quien-begin para el jugador activo", () => {
    const btn = document.getElementById("btn-quien-begin");
    btn.disabled = true;

    renderReady(stateReady());

    expect(btn.disabled).toBe(false);
    expect(btn.style.display).toBe("block");
  });

  it("renderRoundResult re-habilita btn-quien-siguiente", () => {
    const btn = document.getElementById("btn-quien-siguiente");
    btn.disabled = true;

    renderRoundResult(stateRoundFinished());

    expect(btn.disabled).toBe(false);
    expect(btn.style.display).toBe("block");
  });

  it("renderBetweenRounds no re-habilita el botón si no soy host", () => {
    _setTestContext(makeCtx({ isHost: false, myId: "p_other" }));
    const btn = document.getElementById("btn-quien-start-round");
    btn.disabled = true;

    renderBetweenRounds(stateBetweenRounds());

    // No-host no ve el botón → mantener disabled está OK, lo importante es que no se muestra
    expect(btn.style.display).toBe("none");
  });
});
