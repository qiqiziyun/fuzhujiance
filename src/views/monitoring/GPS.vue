<template>
  <div class="gps-monitoring">
    <!-- GPS状态概览 -->
    <div class="gps-overview">
      <div class="gps-card coordinates">
        <div class="card-header">
          <h3>坐标详情</h3>
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
        <div class="map-controls">
          <el-button size="small" @click="refreshLocation" :icon="Refresh">刷新位置</el-button>
          <el-button size="small" @click="centerToCurrentLocation" :icon="Aim">定位</el-button>
        </div>
      </div>
      
      <div class="map-container" ref="mapContainer">
        <!-- 地图显示区域 -->
        <div class="map-display">
          <!-- 地图背景 -->
          <div class="map-background">
            <!-- 道路网格 -->
            <div class="road-network">
              <div class="road horizontal road-1"></div>
              <div class="road horizontal road-2"></div>
              <div class="road vertical road-3"></div>
              <div class="road vertical road-4"></div>
            </div>
            
            <!-- 区域块 -->
            <div class="area-block area-1"></div>
            <div class="area-block area-2"></div>
            <div class="area-block area-3"></div>
            <div class="area-block area-4"></div>
            
            <!-- 位置标记 -->
            <div class="location-marker">
              <div class="marker-pin">
                <el-icon class="marker-icon"><Location /></el-icon>
              </div>
              <div class="marker-label">
                 <div class="label-text">{{ locationName }}</div>
               </div>
            </div>
            
            <!-- 坐标信息 -->
            <div class="map-coordinates">
              <div class="coord-display">
                {{ currentLocation.latitude ? currentLocation.latitude.toFixed(4) : '0.0000' }}, 
                {{ currentLocation.longitude ? currentLocation.longitude.toFixed(4) : '0.0000' }}
              </div>
              <div class="accuracy-display">精度: ±{{ currentLocation.accuracy }}m</div>
            </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
  latitude: 30.2741,
  longitude: 120.1551,
  altitude: 43.5,
  accuracy: 3.2,
  speed: 2.1,
  bearing: 45,
  timestamp: Date.now()
})

// 今日距离
const todayDistance = ref(2.1)



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
    latitude: 30.2741,
    longitude: 120.1551,
    speed: 2.1
  },
  {
    id: 2,
    timestamp: Date.now() - 7200000,
    latitude: 30.2711,
    longitude: 120.1521,
    speed: 1.8
  }
])

// 定时器
let updateTimer = null
let watchId = null

// 位置名称状态
const locationName = ref('获取位置中...')

// 高德地图逆地理编码API
const getLocationName = async (lat, lng) => {
  try {
    // 注意：需要替换YOUR_AMAP_KEY为真实的高德地图API密钥
    // 申请地址：https://console.amap.com/dev/key/app
    const AMAP_KEY = 'YOUR_AMAP_KEY'; // 请替换为真实的API密钥
    
    if (AMAP_KEY === 'YOUR_AMAP_KEY') {
      // 临时演示：根据坐标范围判断位置
      if (lat >= 30.270 && lat <= 30.320 && lng >= 120.140 && lng <= 120.360) {
         locationName.value = '浙江理工大学（下沙校区）';
      } else if (lat >= 30.200 && lat <= 30.400 && lng >= 120.000 && lng <= 120.300) {
        locationName.value = '杭州市';
      } else {
        locationName.value = `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
      return;
    }
    
    const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?output=json&location=${lng},${lat}&key=${AMAP_KEY}&radius=1000&extensions=all`)
    const data = await response.json()
    
    if (data.status === '1' && data.regeocode) {
      const address = data.regeocode.formatted_address
      const poi = data.regeocode.pois && data.regeocode.pois[0]
      
      if (poi && poi.name) {
        locationName.value = poi.name
      } else {
        locationName.value = address || '未知位置'
      }
    } else {
      locationName.value = '未知位置'
    }
  } catch (error) {
    console.error('获取位置名称失败:', error)
    locationName.value = '位置解析失败'
  }
}

// 获取浏览器地理位置
const getCurrentPosition = () => {
  if (!navigator.geolocation) {
    ElMessage.error('浏览器不支持地理位置获取')
    return
  }
  
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateLocationFromPosition(position)
      ElMessage.success('位置更新成功')
    },
    (error) => {
      console.error('获取位置失败:', error)
      ElMessage.warning('无法获取当前位置，使用默认位置')
    },
    options
  )
}

// 开始监听位置变化
const startWatchingPosition = () => {
  if (!navigator.geolocation) {
    return
  }
  
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  }
  
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      updateLocationFromPosition(position)
    },
    (error) => {
      console.error('位置监听失败:', error)
    },
    options
  )
}

// 停止监听位置变化
const stopWatchingPosition = () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
}

// 从位置对象更新当前位置
const updateLocationFromPosition = async (position) => {
  currentLocation.value = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude || 0,
    accuracy: position.coords.accuracy || 0,
    speed: position.coords.speed || 0,
    bearing: position.coords.heading || 0,
    timestamp: position.timestamp
  }
  
  // 获取位置名称
  await getLocationName(position.coords.latitude, position.coords.longitude)
}

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



// 居中到当前位置
const centerToCurrentLocation = () => {
  getCurrentPosition()
}

// 刷新位置
const refreshLocation = () => {
  getCurrentPosition()
  loadGPSData()
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
  // 获取当前位置
  getCurrentPosition()
  
  // 开始监听位置变化
  startWatchingPosition()
  
  // 加载GPS数据
  loadGPSData()
  
  // 每30秒更新一次数据
  updateTimer = setInterval(() => {
    loadGPSData()
  }, 30000)
})

// 组件卸载时
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
  
  // 停止位置监听
  stopWatchingPosition()
})
</script>

<style scoped>
/* GPS概览 */
.gps-monitoring {
  max-width: 1200px;
  margin: 0 auto;
}



.gps-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.gps-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.gps-card:hover {
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

.map-display {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-background {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 50%, #e0f0e0 100%);
  position: relative;
  overflow: hidden;
}

/* 道路网格 */
.road-network {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.road {
  position: absolute;
  background: #ffffff;
  border: 1px solid #d0d0d0;
}

.road.horizontal {
  width: 100%;
  height: 8px;
}

.road.vertical {
  width: 8px;
  height: 100%;
}

.road-1 {
  top: 30%;
  left: 0;
}

.road-2 {
  top: 70%;
  left: 0;
}

.road-3 {
  top: 0;
  left: 25%;
}

.road-4 {
  top: 0;
  left: 75%;
}

/* 区域块 */
.area-block {
  position: absolute;
  background: rgba(180, 220, 180, 0.3);
  border: 2px dashed rgba(100, 150, 100, 0.5);
  border-radius: 4px;
}

.area-1 {
  top: 10%;
  left: 10%;
  width: 30%;
  height: 15%;
}

.area-2 {
  top: 10%;
  right: 10%;
  width: 25%;
  height: 20%;
}

.area-3 {
  bottom: 20%;
  left: 15%;
  width: 35%;
  height: 25%;
}

.area-4 {
  bottom: 10%;
  right: 15%;
  width: 20%;
  height: 15%;
}

/* 位置标记 */
.location-marker {
  position: absolute;
  top: 45%;
  left: 45%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.marker-pin {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  animation: pulse 2s infinite;
}

.marker-icon {
  color: white;
  font-size: 20px;
  transform: rotate(45deg);
}

.marker-label {
  position: absolute;
  top: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  border: 1px solid #e0e0e0;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.label-subtext {
  font-size: 12px;
  color: #909399;
}

/* 坐标信息 */
.map-coordinates {
  position: absolute;
  bottom: 15px;
  left: 15px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.coord-display {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.accuracy-display {
  font-size: 12px;
  color: #909399;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(64, 158, 255, 0.6), 0 0 0 10px rgba(64, 158, 255, 0.1);
  }
  100% {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
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