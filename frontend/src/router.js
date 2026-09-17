import { createRouter, createWebHistory } from 'vue-router'
import StudentView from './views/StudentView.vue'

const routes = [
  { path: '/play', component: StudentView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})