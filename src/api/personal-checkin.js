/**
 * 个人打卡规则API模块
 * 处理个人规则相关的API调用
 */

import { request } from "./request";

/**
 * 获取个人规则列表
 * @returns {Promise}
 */
export const getPersonalRules = () => {
    return request({
        url: "/api/user_checkin/rules",
        method: "GET",
    });
};

/**
 * 创建个人规则
 * @param {Object} ruleData - 规则数据
 * @returns {Promise}
 */
export const createPersonalRule = (ruleData) => {
    return request({
        url: "/api/user_checkin/rules",
        method: "POST",
        data: ruleData,
    });
};

/**
 * 修改个人规则
 * @param {number} ruleId - 规则ID
 * @param {Object} ruleData - 更新数据
 * @returns {Promise}
 */
export const updatePersonalRule = (ruleId, ruleData) => {
    return request({
        url: `/api/user_checkin/rules/${ruleId}`,
        method: "PUT",
        data: ruleData,
    });
};

/**
 * 启用个人规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const enablePersonalRule = (ruleId) => {
    return request({
        url: `/api/user_checkin/rules/${ruleId}/enable`,
        method: "POST",
    });
};

/**
 * 停用个人规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const disablePersonalRule = (ruleId) => {
    return request({
        url: `/api/user_checkin/rules/${ruleId}/disable`,
        method: "POST",
    });
};

/**
 * 删除个人规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const deletePersonalRule = (ruleId) => {
    return request({
        url: `/api/user_checkin/rules/${ruleId}`,
        method: "DELETE",
    });
};

/**
 * 获取个人规则详情
 * @param {number} ruleId - 规则ID
 * @returns {Promise}
 */
export const getPersonalRuleDetail = (ruleId) => {
    return request({
        url: `/api/user_checkin/rules/${ruleId}`,
        method: "GET",
    });
};

export default {
    getPersonalRules,
    createPersonalRule,
    updatePersonalRule,
    enablePersonalRule,
    disablePersonalRule,
    deletePersonalRule,
    getPersonalRuleDetail,
};