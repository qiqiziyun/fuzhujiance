<template>
  <div class="edit-profile">
    <div class="page-header">
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>编辑基本资料</h1>
    </div>
    
    <div class="profile-form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="profile-form"
      >
        <!-- 头像预览 -->
        <div class="avatar-preview">
          <div class="avatar-container">
            <img 
              :src="formData.avatar || '/default-avatar.png'" 
              alt="头像预览"
              class="preview-avatar"
            />
            <div class="avatar-info">
              <h3>用户名: {{ formData.username || '未设置' }}</h3>
              <p>邮箱: {{ formData.email || '未设置' }}</p>
            </div>
          </div>
        </div>
        
        <!-- 基本信息 -->
        <div class="form-section">
          <h2 class="section-title">基本信息</h2>
          
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="realName">
            <el-input
              v-model="formData.realName"
              placeholder="请输入真实姓名"
              :prefix-icon="User"
              maxlength="10"
            />
          </el-form-item>
          
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="formData.gender">
              <el-radio value="male">男</el-radio>
                <el-radio value="female">女</el-radio>
                <el-radio value="other">其他</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="出生日期" prop="birthday">
            <el-date-picker
              v-model="formData.birthday"
              type="date"
              placeholder="选择出生日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="年龄">
            <el-input
              :value="calculatedAge"
              disabled
              placeholder="根据出生日期自动计算"
            />
          </el-form-item>
        </div>
        
        <!-- 联系信息 -->
        <div class="form-section">
          <h2 class="section-title">联系信息</h2>
          
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱地址"
              :prefix-icon="Message"
              type="email"
            />
          </el-form-item>
          
          <el-form-item label="手机号码" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号码"
              :prefix-icon="Phone"
              maxlength="11"
            />
          </el-form-item>
          
          <el-form-item label="紧急联系人" prop="emergencyContact">
            <el-input
              v-model="formData.emergencyContact"
              placeholder="请输入紧急联系人姓名"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item label="紧急联系电话" prop="emergencyPhone">
            <el-input
              v-model="formData.emergencyPhone"
              placeholder="请输入紧急联系电话"
              :prefix-icon="Phone"
              maxlength="11"
            />
          </el-form-item>
        </div>
        
        <!-- 地址信息 -->
        <div class="form-section">
          <h2 class="section-title">地址信息</h2>
          
          <el-form-item label="所在地区" prop="region">
            <el-cascader
              v-model="formData.region"
              :options="regionOptions"
              placeholder="请选择省市区"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="详细地址" prop="address">
            <el-input
              v-model="formData.address"
              type="textarea"
              :rows="3"
              placeholder="请输入详细地址"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </div>
        
        <!-- 健康信息 -->
        <div class="form-section">
          <h2 class="section-title">健康信息</h2>
          
          <el-form-item label="身高(cm)" prop="height">
            <el-input-number
              v-model="formData.height"
              :min="100"
              :max="250"
              placeholder="请输入身高"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="体重(kg)" prop="weight">
            <el-input-number
              v-model="formData.weight"
              :min="30"
              :max="200"
              :precision="1"
              placeholder="请输入体重"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="BMI指数">
            <el-input
              :value="calculatedBMI"
              disabled
              placeholder="根据身高体重自动计算"
            >
              <template #append>
                <span :class="getBMIClass()">{{ getBMIStatus() }}</span>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="血型" prop="bloodType">
            <el-select v-model="formData.bloodType" placeholder="请选择血型" style="width: 100%">
              <el-option label="A型" value="A" />
              <el-option label="B型" value="B" />
              <el-option label="AB型" value="AB" />
              <el-option label="O型" value="O" />
              <el-option label="未知" value="unknown" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="过敏史" prop="allergies">
            <el-input
              v-model="formData.allergies"
              type="textarea"
              :rows="2"
              placeholder="请输入过敏史，如无请填写'无'"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="病史" prop="medicalHistory">
            <el-input
              v-model="formData.medicalHistory"
              type="textarea"
              :rows="2"
              placeholder="请输入病史，如无请填写'无'"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </div>
        
        <!-- 个人简介 -->
        <div class="form-section">
          <h2 class="section-title">个人简介</h2>
          
          <el-form-item label="个人简介" prop="bio">
            <el-input
              v-model="formData.bio"
              type="textarea"
              :rows="4"
              placeholder="介绍一下自己吧..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>
        
        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="saving">
            保存修改
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  User,
  Message,
  Phone
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const saving = ref(false)

// 表单数据
const formData = ref({
  username: '',
  realName: '',
  gender: 'male',
  birthday: '',
  email: '',
  phone: '',
  emergencyContact: '',
  emergencyPhone: '',
  region: [],
  address: '',
  height: null,
  weight: null,
  bloodType: '',
  allergies: '',
  medicalHistory: '',
  bio: '',
  avatar: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  emergencyPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 地区选项（简化版）
const regionOptions = [
  {
    value: 'beijing',
    label: '北京市',
    children: [
      {
        value: 'chaoyang',
        label: '朝阳区'
      },
      {
        value: 'haidian',
        label: '海淀区'
      }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      {
        value: 'huangpu',
        label: '黄浦区'
      },
      {
        value: 'pudong',
        label: '浦东新区'
      }
    ]
  }
]

// 计算年龄
const calculatedAge = computed(() => {
  if (!formData.value.birthday) return ''
  
  const today = new Date()
  const birthDate = new Date(formData.value.birthday)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age + ' 岁'
})

// 计算BMI
const calculatedBMI = computed(() => {
  const { height, weight } = formData.value
  if (!height || !weight) return ''
  
  const bmi = weight / Math.pow(height / 100, 2)
  return bmi.toFixed(1)
})

// 获取BMI状态
const getBMIStatus = () => {
  const bmi = parseFloat(calculatedBMI.value)
  if (!bmi) return ''
  
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}

// 获取BMI样式类
const getBMIClass = () => {
  const bmi = parseFloat(calculatedBMI.value)
  if (!bmi) return ''
  
  if (bmi < 18.5) return 'bmi-underweight'
  if (bmi < 24) return 'bmi-normal'
  if (bmi < 28) return 'bmi-overweight'
  return 'bmi-obese'
}

// 禁用未来日期
const disabledDate = (time) => {
  return time.getTime() > Date.now()
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  loadUserData()
}

// 保存资料
const saveProfile = async () => {
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    // 调用用户store更新资料
    await userStore.updateUserProfile(formData.value)
    
    ElMessage.success('资料保存成功')
    router.back()
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

// 加载用户数据
const loadUserData = () => {
  const user = userStore.user
  if (user) {
    // 合并用户数据到表单
    Object.keys(formData.value).forEach(key => {
      if (user[key] !== undefined) {
        formData.value[key] = user[key]
      }
    })
  }
}

// 组件挂载时
onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.edit-profile {
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

.profile-form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 头像预览 */
.avatar-preview {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.avatar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f0f0f0;
}

.avatar-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.avatar-info p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 表单区域 */
.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

/* 表单项样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select) {
  width: 100%;
}

/* BMI状态样式 */
:deep(.el-input-group__append) {
  padding: 0 12px;
}

.bmi-underweight {
  color: #409eff;
}

.bmi-normal {
  color: #67c23a;
}

.bmi-overweight {
  color: #e6a23c;
}

.bmi-obese {
  color: #f56c6c;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-profile {
    padding: 16px;
  }
  
  .profile-form-container {
    padding: 20px;
  }
  
  .avatar-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
}
</style>