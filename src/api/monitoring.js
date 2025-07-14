import request from './request'

// 获取握力数据
export const getGripStrengthData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟握力数据
      const data = {
        current: Math.floor(Math.random() * 50) + 20, // 20-70kg
        history: Array.from({ length: 24 }, (_, i) => ({
          time: `${String(i).padStart(2, '0')}:00`,
          value: Math.floor(Math.random() * 30) + 30
        })),
        average: Math.floor(Math.random() * 20) + 40,
        max: Math.floor(Math.random() * 20) + 60,
        status: Math.random() > 0.3 ? 'normal' : 'warning'
      }
      resolve(data)
    }, 300)
  })
}

// 获取双手握力数据（从统一API）
export const getDualGripDataFromUnifiedAPI = async () => {
  try {
    const response = await request.get('/sensor/lfx_rfx')
    console.log('后端返回的原始数据:', response)

    // 检查响应结构
    let data = response
    if (response && response.data && Array.isArray(response.data)) {
      data = response.data
    } else if (!Array.isArray(response)) {
      console.error('后端返回的数据不是数组格式:', response)
      throw new Error('数据格式错误')
    }

    console.log('处理的数据数组:', data)
    console.log('数据长度:', data.length)

    if (data.length === 0) {
      return {
        left: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        right: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        combined: { current: 0, average: 0, max: 0, status: 'normal' }
      }
    }

    // 完全按照原始顺序处理数据，不进行任何排序
    const leftHistory = []
    const rightHistory = []

    data.forEach((item, index) => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      const timeValue = new Date(timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // 左手数据 - 完全按照原始顺序
      leftHistory.push({
        time: timeValue,
        value: Number(item.lfx),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })

      // 右手数据 - 完全按照原始顺序
      rightHistory.push({
        time: timeValue,
        value: Number(item.rfx),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })
    })

    // 计算左手统计数据
    const leftValues = leftHistory.map(item => item.value)
    const leftCurrent = leftValues.length > 0 ? leftValues[leftValues.length - 1] : 0
    const leftAverage = leftValues.length > 0 ? leftValues.reduce((a, b) => a + b, 0) / leftValues.length : 0
    const leftMax = leftValues.length > 0 ? Math.max(...leftValues) : 0

    // 计算右手统计数据
    const rightValues = rightHistory.map(item => item.value)
    const rightCurrent = rightValues.length > 0 ? rightValues[rightValues.length - 1] : 0
    const rightAverage = rightValues.length > 0 ? rightValues.reduce((a, b) => a + b, 0) / rightValues.length : 0
    const rightMax = rightValues.length > 0 ? Math.max(...rightValues) : 0

    console.log(`左手数据点: ${leftHistory.length}, 右手数据点: ${rightHistory.length}`)
    console.log('左手第一个数据点:', leftHistory[0])
    console.log('右手第一个数据点:', rightHistory[0])
    console.log('验证 - 左手第一个值:', leftHistory[0]?.value)
    console.log('验证 - 右手第一个值:', rightHistory[0]?.value)

    return {
      left: {
        current: leftCurrent,
        average: leftAverage,
        max: leftMax,
        history: leftHistory,
        status: 'normal'
      },
      right: {
        current: rightCurrent,
        average: rightAverage,
        max: rightMax,
        history: rightHistory,
        status: 'normal'
      },
      combined: {
        current: leftCurrent + rightCurrent,
        average: leftAverage + rightAverage,
        max: leftMax + rightMax,
        status: 'normal'
      }
    }
  } catch (error) {
    console.error('获取双手握力数据失败:', error)
    return {
      left: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      right: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      combined: { current: 0, average: 0, max: 0, status: 'error' }
    }
  }
}

// 获取姿态角数据
export const getPostureAngleData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟姿态角数据
      const data = {
        pitch: (Math.random() - 0.5) * 20, // -10到10度
        roll: (Math.random() - 0.5) * 20,
        yaw: (Math.random() - 0.5) * 360,
        history: Array.from({ length: 50 }, (_, i) => ({
          time: Date.now() - (50 - i) * 1000,
          pitch: (Math.random() - 0.5) * 20,
          roll: (Math.random() - 0.5) * 20,
          yaw: (Math.random() - 0.5) * 360
        })),
        status: Math.random() > 0.2 ? 'normal' : 'abnormal'
      }
      resolve(data)
    }, 300)
  })
}

// 获取速度数据
// 获取速度数据 - 修改为使用新的查询接口
export const getSpeedData = async (params = {}) => {
  try {
    // 使用新的查询接口
    const response = await request.get('/speed/query', {
      params: {
        startDate: params.startDate,
        endDate: params.endDate
      }
    })

    console.log('后端返回的速度查询数据:', response)

    // 检查数据格式
    if (!response) {
      console.error('后端返回数据为空')
      throw new Error('后端返回数据为空')
    }

    let speedData = response
    // 如果响应包装在data字段中
    if (response.data && Array.isArray(response.data)) {
      speedData = response.data
    } else if (!Array.isArray(response)) {
      console.error('后端返回的数据不是数组格式:', response)
      throw new Error('数据格式错误')
    }

    if (speedData.length === 0) {
      return {
        current: 0,
        average: 0,
        max: 0,
        distance: 0,
        duration: 0,
        history: [],
        status: 'normal'
      }
    }

    // 按时间排序
    const sortedData = speedData.sort((a, b) => {
      const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
      const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
      return timeA - timeB
    })

    console.log(`处理速度数据，共 ${sortedData.length} 条`)

    // 计算统计数据
    const speeds = sortedData.map(item => {
      // 兼容不同的字段名
      return Number(item.speed || item.velocity || item.value || 0)
    })

    const current = speeds.length > 0 ? speeds[speeds.length - 1] : 0
    const average = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
    const max = speeds.length > 0 ? Math.max(...speeds) : 0

    // 转换数据格式以适配前端图表组件
    const history = sortedData.map(item => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      return {
        timestamp: timestamp,
        speed: Number(item.speed || item.velocity || item.value || 0),
        time: new Date(timestamp).getTime()
      }
    })

    // 计算总距离和总时长
    let totalDistance = 0
    let totalDuration = 0

    if (history.length > 1) {
      // 计算总时长（最后时间 - 第一时间）
      totalDuration = (history[history.length - 1].time - history[0].time) / 1000 // 转换为秒
      // 简单估算总距离（平均速度 * 时间）
      totalDistance = (average * totalDuration) / 3600 // 转换为公里
    }

    return {
      current,
      average,
      max,
      distance: totalDistance,
      duration: totalDuration,
      history,
      status: 'normal'
    }
  } catch (error) {
    console.error('获取速度数据失败:', error)
    return {
      current: 0,
      average: 0,
      max: 0,
      distance: 0,
      duration: 0,
      history: [],
      status: 'error'
    }
  }
}

// 获取GPS位置数据
export const getGPSData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟GPS数据（以北京为中心）
      const baseLatitude = 39.9042
      const baseLongitude = 116.4074

      const data = {
        current: {
          latitude: baseLatitude + (Math.random() - 0.5) * 0.01,
          longitude: baseLongitude + (Math.random() - 0.5) * 0.01,
          accuracy: Math.floor(Math.random() * 10) + 3, // 3-13米
          timestamp: Date.now()
        },
        track: Array.from({ length: 20 }, (_, i) => ({
          latitude: baseLatitude + (Math.random() - 0.5) * 0.02,
          longitude: baseLongitude + (Math.random() - 0.5) * 0.02,
          timestamp: Date.now() - (20 - i) * 300000 // 5分钟间隔
        })),
        address: '北京市朝阳区某某街道',
        status: Math.random() > 0.1 ? 'connected' : 'disconnected'
      }
      resolve(data)
    }, 300)
  })
}

// 获取传感器数据
export const getSensorData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟传感器数据表格
      const data = Array.from({ length: 20 }, (_, i) => {
        const id = 16271 + i;
        return {
          id,
          lfx: Math.floor(Math.random() * 100) + 200,
          lfy: Math.floor(Math.random() * 100) + 150,
          lfz: Math.floor(Math.random() * 50) + 120,
          rfx: Math.floor(Math.random() * 200) + 600,
          rfy: Math.floor(Math.random() * 200) + 500,
          rfz: Math.floor(Math.random() * 200) + 400,
          roll: (Math.random() - 0.5) * 200,
          yaw: (Math.random() - 0.5) * 40,
          pitch: (Math.random() - 0.5) * 20,
          speed: 0,
          time: new Date(Date.now() - (20 - i) * 1000).toISOString().replace('T', ' ').substring(0, 19)
        };
      });
      resolve(data);
    }, 300);
  });
};

// 获取仪表盘概览数据
export const getDashboardData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = {
        deviceStatus: Math.random() > 0.1 ? 'online' : 'offline',
        batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
        todayDistance: Math.random() * 3 + 1, // 1-4km
        todayDuration: Math.floor(Math.random() * 60) + 30, // 30-90分钟
        alertCount: Math.floor(Math.random() * 3), // 0-2个告警
        lastUpdate: Date.now()
      }
      resolve(data)
    }, 300)
  })
}

// 获取 lfy_rfy 握力数据
export const getLfyRfyGripData = async () => {
  try {
    const response = await request.get('/sensor/lfy_rfy')
    console.log('后端返回的原始lfy_rfy数据:', response)

    // 检查响应结构
    let data = response
    if (response && response.data && Array.isArray(response.data)) {
      data = response.data
    } else if (!Array.isArray(response)) {
      console.error('后端返回的lfy_rfy数据不是数组格式:', response)
      throw new Error('lfy_rfy数据格式错误')
    }

    console.log('处理的lfy_rfy数据数组:', data)
    console.log('lfy_rfy数据长度:', data.length)

    if (data.length === 0) {
      return {
        lfy: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        rfy: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        combined: { current: 0, average: 0, max: 0, status: 'normal' }
      }
    }

    // 完全按照原始顺序处理数据，不进行任何排序
    const lfyHistory = []
    const rfyHistory = []

    data.forEach((item, index) => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      const timeValue = new Date(timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // LFY数据 - 完全按照原始顺序
      lfyHistory.push({
        time: timeValue,
        value: Number(item.lfy),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })

      // RFY数据 - 完全按照原始顺序
      rfyHistory.push({
        time: timeValue,
        value: Number(item.rfy),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })
    })

    // 计算LFY统计数据
    const lfyValues = lfyHistory.map(item => item.value)
    const lfyCurrent = lfyValues.length > 0 ? lfyValues[lfyValues.length - 1] : 0
    const lfyAverage = lfyValues.length > 0 ? lfyValues.reduce((a, b) => a + b, 0) / lfyValues.length : 0
    const lfyMax = lfyValues.length > 0 ? Math.max(...lfyValues) : 0

    // 计算RFY统计数据
    const rfyValues = rfyHistory.map(item => item.value)
    const rfyCurrent = rfyValues.length > 0 ? rfyValues[rfyValues.length - 1] : 0
    const rfyAverage = rfyValues.length > 0 ? rfyValues.reduce((a, b) => a + b, 0) / rfyValues.length : 0
    const rfyMax = rfyValues.length > 0 ? Math.max(...rfyValues) : 0

    console.log(`LFY数据点: ${lfyHistory.length}, RFY数据点: ${rfyHistory.length}`)
    console.log('LFY第一个数据点:', lfyHistory[0])
    console.log('RFY第一个数据点:', rfyHistory[0])
    console.log('验证 - LFY第一个值:', lfyHistory[0]?.value)
    console.log('验证 - RFY第一个值:', rfyHistory[0]?.value)

    return {
      lfy: {
        current: lfyCurrent,
        average: lfyAverage,
        max: lfyMax,
        history: lfyHistory,
        status: 'normal'
      },
      rfy: {
        current: rfyCurrent,
        average: rfyAverage,
        max: rfyMax,
        history: rfyHistory,
        status: 'normal'
      },
      combined: {
        current: lfyCurrent + rfyCurrent,
        average: lfyAverage + rfyAverage,
        max: lfyMax + rfyMax,
        status: 'normal'
      }
    }
  } catch (error) {
    console.error('获取lfy_rfy握力数据失败:', error)
    return {
      lfy: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      rfy: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      combined: { current: 0, average: 0, max: 0, status: 'error' }
    }
  }
}

// 获取所有 LFX_RFX 握力数据（参考速度数据获取方式）
export const getAllLfxRfxGripData = async () => {
  try {
    const gripData = await request.get('/sensor/lfx_rfx')
    console.log('后端返回的原始握力数据:', gripData)

    // 检查数据格式
    if (!gripData) {
      console.error('后端返回握力数据为空')
      throw new Error('后端返回握力数据为空')
    }

    // 如果后端返回的是数组格式
    if (Array.isArray(gripData)) {
      console.log('握力数据格式：数组，长度:', gripData.length)

      // 检查数组元素格式
      if (gripData.length > 0) {
        console.log('第一个握力元素:', gripData[0])

        // 按时间排序
        const sortedData = gripData.sort((a, b) => {
          const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
          const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
          return timeA - timeB
        })

        // 使用全部数据，不进行过滤
        console.log(`使用全部握力数据，共 ${sortedData.length} 条`)

        // 分别处理左手和右手数据
        const leftHistory = []
        const rightHistory = []

        sortedData.forEach(item => {
          const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
          const timeValue = new Date(timestamp).getTime()

          // 左手数据 (LFX)
          if (item.lfx !== undefined && item.lfx !== null) {
            leftHistory.push({
              time: timeValue,
              value: Number(item.lfx || 0),
              timestamp: timestamp
            })
          }

          // 右手数据 (RFX)
          if (item.rfx !== undefined && item.rfx !== null) {
            rightHistory.push({
              time: timeValue,
              value: Number(item.rfx || 0),
              timestamp: timestamp
            })
          }
        })

        // 计算左手统计数据
        const leftValues = leftHistory.map(item => item.value)
        const leftCurrent = leftValues.length > 0 ? leftValues[leftValues.length - 1] : 0
        const leftAverage = leftValues.length > 0 ? leftValues.reduce((a, b) => a + b, 0) / leftValues.length : 0
        const leftMax = leftValues.length > 0 ? Math.max(...leftValues) : 0

        // 计算右手统计数据
        const rightValues = rightHistory.map(item => item.value)
        const rightCurrent = rightValues.length > 0 ? rightValues[rightValues.length - 1] : 0
        const rightAverage = rightValues.length > 0 ? rightValues.reduce((a, b) => a + b, 0) / rightValues.length : 0
        const rightMax = rightValues.length > 0 ? Math.max(...rightValues) : 0

        return {
          left: {
            current: leftCurrent,
            average: leftAverage,
            max: leftMax,
            history: leftHistory,
            status: 'normal'
          },
          right: {
            current: rightCurrent,
            average: rightAverage,
            max: rightMax,
            history: rightHistory,
            status: 'normal'
          },
          combined: {
            current: leftCurrent + rightCurrent,
            average: leftAverage + rightAverage,
            max: leftMax + rightMax,
            status: 'normal'
          }
        }
      } else {
        console.log('握力数组为空，返回默认数据')
        return {
          left: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
          right: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
          combined: { current: 0, average: 0, max: 0, status: 'normal' }
        }
      }
    } else {
      console.error('握力数据格式不是数组:', typeof gripData, gripData)
      throw new Error(`期望数组格式，但收到: ${typeof gripData}`)
    }
  } catch (error) {
    console.error('获取握力数据失败:', error)
    console.error('错误详情:', error.message)

    // 如果是网络错误，返回错误状态
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return {
        left: { current: 0, average: 0, max: 0, history: [], status: 'network_error' },
        right: { current: 0, average: 0, max: 0, history: [], status: 'network_error' },
        combined: { current: 0, average: 0, max: 0, status: 'network_error' }
      }
    }

    // 返回默认数据以防止页面崩溃
    return {
      left: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      right: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      combined: { current: 0, average: 0, max: 0, status: 'error' }
    }
  }
}

// 获取 lfz_rfz 握力数据
export const getLfzRfzGripData = async () => {
  try {
    const response = await request.get('/sensor/lfz_rfz')
    console.log('后端返回的原始lfz_rfz数据:', response)

    // 检查响应结构
    let data = response
    if (response && response.data && Array.isArray(response.data)) {
      data = response.data
    } else if (!Array.isArray(response)) {
      console.error('后端返回的lfz_rfz数据不是数组格式:', response)
      throw new Error('lfz_rfz数据格式错误')
    }

    console.log('处理的lfz_rfz数据数组:', data)
    console.log('lfz_rfz数据长度:', data.length)

    if (data.length === 0) {
      return {
        lfz: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        rfz: { current: 0, average: 0, max: 0, history: [], status: 'normal' },
        combined: { current: 0, average: 0, max: 0, status: 'normal' }
      }
    }

    // 完全按照原始顺序处理数据，不进行任何排序
    const lfzHistory = []
    const rfzHistory = []

    data.forEach((item, index) => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      const timeValue = new Date(timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // LFZ数据 - 完全按照原始顺序
      lfzHistory.push({
        time: timeValue,
        value: Number(item.lfz),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })

      // RFZ数据 - 完全按照原始顺序
      rfzHistory.push({
        time: timeValue,
        value: Number(item.rfz),
        timestamp: timestamp,
        originalIndex: index,
        originalData: item
      })
    })

    // 计算LFZ统计数据
    const lfzValues = lfzHistory.map(item => item.value)
    const lfzCurrent = lfzValues.length > 0 ? lfzValues[lfzValues.length - 1] : 0
    const lfzAverage = lfzValues.length > 0 ? lfzValues.reduce((a, b) => a + b, 0) / lfzValues.length : 0
    const lfzMax = lfzValues.length > 0 ? Math.max(...lfzValues) : 0

    // 计算RFZ统计数据
    const rfzValues = rfzHistory.map(item => item.value)
    const rfzCurrent = rfzValues.length > 0 ? rfzValues[rfzValues.length - 1] : 0
    const rfzAverage = rfzValues.length > 0 ? rfzValues.reduce((a, b) => a + b, 0) / rfzValues.length : 0
    const rfzMax = rfzValues.length > 0 ? Math.max(...rfzValues) : 0

    console.log(`LFZ数据点: ${lfzHistory.length}, RFZ数据点: ${rfzHistory.length}`)
    console.log('LFZ第一个数据点:', lfzHistory[0])
    console.log('RFZ第一个数据点:', rfzHistory[0])
    console.log('验证 - LFZ第一个值:', lfzHistory[0]?.value)
    console.log('验证 - RFZ第一个值:', rfzHistory[0]?.value)

    return {
      lfz: {
        current: lfzCurrent,
        average: lfzAverage,
        max: lfzMax,
        history: lfzHistory,
        status: 'normal'
      },
      rfz: {
        current: rfzCurrent,
        average: rfzAverage,
        max: rfzMax,
        history: rfzHistory,
        status: 'normal'
      },
      combined: {
        current: lfzCurrent + rfzCurrent,
        average: lfzAverage + rfzAverage,
        max: lfzMax + rfzMax,
        status: 'normal'
      }
    }
  } catch (error) {
    console.error('获取lfz_rfz握力数据失败:', error)
    return {
      lfz: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      rfz: { current: 0, average: 0, max: 0, history: [], status: 'error' },
      combined: { current: 0, average: 0, max: 0, status: 'error' }
    }
  }
}




