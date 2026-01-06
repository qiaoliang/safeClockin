/**
 * 腾讯地图签名验证工具
 * 参考：https://lbs.qq.com/service/webService/webServiceGuide/webServiceSignature
 */

import CryptoJS from 'crypto-js'

/**
 * 生成腾讯地图请求签名
 * @param {Object} params - 请求参数对象
 * @param {string} secret - 签名密钥 (SK)
 * @param {string} path - 请求路径（如 /ws/geocoder/v1）
 * @returns {Object} 包含签名的参数对象
 */
export function generateTencentMapSignature(params, secret, path) {
  console.log('=== 开始生成签名 ===')
  console.log('请求路径:', path)
  console.log('原始参数:', JSON.stringify(params, null, 2))
  console.log('Secret key:', secret)

  // 1. 将参数按字典序排序（按参数名升序）
  const sortedKeys = Object.keys(params).sort()
  console.log('排序后的键:', sortedKeys)

  // 2. 拼接参数（不进行任何编码，使用原始数据）
  const paramStr = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  console.log('拼接后的参数字符串:', paramStr)

  // 3. 按照官方文档格式拼接：请求路径 + "?" + 请求参数 + SK
  const strToSign = `${path}?${paramStr}${secret}`
  console.log('待签名字符串:', strToSign)

  // 4. 进行 MD5 加密（结果必须是小写）
  const signature = CryptoJS.MD5(strToSign).toString()
  console.log('生成的签名:', signature)

  // 5. 返回包含签名的参数
  const result = {
    ...params,
    sig: signature
  }
  console.log('最终参数:', JSON.stringify(result, null, 2))
  console.log('=== 签名生成完成 ===')

  return result
}