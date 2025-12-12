/**
 * 权限守卫混入
 * 在页面中使用此混入可自动进行权限检查
 * 
 * 使用方法:
 * 1. 在页面的 script setup 中导入并使用
 * 2. 在页面的 onLoad 中调用 checkPermission()
 * 
 * 示例:
 * ```javascript
 * import { onLoad } from '@dcloudio/uni-app'
 * import { checkPagePermission } from '@/utils/permission'
 * import { PagePath } from '@/constants/permissions'
 * 
 * onLoad(() => {
 *   if (!checkPagePermission(PagePath.COMMUNITY_MANAGE)) {
 *     return
 *   }
 *   // 继续页面初始化逻辑
 * })
 * ```
 */

import { checkPagePermission, getCurrentUserRole } from '@/utils/permission'

/**
 * 创建权限守卫混入
 * @param {string} pagePath - 页面路径
 * @returns {object} 混入对象
 */
export const createPermissionGuard = (pagePath) => {
  return {
    onLoad() {
      console.log(`[权限检查] 页面: ${pagePath}`)
      console.log(`[权限检查] 当前用户角色: ${getCurrentUserRole()}`)
      
      const hasPermission = checkPagePermission(pagePath)
      
      if (!hasPermission) {
        console.warn(`[权限拒绝] 用户无权访问: ${pagePath}`)
        return false
      }
      
      console.log(`[权限通过] 用户可以访问: ${pagePath}`)
      return true
    }
  }
}

/**
 * 页面权限检查装饰器（用于 Composition API）
 * @param {string} pagePath - 页面路径
 * @param {Function} callback - 权限检查通过后的回调函数
 * @returns {Function} 包装后的函数
 */
export const withPermissionCheck = (pagePath, callback) => {
  return (...args) => {
    console.log(`[权限检查] 页面: ${pagePath}`)
    console.log(`[权限检查] 当前用户角色: ${getCurrentUserRole()}`)
    
    const hasPermission = checkPagePermission(pagePath)
    
    if (!hasPermission) {
      console.warn(`[权限拒绝] 用户无权访问: ${pagePath}`)
      return
    }
    
    console.log(`[权限通过] 用户可以访问: ${pagePath}`)
    
    if (typeof callback === 'function') {
      return callback(...args)
    }
  }
}

/**
 * 功能权限检查装饰器
 * @param {string} featureName - 功能名称
 * @param {Function} callback - 权限检查通过后的回调函数
 * @param {boolean} showToast - 是否显示提示
 * @returns {Function} 包装后的函数
 */
export const withFeaturePermissionCheck = (featureName, callback, showToast = true) => {
  return (...args) => {
    const { checkFeaturePermission } = require('@/utils/permission')
    
    console.log(`[功能权限检查] 功能: ${featureName}`)
    console.log(`[功能权限检查] 当前用户角色: ${getCurrentUserRole()}`)
    
    const hasPermission = checkFeaturePermission(featureName, showToast)
    
    if (!hasPermission) {
      console.warn(`[功能权限拒绝] 用户无权执行: ${featureName}`)
      return
    }
    
    console.log(`[功能权限通过] 用户可以执行: ${featureName}`)
    
    if (typeof callback === 'function') {
      return callback(...args)
    }
  }
}

/**
 * 批量功能权限检查
 * @param {Array<string>} featureNames - 功能名称列表
 * @returns {boolean} 是否全部有权限
 */
export const checkMultipleFeaturePermissions = (featureNames) => {
  const { hasFeaturePermission } = require('@/utils/permission')
  
  return featureNames.every(featureName => {
    const hasPermission = hasFeaturePermission(featureName)
    console.log(`[批量权限检查] ${featureName}: ${hasPermission ? '通过' : '拒绝'}`)
    return hasPermission
  })
}

/**
 * 获取用户在当前页面可执行的功能列表
 * @param {Array<string>} allFeatures - 页面所有功能列表
 * @returns {Array<string>} 用户可执行的功能列表
 */
export const getPageAccessibleFeatures = (allFeatures) => {
  const { hasFeaturePermission } = require('@/utils/permission')
  
  return allFeatures.filter(feature => hasFeaturePermission(feature))
}
