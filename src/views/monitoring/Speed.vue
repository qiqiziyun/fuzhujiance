<template>
  <div class="speed-monitoring">
    <!-- 速度概览 -->
    <div class="speed-overview">
      <div class="speed-card current">
        <div class="card-header">
          <h3>当前速度</h3>
          <div class="speed-status" :class="getSpeedStatus(currentSpeed)"></div>
        </div>
        <div class="speed-display">
          <div class="speed-value">{{ currentSpeed.toFixed(1) }}</div>
          <div class="speed-unit">km/h</div>
        </div>
        <div class="speed-info">
          <span class="speed-desc">{{ getSpeedDescription(currentSpeed) }}</span>
        </div>
      </div>
      
      <div class="speed-card stats">
        <div class="card-header">
          <h3>速度统计</h3>
          <div class="update-time">{{ formatTime(lastUpdate) }}</div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ maxSpeed.toFixed(1) }}</div>
            <div class="stat-label">最高速度</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ avgSpeed.toFixed(1) }}</div>
            <div class="stat-label">平均速度</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalDistance.toFixed(2) }}</div>
            <div class="stat-label">总距离(km)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatDuration(totalTime) }}</div>
            <div class="stat-label">运动时长</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 速度图表 -->
    <div class="speed-chart-section">
      <div class="chart-header">
        <h2>速度变化趋势</h2>
        <div class="chart-controls">
          <el-radio-group v-model="chartTimeRange" @change="loadSpeedData">
            <el-radio-button label="1h">1小时</el-radio-button>
            <el-radio-button label="6h">6小时</el-radio-button>
            <el-radio-button label="24h">24小时</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="chart-container">
        <!-- 这里可以集成图表库，如ECharts -->
        <div class="chart-placeholder">
          <el-icon class="chart-icon"><TrendCharts /></el-icon>
          <h3>速度趋势图表</h3>
          <p>显示{{ chartTimeRange }}内的速度变化</p>
          <div class="chart-data">
            <div v-for="(point, index) in speedHistory.slice(-10)" :key="index" class="data-point">
              <div class="point-time">{{ formatTime(point.timestamp) }}</div>
              <div class="point-speed">{{ point.speed.toFixed(1) }} km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 速度历史记录 -->
    <div class="speed-history-section">
      <div class="history-header">
        <h2>速度记录</h2>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
      <div class="history-table">
        <el-table :data="speedHistory" style="width: 100%">
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="speed" label="速度 (km/h)" width="120">
            <template #default="scope">
              <span :class="getSpeedClass(scope.row.speed)">{{ scope.row.speed.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="acceleration" label="加速度 (m/s²)" width="140">
            <template #default="scope">
              {{ scope.row.acceleration ? scope.row.acceleration.toFixed(2) : '--' }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.location || '未知位置' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getSpeedTagType(scope.row.speed)">{{ getSpeedDescription(scope.row.speed) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Refresh } from '@element-plus/icons-vue'
import { getSpeedData } from '@/api/monitoring'

// 当前速度
const currentSpeed = ref(2.3)

// 速度统计
const maxSpeed = ref(8.5)
const avgSpeed = ref(3.2)
const totalDistance = ref(12.6)
const totalTime = ref(14400) // 秒
const lastUpdate = ref(Date.now())

// 图表时间范围
const chartTimeRange = ref('1h')

// 速度历史数据
const speedHistory = ref([
  {
    id: 1,
    timestamp: Date.now() - 300000,
    speed: 2.3,
    acceleration: 0.1,
    location: '北京市朝阳区'
  },
  {
    id: 2,
    timestamp: Date.now() - 600000,
    speed: 1.8,
    acceleration: -0.2,
    location: '北京市朝阳区'
  },
  {
    id: 3,
    timestamp: Date.now() - 900000,
    speed: 3.1,
    acceleration: 0.3,
    location: '北京市朝阳区'
  }
])

// 定时器
let updateTimer = null

// 获取速度状态
const getSpeedStatus = (speed) => {
  if (speed < 1) return 'slow'
  if (speed < 3) return 'normal'
  if (speed < 6) return 'fast'
  return 'very-fast'
}

// 获取速度描述
const getSpeedDescription = (speed) => {
  if (speed < 1) return '缓慢'
  if (speed < 3) return '正常'
  if (speed < 6) return '较快'
  return '很快'
}

// 获取速度样式类
const getSpeedClass = (speed) => {
  if (speed < 1) return 'speed-slow'
  if (speed < 3) return 'speed-normal'
  if (speed < 6) return 'speed-fast'
  return 'speed-very-fast'
}

// 获取速度标签类型
const getSpeedTagType = (speed) => {
  if (speed < 1) return 'info'
  if (speed < 3) return 'success'
  if (speed < 6) return 'warning'
  return 'danger'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期时间
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 格式化持续时间
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// 加载速度数据
const loadSpeedData = async () => {
  try {
    const data = await getSpeedData()
    if (data) {
      currentSpeed.value = data.current || 0
      maxSpeed.value = data.max || 0
      avgSpeed.value = data.average || 0
      totalDistance.value = data.distance || 0
      totalTime.value = data.duration || 0
      if (data.history) {
        speedHistory.value = data.history
      }
      lastUpdate.value = Date.now()
    }
  } catch (error) {
    console.error('加载速度数据失败:', error)
  }
}

// 刷新数据
const refreshData = () => {
  loadSpeedData()
  ElMessage.success('数据已刷新')
}

// 组件挂载时
onMounted(() => {
  loadSpeedData()
  
  // 每5秒更新一次数据
  updateTimer = setInterval(() => {
    loadSpeedData()
  }, 5000)
})

// 组件卸载时
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style scoped>
/* 速度监测样式 */
.speed-monitoring {
  max-width: 1200px;
  margin: 0 auto;
}

.speed-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.speed-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.speed-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.speed-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #67c23a;
}

.speed-status.slow { background: #909399; }
.speed-status.normal { background: #67c23a; }
.speed-status.fast { background: #e6a23c; }
.speed-status.very-fast { background: #f56c6c; }

.speed-display {
  text-align: center;
  margin: 20px 0;
}

.speed-value {
  font-size: 48px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.speed-unit {
  font-size: 16px;
  color: #909399;
  margin-top: 8px;
}

.speed-info {
  text-align: center;
}

.speed-desc {
  font-size: 14px;
  color: #606266;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.update-time {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 图表区域 */
.speed-chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.chart-data {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.data-point {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  min-width: 80px;
}

.point-time {
  font-size: 12px;
  color: #909399;
}

.point-speed {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-top: 4px;
}

/* 历史记录区域 */
.speed-history-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

/* 速度值样式 */
.speed-slow { color: #909399; }
.speed-normal { color: #67c23a; }
.speed-fast { color: #e6a23c; }
.speed-very-fast { color: #f56c6c; }

/* 响应式设计 */
@media (max-width: 768px) {
  .speed-overview {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .chart-data {
    flex-direction: column;
    align-items: center;
  }
}
</style>