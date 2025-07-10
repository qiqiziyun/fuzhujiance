import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, updateProfile, updateAvatar, resetPassword } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref('')
  const isInitialized = ref(false)
  
  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && !!user.value && isInitialized.value
  })
  
  // 初始化用户信息
  const initUser = () => {
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (savedToken && savedUser) {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      }
    } catch (error) {
      console.error('初始化用户信息失败:', error)
      // 清除可能损坏的数据
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      isInitialized.value = true
    }
  }
  
  // 登录
  const loginUser = async (credentials) => {
    try {
      const response = await login(credentials)
      
      // 确保响应数据完整
      if (!response.user || !response.token) {
        throw new Error('登录响应数据不完整')
      }
      
      user.value = response.user
      token.value = response.token
      
      // 同步保存到localStorage
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('token', response.token)
      
      return { success: true }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: error.message || '登录失败，请重试' }
    }
  }
  
  // 注册
  const registerUser = async (userData) => {
    try {
      const response = await register(userData)
      return { success: true, message: '注册成功' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  // 更新个人资料
  const updateUserProfile = async (profileData) => {
    try {
      const response = await updateProfile(profileData)
      user.value = { ...user.value, ...response.user }
      localStorage.setItem('user', JSON.stringify(user.value))
      return { success: true, message: '资料更新成功' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  // 更新头像
  const updateUserAvatar = async (avatarFile) => {
    try {
      const response = await updateAvatar(avatarFile)
      user.value.avatar = response.avatar
      localStorage.setItem('user', JSON.stringify(user.value))
      return { success: true, message: '头像更新成功' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  // 重置密码
  const resetUserPassword = async (passwordData) => {
    try {
      await resetPassword(passwordData)
      return { success: true, message: '密码重置成功' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  // 退出登录
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
  
  // 立即初始化
  initUser()
  
  return {
    user,
    token,
    isLoggedIn,
    isInitialized,
    loginUser,
    registerUser,
    updateUserProfile,
    updateUserAvatar,
    resetUserPassword,
    logout,
    initUser
  }
})