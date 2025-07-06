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
export const getSpeedData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟速度数据
      const data = {
        current: Math.random() * 5, // 0-5 km/h
        average: Math.random() * 3 + 1, // 1-4 km/h
        max: Math.random() * 3 + 4, // 4-7 km/h
        distance: Math.random() * 5 + 1, // 1-6 km
        duration: Math.floor(Math.random() * 120) + 30, // 30-150分钟
        history: Array.from({ length: 60 }, (_, i) => ({
          time: Date.now() - (60 - i) * 60000,
          speed: Math.random() * 4,
          distance: Math.random() * 0.1
        })),
        status: 'normal'
      }
      resolve(data)
    }, 300)
  })
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