<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const { doLogin } = useAuth()

async function handleSubmit() {
  error.value = ''
  try {
    await doLogin(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="wrap">
    <h1>Log in</h1>
    <input v-model="email" placeholder="Email" type="email" />
    <input v-model="password" placeholder="Password" type="password" />
    <button class="primary" @click="handleSubmit">Log in</button>
    <p v-if="error" class="error">{{ error }}</p>
    <router-link to="/signup">Need an account? Sign up</router-link>
  </div>
</template>

<style scoped>
.wrap {
  display: flex; flex-direction: column; gap: 14px;
  padding: 48px 24px; max-width: 360px; margin: 0 auto;
}
h1 { font-family: var(--font-content); font-weight: 600; font-size: 1.8rem; margin: 0 0 8px; }
</style>