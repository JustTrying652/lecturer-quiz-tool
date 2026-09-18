export const rooms = new Map()

export function createRoomState({ lecturerId, questions }) {
  return {
    lecturerId,
    questions,
    students: new Map(),      // studentId -> { nickname, socketId (null if offline) }
    scores: new Map(),        // studentId -> { nickname, score }
    socketToStudent: new Map(), // socketId -> studentId (this process only)
    pendingRemoval: new Map(),  // studentId -> timeout handle
    hostSocketId: null,

    questionIndex: -1,
    roundNumber: 0,
    totalRounds: questions.length,
    roundOpen: false,
    roundEndsAt: 0,
    roundDuration: 15,
    answered: new Set(),
    roundTimer: null,
    gameOver: false,
  }
}