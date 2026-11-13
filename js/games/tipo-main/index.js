import {
  assignPalabras, pointsForPosition, guessedCount, allGuessed, buildTipoInitialState,
} from "./logica.js";
import { poolForPack } from "./palabras.js";
import { db, GameDAO } from "../../firebase.js";
import { ref, update, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { esc } from "../../logica.js";
import { playTick } from "../../audio.js";

// Segundos de cuenta regresiva entre tocar la cobertura y mostrar la categoría
export const COUNTDOWN_SECONDS = 3;

// ── Contexto inyectado por main.js via initGame() ────────────────
let _ctx = null;
const myPlayerId  = () => _ctx.getMyPlayerId();
const getRoomCode = () => _ctx.getRoomCode();
const isHost      = () => _ctx.getIsHost();
const _esActivo   = () => _ctx.getState()?.gameType === "tipo-main";

// ── Estado local de UI (NO va a Firebase) ────────────────────────
let _revealedRound  = -1;   // ronda para la que este jugador ya tocó la cobertura
let _sheetOpen      = false;
let _lastKey        = null; // dirty-check del render
let _wakeLock       = null;
let _countdownRound = -1;   // ronda para la que corre la cuenta regresiva (-1 = ninguna)
let _countdownLeft  = 0;
let _countdownTimer = null;

export function _setTestContext(ctx) { _ctx = ctx; }
export function _resetTestState() {
  _clearCountdown();
  _revealedRound = -1; _sheetOpen = false; _lastKey = null; _wakeLock = null;
}

// ── Cuenta regresiva local: tocar la cobertura → 3·2·1 → categoría ──
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

async function _daoNewRound(roomCode, words, roundNumber) {
  await update(_rRef(roomCode), {
    tipoRound: { words, guessed: null },
    tipoRoundNumber: roundNumber,
  });
}

// increment(): suma atómica en el servidor
async function _daoMarkGuessed(roomCode, pid, position, points) {
  await update(_rRef(roomCode), {
    [`tipoRound/guessed/${pid}`]: { position, points },
    [`players/${pid}/score`]: increment(points),
  });
}

// Deshacer un toque por error. No recalcula las posiciones de los demás.
async function _daoUnmarkGuessed(roomCode, pid, points) {
  await update(_rRef(roomCode), {
    [`tipoRound/guessed/${pid}`]: null,
    [`players/${pid}/score`]: increment(-points),
  });
}

async function _daoFinish(roomCode) {
  await update(_rRef(roomCode), { status: "finished" });
}

// ── Wake lock: la pantalla no se apaga mientras se muestra la categoría ──
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

function _showTipoView() {
  ["vista-tablero", "vista-ruleta", "vista-quien-es-main", "vista-pictionary", "vista-numero-main"]
    .forEach(id => _show(id, false));
  const overlay = document.getElementById("pregunta-overlay");
  if (overlay) overlay.classList.remove("visible");
  _show("vista-tipo-main", true, "flex");
}

function _rerender() {
  _lastKey = null;
  const s = _ctx.getState();
  if (s) renderCurrent(s);
}

// ── Renders ──────────────────────────────────────────────────────
export function renderBetween(s) {
  _showTipoView();
  _show("tipo-between", true, "flex");
  _show("tipo-round", false);
  _releaseWakeLock();

  const key = JSON.stringify({ mode: "between", host: isHost() });
  if (key === _lastKey) return;
  _lastKey = key;

  _show("btn-tipo-repartir", isHost());
  _show("tipo-wait-host", !isHost());
}

export function renderRound(s) {
  _showTipoView();
  _show("tipo-between", false);
  _show("tipo-round", true, "flex");

  const round    = s.tipoRound;
  const order    = s.playerOrder || [];
  const players  = s.players || {};
  const me       = myPlayerId();
  const host     = isHost();
  const roundNum = s.tipoRoundNumber || 0;
  const words    = round.words || {};
  const guessed  = round.guessed || {};
  const revealed = _revealedRound === roundNum;
  const sheetOpen = host && _sheetOpen;

  // Si el host repartió una ronda nueva a mitad de la cuenta, se cancela
  if (_countdownRound !== -1 && _countdownRound !== roundNum) _clearCountdown();
  const countingDown = _countdownRound === roundNum && !revealed;

  const key = JSON.stringify({
    mode: "round", roundNum, words, guessed, order,
    names: order.map(pid => players[pid]?.name), host, revealed, sheetOpen,
    countdown: countingDown ? _countdownLeft : null,
  });
  if (key === _lastKey) return;
  _lastKey = key;

  const myWord  = words[me];
  const myGuess = guessed[me];

  document.getElementById("tipo-ronda").textContent = `Ronda ${roundNum}`;

  // Escenario de la categoría propia
  const hasWord   = myWord !== undefined;
  const showCount = hasWord && !myGuess && countingDown;
  const showCover = hasWord && !myGuess && !revealed && !showCount;
  const showWord  = hasWord && (!!myGuess || revealed);

  _show("tipo-cover", showCover, "flex");
  _show("tipo-countdown", showCount, "flex");
  if (showCount) {
    const cEl = document.getElementById("tipo-countdown-num");
    cEl.textContent = _countdownLeft;
    // reiniciar la animación de pulso en cada tick
    cEl.classList.remove("tick");
    void cEl.offsetWidth;
    cEl.classList.add("tick");
  }
  _show("tipo-esperar", !hasWord, "block");
  const wordEl = document.getElementById("tipo-palabra");
  wordEl.style.display = showWord ? "block" : "none";
  if (showWord) {
    wordEl.textContent = myWord;
    // Frases largas: letra más chica para que entren sin scroll
    wordEl.classList.toggle("larga", myWord.length > 14);
    wordEl.classList.toggle("adivinado", !!myGuess);
  }
  const advEl = document.getElementById("tipo-adivinado");
  advEl.style.display = myGuess ? "block" : "none";
  if (myGuess) advEl.textContent = `✓ ¡Adivinaste! ${myGuess.position}.º · +${myGuess.points}`;
  _show("btn-tipo-ocultar", showWord && !myGuess);

  // Pantalla encendida solo mientras la categoría está visible
  if (showWord) _acquireWakeLock(); else _releaseWakeLock();

  // Controles del host
  _show("tipo-host-bar", host, "flex");
  const btnNueva = document.getElementById("btn-tipo-nueva-ronda");
  if (btnNueva) btnNueva.classList.toggle("pulse", allGuessed(order, guessed));

  // Hoja "¿Quién adivinó?" (solo host). La categoría propia del host queda oculta.
  _show("tipo-sheet", sheetOpen, "flex");
  if (sheetOpen) {
    document.getElementById("tipo-sheet-list").innerHTML = order.map(pid => {
      const p = players[pid];
      if (!p) return "";
      const g = guessed[pid];
      const wordTxt = pid === me ? "?" : (words[pid] || "—");
      return `
        <button type="button" class="numero-sheet-row${g ? " hecho" : ""}" data-pid="${esc(pid)}">
          <span class="numero-sheet-avatar">${esc((p.name || "?")[0].toUpperCase())}</span>
          <span class="numero-sheet-name">${esc(p.name || "?")}</span>
          <span class="tipo-sheet-word">${esc(wordTxt)}</span>
          <span class="numero-sheet-estado">${g ? `✓ ${g.position}.º · +${g.points}` : ""}</span>
        </button>`;
    }).join("");
  }
}

function renderCurrent(s) {
  if (!s.tipoRound) renderBetween(s); else renderRound(s);
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
  const btnR = document.getElementById("btn-tipo-repartir");
  const btnN = document.getElementById("btn-tipo-nueva-ronda");
  [btnR, btnN].forEach(b => { if (b) b.disabled = true; });
  try {
    const order    = s.playerOrder || [];
    // Evitar repetir las categorías de la ronda anterior
    const previas  = Object.values(s.tipoRound?.words || {});
    const words    = assignPalabras(order, Math.random, poolForPack(s.tipoPack), previas);
    const roundNum = (s.tipoRoundNumber || 0) + 1;
    _sheetOpen = false;
    await _daoNewRound(getRoomCode(), words, roundNum);
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
  if (s.tipoRound && !allGuessed(order, s.tipoRound.guessed)) {
    if (!confirm("¿Repartir categorías nuevas? Hay jugadores que todavía no adivinaron.")) return;
  }
  await _handleRepartir();
}

async function _handleMarkGuessed(pid) {
  if (!isHost()) return;
  const s = _ctx.getState();
  const guessed = s?.tipoRound?.guessed || {};
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
  const g = s?.tipoRound?.guessed?.[pid];
  if (!g) return;
  const name = s.players?.[pid]?.name || "este jugador";
  if (!confirm(`¿Desmarcar a ${name}?`)) return;
  try {
    await _daoUnmarkGuessed(getRoomCode(), pid, g.points || 0);
  } catch (e) { console.error(e); }
}

async function _handleTerminar() {
  if (!isHost()) return;
  if (!confirm("¿Terminar la partida?")) return;
  const btn = document.getElementById("btn-tipo-terminar");
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
      ...buildTipoInitialState(s.tipoPack),
      players,
      playerOrder: s.playerOrder || [],
    });
  } catch (e) { console.error(e); }
}

// ── Module export ────────────────────────────────────────────────
export default {
  id:          "tipo-main",
  displayName: "¿Qué tipo soy?",
  description: "Adiviná qué tipo de persona sos preguntando",
  minPlayers:  2,

  initGame(ctx) {
    _ctx = ctx;
    const on = (id, fn) => document.getElementById(id)?.addEventListener("click", () => { if (_esActivo()) fn(); });

    on("btn-tipo-repartir",     _handleRepartir);
    on("btn-tipo-nueva-ronda",  _handleNuevaRonda);
    on("btn-tipo-terminar",     _handleTerminar);
    on("btn-tipo-adivino",      () => { _sheetOpen = true;  _rerender(); });
    on("btn-tipo-sheet-cerrar", () => { _sheetOpen = false; _rerender(); });
    on("tipo-cover", () => {
      const round = _ctx.getState()?.tipoRoundNumber;
      if (round === undefined) return;
      _startCountdown(round);
    });
    on("btn-tipo-ocultar", () => { _clearCountdown(); _revealedRound = -1; _rerender(); });

    // Selector de tono (form de crear sala)
    document.querySelectorAll("#tipo-pack-selector .numero-range-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll("#tipo-pack-selector .numero-range-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
      });
    });

    // Lista del sheet: delegación (se re-renderiza)
    document.getElementById("tipo-sheet-list")?.addEventListener("click", (e) => {
      if (!_esActivo()) return;
      const row = e.target.closest(".numero-sheet-row");
      if (!row) return;
      const pid = row.dataset.pid;
      const g = _ctx.getState()?.tipoRound?.guessed?.[pid];
      if (g) _handleUnmarkGuessed(pid); else _handleMarkGuessed(pid);
    });

    // El navegador libera el wake lock al ocultar la pestaña: re-adquirirlo al volver
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && _esActivo()) _rerender();
    });
  },

  buildInitialState(config = {}) {
    return buildTipoInitialState(config.tipoPack);
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
