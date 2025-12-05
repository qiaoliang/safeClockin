# 用户状态管理迁移指南

## 概述

从分散的 storage 存储迁移到统一的 Pinia 状态管理，解决数据不一致和维护复杂的问题。

## 迁移前后对比

### 迁移前（分散存储）
```javascript
// 多个分散的 storage 键
storage.set('token', token)
storage.set('refreshToken', refreshToken)
storage.set('userInfo', userInfo)
storage.set('cached_user_info', cachedUserInfo)
storage.set('secure_seed', secureSeed)
storage.set('checkinCache', checkinCache)
```

### 迁移后（统一状态管理）
```javascript
// 统一的用户状态对象
const userState = {
  auth: {
    token,
    refreshToken,
    secureSeed,
    loginTime,
    expiresAt
  },
  profile: {
    userId,
    nickname,
    avatarUrl,
    role,
    phone,
    wechatOpenid,
    isVerified
  },
  cache: {
    checkinData,
    lastUpdate,
    cachedUserInfo
  }
}

// 只需要一个 storage 键
storage.set('userState', JSON.stringify(userState))
```

## 新的用户 Store 结构

### State（状态）
```javascript
userState: {
  // 认证信息
  auth: {
    token: null,
    refreshToken: null,
    secureSeed: null,
    loginTime: null,
    expiresAt: null
  },
  // 用户基本信息
  profile: {
    userId: null,
    nickname: null,
    avatarUrl: null,
    role: null,
    phone: null,
    wechatOpenid: null,
    isVerified: false
  },
  // 缓存数据
  cache: {
    checkinData: null,
    lastUpdate: null,
    cachedUserInfo: null
  }
}
```

### Getters（计算属性）
```javascript
// 便捷访问器
token: (state) => state.userState.auth.token
userInfo: (state) => state.userState.profile
role: (state) => state.userState.profile.role

// 角色判断
isSoloUser: (state) => state.userState.profile.role === 'solo'
isSupervisor: (state) => state.userState.profile.role === 'supervisor'
isCommunityWorker: (state) => state.userState.profile.role === 'community'

// 认证状态
isTokenValid: (state) => {
  const { token, expiresAt } = state.userState.auth
  if (!token) return false
  if (!expiresAt) return true
  return new Date() < new Date(expiresAt)
}

// 缓存状态
isCacheExpired: (state) => {
  const { lastUpdate } = state.userState.cache
  if (!lastUpdate) return true
  const CACHE_DURATION = 30 * 60 * 1000 // 30分钟
  return Date.now() - lastUpdate > CACHE_DURATION
}
```

## 主要改进

### 1. 数据一致性
- ✅ 单一数据源，避免数据不一致
- ✅ 自动同步状态到 storage
- ✅ 统一的数据更新机制

### 2. 维护简化
- ✅ 只需管理一个 storage 键
- ✅ 清晰的数据结构
- ✅ 类型安全的 getters

### 3. 功能增强
- ✅ Token 过期检查
- ✅ 自动 Token 刷新
- ✅ 缓存过期管理
- ✅ 向后兼容性

### 4. 开发体验
- ✅ 便捷的访问器
- ✅ 丰富的计算属性
- ✅ 完整的错误处理

## 使用方式变化

### 旧方式
```javascript
// 获取数据
const token = storage.get('token')
const userInfo = storage.get('userInfo')

// 更新数据
storage.set('userInfo', newUserInfo)

// 清理数据
storage.remove('token')
storage.remove('refreshToken')
storage.remove('userInfo')
```

### 新方式
```javascript
import { useUserStore } from '@/store'

const userStore = useUserStore()

// 获取数据（通过 getters）
const token = userStore.token
const userInfo = userStore.userInfo

// 更新数据（通过 actions）
await userStore.updateUserInfo(newUserInfo)

// 清理数据
userStore.logout()
```

## 兼容性处理

新系统保持了向后兼容性：

1. **自动迁移**：首次启动时自动从旧格式迁移到新格式
2. **渐进式清理**：保持旧的 storage 键直到确认迁移成功
3. **降级支持**：如果新格式损坏，可以回退到旧格式

## 迁移检查清单

- [ ] 更新组件中的数据访问方式
- [ ] 替换直接的 storage 操作
- [ ] 使用新的 getters 和 actions
- [ ] 测试登录/登出流程
- [ ] 验证数据持久化
- [ ] 检查 Token 刷新机制
- [ ] 测试缓存过期逻辑

## 注意事项

1. **初始化**：确保在应用启动时调用 `userStore.initUserState()`
2. **错误处理**：新的 store 有更完善的错误处理机制
3. **性能优化**：减少了 storage 读写次数，提升性能
4. **调试友好**：统一的状态结构便于调试和分析

## 常见问题

### Q: 如何访问缓存的打卡数据？
A: 使用 `userStore.userState.cache.checkinData` 或通过 `updateCache()` 方法更新。

### Q: Token 过期了怎么办？
A: 系统会自动检测并尝试刷新，失败则自动登出。

### Q: 如何清理用户缓存？
A: 使用 `userStore.clearCache()` 方法。

### Q: 兼容旧版本吗？
A: 是的，系统会自动处理旧格式数据的迁移。