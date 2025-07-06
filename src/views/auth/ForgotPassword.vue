<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <!-- 头部标题 -->
      <div class="forgot-password-header">
        <div class="logo">
          <el-icon size="40" color="#409EFF">
            <Key />
          </el-icon>
        </div>
        <h1 class="title">找回密码</h1>
        <p class="subtitle">请输入您的邮箱地址，我们将发送重置密码的链接</p>
      </div>

      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" align-center class="reset-steps">
        <el-step title="输入邮箱" />
        <el-step title="验证身份" />
        <el-step title="重置密码" />
        <el-step title="完成" />
      </el-steps>

      <!-- 步骤1: 输入邮箱 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form
          ref="emailFormRef"
          :model="emailForm"
          :rules="emailRules"
          class="reset-form"
        >
          <el-form-item prop="email">
            <el-input
              v-model="emailForm.email"
              placeholder="请输入注册时使用的邮箱地址"
              size="large"
              :prefix-icon="Message"
              clearable
              @keyup.enter="sendResetEmail"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="sending"
              @click="sendResetEmail"
            >
              {{ sending ? '发送中...' : '发送重置链接' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2: 验证身份 -->
      <div v-show="currentStep === 1" class="step-content">
        <div class="verification-content">
          <el-icon size="60" color="#409EFF" class="verification-icon">
            <Message />
          </el-icon>
          <h3>验证您的身份</h3>
          <p>我们已向 <strong>{{ emailForm.email }}</strong> 发送了验证码</p>
          <p>请查收邮件并输入6位验证码</p>

          <el-form
            ref="verificationFormRef"
            :model="verificationForm"
            :rules="verificationRules"
            class="verification-form"
          >
            <el-form-item prop="code">
              <el-input
                v-model="verificationForm.code"
                placeholder="请输入6位验证码"
                size="large"
                :prefix-icon="Key"
                maxlength="6"
                clearable
                @input="formatVerificationCode"
                @keyup.enter="verifyCode"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="verify-button"
                :loading="verifying"
                @click="verifyCode"
              >
                {{ verifying ? '验证中...' : '验证身份' }}
              </el-button>
            </el-form-item>

            <div class="resend-section">
              <span v-if="resendCountdown > 0">
                {{ resendCountdown }}秒后可重新发送
              </span>
              <el-link
                v-else
                type="primary"
                :loading="resending"
                @click="resendCode"
              >
                重新发送验证码
              </el-link>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 步骤3: 重置密码 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="reset-content">
          <el-icon size="60" color="#409EFF" class="reset-icon">
            <Lock />
          </el-icon>
          <h3>设置新密码</h3>
          <p>请设置一个安全的新密码</p>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            class="password-form"
          >
            <el-form-item prop="password">
              <el-input
                v-model="passwordForm.password"
                type="password"
                placeholder="请输入新密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
                @input="checkPasswordStrength"
              />
            </el-form-item>

            <!-- 密码强度指示器 -->
            <div v-if="passwordForm.password" class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrength.level"
                  :style="{ width: passwordStrength.percentage + '%' }"
                ></div>
              </div>
              <div class="strength-text">
                密码强度: {{ passwordStrength.text }}
              </div>
              <div class="password-requirements">
                <div 
                  v-for="req in passwordRequirements" 
                  :key="req.text"
                  class="requirement"
                  :class="{ met: req.met }"
                >
                  <el-icon>
                    <Check v-if="req.met" />
                    <Close v-else />
                  </el-icon>
                  {{ req.text }}
                </div>
              </div>
            </div>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="resetPassword"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="reset-button"
                :loading="resetting"
                @click="resetPassword"
              >
                {{ resetting ? '重置中...' : '重置密码' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 步骤4: 完成 -->
      <div v-show="currentStep === 3" class="step-content">
        <div class="success-content">
          <el-icon size="80" color="#67c23a" class="success-icon">
            <CircleCheck />
          </el-icon>
          <h3>密码重置成功！</h3>
          <p>您的密码已成功重置</p>
          <p>现在可以使用新密码登录了</p>

          <div class="success-actions">
            <el-button
              type="primary"
              size="large"
              @click="goToLogin"
            >
              立即登录
            </el-button>
          </div>
        </div>
      </div>

      <!-- 返回登录链接 -->
      <div v-if="currentStep < 3" class="login-link">
        <el-link type="primary" @click="goToLogin">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </el-link>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="security-tips">
      <el-card class="tips-card">
        <template #header>
          <div class="tips-header">
            <el-icon><InfoFilled /></el-icon>
            <span>安全提示</span>
          </div>
        </template>
        <div class="tips-content">
          <ul>
            <li>重置密码链接有效期为30分钟</li>
            <li>为了账户安全，请设置复杂密码</li>
            <li>不要在公共场所重置密码</li>
            <li>如有疑问，请联系客服</li>
          </ul>
        </div>
      </el-card>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Key,
  Lock,
  Message,
  Check,
  Close,
  CircleCheck,
  ArrowLeft,
  InfoFilled
} from '@element-plus/icons-vue'
import { authAPI } from '@/api/auth'

const router = useRouter()

// 表单引用
const emailFormRef = ref()
const verificationFormRef = ref()
const passwordFormRef = ref()

// 状态管理
const currentStep = ref(0)
const sending = ref(false)
const verifying = ref(false)
const resetting = ref(false)
const resending = ref(false)
const resendCountdown = ref(0)

// 邮箱表单数据
const emailForm = reactive({
  email: ''
})

// 验证表单数据
const verificationForm = reactive({
  code: ''
})

// 密码表单数据
const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 密码强度状态
const passwordStrength = ref({
  level: 'weak',
  percentage: 0,
  text: '弱'
})

// 密码要求检查
const passwordRequirements = ref([
  { text: '至少8个字符', met: false },
  { text: '包含大写字母', met: false },
  { text: '包含小写字母', met: false },
  { text: '包含数字', met: false },
  { text: '包含特殊字符', met: false }
])

// 重置令牌
const resetToken = ref('')

// 表单验证规则
const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const verificationRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码只能包含数字', trigger: 'blur' }
  ]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 自定义验证器
function validatePassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (passwordStrength.value.level === 'weak') {
    callback(new Error('密码强度太弱，请设置更复杂的密码'))
  } else {
    callback()
  }
}

function validateConfirmPassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请确认新密码'))
  } else if (value !== passwordForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 发送重置邮件
const sendResetEmail = async () => {
  if (!emailFormRef.value) return
  
  try {
    const valid = await emailFormRef.value.validate()
    if (!valid) return
    
    sending.value = true
    
    const response = await authAPI.sendPasswordResetEmail(emailForm.email)
    
    if (response.success) {
      currentStep.value = 1
      startResendCountdown()
      ElMessage.success('重置链接已发送到您的邮箱')
    } else {
      ElMessage.error(response.message || '发送失败，请重试')
    }
  } catch (error) {
    console.error('发送重置邮件失败:', error)
    ElMessage.error('发送失败，请检查邮箱地址是否正确')
  } finally {
    sending.value = false
  }
}

// 验证验证码
const verifyCode = async () => {
  if (!verificationFormRef.value) return
  
  try {
    const valid = await verificationFormRef.value.validate()
    if (!valid) return
    
    verifying.value = true
    
    const response = await authAPI.verifyPasswordResetCode(
      emailForm.email,
      verificationForm.code
    )
    
    if (response.success) {
      resetToken.value = response.token
      currentStep.value = 2
      ElMessage.success('验证成功')
    } else {
      ElMessage.error(response.message || '验证码错误或已过期')
    }
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证失败，请重试')
  } finally {
    verifying.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    resetting.value = true
    
    const response = await authAPI.resetPassword({
      token: resetToken.value,
      email: emailForm.email,
      password: passwordForm.password,
      confirmPassword: passwordForm.confirmPassword
    })
    
    if (response.success) {
      currentStep.value = 3
      ElMessage.success('密码重置成功')
    } else {
      ElMessage.error(response.message || '重置失败，请重试')
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置失败，请重试')
  } finally {
    resetting.value = false
  }
}

// 重新发送验证码
const resendCode = async () => {
  if (resendCountdown.value > 0) return
  
  resending.value = true
  try {
    await authAPI.sendPasswordResetEmail(emailForm.email)
    ElMessage.success('验证码已重新发送')
    startResendCountdown()
  } catch (error) {
    console.error('重新发送失败:', error)
    ElMessage.error('重新发送失败，请稍后重试')
  } finally {
    resending.value = false
  }
}

// 开始重发倒计时
const startResendCountdown = () => {
  resendCountdown.value = 60
  const timer = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 格式化验证码输入
const formatVerificationCode = () => {
  verificationForm.code = verificationForm.code.replace(/\D/g, '')
}

// 检查密码强度
const checkPasswordStrength = () => {
  const password = passwordForm.password
  
  // 重置要求检查
  passwordRequirements.value = [
    { text: '至少8个字符', met: password.length >= 8 },
    { text: '包含大写字母', met: /[A-Z]/.test(password) },
    { text: '包含小写字母', met: /[a-z]/.test(password) },
    { text: '包含数字', met: /\d/.test(password) },
    { text: '包含特殊字符', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ]
  
  const metCount = passwordRequirements.value.filter(req => req.met).length
  
  if (metCount < 2) {
    passwordStrength.value = { level: 'weak', percentage: 20, text: '弱' }
  } else if (metCount < 4) {
    passwordStrength.value = { level: 'medium', percentage: 60, text: '中等' }
  } else {
    passwordStrength.value = { level: 'strong', percentage: 100, text: '强' }
  }
}

// 前往登录
const goToLogin = () => {
  router.push('/login')
}

// 组件挂载时执行
onMounted(() => {
  // 检查URL参数中是否有邮箱地址
  const urlParams = new URLSearchParams(window.location.search)
  const email = urlParams.get('email')
  if (email) {
    emailForm.email = email
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  // 清理可能存在的定时器
})
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
  gap: 30px;
}

.forgot-password-card {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  margin-bottom: 20px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

.reset-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 300px;
}

.reset-form {
  width: 100%;
}

.reset-form .el-form-item {
  margin-bottom: 20px;
}

.submit-button,
.verify-button,
.reset-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.verification-content,
.reset-content {
  text-align: center;
}

.verification-icon,
.reset-icon {
  margin-bottom: 20px;
}

.verification-content h3,
.reset-content h3 {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 16px;
}

.verification-content p,
.reset-content p {
  color: #7f8c8d;
  margin-bottom: 12px;
}

.verification-form,
.password-form {
  margin: 30px 0;
}

.resend-section {
  text-align: center;
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 16px;
}

.password-strength {
  margin-bottom: 20px;
  text-align: left;
}

.strength-bar {
  height: 4px;
  background: #e4e7ed;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #f56c6c;
}

.strength-fill.medium {
  background: #e6a23c;
}

.strength-fill.strong {
  background: #67c23a;
}

.strength-text {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.password-requirements {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.requirement {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  gap: 4px;
}

.requirement.met {
  color: #67c23a;
}

.success-content {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.success-content h3 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 16px;
}

.success-content p {
  color: #7f8c8d;
  margin-bottom: 12px;
}

.success-actions {
  margin-top: 30px;
}

.success-actions .el-button {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link .el-link {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.security-tips {
  width: 100%;
  max-width: 300px;
}

.tips-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
  font-weight: 500;
}

.tips-content ul {
  margin: 0;
  padding-left: 16px;
  color: #7f8c8d;
}

.tips-content li {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.wave {
  position: absolute;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  animation: wave 10s ease-in-out infinite;
}

.wave-1 {
  top: -50%;
  left: -50%;
  animation-delay: 0s;
}

.wave-2 {
  bottom: -50%;
  right: -50%;
  animation-delay: 5s;
}

@keyframes wave {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .forgot-password-container {
    flex-direction: column;
    padding: 10px;
  }
  
  .forgot-password-card {
    margin: 10px;
    padding: 30px 20px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .password-requirements {
    grid-template-columns: 1fr;
  }
  
  .security-tips {
    max-width: 100%;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .forgot-password-card {
    background: rgba(30, 30, 30, 0.95);
  }
  
  .title {
    color: #ffffff;
  }
  
  .subtitle {
    color: #b0b0b0;
  }
  
  .verification-content h3,
  .reset-content h3,
  .success-content h3 {
    color: #ffffff;
  }
  
  .tips-card {
    background: rgba(40, 40, 40, 0.9);
  }
}
</style>