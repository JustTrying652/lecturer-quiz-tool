import jwt from 'jsonwebtoken'
import { rooms } from './roomState.js'

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
      room.students.set(socket.id, { nickname })

      const studentList = [...room.students.values()].map((s) => s.nickname)

      // Broadcast to everyone in the room, including this socket.
      io.to(roomCode).emit('student_list', { students: studentList })
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      if (!roomCode) return

      const room = rooms.get(roomCode)
      if (!room) return

      if (room.students.delete(socket.id)) {
        const studentList = [...room.students.values()].map((s) => s.nickname)
        io.to(roomCode).emit('student_list', { students: studentList })
      }
    })
  })
}