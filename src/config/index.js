// 配置文件入口 - 构建时已选择环境配置
// Environment: prod

import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

const ENV_TYPE = 'prod'

const configMap = {
  unit: unitConfig,
  func: funcConfig,
  uat: uatConfig,
  prod: prodConfig
}

const config = configMap[ENV_TYPE] || funcConfig

export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'
export default config
export function getAPIBaseURL() { return config.api.baseURL }
export function getAPITimeout() { return config.api.timeout }
export function isFeatureEnabled(feature) { return config.features[feature] || false }
