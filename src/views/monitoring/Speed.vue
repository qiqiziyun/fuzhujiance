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
          <div class="speed-value">{{ (currentSpeed || 0).toFixed(1) }}</div>
          <div class="speed-unit">m/s</div>
        </div>
        <div class="speed-info">
          <span class="speed-desc">{{ getSpeedDescription(currentSpeed) }}</span>
        </div>
      </div>
      
      <div class="speed-card stats">
        <div class="card-header">
          <h3>速度统计</h3>
          <el-icon class="card-icon"><TrendCharts /></el-icon>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ (maxSpeed || 0).toFixed(1) }}</div>
            <div class="stat-label">最高速度 (m/s)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ (avgSpeed || 0).toFixed(1) }}</div>
            <div class="stat-label">平均速度 (m/s)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ (totalDistance || 0).toFixed(1) }}</div>
            <div class="stat-label">总距离 (km)</div>
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
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :disabled-date="disabledDate"
            :picker-options="pickerOptions"
            style="margin-right: 10px;"
          />
          <el-button 
            type="primary" 
            @click="handleQuery"
            :loading="chartLoading"
          >
            查询
          </el-button>
        </div>
      </div>
      <div class="chart-container">
        <v-chart 
          class="speed-chart" 
          :option="chartOption" 
          :loading="chartLoading"
          autoresize
        />
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'
import { getSpeedData } from '@/api/monitoring'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

// 当前速度
const currentSpeed = ref(2.3)

// 速度统计
const maxSpeed = ref(8.5)
const avgSpeed = ref(3.2)
const totalDistance = ref(12.6)
const totalTime = ref(14400) // 秒
const lastUpdate = ref(Date.now())

// 日期范围选择
const dateRange = ref([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天前
  new Date().toISOString().split('T')[0] // 今天
])

// 禁用日期的函数
const disabledDate = (time) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 设置为今天的最后一刻
  
  // 禁用未来的日期
  if (time.getTime() > today.getTime()) {
    return true
  }
  
  // 禁用15天以前的日期
  const fifteenDaysAgo = new Date()
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
  fifteenDaysAgo.setHours(0, 0, 0, 0) // 设置为15天前的开始
  
  if (time.getTime() < fifteenDaysAgo.getTime()) {
    return true
  }
  
  return false
}

// 日期选择器配置
const pickerOptions = {
  onPick: ({ maxDate, minDate }) => {
    if (minDate && maxDate) {
      // 检查选择的日期范围是否超过15天
      const diffTime = Math.abs(maxDate - minDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 15) {
        ElMessage.warning('最多只能选择15天的时间范围')
        // 重置为默认范围
        dateRange.value = [
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ]
      }
    }
  }
}

// 日期快捷选项
// 删除整个 dateShortcuts 配置
// const dateShortcuts = [
//   {
//     text: '最近7天',
//     value: () => {
//       const end = new Date()
//       const start = new Date()
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
//       return [start, end]
//     }
//   },
//   {
//     text: '最近30天',
//     value: () => {
//       const end = new Date()
//       const start = new Date()
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
//       return [start, end]
//     }
//   },
//   {
//     text: '最近3个月',
//     value: () => {
//       const end = new Date()
//       const start = new Date()
//       start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
//       return [start, end]
//     }
//   }
// ]

// 速度历史数据（用于图表显示）
const speedHistory = ref([])

// 定时器
let updateTimer = null

// 图表加载状态
const loading = ref(false)
const chartLoading = ref(false)

// 图表配置
const chartOption = computed(() => {
  console.log('speedHistory数据:', speedHistory.value)
  
  // 处理历史数据
  const times = []
  const speeds = []
  
  if (speedHistory.value && speedHistory.value.length > 0) {
    speedHistory.value.forEach(item => {
      if (item.timestamp && (item.speed !== undefined || item.velocity !== undefined || item.value !== undefined)) {
        times.push(formatTime(item.timestamp))
        const speedValue = item.speed || item.velocity || item.value || 0
        speeds.push(Number(speedValue))
      }
    })
  }
  
  // 计算标签间隔（每5分钟显示一个标签）
  const labelInterval = Math.max(1, Math.ceil(times.length / 12))
  console.log('标签间隔设置:', labelInterval)
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `时间: ${data.name}<br/>速度: ${data.value} m/s`
      }
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        rotate: 45,
        fontSize: 14,
        color: '#303133',
        margin: 15,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        interval: labelInterval - 1,
        formatter: function(value, index) {
          return value || ''
        }
      },
      axisTick: {
        alignWithLabel: true,
        show: true,
        length: 6,
        lineStyle: {
          color: '#303133',
          width: 2
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133',
          width: 2
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '速度 (m/s)',
      nameTextStyle: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold',
        padding: [0, 0, 0, 20]
      },
      axisLabel: {
        formatter: '{value}',
        fontSize: 14,
        color: '#303133',
        margin: 18,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133',
          width: 2
        }
      },
      axisTick: {
        show: true,
        length: 6,
        lineStyle: {
          color: '#303133',
          width: 2
        }
      },
      splitLine: {
        lineStyle: {
          color: '#E4E7ED',
          type: 'dashed',
          width: 1
        }
      }
    },
    series: [
      {
        name: '速度',
        type: 'line',
        data: speeds,
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)'
              }
            ]
          }
        }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30
      }
    ]
  }
})

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



// 格式化时间（显示小时:分钟格式）
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的时间戳:', timestamp)
      return ''
    }
    
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('时间格式化错误:', error, timestamp)
    return ''
  }
}



// 格式化持续时间
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// 修改加载速度数据函数，支持日期范围参数
const loadSpeedData = async () => {
  try {
    chartLoading.value = true
    // 传递日期范围参数给API
    const params = {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    }
    const data = await getSpeedData(params)
    if (data) {
      // 确保所有数值都是数字类型
      currentSpeed.value = Number(data.current) || 0
      maxSpeed.value = Number(data.max) || 0
      avgSpeed.value = Number(data.average) || 0
      totalDistance.value = Number(data.distance) || 0
      totalTime.value = Number(data.duration) || 0
      if (data.history && Array.isArray(data.history)) {
        // 用于图表显示的历史数据
        speedHistory.value = data.history
      }
      lastUpdate.value = Date.now()
    }
  } catch (error) {
    console.error('加载速度数据失败:', error)
    ElMessage.error('加载速度数据失败，请检查网络连接')
    // 确保在错误情况下也有默认的数字值
    currentSpeed.value = 0
    maxSpeed.value = 0
    avgSpeed.value = 0
    totalDistance.value = 0
    totalTime.value = 0
  } finally {
    chartLoading.value = false
  }
}

// 查询按钮点击处理
const handleQuery = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    console.log('查询日期范围:', dateRange.value)
    loadSpeedData()
  } else {
    ElMessage.warning('请选择有效的日期范围')
  }
}

// 组件挂载时初始化
onMounted(() => {
  loadSpeedData()
  // 每10分钟自动刷新数据
  updateTimer = setInterval(() => {
    loadSpeedData()
  }, 600000) // 10分钟 = 10 * 60 * 1000 = 600000毫秒
})

// 在组件卸载时清理定时器和事件监听器
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.speed-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
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
  margin-bottom: 14px;
}

.card-header h3 {
  font-size: 15px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.speed-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #67c23a;
}

.speed-status.slow { background: #909399; }
.speed-status.normal { background: #67c23a; }
.speed-status.fast { background: #e6a23c; }
.speed-status.very-fast { background: #f56c6c; }

.speed-display {
  text-align: center;
  margin: 16px 0;
}

.speed-value {
  font-size: 40px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.speed-unit {
  font-size: 14px;
  color: #909399;
  margin-top: 6px;
}

.speed-info {
  text-align: center;
}

.speed-desc {
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 3px 10px;
  border-radius: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  display: block;
}

.stat-label {
  font-size: 11px;
  color: #909399;
  margin-top: 3px;
}

.update-time {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 3px 6px;
  border-radius: 3px;
}

/* 图表区域 - 调整为更大的尺寸 */
.speed-chart-section {
  background: white;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  padding-left: 20px;
}

.chart-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.chart-container {
  height: 500px;
  width: 100%;
}

.speed-chart {
  height: 100%;
  width: 100%;
}

/* 添加更好的移动端适配 */
@media (max-width: 768px) {
  .chart-container {
    height: 350px;
  }
  
  .speed-overview {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .chart-data {
    flex-direction: column;
    align-items: center;
  }
}
</style>