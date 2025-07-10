// 创建图表配置文件
export const CHART_CONFIG = {
  TIME_INTERVALS: {
    '1h': { interval: 5 * 60 * 1000, count: 12 },
    '6h': { interval: 30 * 60 * 1000, count: 12 },
    '24h': { interval: 2 * 60 * 60 * 1000, count: 12 }
  },
  UPDATE_INTERVAL: 5000,
  CHART_COLORS: {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c'
  }
}