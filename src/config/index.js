// 配置文件入口 - 根据 ENV_TYPE 自动选择环境配置
// ENV_TYPE: unit (单元测试), func (功能测试), uat (用户验收测试), prod (生产环境)

import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 根据 ENV_TYPE 选择配置
// #ifdef H5
// H5 平台：构建时根据 ENV_TYPE 修改 #define 来选择环境
// #define ENV_TYPE_PROD
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

// 配置映射
const configMap = {
  unit: unitConfig,
  func: funcConfig,
  uat: uatConfig,
  prod: prodConfig
}

// 预先声明 config 变量，确保所有条件编译块都能访问
var config

// H5 平台根据条件编译选择配置
// #ifdef ENV_TYPE_PROD
config = configMap['prod']
// #endif

// #ifdef ENV_TYPE_FUNC
config = configMap['func']
// #endif

// #ifdef ENV_TYPE_UAT
config = configMap['uat']
// #endif

// #ifdef ENV_TYPE_UNIT
config = configMap['unit']
// #endif

// #ifndef ENV_TYPE_PROD
// #ifndef ENV_TYPE_FUNC
// #ifndef ENV_TYPE_UAT
// #ifndef ENV_TYPE_UNIT
// 其他环境（如 App）使用运行时环境变量
config = configMap[ENV_TYPE] || configMap['prod']
// #endif
// #endif
// #endif
// #endif

// 导出配置
export const currentEnv = config.env
export const isProduction = config.env === 'prod'
export const isDevelopment = config.env === 'func'
export const isTesting = config.env === 'unit'
export default config
export function getAPIBaseURL() { return config.api.baseURL }
export function getAPITimeout() { return config.api.timeout }
export function isFeatureEnabled(feature) { return config.features[feature] || false }
