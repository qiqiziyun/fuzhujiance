// API 基础配置
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const userStore = useUserStore()
    const token = userStore.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime
    console.log(`API请求耗时: ${duration}ms`)
    
    // 统一处理响应数据
    const { data, code, message } = response.data
    
    if (code === 200 || code === 0) {
      return data
    } else {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  (error) => {
    console.error('响应拦截器错误:', error)
    
    // 处理不同的错误状态
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 通用请求方法
export const request = {
  get(url, params = {}, config = {}) {
    return api.get(url, { params, ...config })
  },
  
  post(url, data = {}, config = {}) {
    return api.post(url, data, config)
  },
  
  put(url, data = {}, config = {}) {
    return api.put(url, data, config)
  },
  
  patch(url, data = {}, config = {}) {
    return api.patch(url, data, config)
  },
  
  delete(url, config = {}) {
    return api.delete(url, config)
  },
  
  upload(url, formData, config = {}) {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },
  
  download(url, params = {}, config = {}) {
    return api.get(url, {
      params,
      responseType: 'blob',
      ...config
    })
  }
}

// 导出 axios 实例
export default api

// API 状态码常量
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
}

// API 响应处理工具
export const apiUtils = {
  // 处理分页数据
  handlePagination(response) {
    return {
      data: response.data || [],
      total: response.total || 0,
      page: response.page || 1,
      pageSize: response.pageSize || 10,
      totalPages: Math.ceil((response.total || 0) / (response.pageSize || 10))
    }
  },
  
  // 处理表格数据
  handleTableData(response) {
    if (Array.isArray(response)) {
      return response
    }
    return response.data || []
  },
  
  // 处理选项数据
  handleOptions(response, labelKey = 'label', valueKey = 'value') {
    if (Array.isArray(response)) {
      return response.map(item => ({
        label: item[labelKey],
        value: item[valueKey]
      }))
    }
    return []
  },
  
  // 格式化错误信息
  formatError(error) {
    if (error.response && error.response.data) {
      return error.response.data.message || '请求失败'
    }
    return error.message || '未知错误'
  }
}

// 请求重试配置
export const retryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return error.code === 'NETWORK_ERROR' || 
           (error.response && error.response.status >= 500)
  }
}

// 添加请求重试功能
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    
    if (!config || !retryConfig.retryCondition(error)) {
      return Promise.reject(error)
    }
    
    config.__retryCount = config.__retryCount || 0
    
    if (config.__retryCount >= retryConfig.retries) {
      return Promise.reject(error)
    }
    
    config.__retryCount += 1
    
    const delay = retryConfig.retryDelay * Math.pow(2, config.__retryCount - 1)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return api(config)
  }
)

// 取消请求的控制器
export const cancelTokenSource = () => {
  return axios.CancelToken.source()
}

// 检查请求是否被取消
export const isCancel = axios.isCancel

// 批量请求
export const batchRequest = (requests) => {
  return Promise.allSettled(requests)
}

// 并发请求控制
export const concurrentRequest = async (requests, limit = 5) => {
  const results = []
  
  for (let i = 0; i < requests.length; i += limit) {
    const batch = requests.slice(i, i + limit)
    const batchResults = await Promise.allSettled(batch)
    results.push(...batchResults)
  }
  
  return results
}

// 请求缓存
const requestCache = new Map()

export const cachedRequest = (key, requestFn, ttl = 5 * 60 * 1000) => {
  const cached = requestCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data)
  }
  
  return requestFn().then(data => {
    requestCache.set(key, {
      data,
      timestamp: Date.now()
    })
    return data
  })
}

// 清除缓存
export const clearCache = (key) => {
  if (key) {
    requestCache.delete(key)
  } else {
    requestCache.clear()
  }
}

// 请求队列管理
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent
    this.running = 0
    this.queue = []
  }
  
  add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject
      })
      this.process()
    })
  }
  
  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }
    
    this.running++
    const { requestFn, resolve, reject } = this.queue.shift()
    
    try {
      const result = await requestFn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.running--
      this.process()
    }
  }
}

export const requestQueue = new RequestQueue()

// 请求监控
export const requestMonitor = {
  requests: [],
  
  add(config) {
    this.requests.push({
      url: config.url,
      method: config.method,
      timestamp: Date.now(),
      status: 'pending'
    })
  },
  
  update(config, status, duration) {
    const request = this.requests.find(r => 
      r.url === config.url && 
      r.method === config.method && 
      r.status === 'pending'
    )
    
    if (request) {
      request.status = status
      request.duration = duration
    }
  },
  
  getStats() {
    const total = this.requests.length
    const success = this.requests.filter(r => r.status === 'success').length
    const failed = this.requests.filter(r => r.status === 'failed').length
    const pending = this.requests.filter(r => r.status === 'pending').length
    
    const avgDuration = this.requests
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / 
      this.requests.filter(r => r.duration).length || 0
    
    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? (success / total * 100).toFixed(2) : 0,
      avgDuration: avgDuration.toFixed(2)
    }
  },
  
  clear() {
    this.requests = []
  }
}

// 环境配置
export const envConfig = {
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    debug: true
  },
  production: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
    debug: false
  },
  test: {
    baseURL: 'http://test-api.example.com',
    timeout: 8000,
    debug: true
  }
}

// 获取当前环境配置
export const getCurrentEnvConfig = () => {
  const env = import.meta.env.MODE || 'development'
  return envConfig[env] || envConfig.development
}