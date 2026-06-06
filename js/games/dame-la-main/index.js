import { GameDAO } from "../../firebase.js";
import {
  CATEGORY_POOL, QUESTIONS, LIGHTNING_QUESTIONS, ESTIMATION_QUESTIONS, pickRandomCategories,
} from "../../preguntas.js";
import {
  generateRoomCode, isBoardComplete, countAnsweredCells, esc, getQuestion,
  categoryHasUnplayed, availableCategories,
} from "../../logica.js";
import {
  playBuzzer, playCorrect, playIncorrect, playEstimacion, playLightning,
  playTick, playWindupSweep, playBonusFanfare,
} from "../../audio.js";

// ── Contexto inyectado por main.js via initGame() ────────────────
let _ctx = null;
const myPlayerId = () => _ctx.getMyPlayerId();
const roomCode   = () => _ctx.getRoomCode();
const isHost     = () => _ctx.getIsHost();
const getState   = () => _ctx.getState();

// ── Estado de timers (propiedad del módulo) ───────────────────────
let _timerInterval = null;
let _skipTimeout   = null;

function _clearIntervals() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  if (_skipTimeout)   { clearTimeout(_skipTimeout);    _skipTimeout   = null; }
}

// ── Estado de dirty-checks ────────────────────────────────────────
let _lastBoardKey      = null;
let _lastLightningKey  = null;
let _lastEstimacionKey = null;
let _estimacionInput   = "";
let _lastRuletaKey     = null;
let _ruletaRotation    = 0;

// ── Estado de sonidos ─────────────────────────────────────────────
let _lastBuzzerTs       = null;
let _lastPhase          = null;
let _lastLightningPhase = null;
let _lastEstimacionPhase= null;

// ── Estado de ruleta ──────────────────────────────────────────────
const RULETA_COLORS           = ["#7c3aed", "#a855f7", "#ec4899", "#f59e0b", "#06b6d4", "#10b981"];
const RULETA_WINDUP_MS        = 500;
const RULETA_SPIN_MS          = 4000;
const RULETA_REVEAL_MS        = 1500;
const RULETA_BONUS_PROBABILITY= 0.15;
const RULETA_BONUS_ARC_DEG    = 10;

let _ruletaActiveSpinId = null;
let _ruletaTickRaf      = null;
let _ruletaTickLastSec  = -1;
let _ruletaRevealTimer  = null;
let _ruletaFinishTimer  = null;

// ── Estado de flags de modos ──────────────────────────────────────
let _lightningTriggered  = false;
let _estimacionTriggered = false;

// ── Sliders de longitud ───────────────────────────────────────────
// Cada slider es independiente (sin rebalanceo). Lightning se mide en
// "preguntas por jugador" (0 = desactivado, o 2..5); base y estimación son
// totales. El total real de la partida es dinámico porque lightning escala
// con la cantidad de jugadores (recién conocida al disparar el modo).
const LENGTH_BOUNDS = {
  base:       { min: 6,  max: 30 },
  lightning:  { min: 0,  max: 5  },
  estimacion: { min: 0,  max: 12 },
};
let _lengthState = { base: 18, lightning: 2, estimacion: 6 };

// Aplica el cambio de un slider sin rebalancear los demás. Para lightning,
// "snapea" el valor 1 a 2 (mínimo válido cuando está activo).
function _updateLengthSlider(slot, rawValue) {
  const b   = LENGTH_BOUNDS[slot] || { min: 0, max: 99 };
  let value = Math.max(b.min, Math.min(b.max, rawValue));
  if (slot === "lightning" && value === 1) value = 2;
  _lengthState[slot] = value;

  const row = document.querySelector(`[data-slot="${slot}"]`);
  if (row) {
    row.querySelector(".length-slider-input").value = value;
    row.querySelector(".length-slider-value").textContent = value;
  }
  _updateLengthHint();
}

// Muestra el desglose de la longitud (el total es dinámico: lightning depende
// de la cantidad de jugadores, desconocida al crear la sala).
function _updateLengthHint() {
  const hint = document.getElementById("length-total-hint");
  if (!hint) return;
  const { base, estimacion, lightning } = _lengthState;
  const partes = [`📋 ${base} tablero`];
  if (estimacion > 0) partes.push(`🎯 ${estimacion} estimación`);
  partes.push(lightning > 0 ? `⚡ ${lightning}/jugador` : `⚡ off`);
  hint.textContent = partes.join(" · ");
}

// ════════════════════════════════════════════════════════════════
// 🔊 TRIGGERS DE SONIDO
// ════════════════════════════════════════════════════════════════
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

  const lPhase = s.lightningMode?.phase;
  if (lPhase === "announcing" && _lastLightningPhase !== "announcing") playLightning();
  if (lPhase === "judged"     && _lastLightningPhase !== "judged") {
    if (s.lightningMode?.questionResult?.correct) playCorrect();
    else                                          playIncorrect();
  }
  _lastLightningPhase = lPhase || null;

  const ePhase = s.estimacionMode?.phase;
  if (ePhase === "announcing" && _lastEstimacionPhase !== "announcing") playEstimacion();
  if (ePhase === "revealed"   && _lastEstimacionPhase !== "revealed")   playCorrect();
  _lastEstimacionPhase = ePhase || null;
}

// ════════════════════════════════════════════════════════════════
// 🎨 RENDER — TABLERO
// ════════════════════════════════════════════════════════════════
function renderBoard(s) {
  const boardKey = JSON.stringify({ board: s.board, selectorIndex: s.selectorIndex, playerOrder: s.playerOrder });
  if (boardKey === _lastBoardKey) return;
  _lastBoardKey = boardKey;

  document.getElementById("pregunta-overlay").classList.remove("visible");
  _clearIntervals();

  const cats       = s.categories || [];
  const board      = s.board || {};
  const order      = s.playerOrder || [];
  const selectorId = order[s.selectorIndex || 0];
  const isMyTurn   = selectorId === myPlayerId();
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
      if (!jugada && isMyTurn) cell.onclick = () => _handleSelectQuestion(cat, val);
      tablero.appendChild(cell);
    });
  });
}

// ════════════════════════════════════════════════════════════════
// 🎰 RENDER — RULETA
// ════════════════════════════════════════════════════════════════
function buildRuletaWheel(categories) {
  const wheel = document.getElementById("ruleta-wheel");
  const n     = categories.length;
  wheel.classList.remove("spinning");
  wheel.style.transform = "rotate(0deg)";
  _ruletaRotation = 0;
  if (!n) { wheel.innerHTML = ""; wheel.style.background = ""; return; }

  const seg   = 360 / n;
  const stops = categories.map((_, i) => {
    const color = RULETA_COLORS[i % RULETA_COLORS.length];
    return `${color} ${i * seg}deg ${(i + 1) * seg}deg`;
  }).join(", ");
  wheel.style.background = `conic-gradient(${stops})`;

  const radiusPct = 33;
  wheel.innerHTML = categories.map((cat, i) => {
    const center = i * seg + seg / 2;
    const rad    = (center * Math.PI) / 180;
    const xPct   = Math.sin(rad) * radiusPct;
    const yPct   = -Math.cos(rad) * radiusPct;
    return `<div class="ruleta-label"
              style="left:calc(50% + ${xPct.toFixed(2)}%);top:calc(50% + ${yPct.toFixed(2)}%);transform:translate(-50%,-50%) rotate(0deg);">
              ${esc(cat)}
            </div>`;
  }).join("");
}

function resetRouletteVisuals() {
  const stage   = document.getElementById("ruleta-stage");
  const pointer = document.getElementById("ruleta-pointer");
  const banner  = document.getElementById("ruleta-banner");
  const flash   = document.getElementById("ruleta-winning-flash");
  if (stage)   stage.classList.remove("spinning", "windup", "landed", "bonus");
  if (pointer) pointer.classList.remove("bouncing");
  if (banner)  { banner.classList.remove("visible", "bonus"); banner.innerHTML = ""; }
  if (flash)   { flash.classList.remove("visible"); flash.style.transform = "rotate(0deg)"; }
  if (_ruletaTickRaf)     { cancelAnimationFrame(_ruletaTickRaf); _ruletaTickRaf = null; }
  if (_ruletaRevealTimer) { clearTimeout(_ruletaRevealTimer);     _ruletaRevealTimer = null; }
  if (_ruletaFinishTimer) { clearTimeout(_ruletaFinishTimer);     _ruletaFinishTimer = null; }
  _ruletaTickLastSec = -1;
}

function renderRoulette(s) {
  _lastBoardKey = null;
  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("vista-tablero").style.display = "none";
  document.getElementById("vista-ruleta").style.display  = "flex";
  resetRouletteVisuals();
  _ruletaActiveSpinId = null;

  const order        = s.playerOrder || [];
  const selectorId   = order[s.selectorIndex || 0];
  const isMyTurn     = selectorId === myPlayerId();
  const selectorName = s.players?.[selectorId]?.name || "?";

  const ind = document.getElementById("turno-indicador-ruleta");
  ind.innerHTML = isMyTurn
    ? `<span class="mi-turno">Tu turno</span> — girá la ruleta`
    : `Turno de <strong>${selectorName}</strong> para girar la ruleta`;

  const avail     = availableCategories(s);
  const ruletaKey = JSON.stringify({ avail, selectorIndex: s.selectorIndex });
  if (ruletaKey !== _lastRuletaKey) {
    _lastRuletaKey = ruletaKey;
    buildRuletaWheel(avail);
  }

  const btn = document.getElementById("btn-ruleta-spin");
  const msg = document.getElementById("ruleta-msg");
  if (isMyTurn) {
    btn.disabled = false;
    btn.style.display = "block";
    msg.textContent = "";
  } else {
    btn.disabled = true;
    btn.style.display = "none";
    msg.innerHTML = `Esperando que <strong>${esc(selectorName)}</strong> gire...`;
  }
}

function renderRouletteSpin(s) {
  const spin = s.rouletteSpin;
  if (!spin) return;
  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("vista-tablero").style.display = "none";
  document.getElementById("vista-ruleta").style.display  = "flex";

  const avail     = availableCategories(s);
  const ruletaKey = JSON.stringify({ avail, selectorIndex: s.selectorIndex });
  if (ruletaKey !== _lastRuletaKey) {
    _lastRuletaKey = ruletaKey;
    buildRuletaWheel(avail);
  }
  if (_ruletaActiveSpinId === spin.spinId) return;
  _ruletaActiveSpinId = spin.spinId;

  const ind          = document.getElementById("turno-indicador-ruleta");
  const order        = s.playerOrder || [];
  const selectorId   = order[s.selectorIndex || 0];
  const selectorName = s.players?.[selectorId]?.name || "?";
  ind.innerHTML = `🎰 ${esc(selectorName)} está girando la ruleta...`;

  const btn = document.getElementById("btn-ruleta-spin");
  const msg = document.getElementById("ruleta-msg");
  btn.disabled      = true;
  btn.style.display = "none";
  msg.innerHTML     = `<span class="destacado">🎰 Girando...</span>`;

  _startSpinChoreography(s, spin);
}

function _startSpinChoreography(s, spin) {
  const wheel     = document.getElementById("ruleta-wheel");
  const stage     = document.getElementById("ruleta-stage");
  const startedAt = spin.startedAt || Date.now();
  const elapsed   = Math.max(0, Date.now() - startedAt);

  resetRouletteVisuals();

  if (elapsed < RULETA_WINDUP_MS) {
    stage.classList.add("windup");
    wheel.classList.remove("spinning");
    wheel.style.transform = "rotate(0deg)";
    wheel.querySelectorAll(".ruleta-label").forEach(l => {
      l.classList.remove("spinning");
      l.style.transform = "translate(-50%,-50%) rotate(0deg)";
    });
    playWindupSweep();
    setTimeout(() => {
      stage.classList.remove("windup");
      _launchMainSpin(spin);
    }, Math.max(0, RULETA_WINDUP_MS - elapsed));
  } else if (elapsed < RULETA_WINDUP_MS + RULETA_SPIN_MS) {
    _launchMainSpin(spin, elapsed - RULETA_WINDUP_MS);
  } else {
    _finalizeWheelAtTarget(spin);
    _triggerReveal(spin);
  }
}

function _launchMainSpin(spin, lateJoinElapsed = 0) {
  const wheel   = document.getElementById("ruleta-wheel");
  const stage   = document.getElementById("ruleta-stage");
  const labels  = wheel.querySelectorAll(".ruleta-label");
  const targetRot = spin.targetRotation;

  wheel.classList.remove("spinning");
  wheel.style.transform = "rotate(0deg)";
  labels.forEach(l => {
    l.classList.remove("spinning");
    l.style.transform = "translate(-50%,-50%) rotate(0deg)";
  });
  void wheel.offsetWidth;

  stage.classList.add("spinning");
  wheel.classList.add("spinning");
  wheel.style.transform = `rotate(${targetRot}deg)`;
  labels.forEach(l => {
    l.classList.add("spinning");
    l.style.transform = `translate(-50%,-50%) rotate(${-targetRot}deg)`;
  });

  _startTickLoop(spin, lateJoinElapsed);

  const remaining = Math.max(0, RULETA_SPIN_MS - lateJoinElapsed);
  _ruletaRevealTimer = setTimeout(() => {
    _finalizeWheelAtTarget(spin);
    _triggerReveal(spin);
  }, remaining);
}

function _startTickLoop(spin, lateJoinElapsed) {
  const wheel = document.getElementById("ruleta-wheel");
  const avail = availableCategories(getState());
  const n     = Math.max(1, avail.length);
  const seg   = 360 / n;
  _ruletaTickLastSec = -1;

  const tick = () => {
    const s = getState();
    if (!s?.rouletteSpin || s.rouletteSpin.spinId !== spin.spinId) {
      _ruletaTickRaf = null;
      return;
    }
    const computed = window.getComputedStyle(wheel).transform;
    let currentRot = 0;
    if (computed && computed !== "none") {
      const m = computed.match(/matrix\(([^)]+)\)/);
      if (m) {
        const v = m[1].split(",").map(parseFloat);
        const angleRad = Math.atan2(v[1], v[0]);
        currentRot = (angleRad * 180) / Math.PI;
        if (currentRot < 0) currentRot += 360;
      }
    }
    const angleAtPointer = ((360 - currentRot) % 360 + 360) % 360;
    const sectorIdx = Math.floor(angleAtPointer / seg) % n;
    if (sectorIdx !== _ruletaTickLastSec) {
      _ruletaTickLastSec = sectorIdx;
      const elapsed   = Date.now() - (spin.startedAt + RULETA_WINDUP_MS);
      const progress  = Math.min(1, Math.max(0, elapsed / RULETA_SPIN_MS));
      const intensity = 0.4 + 0.6 * progress;
      playTick(intensity);
    }
    _ruletaTickRaf = requestAnimationFrame(tick);
  };
  _ruletaTickRaf = requestAnimationFrame(tick);
}

function _finalizeWheelAtTarget(spin) {
  const wheel  = document.getElementById("ruleta-wheel");
  const labels = wheel.querySelectorAll(".ruleta-label");
  wheel.style.transform = `rotate(${spin.targetRotation}deg)`;
  labels.forEach(l => {
    l.style.transform = `translate(-50%,-50%) rotate(${-spin.targetRotation}deg)`;
  });
}

function _triggerReveal(spin) {
  const stage   = document.getElementById("ruleta-stage");
  const pointer = document.getElementById("ruleta-pointer");
  const banner  = document.getElementById("ruleta-banner");
  const flash   = document.getElementById("ruleta-winning-flash");

  if (_ruletaTickRaf) { cancelAnimationFrame(_ruletaTickRaf); _ruletaTickRaf = null; }
  stage.classList.remove("spinning");
  stage.classList.add("landed");
  if (spin.isBonus) stage.classList.add("bonus");
  pointer.classList.add("bouncing");

  if (flash) {
    const avail = availableCategories(getState());
    const n     = Math.max(1, avail.length);
    const seg   = 360 / n;
    flash.style.setProperty("--seg-deg", `${seg}deg`);
    flash.classList.add("visible");
  }
  if (banner) {
    banner.innerHTML = spin.isBonus
      ? `<div class="ruleta-banner-bonus">⚡ x2 BONUS ⚡</div>
         <div class="ruleta-banner-cat">${esc(spin.targetCategory)}</div>
         <div class="ruleta-banner-pts">${spin.targetValue} × 2 = <strong>${spin.targetValue * 2} pts</strong></div>`
      : `<div class="ruleta-banner-cat">${esc(spin.targetCategory)}</div>
         <div class="ruleta-banner-pts"><strong>${spin.targetValue} pts</strong></div>`;
    banner.classList.add("visible");
    if (spin.isBonus) banner.classList.add("bonus");
  }

  if (spin.isBonus) {
    playBonusFanfare(); playCorrect();
    _ctx.triggerFlash("correcto");
    launchConfettiBurst();
  } else {
    playCorrect();
    _ctx.triggerFlash("correcto");
  }

  setTimeout(() => { pointer.classList.remove("bouncing"); }, 600);

  const s         = getState();
  const order     = s.playerOrder || [];
  const selectorId = order[s.selectorIndex || 0];
  if (selectorId === myPlayerId()) {
    _ruletaFinishTimer = setTimeout(async () => {
      try {
        await GameDAO.finishRouletteSpin(roomCode(), spin.targetCategory, spin.targetValue, spin.isBonus);
      } catch (e) { console.error("Error al cerrar el giro:", e); }
    }, RULETA_REVEAL_MS);
  }
}

function launchConfettiBurst() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  const colors = ["#f59e0b", "#a855f7", "#10b981", "#06b6d4", "#ec4899"];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const size     = 5 + Math.random() * 8;
    const duration = 1.2 + Math.random() * 1.4;
    const delay    = Math.random() * 0.4;
    piece.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      transform:rotate(${Math.random() * 360}deg);
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ""; }, 3000);
}

// ════════════════════════════════════════════════════════════════
// ⚡ RENDER — MODO RELÁMPAGO
// ════════════════════════════════════════════════════════════════
function renderLightning(s) {
  const lm = s.lightningMode;
  const lightningKey = JSON.stringify({ phase: lm.phase, slot: lm.currentSlot, result: lm.questionResult });
  if (lightningKey === _lastLightningKey) return;
  _lastLightningKey = lightningKey;
  _lastBoardKey = null;
  _lastEstimacionKey = null;
  _clearIntervals();

  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("lightning-overlay").classList.add("visible");

  const order       = s.playerOrder || [];
  const playerCount = order.length;
  const playerIndex = lm.currentSlot % playerCount;
  const round       = Math.floor(lm.currentSlot / playerCount) + 1;
  const perPlayer   = lm.perPlayer || 2;
  const currentPId  = order[playerIndex];
  const pName       = esc(s.players?.[currentPId]?.name || "?");
  const isMyTurnLM  = currentPId === myPlayerId();
  const qData       = LIGHTNING_QUESTIONS[(lm.questionIndices || [])[lm.currentSlot]] || { question: "...", answer: "..." };
  const host        = isHost();

  const contentEl = document.getElementById("lightning-content");
  const actionsEl = document.getElementById("lightning-actions");

  if (lm.phase === "announcing") {
    contentEl.innerHTML = `
      <div class="lightning-announcing">
        <div class="lightning-big-title">⚡<br>MODO<br>RELÁMPAGO</div>
        <p class="lightning-desc">
          Cada jugador responde <strong>${perPlayer} ${perPlayer === 1 ? "pregunta" : "preguntas"}</strong>.<br>
          <strong>10 segundos</strong> por pregunta.<br>
          Correcto: <strong>+200 pts</strong> · Incorrecto: sin penalización
        </p>
      </div>`;
    actionsEl.innerHTML = host
      ? `<button class="btn btn-primario" id="btn-lightning-comenzar" style="width:min(340px,92vw)">⚡ ¡Empezar!</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando que el host inicie el modo...</p>`;
    if (host) document.getElementById("btn-lightning-comenzar").addEventListener("click", _handleLightningComenzar);

  } else if (lm.phase === "question") {
    contentEl.innerHTML = `
      <div class="lightning-player-turn ${isMyTurnLM ? "mi-turno" : ""}">
        ${isMyTurnLM ? "¡Es tu turno!" : pName}
      </div>
      <div class="lightning-round-badge">Ronda ${round}/${perPlayer} · Pregunta ${lm.currentSlot + 1}/${lm.totalSlots}</div>
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
        </div>` : ""}
      ${host
        ? `${isMyTurnLM ? `<p style="color:var(--texto-secundario);text-align:center;margin-bottom:8px">¡Decí tu respuesta en voz alta!</p>` : ""}
           <div class="acciones-host-row" style="width:min(400px,92vw)">
             <button class="btn btn-correcto" id="btn-lightning-correcto">✓ Correcto (+200)</button>
             <button class="btn btn-incorrecto" id="btn-lightning-incorrecto">✗ Incorrecto</button>
           </div>`
        : `<p style="color:var(--texto-secundario);text-align:center">
             ${isMyTurnLM ? "¡Decí tu respuesta en voz alta!" : "Esperando que el host decida..."}
           </p>`}`;
    actionsEl.innerHTML = "";
    if (host) {
      document.getElementById("btn-lightning-correcto").addEventListener("click", () => _handleLightningJudge(true));
      document.getElementById("btn-lightning-incorrecto").addEventListener("click", () => _handleLightningJudge(false));
    }
    renderLightningTimer(lm.openedAt);

  } else if (lm.phase === "judged") {
    const result = lm.questionResult;
    const pts    = result?.correct ? "+200 pts" : "Sin penalización";
    const color  = result?.correct ? "var(--correcto)" : "var(--texto-secundario)";
    contentEl.innerHTML = `
      <div class="lightning-player-turn ${isMyTurnLM ? "mi-turno" : ""}">${pName}</div>
      <div class="lightning-round-badge">Ronda ${round}/${perPlayer} · Pregunta ${lm.currentSlot + 1}/${lm.totalSlots}</div>
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
    actionsEl.innerHTML = host
      ? `<button class="btn btn-primario" id="btn-lightning-siguiente" style="width:min(340px,92vw)">Siguiente ▶</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando al host...</p>`;
    if (host) document.getElementById("btn-lightning-siguiente").addEventListener("click", _handleLightningSiguiente);
  }
}

function renderLightningTimer(openedAt) {
  const TIMEOUT = 10000;
  const tick = () => {
    const circleEl = document.getElementById("lightning-timer-circle");
    const numEl    = document.getElementById("lightning-timer-num");
    const barEl    = document.getElementById("lightning-timer-bar");
    if (!circleEl || !numEl || !barEl) { _clearIntervals(); return; }
    const elapsed   = Date.now() - openedAt;
    const remaining = Math.max(0, TIMEOUT - elapsed);
    const pct       = (remaining / TIMEOUT) * 100;
    const secs      = Math.ceil(remaining / 1000);
    const color     = secs <= 3 ? "var(--incorrecto)" : "var(--acento)";
    if (secs <= 3) {
      circleEl.style.background = `conic-gradient(var(--incorrecto) ${pct}%, rgba(255,255,255,0.08) 0)`;
    } else {
      circleEl.style.background = `conic-gradient(var(--acento) ${pct}%, rgba(255,255,255,0.08) 0)`;
    }
    numEl.textContent = secs > 0 ? secs : "0";
    numEl.style.color = color;
    barEl.style.width = pct + "%";
    barEl.style.background = secs <= 3 ? "var(--incorrecto)" : "var(--acento)";
    if (remaining <= 0) _clearIntervals();
  };
  tick();
  _timerInterval = setInterval(tick, 250);
}

// ════════════════════════════════════════════════════════════════
// 🎯 RENDER — MODO ESTIMACIÓN
// ════════════════════════════════════════════════════════════════
function renderEstimacion(s) {
  const em = s.estimacionMode;
  const estimacionKey = JSON.stringify({ phase: em.phase, slot: em.currentSlot, responses: Object.keys(em.responses || {}).length, winnerId: em.winnerId });
  if (estimacionKey === _lastEstimacionKey) return;
  _lastEstimacionKey = estimacionKey;
  _lastBoardKey = null;
  _lastLightningKey = null;
  _clearIntervals();

  document.getElementById("pregunta-overlay").classList.remove("visible");
  document.getElementById("estimacion-overlay").classList.add("visible");

  const slot       = em.currentSlot || 0;
  const qIdx       = (em.questionIndices || [])[slot] ?? em.questionIndex ?? 0;
  const qData      = ESTIMATION_QUESTIONS[qIdx] || { question: "...", answer: 0 };
  const currentVal = (em.values || [])[slot] ?? em.value ?? 200;
  const responses  = em.responses || {};
  const order      = s.playerOrder || [];
  const myResp     = responses[myPlayerId()]?.value;
  const respCount  = Object.keys(responses).length;
  const totalSlots = em.totalSlots || 1;
  const host       = isHost();

  const contentEl = document.getElementById("estimacion-content");
  const actionsEl = document.getElementById("estimacion-actions");

  if (em.phase === "announcing") {
    contentEl.innerHTML = `
      <div class="estimacion-announcing">
        <div class="estimacion-impact-scene">
          <div class="estimacion-missile">🚀</div>
          <div class="estimacion-diana">🎯</div>
          <div class="estimacion-rings">
            <div class="ering r1"></div><div class="ering r2"></div><div class="ering r3"></div>
          </div>
        </div>
        <div class="estimacion-big-title">MODO<br>ESTIMACIÓN</div>
        <p class="estimacion-desc">
          <strong>${totalSlots} preguntas</strong>, todos responden a la vez.<br>
          El más cercano al número correcto gana los puntos de esa ronda.
        </p>
      </div>`;
    actionsEl.innerHTML = host
      ? `<button class="btn btn-primario" id="btn-estimacion-comenzar" style="width:min(340px,92vw)">🎯 ¡Empezar!</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando que el host inicie...</p>`;
    if (host) document.getElementById("btn-estimacion-comenzar").addEventListener("click", _handleEstimacionComenzar);

  } else if (em.phase === "collecting") {
    const playerRows = order.map(pid => {
      const p    = s.players?.[pid];
      const sent = responses[pid] !== undefined;
      const isMe = pid === myPlayerId();
      return `<div class="estimacion-player-row${isMe ? " yo" : ""}">
        <span class="pname">${esc(p?.name || "?")}${isMe ? " <span style='font-size:0.75rem;color:var(--texto-secundario)'>(tú)</span>" : ""}</span>
        <span class="pstatus${sent ? " enviado" : ""}">${sent ? "✓ Enviado" : "⏳ pensando..."}</span>
      </div>`;
    }).join("");

    contentEl.innerHTML = `
      <div class="estimacion-value-badge">Pregunta ${slot + 1}/${totalSlots} · +${currentVal} pts al más cercano</div>
      <div class="estimacion-question-text">${esc(qData.question)}</div>
      <div class="estimacion-timer-bar-wrap"><div class="estimacion-timer-bar" id="estimacion-timer-bar"></div></div>
      <div class="estimacion-count">${respCount}/${order.length} respondieron</div>
      <div class="estimacion-players-list">${playerRows}</div>`;

    if (myResp !== undefined) {
      actionsEl.innerHTML = `<div class="estimacion-enviado-msg">✓ Enviaste: <strong>${myResp}</strong></div>`;
    } else {
      actionsEl.innerHTML = `
        <div class="estimacion-input-wrap">
          <input class="estimacion-input" type="number" id="estimacion-input" placeholder="Tu número..." autocomplete="off">
          <button class="btn-estimacion-enviar" id="btn-estimacion-enviar">Enviar</button>
        </div>`;
      const inputEl   = document.getElementById("estimacion-input");
      const btnEnviar = document.getElementById("btn-estimacion-enviar");
      if (_estimacionInput) inputEl.value = _estimacionInput;
      inputEl.focus();
      inputEl.addEventListener("input", e => { _estimacionInput = e.target.value; });
      inputEl.addEventListener("keydown", e => { if (e.key === "Enter") _handleEstimacionSubmit(); });
      btnEnviar.addEventListener("click", _handleEstimacionSubmit);
    }
    if (host) {
      const allAnswered = respCount >= order.length;
      const btnEl = document.createElement("button");
      btnEl.className = "btn btn-primario";
      btnEl.id = "btn-estimacion-revelar";
      btnEl.style.cssText = "width:min(340px,92vw);margin-top:8px";
      btnEl.textContent = allAnswered ? "👁 Revelar respuestas" : `👁 Revelar (${respCount}/${order.length} respondieron)`;
      btnEl.disabled = !allAnswered;
      btnEl.addEventListener("click", _handleEstimacionRevelar);
      actionsEl.appendChild(btnEl);
    }
    renderEstimacionTimer(em.openedAt);

  } else if (em.phase === "revealed") {
    const answer    = qData.answer;
    const winnerId  = em.winnerId;
    const podiumMap = Object.fromEntries((em.podium || []).map(p => [p.playerId, p.points]));

    const ranked = order.map(pid => {
      const r   = responses[pid];
      const val = r?.value;
      return { pid, val, diff: val !== undefined ? Math.abs(val - answer) : Infinity, ts: r?.timestamp ?? Infinity };
    }).sort((a, b) => a.diff - b.diff || a.ts - b.ts);

    const medals = ["🥇", "🥈", "🥉"];
    const rows = ranked.map((item, i) => {
      const p        = s.players?.[item.pid];
      const isWinner = item.pid === winnerId;
      const hasResp  = item.val !== undefined;
      const pts      = podiumMap[item.pid];
      return `<div class="estimacion-result-row${isWinner ? " ganador" : ""}" style="animation-delay:${i * 0.08}s">
        <span class="rpos">${medals[i] || `${i + 1}.`}</span>
        <span class="rname">${esc(p?.name || "?")}</span>
        ${hasResp ? `<span class="rval">${item.val}</span><span class="rdiff">±${item.diff}</span>` : `<span class="rsin">Sin respuesta</span>`}
        ${pts ? `<span class="rpts">+${pts} pts</span>` : ""}
      </div>`;
    }).join("");

    const isLast = (slot + 1) >= totalSlots;
    contentEl.innerHTML = `
      <div class="estimacion-value-badge">Pregunta ${slot + 1}/${totalSlots} · +${currentVal} pts</div>
      <div class="estimacion-question-text">${esc(qData.question)}</div>
      <div class="estimacion-answer-reveal">Respuesta correcta<strong>${answer}</strong></div>
      <div class="estimacion-results">${rows}</div>`;
    actionsEl.innerHTML = host
      ? `<button class="btn btn-primario" id="btn-estimacion-siguiente" style="width:min(340px,92vw)">${isLast ? "Volver al juego ▶" : `Siguiente pregunta (${slot + 2}/${totalSlots}) ▶`}</button>`
      : `<p style="color:var(--texto-secundario);text-align:center">Esperando al host...</p>`;
    if (host) document.getElementById("btn-estimacion-siguiente").addEventListener("click", _handleEstimacionSiguiente);
  }
}

function renderEstimacionTimer(openedAt) {
  const TIMEOUT = 45000;
  const tick = () => {
    const barEl = document.getElementById("estimacion-timer-bar");
    if (!barEl) { _clearIntervals(); return; }
    const elapsed = Date.now() - openedAt;
    const pct     = Math.max(0, 100 - (elapsed / TIMEOUT) * 100);
    barEl.style.width      = pct + "%";
    barEl.style.background = pct < 20 ? "var(--incorrecto)" : pct < 50 ? "var(--acento)" : "#06b6d4";
    if (pct <= 0) _clearIntervals();
  };
  tick();
  _timerInterval = setInterval(tick, 500);
}

// ════════════════════════════════════════════════════════════════
// 🎨 RENDER — PREGUNTA
// ════════════════════════════════════════════════════════════════
function renderQuestion(s) {
  _lastBoardKey = null;
  _lastLightningKey = null;
  _lastEstimacionKey = null;
  document.getElementById("pregunta-overlay").classList.add("visible");

  const q      = s.currentQuestion;
  const phase  = s.questionPhase;
  const buzzer = s.buzzer;
  const result = s.questionResult;
  const qData  = getQuestion(q.category, q.value);

  document.getElementById("preg-categoria").textContent = q.category.toUpperCase();
  const valorEl = document.getElementById("preg-valor");
  if (q.bonus) {
    valorEl.innerHTML = `<span class="preg-bonus-badge">⚡ x2 BONUS</span> ${q.value * 2} PTS`;
  } else {
    valorEl.textContent = q.value + " PTS";
  }
  document.getElementById("preg-texto").textContent = qData?.question || "Pregunta no encontrada";

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
  _clearIntervals();
  const bar     = document.getElementById("timer-bar");
  const countEl = document.getElementById("answer-timer-count");

  if (phase === "waiting_buzz") {
    countEl.style.display = "none";
    const TIMEOUT = 45000;
    const tick = () => {
      const elapsed = Date.now() - openedAt;
      const pct     = Math.max(0, 100 - (elapsed / TIMEOUT) * 100);
      bar.style.transition = "width 0.5s linear, background 0.5s";
      bar.style.width      = pct + "%";
      bar.style.background = pct < 20 ? "var(--incorrecto)" : pct < 50 ? "var(--acento)" : "var(--primario-glow)";
      if (pct <= 0) _clearIntervals();
    };
    tick();
    _timerInterval = setInterval(tick, 500);

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
        _clearIntervals();
        _ctx.triggerFlash("incorrecto");
      }
    };
    tick();
    _timerInterval = setInterval(tick, 500);

  } else {
    countEl.style.display = "none";
    bar.style.width       = "100%";
    bar.style.background  = "var(--primario-glow)";
    bar.style.transition  = "none";
  }
}

function renderBuzzerZone(s, phase, buzzer) {
  if (_skipTimeout) { clearTimeout(_skipTimeout); _skipTimeout = null; }

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

  const host = isHost();
  if (phase === "waiting_buzz") {
    btnBuzzer.style.display = "block";
    btnBuzzer.disabled      = false;
    if (host) {
      const remaining = 45000 - (Date.now() - s.currentQuestion.openedAt);
      if (remaining <= 0) {
        btnSkip.style.display = "block";
      } else {
        _skipTimeout = setTimeout(() => {
          document.getElementById("btn-skip").style.display = "block";
        }, remaining);
      }
    }
  } else if (phase === "waiting_answer") {
    btnBuzzer.style.display = "none";
    if (buzzer) {
      const name = s.players?.[buzzer.playerId]?.name || "?";
      buzzerEstado.innerHTML = `<span class="buzzer-ganador">🔔 ¡${name} buzzeó primero!</span>`;
      if (buzzer.playerId === myPlayerId()) {
        buzzerEstado.innerHTML += `<br><span style="font-size:0.88rem;color:var(--texto-secundario)">Decí tu respuesta en voz alto y tocá "Mostrar respuesta"</span>`;
        btnRevelar.style.display = "block";
      }
    }
  } else if (phase === "answer_revealed") {
    btnBuzzer.style.display = "none";
    if (buzzer) {
      const name = s.players?.[buzzer.playerId]?.name || "?";
      buzzerEstado.innerHTML = `<span class="buzzer-ganador">🔔 ¡${name} respondió!</span>`;
    }
    if (host) {
      accionesHost.style.display = "block";
    } else {
      buzzerEstado.innerHTML += `<br><span style="color:var(--texto-secundario);font-size:0.85rem">Esperando que el host decida...</span>`;
    }
  } else if (phase === "judged") {
    btnBuzzer.style.display = "none";
    if (host) {
      btnSiguiente.style.display = "block";
    } else {
      buzzerEstado.innerHTML = `<span style="color:var(--texto-secundario)">Esperando al host...</span>`;
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 🏁 RENDER — PANTALLA FINAL
// ════════════════════════════════════════════════════════════════
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
      <span class="podio-name">${p.name || "?"}${pid === myPlayerId() ? " (tú)" : ""}</span>
      <span class="podio-pts">${p.score || 0} pts</span>
    `;
    podio.appendChild(div);
  });

  document.getElementById("btn-jugar-nuevo").style.display = isHost() ? "block" : "none";
  _launchConfetti();
}

function _launchConfetti() {
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
      left:${Math.random() * 100}vw;
      width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      transform:rotate(${Math.random() * 360}deg);
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(piece);
  }
}

// ════════════════════════════════════════════════════════════════
// 🎮 HANDLERS
// ════════════════════════════════════════════════════════════════
async function _handleSelectQuestion(category, value) {
  const s          = getState();
  const selectorId = (s.playerOrder || [])[s.selectorIndex || 0];
  if (selectorId !== myPlayerId()) return;
  await GameDAO.selectQuestion(roomCode(), category, value);
}

async function _handleBuzzer() {
  const btn = document.getElementById("btn-buzzer");
  btn.disabled = true;
  try {
    await GameDAO.pressBuzzer(roomCode(), myPlayerId());
  } catch (e) {
    console.error("Error al buzzear:", e);
    btn.disabled = false;
  }
}

async function _handleRevelar() {
  const btn = document.getElementById("btn-revelar");
  btn.disabled = true;
  try {
    await GameDAO.revealAnswer(roomCode());
  } catch (e) {
    console.error("Error al revelar:", e);
    btn.disabled = false;
  }
}

async function _handleCorrecto() {
  const s = getState();
  if (!s?.buzzer || !s?.currentQuestion) return;
  const btnC = document.getElementById("btn-correcto");
  const btnI = document.getElementById("btn-incorrecto");
  btnC.disabled = true; btnI.disabled = true;
  const responderId  = s.buzzer.playerId;
  const { value, category, bonus } = s.currentQuestion;
  const pointsDelta  = bonus ? value * 2 : value;
  _ctx.triggerFlash("correcto");
  try {
    await GameDAO.judgeAnswer(roomCode(), responderId, true, pointsDelta, category, value);
  } catch (e) {
    console.error("Error al juzgar correcto:", e);
    btnC.disabled = false; btnI.disabled = false;
  }
}

async function _handleIncorrecto() {
  const s = getState();
  if (!s?.buzzer || !s?.currentQuestion) return;
  const btnC = document.getElementById("btn-correcto");
  const btnI = document.getElementById("btn-incorrecto");
  btnC.disabled = true; btnI.disabled = true;
  const responderId  = s.buzzer.playerId;
  const { value, category, bonus } = s.currentQuestion;
  const pointsDelta  = bonus ? -value * 2 : -value;
  _ctx.triggerFlash("incorrecto");
  try {
    await GameDAO.judgeAnswer(roomCode(), responderId, false, pointsDelta, category, value);
  } catch (e) {
    console.error("Error al juzgar incorrecto:", e);
    btnC.disabled = false; btnI.disabled = false;
  }
}

async function _handleSiguiente() {
  const s   = getState();
  const btn = document.getElementById("btn-siguiente");
  btn.disabled = true;
  const order     = s.playerOrder || [];
  const nextIndex = (s.selectorIndex + 1) % order.length;
  const answered  = countAnsweredCells(s.board, s.categories);
  const len       = s.gameLength || null;

  try {
    if (len) {
      const baseDone = answered >= len.base;
      if (baseDone) {
        if (!s.estimacionUsed && !_estimacionTriggered && len.estimacion > 0) {
          _estimacionTriggered = true;
          await _triggerEstimacionMode(nextIndex);
          return;
        }
        if (!s.lightningUsed && !_lightningTriggered && len.lightning > 0) {
          _lightningTriggered = true;
          await _triggerLightningMode(nextIndex);
          return;
        }
        await GameDAO.nextTurn(roomCode(), nextIndex, true);
        return;
      }
      await GameDAO.nextTurn(roomCode(), nextIndex, false);
      return;
    }
    const isGameOver = isBoardComplete(s.board, s.categories);
    if (!isGameOver && !s.estimacionUsed && !_estimacionTriggered) {
      if (answered >= 10) {
        _estimacionTriggered = true;
        await _triggerEstimacionMode(nextIndex);
        return;
      }
    }
    if (!isGameOver && !s.lightningUsed && !_lightningTriggered) {
      if (answered >= 15) {
        _lightningTriggered = true;
        await _triggerLightningMode(nextIndex);
        return;
      }
    }
    await GameDAO.nextTurn(roomCode(), nextIndex, isGameOver);
  } catch (e) {
    console.error("Error al avanzar turno:", e);
    btn.disabled = false;
    _lightningTriggered  = false;
    _estimacionTriggered = false;
  }
}

async function _handleSkip() {
  const s   = getState();
  const btn = document.getElementById("btn-skip");
  btn.disabled = true;
  const order     = s.playerOrder || [];
  const nextIndex = (s.selectorIndex + 1) % order.length;

  try {
    const answered = countAnsweredCells(s.board, s.categories) + 1;
    const skipCell = { category: s.currentQuestion.category, value: s.currentQuestion.value };
    const len      = s.gameLength || null;

    if (len) {
      const baseDone = answered >= len.base;
      if (baseDone) {
        if (!s.estimacionUsed && !_estimacionTriggered && len.estimacion > 0) {
          _estimacionTriggered = true;
          await _triggerEstimacionMode(nextIndex, skipCell);
          return;
        }
        if (!s.lightningUsed && !_lightningTriggered && len.lightning > 0) {
          _lightningTriggered = true;
          await _triggerLightningMode(nextIndex, skipCell);
          return;
        }
      }
      await GameDAO.skipQuestion(roomCode(), nextIndex);
      return;
    }
    if (!s.estimacionUsed && !_estimacionTriggered && answered >= 10) {
      _estimacionTriggered = true;
      await _triggerEstimacionMode(nextIndex, skipCell);
      return;
    }
    if (!s.lightningUsed && !_lightningTriggered && answered >= 15) {
      _lightningTriggered = true;
      await _triggerLightningMode(nextIndex, skipCell);
      return;
    }
    await GameDAO.skipQuestion(roomCode(), nextIndex);
  } catch (e) {
    console.error("Error al skipear:", e);
    btn.disabled = false;
    _lightningTriggered  = false;
    _estimacionTriggered = false;
  }
}

async function _handleRouletteSpin() {
  const s = getState();
  if (!s || s.rouletteSpin) return;
  const order      = s.playerOrder || [];
  const selectorId = order[s.selectorIndex || 0];
  if (selectorId !== myPlayerId()) return;

  const avail = availableCategories(s);
  if (!avail.length) return;

  const targetIdx    = Math.floor(Math.random() * avail.length);
  const category     = avail[targetIdx];
  const unplayedVals = [200, 400, 600, 800, 1000].filter(v => s.board?.[category]?.[String(v)] !== true);
  const value        = unplayedVals[Math.floor(Math.random() * unplayedVals.length)];
  const isBonus      = Math.random() < RULETA_BONUS_PROBABILITY;

  const n   = avail.length;
  const seg = 360 / n;
  let landingOffsetInSector;
  if (isBonus) {
    landingOffsetInSector = seg - RULETA_BONUS_ARC_DEG + Math.random() * RULETA_BONUS_ARC_DEG;
  } else {
    landingOffsetInSector = Math.random() * (seg - RULETA_BONUS_ARC_DEG);
  }
  const landingAngle   = targetIdx * seg + landingOffsetInSector;
  const baseSpins      = 5 * 360;
  const targetRotation = baseSpins + (360 - landingAngle);

  try {
    await GameDAO.startRouletteSpin(roomCode(), {
      targetCategoryIdx: targetIdx,
      targetCategory: category,
      targetValue: value,
      targetRotation,
      isBonus,
      by: myPlayerId(),
      spinId: `${roomCode()}-${Date.now()}`,
    });
  } catch (e) { console.error("Error al iniciar el giro:", e); }
}

async function _handleLightningComenzar() {
  document.getElementById("btn-lightning-comenzar").disabled = true;
  await GameDAO.lightningBeginQuestion(roomCode());
}

async function _handleLightningJudge(correct) {
  const s         = getState();
  const lm        = s.lightningMode;
  const order     = s.playerOrder || [];
  const playerIdx = lm.currentSlot % order.length;
  const currentPId= order[playerIdx];
  const currentScore = s.players?.[currentPId]?.score || 0;

  const btnC = document.getElementById("btn-lightning-correcto");
  const btnI = document.getElementById("btn-lightning-incorrecto");
  if (btnC) btnC.disabled = true;
  if (btnI) btnI.disabled = true;

  if (correct) _ctx.triggerFlash("correcto");
  else         _ctx.triggerFlash("incorrecto");

  await GameDAO.lightningJudge(roomCode(), currentPId, correct, currentScore);
}

async function _handleLightningSiguiente() {
  const s   = getState();
  const btn = document.getElementById("btn-lightning-siguiente");
  if (btn) btn.disabled = true;
  const lm       = s.lightningMode;
  const nextSlot = lm.currentSlot + 1;
  let isGameOver = false;
  if (nextSlot >= lm.totalSlots) {
    const len = s.gameLength || null;
    if (len) {
      const answered = countAnsweredCells(s.board, s.categories);
      isGameOver = answered >= len.base;
    }
  }
  await GameDAO.lightningAdvance(roomCode(), nextSlot, lm.totalSlots, isGameOver);
}

async function _handleEstimacionComenzar() {
  document.getElementById("btn-estimacion-comenzar").disabled = true;
  await GameDAO.startEstimacionCollecting(roomCode());
}

async function _handleEstimacionSubmit() {
  const inputEl   = document.getElementById("estimacion-input");
  const btnEnviar = document.getElementById("btn-estimacion-enviar");
  if (!inputEl) return;
  const val = parseInt(inputEl.value, 10);
  if (isNaN(val)) { inputEl.focus(); return; }
  if (btnEnviar) btnEnviar.disabled = true;
  _estimacionInput = "";
  try {
    await GameDAO.submitEstimacion(roomCode(), myPlayerId(), val);
  } catch (e) {
    console.error("Error al enviar estimación:", e);
    if (btnEnviar) btnEnviar.disabled = false;
  }
}

async function _handleEstimacionRevelar() {
  const btn = document.getElementById("btn-estimacion-revelar");
  if (btn) btn.disabled = true;
  const s      = getState();
  const em     = s.estimacionMode;
  const slot   = em.currentSlot || 0;
  const qIdx   = (em.questionIndices || [])[slot] ?? em.questionIndex ?? 0;
  const qData  = ESTIMATION_QUESTIONS[qIdx];
  const answer = qData.answer;
  const pointsDelta = (em.values || [])[slot] ?? em.value ?? 200;
  const responses   = em.responses || {};
  const order       = s.playerOrder || [];

  const ranked = order
    .filter(pid => responses[pid]?.value !== undefined)
    .map(pid => ({ pid, diff: Math.abs(responses[pid].value - answer), ts: responses[pid].timestamp ?? Infinity }))
    .sort((a, b) => a.diff - b.diff || a.ts - b.ts);

  const fractions = [1, 0.5, 0.25];
  const podium = ranked.slice(0, 3).map((r, i) => ({
    playerId: r.pid,
    points: Math.round(pointsDelta * fractions[i]),
  }));

  _ctx.triggerFlash("correcto");
  try {
    await GameDAO.revealEstimaciones(roomCode(), podium);
  } catch (e) {
    console.error("Error al revelar estimaciones:", e);
    if (btn) btn.disabled = false;
  }
}

async function _handleEstimacionSiguiente() {
  const s   = getState();
  const btn = document.getElementById("btn-estimacion-siguiente");
  if (btn) btn.disabled = true;
  const em       = s.estimacionMode;
  const nextSlot = (em.currentSlot || 0) + 1;
  try {
    _estimacionInput = "";
    if (nextSlot >= (em.totalSlots || 1)) {
      const len      = s.gameLength || null;
      const answered = countAnsweredCells(s.board, s.categories);
      const baseDone = len
        ? answered >= len.base
        : isBoardComplete(s.board, s.categories);
      if (len && baseDone && !s.lightningUsed && !_lightningTriggered && len.lightning > 0) {
        await GameDAO.endEstimacionMode(roomCode(), em.nextSelectorIndex, false);
        _lightningTriggered = true;
        await _triggerLightningMode(em.nextSelectorIndex);
      } else {
        await GameDAO.endEstimacionMode(roomCode(), em.nextSelectorIndex, baseDone);
      }
    } else {
      await GameDAO.advanceEstimacionQuestion(roomCode(), nextSlot);
    }
  } catch (e) {
    console.error("Error al avanzar estimación:", e);
    if (btn) btn.disabled = false;
  }
}

async function _triggerLightningMode(selectorIndexOnEntry, skipCell = null) {
  const s          = getState();
  const order      = s.playerOrder || [];
  // El slider lightning es "preguntas por jugador" (clamp defensivo 2..5).
  // totalSlots escala con la cantidad real de jugadores → todos juegan lo mismo.
  const perPlayer  = Math.min(5, Math.max(2, s.gameLength?.lightning ?? 2));
  const totalSlots = perPlayer * order.length;
  const usedIndices = s.lightningUsedIndices || [];
  const fullPool    = LIGHTNING_QUESTIONS.map((_, i) => i);
  const available   = fullPool.filter(i => !usedIndices.includes(i));
  const source      = available.length >= totalSlots ? available : fullPool;
  const shuffled    = [...source].sort(() => Math.random() - 0.5);
  const questionIndices  = shuffled.slice(0, totalSlots);
  const nextUsedIndices  = source === fullPool
    ? questionIndices
    : [...new Set([...usedIndices, ...questionIndices])];

  await GameDAO.startLightningMode(roomCode(), {
    active: true, currentSlot: 0, totalSlots, perPlayer, phase: "announcing",
    questionIndices, questionResult: null, openedAt: null,
  }, selectorIndexOnEntry, skipCell, nextUsedIndices);
}

async function _triggerEstimacionMode(nextSelectorIndex, skipCell = null) {
  const s          = getState();
  const TOTAL_SLOTS = s.gameLength?.estimacion ?? 6;
  const valuePool   = [200, 400, 600, 800, 1000];
  const usedIndices = s.estimacionUsedIndices || [];
  const fullPool    = ESTIMATION_QUESTIONS.map((_, i) => i);
  const available   = fullPool.filter(i => !usedIndices.includes(i));
  const source      = available.length >= TOTAL_SLOTS ? available : fullPool;
  const shuffled    = [...source].sort(() => Math.random() - 0.5);
  const questionIndices  = shuffled.slice(0, TOTAL_SLOTS);
  const nextUsedIndices  = source === fullPool
    ? questionIndices
    : [...new Set([...usedIndices, ...questionIndices])];
  const values = Array.from({ length: TOTAL_SLOTS }, () =>
    valuePool[Math.floor(Math.random() * valuePool.length)]
  );

  await GameDAO.startEstimacionMode(roomCode(), {
    active: true, phase: "announcing", currentSlot: 0, totalSlots: TOTAL_SLOTS,
    questionIndices, values, openedAt: null, responses: null,
    winnerId: null, nextSelectorIndex,
  }, skipCell, nextUsedIndices);
}

async function _handleJugarNuevo() {
  if (!isHost()) return;
  _lightningTriggered  = false;
  _estimacionTriggered = false;
  const s          = getState();
  const prevUsed   = s.usedCategories || [];
  const alreadyUsed= [...new Set([...prevUsed, ...(s.categories || [])])];
  const categories = pickRandomCategories(CATEGORY_POOL, 6, alreadyUsed);
  const nextUsed   = alreadyUsed.length + 6 > CATEGORY_POOL.length ? categories : alreadyUsed;
  const board = {};
  categories.forEach(cat => {
    board[cat] = { "200": false, "400": false, "600": false, "800": false, "1000": false };
  });
  const players = {};
  (s.playerOrder || []).forEach(pid => {
    const old = s.players?.[pid];
    if (old) players[pid] = { ...old, score: 0 };
  });
  await GameDAO.createRoom(roomCode(), {
    createdAt: Date.now(),
    hostId: myPlayerId(),
    status: "lobby",
    gameType: "dame-la-main",
    gameMode: s.gameMode || "tablero",
    gameLength: s.gameLength || null,
    categories,
    usedCategories: nextUsed,
    lightningUsedIndices:  s.lightningUsedIndices  || [],
    estimacionUsedIndices: s.estimacionUsedIndices || [],
    board,
    players,
    playerOrder: s.playerOrder,
    selectorIndex: 0,
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
  });
}

// ════════════════════════════════════════════════════════════════
// 📦 CONTRATO DEL MÓDULO
// ════════════════════════════════════════════════════════════════
export default {
  id:          "dame-la-main",
  displayName: "Dame la Main",
  description: "Trivia multijugador por turnos",
  minPlayers:  1,

  initGame(ctx) {
    _ctx = ctx;

    // Sliders de longitud (independientes, sin rebalanceo)
    document.querySelectorAll("#length-sliders .length-slider-input").forEach(input => {
      input.addEventListener("input", e => {
        const slot = e.target.closest(".length-slider-row").dataset.slot;
        _updateLengthSlider(slot, parseInt(e.target.value, 10));
      });
    });
    _updateLengthHint();

    // Mode selector
    document.querySelectorAll(".mode-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll(".mode-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
      });
    });

    // Ruleta spin
    document.getElementById("btn-ruleta-spin")?.addEventListener("click", _handleRouletteSpin);

    // Pregunta / buzzer
    document.getElementById("btn-buzzer")?.addEventListener("click", _handleBuzzer);
    document.getElementById("btn-revelar")?.addEventListener("click", _handleRevelar);
    document.getElementById("btn-correcto")?.addEventListener("click", _handleCorrecto);
    document.getElementById("btn-incorrecto")?.addEventListener("click", _handleIncorrecto);
    document.getElementById("btn-siguiente")?.addEventListener("click", _handleSiguiente);
    document.getElementById("btn-skip")?.addEventListener("click", _handleSkip);

    // Final
    document.getElementById("btn-jugar-nuevo")?.addEventListener("click", _handleJugarNuevo);
  },

  buildInitialState(config) {
    const { name, playerId, gameMode, gameLength } = config;
    const categories = pickRandomCategories(CATEGORY_POOL);
    const board = {};
    categories.forEach(cat => {
      board[cat] = { "200": false, "400": false, "600": false, "800": false, "1000": false };
    });
    return {
      gameType: "dame-la-main",
      gameMode: gameMode || "tablero",
      gameLength: gameLength || null,
      categories,
      board,
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
    };
  },

  render(s) {
    checkSoundTriggers(s);
    if (s.status === "playing") {
      if (s.lightningMode?.active) {
        document.getElementById("estimacion-overlay").classList.remove("visible");
        document.getElementById("vista-ruleta").style.display  = "none";
        document.getElementById("vista-tablero").style.display = "block";
        renderLightning(s);
      } else if (s.estimacionMode?.active) {
        document.getElementById("lightning-overlay").classList.remove("visible");
        document.getElementById("vista-ruleta").style.display  = "none";
        document.getElementById("vista-tablero").style.display = "block";
        renderEstimacion(s);
      } else {
        document.getElementById("lightning-overlay").classList.remove("visible");
        document.getElementById("estimacion-overlay").classList.remove("visible");
        if (s.rouletteSpin) {
          renderRouletteSpin(s);
        } else if (!s.currentQuestion) {
          if (s.gameMode === "ruleta") {
            renderRoulette(s);
          } else {
            document.getElementById("vista-ruleta").style.display  = "none";
            document.getElementById("vista-tablero").style.display = "block";
            renderBoard(s);
          }
        } else {
          renderQuestion(s);
        }
      }
    } else if (s.status === "finished") {
      document.getElementById("lightning-overlay").classList.remove("visible");
      document.getElementById("estimacion-overlay").classList.remove("visible");
      document.getElementById("vista-tablero").style.display = "none";
      document.getElementById("vista-ruleta").style.display  = "none";
      renderFinished(s);
    }
  },

  cleanup() {
    _clearIntervals();
    if (_ruletaTickRaf)     { cancelAnimationFrame(_ruletaTickRaf); _ruletaTickRaf = null; }
    if (_ruletaRevealTimer) { clearTimeout(_ruletaRevealTimer);     _ruletaRevealTimer = null; }
    if (_ruletaFinishTimer) { clearTimeout(_ruletaFinishTimer);     _ruletaFinishTimer = null; }
    _lightningTriggered  = false;
    _estimacionTriggered = false;
    _lastBoardKey        = null;
    _lastLightningKey    = null;
    _lastEstimacionKey   = null;
    _lastRuletaKey       = null;
    _lastBuzzerTs        = null;
    _lastPhase           = null;
    _lastLightningPhase  = null;
    _lastEstimacionPhase = null;
  },
};
