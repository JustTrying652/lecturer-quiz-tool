import jwt from 'jsonwebtoken'
import { rooms } from './roomState.js'

const MAX_POINTS = 1000
const MIN_POINTS = 100

function buildScoreboard(room) {
  return [...room.scores.values()]
    .sort((a, b) => b.score - a.score)
}

function endRound(io, roomCode, questionIndex) {
  const room = rooms.get(roomCode)
  if (!room || room.questionIndex !== questionIndex) return // stale timer guard

  room.roundOpen = false
  const question = room.questions[questionIndex]

  room.gameOver = room.roundNumber >= room.totalRounds

  io.to(roomCode).emit('round_end', {
    answer: question.correctAnswer,
    scoreboard: buildScoreboard(room),
    gameOver: room.gameOver,
    roundNumber: room.roundNumber,
    totalRounds: room.totalRounds,
  })
}

export function registerRoomHandlers(io) {
  io.on('connection', (socket) => {

    socket.on('host_join', ({ roomCode, token }) => {
      const room = rooms.get(roomCode)
      if (!room) return socket.emit('error_message', { message: 'Room not found' })

      let payload
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET)
      } catch {
        return socket.emit('error_message', { message: 'Invalid session' })
      }

      if (payload.lecturerId !== room.lecturerId.toString()) {
        return socket.emit('error_message', { message: 'You are not the host of this room' })
      }

      socket.join(roomCode)
      socket.data.roomCode = roomCode
      socket.data.isHost = true
      room.hostSocketId = socket.id

      socket.emit('host_joined', { studentCount: room.students.size })
    })

    socket.on('student_join', ({ roomCode, nickname }) => {
      const room = rooms.get(roomCode)
      if (!room) return socket.emit('error_message', { message: 'Room not found' })

      socket.join(roomCode)
      socket.data.roomCode = roomCode
      socket.data.isHost = false
      room.students.set(socket.id, nickname)

      // First time this socket's been seen in this room — give it a persistent score entry.
      if (!room.scores.has(socket.id)) {
        room.scores.set(socket.id, { nickname, score: 0 })
      }

      io.to(roomCode).emit('student_list', {
        students: [...room.students.values()],
      })
    })

    socket.on('start_round', () => {
      const roomCode = socket.data.roomCode
      const room = rooms.get(roomCode)
      if (!room) return

      if (!socket.data.isHost || room.hostSocketId !== socket.id) {
        return socket.emit('error_message', { message: 'Only the host can start a round' })
      }
      if (room.gameOver) return

      room.questionIndex += 1
      room.roundNumber += 1
      const question = room.questions[room.questionIndex]

      room.roundEndsAt = Date.now() + room.roundDuration * 1000
      room.roundOpen = true
      room.answered = new Set()

      io.to(roomCode).emit('question_start', {
        question: question.questionText,
        options: question.options,
        duration: room.roundDuration,
        endsAt: room.roundEndsAt,
      })

      if (room.roundTimer) clearTimeout(room.roundTimer)
      const capturedIndex = room.questionIndex
      room.roundTimer = setTimeout(
        () => endRound(io, roomCode, capturedIndex),
        room.roundDuration * 1000
      )
    })

    socket.on('submit_answer', ({ choice }) => {
      const roomCode = socket.data.roomCode
      const room = rooms.get(roomCode)
      if (!room || socket.data.isHost) return

      const now = Date.now()
      if (!room.roundOpen || now >= room.roundEndsAt) {
        return socket.emit('error_message', { message: 'Round is closed' })
      }
      if (room.answered.has(socket.id)) {
        return socket.emit('error_message', { message: 'You already answered this round' })
      }
      room.answered.add(socket.id)

      const question = room.questions[room.questionIndex]
      const correct = choice === question.correctAnswer

      let points = 0
      if (correct) {
        const timeRemaining = Math.max(0, room.roundEndsAt - now)
        const ratio = timeRemaining / (room.roundDuration * 1000)
        points = Math.max(MIN_POINTS, Math.round(MAX_POINTS * ratio))
        const entry = room.scores.get(socket.id)
        entry.score += points
      }

      // Private result, this socket only — same anti-cheat reasoning as the trivia app:
      // never reveal correctness/answer to the room mid-round.
      socket.emit('answer_result', {
        correct,
        points,
        total: room.scores.get(socket.id)?.score ?? 0,
      })

      io.to(roomCode).emit('student_answered', {
        nickname: room.students.get(socket.id),
      })
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      if (!roomCode) return

      const room = rooms.get(roomCode)
      if (!room) return

      // Only remove from LIVE presence — scores/nickname persist for final results.
      if (room.students.delete(socket.id)) {
        io.to(roomCode).emit('student_list', {
          students: [...room.students.values()],
        })
      }

      if (room.hostSocketId === socket.id) {
        room.hostSocketId = null
      }
    })
  })
}