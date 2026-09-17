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
      <ul>
        <li v-for="s in students" :key="s">{{ s }}</li>
      </ul>
      <button @click="startRound">Start round</button>
    </template>

    <template v-else-if="!roundResult">
      <h2>{{ question.question }}</h2>
      <p>Round in progress…</p>
    </template>

    <template v-else>
      <h2>Answer: {{ roundResult.answer }}</h2>
      <ol>
        <li v-for="p in roundResult.scoreboard" :key="p.nickname">{{ p.nickname }} — {{ p.score }}</li>
      </ol>
      <p v-if="roundResult.gameOver">Game over!</p>
      <button v-else @click="startRound">Next round</button>
    </template>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 16px; padding: 24px; max-width: 480px; margin: 0 auto; }
button { padding: 12px; font-size: 1rem; border-radius: 8px; cursor: pointer; }
.error { color: crimson; }
</style>