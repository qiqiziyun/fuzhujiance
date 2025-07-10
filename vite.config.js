import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  // 添加这些配置来处理 ES 模块
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'echarts', 'vue-echarts']
  }
})