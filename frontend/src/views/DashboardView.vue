<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as api from '../api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { lecturer, logout } = useAuth()

const questionSets = ref([])
const loading = ref(true)
const error = ref('')

// New question set form state
const newTitle = ref('')
const newQuestions = ref([blankQuestion()])

function blankQuestion() {
  return { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
}

function addQuestion() {
  newQuestions.value.push(blankQuestion())
}

function removeQuestion(index) {
  newQuestions.value.splice(index, 1)
}

async function loadSets() {
  loading.value = true
  try {
    questionSets.value = await api.fetchQuestionSets()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  error.value = ''
  try {
    await api.createQuestionSet(newTitle.value, newQuestions.value)
    newTitle.value = ''
    newQuestions.value = [blankQuestion()]
    await loadSets()
  } catch (e) {
    error.value = e.message
  }
}

async function handleStartSession(setId) {
  try {
    const { roomCode } = await api.startSession(setId)
    router.push(`/host/${roomCode}`)
  } catch (e) {
    error.value = e.message
  }
}

function handleLogout() {
  logout()
  router.push('/login')
}

onMounted(loadSets)
</script>

<template>
  <div class="wrap">
    <header class="header">
      <h1>Welcome, {{ lecturer?.name }}</h1>
      <button @click="handleLogout">Log out</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section>
      <h2>Your question sets</h2>
      <p v-if="loading">Loading…</p>
      <ul v-else>
        <li v-for="set in questionSets" :key="set._id" class="set-item">
          <span>{{ set.title }} ({{ set.questions.length }} questions)</span>
          <button @click="handleStartSession(set._id)">Start session</button>
        </li>
      </ul>
    </section>

    <section>
      <h2>Create a new question set</h2>
      <input v-model="newTitle" placeholder="Title" />

      <div v-for="(q, i) in newQuestions" :key="i" class="question-block">
        <input v-model="q.questionText" placeholder="Question text" />
        <input v-for="(opt, j) in q.options" :key="j" v-model="q.options[j]" :placeholder="`Option ${j + 1}`" />
        <select v-model="q.correctAnswer">
          <option disabled value="">Correct answer</option>
          <option v-for="opt in q.options" :key="opt" :value="opt" :disabled="!opt">{{ opt || '(empty)' }}</option>
        </select>
        <button v-if="newQuestions.length > 1" @click="removeQuestion(i)">Remove question</button>
      </div>

      <button @click="addQuestion">+ Add question</button>
      <button @click="handleCreate">Save question set</button>
    </section>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 24px; padding: 24px; max-width: 600px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; }
input, select, button { padding: 10px; font-size: 0.95rem; border-radius: 8px; border: 1px solid #ccc; }
button { cursor: pointer; }
.set-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
.question-block { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px; }
.error { color: crimson; }
</style>