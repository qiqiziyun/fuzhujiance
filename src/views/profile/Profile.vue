<template>
  <div class="profile">
    <div class="profile-header">
      <h1>个人资料</h1>
      <p>管理您的个人信息和设置</p>
    </div>
    
    <div class="profile-content">
      <div class="profile-card">
        <div class="card-header">
          <h2>基本信息</h2>
        </div>
        <div class="card-body">
          <div class="info-item">
            <label>用户名</label>
            <span>{{ userInfo.username || '未设置' }}</span>
          </div>
          <div class="info-item">
            <label>邮箱</label>
            <span>{{ userInfo.email || '未设置' }}</span>
          </div>
          <div class="info-item">
            <label>真实姓名</label>
            <span>{{ userInfo.realName || '未设置' }}</span>
          </div>
          <div class="info-item">
            <label>手机号</label>
            <span>{{ userInfo.phone || '未设置' }}</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button type="primary" @click="$router.push('/profile/edit')">
            编辑资料
          </el-button>
          <el-button @click="$router.push('/profile/reset-password')">
            修改密码
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const userInfo = ref({})

onMounted(() => {
  userInfo.value = userStore.userInfo || {}
})
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.profile-header p {
  color: #606266;
  font-size: 14px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.card-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.info-item span {
  color: #303133;
  flex: 1;
  text-align: right;
}

.card-footer {
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.card-footer .el-button {
  margin-left: 10px;
}
</style>