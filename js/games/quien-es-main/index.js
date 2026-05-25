import { pickFamosos } from "./famosos.js";
import {
  calcRoundScore, isGameOver, nextSelectorIndex, buildQuienInitialState,
} from "./logica.js";
import { db } from "../../firebase.js";
import {
  ref, update, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { requestMotionPermission, onTilt, lockOrientation, unlockOrientation } from "../../motion.js";
import { playCorrect, playIncorrect, playTick } from "../../audio.js";

// ── Contexto inyectado por main.js via initGame() ────────────────
let _ctx = null;
const myPlayerId  = () => _ctx.getMyPlayerId();
const getRoomCode = () => _ctx.getRoomCode();
const isHost      = () => _ctx.getIsHost();

// ── Estado de timers ─────────────────────────────────────────────
let _timerInterval  = null;
let _tiltCleanup    = null;
let _tiltInFlight   = false;
let _motionGranted  = false;
let _lastTimerTick  = -1;

function _clearTimers() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  if (_tiltCleanup)   { _tiltCleanup(); _tiltCleanup = null; }
  _tiltInFlight = false;
  _lastTimerTick = -1;
  // Liberar la orientación al salir de la vista activa (entre-rondas,
  // ready, resultado de ronda y cleanup todos pasan por acá).
  unlockOrientation();
}

// ── Inline DAO — operaciones Firebase específicas de este juego ──
const _rRef = (code) => ref(db, `rooms/${code}`);

async function _daoStartRound(roomCode, activePlayerId, famosos, selectorIndex) {
  await update(_rRef(roomCode), {
    currentRound: {
      activePlayerId,
      famosos,
      currentIndex: 0,
      startedAt: null,
      phase: "ready",
      results: null,
    },
    selectorIndex,
  });
}

async function _daoBeginRound(roomCode) {
  await update(_rRef(roomCode), {
    "currentRound/startedAt": serverTimestamp(),
    "currentRound/phase": "active",
  });
}

async function _daoRecordResult(roomCode, index, famoso, result, nextIndex) {
  await update(_rRef(roomCode), {
    [`currentRound/results/${index}`]: { famoso, result },
    "currentRound/currentIndex": nextIndex,
  });
}

async function _daoTimeExpired(roomCode) {
  await update(_rRef(roomCode), { "currentRound/phase": "finished" });
}

async function _daoNextRound(roomCode, nextSelectorIndex, roundsCompleted, activePid, ptsToAdd, isGameOver) {
  const updates = {
    currentRound: null,
    selectorIndex: nextSelectorIndex,
    roundsCompleted,
    status: isGameOver ? "finished" : "playing",
  };
  if (activePid && ptsToAdd > 0) {
    const s = _ctx.getState();
    const currentScore = s.players?.[activePid]?.score || 0;
    updates[`players/${activePid}/score`] = currentScore + ptsToAdd;
  }
  await update(_rRef(roomCode), updates);
}

// ── Helpers de layout ────────────────────────────────────────────
function _showPanel(id) {
  ["quien-between", "quien-ready", "quien-active", "quien-passive", "quien-round-result"]
    .forEach(p => {
      const el = document.getElementById(p);
      if (el) el.style.display = (p === id) ? "flex" : "none";
    });
}

function _showQuienView() {
  ["vista-tablero", "vista-ruleta"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const overlay = document.getElementById("pregunta-overlay");
  if (overlay) overlay.classList.remove("visible");
  const quienEl = document.getElementById("vista-quien-es-main");
  if (quienEl) quienEl.style.display = "flex";
}

function _getActiveName(s) {
  const pid = s.currentRound?.activePlayerId;
  return s.players?.[pid]?.name || "?";
}

// Pinta la pantalla del jugador activo de verde (correcto) o rojo (paso)
// durante ~0.5s. La animación se reinicia removiendo la clase y forzando
// reflow antes de re-aplicarla, así dos tilts seguidos vuelven a flashear.
function _flashScreen(kind) {
  const el = document.getElementById("quien-flash");
  if (!el) return;
  el.classList.remove("correcto", "paso");
  // forzar reflow para reiniciar la animación CSS
  void el.offsetWidth;
  el.classList.add(kind);
}

// ── Renders ──────────────────────────────────────────────────────

export function _setTestContext(ctx) { _ctx = ctx; }

export function renderBetweenRounds(s) {
  _showQuienView();
  _showPanel("quien-between");
  _clearTimers();

  const order          = s.playerOrder || [];
  const config         = s.quienConfig || {};
  const roundsPerPlayer= config.roundsPerPlayer || 2;
  const totalRounds    = roundsPerPlayer * order.length;
  const done           = s.roundsCompleted || 0;
  const selectorIdx    = s.selectorIndex ?? 0;
  const activePid      = order[selectorIdx % order.length];
  const activeName     = s.players?.[activePid]?.name || "?";
  const amIActive      = activePid === myPlayerId();

  document.getElementById("quien-ronda-info").textContent =
    `Ronda ${done + 1} de ${totalRounds}`;

  document.getElementById("quien-next-player").innerHTML = `
    <div class="quien-next-avatar">${activeName[0].toUpperCase()}</div>
    <div class="quien-next-name">${amIActive ? "¡Es tu turno!" : `Turno de <strong>${activeName}</strong>`}</div>
  `;

  const btnStart  = document.getElementById("btn-quien-start-round");
  const waitHost  = document.getElementById("quien-wait-host");
  if (isHost()) {
    btnStart.style.display = "block";
    btnStart.disabled      = false;
    waitHost.style.display = "none";
    btnStart.onclick = () => _handleStartRound(s);
  } else {
    btnStart.style.display = "none";
    waitHost.style.display = "block";
  }
}

export function renderReady(s) {
  _showQuienView();
  _showPanel("quien-ready");
  _clearTimers();

  const amIActive  = s.currentRound?.activePlayerId === myPlayerId();
  const activeName = _getActiveName(s);

  document.getElementById("quien-ready-desc").textContent = amIActive
    ? "Sostené el celular en horizontal sobre tu frente, con la pantalla hacia tus amigos. Inclinálo hacia adelante si adivinaste, hacia atrás si pasás."
    : `${activeName} va a adivinar. Preparate para dar pistas cuando veas la pantalla.`;

  const btn = document.getElementById("btn-quien-begin");
  btn.style.display = amIActive ? "block" : "none";
  if (amIActive) btn.disabled = false;
}

function renderActive(s) {
  _showQuienView();

  const round      = s.currentRound;
  const config     = s.quienConfig || {};
  const famosos    = round.famosos || [];
  const curIdx     = round.currentIndex ?? 0;
  const duration   = config.roundDuration || 60;
  const amIActive  = round.activePlayerId === myPlayerId();
  const results    = round.results || {};

  if (amIActive) {
    _showPanel("quien-active");

    document.getElementById("quien-famoso").textContent = famosos[curIdx] || "—";

    const correct = Object.values(results).filter(r => r.result === "correcto").length;
    const paso    = Object.values(results).filter(r => r.result === "paso").length;
    document.getElementById("quien-score-live").textContent = `✓ ${correct}   ✗ ${paso}`;

    _startActiveTimer(duration);
    _setupTilt(s);
  } else {
    _showPanel("quien-passive");
    document.getElementById("quien-passive-title").textContent =
      `🎭 ${_getActiveName(s)} está adivinando`;
    _renderPassiveResults(s);
    _startPassiveTimer(s, duration);
  }
}

function _renderPassiveResults(s) {
  const results = s.currentRound?.results || {};
  const el = document.getElementById("quien-results-live");
  if (!el) return;
  const entries = Object.entries(results).sort((a, b) => +a[0] - +b[0]);
  el.innerHTML = entries.map(([, r]) =>
    `<div class="quien-result-item ${r.result}">${r.result === "correcto" ? "✓" : "✗"} ${r.famoso}</div>`
  ).join("");
}

export function renderRoundResult(s) {
  _showQuienView();
  _showPanel("quien-round-result");
  _clearTimers();

  const round      = s.currentRound;
  const activePid  = round?.activePlayerId;
  const activeName = s.players?.[activePid]?.name || "?";
  const famosos    = round?.famosos || [];
  const results    = round?.results || {};

  const correct = Object.values(results).filter(r => r.result === "correcto").length;
  const paso    = Object.values(results).filter(r => r.result === "paso").length;
  const pts     = correct * 100;

  document.getElementById("quien-result-player").textContent = activeName;
  document.getElementById("quien-result-stats").innerHTML =
    `✓ ${correct} correctos &nbsp;·&nbsp; ✗ ${paso} pasos &nbsp;·&nbsp; +${pts} pts`;

  const reached    = Object.keys(results).length;
  const entries    = Object.entries(results).sort((a, b) => +a[0] - +b[0]);
  const notReached = famosos.slice(reached);

  document.getElementById("quien-result-list").innerHTML =
    entries.map(([, r]) =>
      `<div class="quien-result-item ${r.result}">${r.result === "correcto" ? "✓" : "✗"} ${r.famoso}</div>`
    ).join("") +
    notReached.map(f =>
      `<div class="quien-result-item notime">— ${f}</div>`
    ).join("");

  const btnSig  = document.getElementById("btn-quien-siguiente");
  const waitSig = document.getElementById("quien-wait-siguiente");
  if (isHost()) {
    btnSig.style.display  = "block";
    btnSig.disabled       = false;
    waitSig.style.display = "none";
    btnSig.onclick = () => _handleSiguiente(s);
  } else {
    btnSig.style.display  = "none";
    waitSig.style.display = "block";
  }
}

function renderGameFinished(s) {
  const podio = document.getElementById("podio");
  if (!podio) return;

  const order   = s.playerOrder || [];
  const players = s.players || {};
  const sorted  = [...order].sort((a, b) => (players[b]?.score || 0) - (players[a]?.score || 0));
  const medals  = ["🥇", "🥈", "🥉"];

  podio.innerHTML = sorted.map((pid, i) => {
    const p    = players[pid];
    const isMe = pid === myPlayerId();
    return `
      <div class="podio-item${i === 0 ? " winner" : ""}">
        <span class="podio-medalla">${medals[i] || (i + 1)}</span>
        <div class="podio-avatar">${(p?.name || "?")[0].toUpperCase()}</div>
        <span class="podio-nombre">${p?.name || "?"}${isMe ? " (tú)" : ""}</span>
        <span class="podio-puntos">${p?.score || 0} pts</span>
      </div>
    `;
  }).join("");

  const btnNuevo = document.getElementById("btn-jugar-nuevo");
  if (btnNuevo) {
    btnNuevo.style.display = isHost() ? "block" : "none";
    btnNuevo.onclick = () => {
      localStorage.removeItem("roomCode");
      location.reload();
    };
  }
}

// ── Timers ───────────────────────────────────────────────────────

function _startActiveTimer(duration) {
  if (_timerInterval) return;
  _timerInterval = setInterval(() => {
    const round = _ctx.getState()?.currentRound;
    if (!round || round.phase !== "active" || !round.startedAt) return;
    const elapsed   = Math.floor((Date.now() - round.startedAt) / 1000);
    const remaining = Math.max(0, duration - elapsed);

    const el = document.getElementById("quien-active-timer");
    if (el) {
      el.textContent = remaining + "s";
      el.classList.toggle("urgente", remaining <= 10);
    }
    if (remaining > 0 && remaining <= 10 && remaining !== _lastTimerTick) {
      _lastTimerTick = remaining;
      playTick();
    }

    if (remaining <= 0) {
      _clearTimers();
      _daoTimeExpired(getRoomCode()).catch(() => {});
    }
  }, 300);
}

function _startPassiveTimer(s, duration) {
  if (_timerInterval) return;
  _timerInterval = setInterval(() => {
    const state = _ctx.getState();
    const round = state?.currentRound;
    if (!round || round.phase !== "active") return;

    _renderPassiveResults(state);

    if (!round.startedAt) return;
    const elapsed   = Math.floor((Date.now() - round.startedAt) / 1000);
    const remaining = Math.max(0, duration - elapsed);

    const el = document.getElementById("quien-timer-big");
    if (el) {
      el.textContent = remaining + "s";
      el.classList.toggle("urgente", remaining <= 10);
    }

    if (remaining > 0 && remaining <= 10 && remaining !== _lastTimerTick) {
      _lastTimerTick = remaining;
      playTick();
    }

    // Host fallback if active player disconnected
    if (remaining <= 0 && isHost() && round.phase === "active") {
      _clearTimers();
      _daoTimeExpired(getRoomCode()).catch(() => {});
    }
  }, 300);
}

// ── Tilt ─────────────────────────────────────────────────────────

function _setupTilt(s) {
  if (_tiltCleanup) return;

  _tiltCleanup = onTilt(async ({ up, down }) => {
    if (_tiltInFlight) return;
    const state = _ctx.getState();
    const round = state?.currentRound;
    if (!round || round.phase !== "active") return;
    if (round.activePlayerId !== myPlayerId()) return;

    const index  = round.currentIndex ?? 0;
    const famosos = round.famosos || [];
    if (index >= famosos.length) return;

    _tiltInFlight = true;
    const famoso    = famosos[index];
    const result    = up ? "correcto" : "paso";
    const nextIndex = index + 1;
    const isLast    = nextIndex >= famosos.length;

    if (up) playCorrect(); else playIncorrect();
    _flashScreen(up ? "correcto" : "paso");

    // Optimistic local update
    const famEl = document.getElementById("quien-famoso");
    if (famEl && !isLast) famEl.textContent = famosos[nextIndex] || "—";

    const scoreEl = document.getElementById("quien-score-live");
    if (scoreEl) {
      const results = { ...round.results };
      results[index] = { famoso, result };
      const c = Object.values(results).filter(r => r.result === "correcto").length;
      const p = Object.values(results).filter(r => r.result === "paso").length;
      scoreEl.textContent = `✓ ${c}   ✗ ${p}`;
    }

    try {
      await _daoRecordResult(getRoomCode(), index, famoso, result, nextIndex);
      if (isLast) await _daoTimeExpired(getRoomCode());
    } catch (e) {
      console.error("Error recording tilt:", e);
    } finally {
      _tiltInFlight = false;
    }
  });
}

// ── Action handlers ──────────────────────────────────────────────

async function _handleStartRound(s) {
  const btn = document.getElementById("btn-quien-start-round");
  if (btn) btn.disabled = true;
  try {
    const order      = s.playerOrder || [];
    const selectorIdx= s.selectorIndex ?? 0;
    const activePid  = order[selectorIdx % order.length];
    const config     = s.quienConfig || {};
    const famosos    = pickFamosos(config.famososPerRound || 8);
    await _daoStartRound(getRoomCode(), activePid, famosos, selectorIdx);
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

async function _handleBeginRound() {
  const btn = document.getElementById("btn-quien-begin");
  if (btn) btn.disabled = true;
  try {
    const perm = await requestMotionPermission();
    _motionGranted = perm === "granted";
    await _daoBeginRound(getRoomCode());
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

async function _handleSiguiente(s) {
  const btn = document.getElementById("btn-quien-siguiente");
  if (btn) btn.disabled = true;
  try {
    const order          = s.playerOrder || [];
    const config         = s.quienConfig || {};
    const doneNow        = (s.roundsCompleted || 0) + 1;
    const gameOver       = isGameOver(doneNow, config.roundsPerPlayer || 2, order.length);

    const round     = s.currentRound;
    const activePid = round?.activePlayerId;
    const pts       = calcRoundScore(round?.results);

    const nextIdx = nextSelectorIndex(s.selectorIndex, order.length);
    await _daoNextRound(getRoomCode(), nextIdx, doneNow, activePid, pts, gameOver);
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

// ── Module export ────────────────────────────────────────────────

export default {
  id:          "quien-es-main",
  displayName: "¿Quién es Main?",
  description: "Heads Up de famosos — adivina con pistas de tus amigos",
  minPlayers:  2,

  initGame(ctx) {
    _ctx = ctx;

    // Sliders de configuración en el form de crear sala
    document.getElementById("quien-rounds-slider")?.addEventListener("input", e => {
      const el = document.getElementById("quien-rounds-value");
      if (el) el.textContent = e.target.value;
    });
    document.getElementById("quien-famosos-slider")?.addEventListener("input", e => {
      const el = document.getElementById("quien-famosos-value");
      if (el) el.textContent = e.target.value;
    });
    document.getElementById("quien-duration-slider")?.addEventListener("input", e => {
      const el = document.getElementById("quien-duration-value");
      if (el) el.textContent = e.target.value + "s";
    });

    // Botón de empezar ronda (active player)
    document.getElementById("btn-quien-begin")?.addEventListener("click", _handleBeginRound);
  },

  buildInitialState(config) {
    return buildQuienInitialState(config);
  },

  render(s) {
    if (s.status === "finished") {
      renderGameFinished(s);
      return;
    }
    if (!s.currentRound) {
      renderBetweenRounds(s);
      return;
    }
    const phase = s.currentRound.phase;
    if (phase === "ready")    renderReady(s);
    else if (phase === "active")   renderActive(s);
    else if (phase === "finished") renderRoundResult(s);
  },

  cleanup() {
    _clearTimers();
    _motionGranted = false;
  },
};
