<template>
  <div class="reset-password">
    <div class="page-header">
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>重置密码</h1>
    </div>
    
    <div class="password-container">
      <!-- 安全提示 -->
      <div class="security-notice">
        <div class="notice-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="notice-content">
          <h3>密码安全提示</h3>
          <ul>
            <li>密码长度至少8位，包含字母、数字和特殊字符</li>
            <li>不要使用生日、姓名等容易被猜到的信息</li>
            <li>定期更换密码，建议每3-6个月更换一次</li>
            <li>不要在多个网站使用相同密码</li>
          </ul>
        </div>
      </div>
      
      <!-- 密码重置表单 -->
      <div class="form-container">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          class="password-form"
        >
          <!-- 当前密码 -->
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="formData.currentPassword"
              type="password"
              placeholder="请输入当前密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="current-password"
            />
          </el-form-item>
          
          <!-- 新密码 -->
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="formData.newPassword"
              type="password"
              placeholder="请输入新密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="new-password"
              @input="checkPasswordStrength"
            />
            <!-- 密码强度指示器 -->
            <div class="password-strength" v-if="formData.newPassword">
              <div class="strength-label">密码强度:</div>
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrength.level"
                  :style="{ width: passwordStrength.percentage + '%' }"
                ></div>
              </div>
              <div class="strength-text" :class="passwordStrength.level">
                {{ passwordStrength.text }}
              </div>
            </div>
          </el-form-item>
          
          <!-- 确认新密码 -->
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="Lock"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
          
          <!-- 密码要求提示 -->
          <div class="password-requirements">
            <h4>密码要求:</h4>
            <div class="requirement-list">
              <div class="requirement-item" :class="{ valid: requirements.length }">
                <el-icon><Check v-if="requirements.length" /><Close v-else /></el-icon>
                <span>至少8个字符</span>
              </div>
              <div class="requirement-item" :class="{ valid: requirements.uppercase }">
                <el-icon><Check v-if="requirements.uppercase" /><Close v-else /></el-icon>
                <span>包含大写字母</span>
              </div>
              <div class="requirement-item" :class="{ valid: requirements.lowercase }">
                <el-icon><Check v-if="requirements.lowercase" /><Close v-else /></el-icon>
                <span>包含小写字母</span>
              </div>
              <div class="requirement-item" :class="{ valid: requirements.number }">
                <el-icon><Check v-if="requirements.number" /><Close v-else /></el-icon>
                <span>包含数字</span>
              </div>
              <div class="requirement-item" :class="{ valid: requirements.special }">
                <el-icon><Check v-if="requirements.special" /><Close v-else /></el-icon>
                <span>包含特殊字符</span>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="$router.back()">取消</el-button>
            <el-button 
              type="primary" 
              @click="submitForm" 
              :loading="submitting"
              :disabled="!isFormValid"
            >
              确认修改
            </el-button>
          </div>
        </el-form>
      </div>
      
      <!-- 最近密码修改记录 -->
      <div class="password-history">
        <h2>密码修改记录</h2>
        <div class="history-list">
          <div v-for="record in passwordHistory" :key="record.id" class="history-item">
            <div class="history-icon">
              <el-icon><Key /></el-icon>
            </div>
            <div class="history-content">
              <div class="history-action">{{ record.action }}</div>
              <div class="history-time">{{ formatTime(record.timestamp) }}</div>
              <div class="history-device">{{ record.device }}</div>
            </div>
            <div class="history-status" :class="record.status">
              {{ getStatusText(record.status) }}
            </div>
          </div>
          <div v-if="passwordHistory.length === 0" class="no-history">
            <el-icon><InfoFilled /></el-icon>
            <span>暂无密码修改记录</span>
          </div>
        </div>
      </div>
      
      <!-- 安全建议 -->
      <div class="security-tips">
        <h2>安全建议</h2>
        <div class="tips-grid">
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon><Shield /></el-icon>
            </div>
            <div class="tip-content">
              <h4>使用强密码</h4>
              <p>密码应包含大小写字母、数字和特殊字符，长度至少8位</p>
            </div>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="tip-content">
              <h4>定期更换</h4>
              <p>建议每3-6个月更换一次密码，保持账户安全</p>
            </div>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon><Hide /></el-icon>
            </div>
            <div class="tip-content">
              <h4>保密存储</h4>
              <p>不要将密码告诉他人或写在容易被发现的地方</p>
            </div>
          </div>
          
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="tip-content">
              <h4>监控登录</h4>
              <p>定期检查登录记录，发现异常及时修改密码</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Lock,
  Warning,
  Check,
  Close,
  Key,
  InfoFilled,
  Shield,
  Refresh,
  Hide,
  Monitor
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const submitting = ref(false)

// 表单数据
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码强度
const passwordStrength = ref({
  level: 'weak',
  percentage: 0,
  text: '弱'
})

// 密码要求检查
const requirements = computed(() => {
  const password = formData.newPassword
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
})

// 表单验证规则
const formRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === formData.currentPassword) {
          callback(new Error('新密码不能与当前密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        const reqs = requirements.value
        if (!reqs.uppercase || !reqs.lowercase || !reqs.number || !reqs.special) {
          callback(new Error('密码必须包含大小写字母、数字和特殊字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 密码修改历史
const passwordHistory = ref([
  {
    id: 1,
    action: '密码修改',
    timestamp: Date.now() - 86400000 * 30,
    device: 'Chrome 浏览器 (Windows)',
    status: 'success'
  },
  {
    id: 2,
    action: '密码修改',
    timestamp: Date.now() - 86400000 * 90,
    device: 'Safari 浏览器 (macOS)',
    status: 'success'
  },
  {
    id: 3,
    action: '密码重置',
    timestamp: Date.now() - 86400000 * 180,
    device: '系统重置',
    status: 'warning'
  }
])

// 表单是否有效
const isFormValid = computed(() => {
  const reqs = requirements.value
  return formData.currentPassword && 
         formData.newPassword && 
         formData.confirmPassword &&
         formData.newPassword === formData.confirmPassword &&
         formData.newPassword !== formData.currentPassword &&
         reqs.length && reqs.uppercase && reqs.lowercase && reqs.number && reqs.special
})

// 检查密码强度
const checkPasswordStrength = () => {
  const password = formData.newPassword
  let score = 0
  
  // 长度检查
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 10
  
  // 字符类型检查
  if (/[a-z]/.test(password)) score += 20
  if (/[A-Z]/.test(password)) score += 20
  if (/\d/.test(password)) score += 20
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20
  
  // 复杂度检查
  if (password.length >= 16) score += 10
  
  // 设置强度等级
  if (score < 40) {
    passwordStrength.value = { level: 'weak', percentage: score, text: '弱' }
  } else if (score < 70) {
    passwordStrength.value = { level: 'medium', percentage: score, text: '中等' }
  } else if (score < 90) {
    passwordStrength.value = { level: 'strong', percentage: score, text: '强' }
  } else {
    passwordStrength.value = { level: 'very-strong', percentage: score, text: '很强' }
  }
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  passwordStrength.value = { level: 'weak', percentage: 0, text: '弱' }
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    await ElMessageBox.confirm(
      '确定要修改密码吗？修改后需要重新登录。',
      '确认修改',
      {
        confirmButtonText: '确定修改',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitting.value = true
    
    // 调用用户store重置密码
    await userStore.resetUserPassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    })
    
    ElMessage.success('密码修改成功，请重新登录')
    
    // 清除用户状态并跳转到登录页
    userStore.logout()
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '密码修改失败')
    }
  } finally {
    submitting.value = false
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    success: '成功',
    warning: '警告',
    error: '失败'
  }
  return statusMap[status] || '未知'
}
</script>

<style scoped>
.reset-password {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.password-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 安全提示 */
.security-notice {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 16px;
}

.notice-icon {
  font-size: 24px;
  color: #fa8c16;
  flex-shrink: 0;
}

.notice-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #d46b08;
  margin: 0 0 12px 0;
}

.notice-content ul {
  margin: 0;
  padding-left: 20px;
  color: #d46b08;
}

.notice-content li {
  margin-bottom: 4px;
  font-size: 14px;
}

/* 表单容器 */
.form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.password-form {
  max-width: 500px;
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.strength-label {
  font-size: 12px;
  color: #606266;
  min-width: 60px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
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
  background: #409eff;
}

.strength-fill.very-strong {
  background: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
}

.strength-text.weak {
  color: #f56c6c;
}

.strength-text.medium {
  color: #e6a23c;
}

.strength-text.strong {
  color: #409eff;
}

.strength-text.very-strong {
  color: #67c23a;
}

/* 密码要求 */
.password-requirements {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.password-requirements h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #f56c6c;
  transition: color 0.3s ease;
}

.requirement-item.valid {
  color: #67c23a;
}

.requirement-item .el-icon {
  font-size: 14px;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 密码历史 */
.password-history {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.password-history h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.history-icon {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.history-content {
  flex: 1;
}

.history-action {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.history-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.history-device {
  font-size: 12px;
  color: #c0c4cc;
}

.history-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.history-status.success {
  background: #f0f9ff;
  color: #67c23a;
}

.history-status.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.history-status.error {
  background: #fef0f0;
  color: #f56c6c;
}

.no-history {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #c0c4cc;
  font-size: 14px;
}

/* 安全建议 */
.security-tips {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.security-tips h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.tip-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tip-icon {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.tip-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.tip-content p {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reset-password {
    padding: 16px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .password-form {
    max-width: 100%;
  }
  
  .password-strength {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .strength-label {
    min-width: auto;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .security-notice {
    flex-direction: column;
    gap: 12px;
  }
  
  .requirement-list {
    grid-template-columns: 1fr;
  }
}
</style>