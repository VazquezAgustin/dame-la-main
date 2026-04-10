import { GameDAO, firebaseConfigurado } from "./firebase.js";
import { CATEGORY_POOL, QUESTIONS, LIGHTNING_QUESTIONS, ESTIMATION_QUESTIONS, pickRandomCategories } from "./preguntas.js";

// ═══════════════════════════════════════════════════════════════
// 🎮 ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════
let myPlayerId = sessionStorage.getItem("playerId");
if (!myPlayerId) {
  myPlayerId = "p_" + Date.now().toString(36);
  sessionStorage.setItem("playerId", myPlayerId);
}

let myName              = "";
let roomCode            = "";
let state               = null;
let isHost              = false;
let unsubscribe         = null;
let timerInterval       = null;
let skipTimeout         = null;
let lightningTriggered   = false;
let estimacionTriggered  = false;
let _hostMigrating       = false;  // guard para no lanzar migración múltiple
let _lastBoardKey       = null;   // dirty-check tablero
let _lastScorebarKey    = null;   // dirty-check scorebar

// ═══════════════════════════════════════════════════════════════
// 🛠️ UTILIDADES
// ═══════════════════════════════════════════════════════════════
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const showBar = id === "screen-game" || id === "screen-finished";
  document.getElementById("scorebar").style.display = showBar ? "block" : "none";
}

function setError(msg) { document.getElementById("error-inicio").textContent = msg; }
function clearError()  { document.getElementById("error-inicio").textContent = ""; }

function isBoardComplete(board, categories) {
  if (!board || !categories) return false;
  return categories.every(cat =>
    [200, 400, 600, 800, 1000].every(v => board[cat]?.[String(v)] === true)
  );
}

function countAnsweredCells(board, categories) {
  if (!board || !categories) return 0;
  let count = 0;
  categories.forEach(cat =>
    [200, 400, 600, 800, 1000].forEach(v => {
      if (board[cat]?.[String(v)] === true) count++;
    })
  );
  return count;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getQuestion(category, value) {
  return (QUESTIONS[category] || []).find(q => q.value === value) || null;
}

function clearIntervals() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (skipTimeout)   { clearTimeout(skipTimeout);    skipTimeout   = null; }
}

// ═══════════════════════════════════════════════════════════════
// 🔊 SONIDOS — Web Audio API (sin dependencias)
// ═══════════════════════════════════════════════════════════════
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBuzzer() {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.28);
  } catch (_) {}
}

function playCorrect() {
  try {
    const ctx   = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.13;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t); osc.stop(t + 0.28);
    });
  } catch (_) {}
}

function playEstimacion() {
  try {
    const ctx = getAudioCtx();
    [330, 415, 523, 659, 784].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.35);
    });
  } catch (_) {}
}

function playLightning() {
  try {
    const ctx = getAudioCtx();
    // Acorde eléctrico ascendente
    [220, 330, 440, 660].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.35);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.45);
    });
  } catch (_) {}
}

function playIncorrect() {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.45);
  } catch (_) {}
}

// Seguimiento de estado para no re-disparar sonidos en cada render
let _lastBuzzerTs          = null;
let _lastPhase             = null;
let _lastLightningPhase    = null;
let _lastEstimacionPhase   = null;

function checkSoundTriggers(s) {
  const phase    = s.questionPhase;
  const buzzerTs = s.buzzer?.timestamp;

  if (buzzerTs && buzzerTs !== _lastBuzzerTs) {
    _lastBuzzerTs = buzzerTs;
    playBuzzer();
  }

  if (phase === "judged" && _lastPhase !== "judged") {
    if (s.questionResult?.correct) playCorrect();
    else                           playIncorrect();
  }

  if (!s.currentQuestion) { _lastBuzzerTs = null; _lastPhase = null; }
  else                    { _lastPhase = phase; }

  // Sonidos modo relámpago
  const lPhase = s.lightningMode?.phase;
  if (lPhase === "announcing" && _lastLightningPhase !== "announcing") {
    playLightning();
  }
  if (lPhase === "judged" && _lastLightningPhase !== "judged") {
    if (s.lightningMode?.questionResult?.correct) playCorrect();
    else                                          playIncorrect();
  }
  _lastLightningPhase = lPhase || null;

  // Sonidos modo estimación
  const ePhase = s.estimacionMode?.phase;
  if (ePhase === "announcing" && _lastEstimacionPhase !== "announcing") {
    playEstimacion();
  }
  if (ePhase === "revealed" && _lastEstimacionPhase !== "revealed") {
    playCorrect();
  }
  _lastEstimacionPhase = ePhase || null;
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — LOBBY
// ═══════════════════════════════════════════════════════════════
function renderLobby(s) {
  const order   = s.playerOrder || [];
  const players = s.players || {};
  const lista   = document.getElementById("lista-jugadores");

  // Eliminar jugadores que ya no están (caso borde)
  lista.querySelectorAll(".jugador-item").forEach(el => {
    if (!players[el.dataset.pid]) el.remove();
  });

  order.forEach(pid => {
    const p = players[pid];
    if (!p) return;
    if (document.querySelector(`[data-pid="${pid}"]`)) return; // ya existe, no reanimar
    const div = document.createElement("div");
    div.className = "jugador-item";
    div.dataset.pid = pid;
    div.innerHTML = `
      <div class="jugador-avatar">${(p.name || "?")[0].toUpperCase()}</div>
      <span class="jugador-nombre">${p.name || "?"}${pid === myPlayerId ? ' <span style="color:var(--texto-secundario);font-size:0.78rem">(tú)</span>' : ''}</span>
      ${pid === s.hostId ? '<span class="badge-host">HOST</span>' : ''}
    `;
    lista.appendChild(div);
  });

  const btnEmpezar   = document.getElementById("btn-empezar");
  const msgEsperando = document.getElementById("msg-esperando");
  if (isHost) {
    btnEmpezar.style.display   = "block";
    msgEsperando.style.display = "none";
    btnEmpezar.disabled = order.length < 1;
  } else {
    btnEmpezar.style.display   = "none";
    msgEsperando.style.display = "block";
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — TABLERO
// ═══════════════════════════════════════════════════════════════
function renderBoard(s) {
  const boardKey = JSON.stringify({ board: s.board, selectorIndex: s.selectorIndex, playerOrder: s.playerOrder });
  if (boardKey === _lastBoardKey) return;
  _lastBoardKey = boardKey;

  document.getElementById("pregunta-overlay").classList.remove("visible");
  clearIntervals();

  const cats       = s.categories || [];
  const board      = s.board || {};
  const order      = s.playerOrder || [];
  const selectorId = order[s.selectorIndex || 0];
  const isMyTurn   = selectorId === myPlayerId;
  const selectorName = s.players?.[selectorId]?.name || "?";

  const ind = document.getElementById("turno-indicador");
  ind.innerHTML = isMyTurn
    ? `<span class="mi-turno">Tu turno</span> — elegí una categoría`
    : `Turno de <strong>${selectorName}</strong> para elegir`;

  const tablero = document.getElementById("tablero");
  tablero.innerHTML = "";

  cats.forEach(cat => {
    const h = document.createElement("div");
    h.className = "celda-header";
    h.textContent = cat;
    tablero.appendChild(h);
  });

  [200, 400, 600, 800, 1000].forEach(val => {
    cats.forEach(cat => {
      const jugada = board[cat]?.[String(val)] === true;
      const cell   = document.createElement("div");
      cell.className = "celda" + (jugada ? " jugada" : isMyTurn ? " clickeable" : "");
      cell.innerHTML = `<span class="pts">${val}</span>`;
      if (!jugada && isMyTurn) {
        cell.onclick = () => handleSelectQuestion(cat, val);
      }
      tablero.appendChild(cell);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// ⚡ RENDER — MODO RELÁMPAGO
// ═══════════════════════════════════════════════════════════════
function renderLightning(s) {
  _lastBoardKey = null; // forzar re-render del tablero al volver del relámpago
  clearIntervals();
  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("lightning-overlay").classList.add("visible");

  const lm          = s.lightningMode;
  const order       = s.playerOrder || [];
  const playerCount = order.length;
  const playerIndex = lm.currentSlot % playerCount;
  const round       = Math.floor(lm.currentSlot / playerCount) + 1;
  const currentPId  = order[playerIndex];
  const pName       = esc(s.players?.[currentPId]?.name || "?");
  const isMyTurnLM  = currentPId === myPlayerId;
  const qData       = LIGHTNING_QUESTIONS[(lm.questionIndices || [])[lm.currentSlot]] || { question: "...", answer: "..." };

  const contentEl = document.getElementById("lightning-content");
  const actionsEl = document.getElementById("lightning-actions");

  if (lm.phase === "announcing") {
    contentEl.innerHTML = `
      <div class="lightning-announcing">
        <div class="lightning-big-title">⚡<br>MODO<br>RELÁMPAGO</div>
        <p class="lightning-desc">
          Cada jugador responde <strong>2 preguntas</strong>.<br>
          <strong>10 segundos</strong> por pregunta.<br>
          Correcto: <strong>+200 pts</strong> · Incorrecto: sin penalización
        </p>
      </div>`;
    actionsEl.innerHTML = isHost
      ? `<button class="btn btn-primario" id="btn-lightning-comenzar" style="width:min(340px,92vw)">⚡ ¡Empezar!</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando que el host inicie el modo...</p>`;
    if (isHost) {
      document.getElementById("btn-lightning-comenzar")
        .addEventListener("click", handleLightningComenzar);
    }

  } else if (lm.phase === "question") {
    contentEl.innerHTML = `
      <div class="lightning-player-turn ${isMyTurnLM ? "mi-turno" : ""}">
        ${isMyTurnLM ? "¡Es tu turno!" : pName}
      </div>
      <div class="lightning-round-badge">Ronda ${round}/2 · Pregunta ${lm.currentSlot + 1}/${lm.totalSlots}</div>
      <div class="lightning-timer-row">
        <div class="lightning-timer-circle" id="lightning-timer-circle">
          <span class="lightning-timer-num" id="lightning-timer-num">10</span>
        </div>
        <div class="lightning-timer-bar-wrap">
          <div class="lightning-timer-bar" id="lightning-timer-bar"></div>
        </div>
      </div>
      <div class="lightning-question-text">${esc(qData.question)}</div>
      ${!isMyTurnLM ? `
        <div class="respuesta-box visible" style="width:min(400px,92vw)">
          <div class="respuesta-label">Respuesta correcta</div>
          <div class="respuesta-texto">${esc(qData.answer)}</div>
        </div>` : ""}`;
    actionsEl.innerHTML = isHost && !isMyTurnLM
      ? `<div class="acciones-host-row" style="width:min(400px,92vw)">
           <button class="btn btn-correcto" id="btn-lightning-correcto">✓ Correcto (+200)</button>
           <button class="btn btn-incorrecto" id="btn-lightning-incorrecto">✗ Incorrecto</button>
         </div>`
      : `<p style="color:var(--texto-secundario);text-align:center">
           ${isMyTurnLM ? "¡Decí tu respuesta en voz alta!" : "Esperando que el host decida..."}
         </p>`;
    if (isHost) {
      document.getElementById("btn-lightning-correcto")
        .addEventListener("click", () => handleLightningJudge(true));
      document.getElementById("btn-lightning-incorrecto")
        .addEventListener("click", () => handleLightningJudge(false));
    }
    renderLightningTimer(lm.openedAt);

  } else if (lm.phase === "judged") {
    const result = lm.questionResult;
    const pts    = result?.correct ? "+200 pts" : "Sin penalización";
    const color  = result?.correct ? "var(--correcto)" : "var(--texto-secundario)";
    contentEl.innerHTML = `
      <div class="lightning-player-turn ${isMyTurnLM ? "mi-turno" : ""}">${pName}</div>
      <div class="lightning-round-badge">Ronda ${round}/2 · Pregunta ${lm.currentSlot + 1}/${lm.totalSlots}</div>
      <div class="lightning-question-text">${esc(qData.question)}</div>
      <div class="respuesta-box visible">
        <div class="respuesta-label">Respuesta correcta</div>
        <div class="respuesta-texto">${esc(qData.answer)}</div>
      </div>
      <div class="resultado-panel visible">
        <div class="resultado-icono">${result?.correct ? "✅" : "❌"}</div>
        <div class="resultado-texto">${result?.correct ? `¡${pName} acertó!` : `${pName} no acertó`}</div>
        <div class="resultado-puntos" style="color:${color}">${pts}</div>
      </div>`;
    actionsEl.innerHTML = isHost
      ? `<button class="btn btn-primario" id="btn-lightning-siguiente" style="width:min(340px,92vw)">Siguiente ▶</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando al host...</p>`;
    if (isHost) {
      document.getElementById("btn-lightning-siguiente")
        .addEventListener("click", handleLightningSiguiente);
    }
  }
}

function renderLightningTimer(openedAt) {
  const TIMEOUT = 10000;
  const tick = () => {
    const circleEl = document.getElementById("lightning-timer-circle");
    const numEl    = document.getElementById("lightning-timer-num");
    const barEl    = document.getElementById("lightning-timer-bar");
    if (!circleEl || !numEl || !barEl) { clearIntervals(); return; }

    const elapsed   = Date.now() - openedAt;
    const remaining = Math.max(0, TIMEOUT - elapsed);
    const pct       = (remaining / TIMEOUT) * 100;
    const secs      = Math.ceil(remaining / 1000);

    const color = secs <= 3 ? "var(--incorrecto)" : secs <= 5 ? "var(--acento)" : "var(--acento)";
    circleEl.style.setProperty("--timer-pct", pct + "%");
    if (secs <= 3) {
      circleEl.style.background = `conic-gradient(var(--incorrecto) ${pct}%, rgba(255,255,255,0.08) 0)`;
    } else {
      circleEl.style.background = `conic-gradient(var(--acento) ${pct}%, rgba(255,255,255,0.08) 0)`;
    }
    numEl.textContent  = secs > 0 ? secs : "0";
    numEl.style.color  = color;
    barEl.style.width  = pct + "%";
    barEl.style.background = secs <= 3 ? "var(--incorrecto)" : "var(--acento)";

    if (remaining <= 0) clearIntervals();
  };
  tick();
  timerInterval = setInterval(tick, 250);
}

// ═══════════════════════════════════════════════════════════════
// 🎯 RENDER — MODO ESTIMACIÓN
// ═══════════════════════════════════════════════════════════════
function renderEstimacion(s) {
  _lastBoardKey = null; // forzar re-render del tablero al volver
  clearIntervals();
  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("estimacion-overlay").classList.add("visible");

  const em          = s.estimacionMode;
  const slot        = em.currentSlot || 0;
  const qIdx        = (em.questionIndices || [])[slot] ?? em.questionIndex ?? 0;
  const qData       = ESTIMATION_QUESTIONS[qIdx] || { question: "...", answer: 0 };
  const currentVal  = (em.values || [])[slot] ?? em.value ?? 200;
  const responses   = em.responses || {};
  const order       = s.playerOrder || [];
  const myResp      = responses[myPlayerId];
  const respCount   = Object.keys(responses).length;
  const totalSlots  = em.totalSlots || 1;

  const contentEl = document.getElementById("estimacion-content");
  const actionsEl = document.getElementById("estimacion-actions");

  if (em.phase === "announcing") {
    contentEl.innerHTML = `
      <div class="estimacion-announcing">
        <div class="estimacion-big-title">🎯<br>MODO<br>ESTIMACIÓN</div>
        <p class="estimacion-desc">
          <strong>${totalSlots} preguntas</strong>, todos responden a la vez.<br>
          El más cercano al número correcto gana los puntos de esa ronda.
        </p>
      </div>`;
    actionsEl.innerHTML = isHost
      ? `<button class="btn btn-primario" id="btn-estimacion-comenzar" style="width:min(340px,92vw)">🎯 ¡Empezar!</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando que el host inicie...</p>`;
    if (isHost) {
      document.getElementById("btn-estimacion-comenzar")
        .addEventListener("click", handleEstimacionComenzar);
    }

  } else if (em.phase === "collecting") {
    const playerRows = order.map(pid => {
      const p    = s.players?.[pid];
      const sent = responses[pid] !== undefined;
      const isMe = pid === myPlayerId;
      return `<div class="estimacion-player-row${isMe ? " yo" : ""}">
        <span class="pname">${esc(p?.name || "?")}${isMe ? " <span style='font-size:0.75rem;color:var(--texto-secundario)'>(tú)</span>" : ""}</span>
        <span class="pstatus${sent ? " enviado" : ""}">${sent ? "✓ Enviado" : "⏳ pensando..."}</span>
      </div>`;
    }).join("");

    contentEl.innerHTML = `
      <div class="estimacion-value-badge">Pregunta ${slot + 1}/${totalSlots} · +${currentVal} pts al más cercano</div>
      <div class="estimacion-question-text">${esc(qData.question)}</div>
      <div class="estimacion-timer-bar-wrap">
        <div class="estimacion-timer-bar" id="estimacion-timer-bar"></div>
      </div>
      <div class="estimacion-count">${respCount}/${order.length} respondieron</div>
      <div class="estimacion-players-list">${playerRows}</div>`;

    // Zona de input/enviado para el jugador actual
    if (myResp !== undefined) {
      actionsEl.innerHTML = `<div class="estimacion-enviado-msg">✓ Enviaste: <strong>${myResp}</strong></div>`;
    } else {
      actionsEl.innerHTML = `
        <div class="estimacion-input-wrap">
          <input class="estimacion-input" type="number" id="estimacion-input" placeholder="Tu número..." autocomplete="off">
          <button class="btn-estimacion-enviar" id="btn-estimacion-enviar">Enviar</button>
        </div>`;
      const inputEl = document.getElementById("estimacion-input");
      const btnEnviar = document.getElementById("btn-estimacion-enviar");
      inputEl.focus();
      inputEl.addEventListener("keydown", e => { if (e.key === "Enter") handleEstimacionSubmit(); });
      btnEnviar.addEventListener("click", handleEstimacionSubmit);
    }

    // El host puede revelar en cualquier momento
    if (isHost) {
      const btnEl = document.createElement("button");
      btnEl.className = "btn btn-primario";
      btnEl.id = "btn-estimacion-revelar";
      btnEl.style.cssText = "width:min(340px,92vw);margin-top:8px";
      btnEl.textContent = "👁 Revelar respuestas";
      btnEl.addEventListener("click", handleEstimacionRevelar);
      actionsEl.appendChild(btnEl);
    }

    renderEstimacionTimer(em.openedAt);

  } else if (em.phase === "revealed") {
    const answer    = qData.answer;
    const winnerId  = em.winnerId;

    // Ordenar por cercanía (quien no respondió va al final)
    const ranked = order.map(pid => ({
      pid,
      val:  responses[pid],
      diff: responses[pid] !== undefined ? Math.abs(responses[pid] - answer) : Infinity,
    })).sort((a, b) => a.diff - b.diff);

    const rows = ranked.map((item, i) => {
      const p       = s.players?.[item.pid];
      const isWinner = item.pid === winnerId;
      const hasResp  = item.val !== undefined;
      return `<div class="estimacion-result-row${isWinner ? " ganador" : ""}" style="animation-delay:${i * 0.08}s">
        <span class="rpos">${isWinner ? "🏆" : `${i + 1}.`}</span>
        <span class="rname">${esc(p?.name || "?")}</span>
        ${hasResp
          ? `<span class="rval">${item.val}</span><span class="rdiff">±${item.diff}</span>`
          : `<span class="rsin">Sin respuesta</span>`}
        ${isWinner ? `<span class="rpts">+${currentVal} pts</span>` : ""}
      </div>`;
    }).join("");

    contentEl.innerHTML = `
      <div class="estimacion-value-badge">Pregunta ${slot + 1}/${totalSlots} · +${currentVal} pts</div>
      <div class="estimacion-question-text">${esc(qData.question)}</div>
      <div class="estimacion-answer-reveal">Respuesta correcta<strong>${answer}</strong></div>
      <div class="estimacion-results">${rows}</div>`;

    const isLast = (slot + 1) >= totalSlots;
    actionsEl.innerHTML = isHost
      ? `<button class="btn btn-primario" id="btn-estimacion-siguiente" style="width:min(340px,92vw)">${isLast ? "Volver al juego ▶" : `Siguiente pregunta (${slot + 2}/${totalSlots}) ▶`}</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando al host...</p>`;
    if (isHost) {
      document.getElementById("btn-estimacion-siguiente")
        .addEventListener("click", handleEstimacionSiguiente);
    }
  }
}

function renderEstimacionTimer(openedAt) {
  const TIMEOUT = 45000;
  const tick = () => {
    const barEl = document.getElementById("estimacion-timer-bar");
    if (!barEl) { clearIntervals(); return; }
    const elapsed = Date.now() - openedAt;
    const pct     = Math.max(0, 100 - (elapsed / TIMEOUT) * 100);
    barEl.style.width      = pct + "%";
    barEl.style.background = pct < 20 ? "var(--incorrecto)" : pct < 50 ? "var(--acento)" : "#06b6d4";
    if (pct <= 0) clearIntervals();
  };
  tick();
  timerInterval = setInterval(tick, 500);
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — PREGUNTA
// ═══════════════════════════════════════════════════════════════
function renderQuestion(s) {
  _lastBoardKey = null; // forzar re-render del tablero al volver
  document.getElementById("pregunta-overlay").classList.add("visible");
  const q      = s.currentQuestion;
  const phase  = s.questionPhase;
  const buzzer = s.buzzer;
  const result = s.questionResult;
  const qData  = getQuestion(q.category, q.value);

  document.getElementById("preg-categoria").textContent = q.category.toUpperCase();
  document.getElementById("preg-valor").textContent     = q.value + " PTS";
  document.getElementById("preg-texto").textContent     = qData?.question || "Pregunta no encontrada";

  const respBox = document.getElementById("respuesta-box");
  if (phase === "answer_revealed" || phase === "judged") {
    respBox.classList.add("visible");
    document.getElementById("respuesta-texto").textContent = qData?.answer || "---";
  } else {
    respBox.classList.remove("visible");
  }

  const resPanel = document.getElementById("resultado-panel");
  if (phase === "judged" && result) {
    resPanel.classList.add("visible");
    const name = s.players?.[result.responderId]?.name || "?";
    if (result.correct) {
      document.getElementById("resultado-icono").textContent  = "✅";
      document.getElementById("resultado-texto").textContent  = `¡${name} acertó!`;
      document.getElementById("resultado-puntos").textContent = `+${result.pointsDelta} pts`;
      document.getElementById("resultado-puntos").style.color = "var(--correcto)";
    } else {
      document.getElementById("resultado-icono").textContent  = "❌";
      document.getElementById("resultado-texto").textContent  = `${name} no acertó`;
      document.getElementById("resultado-puntos").textContent = `${result.pointsDelta} pts`;
      document.getElementById("resultado-puntos").style.color = "var(--incorrecto)";
    }
  } else {
    resPanel.classList.remove("visible");
  }

  renderTimer(q.openedAt, phase, buzzer);
  renderBuzzerZone(s, phase, buzzer);
}

function renderTimer(openedAt, phase, buzzer) {
  clearIntervals();
  const bar      = document.getElementById("timer-bar");
  const countEl  = document.getElementById("answer-timer-count");

  if (phase === "waiting_buzz") {
    countEl.style.display = "none";
    const TIMEOUT = 45000;
    const tick = () => {
      const elapsed = Date.now() - openedAt;
      const pct     = Math.max(0, 100 - (elapsed / TIMEOUT) * 100);
      bar.style.transition = "width 0.5s linear, background 0.5s";
      bar.style.width      = pct + "%";
      bar.style.background = pct < 20 ? "var(--incorrecto)" : pct < 50 ? "var(--acento)" : "var(--primario-glow)";
      if (pct <= 0) clearIntervals();
    };
    tick();
    timerInterval = setInterval(tick, 500);

  } else if (phase === "waiting_answer" && buzzer?.timestamp) {
    countEl.style.display = "block";
    const ANSWER_TIMEOUT  = 30000;
    let flashedOnExpiry   = false;

    const tick = () => {
      const elapsed   = Date.now() - buzzer.timestamp;
      const remaining = Math.max(0, ANSWER_TIMEOUT - elapsed);
      const pct       = (remaining / ANSWER_TIMEOUT) * 100;
      const secs      = Math.ceil(remaining / 1000);

      bar.style.transition = "width 0.5s linear, background 0.5s";
      bar.style.width      = pct + "%";
      bar.style.background = secs <= 5 ? "var(--incorrecto)" : secs <= 10 ? "var(--acento)" : "var(--primario-glow)";

      countEl.textContent  = secs > 0 ? secs : "0";
      countEl.style.color  = secs <= 5 ? "var(--incorrecto)" : secs <= 10 ? "var(--acento)" : "var(--texto)";

      if (remaining <= 0 && !flashedOnExpiry) {
        flashedOnExpiry = true;
        clearIntervals();
        triggerFlash("incorrecto");
      }
    };
    tick();
    timerInterval = setInterval(tick, 500);

  } else {
    countEl.style.display = "none";
    bar.style.width       = "100%";
    bar.style.background  = "var(--primario-glow)";
    bar.style.transition  = "none";
  }
}

function renderBuzzerZone(s, phase, buzzer) {
  if (skipTimeout) { clearTimeout(skipTimeout); skipTimeout = null; }

  const btnBuzzer    = document.getElementById("btn-buzzer");
  const buzzerEstado = document.getElementById("buzzer-estado");
  const btnRevelar   = document.getElementById("btn-revelar");
  const accionesHost = document.getElementById("acciones-host");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnSkip      = document.getElementById("btn-skip");

  btnBuzzer.style.display    = "none";
  btnRevelar.style.display   = "none";
  btnRevelar.disabled        = false;
  accionesHost.style.display = "none";
  btnSiguiente.style.display = "none";
  btnSkip.style.display      = "none";
  buzzerEstado.textContent   = "";
  document.getElementById("btn-correcto").disabled   = false;
  document.getElementById("btn-incorrecto").disabled = false;
  btnSiguiente.disabled = false;
  btnSkip.disabled      = false;

  if (phase === "waiting_buzz") {
    btnBuzzer.style.display = "block";
    btnBuzzer.disabled      = false;

    if (isHost) {
      const remaining = 45000 - (Date.now() - s.currentQuestion.openedAt);
      if (remaining <= 0) {
        btnSkip.style.display = "block";
      } else {
        skipTimeout = setTimeout(() => {
          document.getElementById("btn-skip").style.display = "block";
        }, remaining);
      }
    }
  } else if (phase === "waiting_answer") {
    btnBuzzer.style.display = "block";
    btnBuzzer.disabled      = true;
    if (buzzer) {
      const name = s.players?.[buzzer.playerId]?.name || "?";
      buzzerEstado.innerHTML = `<span class="buzzer-ganador">🔔 ¡${name} buzzeó primero!</span>`;
      if (buzzer.playerId === myPlayerId) {
        buzzerEstado.innerHTML += `<br><span style="font-size:0.88rem;color:var(--texto-secundario)">Decí tu respuesta en voz alto y tocá "Mostrar respuesta"</span>`;
        btnRevelar.style.display = "block";
      }
    }
  } else if (phase === "answer_revealed") {
    btnBuzzer.style.display = "block";
    btnBuzzer.disabled      = true;
    if (buzzer) {
      const name = s.players?.[buzzer.playerId]?.name || "?";
      buzzerEstado.innerHTML = `<span class="buzzer-ganador">🔔 ¡${name} respondió!</span>`;
    }
    if (isHost) {
      accionesHost.style.display = "block";
    } else {
      buzzerEstado.innerHTML += `<br><span style="color:var(--texto-secundario);font-size:0.85rem">Esperando que el host decida...</span>`;
    }
  } else if (phase === "judged") {
    btnBuzzer.style.display = "block";
    btnBuzzer.disabled      = true;
    if (isHost) {
      btnSiguiente.style.display = "block";
    } else {
      buzzerEstado.innerHTML = `<span style="color:var(--texto-secundario)">Esperando al host...</span>`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — SCOREBAR
// ═══════════════════════════════════════════════════════════════
function updateScorebar(s) {
  if (!s?.players || !s?.playerOrder) return;
  const scorebarKey = JSON.stringify({
    scores: Object.fromEntries(s.playerOrder.map(pid => [pid, s.players[pid]?.score || 0])),
    selectorIndex: s.selectorIndex,
  });
  if (scorebarKey === _lastScorebarKey) return;
  _lastScorebarKey = scorebarKey;

  const order      = s.playerOrder;
  const players    = s.players;
  const selectorId = order[s.selectorIndex || 0];

  const el = document.getElementById("scorebar-players");
  el.innerHTML = "";
  order.forEach(pid => {
    const p = players[pid];
    if (!p) return;
    const span = document.createElement("span");
    span.className = "scorebar-player";
    const cls = ["sname", pid === selectorId ? "activo" : "", pid === myPlayerId ? "yo" : ""].filter(Boolean).join(" ");
    span.innerHTML = `<span class="${cls}">${(p.name || "?").slice(0, 8)}</span>&nbsp;<span class="spts">${p.score || 0}</span>`;
    el.appendChild(span);
  });

  const sorted = [...order].sort((a, b) => (players[b]?.score || 0) - (players[a]?.score || 0));
  const rankEl = document.getElementById("scorebar-ranking");
  rankEl.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];
  sorted.forEach((pid, i) => {
    const p = players[pid];
    if (!p) return;
    const div = document.createElement("div");
    div.className = "rank-item";
    div.innerHTML = `
      <span class="rank-pos">${medals[i] || (i + 1)}</span>
      <div class="rank-avatar">${(p.name || "?")[0].toUpperCase()}</div>
      <span class="rank-name">${p.name || "?"}</span>
      ${pid === myPlayerId ? '<span class="rank-tu">← Tú</span>' : ''}
      <span class="rank-pts">${p.score || 0} pts</span>
    `;
    rankEl.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — PANTALLA FINAL
// ═══════════════════════════════════════════════════════════════
function renderFinished(s) {
  const players = s.players || {};
  const order   = s.playerOrder || [];
  const sorted  = [...order].sort((a, b) => (players[b]?.score || 0) - (players[a]?.score || 0));

  const podio = document.getElementById("podio");
  podio.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];
  sorted.forEach((pid, i) => {
    const p = players[pid];
    if (!p) return;
    const div = document.createElement("div");
    div.className = "podio-item";
    div.style.animationDelay = `${i * 0.12}s`;
    div.innerHTML = `
      <span class="podio-pos">${medals[i] || `${i + 1}.`}</span>
      <span class="podio-name">${p.name || "?"}${pid === myPlayerId ? " (tú)" : ""}</span>
      <span class="podio-pts">${p.score || 0} pts</span>
    `;
    podio.appendChild(div);
  });

  document.getElementById("btn-jugar-nuevo").style.display = isHost ? "block" : "none";
  updateScorebar(s);
  launchConfetti();
}

function launchConfetti() {
  const container = document.getElementById("confetti-container");
  container.innerHTML = "";
  const colors = ["#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#a855f7", "#f8fafc", "#06b6d4"];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const size     = 6 + Math.random() * 10;
    const duration = 2.5 + Math.random() * 3;
    const delay    = Math.random() * 2.5;
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      width: ${size}px; height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      transform: rotate(${Math.random() * 360}deg);
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(piece);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔄 MIGRACIÓN DE HOST
// ═══════════════════════════════════════════════════════════════
function checkHostMigration(s) {
  if (!s.players || !s.playerOrder || !s.hostId) return;
  const hostConnected = s.players[s.hostId]?.connected;
  // Si el host está conectado (o campo no existe aún), resetear el guard
  if (hostConnected !== false) { _hostMigrating = false; return; }
  if (_hostMigrating) return;

  // Elegir el primer jugador conectado que no sea el host actual
  const newHostId = s.playerOrder.find(pid => pid !== s.hostId && s.players[pid]?.connected !== false);
  if (!newHostId) return;

  _hostMigrating = true;
  GameDAO.migrateHost(roomCode, s.hostId, newHostId).catch(() => { _hostMigrating = false; });
}

// ═══════════════════════════════════════════════════════════════
// 🎯 RENDER PRINCIPAL — listener único
// ═══════════════════════════════════════════════════════════════
function render(s) {
  if (!s) return;
  state  = s;
  isHost = myPlayerId === s.hostId;

  // Recuperar nombre si reconectamos sin sessionStorage
  if (!myName && s.players?.[myPlayerId]?.name) {
    myName = s.players[myPlayerId].name;
    sessionStorage.setItem("myName", myName);
  }

  checkSoundTriggers(s);
  checkHostMigration(s);

  switch (s.status) {
    case "lobby":
      showScreen("screen-lobby");
      document.getElementById("lobby-codigo").textContent = roomCode;
      renderLobby(s);
      break;
    case "playing":
      showScreen("screen-game");
      updateScorebar(s);
      if (s.lightningMode?.active) {
        document.getElementById("estimacion-overlay").classList.remove("visible");
        renderLightning(s);
      } else if (s.estimacionMode?.active) {
        document.getElementById("lightning-overlay").classList.remove("visible");
        renderEstimacion(s);
      } else {
        document.getElementById("lightning-overlay").classList.remove("visible");
        document.getElementById("estimacion-overlay").classList.remove("visible");
        if (!s.currentQuestion) renderBoard(s);
        else                    renderQuestion(s);
      }
      break;
    case "finished":
      showScreen("screen-finished");
      renderFinished(s);
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🖱️ HANDLERS
// ═══════════════════════════════════════════════════════════════
async function handleCreateRoom() {
  if (!firebaseConfigurado) { setError("Falta configurar Firebase. Ver README."); return; }
  const name = document.getElementById("input-nombre-crear").value.trim();
  if (!name) { setError("Ingresá tu nombre"); return; }
  clearError();

  const btn = document.getElementById("btn-crear-sala");
  btn.disabled = true; btn.textContent = "Creando...";
  try {
    myName   = name;
    roomCode = generateRoomCode();
    const categories = pickRandomCategories(CATEGORY_POOL);
    const board = {};
    categories.forEach(cat => {
      board[cat] = { "200": false, "400": false, "600": false, "800": false, "1000": false };
    });
    await GameDAO.createRoom(roomCode, {
      createdAt: Date.now(),
      hostId: myPlayerId,
      status: "lobby",
      categories,
      board,
      players: { [myPlayerId]: { name, score: 0, connected: true } },
      playerOrder: [myPlayerId],
      selectorIndex: 0,
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
    });
    sessionStorage.setItem("roomCode", roomCode);
    sessionStorage.setItem("myName",   myName);
    subscribeToRoom(roomCode);
    GameDAO.setupPresence(roomCode, myPlayerId).catch(() => {});
  } catch (e) {
    setError("Error al crear la sala. Intentá de nuevo.");
    console.error(e);
    btn.disabled = false; btn.textContent = "Crear sala";
  }
}

async function handleJoinRoom() {
  if (!firebaseConfigurado) { setError("Falta configurar Firebase. Ver README."); return; }
  const code = document.getElementById("input-codigo").value.trim().toUpperCase();
  const name = document.getElementById("input-nombre-unirse").value.trim();
  if (!code || code.length !== 6) { setError("Ingresá un código válido de 6 caracteres"); return; }
  if (!name) { setError("Ingresá tu nombre"); return; }
  clearError();

  const btn = document.getElementById("btn-unirse");
  btn.disabled = true; btn.textContent = "Uniéndose...";
  try {
    const exists = await GameDAO.roomExists(code);
    if (!exists) {
      setError("Sala no encontrada o ya iniciada");
      btn.disabled = false; btn.textContent = "Unirse";
      return;
    }
    myName   = name;
    roomCode = code;
    await GameDAO.joinRoom(roomCode, myPlayerId, { name, score: 0, connected: true });
    sessionStorage.setItem("roomCode", roomCode);
    sessionStorage.setItem("myName",   myName);
    subscribeToRoom(roomCode);
    GameDAO.setupPresence(roomCode, myPlayerId).catch(() => {});
  } catch (e) {
    setError("Error al unirse. Intentá de nuevo.");
    console.error(e);
    btn.disabled = false; btn.textContent = "Unirse";
  }
}

async function handleSelectQuestion(category, value) {
  if (!state) return;
  const selectorId = (state.playerOrder || [])[state.selectorIndex || 0];
  if (selectorId !== myPlayerId) return;
  await GameDAO.selectQuestion(roomCode, category, value);
}

async function handleBuzzer() {
  const btn = document.getElementById("btn-buzzer");
  btn.disabled = true;
  try {
    await GameDAO.pressBuzzer(roomCode, myPlayerId);
  } catch (e) {
    console.error("Error al buzzear:", e);
    btn.disabled = false;
  }
}

async function handleRevelar() {
  const btn = document.getElementById("btn-revelar");
  btn.disabled = true;
  try {
    await GameDAO.revealAnswer(roomCode);
  } catch (e) {
    console.error("Error al revelar:", e);
    btn.disabled = false;
  }
}

async function handleCorrecto() {
  if (!state?.buzzer || !state?.currentQuestion) return;
  const btnC = document.getElementById("btn-correcto");
  const btnI = document.getElementById("btn-incorrecto");
  btnC.disabled = true; btnI.disabled = true;
  const responderId = state.buzzer.playerId;
  const { value, category } = state.currentQuestion;
  triggerFlash("correcto");
  try {
    await GameDAO.judgeAnswer(roomCode, responderId, true, value, category, value);
  } catch (e) {
    console.error("Error al juzgar correcto:", e);
    btnC.disabled = false; btnI.disabled = false;
  }
}

async function handleIncorrecto() {
  if (!state?.buzzer || !state?.currentQuestion) return;
  const btnC = document.getElementById("btn-correcto");
  const btnI = document.getElementById("btn-incorrecto");
  btnC.disabled = true; btnI.disabled = true;
  const responderId = state.buzzer.playerId;
  const { value, category } = state.currentQuestion;
  triggerFlash("incorrecto");
  try {
    await GameDAO.judgeAnswer(roomCode, responderId, false, -value, category, value);
  } catch (e) {
    console.error("Error al juzgar incorrecto:", e);
    btnC.disabled = false; btnI.disabled = false;
  }
}

async function handleSiguiente() {
  const btn = document.getElementById("btn-siguiente");
  btn.disabled = true;
  const order      = state.playerOrder || [];
  const nextIndex  = (state.selectorIndex + 1) % order.length;
  const isGameOver = isBoardComplete(state.board, state.categories);

  try {
    const answered = countAnsweredCells(state.board, state.categories);
    if (!isGameOver && !state.estimacionUsed && !estimacionTriggered) {
      if (answered >= 10) {
        estimacionTriggered = true;
        await triggerEstimacionMode(nextIndex);
        return;
      }
    }
    if (!isGameOver && !state.lightningUsed && !lightningTriggered) {
      if (answered >= 15) {
        lightningTriggered = true;
        await triggerLightningMode(nextIndex);
        return;
      }
    }
    await GameDAO.nextTurn(roomCode, nextIndex, isGameOver);
  } catch (e) {
    console.error("Error al avanzar turno:", e);
    btn.disabled = false;
    lightningTriggered  = false;
    estimacionTriggered = false;
  }
}

async function handleSkip() {
  const btn = document.getElementById("btn-skip");
  btn.disabled = true;
  const order     = state.playerOrder || [];
  const nextIndex = (state.selectorIndex + 1) % order.length;

  try {
    const answered = countAnsweredCells(state.board, state.categories) + 1; // +1 por la celda skipeada
    const skipCell = { category: state.currentQuestion.category, value: state.currentQuestion.value };
    if (!state.estimacionUsed && !estimacionTriggered) {
      if (answered >= 10) {
        estimacionTriggered = true;
        await triggerEstimacionMode(nextIndex, skipCell);
        return;
      }
    }
    if (!state.lightningUsed && !lightningTriggered) {
      if (answered >= 15) {
        lightningTriggered = true;
        await triggerLightningMode(nextIndex, skipCell);
        return;
      }
    }
    await GameDAO.skipQuestion(roomCode, nextIndex);
  } catch (e) {
    console.error("Error al skipear:", e);
    btn.disabled = false;
    lightningTriggered  = false;
    estimacionTriggered = false;
  }
}

async function triggerLightningMode(selectorIndexOnEntry, skipCell = null) {
  const order      = state.playerOrder || [];
  const totalSlots = order.length * 2;

  const usedIndices = state.lightningUsedIndices || [];
  const fullPool    = LIGHTNING_QUESTIONS.map((_, i) => i);
  const available   = fullPool.filter(i => !usedIndices.includes(i));
  const source      = available.length >= totalSlots ? available : fullPool; // reset si se agotó
  const shuffled    = [...source].sort(() => Math.random() - 0.5);
  const questionIndices = shuffled.slice(0, totalSlots);
  const nextUsedIndices = source === fullPool
    ? questionIndices                                          // reset: solo guardar el lote actual
    : [...new Set([...usedIndices, ...questionIndices])];

  await GameDAO.startLightningMode(roomCode, {
    active: true,
    currentSlot: 0,
    totalSlots,
    phase: "announcing",
    questionIndices,
    questionResult: null,
    openedAt: null,
  }, selectorIndexOnEntry, skipCell, nextUsedIndices);
}

async function handleLightningComenzar() {
  document.getElementById("btn-lightning-comenzar").disabled = true;
  await GameDAO.lightningBeginQuestion(roomCode);
}

async function handleLightningJudge(correct) {
  const lm          = state.lightningMode;
  const order       = state.playerOrder || [];
  const playerIndex = lm.currentSlot % order.length;
  const currentPId  = order[playerIndex];
  const currentScore = state.players?.[currentPId]?.score || 0;

  const btnC = document.getElementById("btn-lightning-correcto");
  const btnI = document.getElementById("btn-lightning-incorrecto");
  if (btnC) btnC.disabled = true;
  if (btnI) btnI.disabled = true;

  if (correct) triggerFlash("correcto");
  else         triggerFlash("incorrecto");

  await GameDAO.lightningJudge(roomCode, currentPId, correct, currentScore);
}

async function handleLightningSiguiente() {
  const btn = document.getElementById("btn-lightning-siguiente");
  if (btn) btn.disabled = true;
  const lm      = state.lightningMode;
  const nextSlot = lm.currentSlot + 1;
  await GameDAO.lightningAdvance(roomCode, nextSlot, lm.totalSlots);
}

async function handleEstimacionComenzar() {
  document.getElementById("btn-estimacion-comenzar").disabled = true;
  await GameDAO.startEstimacionCollecting(roomCode);
}

async function handleEstimacionSubmit() {
  const inputEl  = document.getElementById("estimacion-input");
  const btnEnviar = document.getElementById("btn-estimacion-enviar");
  if (!inputEl) return;
  const val = parseInt(inputEl.value, 10);
  if (isNaN(val)) { inputEl.focus(); return; }
  if (btnEnviar) btnEnviar.disabled = true;
  try {
    await GameDAO.submitEstimacion(roomCode, myPlayerId, val);
  } catch (e) {
    console.error("Error al enviar estimación:", e);
    if (btnEnviar) btnEnviar.disabled = false;
  }
}

async function handleEstimacionRevelar() {
  const btn = document.getElementById("btn-estimacion-revelar");
  if (btn) btn.disabled = true;
  const em        = state.estimacionMode;
  const slot      = em.currentSlot || 0;
  const qIdx      = (em.questionIndices || [])[slot] ?? em.questionIndex ?? 0;
  const qData     = ESTIMATION_QUESTIONS[qIdx];
  const answer    = qData.answer;
  const pointsDelta = (em.values || [])[slot] ?? em.value ?? 200;
  const responses = em.responses || {};
  const order     = state.playerOrder || [];

  // El jugador más cercano (en orden de turno para desempatar)
  let winnerId = null;
  let minDiff  = Infinity;
  order.forEach(pid => {
    if (responses[pid] === undefined) return;
    const diff = Math.abs(responses[pid] - answer);
    if (diff < minDiff) { minDiff = diff; winnerId = pid; }
  });

  triggerFlash("correcto");
  try {
    await GameDAO.revealEstimaciones(roomCode, winnerId, pointsDelta);
  } catch (e) {
    console.error("Error al revelar estimaciones:", e);
    if (btn) btn.disabled = false;
  }
}

async function handleEstimacionSiguiente() {
  const btn = document.getElementById("btn-estimacion-siguiente");
  if (btn) btn.disabled = true;
  const em       = state.estimacionMode;
  const nextSlot = (em.currentSlot || 0) + 1;
  try {
    if (nextSlot >= (em.totalSlots || 1)) {
      const isGameOver = isBoardComplete(state.board, state.categories);
      await GameDAO.endEstimacionMode(roomCode, em.nextSelectorIndex, isGameOver);
    } else {
      await GameDAO.advanceEstimacionQuestion(roomCode, nextSlot);
    }
  } catch (e) {
    console.error("Error al avanzar estimación:", e);
    if (btn) btn.disabled = false;
  }
}

async function triggerEstimacionMode(nextSelectorIndex, skipCell = null) {
  const TOTAL_SLOTS = 6;
  const valuePool   = [200, 400, 600, 800, 1000];

  const usedIndices = state.estimacionUsedIndices || [];
  const fullPool    = ESTIMATION_QUESTIONS.map((_, i) => i);
  const available   = fullPool.filter(i => !usedIndices.includes(i));
  const source      = available.length >= TOTAL_SLOTS ? available : fullPool; // reset si se agotó
  const shuffled    = [...source].sort(() => Math.random() - 0.5);
  const questionIndices = shuffled.slice(0, TOTAL_SLOTS);
  const nextUsedIndices = source === fullPool
    ? questionIndices
    : [...new Set([...usedIndices, ...questionIndices])];

  const values = Array.from({ length: TOTAL_SLOTS }, () =>
    valuePool[Math.floor(Math.random() * valuePool.length)]
  );

  await GameDAO.startEstimacionMode(roomCode, {
    active: true,
    phase: "announcing",
    currentSlot: 0,
    totalSlots: TOTAL_SLOTS,
    questionIndices,
    values,
    openedAt: null,
    responses: null,
    winnerId: null,
    nextSelectorIndex,
  }, skipCell, nextUsedIndices);
}

async function handleJugarNuevo() {
  if (!isHost) return;
  lightningTriggered  = false;
  estimacionTriggered = false;
  const prevUsed = state.usedCategories || [];
  const alreadyUsed = [...new Set([...prevUsed, ...(state.categories || [])])];
  const categories = pickRandomCategories(CATEGORY_POOL, 6, alreadyUsed);
  const nextUsed = alreadyUsed.length + 6 > CATEGORY_POOL.length ? categories : alreadyUsed;
  const board = {};
  categories.forEach(cat => {
    board[cat] = { "200": false, "400": false, "600": false, "800": false, "1000": false };
  });
  const players = {};
  (state.playerOrder || []).forEach(pid => {
    const old = state.players?.[pid];
    if (old) players[pid] = { ...old, score: 0 };
  });
  await GameDAO.createRoom(roomCode, {
    createdAt: Date.now(),
    hostId: myPlayerId,
    status: "lobby",
    categories,
    usedCategories: nextUsed,
    lightningUsedIndices:  state.lightningUsedIndices  || [],
    estimacionUsedIndices: state.estimacionUsedIndices || [],
    board,
    players,
    playerOrder: state.playerOrder,
    selectorIndex: 0,
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
  });
}

function triggerFlash(type) {
  const el = document.getElementById("flash-overlay");
  el.className = "flash-overlay " + type;
  setTimeout(() => { el.className = "flash-overlay"; }, 1200);
}

function subscribeToRoom(code) {
  if (unsubscribe) unsubscribe();
  unsubscribe = GameDAO.subscribe(code, (gameState) => {
    if (!gameState) {
      sessionStorage.removeItem("roomCode");
      sessionStorage.removeItem("myName");
      setError("Sala no encontrada");
      showScreen("screen-inicio");
      return;
    }
    render(gameState);
  });
}

// ═══════════════════════════════════════════════════════════════
// 🔗 EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════

// Tabs inicio
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    clearError();
  });
});

// Inicio
document.getElementById("btn-crear-sala").addEventListener("click", handleCreateRoom);
document.getElementById("btn-unirse").addEventListener("click", handleJoinRoom);

// Auto-mayúsculas código
document.getElementById("input-codigo").addEventListener("input", e => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

// Enter shortcuts
document.getElementById("input-nombre-crear").addEventListener("keydown", e => { if (e.key === "Enter") handleCreateRoom(); });
document.getElementById("input-nombre-unirse").addEventListener("keydown", e => { if (e.key === "Enter") handleJoinRoom(); });
document.getElementById("input-codigo").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("input-nombre-unirse").focus();
});

// Lobby
document.getElementById("btn-empezar").addEventListener("click", () => GameDAO.startGame(roomCode));
document.getElementById("btn-copiar-codigo").addEventListener("click", () => {
  navigator.clipboard.writeText(roomCode).then(() => {
    const btn = document.getElementById("btn-copiar-codigo");
    const prev = btn.textContent;
    btn.textContent = "✅ Copiado";
    setTimeout(() => btn.textContent = prev, 2000);
  });
});

// Pregunta / buzzer
document.getElementById("btn-buzzer").addEventListener("click", handleBuzzer);
document.getElementById("btn-revelar").addEventListener("click", handleRevelar);
document.getElementById("btn-correcto").addEventListener("click", handleCorrecto);
document.getElementById("btn-incorrecto").addEventListener("click", handleIncorrecto);
document.getElementById("btn-siguiente").addEventListener("click", handleSiguiente);
document.getElementById("btn-skip").addEventListener("click", handleSkip);

// Final
document.getElementById("btn-jugar-nuevo").addEventListener("click", handleJugarNuevo);

// Scorebar toggle
document.getElementById("scorebar").addEventListener("click", () => {
  document.getElementById("scorebar").classList.toggle("expanded");
});

// Auto-reconexión al recargar
if (firebaseConfigurado) {
  const savedRoom = sessionStorage.getItem("roomCode");
  const savedName = sessionStorage.getItem("myName");
  if (savedRoom) {
    roomCode = savedRoom;
    if (savedName) myName = savedName;
    // Si myName está vacío, render() lo recupera de state.players al llegar el snapshot
    subscribeToRoom(roomCode);
  }
}

// Limpieza
window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
  clearIntervals();
});
