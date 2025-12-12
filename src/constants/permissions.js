/**
 * 权限常量定义
 * 用于控制页面访问和功能可见性
 */

// 用户角色定义
export const UserRole = {
  SUPER_ADMIN: 'super_admin',      // 超级管理员
  COMMUNITY_MANAGER: 'community_manager',  // 社区主管
  COMMUNITY_STAFF: 'community_staff',      // 社区专员
  SUPERVISOR: 'supervisor',         // 监护人
  SOLO: 'solo'                     // 普通用户
}

// 页面路径常量
export const PagePath = {
  // 社区管理页面（仅超级管理员）
  COMMUNITY_MANAGE: '/pages/community-manage/community-manage',
  COMMUNITY_FORM: '/pages/community-form/community-form',
  COMMUNITY_MERGE: '/pages/community-merge/community-merge',
  COMMUNITY_SPLIT: '/pages/community-split/community-split',
  
  // 工作人员管理页面（社区主管）
  COMMUNITY_STAFF_MANAGE: '/pages/community-staff-manage/community-staff-manage',
  STAFF_DETAIL: '/pages/staff-detail/staff-detail',
  STAFF_ADD: '/pages/staff-add/staff-add',
  
  // 用户管理页面（社区主管和专员）
  COMMUNITY_USER_MANAGE: '/pages/community-user-manage/community-user-manage',
  COMMUNITY_USER_ADD: '/pages/community-user-add/community-user-add',
  
  // 其他页面
  HOME_COMMUNITY: '/pages/home-community/home-community',
  PROFILE: '/pages/profile/profile'
}

// 功能权限定义
export const FeaturePermission = {
  // 社区管理功能
  CREATE_COMMUNITY: 'create_community',
  EDIT_COMMUNITY: 'edit_community',
  DELETE_COMMUNITY: 'delete_community',
  MERGE_COMMUNITY: 'merge_community',
  SPLIT_COMMUNITY: 'split_community',
  TOGGLE_COMMUNITY_STATUS: 'toggle_community_status',
  
  // 工作人员管理功能
  ADD_STAFF: 'add_staff',
  REMOVE_STAFF: 'remove_staff',
  VIEW_STAFF_DETAIL: 'view_staff_detail',
  ASSIGN_MANAGER: 'assign_manager',
  
  // 用户管理功能
  ADD_USER: 'add_user',
  REMOVE_USER: 'remove_user',
  VIEW_USER_DETAIL: 'view_user_detail',
  VIEW_UNCHECKED_DETAIL: 'view_unchecked_detail'
}

// 角色-页面权限映射
export const RolePagePermissions = {
  [UserRole.SUPER_ADMIN]: [
    PagePath.COMMUNITY_MANAGE,
    PagePath.COMMUNITY_FORM,
    PagePath.COMMUNITY_MERGE,
    PagePath.COMMUNITY_SPLIT,
    PagePath.COMMUNITY_STAFF_MANAGE,
    PagePath.STAFF_DETAIL,
    PagePath.STAFF_ADD,
    PagePath.COMMUNITY_USER_MANAGE,
    PagePath.COMMUNITY_USER_ADD,
    PagePath.HOME_COMMUNITY,
    PagePath.PROFILE
  ],
  
  [UserRole.COMMUNITY_MANAGER]: [
    PagePath.COMMUNITY_STAFF_MANAGE,
    PagePath.STAFF_DETAIL,
    PagePath.STAFF_ADD,
    PagePath.COMMUNITY_USER_MANAGE,
    PagePath.COMMUNITY_USER_ADD,
    PagePath.HOME_COMMUNITY,
    PagePath.PROFILE
  ],
  
  [UserRole.COMMUNITY_STAFF]: [
    PagePath.COMMUNITY_USER_MANAGE,
    PagePath.COMMUNITY_USER_ADD,
    PagePath.HOME_COMMUNITY,
    PagePath.PROFILE
  ],
  
  [UserRole.SUPERVISOR]: [
    PagePath.PROFILE
  ],
  
  [UserRole.SOLO]: [
    PagePath.PROFILE
  ]
}

// 角色-功能权限映射
export const RoleFeaturePermissions = {
  [UserRole.SUPER_ADMIN]: [
    FeaturePermission.CREATE_COMMUNITY,
    FeaturePermission.EDIT_COMMUNITY,
    FeaturePermission.DELETE_COMMUNITY,
    FeaturePermission.MERGE_COMMUNITY,
    FeaturePermission.SPLIT_COMMUNITY,
    FeaturePermission.TOGGLE_COMMUNITY_STATUS,
    FeaturePermission.ADD_STAFF,
    FeaturePermission.REMOVE_STAFF,
    FeaturePermission.VIEW_STAFF_DETAIL,
    FeaturePermission.ASSIGN_MANAGER,
    FeaturePermission.ADD_USER,
    FeaturePermission.REMOVE_USER,
    FeaturePermission.VIEW_USER_DETAIL,
    FeaturePermission.VIEW_UNCHECKED_DETAIL
  ],
  
  [UserRole.COMMUNITY_MANAGER]: [
    FeaturePermission.ADD_STAFF,
    FeaturePermission.REMOVE_STAFF,
    FeaturePermission.VIEW_STAFF_DETAIL,
    FeaturePermission.ASSIGN_MANAGER,
    FeaturePermission.ADD_USER,
    FeaturePermission.REMOVE_USER,
    FeaturePermission.VIEW_USER_DETAIL,
    FeaturePermission.VIEW_UNCHECKED_DETAIL
  ],
  
  [UserRole.COMMUNITY_STAFF]: [
    FeaturePermission.ADD_USER,
    FeaturePermission.REMOVE_USER,
    FeaturePermission.VIEW_USER_DETAIL,
    FeaturePermission.VIEW_UNCHECKED_DETAIL
  ],
  
  [UserRole.SUPERVISOR]: [],
  
  [UserRole.SOLO]: []
}

// 权限错误消息
export const PermissionErrorMessages = {
  NO_PAGE_ACCESS: '您没有权限访问此页面',
  NO_FEATURE_ACCESS: '您没有权限执行此操作',
  LOGIN_REQUIRED: '请先登录',
  ROLE_REQUIRED: '请先选择角色'
}

// 权限提示消息
export const PermissionTips = {
  SUPER_ADMIN_ONLY: '此功能仅限超级管理员使用',
  MANAGER_ONLY: '此功能仅限社区主管使用',
  STAFF_AND_ABOVE: '此功能仅限社区工作人员使用'
}
