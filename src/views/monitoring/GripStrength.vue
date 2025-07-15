<template>
  <div class="grip-strength">
    <!-- 实时数据卡片 -->
    <div class="data-overview">
      <div class="data-card current">
        <div class="card-header">
          <h3>左手握力</h3>
          <div class="status-indicator" :class="getStatusClass(leftData.current)"></div>
        </div>
        <div class="data-value">
          <span class="value">{{ (leftData.current || 0).toFixed(1) }}</span>
          <span class="unit">kg</span>
        </div>
        <div class="data-stats">
          <div class="mini-stat">
            <span class="mini-label">平均</span>
            <span class="mini-value">{{ (leftData.average || 0).toFixed(1) }}kg</span>
          </div>
          <div class="mini-stat">
            <span class="mini-label">最大</span>
            <span class="mini-value">{{ (leftData.max || 0).toFixed(1) }}kg</span>
          </div>
        </div>
      </div>
      
      <div class="data-card current">
        <div class="card-header">
          <h3>右手握力</h3>
          <div class="status-indicator" :class="getStatusClass(rightData.current)"></div>
        </div>
        <div class="data-value">
          <span class="value">{{ (rightData.current || 0).toFixed(1) }}</span>
          <span class="unit">kg</span>
        </div>
        <div class="data-stats">
          <div class="mini-stat">
            <span class="mini-label">平均</span>
            <span class="mini-value">{{ (rightData.average || 0).toFixed(1) }}kg</span>
          </div>
          <div class="mini-stat">
            <span class="mini-label">最大</span>
            <span class="mini-value">{{ (rightData.max || 0).toFixed(1) }}kg</span>
          </div>
        </div>
      </div>
      
      <div class="data-card summary">
        <div class="card-header">
          <h3>综合统计</h3>
          <div class="update-time">{{ formatTime(lastUpdate) }}</div>
        </div>
        <div class="summary-grid">
          <div class="summary-item total">
            <div class="summary-label">总握力</div>
            <div class="summary-value">{{ ((leftData.current || 0) + (rightData.current || 0)).toFixed(1) }}<span class="summary-unit">kg</span></div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-label">最大总握力</span>
              <span class="stat-value">{{ ((leftData.max || 0) + (rightData.max || 0)).toFixed(1) }}kg</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">平均总握力</span>
              <span class="stat-value">{{ ((leftData.average || 0) + (rightData.average || 0)).toFixed(1) }}kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 握力图表 -->
    <div class="grip-chart-section">
      <div class="chart-header">
        <h2>LFX/RFX握力变化趋势</h2>
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
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color left"></div>
            <span>LFX握力</span>
          </div>
          <div class="legend-item">
            <div class="legend-color right"></div>
            <span>RFX握力</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <v-chart 
          class="grip-chart" 
          :option="chartOption" 
          :loading="chartLoading"
          autoresize
        />
      </div>
    </div>

    <!-- 新增 lfy_rfy 握力图表 -->
    <div class="grip-chart-section">
      <div class="chart-header">
        <h2>LFY/RFY 握力变化趋势</h2>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color left"></div>
            <span>LFY握力</span>
          </div>
          <div class="legend-item">
            <div class="legend-color right"></div>
            <span>RFY握力</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <v-chart 
          class="grip-chart" 
          :option="lfyRfyChartOption" 
          :loading="lfyRfyChartLoading"
          autoresize
        />
      </div>
    </div>
    
    <!-- 第三个图表：LFZ/RFZ 握力图表 -->
    <div class="grip-chart-section">
      <div class="chart-header">
        <h2>LFZ/RFZ 握力变化趋势</h2>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color lfz"></div>
            <span>LFZ 握力</span>
          </div>
          <div class="legend-item">
            <div class="legend-color rfz"></div>
            <span>RFZ 握力</span>
          </div>
        </div>
      </div>
      <div class="chart-container">
        <v-chart 
          class="grip-chart" 
          :option="lfzRfzChartOption" 
          :loading="lfzRfzChartLoading"
          autoresize
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getDualGripDataFromUnifiedAPI, getLfyRfyGripData, getLfzRfzGripData } from '@/api/monitoring' // 修改导入的接口
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

// 握力数据
const leftData = ref({ current: 0, average: 0, max: 0, history: [] })
const rightData = ref({ current: 0, average: 0, max: 0, history: [] })
const lastUpdate = ref(Date.now())
const chartLoading = ref(false)

// 新增 lfy_rfy 数据
const lfyData = ref({ current: 0, average: 0, max: 0, history: [] })
const rfyData = ref({ current: 0, average: 0, max: 0, history: [] })
const lfyRfyChartLoading = ref(false)

// 新增 lfz_rfz 数据
const lfzData = ref({ current: 0, average: 0, max: 0, history: [] })
const rfzData = ref({ current: 0, average: 0, max: 0, history: [] })
const lfzRfzChartLoading = ref(false)

// 定时器
let updateTimer = null

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

// 查询按钮处理函数
const handleQuery = () => {
  console.log('查询日期范围:', dateRange.value)
  loadGripData()
  loadLfyRfyGripData()
  loadLfzRfzGripData()
}

// 图表配置
const chartOption = computed(() => {
  console.log('左手数据:', leftData.value.history)
  console.log('右手数据:', rightData.value.history)
  
  // 获取所有数据并按数据库时间排序
  const leftHistory = leftData.value.history || []
  const rightHistory = rightData.value.history || []
  
  // 确保数据长度一致，使用较短的长度
  const dataLength = Math.min(leftHistory.length, rightHistory.length)
  
  if (dataLength === 0) {
    return {
      tooltip: { trigger: 'axis' },
      // legend: { data: ['左手握力', '右手握力'], top: 10 },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: '握力 (kg)', min: 0 },
      // series: [
      //   { name: '左手握力', type: 'line', data: [], smooth: true, symbol: 'none', lineStyle: { color: '#409EFF', width: 2 } },
      //   { name: '右手握力', type: 'line', data: [], smooth: true, symbol: 'none', lineStyle: { color: '#67C23A', width: 2 } }
      // ]
    }
  }
  
  // 按照原始顺序构建时间轴和数据
  const allTimes = []
  const leftSeriesData = []
  const rightSeriesData = []
  
  // 获取用户选择的日期范围
  const startDate = new Date(dateRange.value[0])
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(dateRange.value[1])
  endDate.setHours(23, 59, 59, 999)
  
  console.log('过滤日期范围:', startDate, '至', endDate)
  
  for (let i = 0; i < dataLength; i++) {
    const leftItem = leftHistory[i]
    const rightItem = rightHistory[i]
    
    if (leftItem && leftItem.timestamp) {
      const itemDate = new Date(leftItem.timestamp)
      
      // 只处理在选择日期范围内的数据
      if (itemDate >= startDate && itemDate <= endDate) {
        const formattedTime = `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getDate().toString().padStart(2, '0')} ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}:${itemDate.getSeconds().toString().padStart(2, '0')}`
        
        allTimes.push(formattedTime)
        leftSeriesData.push(leftItem.value || 0)
        rightSeriesData.push(rightItem ? (rightItem.value || 0) : 0)
      }
    }
  }
  
  console.log('过滤后的数据点数量:', allTimes.length)
  
  // 计算5分钟间隔的标签显示
  const fiveMinuteInterval = Math.max(1, Math.ceil(allTimes.length / 12))
  
  console.log('时间轴数据:', allTimes.slice(0, 5))
  console.log('左手系列数据:', leftSeriesData.slice(0, 5))
  console.log('右手系列数据:', rightSeriesData.slice(0, 5))
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = `时间: ${params[0].axisValue}<br/>`
        params.forEach(param => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.seriesName}: ${param.value.toFixed(2)} kg<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['左手握力', '右手握力'],
      top: 10
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '20%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#303133',
        margin: 15,
        interval: fiveMinuteInterval - 1,
        formatter: function(value) {
          if (value) {
            const parts = value.split(' ')
            if (parts.length >= 2) {
              return parts[0] + '\n' + parts[1]
            }
          }
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
      name: '握力 (kg)',
      min: 0,
      nameTextStyle: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold'
      },
      axisLabel: {
        formatter: '{value}',
        color: '#303133'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'LFY握力',
        type: 'line',
        data: lfySeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#E6A23C',
          width: 2
        },
        itemStyle: {
          color: '#E6A23C'
        },
        connectNulls: false
      },
      {
        name: 'RFY握力',
        type: 'line',
        data: rfySeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#F56C6C',
          width: 2
        },
        itemStyle: {
          color: '#F56C6C'
        },
        connectNulls: false
      }
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: '3%'
      },
      {
        type: 'inside',
        xAxisIndex: [0]
      }
    ]
  }
})

// 格式化时间用于图表显示
const formatTimeForChart = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 修改数据加载函数
const loadGripData = async () => {
  try {
    chartLoading.value = true
    const data = await getDualGripDataFromUnifiedAPI() // 使用正确的API函数
    
    leftData.value = data.left
    rightData.value = data.right
    lastUpdate.value = Date.now()
    
    console.log('加载的所有握力数据:', data)
    console.log('左手历史数据条数:', data.left.history.length)
    console.log('右手历史数据条数:', data.right.history.length)
    console.log('左手数据示例:', data.left.history.slice(0, 3))
    console.log('右手数据示例:', data.right.history.slice(0, 3))
  } catch (error) {
    console.error('加载握力数据失败:', error)
    ElMessage.error('加载握力数据失败')
  } finally {
    chartLoading.value = false
  }
}

// 获取状态样式类
const getStatusClass = (value) => {
  if (value >= 25) return 'excellent'
  if (value >= 20) return 'good'
  if (value >= 15) return 'fair'
  return 'poor'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
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

// 新增 lfy_rfy 图表配置
const lfyRfyChartOption = computed(() => {
  console.log('LFY数据:', lfyData.value.history)
  console.log('RFY数据:', rfyData.value.history)
  
  // 获取所有数据并按数据库时间排序
  const lfyHistory = lfyData.value.history || []
  const rfyHistory = rfyData.value.history || []
  
  // 确保数据长度一致，使用较短的长度
  const dataLength = Math.min(lfyHistory.length, rfyHistory.length)
  
  if (dataLength === 0) {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: '握力 (kg)', min: 0 },
    }
  }
  
  // 按照原始顺序构建时间轴和数据
  const allTimes = []
  const lfySeriesData = []
  const rfySeriesData = []
  
  // 获取用户选择的日期范围
  const startDate = new Date(dateRange.value[0])
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(dateRange.value[1])
  endDate.setHours(23, 59, 59, 999)
  
  console.log('LFY/RFY过滤日期范围:', startDate, '至', endDate)
  
  for (let i = 0; i < dataLength; i++) {
    const lfyItem = lfyHistory[i]
    const rfyItem = rfyHistory[i]
    
    if (lfyItem && lfyItem.timestamp) {
      const itemDate = new Date(lfyItem.timestamp)
      
      // 只处理在选择日期范围内的数据
      if (itemDate >= startDate && itemDate <= endDate) {
        const formattedTime = `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getDate().toString().padStart(2, '0')} ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}:${itemDate.getSeconds().toString().padStart(2, '0')}`
        
        allTimes.push(formattedTime)
        lfySeriesData.push(lfyItem.value || 0)
        rfySeriesData.push(rfyItem ? (rfyItem.value || 0) : 0)
      }
    }
  }
  
  console.log('LFY/RFY过滤后的数据点数量:', allTimes.length)
  
  // 计算5分钟间隔的标签显示
  const fiveMinuteInterval = Math.max(1, Math.ceil(allTimes.length / 12))
  
  console.log('LFY时间轴数据:', allTimes.slice(0, 5))
  console.log('LFY系列数据:', lfySeriesData.slice(0, 5))
  console.log('RFY系列数据:', rfySeriesData.slice(0, 5))
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = `时间: ${params[0].axisValue}<br/>`
        params.forEach(param => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.seriesName}: ${param.value.toFixed(2)} kg<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['LFY握力', 'RFY握力'],
      top: 10
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '20%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#303133',
        margin: 15,
        interval: fiveMinuteInterval - 1,
        formatter: function(value) {
          if (value) {
            const parts = value.split(' ')
            if (parts.length >= 2) {
              return parts[0] + '\n' + parts[1]
            }
          }
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
      name: '握力',
      min: 0,
      nameTextStyle: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold'
      },
      axisLabel: {
        formatter: '{value}',
        color: '#303133'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: '3%'
      },
      {
        type: 'inside',
        xAxisIndex: [0]
      }
    ]
  }
})

// 加载 lfy_rfy 握力数据
const loadLfyRfyGripData = async () => {
  try {
    lfyRfyChartLoading.value = true
    const data = await getLfyRfyGripData()
    
    lfyData.value = data.lfy
    rfyData.value = data.rfy
    
    console.log('加载的lfy_rfy握力数据:', data)
  } catch (error) {
    console.error('加载lfy_rfy握力数据失败:', error)
    ElMessage.error('加载lfy_rfy握力数据失败')
  } finally {
    lfyRfyChartLoading.value = false
  }
}

// 加载 LFZ/RFZ 握力数据
const loadLfzRfzGripData = async () => {
  try {
    lfzRfzChartLoading.value = true
    const data = await getLfzRfzGripData()
    console.log('获取到的LFZ/RFZ数据:', data)
    
    lfzData.value = data.lfz
    rfzData.value = data.rfz
    
    console.log('LFZ数据已更新:', lfzData.value)
    console.log('RFZ数据已更新:', rfzData.value)
  } catch (error) {
    console.error('加载LFZ/RFZ握力数据失败:', error)
    ElMessage.error('加载LFZ/RFZ握力数据失败')
  } finally {
    lfzRfzChartLoading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  loadGripData()
  loadLfyRfyGripData() // 加载新的数据
  loadLfzRfzGripData() // 加载LFZ/RFZ数据
  // 每10分钟自动刷新数据
  updateTimer = setInterval(() => {
    loadGripData()
    loadLfyRfyGripData() // 同时刷新新的数据
    loadLfzRfzGripData() // 同时刷新LFZ/RFZ数据
  }, 600000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
})
// ... LFZ/RFZ 图表配置
const lfzRfzChartOption = computed(() => {
  console.log('LFZ数据:', lfzData.value.history)
  console.log('RFZ数据:', rfzData.value.history)
  
  // 获取所有数据并按数据库时间排序
  const lfzHistory = lfzData.value.history || []
  const rfzHistory = rfzData.value.history || []
  
  // 确保数据长度一致，使用较短的长度
  const dataLength = Math.min(lfzHistory.length, rfzHistory.length)
  
  if (dataLength === 0) {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value', name: '握力 (kg)', min: 0 },
      series: [
        { name: 'LFZ握力', type: 'line', data: [], smooth: true, symbol: 'circle', lineStyle: { color: '#E6A23C', width: 2 } },
        { name: 'RFZ握力', type: 'line', data: [], smooth: true, symbol: 'circle', lineStyle: { color: '#F56C6C', width: 2 } }
      ]
    }
  }
  
  // 按照原始顺序构建时间轴和数据
  const allTimes = []
  const lfzSeriesData = []
  const rfzSeriesData = []
  
  // 获取用户选择的日期范围
  const startDate = new Date(dateRange.value[0])
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(dateRange.value[1])
  endDate.setHours(23, 59, 59, 999)
  
  console.log('LFZ/RFZ过滤日期范围:', startDate, '至', endDate)
  
  for (let i = 0; i < dataLength; i++) {
    const lfzItem = lfzHistory[i]
    const rfzItem = rfzHistory[i]
    
    if (lfzItem && lfzItem.timestamp) {
      const itemDate = new Date(lfzItem.timestamp)
      
      // 只处理在选择日期范围内的数据
      if (itemDate >= startDate && itemDate <= endDate) {
        const formattedTime = `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getDate().toString().padStart(2, '0')} ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}:${itemDate.getSeconds().toString().padStart(2, '0')}`
        
        allTimes.push(formattedTime)
        lfzSeriesData.push(lfzItem.value || 0)
        rfzSeriesData.push(rfzItem ? (rfzItem.value || 0) : 0)
      }
    }
  }
  
  console.log('LFZ/RFZ过滤后的数据点数量:', allTimes.length)
  
  // 计算5分钟间隔的标签显示
  const fiveMinuteInterval = Math.max(1, Math.ceil(allTimes.length / 12))
  
  console.log('LFZ/RFZ时间轴数据:', allTimes.slice(0, 5))
  console.log('LFZ系列数据:', lfzSeriesData.slice(0, 5))
  console.log('RFZ系列数据:', rfzSeriesData.slice(0, 5))
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = `时间: ${params[0].axisValue}<br/>`
        params.forEach(param => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.seriesName}: ${param.value.toFixed(2)} kg<br/>`
          }
        })
        return result
      }
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '20%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#303133',
        margin: 15,
        interval: fiveMinuteInterval - 1,
        formatter: function(value) {
          if (value) {
            const parts = value.split(' ')
            if (parts.length >= 2) {
              return parts[0] + '\n' + parts[1]
            }
          }
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
      name: '握力 (kg)',
      min: 0,
      nameTextStyle: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold'
      },
      axisLabel: {
        formatter: '{value}',
        color: '#303133'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#303133'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'LFZ握力',
        type: 'line',
        data: lfzSeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#E6A23C',
          width: 2
        },
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: 'RFZ握力',
        type: 'line',
        data: rfzSeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#F56C6C',
          width: 2
        },
        itemStyle: {
          color: '#F56C6C'
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
        type: 'slider',
        start: 0,
        end: 100,
        height: 30,
        bottom: 10
      }
    ]
  }
})
</script>

<style scoped>
.grip-strength {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.data-overview {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 24px;
  margin-bottom: 30px;
}

.data-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.data-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
}

.data-card.current::before {
  background: linear-gradient(90deg, #409EFF, #67C23A);
}

.data-card.summary::before {
  background: linear-gradient(90deg, #E6A23C, #F56C6C);
}

.data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #67C23A;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 8px rgba(103, 194, 58, 0.4); }
  50% { box-shadow: 0 0 16px rgba(103, 194, 58, 0.8); }
  100% { box-shadow: 0 0 8px rgba(103, 194, 58, 0.4); }
}

.data-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.value {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.unit {
  font-size: 18px;
  font-weight: 500;
  color: #7f8c8d;
  margin-top: 8px;
}

.data-stats {
  display: flex;
  gap: 16px;
}

.mini-stat {
  flex: 1;
  padding: 12px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid #409EFF;
}

.mini-label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
  font-weight: 500;
}

.mini-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.summary-grid {
  display: flex;
  align-items: center;
  gap: 20px;
}

.summary-item.total {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  background: linear-gradient(135deg, #E6A23C, #F56C6C);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-unit {
  font-size: 16px;
  margin-left: 4px;
}

.summary-divider {
  width: 1px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #e1e8ed, transparent);
}

.summary-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(230, 162, 60, 0.05);
  border-radius: 6px;
}

.stat-label {
  font-size: 13px;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.update-time {
  font-size: 12px;
  color: #95a5a6;
  background: rgba(149, 165, 166, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-color.left {
  background: linear-gradient(135deg, #409EFF, #66b3ff);
}

.legend-color.right {
  background: linear-gradient(135deg, #67C23A, #85ce61);
}

.legend-color.lfy {
  background: linear-gradient(135deg, #E6A23C, #eebe77);
}

.legend-color.rfy {
  background: linear-gradient(135deg, #F56C6C, #f78989);
}

.legend-color.lfz {
  background: linear-gradient(135deg, #E6A23C, #eebe77);
}

.legend-color.rfz {
  background: linear-gradient(135deg, #F56C6C, #f78989);
}

.grip-chart-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f3f4;
  flex-wrap: wrap;
  gap: 16px;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.chart-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.chart-container {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.grip-chart {
  height: 100%;
  width: 100%;
}

@media (max-width: 1200px) {
  .data-overview {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .summary-grid {
    flex-direction: column;
    gap: 16px;
  }
  
  .summary-divider {
    width: 100%;
    height: 1px;
  }
}

@media (max-width: 768px) {
  .grip-strength {
    padding: 16px;
  }
  
  .data-card {
    padding: 20px;
  }
  
  .value {
    font-size: 28px;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>