export interface SpeedData {
  time: number | string
  speed: number
  distance?: number
}

export interface ChartConfig {
  timeRange: '1h' | '6h' | '24h'
  interval: number
  count: number
}