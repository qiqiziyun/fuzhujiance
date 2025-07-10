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

// 获取左手握力数据
// export const getLeftGripData = async () => {
//   try {
//     const response = await request.get('/sensor/lfx')
//     console.log('左手握力数据:', response)

//     if (!response || !Array.isArray(response)) {
//       throw new Error('左手握力数据格式错误')
//     }

//     // 按时间排序
//     const sortedData = response.sort((a, b) => {
//       const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
//       const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
//       return timeA - timeB
//     })

//     // 转换数据格式
//     const history = sortedData.map(item => ({
//       time: new Date(item.time || item.timestamp || item.createTime || Date.now()).getTime(),
//       value: Number(item.lfx || item.force || item.value || 0),
//       timestamp: item.time || item.timestamp || item.createTime || new Date().toISOString()
//     }))

//     const values = history.map(item => item.value)
//     const current = values.length > 0 ? values[values.length - 1] : 0
//     const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
//     const max = values.length > 0 ? Math.max(...values) : 0

//     return {
//       current,
//       average,
//       max,
//       history,
//       status: 'normal'
//     }
//   } catch (error) {
//     console.error('获取左手握力数据失败:', error)
//     return {
//       current: 0,
//       average: 0,
//       max: 0,
//       history: [],
//       status: 'error'
//     }
//   }
// }

// 获取右手握力数据
// export const getRightGripData = async () => {
//   try {
//     const response = await request.get('/sensor/rfx')
//     console.log('右手握力数据:', response)

//     if (!response || !Array.isArray(response)) {
//       throw new Error('右手握力数据格式错误')
//     }

//     // 按时间排序
//     const sortedData = response.sort((a, b) => {
//       const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
//       const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
//       return timeA - timeB
//     })

//     // 转换数据格式
//     const history = sortedData.map(item => ({
//       time: new Date(item.time || item.timestamp || item.createTime || Date.now()).getTime(),
//       value: Number(item.rfx || item.force || item.value || 0),
//       timestamp: item.time || item.timestamp || item.createTime || new Date().toISOString()
//     }))

//     const values = history.map(item => item.value)
//     const current = values.length > 0 ? values[values.length - 1] : 0
//     const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
//     const max = values.length > 0 ? Math.max(...values) : 0

//     return {
//       current,
//       average,
//       max,
//       history,
//       status: 'normal'
//     }
//   } catch (error) {
//     console.error('获取右手握力数据失败:', error)
//     return {
//       current: 0,
//       average: 0,
//       max: 0,
//       history: [],
//       status: 'error'
//     }
//   }
// }

// 获取双手握力数据（使用统一接口）
export const getDualGripDataFromUnifiedAPI = async () => {
  try {
    const response = await request.get('/sensor/lfx_rfx')
    console.log('双手握力数据:', response)

    if (!response || !Array.isArray(response)) {
      throw new Error('双手握力数据格式错误')
    }

    // 按时间排序
    const sortedData = response.sort((a, b) => {
      const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
      const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
      return timeA - timeB
    })

    // 分别处理左手和右手数据
    const leftHistory = []
    const rightHistory = []

    sortedData.forEach(item => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      const timeValue = new Date(timestamp).getTime()

      // 左手数据
      if (item.lfx !== undefined && item.lfx !== null) {
        leftHistory.push({
          time: timeValue,
          value: Number(item.lfx || 0),
          timestamp: timestamp
        })
      }

      // 右手数据
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
export const getSpeedData = async () => {
  try {
    const speedData = await request.get('/speed/xian')
    console.log('后端返回的原始数据:', speedData)

    // 检查数据格式
    if (!speedData) {
      console.error('后端返回数据为空')
      throw new Error('后端返回数据为空')
    }

    // 如果后端返回的是数组格式
    if (Array.isArray(speedData)) {
      console.log('数据格式：数组，长度:', speedData.length)

      // 检查数组元素格式
      if (speedData.length > 0) {
        console.log('第一个元素:', speedData[0])

        // 按时间排序
        const sortedData = speedData.sort((a, b) => {
          const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
          const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
          return timeA - timeB
        })

        // 移除5分钟间隔过滤，使用全部数据
        console.log(`使用全部数据，共 ${sortedData.length} 条`)

        // 计算统计数据
        const speeds = sortedData.map(item => {
          // 兼容不同的字段名
          return Number(item.speed || item.velocity || item.value || 0)
        })

        const current = speeds.length > 0 ? speeds[speeds.length - 1] : 0
        const average = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
        const max = speeds.length > 0 ? Math.max(...speeds) : 0

        // 转换数据格式以适配前端组件
        const history = sortedData.map(item => {
          const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
          return {
            time: new Date(timestamp).getTime(),
            speed: Number(item.speed || item.velocity || item.value || 0),
            timestamp: timestamp
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
      } else {
        console.log('数组为空，返回默认数据')
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
    } else {
      console.error('数据格式不是数组:', typeof speedData, speedData)
      throw new Error(`期望数组格式，但收到: ${typeof speedData}`)
    }
  } catch (error) {
    console.error('获取速度数据失败:', error)
    console.error('错误详情:', error.message)

    // 如果是网络错误，返回错误状态
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return {
        current: 0,
        average: 0,
        max: 0,
        distance: 0,
        duration: 0,
        history: [],
        status: 'network_error'
      }
    }

    // 返回默认数据以防止页面崩溃
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
    console.log('lfy_rfy握力数据:', response)

    if (!response || !Array.isArray(response)) {
      throw new Error('lfy_rfy握力数据格式错误')
    }

    // 按时间排序
    const sortedData = response.sort((a, b) => {
      const timeA = new Date(a.time || a.timestamp || a.createTime || 0).getTime()
      const timeB = new Date(b.time || b.timestamp || b.createTime || 0).getTime()
      return timeA - timeB
    })

    // 分别处理 lfy 和 rfy 数据
    const lfyHistory = []
    const rfyHistory = []

    sortedData.forEach(item => {
      const timestamp = item.time || item.timestamp || item.createTime || new Date().toISOString()
      const timeValue = new Date(timestamp).getTime()

      // lfy 数据
      if (item.lfy !== undefined && item.lfy !== null) {
        lfyHistory.push({
          time: timeValue,
          value: Number(item.lfy || 0),
          timestamp: timestamp
        })
      }

      // rfy 数据
      if (item.rfy !== undefined && item.rfy !== null) {
        rfyHistory.push({
          time: timeValue,
          value: Number(item.rfy || 0),
          timestamp: timestamp
        })
      }
    })

    // 计算 lfy 统计数据
    const lfyValues = lfyHistory.map(item => item.value)
    const lfyCurrent = lfyValues.length > 0 ? lfyValues[lfyValues.length - 1] : 0
    const lfyAverage = lfyValues.length > 0 ? lfyValues.reduce((a, b) => a + b, 0) / lfyValues.length : 0
    const lfyMax = lfyValues.length > 0 ? Math.max(...lfyValues) : 0

    // 计算 rfy 统计数据
    const rfyValues = rfyHistory.map(item => item.value)
    const rfyCurrent = rfyValues.length > 0 ? rfyValues[rfyValues.length - 1] : 0
    const rfyAverage = rfyValues.length > 0 ? rfyValues.reduce((a, b) => a + b, 0) / rfyValues.length : 0
    const rfyMax = rfyValues.length > 0 ? Math.max(...rfyValues) : 0

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