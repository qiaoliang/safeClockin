// 配置文件入口 - 根据 ENV_TYPE 自动选择环境配置
// ENV_TYPE: unit (单元测试), func (功能测试), uat (用户验收测试), prod (生产环境)

import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 根据 ENV_TYPE 选择配置
const ENV_TYPE = process.env.ENV_TYPE || 'prod'

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
