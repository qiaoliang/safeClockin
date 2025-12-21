/**
 * 用户打卡规则API模块
 * 处理用户规则查询和聚合的API调用（个人规则 + 社区规则）
 */

import { request } from './request'
import { useUserStore } from '@/store/modules/user'

/**
 * 获取用户所有打卡规则（个人规则 + 社区规则）
 * @returns {Promise}
 */
export const getUserAllRules = () => {
  // Layer 2: 业务逻辑验证 - 验证API调用合法性
  console.log('🔍 Layer 2业务验证: getUserAllRules调用开始')
  
  // 验证用户登录状态
  try {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      console.error('❌ Layer 2验证失败: 用户未登录')
      return Promise.reject(new Error('用户未登录，无法获取打卡规则'))
    }
    console.log('✅ Layer 2验证通过: 用户已登录')
  } catch (error) {
    console.error('❌ Layer 2验证失败: 无法获取用户状态', error)
    return Promise.reject(new Error('用户状态验证失败'))
  }
  
  return request({
    url: '/api/user-checkin/rules',
    method: 'GET'
  }).then(response => {
    // Layer 2: 业务逻辑验证 - 验证响应数据结构
    console.log('🔍 Layer 2业务验证: 验证响应数据结构')
    
    if (!response || typeof response !== 'object') {
      console.error('❌ Layer 2验证失败: 响应不是有效对象')
      throw new Error('服务器响应格式错误')
    }
    
    if (response.code !== 1) {
      console.error('❌ Layer 2验证失败: 业务状态码错误', response.code, response.msg)
      throw new Error(response.msg || '获取打卡规则失败')
    }
    
    const rules = response.data.rules || []
    if (!Array.isArray(rules)) {
      console.error('❌ Layer 2验证失败: 规则数据不是数组')
      console.error('实际数据结构:', response.data)
      throw new Error('规则数据格式错误')
    }
    
    // 验证每个规则的基本结构
    const invalidRules = rules.filter(rule => {
      return !rule || typeof rule !== 'object' || 
             !rule.rule_source || 
             typeof rule.is_editable !== 'boolean'
    })
    
    if (invalidRules.length > 0) {
      console.warn('⚠️ Layer 2验证警告: 发现无效规则数据', invalidRules.length)
      // 不抛出错误，但记录警告，允许部分数据通过
    }
    
    console.log('✅ Layer 2验证通过: 响应数据结构正确', `规则数量: ${rules.length}`)
    return response
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
  // Layer 2: 业务逻辑验证 - 参数验证
  console.log('🔍 Layer 2业务验证: getUserRuleDetail参数验证')
  
  // 验证规则ID
  if (!ruleId || typeof ruleId !== 'number' || ruleId <= 0) {
    console.error('❌ Layer 2验证失败: 无效的规则ID', ruleId)
    return Promise.reject(new Error('规则ID必须是正整数'))
  }
  
  // 验证规则来源
  const validSources = ['personal', 'community']
  if (!validSources.includes(ruleSource)) {
    console.error('❌ Layer 2验证失败: 无效的规则来源', ruleSource)
    return Promise.reject(new Error('规则来源必须是 personal 或 community'))
  }
  
  console.log('✅ Layer 2验证通过: 参数有效', { ruleId, ruleSource })
  
  return request({
    url: `/api/user-checkin/rules/${ruleId}`,
    method: 'GET',
    data: {
      rule_source: ruleSource
    }
  }).then(response => {
    // Layer 2: 业务逻辑验证 - 响应验证
    if (!response || response.code !== 1) {
      console.error('❌ Layer 2验证失败: 获取规则详情失败', response)
      throw new Error(response?.msg || '获取规则详情失败')
    }
    
    const rule = response.data
    if (!rule || typeof rule !== 'object') {
      console.error('❌ Layer 2验证失败: 规则数据无效')
      throw new Error('规则数据格式错误')
    }
    
    // 验证规则来源一致性
    if (rule.rule_source !== ruleSource) {
      console.warn('⚠️ Layer 2验证警告: 规则来源不匹配', {
        expected: ruleSource,
        actual: rule.rule_source
      })
    }
    
    console.log('✅ Layer 2验证通过: 规则详情数据有效')
    return response
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