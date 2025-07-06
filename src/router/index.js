import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由组件懒加载
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const Layout = () => import('@/views/layout/Layout.vue')
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const GripStrength = () => import('@/views/monitoring/GripStrength.vue')
const PostureAngle = () => import('@/views/monitoring/PostureAngle.vue')
const Speed = () => import('@/views/monitoring/Speed.vue')
const GPS = () => import('@/views/monitoring/GPS.vue')
const Profile = () => import('@/views/profile/Profile.vue')
const EditProfile = () => import('@/views/profile/EditProfile.vue')
const Avatar = () => import('@/views/profile/Avatar.vue')
const ResetPassword = () => import('@/views/profile/ResetPassword.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'grip-strength',
        name: 'GripStrength',
        component: GripStrength
      },
      {
        path: 'posture-angle',
        name: 'PostureAngle',
        component: PostureAngle
      },
      {
        path: 'speed',
        name: 'Speed',
        component: Speed
      },
      {
        path: 'gps',
        name: 'GPS',
        component: GPS
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: 'profile/edit',
        name: 'EditProfile',
        component: EditProfile
      },
      {
        path: 'profile/avatar',
        name: 'Avatar',
        component: Avatar
      },
      {
        path: 'profile/password',
        name: 'ResetPassword',
        component: ResetPassword
      }
    ]
  },
  // Add direct routes for better accessibility
  {
    path: '/grip-strength',
    redirect: '/dashboard/grip-strength'
  },
  {
    path: '/posture-angle',
    redirect: '/dashboard/posture-angle'
  },
  {
    path: '/speed',
    redirect: '/dashboard/speed'
  },
  {
    path: '/gps',
    redirect: '/dashboard/gps'
  },
  {
    path: '/profile',
    redirect: '/dashboard/profile'
  },
  {
    path: '/profile/edit',
    redirect: '/dashboard/profile/edit'
  },
  {
    path: '/profile/avatar',
    redirect: '/dashboard/profile/avatar'
  },
  {
    path: '/profile/password',
    redirect: '/dashboard/profile/password'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (!to.meta.requiresAuth && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router