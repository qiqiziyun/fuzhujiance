<template>
  <div class="grip-strength">
    <!-- 实时数据卡片 -->
    <div class="data-overview">
      <div class="data-card current">
        <div class="card-header">
          <h3>当前握力</h3>
          <div class="status-indicator" :class="getStatusClass(currentData.value)"></div>
        </div>
        <div class="data-value">
          <span class="value">{{ currentData.value ? currentData.value.toFixed(1) : '0.0' }}</span>
          <span class="unit">kg</span>
        </div>
        <div class="data-trend">
          <el-icon :class="getTrendClass(currentData.trend)">
            <ArrowUp v-if="currentData.trend === 'up'" />
            <ArrowDown v-if="currentData.trend === 'down'" />
            <Minus v-if="currentData.trend === 'stable'" />
          </el-icon>
          <span class="trend-text">{{ getTrendText(currentData.trend) }}</span>
        </div>
      </div>
      
      <div class="data-card average">
        <div class="card-header">
          <h3>平均握力</h3>
          <span class="time-range">今日</span>
        </div>
        <div class="data-value">
          <span class="value">{{ averageData.today ? averageData.today.toFixed(1) : '0.0' }}</span>
          <span class="unit">kg</span>
        </div>
        <div class="comparison">
          <span class="comparison-text">较昨日</span>
          <span class="comparison-value" :class="getComparisonClass(averageData.change)">
            {{ averageData.change ? (averageData.change > 0 ? '+' : '') + averageData.change.toFixed(1) : '0.0' }}kg
          </span>
        </div>
      </div>
      
      <div class="data-card max">
        <div class="card-header">
          <h3>最大握力</h3>
          <span class="time-range">今日</span>
        </div>
        <div class="data-value">
          <span class="value">{{ maxData.today ? maxData.today.toFixed(1) : '0.0' }}</span>
          <span class="unit">kg</span>
        </div>
        <div class="max-time">
          <span class="time-text">{{ formatTime(maxData.time) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="chart-section">
      <div class="chart-header">
        <h2>握力趋势图</h2>
        <div class="chart-controls">
          <el-radio-group v-model="timeRange" @change="updateChart">
            <el-radio-button value="1h">1小时</el-radio-button>
          <el-radio-button value="6h">6小时</el-radio-button>
          <el-radio-button value="24h">24小时</el-radio-button>
          <el-radio-button value="7d">7天</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="chart-container">
        <!-- 折线图 -->
        <div class="line-chart" ref="lineChartRef">
          <div class="chart-canvas">
            <svg class="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
              <!-- 网格线 -->
              <defs>
                <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              <!-- Y轴标签 -->
              <g class="y-axis">
                <text v-for="(label, index) in yAxisLabels" :key="index" 
                      :x="30" :y="280 - index * 60" 
                      text-anchor="end" font-size="12" fill="#666">
                  {{ label }}kg
                </text>
              </g>
              
              <!-- X轴标签 -->
              <g class="x-axis">
                <text v-for="(label, index) in xAxisLabels" :key="index" 
                      :x="60 + index * 100" :y="295" 
                      text-anchor="middle" font-size="12" fill="#666">
                  {{ label }}
                </text>
              </g>
              
              <!-- 折线 -->
              <polyline 
                :points="chartPoints" 
                fill="none" 
                stroke="#409eff" 
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              
              <!-- 数据点 -->
              <g class="data-points">
                <circle v-for="(point, index) in chartData" :key="index"
                        :cx="60 + index * 100" 
                        :cy="280 - (point.value / maxChartValue * 240)"
                        r="4" 
                        fill="#409eff" 
                        stroke="white" 
                        stroke-width="2"
                        @mouseover="showTooltip($event, point)"
                        @mouseout="hideTooltip"
                        class="data-point"
                />
              </g>
            </svg>
            
            <!-- 工具提示 -->
            <div v-if="tooltip.visible" class="chart-tooltip" 
                 :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
              <div class="tooltip-time">{{ tooltip.time }}</div>
              <div class="tooltip-value">{{ tooltip.value }}kg</div>
            </div>
          </div>
        </div>
        
        <!-- 数据表格 -->
        <div class="data-table-section">
          <div class="table-header">
            <h3>详细数据</h3>
            <el-button size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
          <el-table :data="tableData" stripe style="width: 100%" max-height="300">
            <el-table-column prop="time" label="时间" width="120">
              <template #default="{ row }">
                {{ formatTableTime(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="握力值(kg)" width="100">
              <template #default="{ row }">
                <span :class="getValueClass(row.value)">{{ row.value ? row.value.toFixed(1) : '0.0' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="trend" label="趋势" width="80">
              <template #default="{ row }">
                <el-icon :class="getTrendClass(row.trend)">
                  <ArrowUp v-if="row.trend === 'up'" />
                  <ArrowDown v-if="row.trend === 'down'" />
                  <Minus v-if="row.trend === 'stable'" />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="note" label="备注" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.note || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    
    <!-- 统计信息部分已删除 -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendCharts,
  InfoFilled,
  WarningFilled,
  SuccessFilled,
  Download
} from '@element-plus/icons-vue'
import { getGripStrengthData } from '@/api/monitoring'

// 当前数据
const currentData = ref({
  value: 25.6,
  trend: 'stable',
  timestamp: Date.now()
})

// 平均数据
const averageData = ref({
  today: 24.8,
  yesterday: 23.5,
  change: 1.3
})

// 最大数据
const maxData = ref({
  today: 28.9,
  time: Date.now() - 3600000
})

// 时间范围
const timeRange = ref('6h')

// 图表数据
const chartData = ref([
  { time: Date.now() - 21600000, value: 22.5, trend: 'stable', status: 'normal', note: '正常测量' },
  { time: Date.now() - 18000000, value: 24.2, trend: 'up', status: 'good', note: '状态良好' },
  { time: Date.now() - 14400000, value: 25.8, trend: 'up', status: 'good', note: '持续改善' },
  { time: Date.now() - 10800000, value: 23.9, trend: 'down', status: 'normal', note: '轻微下降' },
  { time: Date.now() - 7200000, value: 26.1, trend: 'up', status: 'excellent', note: '表现优秀' },
  { time: Date.now() - 3600000, value: 25.6, trend: 'stable', status: 'good', note: '保持稳定' },
  { time: Date.now(), value: 25.6, trend: 'stable', status: 'good', note: '当前数值' }
])

// 表格数据
const tableData = computed(() => chartData.value.slice().reverse())

// 图表相关
const lineChartRef = ref(null)
const maxChartValue = computed(() => Math.max(...chartData.value.map(d => d.value)) + 5)
const tooltip = ref({ visible: false, x: 0, y: 0, time: '', value: '' })

// 坐标轴标签
const yAxisLabels = computed(() => {
  const max = maxChartValue.value
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), Math.round(max)]
})

const xAxisLabels = computed(() => {
  return chartData.value.map(d => formatChartTime(d.time))
})

// 图表路径点
const chartPoints = computed(() => {
  return chartData.value.map((point, index) => {
    const x = 60 + index * 100
    const y = 280 - (point.value / maxChartValue.value * 240)
    return `${x},${y}`
  }).join(' ')
})

// 统计信息
const statistics = ref({
  measureCount: 156,
  range: { min: 18.2, max: 28.9 },
  standardDeviation: 2.34,
  stability: 'good'
})


// 定时器
let updateTimer = null

// 获取状态样式类
const getStatusClass = (value) => {
  if (value >= 25) return 'excellent'
  if (value >= 20) return 'good'
  if (value >= 15) return 'fair'
  return 'poor'
}

// 获取趋势样式类
const getTrendClass = (trend) => {
  return {
    'trend-up': trend === 'up',
    'trend-down': trend === 'down',
    'trend-stable': trend === 'stable'
  }
}

// 获取趋势文本
const getTrendText = (trend) => {
  const trendMap = {
    up: '上升',
    down: '下降',
    stable: '稳定'
  }
  return trendMap[trend] || '未知'
}

// 获取对比样式类
const getComparisonClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
}

// 获取稳定性样式类
const getStabilityClass = (stability) => {
  return {
    'stability-excellent': stability === 'excellent',
    'stability-good': stability === 'good',
    'stability-fair': stability === 'fair',
    'stability-poor': stability === 'poor'
  }
}

// 获取稳定性文本
const getStabilityText = (stability) => {
  const stabilityMap = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return stabilityMap[stability] || '未知'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化表格时间
const formatTableTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 获取数值样式类
const getValueClass = (value) => {
  if (value >= 25) return 'value-excellent'
  if (value >= 20) return 'value-good'
  if (value >= 15) return 'value-fair'
  return 'value-poor'
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    excellent: 'success',
    good: 'success',
    normal: 'info',
    fair: 'warning',
    poor: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    excellent: '优秀',
    good: '良好',
    normal: '正常',
    fair: '一般',
    poor: '较差'
  }
  return statusMap[status] || '未知'
}

// 格式化图表时间
const formatChartTime = (timestamp) => {
  const date = new Date(timestamp)
  if (timeRange.value === '7d') {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生成图表数据
const generateChartData = () => {
  const data = []
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
    case '7d':
      interval = 24 * 60 * 60 * 1000 // 1天
      count = 7
      break
    default:
      interval = 30 * 60 * 1000
      count = 12
  }
  
  for (let i = count - 1; i >= 0; i--) {
    data.push({
      time: now - (i * interval),
      value: 20 + Math.random() * 10
    })
  }
  
  chartData.value = data
}

// 更新图表
const updateChart = () => {
  generateChartData()
}

// 导出数据
const exportData = () => {
  const csvContent = 'data:text/csv;charset=utf-8,时间,握力值(kg),趋势,状态,备注\n' +
    tableData.value.map(row => 
      `${formatTableTime(row.time)},${row.value ? row.value.toFixed(1) : '0.0'},${getTrendText(row.trend)},${getStatusText(row.status)},${row.note || ''}`
    ).join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `握力数据_${new Date().toLocaleDateString()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 加载握力数据
const loadGripStrengthData = async () => {
  try {
    const data = await getGripStrengthData()
    // 添加安全检查，确保数据存在
    if (data && data.current) {
      currentData.value = data.current
    }
    if (data && data.average) {
      averageData.value = data.average
    }
    if (data && data.max) {
      maxData.value = data.max
    }
    if (data && data.statistics) {
      statistics.value = data.statistics
    }
  } catch (error) {
    console.error('加载握力数据失败:', error)
  }
}

// 组件挂载时
onMounted(() => {
  loadGripStrengthData()
  generateChartData()
  
  // 每10秒更新一次数据
  updateTimer = setInterval(() => {
    loadGripStrengthData()
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
.grip-strength {
  max-width: 1200px;
  margin: 0 auto;
}

/* 数据概览 */
.data-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.data-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.data-card:hover {
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

.time-range {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.excellent {
  background: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
}

.status-indicator.good {
  background: #409eff;
  box-shadow: 0 0 6px rgba(64, 158, 255, 0.5);
}

.status-indicator.fair {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
}

.status-indicator.poor {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
}

.data-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.unit {
  font-size: 16px;
  color: #909399;
}

.data-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #909399;
}

.trend-text {
  color: #606266;
}

.comparison {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.comparison-text {
  color: #909399;
}

.comparison-value.positive {
  color: #67c23a;
}

.comparison-value.negative {
  color: #f56c6c;
}

.comparison-value.neutral {
  color: #909399;
}

.max-time {
  font-size: 12px;
  color: #909399;
}

/* 图表区域 */
.chart-section {
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
  width: 100%;
}

.chart-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.chart-placeholder p {
  color: #909399;
  margin-bottom: 20px;
}

.chart-data {
  display: flex;
  justify-content: space-around;
  align-items: end;
  height: 200px;
  margin-top: 20px;
}

.data-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.point-time {
  font-size: 12px;
  color: #909399;
}

.point-value {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.point-bar {
  width: 20px;
  height: 120px;
  background: #f5f7fa;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(to top, #409eff, #67c23a);
  border-radius: 10px;
  transition: height 0.3s ease;
}

/* 统计信息 */
.statistics {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.statistics h2 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 12px;
  color: #c0c4cc;
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
  .data-overview {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-data {
    gap: 8px;
  }
  
  .point-bar {
    width: 16px;
    height: 100px;
  }
}
</style>