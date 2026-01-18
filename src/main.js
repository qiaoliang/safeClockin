import { createSSRApp } from 'vue'
import App from './App.vue'
import pinia from './store'

// 导入测试辅助函数（仅开发环境）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('./utils/test-helpers.js')
}

export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)

  return {
    app
  }
}