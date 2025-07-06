<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>
          <el-icon class="header-icon"><UserFilled /></el-icon>
          手推车监测系统
        </h1>
        <p>老年人辅助监测平台</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goToRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref()

// 加载状态
const loading = ref(false)

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在 4 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const result = await userStore.loginUser(loginForm)
    
    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  background-image: url('/tupian/1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end; /* 改为右对齐 */
  padding: 20px;
  padding-right: 120px; /* 增加右侧内边距，调整与文字的对齐 */
  position: relative;
  padding-top: 200px;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px; /* 从400px增加到450px */
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.login-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  color: white;
  padding: 35px;
  text-align: center;
  border-radius: 20px 20px 0 0;
}

.login-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.login-form {
  padding: 35px;
  background: transparent;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.login-footer span {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 20px;
    justify-content: center;
    align-items: center;
    padding-top: 0;
  }
  
  .login-card {
    max-width: 350px;
  }
  
  .login-header {
    padding: 25px;
  }
  
  .login-header h1 {
    font-size: 20px;
  }
  
  .login-form {
    padding: 25px;
  }
  
  .login-btn {
    height: 40px;
  }
}
</style>