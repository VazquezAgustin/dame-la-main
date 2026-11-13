// Mock DAO in-memory que cumple el mismo contrato que GameDAO en firebase.js.
// Se usa en tests de integración para evitar Firebase/emulador.

import { canSteal } from "../../js/logica.js";

export function createInMemoryDao() {
  const rooms = new Map();
  const listeners = new Map(); // roomCode -> Set<callback>

  function snapshot(roomCode) {
    const room = rooms.get(roomCode);
    return room ? structuredClone(room) : null;
  }

  function notify(roomCode) {
    const cbs = listeners.get(roomCode);
    if (cbs) cbs.forEach(cb => cb(snapshot(roomCode)));
  }

  // Aplica un mapa de updates al estilo Firebase: claves con "/" son rutas anidadas.
  function applyUpdates(obj, updates) {
    for (const [key, value] of Object.entries(updates)) {
      const parts = key.split("/");
      if (parts.length === 1) {
        if (value === null) {
          delete obj[key];
        } else {
          obj[key] = value;
        }
      } else {
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          if (cur[parts[i]] == null) cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        const last = parts[parts.length - 1];
        if (value === null) {
          delete cur[last];
        } else {
          cur[last] = value;
        }
      }
    }
  }

  function deepUpdate(roomCode, updates) {
    const room = rooms.get(roomCode);
    if (!room) throw new Error(`Room ${roomCode} not found`);
    applyUpdates(room, updates);
    notify(roomCode);
  }

  // Equivalentes en memoria de increment() sobre stats/<pid>/<campo>
  const stat = (room, pid, campo) => room?.stats?.[pid]?.[campo] || 0;
  const judgeStats = (room, pid, correct, pointsDelta, bestStreak) => correct
    ? {
        [`stats/${pid}/correct`]: stat(room, pid, "correct") + 1,
        [`stats/${pid}/streak`]:  stat(room, pid, "streak") + 1,
        ...(bestStreak ? { [`stats/${pid}/bestStreak`]: bestStreak } : {}),
      }
    : {
        [`stats/${pid}/wrong`]:  stat(room, pid, "wrong") + 1,
        [`stats/${pid}/lost`]:   stat(room, pid, "lost") + Math.abs(pointsDelta),
        [`stats/${pid}/streak`]: 0,
      };

  const dao = {
    ready: async () => {},
    createRoom: async (roomCode, initialState) => {
      rooms.set(roomCode, structuredClone(initialState));
      notify(roomCode);
      return roomCode;
    },

    roomExists: async (roomCode) => {
      const room = rooms.get(roomCode);
      return !!room && room.status === "lobby";
    },

    canRejoin: async (roomCode, playerId) => {
      const room = rooms.get(roomCode);
      if (!room) return false;
      return (room.status === "playing" || room.status === "finished") &&
             (room.playerOrder || []).includes(playerId);
    },

    joinRoom: async (roomCode, playerId, playerData) => {
      const room = rooms.get(roomCode);
      if (!room) throw new Error(`Room ${roomCode} not found`);
      const order = room.playerOrder || [];
      if (order.includes(playerId)) return;
      deepUpdate(roomCode, {
        [`players/${playerId}`]: playerData,
        playerOrder: [...order, playerId],
      });
    },

    startGame: async (roomCode) => {
      deepUpdate(roomCode, { status: "playing" });
    },

    selectQuestion: async (roomCode, category, value) => {
      deepUpdate(roomCode, {
        currentQuestion: { category, value, openedAt: Date.now() },
        buzzer: null,
        questionPhase: "waiting_buzz",
        questionResult: null,
      });
    },

    pressBuzzer: async (roomCode, playerId) => {
      const room = rooms.get(roomCode);
      if (!room) return false;
      if (room.buzzer != null) return false;
      deepUpdate(roomCode, {
        buzzer: { playerId, timestamp: Date.now() },
        questionPhase: "waiting_answer",
        [`stats/${playerId}/buzzes`]: stat(room, playerId, "buzzes") + 1,
      });
      return true;
    },

    serverNow: () => Date.now(),

    revealAnswer: async (roomCode, playerId) => {
      const b = rooms.get(roomCode)?.buzzer;
      if (!b || b.playerId !== playerId || b.revealed) return false;
      deepUpdate(roomCode, { buzzer: { ...b, revealed: true }, questionPhase: "answer_revealed" });
      return true;
    },

    stealBuzzer: async (roomCode, thiefId, expectedFromId, penalty) => {
      const room = rooms.get(roomCode);
      const b = room?.buzzer;
      if (!b || b.playerId !== expectedFromId || !canSteal(b, thiefId, Date.now() + 500)) return false;
      const score = room.players?.[expectedFromId]?.score || 0;
      deepUpdate(roomCode, {
        buzzer: {
          playerId: thiefId,
          timestamp: Date.now(),
          stolenFrom: [...(b.stolenFrom || []), expectedFromId],
          lastSteal: { from: expectedFromId, to: thiefId, penalty },
        },
        [`players/${expectedFromId}/score`]: score - penalty,
        [`stats/${expectedFromId}/stolen`]: stat(room, expectedFromId, "stolen") + 1,
        [`stats/${expectedFromId}/lost`]:   stat(room, expectedFromId, "lost") + penalty,
        [`stats/${thiefId}/steals`]:        stat(room, thiefId, "steals") + 1,
      });
      return true;
    },

    judgeAnswer: async (roomCode, responderId, correct, pointsDelta, category, value, bestStreak = null) => {
      const room = rooms.get(roomCode);
      const currentScore = room?.players?.[responderId]?.score || 0;
      deepUpdate(roomCode, {
        [`players/${responderId}/score`]: currentScore + pointsDelta,
        [`board/${category}/${value}`]: true,
        questionResult: { responderId, correct, pointsDelta },
        questionPhase: "judged",
        ...judgeStats(room, responderId, correct, pointsDelta, bestStreak),
      });
    },

    reboundQuestion: async (roomCode, responderId, pointsDelta, failed, sawAnswer) => {
      const room = rooms.get(roomCode);
      const currentScore = room?.players?.[responderId]?.score || 0;
      deepUpdate(roomCode, {
        [`players/${responderId}/score`]: currentScore + pointsDelta,
        buzzer: null,
        questionPhase: "waiting_buzz",
        questionResult: null,
        "currentQuestion/openedAt":  Date.now(),
        "currentQuestion/failed":    failed,
        "currentQuestion/sawAnswer": sawAnswer,
        "currentQuestion/lastFail":  { responderId, pointsDelta },
        ...judgeStats(room, responderId, false, pointsDelta, null),
      });
    },

    startFinalRound: async (roomCode, finalData) => {
      deepUpdate(roomCode, { finalRound: finalData });
    },

    setFinalPhase: async (roomCode, phase) => {
      deepUpdate(roomCode, { "finalRound/phase": phase, "finalRound/openedAt": Date.now() });
    },

    submitFinalWager: async (roomCode, playerId, wager) => {
      deepUpdate(roomCode, { [`finalRound/wagers/${playerId}`]: wager });
    },

    submitFinalAnswer: async (roomCode, playerId, text) => {
      deepUpdate(roomCode, { [`finalRound/answers/${playerId}`]: text });
    },

    setFinalVerdict: async (roomCode, playerId, correct) => {
      deepUpdate(roomCode, { [`finalRound/verdicts/${playerId}`]: correct });
    },

    applyFinalResults: async (roomCode, deltas) => {
      const room = rooms.get(roomCode);
      const updates = { "finalRound/phase": "results", "finalRound/deltas": deltas };
      for (const [playerId, delta] of Object.entries(deltas)) {
        updates[`players/${playerId}/score`] = (room?.players?.[playerId]?.score || 0) + delta;
        if (delta < 0) updates[`stats/${playerId}/lost`] = stat(room, playerId, "lost") - delta;
      }
      deepUpdate(roomCode, updates);
    },

    endFinalRound: async (roomCode) => {
      deepUpdate(roomCode, { "finalRound/active": false, status: "finished" });
    },

    nextTurn: async (roomCode, nextSelectorIndex, isGameOver) => {
      deepUpdate(roomCode, {
        currentQuestion: null,
        buzzer: null,
        questionPhase: null,
        questionResult: null,
        selectorIndex: nextSelectorIndex,
        status: isGameOver ? "finished" : "playing",
      });
    },

    skipQuestion: async (roomCode, nextSelectorIndex) => {
      const room = rooms.get(roomCode);
      const q = room?.currentQuestion;
      if (!q) throw new Error("No active question to skip");
      deepUpdate(roomCode, {
        [`board/${q.category}/${q.value}`]: true,
        currentQuestion: null,
        buzzer: null,
        questionPhase: null,
        questionResult: null,
        selectorIndex: nextSelectorIndex,
      });
    },

    kickPlayer: async (roomCode, playerId) => {
      const room = rooms.get(roomCode);
      if (!room) return;
      const order = (room.playerOrder || []).filter(id => id !== playerId);
      const oldIndex = room.selectorIndex || 0;
      const kickedWasBeforeSelector = (room.playerOrder || []).indexOf(playerId) < oldIndex;
      const newIndex = kickedWasBeforeSelector
        ? Math.max(0, oldIndex - 1) % Math.max(order.length, 1)
        : oldIndex % Math.max(order.length, 1);
      const hadBuzzer = room.buzzer?.playerId === playerId;
      const updates = {
        [`players/${playerId}`]: null,
        playerOrder: order,
        selectorIndex: newIndex,
      };
      if (hadBuzzer) {
        updates.buzzer = null;
        updates.questionPhase = null;
        updates.currentQuestion = null;
        updates.questionResult = null;
      }
      deepUpdate(roomCode, updates);
    },

    setupPresence: async (roomCode, playerId) => {
      deepUpdate(roomCode, { [`players/${playerId}/connected`]: true });
    },

    migrateHost: async (roomCode, currentHostId, newHostId) => {
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== currentHostId) return;
      deepUpdate(roomCode, { hostId: newHostId });
    },

    startLightningMode: async (roomCode, lightningData, selectorIndexOnEntry, skipCell = null, usedIndices = null) => {
      const updates = {
        currentQuestion: null,
        buzzer: null,
        questionPhase: null,
        questionResult: null,
        selectorIndex: selectorIndexOnEntry,
        lightningMode: lightningData,
        lightningUsed: true,
      };
      if (skipCell) updates[`board/${skipCell.category}/${skipCell.value}`] = true;
      if (usedIndices) updates.lightningUsedIndices = usedIndices;
      deepUpdate(roomCode, updates);
    },

    lightningBeginQuestion: async (roomCode) => {
      deepUpdate(roomCode, {
        "lightningMode/phase": "question",
        "lightningMode/openedAt": Date.now(),
        "lightningMode/questionResult": null,
      });
    },

    lightningJudge: async (roomCode, playerId, correct) => {
      const currentScore = rooms.get(roomCode)?.players?.[playerId]?.score || 0;
      const updates = {
        "lightningMode/phase": "judged",
        "lightningMode/questionResult": { correct, pointsDelta: correct ? 200 : 0 },
      };
      if (correct) updates[`players/${playerId}/score`] = currentScore + 200;
      deepUpdate(roomCode, updates);
    },

    lightningAdvance: async (roomCode, nextSlot, totalSlots, isGameOver = false) => {
      if (nextSlot >= totalSlots) {
        const updates = { lightningMode: null };
        if (isGameOver) updates.status = "finished";
        deepUpdate(roomCode, updates);
      } else {
        deepUpdate(roomCode, {
          "lightningMode/currentSlot": nextSlot,
          "lightningMode/phase": "question",
          "lightningMode/openedAt": Date.now(),
          "lightningMode/questionResult": null,
        });
      }
    },

    startRouletteSpin: async (roomCode, spinData) => {
      deepUpdate(roomCode, { rouletteSpin: { ...spinData, startedAt: Date.now() } });
    },

    finishRouletteSpin: async (roomCode, category, value, isBonus) => {
      deepUpdate(roomCode, {
        rouletteSpin: null,
        currentQuestion: { category, value, bonus: !!isBonus, openedAt: Date.now() },
        buzzer: null,
        questionPhase: "waiting_buzz",
        questionResult: null,
      });
    },

    startEstimacionMode: async (roomCode, estimacionData, skipCell = null, usedIndices = null) => {
      const updates = {
        currentQuestion: null,
        buzzer: null,
        questionPhase: null,
        questionResult: null,
        estimacionMode: estimacionData,
        estimacionUsed: true,
      };
      if (skipCell) updates[`board/${skipCell.category}/${skipCell.value}`] = true;
      if (usedIndices) updates.estimacionUsedIndices = usedIndices;
      deepUpdate(roomCode, updates);
    },

    startEstimacionCollecting: async (roomCode) => {
      deepUpdate(roomCode, {
        "estimacionMode/phase": "collecting",
        "estimacionMode/openedAt": Date.now(),
      });
    },

    submitEstimacion: async (roomCode, playerId, value) => {
      deepUpdate(roomCode, {
        [`estimacionMode/responses/${playerId}`]: { value, timestamp: Date.now() },
      });
    },

    revealEstimaciones: async (roomCode, podium) => {
      const room = rooms.get(roomCode);
      const updates = {
        "estimacionMode/phase": "revealed",
        "estimacionMode/winnerId": podium[0]?.playerId ?? null,
        "estimacionMode/podium": podium,
      };
      for (const { playerId, points } of podium) {
        if (!playerId || !points) continue;
        const currentScore = room?.players?.[playerId]?.score || 0;
        updates[`players/${playerId}/score`] = currentScore + points;
      }
      deepUpdate(roomCode, updates);
    },

    advanceEstimacionQuestion: async (roomCode, nextSlot) => {
      deepUpdate(roomCode, {
        "estimacionMode/currentSlot": nextSlot,
        "estimacionMode/phase": "collecting",
        "estimacionMode/openedAt": Date.now(),
        "estimacionMode/responses": null,
        "estimacionMode/winnerId": null,
        "estimacionMode/podium": null,
      });
    },

    endEstimacionMode: async (roomCode, nextSelectorIndex, isGameOver) => {
      deepUpdate(roomCode, {
        estimacionMode: null,
        selectorIndex: nextSelectorIndex,
        status: isGameOver ? "finished" : "playing",
      });
    },

    subscribe: (roomCode, callback) => {
      if (!listeners.has(roomCode)) listeners.set(roomCode, new Set());
      listeners.get(roomCode).add(callback);
      callback(snapshot(roomCode));
      return () => listeners.get(roomCode)?.delete(callback);
    },
  };

  return dao;
}
