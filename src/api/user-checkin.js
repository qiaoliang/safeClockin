/**
 * 用户打卡规则API模块
 * 处理用户规则查询和聚合的API调用（个人规则 + 社区规则）
 */

import { request } from './request'

/**
 * 获取用户所有打卡规则（个人规则 + 社区规则）
 * @returns {Promise}
 */
export const getUserAllRules = () => {
  return request({
    url: '/api/user-checkin/rules',
    method: 'GET'
  })
}

/**
 * 获取用户今日打卡计划（混合个人规则和社区规则）
 * @returns {Promise}
 */
export const getTodayPlan = () => {
  return request({
    url: '/api/user-checkin/today-plan',
    method: 'GET'
  })
}

/**
 * 获取用户规则详情（根据规则来源）
 * @param {number} ruleId - 规则ID
 * @param {string} ruleSource - 规则来源（personal/community）
 * @returns {Promise}
 */
export const getUserRuleDetail = (ruleId, ruleSource = 'personal') => {
  return request({
    url: `/api/user-checkin/rules/${ruleId}`,
    method: 'GET',
    data: {
      rule_source: ruleSource
    }
  })
}

/**
 * 获取用户规则统计信息
 * @returns {Promise}
 */
export const getUserRulesStatistics = () => {
  return request({
    url: '/api/user-checkin/statistics',
    method: 'GET'
  })
}

/**
 * 批量获取规则来源信息
 * @param {Array} rules - 规则数组，每个元素包含rule_id和rule_source
 * @returns {Promise}
 */
export const getRulesSourceInfo = (rules) => {
  return request({
    url: '/api/user-checkin/rules/source-info',
    method: 'POST',
    data: {
      rules
    }
  })
}

/**
 * 判断规则是否可编辑
 * @param {Object} rule - 规则对象
 * @returns {boolean}
 */
export const isRuleEditable = (rule) => {
  return rule.is_editable !== false && rule.rule_source === 'personal'
}

/**
 * 获取规则来源标签
 * @param {Object} rule - 规则对象
 * @returns {string}
 */
export const getRuleSourceLabel = (rule) => {
  if (rule.rule_source === 'personal') {
    return '个人规则'
  } else if (rule.rule_source === 'community') {
    return rule.community_name ? `${rule.community_name}要求` : '社区规则'
  }
  return '未知来源'
}

/**
 * 获取规则来源颜色
 * @param {Object} rule - 规则对象
 * @returns {string}
 */
export const getRuleSourceColor = (rule) => {
  if (rule.rule_source === 'personal') {
    return '#1890ff' // 蓝色
  } else if (rule.rule_source === 'community') {
    return '#52c41a' // 绿色
  }
  return '#8c8c8c' // 灰色
}

/**
 * 获取规则来源图标
 * @param {Object} rule - 规则对象
 * @returns {string}
 */
export const getRuleSourceIcon = (rule) => {
  if (rule.rule_source === 'personal') {
    return '👤'
  } else if (rule.rule_source === 'community') {
    return '🏘️'
  }
  return '❓'
}

export default {
  getUserAllRules,
  getTodayPlan,
  getUserRuleDetail,
  getUserRulesStatistics,
  getRulesSourceInfo,
  isRuleEditable,
  getRuleSourceLabel,
  getRuleSourceColor,
  getRuleSourceIcon
}