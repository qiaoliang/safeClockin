// constants/community.js
/**
 * 社区管理相关常量定义
 */

// 角色类型
export const StaffRole = {
  MANAGER: 'manager',  // 主管
  STAFF: 'staff'       // 专员
}

// 社区状态
export const CommunityStatus = {
  ACTIVE: 'active',      // 启用
  INACTIVE: 'inactive'   // 停用
}

// 特殊社区标识
export const SPECIAL_COMMUNITIES = {
  ANKA_FAMILY: 'anka_family',  // 安卡大家庭
  BLACKHOUSE: 'blackhouse'     // 黑屋
}

// 特殊社区名称
export const SPECIAL_COMMUNITY_NAMES = {
  ANKA_FAMILY: '安卡大家庭',
  BLACKHOUSE: '黑屋'
}

// 默认头像
export const DEFAULT_AVATAR = 'https://s.coze.cn/image/dhcVCXur50w/'

// 分页配置
export const PAGE_SIZE = 20

// 排序方式
export const SortType = {
  NAME: 'name',      // 按姓名
  ROLE: 'role',      // 按角色
  TIME: 'time'       // 按时间
}

// 社区操作类型
export const CommunityAction = {
  CREATE: 'create',    // 创建
  EDIT: 'edit',        // 编辑
  DELETE: 'delete',    // 删除
  TOGGLE: 'toggle',    // 切换状态
  MERGE: 'merge',      // 合并
  SPLIT: 'split'       // 拆分
}

// 工作人员操作类型
export const StaffAction = {
  ADD: 'add',          // 添加
  REMOVE: 'remove',    // 移除
  VIEW: 'view'         // 查看
}

// 用户操作类型
export const UserAction = {
  ADD: 'add',          // 添加
  REMOVE: 'remove',    // 移除
  VIEW: 'view'         // 查看
}

// 状态标签配置
export const STATUS_TAG_CONFIG = {
  active: {
    text: '启用',
    type: 'success',
    class: 'status-tag-active'
  },
  inactive: {
    text: '停用',
    type: 'default',
    class: 'status-tag-inactive'
  }
}

// 角色标签配置
export const ROLE_TAG_CONFIG = {
  manager: {
    text: '主管',
    type: 'info',
    class: 'role-tag-manager'
  },
  staff: {
    text: '专员',
    type: 'primary',
    class: 'role-tag-staff'
  }
}

// 搜索防抖延迟时间 (ms)
export const SEARCH_DEBOUNCE_DELAY = 500

// 列表刷新延迟时间 (ms)
export const REFRESH_DELAY = 300

// 动画持续时间 (ms)
export const ANIMATION_DURATION = 300

// 最大选择数量
export const MAX_SELECTION_COUNT = 50

// 社区名称长度限制
export const COMMUNITY_NAME_MIN_LENGTH = 2
export const COMMUNITY_NAME_MAX_LENGTH = 50

// 社区描述长度限制
export const COMMUNITY_DESC_MAX_LENGTH = 200

// 错误提示文本
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请稍后重试',
  LOAD_FAILED: '加载失败',
  CREATE_FAILED: '创建失败',
  UPDATE_FAILED: '更新失败',
  DELETE_FAILED: '删除失败',
  ADD_FAILED: '添加失败',
  REMOVE_FAILED: '移除失败',
  SEARCH_FAILED: '搜索失败',
  NO_PERMISSION: '无权限操作',
  INVALID_PARAMS: '参数错误',
  COMMUNITY_NOT_FOUND: '社区不存在',
  USER_NOT_FOUND: '用户不存在',
  STAFF_EXISTS: '该用户已是工作人员',
  USER_EXISTS: '该用户已在社区',
  MUST_INACTIVE_FIRST: '请先停用社区',
  MANAGER_LIMIT: '主管只能选择一个',
  SELECT_AT_LEAST_TWO: '请至少选择2个社区',
  SELECT_TARGET: '请选择目标社区',
  INVALID_PHONE: '手机号格式不正确',
  INVALID_NAME: '名称长度应在2-50个字符之间'
}

// 成功提示文本
export const SUCCESS_MESSAGES = {
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  ADD_SUCCESS: '添加成功',
  REMOVE_SUCCESS: '移除成功',
  TOGGLE_SUCCESS: '操作成功',
  MERGE_SUCCESS: '合并成功',
  SPLIT_SUCCESS: '拆分成功',
  REFRESH_SUCCESS: '刷新成功'
}

// 确认提示文本
export const CONFIRM_MESSAGES = {
  DELETE_COMMUNITY: '确定要删除该社区吗？此操作不可恢复。',
  TOGGLE_INACTIVE: '确定要停用该社区吗？',
  TOGGLE_ACTIVE: '确定要启用该社区吗？',
  REMOVE_STAFF: '确定要移除该工作人员吗？',
  REMOVE_USER: '确定要移除该用户吗？',
  MERGE_COMMUNITIES: '确定要合并选中的社区吗？',
  SPLIT_COMMUNITY: '确定要拆分该社区吗？',
  DISCARD_CHANGES: '是否放弃编辑？'
}

// 空状态提示文本
export const EMPTY_MESSAGES = {
  NO_COMMUNITIES: '暂无社区',
  NO_STAFF: '暂无工作人员',
  NO_USERS: '暂无用户',
  NO_SEARCH_RESULTS: '无匹配结果',
  NO_UNCHECKED_ITEMS: '暂无未完成打卡'
}

// 加载提示文本
export const LOADING_MESSAGES = {
  LOADING: '加载中...',
  CREATING: '创建中...',
  UPDATING: '更新中...',
  DELETING: '删除中...',
  ADDING: '添加中...',
  REMOVING: '移除中...',
  SEARCHING: '搜索中...',
  PROCESSING: '处理中...'
}
