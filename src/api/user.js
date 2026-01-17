import { request } from './request'

/**
 * 用户相关API
 */

/**
 * 获取用户病史列表
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export const getUserMedicalHistories = (userId) => {
  return request({
    url: `/api/user/${userId}/medical-history`,
    method: 'GET'
  })
}

/**
 * 添加病史记录
 * @param {Object} data - 病史数据
 * @param {number} data.user_id - 用户ID
 * @param {string} data.condition_name - 疾病名称
 * @param {Object} data.treatment_plan - 治疗方案
 * @param {number} data.visibility - 可见性 (1=仅工作人员, 2=工作人员和监护人)
 * @returns {Promise}
 */
export const addMedicalHistory = (data) => {
  return request({
    url: '/api/user/medical-history',
    method: 'POST',
    data
  })
}

/**
 * 更新病史记录
 * @param {number} historyId - 病史ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
export const updateMedicalHistory = (historyId, data) => {
  return request({
    url: `/api/user/medical-history/${historyId}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除病史记录
 * @param {number} historyId - 病史ID
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export const deleteMedicalHistory = (historyId, userId) => {
  return request({
    url: `/api/user/medical-history/${historyId}`,
    method: 'DELETE',
    data: { user_id: userId }
  })
}

/**
 * 获取常见病史标签
 * @returns {Promise}
 */
export const getCommonConditions = () => {
  return request({
    url: '/api/user/medical-history/common-conditions',
    method: 'GET'
  })
}

/**
 * 记录查看成员信息
 * @param {number} viewedUserId - 被查看用户ID
 * @param {number} communityId - 社区ID
 * @returns {Promise}
 */
export const logProfileView = (viewedUserId, communityId) => {
  return request({
    url: '/api/user/log-profile-view',
    method: 'POST',
    data: {
      viewed_user_id: viewedUserId,
      community_id: communityId
    }
  })
}

/**
 * 记录查看监护人信息
 * @param {number} guardianId - 监护人ID
 * @param {number} wardUserId - 被监护人ID
 * @param {number} communityId - 社区ID
 * @returns {Promise}
 */
export const logViewGuardianInfo = (guardianId, wardUserId, communityId) => {
  return request({
    url: '/api/user/log-view-guardian',
    method: 'POST',
    data: {
      guardian_id: guardianId,
      ward_user_id: wardUserId,
      community_id: communityId
    }
  })
}

/**
 * 获取浏览记录列表
 * @param {number} communityId - 社区ID
 * @param {Object} params - 查询参数
 * @param {number} params.viewer_id - 查看者ID（可选）
 * @param {number} params.limit - 返回数量限制
 * @returns {Promise}
 */
export const getProfileViewLogs = (communityId, params = {}) => {
  return request({
    url: '/api/user/profile-view-logs',
    method: 'GET',
    data: {
      community_id: communityId,
      ...params
    }
  })
}

/**
 * 搜索用户
 * @param {string} keyword - 搜索关键词
 * @returns {Promise}
 */
export const searchUsers = (keyword) => {
  return request({
    url: '/api/user/search',
    method: 'GET',
    data: {
      keyword
    }
  })
}
