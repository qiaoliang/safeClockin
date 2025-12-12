# 权限控制系统使用指南

## 概述

SafeGuard 应用实现了基于角色的访问控制(RBAC)系统,用于管理用户对不同页面和功能的访问权限。

## 用户角色定义

系统定义了以下用户角色:

| 角色 | 代码 | 说明 |
|------|------|------|
| 超级管理员 | `super_admin` | 拥有所有权限,可管理社区、工作人员和用户 |
| 社区主管 | `community_manager` | 可管理工作人员和社区用户 |
| 社区专员 | `community_staff` | 仅可管理社区用户 |
| 监护人 | `supervisor` | 普通监护人角色 |
| 普通用户 | `solo` | 普通用户角色 |

## 权限映射

### 页面访问权限

#### 社区管理页面 (仅 super_admin)
- `/pages/community-manage/community-manage` - 社区列表
- `/pages/community-form/community-form` - 创建/编辑社区
- `/pages/community-merge/community-merge` - 社区合并
- `/pages/community-split/community-split` - 社区拆分

#### 工作人员管理页面 (super_admin, community_manager)
- `/pages/community-staff-manage/community-staff-manage` - 工作人员列表
- `/pages/staff-detail/staff-detail` - 工作人员详情
- `/pages/staff-add/staff-add` - 添加工作人员

#### 用户管理页面 (super_admin, community_manager, community_staff)
- `/pages/community-user-manage/community-user-manage` - 社区用户列表
- `/pages/community-user-add/community-user-add` - 添加用户

### 功能权限

#### 社区管理功能 (仅 super_admin)
- `create_community` - 创建社区
- `edit_community` - 编辑社区
- `delete_community` - 删除社区
- `merge_community` - 合并社区
- `split_community` - 拆分社区
- `toggle_community_status` - 启用/停用社区

#### 工作人员管理功能 (super_admin, community_manager)
- `add_staff` - 添加工作人员
- `remove_staff` - 移除工作人员
- `view_staff_detail` - 查看工作人员详情
- `assign_manager` - 指定社区主管

#### 用户管理功能 (super_admin, community_manager, community_staff)
- `add_user` - 添加用户
- `remove_user` - 移除用户
- `view_user_detail` - 查看用户详情
- `view_unchecked_detail` - 查看未打卡详情

## 使用方法

### 1. 页面级权限检查

在页面的 `onLoad` 生命周期中调用权限检查:

```javascript
import { onLoad } from '@dcloudio/uni-app'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

onLoad(() => {
  // 检查页面访问权限
  if (!checkPagePermission(PagePath.COMMUNITY_MANAGE)) {
    return // 权限不足,自动返回并提示
  }
  
  // 权限检查通过,继续页面初始化
  console.log('权限检查通过')
})
```

### 2. 功能级权限控制

在模板中使用 `v-if` 指令控制功能可见性:

```vue
<template>
  <!-- 只有有权限的用户才能看到此按钮 -->
  <view
    v-if="hasFeaturePermission(FeaturePermission.CREATE_COMMUNITY)"
    class="add-btn"
    @click="createCommunity"
  >
    创建社区
  </view>
</template>

<script setup>
import { hasFeaturePermission } from '@/utils/permission'
import { FeaturePermission } from '@/constants/permissions'
</script>
```

### 3. 在函数中检查权限

在执行敏感操作前检查权限:

```javascript
import { checkFeaturePermission } from '@/utils/permission'
import { FeaturePermission } from '@/constants/permissions'

const deleteCommunity = (communityId) => {
  // 检查删除权限
  if (!checkFeaturePermission(FeaturePermission.DELETE_COMMUNITY)) {
    return // 权限不足,自动提示
  }
  
  // 继续执行删除操作
  // ...
}
```

### 4. 角色判断

使用便捷的角色判断函数:

```javascript
import { 
  isSuperAdmin, 
  isCommunityManager, 
  isCommunityStaff 
} from '@/utils/permission'

// 检查是否为超级管理员
if (isSuperAdmin()) {
  // 执行超级管理员专属操作
}

// 检查是否为社区主管
if (isCommunityManager()) {
  // 执行社区主管专属操作
}
```

## API 参考

### 权限检查函数

#### `hasPagePermission(pagePath, userRole?)`
检查用户是否有访问指定页面的权限。

**参数:**
- `pagePath` (string): 页面路径
- `userRole` (string, 可选): 用户角色,默认使用当前用户角色

**返回:** boolean

#### `hasFeaturePermission(featureName, userRole?)`
检查用户是否有执行指定功能的权限。

**参数:**
- `featureName` (string): 功能名称
- `userRole` (string, 可选): 用户角色,默认使用当前用户角色

**返回:** boolean

#### `checkPagePermission(pagePath)`
页面权限守卫,权限不足时自动提示并返回。

**参数:**
- `pagePath` (string): 页面路径

**返回:** boolean

#### `checkFeaturePermission(featureName, showToast?)`
功能权限守卫,权限不足时可选择是否显示提示。

**参数:**
- `featureName` (string): 功能名称
- `showToast` (boolean, 可选): 是否显示提示,默认 true

**返回:** boolean

### 角色判断函数

- `isSuperAdmin(userRole?)` - 是否为超级管理员
- `isCommunityManager(userRole?)` - 是否为社区主管
- `isCommunityStaff(userRole?)` - 是否为社区专员
- `canManageCommunity(userRole?)` - 是否可以管理社区
- `canManageStaff(userRole?)` - 是否可以管理工作人员
- `canManageUsers(userRole?)` - 是否可以管理用户

## 权限拒绝处理

当用户权限不足时,系统会:

1. 显示错误提示消息
2. 自动返回上一页或重定向到登录页
3. 在控制台输出权限检查日志

可自定义权限拒绝处理:

```javascript
import { handlePermissionDenied } from '@/utils/permission'

handlePermissionDenied(
  '您没有权限执行此操作',  // 错误消息
  true,                    // 是否显示提示
  false                    // 是否重定向到登录页
)
```

## 最佳实践

1. **最小权限原则**: 只授予用户完成工作所需的最小权限
2. **防御性编程**: 在页面和功能两个层面都进行权限检查
3. **清晰的错误提示**: 权限不足时给予明确的提示信息
4. **日志记录**: 记录权限检查结果,便于调试和审计
5. **权限缓存**: 权限信息存储在用户状态中,避免重复查询

## 调试技巧

启用权限检查日志:

```javascript
// 在页面 onLoad 中
onLoad(() => {
  console.log('[权限检查] 页面:', PagePath.COMMUNITY_MANAGE)
  console.log('[权限检查] 当前角色:', getCurrentUserRole())
  
  const hasPermission = checkPagePermission(PagePath.COMMUNITY_MANAGE)
  
  console.log('[权限检查] 结果:', hasPermission ? '通过' : '拒绝')
})
```

## 扩展权限系统

### 添加新角色

1. 在 `src/constants/permissions.js` 中定义新角色:
```javascript
export const UserRole = {
  // 现有角色...
  NEW_ROLE: 'new_role'
}
```

2. 在权限映射中添加该角色的权限:
```javascript
export const RolePagePermissions = {
  // 现有映射...
  [UserRole.NEW_ROLE]: [
    // 该角色可访问的页面
  ]
}
```

### 添加新功能权限

1. 定义新功能权限:
```javascript
export const FeaturePermission = {
  // 现有权限...
  NEW_FEATURE: 'new_feature'
}
```

2. 将功能权限分配给相应角色:
```javascript
export const RoleFeaturePermissions = {
  [UserRole.SUPER_ADMIN]: [
    // 现有权限...
    FeaturePermission.NEW_FEATURE
  ]
}
```

## 常见问题

### Q: 如何测试不同角色的权限?
A: 可以在用户 store 中临时修改用户角色进行测试,或创建不同角色的测试账号。

### Q: 权限检查失败但没有提示?
A: 检查是否正确导入了权限检查函数,以及是否在正确的生命周期中调用。

### Q: 如何处理动态权限?
A: 当前系统基于静态角色权限。如需动态权限,可扩展权限检查函数,从后端API获取权限列表。

### Q: 页面权限和功能权限有什么区别?
A: 页面权限控制用户能否访问某个页面,功能权限控制用户能否使用页面内的特定功能。两者配合使用提供完整的权限控制。

## 相关文件

- `src/constants/permissions.js` - 权限常量定义
- `src/utils/permission.js` - 权限检查工具函数
- `src/mixins/permissionGuard.js` - 权限守卫混入
- `src/store/modules/user.js` - 用户状态管理(包含角色信息)

## 更新日志

### 2025-12-12
- ✅ 初始实现基于角色的权限控制系统
- ✅ 在9个社区管理页面中集成权限检查
- ✅ 实现页面级和功能级权限控制
- ✅ 提供完整的权限检查API和工具函数
