import { createRouter, createWebHistory } from 'vue-router'
import StudentView from './views/StudentView.vue'
import LoginView from './views/LoginView.vue'
import SignupView from './views/SignupView.vue'
import DashboardView from './views/DashboardView.vue'
import HostView from './views/HostView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/play', component: StudentView },
  { path: '/login', component: LoginView },
  { path: '/signup', component: SignupView },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/host/:roomCode', component: HostView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    return '/login'
  }
})

export default router