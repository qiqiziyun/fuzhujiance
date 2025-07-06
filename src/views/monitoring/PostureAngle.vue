<template>
  <div class="posture-angle">
    <!-- 实时姿态数据 -->
    <div class="posture-overview">
      <div class="posture-card pitch">
        <div class="card-header">
          <h3>俯仰角 (Pitch)</h3>
          <div class="angle-status" :class="getAngleStatus(currentAngles.pitch)"></div>
        </div>
        <div class="angle-display">
          <div class="angle-circle">
            <div class="angle-indicator" :style="{ transform: `rotate(${currentAngles.pitch}deg)` }"></div>
            <div class="angle-value">{{ currentAngles.pitch.toFixed(1) }}°</div>
          </div>
        </div>
        <div class="angle-info">
          <span class="angle-desc">{{ getAngleDescription('pitch', currentAngles.pitch) }}</span>
        </div>
      </div>
      
      <div class="posture-card roll">
        <div class="card-header">
          <h3>翻滚角 (Roll)</h3>
          <div class="angle-status" :class="getAngleStatus(currentAngles.roll)"></div>
        </div>
        <div class="angle-display">
          <div class="angle-circle">
            <div class="angle-indicator" :style="{ transform: `rotate(${currentAngles.roll}deg)` }"></div>
            <div class="angle-value">{{ currentAngles.roll.toFixed(1) }}°</div>
          </div>
        </div>
        <div class="angle-info">
          <span class="angle-desc">{{ getAngleDescription('roll', currentAngles.roll) }}</span>
        </div>
      </div>
      
      <div class="posture-card yaw">
        <div class="card-header">
          <h3>偏航角 (Yaw)</h3>
          <div class="angle-status" :class="getAngleStatus(currentAngles.yaw)"></div>
        </div>
        <div class="angle-display">
          <div class="angle-circle">
            <div class="angle-indicator" :style="{ transform: `rotate(${currentAngles.yaw}deg)` }"></div>
            <div class="angle-value">{{ currentAngles.yaw.toFixed(1) }}°</div>
          </div>
        </div>
        <div class="angle-info">
          <span class="angle-desc">{{ getAngleDescription('yaw', currentAngles.yaw) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 3D姿态可视化 -->
    <div class="posture-visualization">
      <h2>姿态可视化</h2>
      <div class="visualization-container">
        <div class="device-model">
          <div 
            class="device-3d" 
            :style="{
              transform: `rotateX(${currentAngles.pitch}deg) rotateY(${currentAngles.yaw}deg) rotateZ(${currentAngles.roll}deg)`
            }"
          >
            <div class="device-face front">前</div>
            <div class="device-face back">后</div>
            <div class="device-face left">左</div>
            <div class="device-face right">右</div>
            <div class="device-face top">上</div>
            <div class="device-face bottom">下</div>
          </div>
        </div>
        <div class="visualization-info">
          <div class="info-item">
            <span class="info-label">当前姿态:</span>
            <span class="info-value">{{ getCurrentPosture() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">稳定性:</span>
            <span class="info-value" :class="getStabilityClass()">{{ getStabilityText() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后更新:</span>
            <span class="info-value">{{ formatTime(lastUpdate) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 历史趋势图表 -->
    <div class="trend-charts">
      <h2>姿态角趋势</h2>
      <div class="chart-controls">
        <el-radio-group v-model="timeRange" @change="updateCharts">
          <el-radio-button value="1h">1小时</el-radio-button>
          <el-radio-button value="6h">6小时</el-radio-button>
          <el-radio-button value="24h">24小时</el-radio-button>
        </el-radio-group>
      </div>
      <div class="charts-grid">
        <div class="chart-item">
          <h3>俯仰角变化</h3>
          <div class="chart-container">
            <div class="chart-line">
              <div 
                v-for="(point, index) in pitchData" 
                :key="index" 
                class="chart-point"
                :style="{
                  left: (index / (pitchData.length - 1)) * 100 + '%',
                  bottom: ((point.value + 90) / 180) * 100 + '%'
                }"
                :title="`${formatChartTime(point.time)}: ${point.value.toFixed(1)}°`"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="chart-item">
          <h3>翻滚角变化</h3>
          <div class="chart-container">
            <div class="chart-line">
              <div 
                v-for="(point, index) in rollData" 
                :key="index" 
                class="chart-point"
                :style="{
                  left: (index / (rollData.length - 1)) * 100 + '%',
                  bottom: ((point.value + 90) / 180) * 100 + '%'
                }"
                :title="`${formatChartTime(point.time)}: ${point.value.toFixed(1)}°`"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="chart-item">
          <h3>偏航角变化</h3>
          <div class="chart-container">
            <div class="chart-line">
              <div 
                v-for="(point, index) in yawData" 
                :key="index" 
                class="chart-point"
                :style="{
                  left: (index / (yawData.length - 1)) * 100 + '%',
                  bottom: ((point.value + 180) / 360) * 100 + '%'
                }"
                :title="`${formatChartTime(point.time)}: ${point.value.toFixed(1)}°`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 姿态统计 -->
    <div class="posture-statistics">
      <h2>姿态统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>异常姿态检测</h3>
          <div class="anomaly-list">
            <div v-for="anomaly in anomalies" :key="anomaly.id" class="anomaly-item">
              <div class="anomaly-time">{{ formatTime(anomaly.time) }}</div>
              <div class="anomaly-type" :class="anomaly.severity">{{ anomaly.type }}</div>
              <div class="anomaly-desc">{{ anomaly.description }}</div>
            </div>
            <div v-if="anomalies.length === 0" class="no-anomaly">
              <el-icon><SuccessFilled /></el-icon>
              <span>暂无异常姿态</span>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>姿态分布</h3>
          <div class="distribution-chart">
            <div v-for="dist in postureDistribution" :key="dist.name" class="dist-item">
              <div class="dist-label">{{ dist.name }}</div>
              <div class="dist-bar">
                <div class="dist-fill" :style="{ width: dist.percentage + '%' }"></div>
              </div>
              <div class="dist-value">{{ dist.percentage.toFixed(1) }}%</div>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>今日总结</h3>
          <div class="summary-list">
            <div class="summary-item">
              <span class="summary-label">监测时长:</span>
              <span class="summary-value">{{ Math.floor(todaySummary.duration / 60) }}小时{{ todaySummary.duration % 60 }}分钟</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">异常次数:</span>
              <span class="summary-value">{{ todaySummary.anomalyCount }}次</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均稳定性:</span>
              <span class="summary-value" :class="getStabilityClass(todaySummary.avgStability)">
                {{ getStabilityText(todaySummary.avgStability) }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">建议:</span>
              <span class="summary-value">{{ todaySummary.recommendation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { SuccessFilled } from '@element-plus/icons-vue'
import { getPostureAngleData } from '@/api/monitoring'

// 当前角度数据
const currentAngles = ref({
  pitch: 5.2,
  roll: -2.8,
  yaw: 15.6
})

// 最后更新时间
const lastUpdate = ref(Date.now())

// 时间范围
const timeRange = ref('6h')

// 图表数据
const pitchData = ref([])
const rollData = ref([])
const yawData = ref([])

// 异常记录
const anomalies = ref([
  {
    id: 1,
    time: Date.now() - 1800000,
    type: '倾斜过度',
    severity: 'warning',
    description: '俯仰角超过安全范围'
  }
])

// 姿态分布
const postureDistribution = ref([
  { name: '正常直立', percentage: 78.5 },
  { name: '轻微前倾', percentage: 15.2 },
  { name: '轻微后倾', percentage: 4.8 },
  { name: '左右倾斜', percentage: 1.5 }
])

// 今日总结
const todaySummary = ref({
  duration: 485, // 分钟
  anomalyCount: 3,
  avgStability: 'good',
  recommendation: '保持良好的使用习惯，注意避免长时间倾斜'
})

// 定时器
let updateTimer = null

// 获取角度状态
const getAngleStatus = (angle) => {
  const absAngle = Math.abs(angle)
  if (absAngle <= 5) return 'normal'
  if (absAngle <= 15) return 'warning'
  return 'danger'
}

// 获取角度描述
const getAngleDescription = (type, angle) => {
  const absAngle = Math.abs(angle)
  
  if (type === 'pitch') {
    if (absAngle <= 5) return '姿态正常'
    if (angle > 0) return '向前倾斜'
    return '向后倾斜'
  }
  
  if (type === 'roll') {
    if (absAngle <= 5) return '水平平衡'
    if (angle > 0) return '向右倾斜'
    return '向左倾斜'
  }
  
  if (type === 'yaw') {
    if (absAngle <= 5) return '方向正常'
    if (angle > 0) return '向右偏转'
    return '向左偏转'
  }
  
  return '正常'
}

// 获取当前姿态
const getCurrentPosture = () => {
  const { pitch, roll, yaw } = currentAngles.value
  
  if (Math.abs(pitch) <= 5 && Math.abs(roll) <= 5 && Math.abs(yaw) <= 5) {
    return '正常直立'
  }
  
  if (Math.abs(pitch) > 15 || Math.abs(roll) > 15) {
    return '严重倾斜'
  }
  
  if (pitch > 5) return '前倾'
  if (pitch < -5) return '后倾'
  if (roll > 5) return '右倾'
  if (roll < -5) return '左倾'
  
  return '轻微倾斜'
}

// 获取稳定性等级
const getStabilityClass = (stability = null) => {
  const currentStability = stability || getCurrentStability()
  return {
    'stability-excellent': currentStability === 'excellent',
    'stability-good': currentStability === 'good',
    'stability-fair': currentStability === 'fair',
    'stability-poor': currentStability === 'poor'
  }
}

// 获取稳定性文本
const getStabilityText = (stability = null) => {
  const currentStability = stability || getCurrentStability()
  const stabilityMap = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return stabilityMap[currentStability] || '未知'
}

// 计算当前稳定性
const getCurrentStability = () => {
  const { pitch, roll, yaw } = currentAngles.value
  const totalDeviation = Math.abs(pitch) + Math.abs(roll) + Math.abs(yaw)
  
  if (totalDeviation <= 10) return 'excellent'
  if (totalDeviation <= 20) return 'good'
  if (totalDeviation <= 35) return 'fair'
  return 'poor'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化图表时间
const formatChartTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生成图表数据
const generateChartData = () => {
  const now = Date.now()
  let interval, count
  
  switch (timeRange.value) {
    case '1h':
      interval = 5 * 60 * 1000 // 5分钟
      count = 12
      break
    case '6h':
      interval = 30 * 60 * 1000 // 30分钟
      count = 12
      break
    case '24h':
      interval = 2 * 60 * 60 * 1000 // 2小时
      count = 12
      break
    default:
      interval = 30 * 60 * 1000
      count = 12
  }
  
  pitchData.value = []
  rollData.value = []
  yawData.value = []
  
  for (let i = count - 1; i >= 0; i--) {
    const time = now - (i * interval)
    
    pitchData.value.push({
      time,
      value: -10 + Math.random() * 20
    })
    
    rollData.value.push({
      time,
      value: -10 + Math.random() * 20
    })
    
    yawData.value.push({
      time,
      value: -30 + Math.random() * 60
    })
  }
}

// 更新图表
const updateCharts = () => {
  generateChartData()
}

// 加载姿态角数据
const loadPostureAngleData = async () => {
  try {
    const data = await getPostureAngleData()
    currentAngles.value = data.current
    lastUpdate.value = Date.now()
  } catch (error) {
    console.error('加载姿态角数据失败:', error)
  }
}

// 组件挂载时
onMounted(() => {
  loadPostureAngleData()
  generateChartData()
  
  // 每5秒更新一次数据
  updateTimer = setInterval(() => {
    loadPostureAngleData()
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
.posture-angle {
  max-width: 1200px;
  margin: 0 auto;
}

/* 姿态概览 */
.posture-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.posture-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s ease;
}

.posture-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.angle-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.angle-status.normal {
  background: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
}

.angle-status.warning {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
}

.angle-status.danger {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
}

.angle-display {
  margin-bottom: 16px;
}

.angle-circle {
  width: 120px;
  height: 120px;
  border: 3px solid #e4e7ed;
  border-radius: 50%;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.angle-indicator {
  position: absolute;
  top: 6px;
  left: 50%;
  width: 3px;
  height: 50px;
  background: #409eff;
  transform-origin: bottom center;
  border-radius: 2px;
  margin-left: -1.5px;
}

.angle-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.angle-info {
  font-size: 14px;
  color: #606266;
}

/* 姿态可视化 */
.posture-visualization {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.posture-visualization h2 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.visualization-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  align-items: center;
}

.device-model {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  perspective: 1000px;
}

.device-3d {
  width: 80px;
  height: 120px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.device-face {
  position: absolute;
  width: 80px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  border-radius: 8px;
}

.device-face.front {
  background: #409eff;
  transform: translateZ(20px);
}

.device-face.back {
  background: #909399;
  transform: rotateY(180deg) translateZ(20px);
}

.device-face.left {
  background: #67c23a;
  transform: rotateY(-90deg) translateZ(20px);
  width: 40px;
}

.device-face.right {
  background: #e6a23c;
  transform: rotateY(90deg) translateZ(20px);
  width: 40px;
}

.device-face.top {
  background: #f56c6c;
  transform: rotateX(90deg) translateZ(20px);
  height: 40px;
}

.device-face.bottom {
  background: #606266;
  transform: rotateX(-90deg) translateZ(20px);
  height: 40px;
}

.visualization-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 趋势图表 */
.trend-charts {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.trend-charts h2 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.chart-controls {
  margin-bottom: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.chart-item h3 {
  font-size: 14px;
  color: #303133;
  margin: 0 0 16px 0;
  font-weight: 600;
  text-align: center;
}

.chart-container {
  height: 120px;
  position: relative;
  background: #f8f9fa;
  border-radius: 4px;
}

.chart-line {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-point {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-point:hover {
  width: 8px;
  height: 8px;
  background: #67c23a;
}

/* 姿态统计 */
.posture-statistics {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.posture-statistics h2 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
}

.stat-card h3 {
  font-size: 16px;
  color: #303133;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.anomaly-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
}

.anomaly-time {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
}

.anomaly-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.anomaly-type.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.anomaly-type.danger {
  background: #fef0f0;
  color: #f56c6c;
}

.anomaly-desc {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.no-anomaly {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #67c23a;
  font-size: 14px;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-label {
  font-size: 13px;
  color: #606266;
  min-width: 80px;
}

.dist-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(to right, #409eff, #67c23a);
  transition: width 0.3s ease;
}

.dist-value {
  font-size: 12px;
  color: #909399;
  min-width: 40px;
  text-align: right;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 14px;
  color: #909399;
}

.summary-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.stability-excellent {
  color: #67c23a !important;
}

.stability-good {
  color: #409eff !important;
}

.stability-fair {
  color: #e6a23c !important;
}

.stability-poor {
  color: #f56c6c !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .posture-overview {
    grid-template-columns: 1fr;
  }
  
  .visualization-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .angle-circle {
    width: 100px;
    height: 100px;
  }
  
  .angle-indicator {
    height: 40px;
  }
  
  .device-3d {
    width: 60px;
    height: 90px;
  }
  
  .device-face {
    width: 60px;
    height: 90px;
  }
  
  .device-face.left,
  .device-face.right {
    width: 30px;
  }
  
  .device-face.top,
  .device-face.bottom {
    height: 30px;
  }
}
</style>