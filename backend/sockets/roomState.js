export const rooms = new Map()

export function createRoomState({ lecturerId, questions }) {
  return {
    lecturerId,
    questions,
    students: new Map(),   // socketId -> nickname (LIVE presence only — removed on disconnect)
    scores: new Map(),     // socketId -> { nickname, score } (persists for the whole game)
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