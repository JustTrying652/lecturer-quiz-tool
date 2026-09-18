<script setup>
import { ref, computed, watch } from 'vue'
import { useGameSocket } from '../composables/useGameSocket'

const {
  connected, students, question, answerResult, roundResult, errorMessage,
  joinAsStudent, submitAnswer,
} = useGameSocket()

const nickname = ref('')
const roomCode = ref('')
const hasJoined = ref(false)
const selected = ref(null)

watch(question, (q) => {
  selected.value = q?.alreadyAnswered ? '(already answered)' : null
})

function handleJoin() {
  if (!nickname.value.trim() || !roomCode.value.trim()) return
  joinAsStudent(roomCode.value.trim().toUpperCase(), nickname.value.trim())
  hasJoined.value = true
}

function handleAnswer(choice) {
  if (selected.value) return
  selected.value = choice
  submitAnswer(choice)
}

const revealed = computed(() => Boolean(roundResult.value))
</script>

<template>
  <div class="wrap">
    <template v-if="!hasJoined">
      <h1>Join a session</h1>
      <input v-model="nickname" placeholder="Your name" maxlength="20" />
      <input v-model="roomCode" placeholder="Room code" maxlength="6" style="text-transform: uppercase" />
      <button @click="handleJoin">Join</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </template>

    <template v-else-if="!question">
      <h1>Waiting for the host to start…</h1>
      <p>{{ connected ? 'Connected' : 'Connecting…' }}</p>
      <h2>Players ({{ students.length }})</h2>
      <ul>
        <li v-for="s in students" :key="s.nickname">
  {{ s.nickname }}
  <span v-if="!s.online" class="offline"> (reconnecting…)</span>
</li>
      </ul>
    </template>

    <template v-else>
      <h1>{{ question.question }}</h1>

      <p v-if="answerResult && !revealed" :class="answerResult.correct ? 'correct' : 'wrong'">
        {{ answerResult.correct ? `Correct! +${answerResult.points}` : 'Answer locked in' }}
      </p>

      <div class="grid">
        <button
          v-for="opt in question.options"
          :key="opt"
          @click="handleAnswer(opt)"
          :disabled="Boolean(selected) || revealed"
          :class="{
            picked: selected === opt,
            correctAnswer: revealed && opt === roundResult.answer,
            dimmed: revealed && opt !== roundResult.answer,
          }"
        >
          {{ opt }}
        </button>
      </div>

      <div v-if="revealed" class="reveal">
        <p>Answer: {{ roundResult.answer }}</p>
        <ol>
          <li v-for="p in roundResult.scoreboard" :key="p.nickname">{{ p.nickname }} — {{ p.score }}</li>
        </ol>
        <p v-if="roundResult.gameOver">Game over!</p>
        <p v-else>Waiting for the next round…</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 12px; padding: 24px; max-width: 480px; margin: 0 auto; }
input, button { padding: 12px; font-size: 1rem; border-radius: 8px; border: 1px solid #ccc; }
button { cursor: pointer; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.picked { outline: 3px solid #333; }
.correctAnswer { background: #7ed957; }
.dimmed { opacity: 0.4; }
.correct { color: green; }
.wrong { color: crimson; }
.error { color: crimson; }
</style>