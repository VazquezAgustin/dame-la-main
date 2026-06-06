import { GameDAO, firebaseConfigurado } from "./firebase.js";
import DameLaMainGame    from "./games/dame-la-main/index.js";
import QuienEsMainGame   from "./games/quien-es-main/index.js";
import PictionaryGame    from "./games/pictionary/index.js";
import { ACTIVE_THEME }  from "./theme.config.js";

// ── Temática (colores + microcopys) ───────────────────────────────
// Un solo flag (js/theme.config.js) controla todo. Rollback = "classic".
document.documentElement.dataset.theme = ACTIVE_THEME;
{
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = ACTIVE_THEME === "mundial" ? "#1f86d0" : "#7c3aed";
}
if (ACTIVE_THEME === "mundial") {
  const sub = document.querySelector(".subtitulo");
  if (sub) sub.textContent = "La trivia del Mundial ⚽";
  const buzz = document.getElementById("btn-buzzer");
  if (buzz) buzz.textContent = "⚽ ¡PULSA!";
  const desc = document.querySelector('.game-option[data-game="dame-la-main"] .game-desc');
  if (desc) desc.textContent = "Trivia mundialista";
}

// ── Registro de juegos disponibles ────────────────────────────────
const GAMES = {
  "dame-la-main":  DameLaMainGame,
  "quien-es-main": QuienEsMainGame,
  "pictionary":    PictionaryGame,
};
function getGame(s) {
  return GAMES[s?.gameType ?? "dame-la-main"] ?? DameLaMainGame;
}

// ── Migración: playerId de sessionStorage → localStorage ─────────
if (!localStorage.getItem("playerId")) {
  const legacy = sessionStorage.getItem("playerId");
  if (legacy) localStorage.setItem("playerId", legacy);
}

// ── Identidad ─────────────────────────────────────────────────────
let myPlayerId = localStorage.getItem("playerId");
if (!myPlayerId) {
  myPlayerId = "p_" + Date.now().toString(36);
  localStorage.setItem("playerId", myPlayerId);
}

// ── Estado global ─────────────────────────────────────────────────
let myName    = "";
let roomCode  = "";
let state     = null;
let isHost    = false;
let unsubscribe   = null;
let _hostMigrating = false;
let _lastScorebarKey = null;

// ── Contexto expuesto al módulo de juego ─────────────────────────
const gameCtx = {
  getMyPlayerId: () => myPlayerId,
  getRoomCode:   () => roomCode,
  getIsHost:     () => isHost,
  getState:      () => state,
  triggerFlash:  (type) => triggerFlash(type),
};

// ── Inicializar cada juego ────────────────────────────────────────
Object.values(GAMES).forEach(game => game.initGame(gameCtx));

// ════════════════════════════════════════════════════════════════
// 🛠️ UTILIDADES
// ════════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  const showBar = id === "screen-game" || id === "screen-finished";
  document.getElementById("scorebar").style.display = showBar ? "block" : "none";
}

function setError(msg) { document.getElementById("error-inicio").textContent = msg; }
function clearError()  { document.getElementById("error-inicio").textContent = ""; }

function triggerFlash(type) {
  const el = document.getElementById("flash-overlay");
  el.className = "flash-overlay " + type;
  setTimeout(() => { el.className = "flash-overlay"; }, 1200);
}

function generateQR(code) {
  const container = document.getElementById("qr-container");
  if (container.hasChildNodes()) return;
  if (typeof QRCode === "undefined") return;
  try {
    const url = `${location.origin}${location.pathname}?room=${code}`;
    new QRCode(container, { text: url, width: 140, height: 140, colorDark: "#f8fafc", colorLight: "#1e1b4b" }); // eslint-disable-line no-undef
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════════
// 🎨 RENDER — LOBBY
// ════════════════════════════════════════════════════════════════
function renderLobby(s) {
  const order   = s.playerOrder || [];
  const players = s.players || {};
  const lista   = document.getElementById("lista-jugadores");

  lista.querySelectorAll(".jugador-item").forEach(el => {
    if (!players[el.dataset.pid]) el.remove();
  });

  order.forEach(pid => {
    const p = players[pid];
    if (!p) return;
    if (document.querySelector(`[data-pid="${pid}"]`)) return;
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

  generateQR(roomCode);

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

// ════════════════════════════════════════════════════════════════
// 🎨 RENDER — SCOREBAR
// ════════════════════════════════════════════════════════════════
function updateScorebar(s) {
  if (!s?.players || !s?.playerOrder) return;
  const scorebarKey = JSON.stringify({
    scores: Object.fromEntries(s.playerOrder.map(pid => [pid, s.players[pid]?.score || 0])),
    selectorIndex: s.selectorIndex,
    isHost,
    status: s.status,
    roomCode,
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

  document.getElementById("scorebar").classList.toggle("host", isHost);

  const rcEl = document.getElementById("scorebar-room-code");
  if (isHost && roomCode) {
    rcEl.innerHTML = `
      <div class="scorebar-roomcode">
        <span class="scorebar-roomcode-label">CÓDIGO DE SALA</span>
        <span class="scorebar-roomcode-code">${roomCode}</span>
        <button class="scorebar-roomcode-copy" id="btn-copy-roomcode" title="Copiar código">📋</button>
      </div>
    `;
    document.getElementById("btn-copy-roomcode").addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(roomCode).then(() => {
        const btn = document.getElementById("btn-copy-roomcode");
        if (btn) { btn.textContent = "✓"; setTimeout(() => { if (btn) btn.textContent = "📋"; }, 1500); }
      });
    });
  } else {
    rcEl.innerHTML = "";
  }

  const sorted = [...order].sort((a, b) => (players[b]?.score || 0) - (players[a]?.score || 0));
  const rankEl = document.getElementById("scorebar-ranking");
  rankEl.innerHTML = "";
  const medals      = ["🥇", "🥈", "🥉"];
  const canKick     = isHost && s.status === "playing";
  const canPassHost = isHost;
  sorted.forEach((pid, i) => {
    const p = players[pid];
    if (!p) return;
    const div = document.createElement("div");
    div.className = "rank-item";
    const kickBtn = (canKick && pid !== myPlayerId)
      ? `<button class="btn-kick" data-pid="${pid}" title="Expulsar jugador">×</button>`
      : "";
    const passHostBtn = (canPassHost && pid !== myPlayerId)
      ? `<button class="btn-pass-host" data-pid="${pid}" title="Pasar host a este jugador">👑</button>`
      : "";
    div.innerHTML = `
      <span class="rank-pos">${medals[i] || (i + 1)}</span>
      <div class="rank-avatar">${(p.name || "?")[0].toUpperCase()}</div>
      <span class="rank-name">${p.name || "?"}</span>
      ${pid === myPlayerId ? '<span class="rank-tu">← Tú</span>' : ''}
      <span class="rank-pts">${p.score || 0} pts</span>
      ${passHostBtn}${kickBtn}
    `;
    rankEl.appendChild(div);
  });
}

// ════════════════════════════════════════════════════════════════
// 🔄 MIGRACIÓN DE HOST
// ════════════════════════════════════════════════════════════════
function checkHostMigration(s) {
  if (!s.players || !s.playerOrder || !s.hostId) return;
  const hostConnected = s.players[s.hostId]?.connected;
  if (hostConnected !== false) { _hostMigrating = false; return; }
  if (_hostMigrating) return;
  const newHostId = s.playerOrder.find(pid => pid !== s.hostId && s.players[pid]?.connected !== false);
  if (!newHostId) return;
  _hostMigrating = true;
  GameDAO.migrateHost(roomCode, s.hostId, newHostId).catch(() => { _hostMigrating = false; });
}

// ════════════════════════════════════════════════════════════════
// 🎯 RENDER PRINCIPAL — dispatcher
// ════════════════════════════════════════════════════════════════
function render(s) {
  if (!s) return;

  if (s.playerOrder && !s.playerOrder.includes(myPlayerId)) {
    localStorage.removeItem("roomCode");
    localStorage.removeItem("myName");
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    document.getElementById("kicked-overlay").style.display = "flex";
    return;
  }

  state  = s;
  isHost = myPlayerId === s.hostId;

  if (!myName && s.players?.[myPlayerId]?.name) {
    myName = s.players[myPlayerId].name;
    localStorage.setItem("myName", myName);
  }

  checkHostMigration(s);

  const game = getGame(s);

  switch (s.status) {
    case "lobby":
      showScreen("screen-lobby");
      document.getElementById("lobby-codigo").textContent = roomCode;
      renderLobby(s);
      break;
    case "playing":
      showScreen("screen-game");
      updateScorebar(s);
      game.render(s);
      break;
    case "finished":
      showScreen("screen-finished");
      updateScorebar(s);
      game.render(s);
      break;
  }
}

// ════════════════════════════════════════════════════════════════
// 🚀 HANDLERS DE INICIO / LOBBY
// ════════════════════════════════════════════════════════════════
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

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

    const selectedGameType = document.querySelector(".game-option.active")?.dataset.game || "dame-la-main";
    const game             = GAMES[selectedGameType] ?? DameLaMainGame;

    let buildConfig = { name, playerId: myPlayerId };
    if (selectedGameType === "dame-la-main") {
      const selectedMode = document.querySelector(".mode-option.active")?.dataset.mode || "tablero";
      buildConfig.gameMode = selectedMode === "ruleta" ? "ruleta" : "tablero";
      const rows = document.querySelectorAll("#length-sliders .length-slider-row");
      buildConfig.gameLength = {};
      rows.forEach(row => {
        buildConfig.gameLength[row.dataset.slot] = parseInt(row.querySelector(".length-slider-input").value, 10);
      });
    } else if (selectedGameType === "quien-es-main") {
      buildConfig.roundsPerPlayer = parseInt(document.getElementById("quien-rounds-slider")?.value || "2", 10);
      buildConfig.famososPerRound = parseInt(document.getElementById("quien-famosos-slider")?.value || "8", 10);
      buildConfig.roundDuration   = parseInt(document.getElementById("quien-duration-slider")?.value || "60", 10);
    } else if (selectedGameType === "pictionary") {
      buildConfig.roundsPerPlayer = parseInt(document.getElementById("picto-rounds-slider")?.value || "2", 10);
      buildConfig.drawSeconds     = parseInt(document.getElementById("picto-duration-slider")?.value || "80", 10);
      buildConfig.categoria       = document.querySelector("#picto-cat-selector .picto-cat-option.active")?.dataset.cat || "mixto";
    }

    const gameState   = game.buildInitialState(buildConfig);

    await GameDAO.createRoom(roomCode, {
      createdAt: Date.now(),
      hostId:    myPlayerId,
      status:    "lobby",
      players:   { [myPlayerId]: { name, score: 0, connected: true } },
      playerOrder:   [myPlayerId],
      selectorIndex: 0,
      ...gameState,
    });
    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("myName",   myName);
    try { window.history.replaceState(null, "", `?room=${roomCode}`); } catch (_) {}
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
      const rejoin = await GameDAO.canRejoin(code, myPlayerId);
      if (!rejoin) {
        setError("Sala no encontrada o ya iniciada");
        btn.disabled = false; btn.textContent = "Unirse";
        return;
      }
      myName = name; roomCode = code;
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("myName",   myName);
      subscribeToRoom(roomCode);
      GameDAO.setupPresence(roomCode, myPlayerId).catch(() => {});
      return;
    }
    myName = name; roomCode = code;
    await GameDAO.joinRoom(roomCode, myPlayerId, { name, score: 0, connected: true });
    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("myName",   myName);
    try { window.history.replaceState(null, "", `?room=${roomCode}`); } catch (_) {}
    subscribeToRoom(roomCode);
    GameDAO.setupPresence(roomCode, myPlayerId).catch(() => {});
  } catch (e) {
    setError("Error al unirse. Intentá de nuevo.");
    console.error(e);
    btn.disabled = false; btn.textContent = "Unirse";
  }
}

function handleSalir() {
  if (!confirm("¿Salir de la sala? Vas a volver a la pantalla de inicio.")) return;
  localStorage.removeItem("roomCode");
  localStorage.removeItem("myName");
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  const game = getGame(state);
  game?.cleanup();
  try { window.history.replaceState(null, "", location.pathname); } catch (_) {}
  location.reload();
}

async function handleKick(playerId) {
  if (!isHost || playerId === myPlayerId) return;
  try {
    await GameDAO.kickPlayer(roomCode, playerId);
  } catch (e) { console.error("Error al expulsar jugador:", e); }
}

function subscribeToRoom(code) {
  if (unsubscribe) unsubscribe();
  let _nullTimer = null;
  unsubscribe = GameDAO.subscribe(code, (gameState) => {
    if (!gameState) {
      // Firebase puede disparar null momentáneamente cuando set() reemplaza el nodo
      // (e.g. al reiniciar partida). Esperamos antes de tratar como "sala eliminada".
      if (_nullTimer) return;
      _nullTimer = setTimeout(() => {
        _nullTimer = null;
        localStorage.removeItem("roomCode");
        localStorage.removeItem("myName");
        setError("Sala no encontrada");
        showScreen("screen-inicio");
      }, 1500);
      return;
    }
    if (_nullTimer) { clearTimeout(_nullTimer); _nullTimer = null; }
    render(gameState);
  });
}

// ════════════════════════════════════════════════════════════════
// 🔗 EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

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
document.getElementById("btn-copiar-link").addEventListener("click", () => {
  const url = `${location.origin}${location.pathname}?room=${roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("btn-copiar-link");
    const prev = btn.textContent;
    btn.textContent = "✅ Copiado";
    setTimeout(() => btn.textContent = prev, 2000);
  });
});

async function handlePassHost(targetPid) {
  if (!isHost || targetPid === myPlayerId) return;
  try {
    await GameDAO.migrateHost(roomCode, myPlayerId, targetPid);
  } catch (e) { console.error("Error al pasar host:", e); }
}

// Scorebar: toggle, kick (delegación), salir
document.getElementById("scorebar").addEventListener("click", (e) => {
  const passHostBtn = e.target.closest(".btn-pass-host");
  if (passHostBtn) {
    e.stopPropagation();
    handlePassHost(passHostBtn.dataset.pid);
    return;
  }
  const kickBtn = e.target.closest(".btn-kick");
  if (kickBtn) {
    e.stopPropagation();
    handleKick(kickBtn.dataset.pid);
    return;
  }
  if (e.target.closest("#btn-salir-scorebar")) {
    e.stopPropagation();
    handleSalir();
    return;
  }
  document.getElementById("scorebar").classList.toggle("expanded");
});

document.getElementById("btn-salir-lobby").addEventListener("click", handleSalir);

// Game selector (Crear sala tab)
document.querySelectorAll(".game-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".game-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    const selected = opt.dataset.game;
    document.getElementById("dame-la-main-options").style.display =
      selected === "dame-la-main" ? "block" : "none";
    document.getElementById("quien-es-main-options").style.display =
      selected === "quien-es-main" ? "block" : "none";
    document.getElementById("pictionary-options").style.display =
      selected === "pictionary" ? "block" : "none";
  });
});

// Auto-reconexión al recargar
if (firebaseConfigurado) {
  const savedRoom = localStorage.getItem("roomCode");
  const savedName = localStorage.getItem("myName");
  if (savedRoom) {
    roomCode = savedRoom;
    if (savedName) myName = savedName;
    subscribeToRoom(roomCode);
  } else {
    const urlParams     = new URLSearchParams(window.location.search);
    const roomFromUrl   = (urlParams.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (roomFromUrl.length === 6) {
      document.querySelector('[data-tab="unirse"]').click();
      document.getElementById("input-codigo").value = roomFromUrl;
      document.getElementById("input-nombre-unirse").focus();
    }
  }
}

// Limpieza al cerrar
window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
  const game = getGame(state);
  game?.cleanup();
});
