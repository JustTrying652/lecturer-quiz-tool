export const rooms = new Map()

export function createRoomState({ lecturerId, questions }) {
  return {
    lecturerId,
    questions,
    students: new Map(),   // socketId -> { nickname }
    hostSocketId: null,
  }
}