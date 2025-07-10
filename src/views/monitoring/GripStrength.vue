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
      </div>
      
      <div class="data-card stats">
        <div class="card-header">
          <h3>握力统计</h3>
          <div class="update-time">{{ formatTime(lastUpdate) }}</div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ ((leftData.max || 0) + (rightData.max || 0)).toFixed(1) }}</div>
            <div class="stat-label">最大握力</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ ((leftData.average || 0) + (rightData.average || 0)).toFixed(1) }}</div>
            <div class="stat-label">平均握力</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 握力图表 -->
    <div class="grip-chart-section">
      <div class="chart-header">
        <h2>握力变化趋势</h2>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color left"></div>
            <span>左手握力</span>
          </div>
          <div class="legend-item">
            <div class="legend-color right"></div>
            <span>右手握力</span>
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
            <div class="legend-color lfy"></div>
            <span>LFY 握力</span>
          </div>
          <div class="legend-item">
            <div class="legend-color rfy"></div>
            <span>RFY 握力</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getDualGripDataFromUnifiedAPI, getLfyRfyGripData } from '@/api/monitoring' // 导入新的接口
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

// 定时器
let updateTimer = null

// 图表配置
const chartOption = computed(() => {
  console.log('左手数据:', leftData.value.history)
  console.log('右手数据:', rightData.value.history)
  
  // 处理左手数据
  const leftTimeValueMap = new Map()
  if (leftData.value.history && leftData.value.history.length > 0) {
    leftData.value.history.forEach(item => {
      if (item.timestamp && item.value !== undefined) {
        // 使用完整的时间戳，而不是只显示时分
        const timeKey = new Date(item.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit', 
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        leftTimeValueMap.set(timeKey, Number(item.value))
      }
    })
  }
  
  // 处理右手数据
  const rightTimeValueMap = new Map()
  if (rightData.value.history && rightData.value.history.length > 0) {
    rightData.value.history.forEach(item => {
      if (item.timestamp && item.value !== undefined) {
        // 使用完整的时间戳，而不是只显示时分
        const timeKey = new Date(item.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })
        rightTimeValueMap.set(timeKey, Number(item.value))
      }
    })
  }
  
  // 合并时间轴（取并集并按时间排序）
  const allTimes = [...new Set([...leftTimeValueMap.keys(), ...rightTimeValueMap.keys()])]
    .sort((a, b) => {
      // 按实际时间排序
      const timeA = new Date(a.replace(/\/(\d{2})\/(\d{2})/, '/20$2/$1')).getTime()
      const timeB = new Date(b.replace(/\/(\d{2})\/(\d{2})/, '/20$2/$1')).getTime()
      return timeA - timeB
    })
  
  // 显示所有数据点，不再过滤
  const leftSeriesData = []
  const rightSeriesData = []
  
  allTimes.forEach((time) => {
    leftSeriesData.push(leftTimeValueMap.get(time) || null)
    rightSeriesData.push(rightTimeValueMap.get(time) || null)
  })
  
  // 计算时间标签显示间隔，避免过于拥挤
  const labelInterval = Math.max(1, Math.ceil(allTimes.length / 15)) // 最多显示15个标签
  
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
      data: allTimes, // 使用所有时间点
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        color: '#303133',
        margin: 15,
        interval: labelInterval - 1, // 动态计算标签间隔
        formatter: function(value) {
          // 简化时间显示格式
          if (value) {
            const parts = value.split(' ')
            if (parts.length >= 2) {
              return parts[0] + '\n' + parts[1] // 日期和时间分两行显示
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
      min: 0, // 确保Y轴从0开始
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
        name: '左手握力',
        type: 'line',
        data: leftSeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        },
        connectNulls: false
      },
      {
        name: '右手握力',
        type: 'line',
        data: rightSeriesData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: '#67C23A',
          width: 2
        },
        itemStyle: {
          color: '#67C23A'
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

// 加载握力数据
const loadGripData = async () => {
  try {
    chartLoading.value = true
    const data = await getDualGripDataFromUnifiedAPI() // 使用新的接口
    
    leftData.value = data.left
    rightData.value = data.right
    lastUpdate.value = Date.now()
    
    console.log('加载的握力数据:', data)
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
  
  // 处理 LFY 数据
  const lfyTimeValueMap = new Map()
  if (lfyData.value.history && lfyData.value.history.length > 0) {
    lfyData.value.history.forEach(item => {
      if (item.timestamp && item.value !== undefined) {
        const timeKey = new Date(item.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit', 
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        lfyTimeValueMap.set(timeKey, Number(item.value))
      }
    })
  }
  
  // 处理 RFY 数据
  const rfyTimeValueMap = new Map()
  if (rfyData.value.history && rfyData.value.history.length > 0) {
    rfyData.value.history.forEach(item => {
      if (item.timestamp && item.value !== undefined) {
        const timeKey = new Date(item.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })
        rfyTimeValueMap.set(timeKey, Number(item.value))
      }
    })
  }
  
  // 合并时间轴（取并集并按时间排序）
  const allTimes = [...new Set([...lfyTimeValueMap.keys(), ...rfyTimeValueMap.keys()])]
    .sort((a, b) => {
      const timeA = new Date(a.replace(/(\d{2})\/(\d{2})\/(\d{2})/, '/20$2/$1')).getTime()
      const timeB = new Date(b.replace(/(\d{2})\/(\d{2})\/(\d{2})/, '/20$2/$1')).getTime()
      return timeA - timeB
    })
  
  // 显示所有数据点
  const lfySeriesData = []
  const rfySeriesData = []
  
  allTimes.forEach((time) => {
    lfySeriesData.push(lfyTimeValueMap.get(time) || null)
    rfySeriesData.push(rfyTimeValueMap.get(time) || null)
  })
  
  // 计算时间标签显示间隔
  const labelInterval = Math.max(1, Math.ceil(allTimes.length / 15))
  
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
        fontSize: 11,
        color: '#303133',
        margin: 15,
        interval: labelInterval - 1,
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

// 组件挂载时初始化
onMounted(() => {
  loadGripData()
  loadLfyRfyGripData() // 加载新的数据
  // 每10分钟自动刷新数据
  updateTimer = setInterval(() => {
    loadGripData()
    loadLfyRfyGripData() // 同时刷新新的数据
  }, 600000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
})
</script>

<style scoped>
/* ... 保留原有样式 ... */

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
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.left {
  background: #409EFF;
}

.legend-color.right {
  background: #67C23A;
}

.legend-color.lfy {
  background: #E6A23C;
}

.legend-color.rfy {
  background: #F56C6C;
}

.grip-chart-section {
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

.chart-container {
  height: 400px;
  width: 100%;
}

.grip-chart {
  height: 100%;
  width: 100%;
}
</style>