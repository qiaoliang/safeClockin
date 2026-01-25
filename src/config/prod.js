// 生产环境配置
export default {
  // 环境标识
  env: 'prod',

  // API 配置
  api: {
    baseURL: 'https://www.leadagile.cn', // 生产环境API地址
    timeout: 20000
  },

  // 应用配置
  app: {
    name: '安全守护',
    version: '1.0.0',
    debug: false
  },

  // 腾讯地图配置
  map: {
    key: 'EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP', // 腾讯地图开发者密钥
    secret: 'oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp' // 腾讯地图签名密钥
  },

  // 功能开关
  features: {
    enableMockData: false,
    enableDebugLog: false,
    enableErrorReporting: true
  }
}