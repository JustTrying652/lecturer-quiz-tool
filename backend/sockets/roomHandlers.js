import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { rooms } from './roomState.js'

const MAX_POINTS = 1000
const MIN_POINTS = 100
const GRACE_PERIOD_MS = 30_000

function studentListPayload(room) {
  return [...room.students.entries()].map(([studentId, s]) => ({
    nickname: s.nickname,
    online: s.socketId !== null,
  }))
}

function buildScoreboard(room) {
  return [...room.scores.values()].sort((a, b) => b.score - a.score)
}

function endRound(io, roomCode, questionIndex) {
  const room = rooms.get(roomCode)
  if (!room || room.questionIndex !== questionIndex) return

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

    socket.on('student_join', ({ roomCode, nickname, studentId: requestedId }) => {
      const room = rooms.get(roomCode)
      if (!room) return socket.emit('error_message', { message: 'Room not found' })

      const isReconnect = requestedId && room.students.has(requestedId)
      let studentId

      if (isReconnect) {
        studentId = requestedId
        const pending = room.pendingRemoval.get(studentId)
        if (pending) {
          clearTimeout(pending)
          room.pendingRemoval.delete(studentId)
        }
        room.students.get(studentId).socketId = socket.id
      } else {
        studentId = randomUUID()
        room.students.set(studentId, { nickname, socketId: socket.id })
        room.scores.set(studentId, { nickname, score: 0 })
      }

      socket.join(roomCode)
      socket.data.roomCode = roomCode
      socket.data.isHost = false
      socket.data.studentId = studentId
      room.socketToStudent.set(socket.id, studentId)

      socket.emit('joined', { studentId, reconnected: isReconnect })
      io.to(roomCode).emit('student_list', { students: studentListPayload(room) })

      // Catch a reconnecting student up on an in-progress round.
      if (isReconnect && room.roundOpen) {
        const question = room.questions[room.questionIndex]
        socket.emit('question_start', {
          question: question.questionText,
          options: question.options,
          duration: room.roundDuration,
          endsAt: room.roundEndsAt,
          alreadyAnswered: room.answered.has(studentId),
        })
      }
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
        alreadyAnswered: false,
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
      const studentId = socket.data.studentId
      if (!room || socket.data.isHost || !studentId) return

      const now = Date.now()
      if (!room.roundOpen || now >= room.roundEndsAt) {
        return socket.emit('error_message', { message: 'Round is closed' })
      }
      if (room.answered.has(studentId)) {
        return socket.emit('error_message', { message: 'You already answered this round' })
      }
      room.answered.add(studentId)

      const question = room.questions[room.questionIndex]
      const correct = choice === question.correctAnswer

      let points = 0
      if (correct) {
        const timeRemaining = Math.max(0, room.roundEndsAt - now)
        const ratio = timeRemaining / (room.roundDuration * 1000)
        points = Math.max(MIN_POINTS, Math.round(MAX_POINTS * ratio))
        room.scores.get(studentId).score += points
      }

      socket.emit('answer_result', {
        correct, points,
        total: room.scores.get(studentId)?.score ?? 0,
      })

      io.to(roomCode).emit('student_answered', {
        nickname: room.students.get(studentId)?.nickname,
      })
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      const room = rooms.get(roomCode)
      if (!room) return

      if (room.hostSocketId === socket.id) {
        room.hostSocketId = null
        return
      }

      const studentId = room.socketToStudent.get(socket.id)
      if (!studentId) return
      room.socketToStudent.delete(socket.id)

      const student = room.students.get(studentId)
      if (!student) return
      student.socketId = null

      const timeout = setTimeout(() => {
        room.students.delete(studentId)
        room.scores.delete(studentId)
        room.pendingRemoval.delete(studentId)
        io.to(roomCode).emit('student_list', { students: studentListPayload(room) })
      }, GRACE_PERIOD_MS)

      room.pendingRemoval.set(studentId, timeout)
      io.to(roomCode).emit('student_list', { students: studentListPayload(room) })
    })
  })
}