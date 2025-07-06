<template>
  <div class="avatar-page">
    <div class="page-header">
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>更换头像</h1>
    </div>
    
    <div class="avatar-container">
      <!-- 当前头像 -->
      <div class="current-avatar-section">
        <h2>当前头像</h2>
        <div class="avatar-display">
          <img 
            :src="currentAvatar || '/default-avatar.png'" 
            alt="当前头像"
            class="current-avatar"
          />
          <div class="avatar-info">
            <p class="username">{{ userInfo.username }}</p>
            <p class="upload-time" v-if="avatarUploadTime">
              上传时间: {{ formatTime(avatarUploadTime) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- 上传新头像 -->
      <div class="upload-section">
        <h2>上传新头像</h2>
        
        <!-- 上传区域 -->
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            :auto-upload="false"
            accept="image/*"
            drag
          >
            <div v-if="!previewUrl" class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">
                <p>点击或拖拽图片到此处上传</p>
                <p class="upload-hint">支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</p>
              </div>
            </div>
            <img v-else :src="previewUrl" class="preview-image" alt="预览" />
          </el-upload>
          
          <!-- 上传按钮 -->
          <div class="upload-actions" v-if="!previewUrl">
            <el-button type="primary" @click="triggerUpload">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
          </div>
        </div>
        
        <!-- 预览和编辑 -->
        <div v-if="previewUrl" class="preview-section">
          <div class="preview-actions">
            <el-button @click="clearPreview">
              <el-icon><Delete /></el-icon>
              重新选择
            </el-button>
            <el-button type="primary" @click="showCropDialog = true">
              <el-icon><Crop /></el-icon>
              裁剪头像
            </el-button>
          </div>
          
          <!-- 预览效果 -->
          <div class="preview-effects">
            <h3>预览效果</h3>
            <div class="preview-sizes">
              <div class="preview-item">
                <img :src="croppedUrl || previewUrl" class="preview-large" alt="大头像" />
                <span>大头像 (80x80)</span>
              </div>
              <div class="preview-item">
                <img :src="croppedUrl || previewUrl" class="preview-medium" alt="中头像" />
                <span>中头像 (48x48)</span>
              </div>
              <div class="preview-item">
                <img :src="croppedUrl || previewUrl" class="preview-small" alt="小头像" />
                <span>小头像 (32x32)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 预设头像 -->
      <div class="preset-section">
        <h2>选择预设头像</h2>
        <div class="preset-grid">
          <div 
            v-for="(preset, index) in presetAvatars" 
            :key="index"
            class="preset-item"
            :class="{ active: selectedPreset === preset }"
            @click="selectPreset(preset)"
          >
            <img :src="preset" :alt="`预设头像${index + 1}`" class="preset-avatar" />
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="$router.back()">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveAvatar" 
          :loading="saving"
          :disabled="!hasNewAvatar"
        >
          保存头像
        </el-button>
      </div>
    </div>
    
    <!-- 裁剪对话框 -->
    <el-dialog v-model="showCropDialog" title="裁剪头像" width="600px">
      <div class="crop-container">
        <div class="crop-area">
          <img 
            ref="cropImageRef"
            :src="previewUrl" 
            alt="待裁剪图片"
            class="crop-image"
          />
        </div>
        <div class="crop-controls">
          <h4>裁剪设置</h4>
          <div class="control-group">
            <label>缩放:</label>
            <el-slider 
              v-model="cropSettings.scale" 
              :min="0.1" 
              :max="3" 
              :step="0.1"
              style="width: 200px;"
            />
          </div>
          <div class="control-group">
            <label>旋转:</label>
            <el-slider 
              v-model="cropSettings.rotate" 
              :min="-180" 
              :max="180" 
              :step="1"
              style="width: 200px;"
            />
          </div>
          <div class="control-buttons">
            <el-button @click="resetCrop">重置</el-button>
            <el-button type="primary" @click="applyCrop">应用裁剪</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCropDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCrop">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Plus,
  Upload,
  Delete,
  Crop
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const uploadRef = ref()
const cropImageRef = ref()
const saving = ref(false)

// 用户信息
const userInfo = computed(() => userStore.user || {})

// 当前头像
const currentAvatar = ref('')
const avatarUploadTime = ref(null)

// 预览相关
const previewUrl = ref('')
const croppedUrl = ref('')
const selectedFile = ref(null)
const selectedPreset = ref('')

// 裁剪相关
const showCropDialog = ref(false)
const cropSettings = ref({
  scale: 1,
  rotate: 0
})

// 预设头像
const presetAvatars = ref([
  // 人物头像
  '/avatars/man1.png',
  '/avatars/man2.png',
  '/avatars/man3.png',
  '/avatars/woman1.png',
  '/avatars/woman2.png',
  '/avatars/woman3.png',
  // 卡通头像
  '/avatars/cartoon1.png',
  '/avatars/cartoon2.png',
  '/avatars/cartoon3.png',
  '/avatars/cartoon4.png',
  // 动物头像
  '/avatars/cat.png',
  '/avatars/dog.png',
  '/avatars/panda.png',
  '/avatars/rabbit.png',
  // 抽象头像
  '/avatars/abstract1.png',
  '/avatars/abstract2.png',
  '/avatars/abstract3.png',
  '/avatars/abstract4.png'
])

// 是否有新头像
const hasNewAvatar = computed(() => {
  return previewUrl.value || selectedPreset.value
})

// 触发文件选择
const triggerUpload = () => {
  uploadRef.value.$el.querySelector('input').click()
}

// 文件上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return false // 阻止自动上传
}

// 文件选择处理
const handleFileChange = (file) => {
  selectedFile.value = file.raw
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    selectedPreset.value = '' // 清除预设选择
  }
  reader.readAsDataURL(file.raw)
}

// 清除预览
const clearPreview = () => {
  previewUrl.value = ''
  croppedUrl.value = ''
  selectedFile.value = null
  uploadRef.value.clearFiles()
}

// 选择预设头像
const selectPreset = (preset) => {
  selectedPreset.value = preset
  clearPreview() // 清除上传的图片
}

// 重置裁剪
const resetCrop = () => {
  cropSettings.value = {
    scale: 1,
    rotate: 0
  }
}

// 应用裁剪
const applyCrop = () => {
  // 这里应该使用真实的图片裁剪库，如 cropperjs
  // 现在只是模拟效果
  console.log('应用裁剪设置:', cropSettings.value)
}

// 确认裁剪
const confirmCrop = () => {
  // 模拟裁剪结果
  croppedUrl.value = previewUrl.value
  showCropDialog.value = false
  ElMessage.success('裁剪完成')
}

// 保存头像
const saveAvatar = async () => {
  try {
    saving.value = true
    
    let avatarData
    
    if (selectedPreset.value) {
      // 使用预设头像
      avatarData = selectedPreset.value
    } else if (selectedFile.value) {
      // 使用上传的文件
      avatarData = selectedFile.value
    } else {
      ElMessage.error('请选择头像')
      return
    }
    
    // 调用用户store更新头像
    await userStore.updateUserAvatar(avatarData)
    
    ElMessage.success('头像更新成功')
    router.back()
  } catch (error) {
    ElMessage.error(error.message || '头像更新失败')
  } finally {
    saving.value = false
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 组件挂载时
onMounted(() => {
  // 加载当前头像信息
  currentAvatar.value = userInfo.value.avatar || ''
  avatarUploadTime.value = userInfo.value.avatarUploadTime || null
})
</script>

<style scoped>
.avatar-page {
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

.avatar-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 当前头像区域 */
.current-avatar-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.current-avatar-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.avatar-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f0f0f0;
}

.avatar-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.upload-time {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 上传区域 */
.upload-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.upload-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.upload-area {
  margin-bottom: 24px;
}

:deep(.avatar-uploader .el-upload) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.avatar-uploader .el-upload:hover) {
  border-color: #409eff;
}

.upload-placeholder {
  text-align: center;
  color: #8c939d;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-actions {
  text-align: center;
  margin-top: 16px;
}

/* 预览区域 */
.preview-section {
  margin-top: 24px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.preview-effects h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.preview-sizes {
  display: flex;
  gap: 24px;
  align-items: center;
}

.preview-item {
  text-align: center;
}

.preview-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ebeef5;
  margin-bottom: 8px;
}

.preview-medium {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ebeef5;
  margin-bottom: 8px;
}

.preview-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ebeef5;
  margin-bottom: 8px;
}

.preview-item span {
  font-size: 12px;
  color: #909399;
  display: block;
}

/* 预设头像区域 */
.preset-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preset-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
}

.preset-item {
  cursor: pointer;
  border-radius: 8px;
  padding: 8px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preset-item:hover {
  background: #f5f7fa;
  transform: scale(1.05);
}

.preset-item.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.preset-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

/* 裁剪对话框 */
.crop-container {
  display: flex;
  gap: 24px;
}

.crop-area {
  flex: 1;
  height: 300px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.crop-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.crop-controls {
  width: 200px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.crop-controls h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  font-size: 12px;
  color: #606266;
  display: block;
  margin-bottom: 8px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-buttons .el-button {
  width: 100%;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-page {
    padding: 16px;
  }
  
  .avatar-display {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .preview-sizes {
    flex-direction: column;
    gap: 16px;
  }
  
  .preset-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .crop-container {
    flex-direction: column;
  }
  
  .crop-controls {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .preset-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>