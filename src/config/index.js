// 配置文件入口
// 根据环境变量选择对应的环境配置

// 导入各环境配置
import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 获取当前环境
// 优先级: 
// 1. process.env.UNI_ENV (uni-app 环境变量)
// 2. process.env.NODE_ENV (Node.js 环境变量)
// 3. 默认为 prod
function getEnv() {
  // uni-app 构建时会设置 UNI_ENV
  if (process.env.UNI_ENV) {
    return process.env.UNI_ENV
  }
  
  // 开发时可能使用 NODE_ENV
  if (process.env.NODE_ENV) {
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'development') return 'func'
    if (nodeEnv === 'production') return 'prod'
    if (nodeEnv === 'test') return 'unit'
  }
  
  // 默认生产环境
  return 'prod'
}

// 根据环境获取配置
function getConfig() {
  const env = getEnv()
  
  switch (env) {
    case 'unit':
      return unitConfig
    case 'func':
      return funcConfig
    case 'uat':
      return uatConfig
    case 'prod':
    default:
      return prodConfig
  }
}

// 导出当前环境的配置
const config = getConfig()

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