export const performanceMonitor = {
  measureRenderTime: (componentName, fn) => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`${componentName} 渲染耗时: ${end - start}ms`)
    return result
  }
}