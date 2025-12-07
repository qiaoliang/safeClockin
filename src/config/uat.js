// UAT环境配置
export default {
  // 环境标识
  env: 'uat',
  
  // API 配置
  api: {
    baseURL: 'http://localhost:8080', // UAT环境API地址
    timeout: 20000
  },
  
  // 应用配置
  app: {
    name: '安全守护',
    version: '1.0.0',
    debug: false
  },
  
  // 功能开关
  features: {
    enableMockData: false,
    enableDebugLog: false,
    enableErrorReporting: true
  }
}