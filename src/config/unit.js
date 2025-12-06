// 单元测试环境配置
export default {
  // 环境标识
  env: 'unit',
  
  // API 配置
  api: {
    baseURL: 'http://localhost:8080', // 单元测试通常使用本地服务
    timeout: 10000
  },
  
  // 应用配置
  app: {
    name: '安全守护',
    version: '1.0.0',
    debug: true
  },
  
  // 功能开关
  features: {
    enableMockData: true,
    enableDebugLog: true,
    enableErrorReporting: false
  }
}