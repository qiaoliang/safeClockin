# 性能优化使用指南

本文档介绍如何在 SafeGuard 前端项目中使用性能优化工具。

## 概述

项目提供了以下性能优化工具：

- `debounce(func, wait, immediate)` - 防抖函数
- `debouncePromise(func, wait)` - 防抖函数（Promise 版本）
- `throttle(func, wait, options)` - 节流函数
- `throttlePromise(func, wait)` - 节流函数（Promise 版本）
- `UserSearch` - 用户搜索组件（已集成防抖）
- `InfiniteScroll` - 无限滚动组件（已集成节流）

## 防抖（Debounce）

### 什么是防抖

防抖：在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

### 使用场景

- 搜索输入
- 表单验证
- 窗口 resize

### 基本使用

```javascript
import { debounce } from '@/utils/debounce'

// 搜索场景
const handleSearch = debounce(async (keyword) => {
  const results = await api.searchUsers(keyword)
  searchResults.value = results
}, 300)

// 在模板中使用
<input @input="handleSearch" />
```

### Promise 版本

```javascript
import { debouncePromise } from '@/utils/debounce'

const handleSearch = debouncePromise(async (keyword) => {
  return await api.searchUsers(keyword)
}, 300)

// 使用
const results = await handleSearch('test')
```

### 取消防抖

```javascript
import { debounce, cancelDebounce } from '@/utils/debounce'

const handleSearch = debounce(searchFunction, 300)

// 取消防抖
cancelDebounce(handleSearch)
```

## 节流（Throttle）

### 什么是节流

节流：规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

### 使用场景

- 滚动加载
- 按钮点击
- 鼠标移动

### 基本使用

```javascript
import { throttle } from '@/utils/throttle'

// 滚动加载场景
const handleScroll = throttle(async () => {
  const newItems = await api.loadMoreItems(currentPage.value)
  items.value.push(...newItems)
}, 500)

// 在模板中使用
<scroll-view @scrolltolower="handleScroll">
  <!-- ... -->
</scroll-view>
```

### Promise 版本

```javascript
import { throttlePromise } from '@/utils/throttle'

const handleScroll = throttlePromise(async () => {
  return await api.loadMoreItems(currentPage.value)
}, 500)

// 使用
const items = await handleScroll()
```

### 配置选项

```javascript
import { throttle } from '@/utils/throttle'

// 只在结束时执行
const handleScroll = throttle(loadFunction, 500, {
  leading: false,
  trailing: true
})

// 只在开始时执行
const handleClick = throttle(clickFunction, 500, {
  leading: true,
  trailing: false
})
```

### 取消节流

```javascript
import { throttle, cancelThrottle } from '@/utils/throttle'

const handleScroll = throttle(scrollFunction, 500)

// 取消节流
cancelThrottle(handleScroll)
```

## 组件使用

### UserSearch 组件

用户搜索组件已内置防抖功能，直接使用即可：

```vue
<template>
  <UserSearch @user-select="handleUserSelect" />
</template>

<script setup>
import UserSearch from '@/components/UserSearch.vue'

const handleUserSelect = (user) => {
  console.log('选中用户:', user)
}
</script>
```

### InfiniteScroll 组件

无限滚动组件已内置节流功能，直接使用即可：

```vue
<template>
  <InfiniteScroll
    :load-more="loadMoreData"
    :has-more="hasMore"
    @load-complete="handleLoadComplete"
  >
    <template #default="{ items }">
      <view v-for="item in items" :key="item.id">
        {{ item.name }}
      </view>
    </template>
  </InfiniteScroll>
</template>

<script setup>
import InfiniteScroll from '@/components/InfiniteScroll.vue'
import { ref } from 'vue'

const hasMore = ref(true)
const infiniteScrollRef = ref(null)

const loadMoreData = async ({ page, pageSize }) => {
  const response = await api.getItems({ page, pageSize })
  return response.data
}

const handleLoadComplete = ({ total, hasMore: noMore }) => {
  hasMore.value = noMore
}
</script>
```

## 最佳实践

### 1. 搜索场景使用防抖

```javascript
// ✅ 推荐：使用防抖
const handleSearch = debounce(async (keyword) => {
  const results = await api.search(keyword)
}, 300)

// ❌ 避免：每次输入都触发
const handleSearch = async (keyword) => {
  const results = await api.search(keyword)
}
```

### 2. 滚动加载使用节流

```javascript
// ✅ 推荐：使用节流
const handleScroll = throttle(async () => {
  await loadMoreData()
}, 500)

// ❌ 避免：每次滚动都触发
const handleScroll = async () => {
  await loadMoreData()
}
```

### 3. 按钮点击使用节流

```javascript
// ✅ 推荐：使用节流防止重复点击
const handleSubmit = throttle(async () => {
  await api.submitForm(formData)
}, 1000)

// ❌ 避免：可能重复提交
const handleSubmit = async () => {
  await api.submitForm(formData)
}
```

### 4. 选择合适的延迟时间

```javascript
// 搜索输入：300-500ms
const handleSearch = debounce(searchFunction, 300)

// 滚动加载：500-1000ms
const handleScroll = throttle(loadFunction, 500)

// 按钮点击：1000-2000ms
const handleClick = throttle(clickFunction, 1000)
```

## 性能对比

### 防抖前后对比

```
未使用防抖：
输入 "test" → 4 次请求 (t, te, tes, test)

使用防抖（300ms）：
输入 "test" → 1 次请求 (test)
性能提升：75%
```

### 节流前后对比

```
未使用节流：
滚动 1 秒 → 60 次触发（假设 60fps）

使用节流（500ms）：
滚动 1 秒 → 2 次触发
性能提升：96.7%
```

## 测试

### 测试防抖

```javascript
import { describe, it, expect, vi } from 'vitest'
import { debounce } from '@/utils/debounce'

describe('debounce', () => {
  it('should execute after wait time', () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 300)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
```

### 测试节流

```javascript
import { describe, it, expect, vi } from 'vitest'
import { throttle } from '@/utils/throttle'

describe('throttle', () => {
  it('should execute once during throttle period', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 300)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(1)

    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300)
    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
```

## 参考文档

- `rules/performance-optimization-guide.md` - 性能优化指南
- `CODE_REVIEW_REPORT.md` - 代码审查报告
- `utils/debounce.js` - 防抖工具源码
- `utils/throttle.js` - 节流工具源码