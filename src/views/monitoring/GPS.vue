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
            <span class="coord-value">
              {{ currentLocation.latitude ? currentLocation.latitude.toFixed(6) + '°' : '无数据' }}
            </span>
          </div>
          <div class="coordinate-item">
            <span class="coord-label">经度:</span>
            <span class="coord-value">
              {{ currentLocation.longitude ? currentLocation.longitude.toFixed(6) + '°' : '无数据' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 百度地图显示 -->
    <div class="map-section">
      <div class="map-header">
        <h2>实时位置地图</h2>
        <div class="map-controls">
          <el-button size="small" @click="refreshLocation" :icon="Refresh">刷新位置</el-button>
          <el-button size="small" @click="centerToCurrentLocation" :icon="Aim">定位</el-button>
        </div>
      </div>
      
      <!-- 百度地图容器 -->
      <div class="map-container">
        <div id="baiduMap" class="baidu-map"></div>
        
        <!-- 位置信息覆盖层 -->
        <div class="map-info-overlay" v-if="currentLocation.latitude">
          <div class="location-info">
            <div class="location-name">{{ locationName }}</div>
            <div class="location-coords">
              {{ currentLocation.latitude.toFixed(4) }}, {{ currentLocation.longitude.toFixed(4) }}
            </div>
            <div class="location-time">更新时间: {{ formatTime(currentLocation.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 无数据提示 -->
        <div class="no-data-overlay" v-else>
          <div class="no-data-content">
            <el-icon class="no-data-icon"><LocationInformation /></el-icon>
            <div class="no-data-text">{{ locationName }}</div>
            <div class="no-data-desc">等待GPS数据...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Location,
  Aim,
  Refresh,
  LocationInformation
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getGPSData } from '@/api/monitoring'

// 当前位置
const currentLocation = ref({
  latitude: null,
  longitude: null,
  altitude: 0,
  accuracy: 0,
  speed: 0,
  bearing: 0,
  timestamp: Date.now()
})

// 位置名称
const locationName = ref('等待GPS数据...')

// 百度地图相关
let baiduMap = null
let currentMarker = null
let updateTimer = null

// 初始化百度地图
const initBaiduMap = () => {
  if (typeof BMap === 'undefined') {
    ElMessage.error('百度地图API未加载，请检查网络连接')
    return
  }

  try {
    // 创建地图实例
    baiduMap = new BMap.Map('baiduMap')
    
    // 设置默认中心点（如果没有GPS数据）
    const defaultPoint = new BMap.Point(120.1551, 30.2741) // 杭州
    baiduMap.centerAndZoom(defaultPoint, 15)
    
    // 启用滚轮缩放
    baiduMap.enableScrollWheelZoom(true)
    
    // 添加控件
    baiduMap.addControl(new BMap.NavigationControl())
    baiduMap.addControl(new BMap.ScaleControl())
    baiduMap.addControl(new BMap.OverviewMapControl())
    baiduMap.addControl(new BMap.MapTypeControl())
    
    console.log('百度地图初始化成功')
  } catch (error) {
    console.error('百度地图初始化失败:', error)
    ElMessage.error('地图初始化失败')
  }
}

// 更新地图位置
const updateMapLocation = (lat, lng) => {
  if (!baiduMap || !lat || !lng) {
    return
  }

  try {
    const point = new BMap.Point(lng, lat)
    
    // 移除旧标记
    if (currentMarker) {
      baiduMap.removeOverlay(currentMarker)
    }
    
    // 创建新标记
    currentMarker = new BMap.Marker(point)
    baiduMap.addOverlay(currentMarker)
    
    // 创建信息窗口
    const infoWindow = new BMap.InfoWindow(`
      <div style="padding: 10px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #333;">${locationName.value}</h4>
        <p style="margin: 4px 0; color: #666;">纬度: ${lat.toFixed(6)}°</p>
        <p style="margin: 4px 0; color: #666;">经度: ${lng.toFixed(6)}°</p>
        <p style="margin: 4px 0; color: #666;">精度: ±${currentLocation.value.accuracy}m</p>
        <p style="margin: 4px 0; color: #666;">速度: ${currentLocation.value.speed.toFixed(1)} m/s</p>
        <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">更新时间: ${formatTime(currentLocation.value.timestamp)}</p>
      </div>
    `)
    
    // 标记点击事件
    currentMarker.addEventListener('click', () => {
      baiduMap.openInfoWindow(infoWindow, point)
    })
    
    // 移动地图中心到当前位置
    baiduMap.panTo(point)
    
    console.log('地图位置更新成功:', lat, lng)
  } catch (error) {
    console.error('更新地图位置失败:', error)
  }
}

// 获取位置名称（百度地图逆地理编码）
const getLocationName = async (lat, lng) => {
  if (!lat || !lng || typeof BMap === 'undefined') {
    return
  }

  try {
    const point = new BMap.Point(lng, lat)
    const geocoder = new BMap.Geocoder()
    
    geocoder.getLocation(point, (result) => {
      if (result) {
        locationName.value = result.address || `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        console.log('获取位置名称成功:', result.address)
      } else {
        locationName.value = `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      }
    })
  } catch (error) {
    console.error('获取位置名称失败:', error)
    locationName.value = `位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  }
}

// 加载GPS数据
const loadGPSData = async () => {
  try {
    const data = await getGPSData()
    console.log('从后端获取的GPS数据:', data)
    
    if (data && data.current && data.current.latitude && data.current.longitude) {
      const newLat = data.current.latitude
      const newLng = data.current.longitude
      
      currentLocation.value = {
        latitude: newLat,
        longitude: newLng,
        altitude: data.current.altitude || 0,
        accuracy: data.current.accuracy || 0,
        speed: data.current.speed || 0,
        bearing: data.current.bearing || 0,
        timestamp: data.current.timestamp || Date.now()
      }
      
      // 更新地图位置
      updateMapLocation(newLat, newLng)
      
      // 获取位置名称
      await getLocationName(newLat, newLng)
    } else {
      console.log('后端GPS数据为空')
      locationName.value = '车辆静止 - 无GPS信号'
      
      currentLocation.value = {
        latitude: null,
        longitude: null,
        altitude: 0,
        accuracy: 0,
        speed: 0,
        bearing: 0,
        timestamp: Date.now()
      }
    }
    
    if (data && data.distance) {
      todayDistance.value = data.distance
    }
  } catch (error) {
    console.error('加载GPS数据失败:', error)
    locationName.value = '网络连接失败'
    ElMessage.error('获取GPS数据失败，请检查网络连接')
  }
}

// 居中到当前位置
const centerToCurrentLocation = () => {
  if (currentLocation.value.latitude && currentLocation.value.longitude) {
    updateMapLocation(currentLocation.value.latitude, currentLocation.value.longitude)
  } else {
    loadGPSData()
  }
}

// 刷新位置
const refreshLocation = () => {
  loadGPSData()
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 监听位置变化
watch(
  () => [currentLocation.value.latitude, currentLocation.value.longitude],
  ([newLat, newLng]) => {
    if (newLat && newLng && baiduMap) {
      updateMapLocation(newLat, newLng)
    }
  }
)

// 组件挂载
onMounted(async () => {
  // 等待DOM渲染完成
  await nextTick()
  
  // 初始化百度地图
  initBaiduMap()
  
  // 加载GPS数据
  loadGPSData()
  
  // 每30秒更新一次数据
  updateTimer = setInterval(() => {
    loadGPSData()
  }, 30000)
})

// 组件卸载
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
  
  // 清理地图资源
  if (baiduMap) {
    baiduMap = null
  }
})
</script>

<style scoped>
/* GPS概览样式 */
.gps-monitoring {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

.accuracy {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.coordinate-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coordinate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.coordinate-item:last-child {
  border-bottom: none;
}

.coord-label {
  font-size: 14px;
  color: #909399;
}

.coord-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 地图样式 */
.map-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  gap: 12px;
}

.map-container {
  position: relative;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.baidu-map {
  width: 100%;
  height: 100%;
}

.map-info-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 300px;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.location-coords {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.location-time {
  font-size: 12px;
  color: #909399;
}

.no-data-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(5px);
}

.no-data-content {
  text-align: center;
  padding: 40px;
}

.no-data-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.no-data-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.no-data-desc {
  font-size: 14px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gps-overview {
    grid-template-columns: 1fr;
  }
  
  .map-container {
    height: 400px;
  }
  
  .map-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .map-controls {
    justify-content: center;
  }
}
</style>