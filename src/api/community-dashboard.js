import { request } from './request'

/**
 * 社区数字看板相关API
 */

/**
 * 获取社区统计数据
 * @param {string|number} communityId - 社区ID
 * @returns {Promise} API响应
 */
export const getCommunityStats = (communityId) => {
  return request({
    url: `/api/community-dashboard/${communityId}/stats`,
    method: 'GET'
  })
}

/**
 * 获取异常用户列表
 * @param {string|number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码（默认1）
 * @param {number} params.page_size - 每页数量（默认20，最大100）
 * @returns {Promise} API响应
 */
export const getAbnormalUsers = (communityId, params = {}) => {
  return request({
    url: `/api/community-dashboard/${communityId}/abnormal-users`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取历史趋势数据
 * @param {string|number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {number} params.days - 天数（7或30，默认7）
 * @returns {Promise} API响应
 */
export const getTrendData = (communityId, params = {}) => {
  return request({
    url: `/api/community-dashboard/${communityId}/trends`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取未处理事件列表
 * @param {string|number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 最大返回数量（默认3）
 * @returns {Promise} API响应
 */
export const getPendingEvents = (communityId, params = {}) => {
  return request({
    url: `/api/community-dashboard/${communityId}/pending-events`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取用户异常值详情
 * @param {string|number} communityId - 社区ID
 * @param {string|number} userId - 用户ID
 * @returns {Promise} API响应
 */
export const getUserAbnormalityDetail = (communityId, userId) => {
  return request({
    url: `/api/community-dashboard/${communityId}/user-abnormality/${userId}`,
    method: 'GET'
  })
}
