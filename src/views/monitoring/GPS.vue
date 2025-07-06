<template>
  <div class="gps-monitoring">
    <!-- GPS状态概览 -->
    <div class="gps-overview">
      <div class="gps-card coordinates clickable" @click="showLocationDetail">
        <div class="card-header">
          <h3>当前坐标</h3>
          <span class="accuracy">精度: ±{{ currentLocation.accuracy }}m</span>
        </div>
        <div class="coordinate-info">
          <div class="coordinate-item">
            <span class="coord-label">纬度:</span>
            <span class="coord-value">{{ currentLocation.latitude ? currentLocation.latitude.toFixed(6) : '0.000000' }}°</span>
          </div>
          <div class="coordinate-item">
            <span class="coord-label">经度:</span>
            <span class="coord-value">{{ currentLocation.longitude ? currentLocation.longitude.toFixed(6) : '0.000000' }}°</span>
          </div>
          <div class="coordinate-item">
            <span class="coord-label">海拔:</span>
            <span class="coord-value">{{ currentLocation.altitude ? currentLocation.altitude.toFixed(1) : '0.0' }}m</span>
          </div>
        </div>
        <div class="click-hint">
          <el-icon><Location /></el-icon>
          <span>点击查看详细位置</span>
        </div>
      </div>
      
      <div class="gps-card movement">
        <div class="card-header">
          <h3>移动信息</h3>
          <span class="update-time">{{ formatTime(currentLocation.timestamp) }}</span>
        </div>
        <div class="movement-info">
          <div class="movement-item">
            <span class="movement-label">当前速度:</span>
            <span class="movement-value">{{ (currentLocation.speed || 0).toFixed(1) }} km/h</span>
          </div>
          <div class="movement-item">
            <span class="movement-label">移动方向:</span>
            <span class="movement-value">{{ getDirection(currentLocation.bearing) }}</span>
          </div>
          <div class="movement-item">
            <span class="movement-label">今日距离:</span>
            <span class="movement-value">{{ (todayDistance || 0).toFixed(2) }} km</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 地图显示 -->
    <div class="map-section">
      <div class="map-header">
        <h2>位置地图</h2>
      </div>
      
      <div class="map-container" ref="mapContainer">
        <!-- 这里应该集成地图组件，如高德地图、百度地图等 -->
        <div class="map-placeholder">
          <div class="map-info">
            <el-icon><Location /></el-icon>
            <h3>地图显示区域</h3>
            <p>当前位置: {{ currentLocation.latitude ? currentLocation.latitude.toFixed(4) : '0.0000' }}, {{ currentLocation.longitude ? currentLocation.longitude.toFixed(4) : '0.0000' }}</p>
            <p>显示模式: {{ getMapModeText(mapMode) }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 历史轨迹 -->
    <div class="history-section" v-if="mapMode === 'track'">
      <div class="history-header">
        <h2>历史轨迹</h2>
        <div class="time-filter">
          <el-date-picker
            v-model="trackDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="small"
            @change="loadTrackHistory"
          />
        </div>
      </div>
      
      <div class="history-content">
        <div class="history-stats">
          <div class="stat-item">
            <div class="stat-value">{{ trackStats.totalDistance }}</div>
            <div class="stat-label">总距离 (km)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ trackStats.totalTime }}</div>
            <div class="stat-label">总时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ trackStats.avgSpeed }}</div>
            <div class="stat-label">平均速度 (km/h)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ trackStats.maxSpeed }}</div>
            <div class="stat-label">最高速度 (km/h)</div>
          </div>
        </div>
        
        <div class="history-timeline">
          <h3>轨迹时间线</h3>
          <div class="timeline-container">
            <div v-for="point in trackHistory" :key="point.id" class="timeline-item">
              <div class="timeline-time">{{ formatTime(point.timestamp) }}</div>
              <div class="timeline-location">
                <div class="location-coords">{{ point.latitude.toFixed(4) }}, {{ point.longitude.toFixed(4) }}</div>
                <div class="location-speed">速度: {{ point.speed }} km/h</div>
              </div>
              <div class="timeline-marker"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Location,
  Aim,
  Refresh
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getGPSData } from '@/api/monitoring'

// GPS状态
const gpsStatus = ref({
  signal: 'good',
  signalBars: 4,
  satelliteCount: 12
})

// 当前位置
const currentLocation = ref({
  latitude: 39.9042,
  longitude: 116.4074,
  altitude: 43.5,
  accuracy: 3.2,
  speed: 2.1,
  bearing: 45,
  timestamp: Date.now()
})

// 今日距离
const todayDistance = ref(8.6)

// 地图模式
const mapMode = ref('current')

// 地图容器引用
const mapContainer = ref(null)

// 轨迹相关数据
const trackDateRange = ref(null)
const trackStats = ref({
  totalDistance: '8.6',
  totalTime: '4h 5m',
  avgSpeed: '2.1',
  maxSpeed: '5.8'
})

const trackHistory = ref([
  {
    id: 1,
    timestamp: Date.now() - 3600000,
    latitude: 39.9042,
    longitude: 116.4074,
    speed: 2.1
  },
  {
    id: 2,
    timestamp: Date.now() - 7200000,
    latitude: 39.9012,
    longitude: 116.4044,
    speed: 1.8
  }
])

// 定时器
let updateTimer = null

// 获取信号强度文本
const getSignalText = (bars) => {
  const signalMap = {
    1: '很弱',
    2: '较弱',
    3: '一般',
    4: '良好',
    5: '优秀'
  }
  return signalMap[bars] || '无信号'
}

// 获取方向文本
const getDirection = (bearing) => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 获取地图模式文本
const getMapModeText = (mode) => {
  const modeMap = {
    current: '当前位置',
    area: '区域分析'
  }
  return modeMap[mode] || '未知模式'
}

// 显示位置详情
const showLocationDetail = () => {
  ElMessage.info('位置详情功能')
}

// 居中到当前位置
const centerToCurrentLocation = () => {
  ElMessage.success('已定位到当前位置')
}

// 刷新位置
const refreshLocation = () => {
  loadGPSData()
  ElMessage.success('位置信息已刷新')
}

// 加载轨迹历史
const loadTrackHistory = () => {
  console.log('加载轨迹历史:', trackDateRange.value)
}

// 加载GPS数据
const loadGPSData = async () => {
  try {
    const data = await getGPSData()
    if (data && data.current) {
      currentLocation.value = data.current
    }
    if (data && data.status) {
      gpsStatus.value = data.status
    }
    if (data && data.distance) {
      todayDistance.value = data.distance
    }
  } catch (error) {
    console.error('加载GPS数据失败:', error)
  }
}

// 组件挂载时
onMounted(() => {
  loadGPSData()
  
  // 每10秒更新一次数据
  updateTimer = setInterval(() => {
    loadGPSData()
  }, 10000)
})

// 组件卸载时
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>

<style scoped>
/* GPS概览 */
.gps-monitoring {
  max-width: 1200px;
  margin: 0 auto;
}





.gps-card:hover {
  transform: translateY(-2px);
}

.gps-card.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.gps-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


.card-header h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.accuracy,
.update-time {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.gps-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.gps-status.excellent {
  background: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
}

.gps-status.good {
  background: #409eff;
  box-shadow: 0 0 6px rgba(64, 158, 255, 0.5);
}

.gps-status.fair {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
}

.gps-status.poor {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signal-strength {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signal-label {
  font-size: 14px;
  color: #606266;
  min-width: 70px;
}

.signal-bars {
  display: flex;
  align-items: end;
  gap: 2px;
}

.signal-bar {
  width: 4px;
  background: #e4e7ed;
  border-radius: 2px;
}

.signal-bar:nth-child(1) { height: 8px; }
.signal-bar:nth-child(2) { height: 12px; }
.signal-bar:nth-child(3) { height: 16px; }
.signal-bar:nth-child(4) { height: 20px; }
.signal-bar:nth-child(5) { height: 24px; }

.signal-bar.active {
  background: #67c23a;
}

.signal-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.satellite-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.satellite-label {
  font-size: 14px;
  color: #606266;
}

.satellite-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.coordinate-info,
.movement-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coordinate-item,
.movement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.coordinate-item:last-child,
.movement-item:last-child {
  border-bottom: none;
}

.coord-label,
.movement-label {
  font-size: 14px;
  color: #909399;
}

.coord-value,
.movement-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.click-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  color: #409eff;
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.gps-card.clickable:hover .click-hint {
  opacity: 1;
}

/* 地图显示 */
.map-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.map-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.map-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-tools {
  display: flex;
  gap: 8px;
}

.map-container {
  height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-info {
  text-align: center;
  color: #606266;
}

.map-info h3 {
  margin: 8px 0;
  color: #303133;
}

.map-info p {
  margin: 4px 0;
  font-size: 14px;
}

/* 历史轨迹 */
.history-section {
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

.history-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.history-timeline h3 {
  font-size: 16px;
  color: #303133;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  position: relative;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
}

.timeline-location {
  flex: 1;
}

.location-coords {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.location-speed {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.timeline-marker {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  position: absolute;
  right: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gps-overview {
    grid-template-columns: 1fr;
  }
  
  .map-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .history-content {
    grid-template-columns: 1fr;
  }
  
  .history-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .map-container {
    height: 300px;
  }
  
  .map-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .timeline-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>