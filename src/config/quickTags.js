/**
 * 快捷指令配置
 * 定义不同角色可用的快捷指令及其行为
 */

/**
 * 工作人员快捷指令
 */
export const STAFF_QUICK_TAGS = [
  { text: '已电话联系', type: 'default' },
  { text: '正在前往', type: 'default' },
  { text: '已到达现场', type: 'default' },
  { text: '需要进一步协助', type: 'warning' }
]

/**
 * 用户快捷指令
 */
export const USER_QUICK_TAGS = [
  { text: '快点来', type: 'urgent' },
  { text: '我摔倒了', type: 'warning' },
  { text: '我的定位', type: 'location', action: 'getLocation' }
]

/**
 * 快捷指令配置映射
 */
export const QUICK_TAGS_CONFIG = {
  staff: STAFF_QUICK_TAGS,
  user: USER_QUICK_TAGS
}

/**
 * 按类型获取样式类
 * @param {string} type - 快捷指令类型
 * @returns {string} CSS 类名
 */
export const getTagClassByType = (type) => {
  const classMap = {
    'urgent': 'urgent',
    'warning': 'warning',
    'location': 'location',
    'success': 'success',
    'default': ''
  }
  return classMap[type] || ''
}