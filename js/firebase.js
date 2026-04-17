import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, get, update, onValue, runTransaction, serverTimestamp, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "./firebase.config.js";

export const firebaseConfigurado = firebaseConfig.apiKey !== "TU_API_KEY";

let db;
if (firebaseConfigurado) {
  const fbApp = initializeApp(firebaseConfig);
  db = getDatabase(fbApp);
}

// ═══════════════════════════════════════════════════════════════
// 🗄️ DAO — Capa de abstracción de datos
// ═══════════════════════════════════════════════════════════════
export const GameDAO = {
  createRoom:            async () => {},
  roomExists:            async () => false,
  joinRoom:              async () => {},
  startGame:             async () => {},
  selectQuestion:        async () => {},
  pressBuzzer:           async () => false,
  revealAnswer:          async () => {},
  judgeAnswer:           async () => {},
  nextTurn:              async () => {},
  skipQuestion:          async () => {},
  startLightningMode:        async () => {},
  lightningBeginQuestion:    async () => {},
  lightningJudge:            async () => {},
  lightningAdvance:          async () => {},
  startEstimacionMode:        async () => {},
  startEstimacionCollecting:  async () => {},
  submitEstimacion:           async () => {},
  revealEstimaciones:         async () => {},
  advanceEstimacionQuestion:  async () => {},
  endEstimacionMode:          async () => {},
  setupPresence:             async () => {},
  migrateHost:           async () => {},
  subscribe:             () => () => {},
};

// 🔥 IMPLEMENTACIÓN FIREBASE
if (firebaseConfigurado) {
  const rRef = (code) => ref(db, `rooms/${code}`);

  GameDAO.createRoom = async (roomCode, initialState) => {
    await set(rRef(roomCode), initialState);
    return roomCode;
  };

  GameDAO.roomExists = async (roomCode) => {
    const snap = await get(rRef(roomCode));
    return snap.exists() && snap.val().status === "lobby";
  };

  GameDAO.joinRoom = async (roomCode, playerId, playerData) => {
    const snap = await get(ref(db, `rooms/${roomCode}/playerOrder`));
    const order = snap.val() || [];
    if (order.includes(playerId)) return;
    await update(rRef(roomCode), {
      [`players/${playerId}`]: playerData,
      playerOrder: [...order, playerId],
    });
  };

  GameDAO.startGame = async (roomCode) => {
    await update(rRef(roomCode), { status: "playing" });
  };

  GameDAO.selectQuestion = async (roomCode, category, value) => {
    await update(rRef(roomCode), {
      currentQuestion: { category, value, openedAt: serverTimestamp() },
      buzzer: null,
      questionPhase: "waiting_buzz",
      questionResult: null,
    });
  };

  GameDAO.pressBuzzer = async (roomCode, playerId) => {
    let won = false;
    await runTransaction(ref(db, `rooms/${roomCode}/buzzer`), (current) => {
      if (current !== null) return;
      won = true;
      return { playerId, timestamp: Date.now() };
    });
    if (won) {
      try {
        await update(rRef(roomCode), { questionPhase: "waiting_answer" });
      } catch (e) {
        // La fase no se actualizó — revertir el buzzer para no dejar el juego trabado
        try { await set(ref(db, `rooms/${roomCode}/buzzer`), null); } catch (_) {}
        throw e;
      }
    }
    return won;
  };

  GameDAO.revealAnswer = async (roomCode) => {
    await update(rRef(roomCode), { questionPhase: "answer_revealed" });
  };

  GameDAO.judgeAnswer = async (roomCode, responderId, correct, pointsDelta, category, value) => {
    const scoreSnap = await get(ref(db, `rooms/${roomCode}/players/${responderId}/score`));
    const currentScore = scoreSnap.val() || 0;
    await update(rRef(roomCode), {
      [`players/${responderId}/score`]: currentScore + pointsDelta,
      [`board/${category}/${value}`]: true,
      questionResult: { responderId, correct, pointsDelta },
      questionPhase: "judged",
    });
  };

  GameDAO.nextTurn = async (roomCode, nextSelectorIndex, isGameOver) => {
    await update(rRef(roomCode), {
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
      selectorIndex: nextSelectorIndex,
      status: isGameOver ? "finished" : "playing",
    });
  };

  GameDAO.skipQuestion = async (roomCode, nextSelectorIndex) => {
    const snap = await get(ref(db, `rooms/${roomCode}/currentQuestion`));
    const q = snap.val();
    await update(rRef(roomCode), {
      [`board/${q.category}/${q.value}`]: true,
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
      selectorIndex: nextSelectorIndex,
    });
  };

  GameDAO.subscribe = (roomCode, callback) => {
    const unsub = onValue(rRef(roomCode), (snap) => callback(snap.val()));
    return unsub;
  };

  // ── Modo Relámpago ────────────────────────────────────────────

  // Activa el modo relámpago. Limpia el estado de pregunta actual,
  // opcionalmente marca una celda salteada, y guarda lightningMode.
  GameDAO.startLightningMode = async (roomCode, lightningData, selectorIndexOnEntry, skipCell = null, usedIndices = null) => {
    const updates = {
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
      selectorIndex: selectorIndexOnEntry,
      lightningMode: lightningData,
      lightningUsed: true,
    };
    if (skipCell)    updates[`board/${skipCell.category}/${skipCell.value}`] = true;
    if (usedIndices) updates.lightningUsedIndices = usedIndices;
    await update(rRef(roomCode), updates);
  };

  // El host inicia la primera pregunta del modo relámpago.
  GameDAO.lightningBeginQuestion = async (roomCode) => {
    await update(rRef(roomCode), {
      "lightningMode/phase": "question",
      "lightningMode/openedAt": serverTimestamp(),
      "lightningMode/questionResult": null,
    });
  };

  // Registra presencia del jugador: marca connected=false automáticamente al desconectarse.
  GameDAO.setupPresence = async (roomCode, playerId) => {
    const presenceRef = ref(db, `rooms/${roomCode}/players/${playerId}/connected`);
    await onDisconnect(presenceRef).set(false);
    await set(presenceRef, true);
  };

  // Migra el host a otro jugador usando transacción para evitar condición de carrera.
  // Solo tiene efecto si el hostId actual sigue siendo currentHostId.
  GameDAO.migrateHost = async (roomCode, currentHostId, newHostId) => {
    await runTransaction(ref(db, `rooms/${roomCode}/hostId`), (hostId) => {
      if (hostId !== currentHostId) return; // ya fue migrado por otro cliente
      return newHostId;
    });
  };

  // El host juzga la respuesta de un jugador en modo relámpago.
  GameDAO.lightningJudge = async (roomCode, playerId, correct, currentScore) => {
    const updates = {
      "lightningMode/phase": "judged",
      "lightningMode/questionResult": { correct, pointsDelta: correct ? 200 : 0 },
    };
    if (correct) {
      updates[`players/${playerId}/score`] = currentScore + 200;
    }
    await update(rRef(roomCode), updates);
  };

  // Avanza al siguiente jugador/ronda, o termina el modo relámpago.
  GameDAO.lightningAdvance = async (roomCode, nextSlot, totalSlots) => {
    if (nextSlot >= totalSlots) {
      // Fin del modo — selectorIndex ya está correcto desde startLightningMode
      await update(rRef(roomCode), { lightningMode: null });
    } else {
      await update(rRef(roomCode), {
        "lightningMode/currentSlot": nextSlot,
        "lightningMode/phase": "question",
        "lightningMode/openedAt": serverTimestamp(),
        "lightningMode/questionResult": null,
      });
    }
  };

  // ── Modo Estimación ───────────────────────────────────────────

  // Activa el modo estimación. Opcionalmente marca una celda salteada.
  GameDAO.startEstimacionMode = async (roomCode, estimacionData, skipCell = null, usedIndices = null) => {
    const updates = {
      currentQuestion: null,
      buzzer: null,
      questionPhase: null,
      questionResult: null,
      estimacionMode: estimacionData,
      estimacionUsed: true,
    };
    if (skipCell)    updates[`board/${skipCell.category}/${skipCell.value}`] = true;
    if (usedIndices) updates.estimacionUsedIndices = usedIndices;
    await update(rRef(roomCode), updates);
  };

  // El host arranca la fase de recolección de respuestas.
  GameDAO.startEstimacionCollecting = async (roomCode) => {
    await update(rRef(roomCode), {
      "estimacionMode/phase": "collecting",
      "estimacionMode/openedAt": serverTimestamp(),
    });
  };

  // Un jugador envía su estimación numérica. Guarda timestamp del servidor
  // para desempatar por orden de envío cuando hay respuestas con la misma diferencia.
  GameDAO.submitEstimacion = async (roomCode, playerId, value) => {
    await update(rRef(roomCode), {
      [`estimacionMode/responses/${playerId}`]: {
        value,
        timestamp: serverTimestamp(),
      },
    });
  };

  // El host revela todas las respuestas y asigna puntos al podio (1°, 2°, 3°).
  // podium: [{ playerId, points }] ya ordenado del 1° al 3°.
  GameDAO.revealEstimaciones = async (roomCode, podium) => {
    const updates = {
      "estimacionMode/phase": "revealed",
      "estimacionMode/winnerId": podium[0]?.playerId ?? null,
      "estimacionMode/podium": podium,
    };
    for (const { playerId, points } of podium) {
      if (!playerId || !points) continue;
      const scoreSnap = await get(ref(db, `rooms/${roomCode}/players/${playerId}/score`));
      const currentScore = scoreSnap.val() || 0;
      updates[`players/${playerId}/score`] = currentScore + points;
    }
    await update(rRef(roomCode), updates);
  };

  // El host avanza a la siguiente pregunta de estimación.
  GameDAO.advanceEstimacionQuestion = async (roomCode, nextSlot) => {
    await update(rRef(roomCode), {
      "estimacionMode/currentSlot": nextSlot,
      "estimacionMode/phase": "collecting",
      "estimacionMode/openedAt": serverTimestamp(),
      "estimacionMode/responses": null,
      "estimacionMode/winnerId": null,
      "estimacionMode/podium": null,
    });
  };

  // El host cierra el modo estimación y avanza el turno.
  GameDAO.endEstimacionMode = async (roomCode, nextSelectorIndex, isGameOver) => {
    await update(rRef(roomCode), {
      estimacionMode: null,
      selectorIndex: nextSelectorIndex,
      status: isGameOver ? "finished" : "playing",
    });
  };
}
