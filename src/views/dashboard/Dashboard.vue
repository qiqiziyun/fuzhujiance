<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <div class="overview-grid">
      <div class="overview-card">
        <div class="card-icon device">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="card-content">
          <h3>设备状态</h3>
          <div class="status-info">
            <span class="status-indicator" :class="dashboardData.deviceStatus"></span>
            <span class="status-text">{{ getStatusText(dashboardData.deviceStatus) }}</span>
          </div>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon battery">
          <el-icon><Lightning /></el-icon>
        </div>
        <div class="card-content">
          <h3>电池电量</h3>
          <div class="battery-info">
            <span class="battery-level">{{ dashboardData.batteryLevel }}%</span>
            <el-progress
              :percentage="dashboardData.batteryLevel"
              :color="getBatteryColor(dashboardData.batteryLevel)"
              :show-text="false"
              class="battery-progress"
            />
          </div>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon distance">
          <el-icon><Odometer /></el-icon>
        </div>
        <div class="card-content">
          <h3>今日行程</h3>
          <div class="distance-info">
            <span class="distance-value">{{ dashboardData.todayDistance.toFixed(1) }}</span>
            <span class="distance-unit">公里</span>
          </div>
          <div class="duration-info">
            <span class="duration-text">用时: {{ Math.floor(dashboardData.todayDuration / 60) }}小时{{ dashboardData.todayDuration % 60 }}分钟</span>
          </div>
        </div>
      </div>
      
      <div class="overview-card">
        <div class="card-icon alert">
          <el-icon><Bell /></el-icon>
        </div>
        <div class="card-content">
          <h3>告警信息</h3>
          <div class="alert-info">
            <span class="alert-count">{{ dashboardData.alertCount }}</span>
            <span class="alert-text">条新告警</span>
          </div>
          <div class="alert-status">
            <span v-if="dashboardData.alertCount === 0" class="status-normal">系统运行正常</span>
            <span v-else class="status-warning">需要关注</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速访问 -->
    <div class="quick-access">
      <h2 class="section-title">快速访问</h2>
      <div class="quick-grid">
        <div class="quick-item" @click="$router.push('/grip-strength')">
          <el-icon class="quick-icon"><Connection /></el-icon>
          <span class="quick-text">握力监测</span>
        </div>
        <div class="quick-item" @click="$router.push('/posture-angle')">
          <el-icon class="quick-icon"><Compass /></el-icon>
          <span class="quick-text">姿态监测</span>
        </div>
        <div class="quick-item" @click="$router.push('/speed')">
          <el-icon class="quick-icon"><Stopwatch /></el-icon>
          <span class="quick-text">速度监测</span>
        </div>
        <div class="quick-item" @click="$router.push('/gps')">
          <el-icon class="quick-icon"><Location /></el-icon>
          <span class="quick-text">位置追踪</span>
        </div>
      </div>
    </div>
    
    <!-- 最近更新 -->
    <div class="recent-update">
      <h2 class="section-title">系统信息</h2>
      <div class="update-card">
        <div class="update-item">
          <span class="update-label">最后更新:</span>
          <span class="update-time">{{ formatTime(dashboardData.lastUpdate) }}</span>
        </div>
        <div class="update-item">
          <span class="update-label">系统版本:</span>
          <span class="update-version">v1.0.0</span>
        </div>
        <div class="update-item">
          <span class="update-label">连接状态:</span>
          <span class="update-status" :class="dashboardData.deviceStatus">
            {{ getStatusText(dashboardData.deviceStatus) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Monitor,
  Lightning,
  Odometer,
  Bell,
  Connection,
  Compass,
  Stopwatch,
  Location
} from '@element-plus/icons-vue'
import { getDashboardData } from '@/api/monitoring'

// 仪表盘数据
const dashboardData = ref({
  deviceStatus: 'online',
  batteryLevel: 85,
  todayDistance: 2.3,
  todayDuration: 75,
  alertCount: 0,
  lastUpdate: Date.now()
})

// 定时器
let updateTimer = null

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    online: '在线',
    offline: '离线',
    warning: '异常'
  }
  return statusMap[status] || '未知'
}

// 获取电池颜色
const getBatteryColor = (level) => {
  if (level > 60) return '#67c23a'
  if (level > 30) return '#e6a23c'
  return '#f56c6c'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    const data = await getDashboardData()
    dashboardData.value = data
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

// 组件挂载时
onMounted(() => {
  loadDashboardData()
  
  // 每30秒更新一次数据
  updateTimer = setInterval(() => {
    loadDashboardData()
  }, 30000)
})

// 组件卸载时
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* 概览卡片网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.card-icon.device {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.battery {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.distance {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.alert {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-content h3 {
  font-size: 16px;
  color: #303133;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
}

.status-indicator.offline {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
}

.status-indicator.warning {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
}

.status-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.battery-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battery-level {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.battery-progress {
  width: 120px;
}

.distance-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.distance-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.distance-unit {
  font-size: 14px;
  color: #909399;
}

.duration-info {
  font-size: 12px;
  color: #909399;
}

.alert-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.alert-count {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.alert-text {
  font-size: 14px;
  color: #606266;
}

.alert-status {
  font-size: 12px;
}

.status-normal {
  color: #67c23a;
}

.status-warning {
  color: #e6a23c;
}

/* 快速访问 */
.quick-access {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.quick-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 8px;
}

.quick-text {
  display: block;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 最近更新 */
.recent-update {
  margin-bottom: 30px;
}

.update-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.update-item:last-child {
  border-bottom: none;
}

.update-label {
  font-size: 14px;
  color: #909399;
}

.update-time,
.update-version {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.update-status {
  font-size: 14px;
  font-weight: 500;
}

.update-status.online {
  color: #67c23a;
}

.update-status.offline {
  color: #f56c6c;
}

.update-status.warning {
  color: #e6a23c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-card {
    padding: 16px;
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>