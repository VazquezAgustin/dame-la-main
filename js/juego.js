import { GameDAO, firebaseConfigurado } from "./firebase.js";
import { CATEGORY_POOL, QUESTIONS, pickRandomCategories } from "./preguntas.js";

// ═══════════════════════════════════════════════════════════════
// 🎮 ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════
let myPlayerId = sessionStorage.getItem("playerId");
if (!myPlayerId) {
  myPlayerId = "p_" + Date.now().toString(36);
  sessionStorage.setItem("playerId", myPlayerId);
}

let myName        = "";
let roomCode      = "";
let state         = null;
let isHost        = false;
let unsubscribe   = null;
let timerInterval = null;
let skipTimeout   = null;

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

function getQuestion(category, value) {
  return (QUESTIONS[category] || []).find(q => q.value === value) || null;
}

function clearIntervals() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (skipTimeout)   { clearTimeout(skipTimeout);    skipTimeout   = null; }
}

// ═══════════════════════════════════════════════════════════════
// 🎨 RENDER — LOBBY
// ═══════════════════════════════════════════════════════════════
function renderLobby(s) {
  const order   = s.playerOrder || [];
  const players = s.players || {};
  const lista   = document.getElementById("lista-jugadores");
  lista.innerHTML = "";

  order.forEach(pid => {
    const p = players[pid];
    if (!p) return;
    const div = document.createElement("div");
    div.className = "jugador-item";
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
// 🎨 RENDER — PREGUNTA
// ═══════════════════════════════════════════════════════════════
function renderQuestion(s) {
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
// 🎯 RENDER PRINCIPAL — listener único
// ═══════════════════════════════════════════════════════════════
function render(s) {
  if (!s) return;
  state  = s;
  isHost = myPlayerId === s.hostId;

  switch (s.status) {
    case "lobby":
      showScreen("screen-lobby");
      document.getElementById("lobby-codigo").textContent = roomCode;
      renderLobby(s);
      break;
    case "playing":
      showScreen("screen-game");
      updateScorebar(s);
      if (!s.currentQuestion) renderBoard(s);
      else                    renderQuestion(s);
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
  await GameDAO.pressBuzzer(roomCode, myPlayerId);
}

async function handleRevelar() {
  await GameDAO.revealAnswer(roomCode);
}

async function handleCorrecto() {
  if (!state?.buzzer || !state?.currentQuestion) return;
  document.getElementById("btn-correcto").disabled   = true;
  document.getElementById("btn-incorrecto").disabled = true;
  const responderId = state.buzzer.playerId;
  const pointsDelta = state.currentQuestion.value;
  triggerFlash("correcto");
  await GameDAO.judgeAnswer(roomCode, responderId, true, pointsDelta);
}

async function handleIncorrecto() {
  if (!state?.buzzer || !state?.currentQuestion) return;
  document.getElementById("btn-correcto").disabled   = true;
  document.getElementById("btn-incorrecto").disabled = true;
  const responderId = state.buzzer.playerId;
  const pointsDelta = -state.currentQuestion.value;
  triggerFlash("incorrecto");
  await GameDAO.judgeAnswer(roomCode, responderId, false, pointsDelta);
}

async function handleSiguiente() {
  document.getElementById("btn-siguiente").disabled = true;
  const order      = state.playerOrder || [];
  const nextIndex  = (state.selectorIndex + 1) % order.length;
  const isGameOver = isBoardComplete(state.board, state.categories);
  await GameDAO.nextTurn(roomCode, nextIndex, isGameOver);
}

async function handleSkip() {
  document.getElementById("btn-skip").disabled = true;
  const order     = state.playerOrder || [];
  const nextIndex = (state.selectorIndex + 1) % order.length;
  await GameDAO.skipQuestion(roomCode, nextIndex);
}

async function handleJugarNuevo() {
  if (!isHost) return;
  const categories = pickRandomCategories(CATEGORY_POOL);
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
  if (savedRoom && savedName) {
    roomCode = savedRoom;
    myName   = savedName;
    subscribeToRoom(roomCode);
  }
}

// Limpieza
window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
  clearIntervals();
});
