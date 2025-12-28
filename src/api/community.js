import { request } from './request'

/**
 * 社区相关API
 */

/**
 * 获取社区详情
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const getCommunityDetail = (communityId) => {
  return request({
    url: `/api/communities/${communityId}`,
    method: 'GET'
  })
}

/**
 * 获取社区列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.status - 状态筛选 (all/active/inactive)
 * @returns {Promise} API响应
 */
export const getCommunityList = (params = {}) => {
  return request({
    url: '/api/community/list',
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户管理的社区列表
 * @returns {Promise} API响应
 */
export const getManagedCommunities = () => {
  return request({
    url: '/api/user/managed-communities',
    method: 'GET'
  })
}

/**
 * 获取社区工作人员列表
 * @param {string|number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {string} params.role - 角色筛选 (all/manager/staff)
 * @param {string} params.sort_by - 排序方式 (name/role/time)
 * @returns {Promise} API响应
 */
export const getCommunityStaffList = (communityId, params = {}) => {
  return request({
    url: '/api/community/staff/list-enhanced',
    method: 'GET',
    data: {
      community_id: communityId,
      ...params
    }
  })
}

/**
 * 获取社区用户列表
 * @param {string|number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.per_page - 每页数量
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise} API响应
 */
export const getCommunityUsers = (communityId, params = {}) => {
  return request({
    url: `/api/communities/${communityId}/users`,
    method: 'GET',
    data: params
  })
}

/**
 * 创建社区
 * @param {Object} data - 社区数据
 * @param {string} data.name - 社区名称
 * @param {string} data.description - 社区描述
 * @param {string} data.location - 地理位置
 * @param {string} data.manager_id - 主管ID（可选）
 * @returns {Promise} API响应
 */
export const createCommunity = (data) => {
  return request({
    url: '/api/communities',
    method: 'POST',
    data
  })
}

/**
 * 更新社区
 * @param {string|number} communityId - 社区ID
 * @param {Object} data - 更新数据
 * @returns {Promise} API响应
 */
export const updateCommunity = (communityId, data) => {
  return request({
    url: '/api/community/update',
    method: 'POST',
    data: {
      community_id: communityId,
      ...data
    }
  })
}

/**
 * 删除社区
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const deleteCommunity = (communityId) => {
  return request({
    url: `/api/communities/${communityId}`,
    method: 'DELETE'
  })
}

/**
 * 添加社区工作人员
 * @param {Object} data - 工作人员数据
 * @param {string|number} data.community_id - 社区ID
 * @param {Array} data.user_ids - 用户ID列表
 * @param {string} data.role - 角色 (manager/staff)
 * @returns {Promise} API响应
 */
export const addCommunityStaff = (data) => {
  return request({
    url: '/api/community/add-staff',
    method: 'POST',
    data
  })
}

/**
 * 移除社区工作人员
 * @param {string|number} communityId - 社区ID
 * @param {string|number} userId - 用户ID
 * @returns {Promise} API响应
 */
export const removeCommunityStaff = (communityId, userId) => {
  return request({
    url: '/api/community/remove-staff',
    method: 'POST',
    data: {
      community_id: communityId,
      user_id: userId
    }
  })
}

/**
 * 检查社区访问权限
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const checkCommunityAccess = (communityId) => {
  return request({
    url: `/api/communities/manage/${communityId}/access-check`,
    method: 'GET'
  })
}

/**
 * 切换用户社区
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const switchCommunity = (communityId) => {
  return request({
    url: '/api/user/switch-community',
    method: 'POST',
    data: {
      community_id: communityId
    }
  })
}

/**
 * 获取社区每日打卡统计
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const getCommunityDailyStats = (communityId) => {
  return request({
    url: `/api/communities/${communityId}/daily-stats`,
    method: 'GET'
  })
}