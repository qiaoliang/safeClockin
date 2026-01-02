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

  // 腾讯地图配置
  map: {
    key: 'EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP', // 腾讯地图开发者密钥
    secret: 'oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp' // 腾讯地图签名密钥
  },

  // 功能开关
  features: {
    enableMockData: true,
    enableDebugLog: true,
    enableErrorReporting: false
  }
}