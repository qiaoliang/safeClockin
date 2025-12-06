// 生产环境配置
export default {
  // 环境标识
  env: 'prod',
  
  // API 配置
  api: {
    baseURL: 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com', // 生产环境API地址
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