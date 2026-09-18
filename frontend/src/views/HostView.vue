<script setup>
import { useRoute } from 'vue-router'
import { useGameSocket } from '../composables/useGameSocket'

const route = useRoute()
const roomCode = route.params.roomCode
const token = localStorage.getItem('token')

const {
  students, question, roundResult, errorMessage,
  joinAsHost, startRound,
} = useGameSocket()

joinAsHost(roomCode, token)
</script>

<template>
  <div class="wrap">
    <h1>Room {{ roomCode }}</h1>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <template v-if="!question">
      <h2>Players ({{ students.length }})</h2>
      <div v-for="s in students" :key="s.nickname" class="ledger-row">
        <span>{{ s.nickname }}<span v-if="!s.online" class="muted"> (reconnecting…)</span></span>
      </div>
      <button class="primary start" @click="startRound">Start round</button>
    </template>

    <template v-else-if="!roundResult">
      <h2 class="question">{{ question.question }}</h2>
      <p class="muted">Round in progress…</p>
    </template>

    <template v-else>
      <h2 class="question">Answer: {{ roundResult.answer }}</h2>
      <div v-for="p in roundResult.scoreboard" :key="p.nickname" class="ledger-row">
        <span>{{ p.nickname }}</span>
        <span>{{ p.score }}</span>
      </div>
      <p v-if="roundResult.gameOver" class="muted">Game over.</p>
      <button v-else class="primary start" @click="startRound">Next round</button>
    </template>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 16px; padding: 48px 24px; max-width: 480px; margin: 0 auto; }
h1 { font-family: var(--font-content); font-weight: 600; font-size: 1.6rem; margin: 0 0 8px; }
h2 { font-family: var(--font-content); font-weight: 600; font-size: 1.15rem; margin: 8px 0; }
.question { font-size: 1.4rem; }
.muted { color: var(--ink-soft); }
.start { margin-top: 12px; align-self: flex-start; }
</style>