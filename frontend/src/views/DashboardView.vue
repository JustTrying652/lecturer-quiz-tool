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
      <h1>{{ lecturer?.name }}</h1>
      <button @click="handleLogout">Log out</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section>
      <h2>Your question sets</h2>
      <p v-if="loading" class="muted">Loading…</p>
      <p v-else-if="!questionSets.length" class="muted">No question sets yet — create one below.</p>
      <div v-else>
        <div v-for="set in questionSets" :key="set._id" class="ledger-row">
          <span>{{ set.title }} <span class="muted">— {{ set.questions.length }} questions</span></span>
          <button class="primary" @click="handleStartSession(set._id)">Start session</button>
        </div>
      </div>
    </section>

    <section>
      <h2>Create a question set</h2>
      <input v-model="newTitle" placeholder="Title" class="full" />

      <div v-for="(q, i) in newQuestions" :key="i" class="question-block">
        <input v-model="q.questionText" placeholder="Question text" class="full" />
        <div class="options-grid">
          <input v-for="(opt, j) in q.options" :key="j" v-model="q.options[j]" :placeholder="`Option ${j + 1}`" />
        </div>
        <select v-model="q.correctAnswer">
          <option disabled value="">Correct answer</option>
          <option v-for="opt in q.options" :key="opt" :value="opt" :disabled="!opt">{{ opt || '(empty)' }}</option>
        </select>
        <button v-if="newQuestions.length > 1" @click="removeQuestion(i)">Remove question</button>
      </div>

      <div class="actions">
        <button @click="addQuestion">Add question</button>
        <button class="primary" @click="handleCreate">Save question set</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 40px; padding: 48px 24px; max-width: 640px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--line); padding-bottom: 16px; }
h1 { font-family: var(--font-content); font-weight: 600; font-size: 1.6rem; margin: 0; }
h2 { font-family: var(--font-content); font-weight: 600; font-size: 1.15rem; margin: 0 0 12px; }
.muted { color: var(--ink-soft); }
.full { width: 100%; margin-bottom: 8px; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.question-block { display: flex; flex-direction: column; padding: 16px 0; border-bottom: 1px solid var(--line); }
.actions { display: flex; gap: 10px; margin-top: 8px; }
</style>