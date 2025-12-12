/**
 * 权限校验工具函数
 * 提供页面级和功能级的权限检查
 */

import { 
  UserRole, 
  RolePagePermissions, 
  RoleFeaturePermissions,
  PermissionErrorMessages 
} from '@/constants/permissions'
import { useUserStore } from '@/store/modules/user'

/**
 * 获取当前用户角色
 * @returns {string} 用户角色
 */
export const getCurrentUserRole = () => {
  const userStore = useUserStore()
  return userStore.role || null
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isLoggedIn = () => {
  const userStore = useUserStore()
  return userStore.isLoggedIn && !!userStore.token
}

/**
 * 检查用户是否有访问指定页面的权限
 * @param {string} pagePath - 页面路径
 * @param {string} userRole - 用户角色（可选，默认使用当前用户角色）
 * @returns {boolean} 是否有权限
 */
export const hasPagePermission = (pagePath, userRole = null) => {
  // 如果未登录，没有任何页面权限
  if (!isLoggedIn()) {
    return false
  }
  
  const role = userRole || getCurrentUserRole()
  
  // 如果没有角色，没有权限
  if (!role) {
    return false
  }
  
  // 获取该角色允许访问的页面列表
  const allowedPages = RolePagePermissions[role] || []
  
  // 检查页面路径是否在允许列表中
  return allowedPages.includes(pagePath)
}

/**
 * 检查用户是否有执行指定功能的权限
 * @param {string} featureName - 功能名称
 * @param {string} userRole - 用户角色（可选，默认使用当前用户角色）
 * @returns {boolean} 是否有权限
 */
export const hasFeaturePermission = (featureName, userRole = null) => {
  // 如果未登录，没有任何功能权限
  if (!isLoggedIn()) {
    return false
  }
  
  const role = userRole || getCurrentUserRole()
  
  // 如果没有角色，没有权限
  if (!role) {
    return false
  }
  
  // 获取该角色允许的功能列表
  const allowedFeatures = RoleFeaturePermissions[role] || []
  
  // 检查功能是否在允许列表中
  return allowedFeatures.includes(featureName)
}

/**
 * 检查用户是否可以管理社区（CRUD操作）
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否有权限
 */
export const canManageCommunity = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  return role === UserRole.SUPER_ADMIN || role === 'community_admin'
}

/**
 * 检查用户是否可以管理工作人员
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否有权限
 */
export const canManageStaff = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  return (role === UserRole.SUPER_ADMIN || role === 'community_admin') || 
         (role === UserRole.COMMUNITY_MANAGER || role === 'community_manager')
}

/**
 * 检查用户是否可以管理社区用户
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否有权限
 */
export const canManageUsers = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  return (role === UserRole.SUPER_ADMIN || role === 'community_admin') || 
         (role === UserRole.COMMUNITY_MANAGER || role === 'community_manager')
}

/**
 * 检查用户是否为超级管理员
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否为超级管理员
 */
export const isSuperAdmin = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  // 后端返回的超级管理员角色可能是 'community_admin' 字符串，也可能是 'super_admin' 字符串
  return role === UserRole.SUPER_ADMIN || role === 'community_admin'
}

/**
 * 检查用户是否为社区主管
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否为社区主管
 */
export const isCommunityManager = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  return role === UserRole.COMMUNITY_MANAGER
}

/**
 * 检查用户是否为社区专员
 * @param {string} userRole - 用户角色（可选）
 * @returns {boolean} 是否为社区专员
 */
export const isCommunityStaff = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  return role === UserRole.COMMUNITY_STAFF
}

/**
 * 权限校验失败时的处理
 * @param {string} message - 错误消息
 * @param {boolean} showToast - 是否显示提示（默认true）
 * @param {boolean} redirectToLogin - 是否重定向到登录页（默认false）
 */
export const handlePermissionDenied = (
  message = PermissionErrorMessages.NO_PAGE_ACCESS,
  showToast = true,
  redirectToLogin = false
) => {
  if (showToast) {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }
  
  if (redirectToLogin) {
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/login'
      })
    }, 2000)
  } else {
    setTimeout(() => {
      uni.navigateBack({
        delta: 1
      })
    }, 2000)
  }
}

/**
 * 页面权限守卫（在页面 onLoad 中调用）
 * @param {string} pagePath - 页面路径
 * @returns {boolean} 是否有权限访问
 */
export const checkPagePermission = (pagePath) => {
  // 检查是否登录
  if (!isLoggedIn()) {
    handlePermissionDenied(
      PermissionErrorMessages.LOGIN_REQUIRED,
      true,
      true
    )
    return false
  }
  
  // 检查是否有角色
  const role = getCurrentUserRole()
  if (!role) {
    handlePermissionDenied(
      PermissionErrorMessages.ROLE_REQUIRED,
      true,
      false
    )
    return false
  }
  
  // 检查页面权限
  if (!hasPagePermission(pagePath)) {
    handlePermissionDenied(
      PermissionErrorMessages.NO_PAGE_ACCESS,
      true,
      false
    )
    return false
  }
  
  return true
}

/**
 * 功能权限守卫（在执行功能前调用）
 * @param {string} featureName - 功能名称
 * @param {boolean} showToast - 是否显示提示（默认true）
 * @returns {boolean} 是否有权限执行
 */
export const checkFeaturePermission = (featureName, showToast = true) => {
  // 检查是否登录
  if (!isLoggedIn()) {
    if (showToast) {
      uni.showToast({
        title: PermissionErrorMessages.LOGIN_REQUIRED,
        icon: 'none'
      })
    }
    return false
  }
  
  // 检查功能权限
  if (!hasFeaturePermission(featureName)) {
    if (showToast) {
      uni.showToast({
        title: PermissionErrorMessages.NO_FEATURE_ACCESS,
        icon: 'none'
      })
    }
    return false
  }
  
  return true
}

/**
 * 获取用户可访问的页面列表
 * @param {string} userRole - 用户角色（可选）
 * @returns {Array<string>} 可访问的页面路径列表
 */
export const getAccessiblePages = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  if (!role) {
    return []
  }
  return RolePagePermissions[role] || []
}

/**
 * 获取用户可执行的功能列表
 * @param {string} userRole - 用户角色（可选）
 * @returns {Array<string>} 可执行的功能列表
 */
export const getAccessibleFeatures = (userRole = null) => {
  const role = userRole || getCurrentUserRole()
  if (!role) {
    return []
  }
  return RoleFeaturePermissions[role] || []
}
