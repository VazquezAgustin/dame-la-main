import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, get, update, onValue, runTransaction, serverTimestamp, onDisconnect, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase.config.js";
import { canSteal } from "./logica.js";

export const firebaseConfigurado = firebaseConfig.apiKey !== "TU_API_KEY";

let db;
// Se resuelve cuando terminó (bien o mal) el login anónimo. Nunca rechaza ni
// bloquea más de 4s: con las reglas abiertas el juego funciona igual sin auth;
// con database.rules.json publicado, las reglas exigen `auth != null`.
let _authReady = Promise.resolve();
if (firebaseConfigurado) {
  const fbApp = initializeApp(firebaseConfig);
  db = getDatabase(fbApp);
  _authReady = Promise.race([
    signInAnonymously(getAuth(fbApp)).catch((e) => {
      console.warn("Login anónimo no disponible (¿falta habilitarlo en Firebase Auth?):", e?.code || e);
    }),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
}

// ═══════════════════════════════════════════════════════════════
// 🗄️ DAO — Capa de abstracción de datos
// ═══════════════════════════════════════════════════════════════
export const GameDAO = {
  ready:                 async () => {},
  createRoom:            async () => {},
  roomExists:            async () => false,
  canRejoin:             async () => false,
  joinRoom:              async () => {},
  startGame:             async () => {},
  selectQuestion:        async () => {},
  pressBuzzer:           async () => false,
  revealAnswer:          async () => false,
  stealBuzzer:           async () => false,
  serverNow:             () => Date.now(),
  judgeAnswer:           async () => {},
  nextTurn:              async () => {},
  skipQuestion:          async () => {},
  reboundQuestion:       async () => {},
  startFinalRound:       async () => {},
  setFinalPhase:         async () => {},
  submitFinalWager:      async () => {},
  submitFinalAnswer:     async () => {},
  setFinalVerdict:       async () => {},
  applyFinalResults:     async () => {},
  endFinalRound:         async () => {},
  startLightningMode:        async () => {},
  lightningBeginQuestion:    async () => {},
  lightningJudge:            async () => {},
  lightningAdvance:          async () => {},
  startRouletteSpin:         async () => {},
  finishRouletteSpin:        async () => {},
  startEstimacionMode:        async () => {},
  startEstimacionCollecting:  async () => {},
  submitEstimacion:           async () => {},
  revealEstimaciones:         async () => {},
  advanceEstimacionQuestion:  async () => {},
  endEstimacionMode:          async () => {},
  kickPlayer:             async () => {},
  setupPresence:             async () => {},
  stopPresence:              () => {},
  migrateHost:           async () => {},
  subscribe:             () => () => {},
};

// 🔥 IMPLEMENTACIÓN FIREBASE
if (firebaseConfigurado) {
  const rRef = (code) => ref(db, `rooms/${code}`);

  // Offset del reloj del servidor: permite que la ventana de robo sea justa entre celulares
  let _serverOffset = 0;
  onValue(ref(db, ".info/serverTimeOffset"), (snap) => { _serverOffset = snap.val() || 0; });
  GameDAO.serverNow = () => Date.now() + _serverOffset;

  GameDAO.ready = () => _authReady;

  // createdAt siempre con la hora del servidor: las reglas lo usan para vencer la sala
  GameDAO.createRoom = async (roomCode, initialState) => {
    await set(rRef(roomCode), { ...initialState, createdAt: serverTimestamp() });
    return roomCode;
  };

  GameDAO.roomExists = async (roomCode) => {
    const snap = await get(rRef(roomCode));
    return snap.exists() && snap.val().status === "lobby";
  };

  GameDAO.canRejoin = async (roomCode, playerId) => {
    const snap = await get(rRef(roomCode));
    if (!snap.exists()) return false;
    const val = snap.val();
    return (val.status === "playing" || val.status === "finished") &&
           val.playerOrder?.includes(playerId);
  };

  // Transacción sobre playerOrder: si dos jugadores se unen a la vez, ninguno
  // pisa al otro (antes se leía la lista y se reescribía entera).
  GameDAO.joinRoom = async (roomCode, playerId, playerData) => {
    const res = await runTransaction(ref(db, `rooms/${roomCode}/playerOrder`), (order) => {
      const list = order || [];
      if (list.includes(playerId)) return; // ya estaba en la sala
      return [...list, playerId];
    });
    if (!res.committed) return;
    await update(rRef(roomCode), { [`players/${playerId}`]: playerData });
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
      return { playerId, timestamp: GameDAO.serverNow() };
    });
    if (won) {
      try {
        await update(rRef(roomCode), {
          questionPhase: "waiting_answer",
          [`stats/${playerId}/buzzes`]: increment(1),
        });
      } catch (e) {
        // La fase no se actualizó — revertir el buzzer para no dejar el juego trabado
        try { await set(ref(db, `rooms/${roomCode}/buzzer`), null); } catch (_) {}
        throw e;
      }
    }
    return won;
  };

  // Transacción sobre el buzzer: "Mostrar respuesta" y "Robar" no pueden ganar los dos
  GameDAO.revealAnswer = async (roomCode, playerId) => {
    const res = await runTransaction(ref(db, `rooms/${roomCode}/buzzer`), (current) => {
      if (!current || current.playerId !== playerId || current.revealed) return;
      return { ...current, revealed: true };
    });
    if (res.committed) {
      await update(rRef(roomCode), { questionPhase: "answer_revealed" });
    }
    return res.committed;
  };

  // El ladrón toma el turno; al robado se le resta la penalidad
  GameDAO.stealBuzzer = async (roomCode, thiefId, expectedFromId, penalty) => {
    const res = await runTransaction(ref(db, `rooms/${roomCode}/buzzer`), (current) => {
      // 500ms de tolerancia por desfase de relojes
      if (!current || current.playerId !== expectedFromId ||
          !canSteal(current, thiefId, GameDAO.serverNow() + 500)) return;
      return {
        playerId: thiefId,
        timestamp: GameDAO.serverNow(),
        stolenFrom: [...(current.stolenFrom || []), expectedFromId],
        lastSteal: { from: expectedFromId, to: thiefId, penalty },
      };
    });
    if (res.committed) {
      try {
        // increment(): atómico en el servidor, no pisa otra suma simultánea
        await update(rRef(roomCode), {
          [`players/${expectedFromId}/score`]: increment(-penalty),
          [`stats/${expectedFromId}/stolen`]:  increment(1),
          [`stats/${expectedFromId}/lost`]:    increment(penalty),
          [`stats/${thiefId}/steals`]:         increment(1),
        });
      } catch (e) {
        console.error("No se pudo aplicar la penalidad del robo", e);
      }
    }
    return res.committed;
  };

  // Stats del podio que acompañan a un juicio (solo las escribe el host).
  const judgeStats = (responderId, correct, pointsDelta, bestStreak) => correct
    ? {
        [`stats/${responderId}/correct`]:    increment(1),
        [`stats/${responderId}/streak`]:     increment(1),
        ...(bestStreak ? { [`stats/${responderId}/bestStreak`]: bestStreak } : {}),
      }
    : {
        [`stats/${responderId}/wrong`]:  increment(1),
        [`stats/${responderId}/lost`]:   increment(Math.abs(pointsDelta)),
        [`stats/${responderId}/streak`]: 0,
      };

  // bestStreak (opcional): mejor racha del jugador contando este acierto.
  GameDAO.judgeAnswer = async (roomCode, responderId, correct, pointsDelta, category, value, bestStreak = null) => {
    await update(rRef(roomCode), {
      [`players/${responderId}/score`]: increment(pointsDelta),
      [`board/${category}/${value}`]: true,
      questionResult: { responderId, correct, pointsDelta },
      questionPhase: "judged",
      ...judgeStats(responderId, correct, pointsDelta, bestStreak),
    });
  };

  // Rebote: el respondedor falló, pierde los puntos y la pregunta se reabre
  // para los que todavía pueden responder. `failed` y `sawAnswer` son las
  // listas completas ya actualizadas (quién falló / quién vio la respuesta).
  GameDAO.reboundQuestion = async (roomCode, responderId, pointsDelta, failed, sawAnswer) => {
    await update(rRef(roomCode), {
      [`players/${responderId}/score`]: increment(pointsDelta),
      buzzer: null,
      questionPhase: "waiting_buzz",
      questionResult: null,
      "currentQuestion/openedAt":  serverTimestamp(),
      "currentQuestion/failed":    failed,
      "currentQuestion/sawAnswer": sawAnswer,
      "currentQuestion/lastFail":  { responderId, pointsDelta },
      ...judgeStats(responderId, false, pointsDelta, null),
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

  // Expulsa a un jugador de la sala. Si tenía el buzzer, cancela la pregunta activa
  // y vuelve al tablero (opción A: celda queda disponible, nadie pierde puntos).
  GameDAO.kickPlayer = async (roomCode, playerId) => {
    const snap = await get(rRef(roomCode));
    const room = snap.val();
    if (!room) return;

    const order         = (room.playerOrder || []).filter(id => id !== playerId);
    const oldIndex      = room.selectorIndex || 0;
    const kickedWasBeforeSelector = (room.playerOrder || []).indexOf(playerId) < oldIndex;
    const newIndex      = kickedWasBeforeSelector
      ? Math.max(0, oldIndex - 1) % Math.max(order.length, 1)
      : oldIndex % Math.max(order.length, 1);

    const hadBuzzer = room.buzzer?.playerId === playerId;
    const updates = {
      [`players/${playerId}`]: null,
      playerOrder: order,
      selectorIndex: newIndex,
    };

    if (hadBuzzer) {
      updates.buzzer          = null;
      updates.questionPhase   = null;
      updates.currentQuestion = null;
      updates.questionResult  = null;
    }

    await update(rRef(roomCode), updates);
  };

  // Registra presencia del jugador usando `.info/connected`: en CADA (re)conexión
  // vuelve a registrar el onDisconnect y a marcar connected=true. Sin esto, un
  // jugador que perdió la conexión (ej. pestaña en segundo plano en el celular)
  // quedaba marcado connected=false para siempre aunque hubiera vuelto.
  let _presenceUnsub = null;
  let _presenceRef   = null;
  GameDAO.setupPresence = async (roomCode, playerId) => {
    GameDAO.stopPresence();
    const presenceRef = ref(db, `rooms/${roomCode}/players/${playerId}/connected`);
    _presenceRef = presenceRef;
    _presenceUnsub = onValue(ref(db, ".info/connected"), async (snap) => {
      if (snap.val() !== true) return;
      try {
        // Primero el onDisconnect, después connected=true (patrón oficial de Firebase)
        await onDisconnect(presenceRef).set(false);
        // Si el jugador ya no existe (fue expulsado) no lo recreamos
        const nameSnap = await get(ref(db, `rooms/${roomCode}/players/${playerId}/name`));
        if (!nameSnap.exists()) return;
        await set(presenceRef, true);
      } catch (e) {
        console.error("Error registrando presencia:", e);
      }
    });
  };

  // Deja de re-registrar presencia (al salir de la sala o ser expulsado) y cancela
  // el onDisconnect pendiente para no recrear al jugador como {connected:false}.
  GameDAO.stopPresence = () => {
    if (_presenceUnsub) { _presenceUnsub(); _presenceUnsub = null; }
    if (_presenceRef) { onDisconnect(_presenceRef).cancel().catch(() => {}); _presenceRef = null; }
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
  GameDAO.lightningJudge = async (roomCode, playerId, correct) => {
    const updates = {
      "lightningMode/phase": "judged",
      "lightningMode/questionResult": { correct, pointsDelta: correct ? 200 : 0 },
    };
    if (correct) {
      updates[`players/${playerId}/score`] = increment(200);
    }
    await update(rRef(roomCode), updates);
  };

  // Avanza al siguiente jugador/ronda, o termina el modo relámpago.
  // Si isGameOver=true, además cierra la partida.
  GameDAO.lightningAdvance = async (roomCode, nextSlot, totalSlots, isGameOver = false) => {
    if (nextSlot >= totalSlots) {
      // Fin del modo — selectorIndex ya está correcto desde startLightningMode
      const updates = { lightningMode: null };
      if (isGameOver) updates.status = "finished";
      await update(rRef(roomCode), updates);
    } else {
      await update(rRef(roomCode), {
        "lightningMode/currentSlot": nextSlot,
        "lightningMode/phase": "question",
        "lightningMode/openedAt": serverTimestamp(),
        "lightningMode/questionResult": null,
      });
    }
  };

  // ── Modo Ruleta (giro sincronizado) ───────────────────────────

  // El selector dispara el giro: escribe rouletteSpin con startedAt del servidor.
  // Todos los clients lo recogen via subscribe y animan en sincro.
  GameDAO.startRouletteSpin = async (roomCode, spinData) => {
    await update(rRef(roomCode), {
      rouletteSpin: { ...spinData, startedAt: serverTimestamp() },
    });
  };

  // El selector cierra el giro al terminar la animación: limpia rouletteSpin
  // y abre la pregunta. Si fue bonus, se guarda en currentQuestion.
  GameDAO.finishRouletteSpin = async (roomCode, category, value, isBonus) => {
    await update(rRef(roomCode), {
      rouletteSpin: null,
      currentQuestion: { category, value, bonus: !!isBonus, openedAt: serverTimestamp() },
      buzzer: null,
      questionPhase: "waiting_buzz",
      questionResult: null,
    });
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
      updates[`players/${playerId}/score`] = increment(points);
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

  // ── Ronda final con apuesta ───────────────────────────────────
  // finalRound: { active, phase, category, value, openedAt, wagers, answers, verdicts, deltas }
  // Fases: announcing → betting → answering → judging → results.

  GameDAO.startFinalRound = async (roomCode, finalData) => {
    await update(rRef(roomCode), { finalRound: finalData });
  };

  GameDAO.setFinalPhase = async (roomCode, phase) => {
    await update(rRef(roomCode), {
      "finalRound/phase": phase,
      "finalRound/openedAt": serverTimestamp(),
    });
  };

  GameDAO.submitFinalWager = async (roomCode, playerId, wager) => {
    await update(rRef(roomCode), { [`finalRound/wagers/${playerId}`]: wager });
  };

  GameDAO.submitFinalAnswer = async (roomCode, playerId, text) => {
    await update(rRef(roomCode), { [`finalRound/answers/${playerId}`]: text });
  };

  GameDAO.setFinalVerdict = async (roomCode, playerId, correct) => {
    await update(rRef(roomCode), { [`finalRound/verdicts/${playerId}`]: correct });
  };

  // deltas: { playerId: ±apuesta }. Suma los puntos y pasa a "results".
  GameDAO.applyFinalResults = async (roomCode, deltas) => {
    const updates = { "finalRound/phase": "results", "finalRound/deltas": deltas };
    for (const [playerId, delta] of Object.entries(deltas)) {
      updates[`players/${playerId}/score`] = increment(delta);
      // Lo perdido en la apuesta también cuenta para "el que más perdió"
      if (delta < 0) updates[`stats/${playerId}/lost`] = increment(-delta);
    }
    await update(rRef(roomCode), updates);
  };

  GameDAO.endFinalRound = async (roomCode) => {
    await update(rRef(roomCode), { "finalRound/active": false, status: "finished" });
  };
}

export { db };
