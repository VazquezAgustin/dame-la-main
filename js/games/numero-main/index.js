import {
  assignNumbersByRange, pointsForPosition, guessedCount, allGuessed, buildNumeroInitialState,
  normalizeRange, formatNumero,
} from "./logica.js";
import { db, GameDAO } from "../../firebase.js";
import { ref, update, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { esc } from "../../logica.js";
import { playTick } from "../../audio.js";

// Segundos de cuenta regresiva entre tocar la cobertura y mostrar el número
export const COUNTDOWN_SECONDS = 3;

// ── Contexto inyectado por main.js via initGame() ────────────────
let _ctx = null;
const myPlayerId  = () => _ctx.getMyPlayerId();
const getRoomCode = () => _ctx.getRoomCode();
const isHost      = () => _ctx.getIsHost();
const _esActivo   = () => _ctx.getState()?.gameType === "numero-main";

// ── Estado local de UI (NO va a Firebase) ────────────────────────
let _revealedRound = -1;   // ronda para la que este jugador ya tocó la cobertura
let _sheetOpen     = false;
let _lastKey       = null; // dirty-check del render
let _wakeLock      = null;
let _countdownRound = -1;  // ronda para la que corre la cuenta regresiva (-1 = ninguna)
let _countdownLeft  = 0;
let _countdownTimer = null;

export function _setTestContext(ctx) { _ctx = ctx; }
export function _resetTestState() {
  _clearCountdown();
  _revealedRound = -1; _sheetOpen = false; _lastKey = null; _wakeLock = null;
}

// ── Cuenta regresiva local: tocar la cobertura → 3·2·1 → número ──
function _clearCountdown() {
  if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
  _countdownRound = -1;
  _countdownLeft  = 0;
}

function _startCountdown(roundNum) {
  if (_countdownTimer) return;
  _countdownRound = roundNum;
  _countdownLeft  = COUNTDOWN_SECONDS;
  _rerender();
  _countdownTimer = setInterval(() => {
    _countdownLeft--;
    if (_countdownLeft <= 0) {
      _clearCountdown();
      _revealedRound = roundNum;
      _rerender();
      return;
    }
    try { playTick(); } catch (_) {}
    try { navigator.vibrate?.(60); } catch (_) {}
    _rerender();
  }, 1000);
}

// ── Inline DAO — operaciones Firebase específicas de este juego ──
const _rRef = (code) => ref(db, `rooms/${code}`);

// El rango se guarda dentro de la ronda: el número en pantalla no cambia si el host toca el toggle a mitad de ronda.
async function _daoNewRound(roomCode, numbers, roundNumber, range) {
  await update(_rRef(roomCode), {
    numeroRound: { numbers, guessed: null, range },
    numeroRoundNumber: roundNumber,
  });
}

// Cambia el tamaño de los números. Aplica desde la próxima ronda que se reparta.
async function _daoSetRange(roomCode, range) {
  await update(_rRef(roomCode), { numeroRange: range });
}

// increment(): suma atómica en el servidor
async function _daoMarkGuessed(roomCode, pid, position, points) {
  await update(_rRef(roomCode), {
    [`numeroRound/guessed/${pid}`]: { position, points },
    [`players/${pid}/score`]: increment(points),
  });
}

// Deshacer un toque por error. No recalcula las posiciones de los demás.
async function _daoUnmarkGuessed(roomCode, pid, points) {
  await update(_rRef(roomCode), {
    [`numeroRound/guessed/${pid}`]: null,
    [`players/${pid}/score`]: increment(-points),
  });
}

async function _daoFinish(roomCode) {
  await update(_rRef(roomCode), { status: "finished" });
}

// ── Wake lock: la pantalla no se apaga mientras se muestra el número ──
async function _acquireWakeLock() {
  if (_wakeLock || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
  try {
    _wakeLock = await navigator.wakeLock.request("screen");
    _wakeLock.addEventListener("release", () => { _wakeLock = null; });
  } catch (_) { _wakeLock = null; }
}
function _releaseWakeLock() {
  try { _wakeLock?.release(); } catch (_) {}
  _wakeLock = null;
}

// ── Helpers de layout ────────────────────────────────────────────
function _show(id, visible, display = "block") {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? display : "none";
}

function _showNumeroView() {
  ["vista-tablero", "vista-ruleta", "vista-quien-es-main", "vista-pictionary", "vista-tipo-main"].forEach(id => _show(id, false));
  const overlay = document.getElementById("pregunta-overlay");
  if (overlay) overlay.classList.remove("visible");
  _show("vista-numero-main", true, "flex");
}

// Texto de ayuda según el rango (pantalla "entre rondas")
const RANGE_DESC = {
  chico:  "Cada uno recibe un número del 1 al 99. Mostralo a los demás sin mirarlo y adivinalo haciendo preguntas de sí o no.",
  grande: "Cada uno recibe una cifra de hasta 100 millones (pensala como plata). Mostrala a los demás sin mirarla y adivinala preguntando, por ejemplo: «¿me alcanza para un auto?».",
};
const RANGE_NAME = { chico: "chicos", grande: "grandes" };

// Marca como activo el botón del rango vigente en los toggles del host
function _syncRangeButtons(range) {
  document.querySelectorAll(".numero-range-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.range === range));
}

function _rerender() {
  _lastKey = null;
  const s = _ctx.getState();
  if (s) renderCurrent(s);
}

// ── Renders ──────────────────────────────────────────────────────
export function renderBetween(s) {
  _showNumeroView();
  _show("numero-between", true, "flex");
  _show("numero-round", false);
  _releaseWakeLock();

  const range = normalizeRange(s.numeroRange);
  const key = JSON.stringify({ mode: "between", host: isHost(), range });
  if (key === _lastKey) return;
  _lastKey = key;

  const desc = document.getElementById("numero-between-desc");
  if (desc) desc.textContent = RANGE_DESC[range];
  _show("numero-range-between", isHost(), "flex");
  _syncRangeButtons(range);

  _show("btn-numero-repartir", isHost());
  _show("numero-wait-host", !isHost());
}

export function renderRound(s) {
  _showNumeroView();
  _show("numero-between", false);
  _show("numero-round", true, "flex");

  const round    = s.numeroRound;
  const order    = s.playerOrder || [];
  const players  = s.players || {};
  const me       = myPlayerId();
  const host     = isHost();
  const roundNum = s.numeroRoundNumber || 0;
  const numbers  = round.numbers || {};
  const guessed  = round.guessed || {};
  const revealed = _revealedRound === roundNum;
  const sheetOpen = host && _sheetOpen;
  // Rango de ESTA ronda (para mostrar) y rango vigente para la próxima (toggle del host)
  const roundRange = normalizeRange(round.range);
  const nextRange  = normalizeRange(s.numeroRange);

  // Si el host repartió una ronda nueva a mitad de la cuenta, se cancela
  if (_countdownRound !== -1 && _countdownRound !== roundNum) _clearCountdown();
  const countingDown = _countdownRound === roundNum && !revealed;

  const key = JSON.stringify({
    mode: "round", roundNum, numbers, guessed, order,
    names: order.map(pid => players[pid]?.name), host, revealed, sheetOpen,
    countdown: countingDown ? _countdownLeft : null,
    roundRange, nextRange,
  });
  if (key === _lastKey) return;
  _lastKey = key;

  const myNumber = numbers[me];
  const myGuess  = guessed[me];

  document.getElementById("numero-ronda").textContent = `Ronda ${roundNum} · Números ${RANGE_NAME[roundRange]}`;
  _show("numero-range-host", host, "flex");
  _syncRangeButtons(nextRange);

  // Escenario del número propio
  const hasNumber = myNumber !== undefined;
  const showCount = hasNumber && !myGuess && countingDown;
  const showCover = hasNumber && !myGuess && !revealed && !showCount;
  const showNum   = hasNumber && (!!myGuess || revealed);

  _show("numero-cover", showCover, "flex");
  _show("numero-countdown", showCount, "flex");
  if (showCount) {
    const cEl = document.getElementById("numero-countdown-num");
    cEl.textContent = _countdownLeft;
    // reiniciar la animación de pulso en cada tick
    cEl.classList.remove("tick");
    void cEl.offsetWidth;
    cEl.classList.add("tick");
  }
  _show("numero-esperar", !hasNumber, "block");
  const numEl = document.getElementById("numero-gigante");
  numEl.style.display = showNum ? "block" : "none";
  if (showNum) {
    numEl.textContent = formatNumero(myNumber, roundRange);
    numEl.classList.toggle("grande", roundRange === "grande");
    numEl.classList.toggle("adivinado", !!myGuess);
  }
  const advEl = document.getElementById("numero-adivinado");
  advEl.style.display = myGuess ? "block" : "none";
  if (myGuess) advEl.textContent = `✓ ¡Adivinaste! ${myGuess.position}.º · +${myGuess.points}`;
  _show("btn-numero-ocultar", showNum && !myGuess);

  // Pantalla encendida solo mientras el número está visible
  if (showNum) _acquireWakeLock(); else _releaseWakeLock();

  // Controles del host
  _show("numero-host-bar", host, "flex");
  const btnNueva = document.getElementById("btn-numero-nueva-ronda");
  if (btnNueva) btnNueva.classList.toggle("pulse", allGuessed(order, guessed));

  // Hoja "¿Quién adivinó?" (solo host)
  _show("numero-sheet", sheetOpen, "flex");
  if (sheetOpen) {
    document.getElementById("numero-sheet-list").innerHTML = order.map(pid => {
      const p = players[pid];
      if (!p) return "";
      const g = guessed[pid];
      const numTxt = pid === me ? "?" : (formatNumero(numbers[pid], roundRange) || "—");
      return `
        <button type="button" class="numero-sheet-row${g ? " hecho" : ""}" data-pid="${esc(pid)}">
          <span class="numero-sheet-avatar">${esc((p.name || "?")[0].toUpperCase())}</span>
          <span class="numero-sheet-name">${esc(p.name || "?")}</span>
          <span class="numero-sheet-num">${esc(numTxt)}</span>
          <span class="numero-sheet-estado">${g ? `✓ ${g.position}.º · +${g.points}` : ""}</span>
        </button>`;
    }).join("");
  }
}

function renderCurrent(s) {
  if (!s.numeroRound) renderBetween(s); else renderRound(s);
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
        <div class="podio-avatar">${esc((p?.name || "?")[0].toUpperCase())}</div>
        <span class="podio-nombre">${esc(p?.name || "?")}${isMe ? " (tú)" : ""}</span>
        <span class="podio-puntos">${p?.score || 0} pts</span>
      </div>
    `;
  }).join("");

  const btnNuevo = document.getElementById("btn-jugar-nuevo");
  if (btnNuevo) {
    btnNuevo.style.display = isHost() ? "block" : "none";
    btnNuevo.onclick = _handleJugarNuevo;
  }
}

// ── Handlers ─────────────────────────────────────────────────────
async function _handleRepartir() {
  if (!isHost()) return;
  const s = _ctx.getState();
  const btnR = document.getElementById("btn-numero-repartir");
  const btnN = document.getElementById("btn-numero-nueva-ronda");
  [btnR, btnN].forEach(b => { if (b) b.disabled = true; });
  try {
    const order    = s.playerOrder || [];
    const range    = normalizeRange(s.numeroRange);
    const numbers  = assignNumbersByRange(order, range);
    const roundNum = (s.numeroRoundNumber || 0) + 1;
    _sheetOpen = false;
    await _daoNewRound(getRoomCode(), numbers, roundNum, range);
  } catch (e) {
    console.error(e);
  } finally {
    [btnR, btnN].forEach(b => { if (b) b.disabled = false; });
  }
}

async function _handleNuevaRonda() {
  if (!isHost()) return;
  const s = _ctx.getState();
  const order = s.playerOrder || [];
  if (s.numeroRound && !allGuessed(order, s.numeroRound.guessed)) {
    if (!confirm("¿Repartir números nuevos? Hay jugadores que todavía no adivinaron.")) return;
  }
  await _handleRepartir();
}

async function _handleMarkGuessed(pid) {
  if (!isHost()) return;
  const s = _ctx.getState();
  const guessed = s?.numeroRound?.guessed || {};
  if (guessed[pid]) return;
  try {
    const position = guessedCount(guessed) + 1;
    const points   = pointsForPosition(position);
    await _daoMarkGuessed(getRoomCode(), pid, position, points);
    _ctx.triggerFlash("correcto");
  } catch (e) { console.error(e); }
}

async function _handleUnmarkGuessed(pid) {
  if (!isHost()) return;
  const s = _ctx.getState();
  const g = s?.numeroRound?.guessed?.[pid];
  if (!g) return;
  const name = s.players?.[pid]?.name || "este jugador";
  if (!confirm(`¿Desmarcar a ${name}?`)) return;
  try {
    await _daoUnmarkGuessed(getRoomCode(), pid, g.points || 0);
  } catch (e) { console.error(e); }
}

async function _handleSetRange(range) {
  if (!isHost()) return;
  const s = _ctx.getState();
  if (normalizeRange(s?.numeroRange) === range) return;
  try {
    await _daoSetRange(getRoomCode(), range);
  } catch (e) { console.error(e); }
}

async function _handleTerminar() {
  if (!isHost()) return;
  if (!confirm("¿Terminar la partida?")) return;
  const btn = document.getElementById("btn-numero-terminar");
  if (btn) btn.disabled = true;
  try {
    await _daoFinish(getRoomCode());
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

async function _handleJugarNuevo() {
  if (!isHost()) return;
  const s = _ctx.getState();
  const players = {};
  (s.playerOrder || []).forEach(pid => {
    const old = s.players?.[pid];
    if (old) players[pid] = { ...old, score: 0 };
  });
  try {
    _clearCountdown();
    _revealedRound = -1; _sheetOpen = false; _lastKey = null;
    await GameDAO.createRoom(getRoomCode(), {
      createdAt:   Date.now(),
      hostId:      myPlayerId(),
      status:      "lobby",
      ...buildNumeroInitialState({ numeroRange: s.numeroRange }),
      players,
      playerOrder: s.playerOrder || [],
    });
  } catch (e) { console.error(e); }
}

// ── Module export ────────────────────────────────────────────────
export default {
  id:          "numero-main",
  displayName: "¿Qué número soy?",
  description: "Adiviná tu número haciendo preguntas de sí o no",
  minPlayers:  2,

  initGame(ctx) {
    _ctx = ctx;
    const on = (id, fn) => document.getElementById(id)?.addEventListener("click", () => { if (_esActivo()) fn(); });

    on("btn-numero-repartir",     _handleRepartir);
    on("btn-numero-nueva-ronda",  _handleNuevaRonda);
    on("btn-numero-terminar",     _handleTerminar);
    on("btn-numero-adivino",      () => { _sheetOpen = true;  _rerender(); });
    on("btn-numero-sheet-cerrar", () => { _sheetOpen = false; _rerender(); });
    on("numero-cover", () => {
      const round = _ctx.getState()?.numeroRoundNumber;
      if (round === undefined) return;
      _startCountdown(round);
    });
    on("btn-numero-ocultar", () => { _clearCountdown(); _revealedRound = -1; _rerender(); });

    // Selector del tamaño de los números al crear la sala (pantalla de inicio, no depende del juego activo)
    document.querySelectorAll("#numero-range-selector .numero-range-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll("#numero-range-selector .numero-range-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
        const hint = document.getElementById("numero-range-hint");
        if (hint) hint.textContent = opt.dataset.range === "grande"
          ? "Cada jugador recibe una cifra de hasta 100 millones, que solo ven los demás. Preguntá cosas como «¿me alcanza para un auto?»."
          : "Cada jugador recibe un número del 1 al 99 que solo ven los demás. Adivinalo haciendo preguntas de sí o no.";
      });
    });

    // Toggles del host (entre rondas y durante la ronda): delegación
    document.getElementById("vista-numero-main")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".numero-range-btn");
      if (!btn || !_esActivo()) return;
      _handleSetRange(btn.dataset.range);
    });

    // Lista del sheet: delegación (se re-renderiza)
    document.getElementById("numero-sheet-list")?.addEventListener("click", (e) => {
      if (!_esActivo()) return;
      const row = e.target.closest(".numero-sheet-row");
      if (!row) return;
      const pid = row.dataset.pid;
      const g = _ctx.getState()?.numeroRound?.guessed?.[pid];
      if (g) _handleUnmarkGuessed(pid); else _handleMarkGuessed(pid);
    });

    // El navegador libera el wake lock al ocultar la pestaña: re-adquirirlo al volver
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && _esActivo()) _rerenderForced();
    });
  },

  buildInitialState(config) {
    return buildNumeroInitialState(config);
  },

  render(s) {
    if (s.status === "finished") { _clearCountdown(); _releaseWakeLock(); renderGameFinished(s); return; }
    renderCurrent(s);
  },

  cleanup() {
    _clearCountdown();
    _releaseWakeLock();
  },
};

function _rerenderForced() { _rerender(); }
