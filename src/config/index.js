// 配置文件入口 - 根据 ENV_TYPE 自动选择环境配置
// ENV_TYPE: unit (单元测试), func (功能测试), uat (用户验收测试), prod (生产环境)

import unitConfig from './unit.js'
import funcConfig from './func.js'
import uatConfig from './uat.js'
import prodConfig from './prod.js'

// 配置映射
const configMap = {
  unit: unitConfig,
  func: funcConfig,
  uat: uatConfig,
  prod: prodConfig
}

// 预先声明 config 变量
var config

// #ifdef H5
// H5 平台：构建时根据 ENV_TYPE 替换整行 config 赋值
// 注意：h5build.sh 会将此行替换为具体的配置对象
// 默认使用 prod 配置
// #define ENV_TYPE_PROD
config = { env: 'prod', api: { baseURL: 'https://www.leadagile.cn' }, app: { name: '安全守护', version: '1.0.0', debug: false }, map: { key: 'EY7BZ-WB5WL-B3PPE-MK6FU-MHQ3T-Y2FFP', secret: 'oWjfgcA2ismvRGAksDhL8w4qjUIdtkBp' }, features: { enableMockData: false, enableDebugLog: false, enableErrorReporting: true } }
// #endif

// #ifndef H5
// 非 H5 环境使用运行时配置

// #ifdef MP-WEIXIN
// 微信小程序：构建时根据 ENV_TYPE 替换整行 config 赋值
// 注意：mpbuild.sh 会将此行替换为具体的配置对象
// #define ENV_TYPE_PROD
config = configMap['prod']
// #endif

// #ifndef MP-WEIXIN
config = configMap[process.env.ENV_TYPE || 'prod'] || configMap['prod']
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
