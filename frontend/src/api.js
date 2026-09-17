const API_BASE = 'http://127.0.0.1:4000/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function signup(name, email, password) {
  return fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  }).then(handle)
}

export function login(email, password) {
  return fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle)
}

export function fetchQuestionSets() {
  return fetch(`${API_BASE}/question-sets`, { headers: authHeaders() }).then(handle)
}

export function createQuestionSet(title, questions) {
  return fetch(`${API_BASE}/question-sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, questions }),
  }).then(handle)
}

export function startSession(questionSetId) {
  return fetch(`${API_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ questionSetId }),
  }).then(handle)
}