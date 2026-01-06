/**
 * 位置获取工具
 * 用于获取用户当前位置并进行逆地理编码
 */

import { generateTencentMapSignature } from '@/utils/tencentMapSignature.js'
import config from '@/config/index.js'

const TENCENT_MAP_KEY = config.map?.key || ''
const TENCENT_MAP_SECRET = config.map?.secret || ''

/**
 * JSONP 请求
 * @param {string} url - 请求URL
 * @param {Object} params - 请求参数
 * @returns {Promise} 请求结果
 */
const jsonpRequest = (url, params) => {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 创建全局回调函数
    window[callbackName] = (data) => {
      delete window[callbackName]
      const script = document.getElementById(callbackName)
      if (script) {
        document.body.removeChild(script)
      }
      resolve(data)
    }
    
    // 构建查询字符串
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    // 创建 script 标签
    const script = document.createElement('script')
    script.id = callbackName
    script.src = `${url}?${queryString}&callback=${callbackName}`
    script.onerror = () => {
      delete window[callbackName]
      document.body.removeChild(script)
      reject(new Error('JSONP request failed'))
    }
    
    document.body.appendChild(script)
  })
}

/**
 * 逆地理编码：将经纬度转换为地址
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {Promise<string>} 地址描述
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const params = {
      location: `${lat},${lng}`,
      key: TENCENT_MAP_KEY,
      get_poi: 1,
      output: 'jsonp'
    }
    
    const apiPath = '/ws/geocoder/v1'
    const signedParams = generateTencentMapSignature(params, TENCENT_MAP_SECRET, apiPath)
    
    const response = await jsonpRequest(
      'https://apis.map.qq.com/ws/geocoder/v1',
      signedParams
    )
    
    if (response.status === 0) {
      const result = response.result
      
      // 兼容新旧两种API响应格式
      if (typeof result.address === 'string') {
        return result.address
      } else if (result.formatted_addresses && result.formatted_addresses.recommend) {
        return result.formatted_addresses.recommend
      } else if (result.address_component) {
        // 备用方案：组合地址组件
        return `${result.address_component.province}${result.address_component.city}${result.address_component.district}${result.address_component.street || ''}${result.address_component.street_number || ''}`
      }
    }
    
    throw new Error('地址解析失败')
  } catch (error) {
    console.error('逆地理编码失败:', error)
    throw error
  }
}

/**
 * 获取当前位置并返回位置信息
 * @returns {Promise<Object>} 位置信息 { latitude, longitude, address }
 */
export const getCurrentLocation = async () => {
  try {
    // 获取当前位置
    const location = await new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',  // 使用国测局坐标系
        success: resolve,
        fail: reject
      })
    })
    
    const { latitude, longitude } = location
    
    // 逆地理编码获取地址
    const address = await reverseGeocode(latitude, longitude)
    
    return {
      latitude,
      longitude,
      address
    }
  } catch (error) {
    console.error('获取位置失败:', error)
    throw error
  }
}

/**
 * 格式化位置消息
 * @param {Object} location - 位置信息
 * @returns {string} 格式化的位置消息
 */
export const formatLocationMessage = (location) => {
  const { latitude, longitude, address } = location
  return `我的定位：${address} (经度: ${longitude.toFixed(6)}, 纬度: ${latitude.toFixed(6)})`
}