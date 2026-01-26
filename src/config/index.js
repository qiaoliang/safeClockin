// 配置文件入口 - 根据 ENV_TYPE 自动选择环境配置
// ENV_TYPE: unit (单元测试), func (功能测试), uat (用户验收测试), prod (生产环境)

import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 根据 ENV_TYPE 选择配置
// #ifdef H5
// H5 平台：构建时通过 h5build.sh 脚本修改 ENV_TYPE 值
// 注意：HBuilderX 条件编译会保留此行
const ENV_TYPE = 'prod'
// #endif

// #ifdef MP-WEIXIN
// 微信小程序使用默认值
const ENV_TYPE = 'prod'
// #endif

// #ifndef H5
// #ifndef MP-WEIXIN
// 其他环境（如 App）读取环境变量
const ENV_TYPE = process.env.ENV_TYPE || 'prod'
// #endif
// #endif

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
