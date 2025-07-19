<template>
  <div class="speed-monitoring">
    <!-- 速度概览 -->
    <div class="speed-overview">
      <!-- 当前速度卡片 -->
      <div class="speed-card current">
        <div class="card-header">
          <h3>当前速度</h3>
          <div class="status-indicator" :class="currentSpeed > 0 ? 'active' : 'inactive'"></div>
        </div>
        <div class="speed-value">
          <span class="value">{{ currentSpeed.toFixed(1) }}</span>
          <span class="unit">m/s</span>
        </div>
        <!-- <div class="speed-status">{{ currentSpeed > 10 ? '很快' : currentSpeed > 5 ? '中等' : '缓慢' }}</div> -->
        <div class="last-update">最后更新: {{ lastUpdateTime }}</div>
      </div>
      
      <div class="speed-card stats">
        <div class="card-header">
          <h3>今日速度统计</h3>
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
import { getSpeedData, getCurrentSpeedData, getTodayMaxSpeed } from '@/api/monitoring'
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
// 添加缺少的变量
const lastUpdateTime = ref('')

// 今日最高速度数据
const todayMaxSpeed = ref(0)
const todayMaxSpeedDate = ref('')

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

// 速度历史数据（用于图表显示）
const speedHistory = ref([])

// 定时器
let updateTimer = null

// 图表加载状态
const loading = ref(false)
const chartLoading = ref(false)

// 图表配置
const chartOption = computed(() => {
  console.log('重新计算图表配置，speedHistory数据点数量:', speedHistory.value.length)
  
  // 直接使用后端数据，不进行复杂处理
  const times = []
  const speeds = []
  
  if (speedHistory.value && speedHistory.value.length > 0) {
    speedHistory.value.forEach(item => {
      if (item.datetime && item.speed !== undefined) {
        times.push(item.datetime) // 直接使用完整的日期时间
        speeds.push(Number(item.speed))
      }
    })
  }
  
  console.log('图表数据:', {
    时间点数量: times.length,
    速度点数量: speeds.length,
    第一个时间: times[0],
    最后一个时间: times[times.length - 1],
    速度范围: speeds.length > 0 ? [Math.min(...speeds), Math.max(...speeds)] : [0, 0]
  })
  
  // 动态设置Y轴范围
  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 10
  const yAxisMin = Math.max(0, minSpeed - 1)
  const yAxisMax = maxSpeed + 2
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        if (params && params.length > 0) {
          const data = params[0]
          return `时间: ${data.name}<br/>速度: ${data.value} m/s`
        }
        return ''
      }
    },
    grid: {
      left: '10%',
      right: '4%',
      bottom: '20%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#303133',
        margin: 15,
        interval: 'auto', // 自动计算间隔
        formatter: function(value) {
          // 显示完整的日期时间
          return value || ''
        }
      },
      axisTick: {
        alignWithLabel: true,
        show: true
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '速度 (m/s)',
      min: yAxisMin,
      max: yAxisMax,
      nameTextStyle: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold'
      },
      axisLabel: {
        formatter: '{value}',
        fontSize: 12,
        color: '#303133'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#E4E7ED',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '速度',
        type: 'line',
        data: speeds,
        smooth: false,
        symbol: 'circle',
        symbolSize: 3,
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
        height: 30,
        bottom: 10
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

const loadSpeedData = async () => {
  try {
    chartLoading.value = true
    
    console.log('开始加载速度数据，日期范围:', dateRange.value)
    
    // 获取后端数据
    const result = await getSpeedData({
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    })
    
    console.log('API返回结果:', result)
    
    if (result.success && result.data) {
      // 直接使用后端返回的数据，不进行复杂处理
      speedHistory.value = result.data
      
      console.log('直接设置speedHistory:', speedHistory.value.length, '个数据点')
      console.log('前3个数据点:', speedHistory.value.slice(0, 3))
      
      // 简单统计（但不覆盖今日最高速度）
      if (speedHistory.value.length > 0) {
        const speeds = speedHistory.value.map(item => item.speed)
        currentSpeed.value = speeds[speeds.length - 1] || 0
        // 移除这行：maxSpeed.value = Math.max(...speeds)
        avgSpeed.value = speeds.reduce((a, b) => a + b, 0) / speeds.length
      }
      
      // 更新最后更新时间
      lastUpdateTime.value = new Date().toLocaleString('zh-CN')
      
      if (speedHistory.value.length === 0) {
        ElMessage.info('选择的时间范围内没有速度数据')
      } else {
        ElMessage.success(`成功加载 ${speedHistory.value.length} 个数据点`)
      }
    } else {
      console.error('获取数据失败:', result.error)
      speedHistory.value = []
      ElMessage.error('获取数据失败: ' + (result.error || '未知错误'))
    }
    
  } catch (error) {
    console.error('加载速度数据失败:', error)
    ElMessage.error('加载速度数据失败: ' + error.message)
    speedHistory.value = []
  } finally {
    chartLoading.value = false
  }
}

// 修改定时器设置为每1秒刷新
onMounted(() => {
  loadSpeedData()
  loadTodayMaxSpeed() // 添加这行
  
  // 每1秒自动刷新当前速度数据
  updateTimer = setInterval(async () => {
    try {
      // 只获取当前速度，不重新加载历史数据
      const currentData = await getCurrentSpeedData()
      currentSpeed.value = currentData.current
      lastUpdateTime.value = new Date(currentData.timestamp).toLocaleString('zh-CN')
      
      // 每分钟刷新一次今日最高速度
      const now = new Date()
      if (now.getSeconds() === 0) {
        loadTodayMaxSpeed()
      }
    } catch (error) {
      console.error('刷新当前速度失败:', error)
    }
  }, 1000) // 1秒 = 1000毫秒
})

// 查询按钮点击处理
const handleQuery = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    console.log('开始查询，日期范围:', dateRange.value)
    
    // 验证日期范围
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 15) {
      ElMessage.warning('查询范围不能超过15天')
      return
    }
    
    if (startDate > endDate) {
      ElMessage.warning('开始日期不能晚于结束日期')
      return
    }
    
    await loadSpeedData()
  } else {
    ElMessage.warning('请选择有效的日期范围')
  }
}

// 在组件卸载时清理定时器和事件监听器
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
})

// 加载今日最高速度数据
const loadTodayMaxSpeed = async () => {
  try {
    console.log('开始获取今日最高速度数据')
    const result = await getTodayMaxSpeed()
    
    console.log('getTodayMaxSpeed返回的完整结果:', result)
    
    if (result.success) {
      // 直接使用返回的值，不使用 || 0 逻辑
      todayMaxSpeed.value = result.maxSpeed
      todayMaxSpeedDate.value = result.date || ''
      
      // 更新显示的最高速度
      maxSpeed.value = result.maxSpeed
      
      console.log('今日最高速度数据加载成功:', {
        速度: todayMaxSpeed.value,
        日期: todayMaxSpeedDate.value
      })
    } else {
      console.error('获取今日最高速度失败:', result.error)
      ElMessage.error('获取今日最高速度失败: ' + (result.error || '未知错误'))
    }
  } catch (error) {
    console.error('加载今日最高速度数据失败:', error)
    ElMessage.error('加载今日最高速度数据失败: ' + error.message)
  }
}
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