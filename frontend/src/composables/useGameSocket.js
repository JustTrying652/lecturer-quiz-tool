import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://127.0.0.1:4000'

export function useGameSocket() {
  const socket = io(SOCKET_URL)

  const connected = ref(false)
  const students = ref([])
  const question = ref(null)
  const answerResult = ref(null)
  const roundResult = ref(null)
  const errorMessage = ref(null)

  socket.on('connect', () => { connected.value = true })
  socket.on('disconnect', () => { connected.value = false })

  socket.on('student_list', (data) => { students.value = data.students })

  socket.on('question_start', (data) => {
    question.value = data
    answerResult.value = null
    roundResult.value = null
  })

  socket.on('answer_result', (data) => { answerResult.value = data })
  socket.on('round_end', (data) => { roundResult.value = data })
  socket.on('error_message', (data) => { errorMessage.value = data.message })

  function joinAsStudent(roomCode, nickname) {
    socket.emit('student_join', { roomCode, nickname })
  }

  function submitAnswer(choice) {
    socket.emit('submit_answer', { choice })
  }

  function joinAsHost(roomCode, token) {
    socket.emit('host_join', { roomCode, token })
  }

  function startRound() {
    socket.emit('start_round')
  }

  onUnmounted(() => {
    socket.disconnect()
  })

  return {
    connected, students, question, answerResult, roundResult, errorMessage,
    joinAsStudent, submitAnswer, joinAsHost, startRound,
  }
}