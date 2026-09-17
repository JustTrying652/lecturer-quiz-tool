import { ref } from 'vue'
import * as api from '../api'

const lecturer = ref(JSON.parse(localStorage.getItem('lecturer') || 'null'))

export function useAuth() {
  async function doSignup(name, email, password) {
    const data = await api.signup(name, email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('lecturer', JSON.stringify(data.lecturer))
    lecturer.value = data.lecturer
  }

  async function doLogin(email, password) {
    const data = await api.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('lecturer', JSON.stringify(data.lecturer))
    lecturer.value = data.lecturer
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('lecturer')
    lecturer.value = null
  }

  return { lecturer, doSignup, doLogin, logout }
}