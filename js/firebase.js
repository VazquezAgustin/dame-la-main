import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, set, get, update, onValue, runTransaction
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
  createRoom:     async () => {},
  roomExists:     async () => false,
  joinRoom:       async () => {},
  startGame:      async () => {},
  selectQuestion: async () => {},
  pressBuzzer:    async () => false,
  revealAnswer:   async () => {},
  judgeAnswer:    async () => {},
  nextTurn:       async () => {},
  skipQuestion:   async () => {},
  subscribe:      () => () => {},
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
      currentQuestion: { category, value, openedAt: Date.now() },
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
      await update(rRef(roomCode), { questionPhase: "waiting_answer" });
    }
    return won;
  };

  GameDAO.revealAnswer = async (roomCode) => {
    await update(rRef(roomCode), { questionPhase: "answer_revealed" });
  };

  GameDAO.judgeAnswer = async (roomCode, responderId, correct, pointsDelta) => {
    const [scoreSnap, qSnap] = await Promise.all([
      get(ref(db, `rooms/${roomCode}/players/${responderId}/score`)),
      get(ref(db, `rooms/${roomCode}/currentQuestion`)),
    ]);
    const currentScore = scoreSnap.val() || 0;
    const q = qSnap.val();
    await update(rRef(roomCode), {
      [`players/${responderId}/score`]: currentScore + pointsDelta,
      [`board/${q.category}/${q.value}`]: true,
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
}
