import { pickPalabras, palabraCategoriaLabel } from "./palabras.js";
import {
  isCorrectGuess, calcGuesserScore, calcDrawerScore,
  isRoundOver, isGameOver, nextSelectorIndex, maskWord,
  buildPictionaryInitialState,
} from "./logica.js";
import { db, GameDAO } from "../../firebase.js";
import {
  ref, update, serverTimestamp, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { playCorrect, playIncorrect, playTick } from "../../audio.js";
import { lockOrientation, unlockOrientation } from "../../motion.js";

// ── Contexto inyectado por main.js via initGame() ────────────────
let _ctx = null;
const myPlayerId  = () => _ctx.getMyPlayerId();
const getRoomCode = () => _ctx.getRoomCode();
const isHost      = () => _ctx.getIsHost();
const _amDrawer   = () => _ctx.getState()?.currentRound?.drawerId === myPlayerId();

// ── Estado de timers ─────────────────────────────────────────────
let _timerInterval = null;
let _lastTimerTick = -1;
let _finishInFlight = false;

// ── Estado del canvas / dibujo ───────────────────────────────────
let _canvas = null, _cctx = null, _cssW = 0, _cssH = 0;
let _canvasReady = false;
let _drawing = false;
let _curPts = [];
let _curColor = "#0a0a1a";
let _curWidth = 0.012;          // ancho de línea como fracción del ancho del canvas
let _curSeqKey = null;
let _nextSeq = 0;               // contador local de trazos (el dibujante es único escritor)
let _flushTimer = null;
const FLUSH_MS = 120;

// Vista landscape del dibujante: el panel se rota -90° (técnica de "Quien soy")
// para que dibuje con el celular en horizontal. Solo afecta lo VISUAL: el mapeo
// del puntero se invierte en _pushPoint para que los trazos se guarden en el
// marco canónico que ven los adivinadores (en portrait).
let _drawerLandscape = false;

// Cursores del renderer incremental: cuántos puntos de cada trazo ya pinté.
let _renderedCounts = {};
let _renderedClearAt = -1;

function _clearTimers() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  _stopFlush();
  _lastTimerTick = -1;
  _finishInFlight = false;
  // Salir de la fase de dibujo (entre-rondas, elección, resultado, cleanup):
  // desactivar la vista landscape y liberar la orientación.
  _setDrawerLandscape(false);
}

// Activa/desactiva la vista landscape rotada del dibujante. Devuelve true si
// el estado cambió (para forzar re-setup del canvas).
function _setDrawerLandscape(on) {
  if (on === _drawerLandscape) return false;
  _drawerLandscape = on;
  document.getElementById("picto-active")?.classList.toggle("picto-landscape", on);
  if (on) lockOrientation("portrait");
  else unlockOrientation();
  return true;
}

// ── DAO inline — operaciones Firebase específicas de Pictionary ──
const _rRef = (code) => ref(db, `rooms/${code}`);

async function _daoStartRound(code, drawerId, wordChoices, selectorIndex) {
  await update(_rRef(code), {
    currentRound: {
      drawerId, word: null, wordChoices,
      phase: "choosing", startedAt: null,
      strokeSeq: 0, strokes: null, chat: null, guessed: null,
    },
    selectorIndex,
  });
}

async function _daoChooseWord(code, word) {
  await update(_rRef(code), {
    "currentRound/word": word,
    "currentRound/wordChoices": null,
    "currentRound/phase": "drawing",
    "currentRound/startedAt": serverTimestamp(),
  });
}

async function _daoWriteStroke(code, seqKey, stroke, final) {
  const updates = { [`currentRound/strokes/${seqKey}`]: stroke };
  if (final) updates["currentRound/strokeSeq"] = parseInt(seqKey, 10) + 1;
  await update(_rRef(code), updates);
}

async function _daoClearCanvas(code) {
  const seqKey = String(_nextSeq).padStart(6, "0");
  _nextSeq += 1;
  await update(_rRef(code), {
    [`currentRound/strokes/${seqKey}`]: { type: "clear" },
    "currentRound/strokeSeq": _nextSeq,
  });
}

async function _daoUndo(code) {
  const round = _ctx.getState()?.currentRound;
  const keys = Object.keys(round?.strokes || {})
    .filter((k) => round.strokes[k]?.type !== "clear")
    .sort();
  const lastKey = keys[keys.length - 1];
  if (!lastKey) return;
  await update(_rRef(code), { [`currentRound/strokes/${lastKey}`]: null });
  // El renderer detecta la clave faltante y hace redibujo completo.
}

// Registra una adivinanza correcta de forma idempotente (transacción sobre
// guessed/<pid> para evitar doble-score del mismo jugador).
async function _daoRecordCorrectGuess(code, pid, order, pts) {
  const gRef = ref(db, `rooms/${code}/currentRound/guessed/${pid}`);
  let won = false;
  await runTransaction(gRef, (cur) => {
    if (cur) return;          // ya estaba registrado → abortar
    won = true;
    return { order, points: pts, ts: Date.now() };
  });
  if (!won) return;
  const cur = _ctx.getState()?.players?.[pid]?.score || 0;
  await update(_rRef(code), {
    [`players/${pid}/score`]: cur + pts,
    // entrada de chat SIN texto: nunca se revela la palabra
    [`currentRound/chat/${_chatKey(pid)}`]: { playerId: pid, correct: true, ts: Date.now() },
  });
}

async function _daoAppendChat(code, pid, text) {
  await update(_rRef(code), {
    [`currentRound/chat/${_chatKey(pid)}`]: { playerId: pid, text, correct: false, ts: Date.now() },
  });
}

async function _daoFinishRound(code, drawerId, drawerPts) {
  const updates = { "currentRound/phase": "finished" };
  if (drawerPts > 0) {
    const cur = _ctx.getState()?.players?.[drawerId]?.score || 0;
    updates[`players/${drawerId}/score`] = cur + drawerPts;
  }
  await update(_rRef(code), updates);
}

async function _daoNextRound(code, nextIdx, roundsCompleted, gameOver) {
  await update(_rRef(code), {
    currentRound: null,
    selectorIndex: nextIdx,
    roundsCompleted,
    status: gameOver ? "finished" : "playing",
  });
}

// Clave de chat única por escritor (evita colisiones entre jugadores y entre
// dos mensajes del mismo jugador en el mismo milisegundo).
function _chatKey(pid) {
  return `${pid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Helpers de layout ────────────────────────────────────────────
function _showPictoView() {
  ["vista-tablero", "vista-ruleta", "vista-quien-es-main"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const overlay = document.getElementById("pregunta-overlay");
  if (overlay) overlay.classList.remove("visible");
  const v = document.getElementById("vista-pictionary");
  if (v) v.style.display = "flex";
}

function _showPanel(id) {
  ["picto-between", "picto-choose", "picto-active", "picto-round-result"].forEach((p) => {
    const el = document.getElementById(p);
    if (el) el.style.display = (p === id) ? "flex" : "none";
  });
}

function _escape(str = "") {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Canvas ───────────────────────────────────────────────────────
function _setupCanvas() {
  _canvas = document.getElementById("picto-canvas");
  const wrap = document.getElementById("picto-canvas-wrap");
  if (!_canvas || !wrap) return;
  const dpr = window.devicePixelRatio || 1;
  // offsetWidth/Height son independientes de transform (CSS rotate): dan el
  // tamaño local correcto tanto en la vista landscape rotada como en portrait.
  _cssW = _canvas.offsetWidth  || 320;
  _cssH = _canvas.offsetHeight || 240;
  _canvas.width = Math.round(_cssW * dpr);
  _canvas.height = Math.round(_cssH * dpr);
  _cctx = _canvas.getContext("2d");
  if (!_cctx) return;
  _cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  _cctx.lineCap = "round";
  _cctx.lineJoin = "round";
  _resetCanvasCursors();
}

function _resetCanvasCursors() {
  _renderedCounts = {};
  _renderedClearAt = -1;
  if (_cctx) _cctx.clearRect(0, 0, _cssW, _cssH);
}

// Coordenadas normalizadas → píxeles CSS (ambos ejes contra el ANCHO, para
// mantener las proporciones entre dispositivos: el wrap es 4:3 fijo).
function _drawSegment(nx0, ny0, nx1, ny1, color, w) {
  if (!_cctx) return;
  _cctx.strokeStyle = color || "#0a0a1a";
  _cctx.lineWidth = Math.max(1, (w || _curWidth) * _cssW);
  _cctx.beginPath();
  _cctx.moveTo(nx0 * _cssW, ny0 * _cssW);
  _cctx.lineTo(nx1 * _cssW, ny1 * _cssW);
  _cctx.stroke();
}

function _renderStrokesIncremental(round) {
  if (!_cctx) return;
  const live = round?.strokes || {};
  // ¿Desapareció un trazo ya pintado? (undo) → redibujo completo.
  for (const k of Object.keys(_renderedCounts)) {
    if (!(k in live)) { _resetCanvasCursors(); break; }
  }
  const keys = Object.keys(live).sort();
  for (const key of keys) {
    const st = live[key];
    if (st && st.type === "clear") {
      const seqNum = parseInt(key, 10);
      if (seqNum > _renderedClearAt) {
        _cctx.clearRect(0, 0, _cssW, _cssH);
        _renderedCounts = {};
        _renderedClearAt = seqNum;
      }
      continue;
    }
    const pts = st?.pts || [];
    const already = _renderedCounts[key] || 0;
    if (pts.length <= already) continue;
    const start = Math.max(2, already);
    for (let i = start; i < pts.length; i += 2) {
      _drawSegment(pts[i - 2], pts[i - 1], pts[i], pts[i + 1], st.color, st.w);
    }
    _renderedCounts[key] = pts.length;
  }
}

// ── Loop del dibujante (pointer: mouse + touch + pen) ─────────────
function _onDown(e) {
  if (!_amDrawer()) return;
  const round = _ctx.getState()?.currentRound;
  if (!round || round.phase !== "drawing") return;
  e.preventDefault();
  _drawing = true;
  _curPts = [];
  _curSeqKey = null;
  try { _canvas.setPointerCapture(e.pointerId); } catch (_) {}
  _pushPoint(e);
  _startFlush();
}
function _onMove(e) {
  if (!_drawing) return;
  e.preventDefault();
  _pushPoint(e, true);
}
function _onUp() {
  if (!_drawing) return;
  _drawing = false;
  _flushStroke(true);
  _stopFlush();
}

function _pushPoint(e, drawLocal) {
  if (!_canvas) return;
  const rect = _canvas.getBoundingClientRect();
  // En la vista landscape el canvas está rotado -90° (rotate(-90deg) con
  // transform-origin 0 0). Invertimos el mapeo viewport→local para que los
  // trazos se guarden en el marco canónico (mismo que ven los adivinadores).
  let lx, ly;
  if (_drawerLandscape) {
    lx = rect.bottom - e.clientY;   // 0.._cssW
    ly = e.clientX  - rect.left;    // 0.._cssH
  } else {
    lx = e.clientX - rect.left;
    ly = e.clientY - rect.top;
  }
  const nx = lx / _cssW;
  const ny = ly / _cssW;            // width-based en ambos ejes (canónico)
  const n = _curPts.length;
  _curPts.push(Math.round(nx * 1e4) / 1e4, Math.round(ny * 1e4) / 1e4);
  if (drawLocal && n >= 2) _drawSegment(_curPts[n - 2], _curPts[n - 1], nx, ny, _curColor, _curWidth);
}

let _resizeRaf = 0;
function _handleViewportChange() {
  if (!_canvasReady) return;
  const round = _ctx?.getState()?.currentRound;
  if (!round || round.phase !== "drawing") return;
  if (_resizeRaf) cancelAnimationFrame(_resizeRaf);
  _resizeRaf = requestAnimationFrame(() => {
    _resizeRaf = 0;
    _setupCanvas();                    // recalcula _cssW/_cssH + limpia + resetea cursores
    _renderStrokesIncremental(round);  // repinta todos los trazos desde cero
  });
}

function _startFlush() {
  if (_flushTimer) return;
  _flushTimer = setInterval(() => { if (_drawing) _flushStroke(false); }, FLUSH_MS);
}
function _stopFlush() {
  if (_flushTimer) { clearInterval(_flushTimer); _flushTimer = null; }
}

function _flushStroke(final) {
  if (_curPts.length < 2) { if (final) _curSeqKey = null; return; }
  if (!_curSeqKey) {
    _curSeqKey = String(_nextSeq).padStart(6, "0");
    _nextSeq += 1;
  }
  _daoWriteStroke(getRoomCode(), _curSeqKey, { color: _curColor, w: _curWidth, pts: _curPts.slice() }, final)
    .catch(() => {});
  if (final) _curSeqKey = null;
}

// ── Renders ──────────────────────────────────────────────────────
export function _setTestContext(ctx) { _ctx = ctx; }

export function renderBetweenRounds(s) {
  _showPictoView();
  _showPanel("picto-between");
  _clearTimers();
  _canvasReady = false;

  const order   = s.playerOrder || [];
  const config  = s.pictionaryConfig || {};
  const rpp     = config.roundsPerPlayer || 2;
  const total   = rpp * order.length;
  const done    = s.roundsCompleted || 0;
  const selIdx  = s.selectorIndex ?? 0;
  const drawerId = order[selIdx % (order.length || 1)];
  const drawerName = s.players?.[drawerId]?.name || "?";
  const amDrawer = drawerId === myPlayerId();

  document.getElementById("picto-ronda-info").textContent = `Ronda ${done + 1} de ${total}`;
  document.getElementById("picto-next-player").innerHTML = `
    <div class="quien-next-avatar">${_escape(drawerName[0]?.toUpperCase() || "?")}</div>
    <div class="quien-next-name">${amDrawer ? "¡Te toca dibujar!" : `Dibuja <strong>${_escape(drawerName)}</strong>`}</div>
  `;

  const btn  = document.getElementById("btn-picto-start-round");
  const wait = document.getElementById("picto-wait-host");
  if (isHost()) {
    btn.style.display = "block";
    btn.disabled = false;
    wait.style.display = "none";
    btn.onclick = () => _handleStartRound(s);
  } else {
    btn.style.display = "none";
    wait.style.display = "block";
  }
}

export function renderChoosing(s) {
  _showPictoView();
  _showPanel("picto-choose");
  _clearTimers();
  _canvasReady = false;

  const round = s.currentRound;
  const drawerName = s.players?.[round.drawerId]?.name || "?";
  const amDrawer = round.drawerId === myPlayerId();
  const title = document.getElementById("picto-choose-title");
  const desc  = document.getElementById("picto-choose-desc");
  const choicesEl = document.getElementById("picto-word-choices");

  if (amDrawer) {
    title.textContent = "Elegí qué dibujar";
    desc.style.display = "none";
    choicesEl.style.display = "flex";
    choicesEl.innerHTML = "";
    (round.wordChoices || []).forEach((w) => {
      const b = document.createElement("button");
      b.className = "btn btn-secundario picto-word-choice";
      b.textContent = w;
      b.onclick = () => _handleChooseWord(b, w);
      choicesEl.appendChild(b);
    });
  } else {
    title.textContent = "🎨";
    desc.style.display = "block";
    desc.textContent = `${drawerName} está eligiendo qué dibujar...`;
    choicesEl.style.display = "none";
    choicesEl.innerHTML = "";
  }
}

export function renderDrawing(s) {
  _showPictoView();
  _showPanel("picto-active");

  const round = s.currentRound;
  const amDrawer = round.drawerId === myPlayerId();
  const meGuessed = !!round.guessed?.[myPlayerId()];

  // Solo el dibujante ve la vista landscape. Si cambió, re-setear el canvas
  // (cambian las dimensiones) antes de medir.
  if (_setDrawerLandscape(amDrawer)) _canvasReady = false;

  if (!_canvasReady) {
    _setupCanvas();
    _nextSeq = round.strokeSeq || 0;
    _canvasReady = true;
  }
  _renderStrokesIncremental(round);

  // Herramientas: solo el dibujante.
  document.getElementById("picto-tools").style.display = amDrawer ? "flex" : "none";

  // Formulario de adivinanza: solo guessers que no acertaron.
  const form = document.getElementById("picto-guess-form");
  form.style.display = (!amDrawer && !meGuessed) ? "flex" : "none";

  // Hint de la palabra: el dibujante ve la palabra; el resto, enmascarada.
  const hint = document.getElementById("picto-word-hint");
  hint.textContent = amDrawer ? (round.word || "") : maskWord(round.word || "");

  // Categoría de la palabra: pista de qué tipo de cosa se está dibujando
  // (ej: "Película o serie"). Visible para todos, sin revelar la palabra.
  const catEl = document.getElementById("picto-word-cat");
  if (catEl) catEl.textContent = round.word ? palabraCategoriaLabel(round.word) : "";

  const badge = document.getElementById("picto-drawer-badge");
  badge.textContent = amDrawer ? "Estás dibujando" : `✏️ ${s.players?.[round.drawerId]?.name || "?"}`;

  _renderChat(s);
  _startDrawTimer();

  // El dibujante (autoritativo) cierra la ronda si todos adivinaron.
  if (_shouldIFinish(s) && isRoundOver(round.guessed, s.playerOrder || [], round.drawerId)) {
    _finishRound(s);
  }
}

function _renderChat(s) {
  const round = s.currentRound;
  const chat = round?.chat || {};
  const el = document.getElementById("picto-chat");
  if (!el) return;
  const entries = Object.values(chat).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  el.innerHTML = entries.map((en) => {
    const name = _escape(s.players?.[en.playerId]?.name || "?");
    if (en.correct) return `<div class="picto-chat-line acierto">✓ <strong>${name}</strong> ¡acertó!</div>`;
    return `<div class="picto-chat-line"><strong>${name}:</strong> ${_escape(en.text || "")}</div>`;
  }).join("");
  el.scrollTop = el.scrollHeight;
}

export function renderRoundResult(s) {
  _showPictoView();
  _showPanel("picto-round-result");
  _clearTimers();
  _canvasReady = false;

  const round = s.currentRound;
  const guessed = round?.guessed || {};
  const order = s.playerOrder || [];

  document.getElementById("picto-result-word").innerHTML =
    `La palabra era: <strong>${_escape(round?.word || "?")}</strong>`;

  // Lista: acertantes (con puntos, ordenados por turno) + quienes no acertaron.
  const guessers = order.filter((pid) => pid !== round?.drawerId);
  const acertaron = guessers
    .filter((pid) => guessed[pid])
    .sort((a, b) => (guessed[a].order ?? 0) - (guessed[b].order ?? 0));
  const fallaron = guessers.filter((pid) => !guessed[pid]);

  document.getElementById("picto-result-list").innerHTML =
    acertaron.map((pid) =>
      `<div class="quien-result-item correcto">✓ ${_escape(s.players?.[pid]?.name || "?")} &nbsp;+${guessed[pid].points} pts</div>`
    ).join("") +
    fallaron.map((pid) =>
      `<div class="quien-result-item notime">— ${_escape(s.players?.[pid]?.name || "?")}</div>`
    ).join("");

  const btn  = document.getElementById("btn-picto-siguiente");
  const wait = document.getElementById("picto-wait-siguiente");
  if (isHost()) {
    btn.style.display = "block";
    btn.disabled = false;
    wait.style.display = "none";
    btn.onclick = () => _handleSiguiente(s);
  } else {
    btn.style.display = "none";
    wait.style.display = "block";
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
    const p = players[pid];
    const isMe = pid === myPlayerId();
    return `
      <div class="podio-item${i === 0 ? " winner" : ""}">
        <span class="podio-medalla">${medals[i] || (i + 1)}</span>
        <div class="podio-avatar">${_escape((p?.name || "?")[0].toUpperCase())}</div>
        <span class="podio-nombre">${_escape(p?.name || "?")}${isMe ? " (tú)" : ""}</span>
        <span class="podio-puntos">${p?.score || 0} pts</span>
      </div>`;
  }).join("");

  const btnNuevo = document.getElementById("btn-jugar-nuevo");
  if (btnNuevo) {
    btnNuevo.style.display = isHost() ? "block" : "none";
    btnNuevo.onclick = _handleJugarNuevo;
  }
}

// ── Timer de dibujo ──────────────────────────────────────────────
function _startDrawTimer() {
  if (_timerInterval) return;
  _timerInterval = setInterval(() => {
    const st = _ctx.getState();
    const round = st?.currentRound;
    if (!round || round.phase !== "drawing") return;
    const dur = st.pictionaryConfig?.drawSeconds || 80;
    if (!round.startedAt) return;
    const elapsed = Math.floor((Date.now() - round.startedAt) / 1000);
    const remaining = Math.max(0, dur - elapsed);

    const el = document.getElementById("picto-timer");
    if (el) {
      el.textContent = remaining + "s";
      el.classList.toggle("urgente", remaining <= 10);
    }
    if (remaining > 0 && remaining <= 10 && remaining !== _lastTimerTick) {
      _lastTimerTick = remaining;
      playTick();
    }
    if (remaining <= 0 && _shouldIFinish(st) && round.phase === "drawing") {
      _finishRound(st);
    }
  }, 300);
}

// ¿Soy yo quien debe escribir el cierre de la ronda? El dibujante es el
// escritor autoritativo; si está desconectado, lo hace el host.
function _shouldIFinish(s) {
  const round = s.currentRound;
  if (!round) return false;
  const drawerConnected = s.players?.[round.drawerId]?.connected !== false;
  if (_amDrawer() && drawerConnected) return true;
  if (isHost() && !drawerConnected) return true;
  return false;
}

function _finishRound(s) {
  if (_finishInFlight) return;
  _finishInFlight = true;
  const round = s.currentRound;
  const numGuessed = Object.keys(round?.guessed || {}).length;
  const drawerPts = calcDrawerScore(numGuessed);
  _daoFinishRound(getRoomCode(), round.drawerId, drawerPts)
    .catch(() => {})
    .finally(() => { _finishInFlight = false; });
}

// ── Action handlers ──────────────────────────────────────────────
async function _handleStartRound(s) {
  const btn = document.getElementById("btn-picto-start-round");
  if (btn) btn.disabled = true;
  try {
    const order = s.playerOrder || [];
    const selIdx = s.selectorIndex ?? 0;
    const drawerId = order[selIdx % order.length];
    const cat = s.pictionaryConfig?.categoria || "mixto";
    const choices = pickPalabras(3, cat);
    await _daoStartRound(getRoomCode(), drawerId, choices, selIdx);
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

async function _handleChooseWord(btn, word) {
  document.querySelectorAll("#picto-word-choices .picto-word-choice").forEach((b) => { b.disabled = true; });
  try {
    await _daoChooseWord(getRoomCode(), word);
  } catch (e) {
    console.error(e);
    document.querySelectorAll("#picto-word-choices .picto-word-choice").forEach((b) => { b.disabled = false; });
  }
}

async function _handleGuess(e) {
  e.preventDefault();
  const s = _ctx.getState();
  const round = s?.currentRound;
  if (!round || round.phase !== "drawing") return;
  if (round.drawerId === myPlayerId()) return;       // el dibujante no adivina
  if (round.guessed?.[myPlayerId()]) return;          // ya acertó
  const input = document.getElementById("picto-guess-input");
  const raw = (input.value || "").trim();
  if (!raw) return;
  input.value = "";

  if (isCorrectGuess(raw, round.word)) {
    const order = Object.keys(round.guessed || {}).length;
    const dur = s.pictionaryConfig?.drawSeconds || 80;
    const elapsed = (Date.now() - (round.startedAt || Date.now())) / 1000;
    const remainingFraction = Math.max(0, (dur - elapsed) / dur);
    const pts = calcGuesserScore(order, remainingFraction);
    playCorrect();
    _ctx.triggerFlash?.("correcto");
    try { await _daoRecordCorrectGuess(getRoomCode(), myPlayerId(), order, pts); } catch (err) { console.error(err); }
  } else {
    playIncorrect();
    try { await _daoAppendChat(getRoomCode(), myPlayerId(), raw); } catch (err) { console.error(err); }
  }
}

async function _handleSiguiente(s) {
  const btn = document.getElementById("btn-picto-siguiente");
  if (btn) btn.disabled = true;
  try {
    const order = s.playerOrder || [];
    const config = s.pictionaryConfig || {};
    const doneNow = (s.roundsCompleted || 0) + 1;
    const gameOver = isGameOver(doneNow, config.roundsPerPlayer || 2, order.length);
    const nextIdx = nextSelectorIndex(s.selectorIndex ?? 0, order.length);
    await _daoNextRound(getRoomCode(), nextIdx, doneNow, gameOver);
  } catch (e) {
    console.error(e);
    if (btn) btn.disabled = false;
  }
}

async function _handleJugarNuevo() {
  if (!isHost()) return;
  const s = _ctx.getState();
  const players = {};
  (s.playerOrder || []).forEach((pid) => {
    const old = s.players?.[pid];
    if (old) players[pid] = { ...old, score: 0 };
  });
  await GameDAO.createRoom(getRoomCode(), {
    createdAt:        Date.now(),
    hostId:           myPlayerId(),
    status:           "lobby",
    gameType:         "pictionary",
    pictionaryConfig: s.pictionaryConfig || { roundsPerPlayer: 2, drawSeconds: 80, categoria: "mixto" },
    selectorIndex:    0,
    roundsCompleted:  0,
    currentRound:     null,
    players,
    playerOrder:      s.playerOrder || [],
  });
}

// ── Wiring de handlers persistentes (una sola vez) ───────────────
function _wireColorTools() {
  document.querySelectorAll("#picto-tools .picto-color").forEach((btn) => {
    btn.addEventListener("click", () => {
      _curColor = btn.dataset.color || "#0a0a1a";
      document.querySelectorAll("#picto-tools .picto-color").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ── Module export ────────────────────────────────────────────────
export default {
  id:          "pictionary",
  displayName: "Pictionary",
  description: "Dibujá y adiviná — uno dibuja, el resto adivina en el chat",
  minPlayers:  2,

  initGame(ctx) {
    _ctx = ctx;

    // Etiquetas de los sliders de configuración.
    document.getElementById("picto-rounds-slider")?.addEventListener("input", (e) => {
      const el = document.getElementById("picto-rounds-value");
      if (el) el.textContent = e.target.value;
    });
    document.getElementById("picto-duration-slider")?.addEventListener("input", (e) => {
      const el = document.getElementById("picto-duration-value");
      if (el) el.textContent = e.target.value + "s";
    });

    // Selector de categoría de palabras.
    document.querySelectorAll("#picto-cat-selector .picto-cat-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        document.querySelectorAll("#picto-cat-selector .picto-cat-option").forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
      });
    });

    // Formulario de adivinanza.
    document.getElementById("picto-guess-form")?.addEventListener("submit", _handleGuess);

    // Herramientas de dibujo.
    _wireColorTools();
    document.getElementById("picto-undo")?.addEventListener("click", () => {
      if (_amDrawer()) _daoUndo(getRoomCode()).catch(() => {});
    });
    document.getElementById("picto-clear")?.addEventListener("click", () => {
      if (_amDrawer()) _daoClearCanvas(getRoomCode()).catch(() => {});
    });

    // Listeners de dibujo en el canvas (guardados por _amDrawer dentro).
    const canvas = document.getElementById("picto-canvas");
    if (canvas) {
      canvas.addEventListener("pointerdown", _onDown);
      canvas.addEventListener("pointermove", _onMove);
      window.addEventListener("pointerup", _onUp);
      window.addEventListener("pointercancel", _onUp);
    }

    // Al cambiar el tamaño/orientación del viewport, re-setear el canvas
    // (recalcula dimensiones) y repintar todos los trazos desde cero.
    window.addEventListener("resize", _handleViewportChange);
    window.addEventListener("orientationchange", _handleViewportChange);
  },

  buildInitialState(config) {
    return buildPictionaryInitialState(config);
  },

  render(s) {
    if (s.status === "finished") { renderGameFinished(s); return; }
    if (!s.currentRound) { renderBetweenRounds(s); return; }
    const phase = s.currentRound.phase;
    if (phase === "choosing")      renderChoosing(s);
    else if (phase === "drawing")  renderDrawing(s);
    else if (phase === "finished") renderRoundResult(s);
  },

  cleanup() {
    _clearTimers();
    _canvasReady = false;
  },
};
