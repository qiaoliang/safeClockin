// 配置文件入口 - prod 环境
// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 直接返回 prod 配置
const config = prodConfig

// 导出环境信息
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'

// 导出配置对象
export default config

// 便捷的配置获取函数
export function getAPIBaseURL() {
  return config.api.baseURL
}

export function getAPITimeout() {
  return config.api.timeout
}

export function isFeatureEnabled(feature) {
  return config.features[feature] || false
}
