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
      <button class="primary" @click="handleJoin">Join</button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </template>

    <template v-else-if="!question">
      <h1>Waiting for the host to start…</h1>
      <p class="muted">{{ connected ? 'Connected' : 'Connecting…' }}</p>
      <h2>Players ({{ students.length }})</h2>
      <div v-for="s in students" :key="s.nickname" class="ledger-row">
        <span>{{ s.nickname }}<span v-if="!s.online" class="muted"> (reconnecting…)</span></span>
      </div>
    </template>

    <template v-else>
      <h1 class="question">{{ question.question }}</h1>

      <p v-if="answerResult && !revealed" :class="answerResult.correct ? 'good' : 'bad'">
        {{ answerResult.correct ? `Correct — +${answerResult.points}` : 'Answer locked in' }}
      </p>

      <div class="grid">
        <button
          v-for="opt in question.options"
          :key="opt"
          @click="handleAnswer(opt)"
          :disabled="Boolean(selected) || revealed"
          :class="{
            primary: selected === opt && !revealed,
            correctAnswer: revealed && opt === roundResult.answer,
            dimmed: revealed && opt !== roundResult.answer,
          }"
        >
          {{ opt }}
        </button>
      </div>

      <div v-if="revealed" class="reveal">
        <h2>Answer: {{ roundResult.answer }}</h2>
        <div v-for="p in roundResult.scoreboard" :key="p.nickname" class="ledger-row">
          <span>{{ p.nickname }}</span>
          <span>{{ p.score }}</span>
        </div>
        <p v-if="roundResult.gameOver" class="muted">Game over.</p>
        <p v-else class="muted">Waiting for the next round…</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 14px; padding: 48px 24px; max-width: 480px; margin: 0 auto; }
h1 { font-family: var(--font-content); font-weight: 600; font-size: 1.6rem; margin: 0 0 8px; }
.question { font-size: 1.4rem; }
h2 { font-family: var(--font-content); font-weight: 600; font-size: 1.15rem; margin: 8px 0; }
.muted { color: var(--ink-soft); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.correctAnswer { background: var(--correct); color: white; border-color: var(--correct); }
.dimmed { opacity: 0.4; }
.good { color: var(--correct); font-weight: 500; }
.bad { color: var(--incorrect); font-weight: 500; }
</style>