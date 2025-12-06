// 功能测试环境配置
export default {
  // 环境标识
  env: 'func',
  
  // API 配置
  api: {
    baseURL: 'http://localhost:8080', // 功能测试环境
    timeout: 15000
  },
  
  // 应用配置
  app: {
    name: '安全守护',
    version: '1.0.0',
    debug: true
  },
  
  // 功能开关
  features: {
    enableMockData: false,
    enableDebugLog: true,
    enableErrorReporting: true
  }
}