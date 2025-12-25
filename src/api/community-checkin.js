/**
 * 社区打卡规则API模块
 * 处理社区规则相关的API调用
 */

import { request } from "./request";

/**
 * 获取社区规则列表
 * @param {number} communityId - 社区ID
 * @param {boolean} grouped - 是否返回分组数据（默认false）
 * @returns {Promise}
 */
export const getCommunityRules = (communityId, grouped = false) => {
    return request({
        url: "/api/community_checkin/rules",
        method: "GET",
        data: {
            community_id: communityId,
            grouped: grouped,
        },
    });
};

/**
 * 创建社区规则
 * @param {Object} ruleData - 规则数据
 * @returns {Promise}
 */
export const createCommunityRule = (ruleData) => {
    return request({
        url: "/api/community_checkin/rules",
        method: "POST",
        data: ruleData,
    });
};

/**
 * 修改社区规则
 * @param {number} ruleId - 规则ID
 * @param {Object} ruleData - 更新数据
 * @returns {Promise}
 */
export const updateCommunityRule = (ruleId, ruleData) => {
    return request({
        url: `/api/community_checkin/rules/${ruleId}`,
        method: "PUT",
        data: ruleData,
    });
};

/**
 * 启用社区规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const enableCommunityRule = (ruleId) => {
    return request({
        url: `/api/community_checkin/rules/${ruleId}/enable`,
        method: "POST",
    });
};

/**
 * 停用社区规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const disableCommunityRule = (ruleId) => {
    return request({
        url: `/api/community_checkin/rules/${ruleId}/disable`,
        method: "POST",
    });
};

/**
 * 删除社区规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const deleteCommunityRule = (ruleId) => {
    return request({
        url: `/api/community_checkin/rules/${ruleId}`,
        method: "DELETE",
    });
};

/**
 * 获取社区规则详情
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const getCommunityRuleDetail = (ruleId) => {
    return request({
        url: `/api/community_checkin/rules/${ruleId}`,
        method: "GET",
    });
};

export default {
    getCommunityRules,
    createCommunityRule,
    updateCommunityRule,
    enableCommunityRule,
    disableCommunityRule,
    deleteCommunityRule,
    getCommunityRuleDetail,
};
