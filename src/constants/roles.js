/**
 * 角色常量定义 - 与后端保持一致
 * role_id 用于判断，role_name 仅用于显示
 */

// 角色 ID 常量 - 用于代码判断
export const RoleId = {
  UNSET: 0,          // 未设置
  SOLO: 1,           // 普通用户 (独居者)
  STAFF: 2,          // 社区专员
  MANAGER: 3,        // 社区主管
  SUPER_ADMIN: 4,    // 超级系统管理员
}

// 角色名称常量 - 用于显示
export const RoleName = {
  UNSET: '未设置',
  SOLO: '普通用户',
  STAFF: '社区专员',
  MANAGER: '社区主管',
  SUPER_ADMIN: '超级系统管理员',
}

// role_id 到 role_name 的映射（用于显示）
export const ROLE_ID_TO_NAME = {
  [RoleId.UNSET]: RoleName.UNSET,
  [RoleId.SOLO]: RoleName.SOLO,
  [RoleId.STAFF]: RoleName.STAFF,
  [RoleId.MANAGER]: RoleName.MANAGER,
  [RoleId.SUPER_ADMIN]: RoleName.SUPER_ADMIN,
}

// role_name 到 role_id 的映射（用于 API 参数解析，如果有需要）
export const ROLE_NAME_TO_ID = Object.entries(ROLE_ID_TO_NAME).reduce((acc, [id, name]) => {
  acc[name] = parseInt(id)
  return acc
}, {})

// 社区工作人员角色列表（用于权限判断）
export const COMMUNITY_STAFF_ROLES = [
  RoleId.STAFF,
  RoleId.MANAGER,
  RoleId.SUPER_ADMIN,
]

// 所有有效角色列表
export const ALL_VALID_ROLES = [
  RoleId.SOLO,
  RoleId.STAFF,
  RoleId.MANAGER,
  RoleId.SUPER_ADMIN,
]
