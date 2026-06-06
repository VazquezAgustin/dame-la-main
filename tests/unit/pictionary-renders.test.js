// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mockear el SDK de Firebase desde CDN (no se puede importar en Node)
vi.mock("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js", () => ({
  ref: () => ({}),
  update: vi.fn(async () => {}),
  serverTimestamp: () => 0,
  runTransaction: vi.fn(async () => {}),
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

import PictionaryGame, {
  _setTestContext,
  renderBetweenRounds,
  renderRoundResult,
  renderDrawing,
} from "../../js/games/pictionary/index.js";

const HOST = "p_host";
const ROOM = "TEST01";

function mountPanels() {
  document.body.innerHTML = `
    <div id="vista-tablero"></div>
    <div id="vista-ruleta"></div>
    <div id="vista-quien-es-main"></div>
    <div id="pregunta-overlay"></div>
    <div id="podio"></div>
    <button id="btn-jugar-nuevo"></button>
    <div id="vista-pictionary">
      <div id="picto-between" class="picto-panel">
        <div id="picto-ronda-info"></div>
        <div id="picto-next-player"></div>
        <button id="btn-picto-start-round">🎨 Comenzar ronda</button>
        <p id="picto-wait-host" style="display:none"></p>
      </div>
      <div id="picto-choose" class="picto-panel" style="display:none">
        <div id="picto-choose-title"></div>
        <p id="picto-choose-desc" style="display:none"></p>
        <div id="picto-word-choices"></div>
      </div>
      <div id="picto-active" class="picto-panel-wide" style="display:none">
        <div class="picto-topbar">
          <span id="picto-timer">—</span>
          <span id="picto-word-hint"></span>
          <span id="picto-drawer-badge"></span>
        </div>
        <div id="picto-canvas-wrap"><canvas id="picto-canvas"></canvas></div>
        <div id="picto-tools" style="display:none"></div>
        <div id="picto-chat"></div>
        <form id="picto-guess-form" style="display:none">
          <input type="text" id="picto-guess-input">
          <button type="submit" id="picto-guess-send">Enviar</button>
        </form>
      </div>
      <div id="picto-round-result" class="picto-panel" style="display:none">
        <div id="picto-result-word"></div>
        <div id="picto-result-list"></div>
        <button id="btn-picto-siguiente" style="display:none">Siguiente turno ▶</button>
        <p id="picto-wait-siguiente" style="display:none"></p>
      </div>
    </div>
  `;
  // jsdom no implementa getContext; devolvemos null para que el setup del
  // canvas salga limpio (el dibujo se saltea con guardas).
  HTMLCanvasElement.prototype.getContext = () => null;
}

function makeCtx({ isHost = true, myId = HOST, state = null } = {}) {
  return {
    getMyPlayerId: () => myId,
    getRoomCode:   () => ROOM,
    getIsHost:     () => isHost,
    getState:      () => state,
    triggerFlash:  vi.fn(),
  };
}

function stateBetween() {
  return {
    hostId: HOST,
    players: { [HOST]: { name: "Agus", score: 0, connected: true } },
    playerOrder: [HOST],
    selectorIndex: 0,
    roundsCompleted: 0,
    pictionaryConfig: { roundsPerPlayer: 2, drawSeconds: 80, categoria: "mixto" },
  };
}

function stateDrawing({ myId = HOST, guessed = {} } = {}) {
  return {
    hostId: HOST,
    players: {
      [HOST]: { name: "Agus", score: 0, connected: true },
      p_a:    { name: "Marcos", score: 0, connected: true },
      p_b:    { name: "Sofía", score: 0, connected: true },
    },
    playerOrder: [HOST, "p_a", "p_b"],
    selectorIndex: 0,
    pictionaryConfig: { roundsPerPlayer: 2, drawSeconds: 80, categoria: "mixto" },
    currentRound: {
      drawerId: HOST,
      word: "jirafa",
      phase: "drawing",
      startedAt: Date.now(),
      strokeSeq: 0,
      guessed,
      chat: {},
    },
    __myId: myId,
  };
}

function stateRoundFinished() {
  return {
    hostId: HOST,
    players: {
      [HOST]: { name: "Agus", score: 0, connected: true },
      p_a:    { name: "Marcos", score: 165, connected: true },
      p_b:    { name: "Sofía", score: 0, connected: true },
    },
    playerOrder: [HOST, "p_a", "p_b"],
    currentRound: {
      drawerId: HOST,
      word: "jirafa",
      phase: "finished",
      guessed: { p_a: { order: 0, points: 165 } },
    },
  };
}

afterEach(() => {
  PictionaryGame.cleanup();
});

describe("renderBetweenRounds — gating de host", () => {
  beforeEach(() => mountPanels());

  it("re-habilita y muestra el botón para el host", () => {
    _setTestContext(makeCtx());
    const btn = document.getElementById("btn-picto-start-round");
    btn.disabled = true;
    renderBetweenRounds(stateBetween());
    expect(btn.disabled).toBe(false);
    expect(btn.style.display).toBe("block");
  });

  it("oculta el botón si no soy host", () => {
    _setTestContext(makeCtx({ isHost: false, myId: "p_other" }));
    const btn = document.getElementById("btn-picto-start-round");
    renderBetweenRounds(stateBetween());
    expect(btn.style.display).toBe("none");
    expect(document.getElementById("picto-wait-host").style.display).toBe("block");
  });
});

describe("renderDrawing — chat y gating del formulario", () => {
  beforeEach(() => mountPanels());

  it("el chat muestra '¡acertó!' sin revelar la palabra", () => {
    const s = stateDrawing({ myId: "p_a" });
    s.currentRound.chat = {
      k1: { playerId: "p_a", correct: true, ts: 1 },
      k2: { playerId: "p_b", text: "perro", correct: false, ts: 2 },
    };
    _setTestContext(makeCtx({ isHost: false, myId: "p_a", state: s }));
    renderDrawing(s);
    const html = document.getElementById("picto-chat").innerHTML;
    expect(html).toContain("acertó");
    expect(html).not.toContain("jirafa");  // la palabra nunca aparece en el chat
    expect(html).toContain("perro");        // los errados sí se muestran
  });

  it("escapa el HTML de las adivinanzas erradas", () => {
    const s = stateDrawing({ myId: "p_a" });
    s.currentRound.chat = { k1: { playerId: "p_a", text: "<img src=x>", correct: false, ts: 1 } };
    _setTestContext(makeCtx({ isHost: false, myId: "p_a", state: s }));
    renderDrawing(s);
    const html = document.getElementById("picto-chat").innerHTML;
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x>");
  });

  it("muestra el formulario a un guesser que no acertó", () => {
    const s = stateDrawing({ myId: "p_a" });
    _setTestContext(makeCtx({ isHost: false, myId: "p_a", state: s }));
    renderDrawing(s);
    expect(document.getElementById("picto-guess-form").style.display).toBe("flex");
    // el guesser ve la palabra enmascarada, no la real
    expect(document.getElementById("picto-word-hint").textContent).toBe("______");
  });

  it("oculta el formulario para el dibujante (y le muestra la palabra)", () => {
    const s = stateDrawing({ myId: HOST });
    _setTestContext(makeCtx({ isHost: true, myId: HOST, state: s }));
    renderDrawing(s);
    expect(document.getElementById("picto-guess-form").style.display).toBe("none");
    expect(document.getElementById("picto-tools").style.display).toBe("flex");
    expect(document.getElementById("picto-word-hint").textContent).toBe("jirafa");
  });

  it("oculta el formulario para quien ya acertó", () => {
    const s = stateDrawing({ myId: "p_a", guessed: { p_a: { order: 0, points: 100 } } });
    _setTestContext(makeCtx({ isHost: false, myId: "p_a", state: s }));
    renderDrawing(s);
    expect(document.getElementById("picto-guess-form").style.display).toBe("none");
  });
});

describe("renderRoundResult", () => {
  beforeEach(() => mountPanels());

  it("revela la palabra y lista acertantes; botón siguiente para el host", () => {
    _setTestContext(makeCtx());
    renderRoundResult(stateRoundFinished());
    expect(document.getElementById("picto-result-word").innerHTML).toContain("jirafa");
    const list = document.getElementById("picto-result-list").innerHTML;
    expect(list).toContain("Marcos");
    expect(list).toContain("165");
    expect(list).toContain("Sofía");   // no acertó → aparece como pendiente
    const btn = document.getElementById("btn-picto-siguiente");
    expect(btn.style.display).toBe("block");
    expect(btn.disabled).toBe(false);
  });
});
