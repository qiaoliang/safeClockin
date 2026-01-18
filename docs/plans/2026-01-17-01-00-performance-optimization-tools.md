# 性能优化工具的实施计划

> 使用命令 `executing-plans`， 实现这个计划。 

**Goal:** 实现项目性能优化工具，包括防抖、节流、虚拟滚动等功能，提升搜索、滚动等场景的性能，改善用户体验。

**Architecture:** 创建独立的性能优化工具模块，提供防抖、节流、虚拟滚动等常用性能优化函数。在组件中集成这些工具，优化高频操作的性能。

**Tech Stack:** JavaScript (Vue 3), uni-app API, Vitest

---

## 前置条件

- 熟悉 Vue 3 Composition API
- 了解性能优化原理
- 理解防抖和节流的区别
- 熟悉 Vitest 测试框架

## 相关文档

- `rules/performance-optimization-guide.md` - 性能优化指南
- `rules/code-style-guide.md` - 代码风格指南
- `CODE_REVIEW_REPORT.md` - 代码审查报告（第 5.1.2 节）

---

## 任务 1: 创建防抖和节流工具

**目标**: 创建 `utils/debounce.js` 和 `utils/throttle.js` 模块，提供防抖和节流功能。

### 文件列表
- `src/utils/debounce.js` - 防抖工具模块
- `src/utils/throttle.js` - 节流工具模块
- `tests/unit/utils/debounce.test.js` - 防抖工具测试
- `tests/unit/utils/throttle.test.js` - 节流工具测试

### 步骤 1: 创建防抖工具

**文件**: `src/utils/debounce.js`

```javascript
/**
 * 防抖工具模块
 * 在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 */

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 * @example
 * const handleSearch = debounce(async (keyword) => {
 *   const results = await api.searchUsers(keyword)
 *   searchResults.value = results
 * }, 300)
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout

  return function executedFunction(...args) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }
}

/**
 * 防抖函数（Promise 版本）
 * @param {Function} func - 要防抖的异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 * @example
 * const handleSearch = debouncePromise(async (keyword) => {
 *   return await api.searchUsers(keyword)
 * }, 300)
 */
export function debouncePromise(func, wait = 300) {
  let timeout
  let pendingPromise = null

  return function executedFunction(...args) {
    return new Promise((resolve, reject) => {
      // 清除之前的定时器和 Promise
      if (timeout) {
        clearTimeout(timeout)
      }
      if (pendingPromise) {
        pendingPromise.reject(new Error('Debounced'))
        pendingPromise = null
      }

      // 创建新的 Promise
      const promise = { resolve, reject }
      pendingPromise = promise

      // 设置定时器
      timeout = setTimeout(async () => {
        timeout = null
        pendingPromise = null

        try {
          const result = await func.apply(this, args)
          promise.resolve(result)
        } catch (error) {
          promise.reject(error)
        }
      }, wait)
    })
  }
}

/**
 * 取消防抖
 * @param {Function} debouncedFn - 防抖后的函数
 */
export function cancelDebounce(debouncedFn) {
  if (debouncedFn && debouncedFn._timeout) {
    clearTimeout(debouncedFn._timeout)
    debouncedFn._timeout = null
  }
}
```

### 步骤 2: 创建节流工具

**文件**: `src/utils/throttle.js`

```javascript
/**
 * 节流工具模块
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 */

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在开始时立即执行，默认 true
 * @param {boolean} options.trailing - 是否在结束时执行，默认 true
 * @returns {Function} 节流后的函数
 * @example
 * const handleScroll = throttle(() => {
 *   loadMoreData()
 * }, 500)
 */
export function throttle(func, wait = 300, options = {}) {
  let timeout
  let context
  let args
  let result
  let previous = 0

  const { leading = true, trailing = true } = options

  const later = () => {
    previous = leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }

  const throttled = function (...params) {
    const now = Date.now()
    if (!previous && leading === false) previous = now

    const remaining = wait - (now - previous)
    context = this
    args = params

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining)
    }

    return result
  }

  throttled.cancel = () => {
    clearTimeout(timeout)
    previous = 0
    timeout = null
    context = null
    args = null
  }

  return throttled
}

/**
 * 节流函数（Promise 版本）
 * @param {Function} func - 要节流的异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 * @example
 * const handleScroll = throttlePromise(async () => {
 *   return await loadMoreData()
 * }, 500)
 */
export function throttlePromise(func, wait = 300) {
  let lastTime = 0
  let pendingPromise = null

  return function executedFunction(...args) {
    const now = Date.now()

    if (now - lastTime >= wait) {
      lastTime = now
      return func.apply(this, args)
    }

    // 如果在节流期内，返回之前的 Promise
    if (pendingPromise) {
      return pendingPromise
    }

    // 创建新的 Promise
    pendingPromise = func.apply(this, args).finally(() => {
      pendingPromise = null
    })

    return pendingPromise
  }
}

/**
 * 取消节流
 * @param {Function} throttledFn - 节流后的函数
 */
export function cancelThrottle(throttledFn) {
  if (throttledFn && throttledFn.cancel) {
    throttledFn.cancel()
  }
}
```

### 步骤 3: 创建防抖测试

**文件**: `tests/unit/utils/debounce.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, debouncePromise, cancelDebounce } from '@/utils/debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debounce', () => {
    it('应该在等待时间后执行函数', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时重新计时', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      vi.advanceTimersByTime(100)
      debouncedFn()
      vi.advanceTimersByTime(100)
      debouncedFn()
      vi.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该支持立即执行', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300, true)

      debouncedFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该正确传递参数', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该保持正确的 this 上下文', () => {
      const obj = {
        value: 42,
        method: debounce(function() {
          return this.value
        }, 300)
      }

      const result = obj.method()
      vi.advanceTimersByTime(300)

      expect(result).toBe(42)
    })
  })

  describe('debouncePromise', () => {
    it('应该在等待时间后执行异步函数', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = debouncePromise(mockFn, 300)

      const promise = debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      const result = await promise

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(result).toBe('result')
    })

    it('应该在多次调用时只执行最后一次', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = debouncePromise(mockFn, 300)

      const promise1 = debouncedFn('call1')
      vi.advanceTimersByTime(100)
      const promise2 = debouncedFn('call2')
      vi.advanceTimersByTime(100)
      const promise3 = debouncedFn('call3')
      vi.advanceTimersByTime(300)

      await promise3

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call3')
    })
  })

  describe('cancelDebounce', () => {
    it('应该取消防抖执行', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      cancelDebounce(debouncedFn)
      vi.advanceTimersByTime(300)

      expect(mockFn).not.toHaveBeenCalled()
    })
  })
})
```

### 步骤 4: 创建节流测试

**文件**: `tests/unit/utils/throttle.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle, throttlePromise, cancelThrottle } from '@/utils/throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('throttle', () => {
    it('应该在节流期内只执行一次', () => {
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

    it('应该支持配置 leading 选项', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300, { leading: false })

      throttledFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该支持配置 trailing 选项', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300, { trailing: false })

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该正确传递参数', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300)

      throttledFn('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该保持正确的 this 上下文', () => {
      const obj = {
        value: 42,
        method: throttle(function() {
          return this.value
        }, 300)
      }

      const result = obj.method()
      expect(result).toBe(42)
    })
  })

  describe('throttlePromise', () => {
    it('应该在节流期内只执行一次异步函数', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const throttledFn = throttlePromise(mockFn, 300)

      const promise1 = throttledFn('call1')
      const promise2 = throttledFn('call2')

      await promise1

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call1')
    })
  })

  describe('cancelThrottle', () => {
    it('应该取消节流执行', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300)

      throttledFn()
      cancelThrottle(throttledFn)

      vi.advanceTimersByTime(300)
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
```

### 步骤 5: 运行测试

**命令**:
```bash
npm run test:unit -- tests/unit/utils/debounce.test.js tests/unit/utils/throttle.test.js
```

**预期输出**:
```
✓ tests/unit/utils/debounce.test.js (9)
  ✓ debounce (9)
    ✓ debounce (5)
    ✓ debouncePromise (2)
    ✓ cancelDebounce (1)

✓ tests/unit/utils/throttle.test.js (9)
  ✓ throttle (9)
    ✓ throttle (5)
    ✓ throttlePromise (1)
    ✓ cancelThrottle (1)

Test Files  2 passed (2)
     Tests  18 passed (18)
  Start at  15:00:00
  Duration  2.45s
```

### 步骤 6: 提交代码

**命令**:
```bash
git add src/utils/debounce.js src/utils/throttle.js tests/unit/utils/debounce.test.js tests/unit/utils/throttle.test.js
git commit -m "feat: 实现防抖和节流性能优化工具

- 创建 debounce.js 防抖工具模块
- 创建 throttle.js 节流工具模块
- 支持 Promise 版本的防抖和节流
- 提供取消功能
- 添加完整的单元测试覆盖
- 遵循 performance-optimization-guide.md 规范

参考: CODE_REVIEW_REPORT.md 第 5.1.2 节"
```

---

## 任务 2: 在搜索场景中使用防抖

**目标**: 在搜索输入场景中使用防抖，减少不必要的 API 请求。

### 文件列表
- `src/components/UserSearch.vue` - 用户搜索组件（新建）
- `tests/unit/components/UserSearch.test.js` - 用户搜索组件测试

### 步骤 1: 创建用户搜索组件

**文件**: `src/components/UserSearch.vue`

```vue
<template>
  <view class="user-search">
    <view class="search-input-wrapper">
      <uni-easyinput
        v-model="searchKeyword"
        placeholder="搜索用户..."
        :clearable="true"
        @input="handleSearchInput"
        @clear="handleClear"
      />
      <view v-if="searching" class="search-indicator">
        <uni-load-more status="loading" :content-text="{ contentdown: '搜索中...' }" />
      </view>
    </view>

    <view v-if="error" class="error-message">
      {{ error }}
    </view>

    <view v-if="searchResults.length > 0" class="search-results">
      <view
        v-for="user in searchResults"
        :key="user.user_id"
        class="user-item"
        @click="handleUserClick(user)"
      >
        <image
          :src="user.avatar_url || '/static/logo.png'"
          class="user-avatar"
          mode="aspectFill"
        />
        <view class="user-info">
          <text class="user-name">{{ user.nickname || user.name }}</text>
          <text class="user-phone">{{ formatPhone(user.phone_number) }}</text>
        </view>
      </view>
    </view>

    <view v-else-if="searchKeyword && !searching && searchResults.length === 0" class="empty-state">
      <text class="empty-text">未找到匹配的用户</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { debounce } from '@/utils/debounce'
import { searchUsers } from '@/api/user'

const props = defineProps({
  // 是否自动聚焦
  autoFocus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['user-select'])

const searchKeyword = ref('')
const searchResults = ref([])
const searching = ref(false)
const error = ref('')

// 使用防抖处理搜索输入
const handleSearchInput = debounce(async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    error.value = ''
    return
  }

  searching.value = true
  error.value = ''

  try {
    const response = await searchUsers(searchKeyword.value.trim())
    
    if (response.code === 1) {
      searchResults.value = response.data || []
    } else {
      error.value = response.msg || '搜索失败'
      searchResults.value = []
    }
  } catch (err) {
    error.value = '网络错误，请重试'
    searchResults.value = []
  } finally {
    searching.value = false
  }
}, 300)

// 处理清空搜索
const handleClear = () => {
  searchKeyword.value = ''
  searchResults.value = []
  error.value = ''
}

// 处理用户点击
const handleUserClick = (user) => {
  emit('user-select', user)
  handleClear()
}

// 格式化电话号码
const formatPhone = (phone) => {
  if (!phone) return ''
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
  return phone
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.user-search {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: $uni-spacing-base;
}

.search-indicator {
  position: absolute;
  right: $uni-spacing-base;
  top: 50%;
  transform: translateY(-50%);
}

.error-message {
  color: $uni-error;
  font-size: $uni-font-size-sm;
  margin-bottom: $uni-spacing-base;
}

.search-results {
  max-height: 400rpx;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-base;
  border-bottom: 1rpx solid $uni-border-1;
  transition: background-color 0.2s;

  &:active {
    background-color: $uni-bg-color-grey;
  }
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: $uni-spacing-base;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name {
  font-size: $uni-font-size-base;
  color: $uni-tabbar-color;
  font-weight: 500;
}

.user-phone {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}

.empty-state {
  padding: $uni-spacing-xxl;
  text-align: center;
}

.empty-text {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}
</style>
```

### 步骤 2: 创建用户搜索组件测试

**文件**: `tests/unit/components/UserSearch.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UserSearch from '@/components/UserSearch.vue'
import { searchUsers } from '@/api/user'

// Mock API
vi.mock('@/api/user', () => ({
  searchUsers: vi.fn()
}))

// Mock uni-easyinput
vi.mock('@/uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.vue', {
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})

describe('UserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该在输入时使用防抖', async () => {
    searchUsers.mockResolvedValue({
      code: 1,
      data: [{ user_id: '1', nickname: 'Test User' }]
    })

    const wrapper = mount(UserSearch)

    // 输入搜索关键词
    const input = wrapper.find('input')
    await input.setValue('test')

    // 立即检查，不应该触发搜索
    expect(searchUsers).not.toHaveBeenCalled()

    // 快进 300ms
    vi.advanceTimersByTime(300)

    // 现在应该触发搜索
    expect(searchUsers).toHaveBeenCalledWith('test')
  })

  it('应该在多次输入时重新计时', async () => {
    searchUsers.mockResolvedValue({
      code: 1,
      data: []
    })

    const wrapper = mount(UserSearch)
    const input = wrapper.find('input')

    // 第一次输入
    await input.setValue('test')
    vi.advanceTimersByTime(100)

    // 第二次输入
    await input.setValue('test user')
    vi.advanceTimersByTime(100)

    // 第三次输入
    await input.setValue('test user name')
    vi.advanceTimersByTime(300)

    // 应该只触发一次搜索
    expect(searchUsers).toHaveBeenCalledTimes(1)
    expect(searchUsers).toHaveBeenCalledWith('test user name')
  })

  it('应该在清空输入时清空搜索结果', async () => {
    searchUsers.mockResolvedValue({
      code: 1,
      data: [{ user_id: '1', nickname: 'Test User' }]
    })

    const wrapper = mount(UserSearch)
    const input = wrapper.find('input')

    await input.setValue('test')
    vi.advanceTimersByTime(300)

    // 清空输入
    await wrapper.vm.handleClear()

    expect(wrapper.vm.searchKeyword).toBe('')
    expect(wrapper.vm.searchResults).toEqual([])
  })

  it('应该在用户点击时触发 user-select 事件', async () => {
    searchUsers.mockResolvedValue({
      code: 1,
      data: [{ user_id: '1', nickname: 'Test User' }]
    })

    const wrapper = mount(UserSearch)
    const input = wrapper.find('input')

    await input.setValue('test')
    vi.advanceTimersByTime(300)

    // 点击用户
    await wrapper.find('.user-item').trigger('click')

    expect(wrapper.emitted('user-select')).toBeTruthy()
    expect(wrapper.emitted('user-select')[0][0]).toEqual({
      user_id: '1',
      nickname: 'Test User'
    })
  })
})
```

### 步骤 3: 运行测试

**命令**:
```bash
npm run test:unit -- tests/unit/components/UserSearch.test.js
```

**预期输出**:
```
✓ tests/unit/components/UserSearch.test.js (4)
  ✓ UserSearch (4)

Test Files  1 passed (1)
     Tests  4 passed (4)
  Start at  15:05:00
  Duration  1.34s
```

### 步骤 4: 提交代码

**命令**:
```bash
git add src/components/UserSearch.vue tests/unit/components/UserSearch.test.js
git commit -m "feat: 创建用户搜索组件并使用防抖优化

- 创建 UserSearch 组件
- 使用防抖处理搜索输入
- 减少不必要的 API 请求
- 支持用户选择和清空功能
- 添加组件测试
- 遵循 performance-optimization-guide.md 规范

参考: CODE_REVIEW_REPORT.md 第 5.1.2 节"
```

---

## 任务 3: 在滚动场景中使用节流

**目标**: 在滚动加载场景中使用节流，避免频繁触发加载。

### 文件列表
- `src/components/InfiniteScroll.vue` - 无限滚动组件（新建）
- `tests/unit/components/InfiniteScroll.test.js` - 无限滚动组件测试

### 步骤 1: 创建无限滚动组件

**文件**: `src/components/InfiniteScroll.vue`

```vue
<template>
  <view class="infinite-scroll">
    <scroll-view
      class="scroll-container"
      scroll-y
      :scroll-top="scrollTop"
      @scrolltolower="handleScrollToLower"
    >
      <slot :items="items" />
      
      <view v-if="loading" class="loading-state">
        <uni-load-more status="loading" />
      </view>
      
      <view v-if="hasMore === false && items.length > 0" class="end-state">
        <text class="end-text">没有更多数据了</text>
      </view>
      
      <view v-if="items.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { throttle } from '@/utils/throttle'

const props = defineProps({
  // 加载数据的函数
  loadMore: {
    type: Function,
    required: true
  },
  // 是否还有更多数据
  hasMore: {
    type: Boolean,
    default: true
  },
  // 每页数据量
  pageSize: {
    type: Number,
    default: 20
  }
})

const emit = defineEmits(['load-complete', 'load-error'])

const items = ref([])
const loading = ref(false)
const currentPage = ref(1)
const scrollTop = ref(0)

// 使用节流处理滚动到底部
const handleScrollToLower = throttle(async () => {
  if (loading.value || !props.hasMore) {
    return
  }

  loading.value = true

  try {
    const newItems = await props.loadMore({
      page: currentPage.value + 1,
      pageSize: props.pageSize
    })

    if (newItems && newItems.length > 0) {
      items.value.push(...newItems)
      currentPage.value++
      emit('load-complete', {
        total: items.value.length,
        page: currentPage.value
      })
    } else {
      emit('load-complete', {
        total: items.value.length,
        page: currentPage.value,
        hasMore: false
      })
    }
  } catch (error) {
    console.error('加载更多数据失败:', error)
    emit('load-error', error)
  } finally {
    loading.value = false
  }
}, 500)

// 重置列表
const reset = () => {
  items.value = []
  currentPage.value = 1
  scrollTop.value = 0
}

// 暴露方法给父组件
defineExpose({
  reset,
  items,
  loading
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.infinite-scroll {
  width: 100%;
  height: 100%;
}

.scroll-container {
  width: 100%;
  height: 100%;
}

.loading-state,
.end-state,
.empty-state {
  padding: $uni-spacing-xxl;
  text-align: center;
}

.end-text,
.empty-text {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}
</style>
```

### 步骤 2: 创建无限滚动组件测试

**文件**: `tests/unit/components/InfiniteScroll.test.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InfiniteScroll from '@/components/InfiniteScroll.vue'

describe('InfiniteScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该在滚动到底部时使用节流加载更多数据', async () => {
    const loadMore = vi.fn().mockResolvedValue([
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      }
    })

    // 触发滚动到底部
    await wrapper.find('.scroll-container').trigger('scrolltolower')

    // 立即检查，不应该触发加载
    expect(loadMore).not.toHaveBeenCalled()

    // 快进 500ms
    vi.advanceTimersByTime(500)

    // 现在应该触发加载
    expect(loadMore).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20
    })
  })

  it('应该在加载中时不重复触发加载', async () => {
    const loadMore = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([{ id: '1', name: 'Item 1' }])
        }, 1000)
      })
    })

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      }
    })

    // 第一次触发
    await wrapper.find('.scroll-container').trigger('scrolltolower')
    vi.advanceTimersByTime(500)

    // 第二次触发（加载中）
    await wrapper.find('.scroll-container').trigger('scrolltolower')
    vi.advanceTimersByTime(500)

    // 应该只调用一次
    expect(loadMore).toHaveBeenCalledTimes(1)
  })

  it('应该在无更多数据时不触发加载', async () => {
    const loadMore = vi.fn()

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: false
      }
    })

    // 触发滚动到底部
    await wrapper.find('.scroll-container').trigger('scrolltolower')
    vi.advanceTimersByTime(500)

    // 不应该触发加载
    expect(loadMore).not.toHaveBeenCalled()
  })

  it('应该支持重置列表', async () => {
    const loadMore = vi.fn().mockResolvedValue([
      { id: '1', name: 'Item 1' }
    ])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      }
    })

    // 加载数据
    await wrapper.find('.scroll-container').trigger('scrolltolower')
    vi.advanceTimersByTime(500)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.vm.items.length).toBe(1)

    // 重置
    wrapper.vm.reset()

    expect(wrapper.vm.items.length).toBe(0)
    expect(wrapper.vm.currentPage).toBe(1)
  })
})
```

### 步骤 3: 运行测试

**命令**:
```bash
npm run test:unit -- tests/unit/components/InfiniteScroll.test.js
```

**预期输出**:
```
✓ tests/unit/components/InfiniteScroll.test.js (4)
  ✓ InfiniteScroll (4)

Test Files  1 passed (1)
     Tests  4 passed (4)
  Start at  15:10:00
  Duration  1.23s
```

### 步骤 4: 提交代码

**命令**:
```bash
git add src/components/InfiniteScroll.vue tests/unit/components/InfiniteScroll.test.js
git commit -m "feat: 创建无限滚动组件并使用节流优化

- 创建 InfiniteScroll 组件
- 使用节流处理滚动加载
- 避免频繁触发加载请求
- 支持重置和加载状态管理
- 添加组件测试
- 遵循 performance-optimization-guide.md 规范

参考: CODE_REVIEW_REPORT.md 第 5.1.2 节"
```

---

## 任务 4: 创建性能优化使用文档

**目标**: 创建性能优化使用文档，指导开发者如何使用性能优化工具。

### 文件列表
- `docs/performance-optimization-usage.md` - 性能优化使用文档

### 步骤 1: 创建性能优化使用文档

**文件**: `docs/performance-optimization-usage.md`

```markdown
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

## 参考文档

- `rules/performance-optimization-guide.md` - 性能优化指南
- `CODE_REVIEW_REPORT.md` - 代码审查报告
- `utils/debounce.js` - 防抖工具源码
- `utils/throttle.js` - 节流工具源码
```

### 步骤 2: 提交代码

**命令**:
```bash
git add docs/performance-optimization-usage.md
git commit -m "docs: 创建性能优化使用文档

- 创建性能优化使用指南
- 提供防抖和节流的使用示例
- 提供组件使用示例
- 提供最佳实践建议
- 包含性能对比数据
- 帮助开发者快速上手性能优化

参考: CODE_REVIEW_REPORT.md 第 5.1.2 节"
```

---

## 验证步骤

### 1. 运行所有测试

**命令**:
```bash
npm run test:unit:run
```

**预期输出**: 所有测试通过

### 2. 检查代码覆盖率

**命令**:
```bash
npm run test:coverage
```

**预期输出**: 性能优化相关模块覆盖率 > 90%

### 3. 手动测试

**测试场景**:
1. 在搜索框中快速输入，验证是否只触发一次搜索请求
2. 滚动列表到底部，验证加载请求是否被节流
3. 连续点击按钮，验证是否被节流

### 4. 性能测试

**命令**:
```bash
# 使用 Chrome DevTools Performance 面板
# 记录搜索输入和滚动操作的性能数据
# 对比使用防抖/节流前后的性能差异
```

### 5. 代码审查

**检查项**:
- [ ] 所有高频操作都使用了防抖或节流
- [ ] 防抖和节流的延迟时间合理
- [ ] 组件正确使用了性能优化工具
- [ ] 测试覆盖率达标

---

## 总结

本实施计划实现了以下目标：

1. ✅ 创建了防抖和节流性能优化工具
2. ✅ 创建了用户搜索组件（集成防抖）
3. ✅ 创建了无限滚动组件（集成节流）
4. ✅ 创建了性能优化使用文档

通过以上改进，项目的性能得到显著提升，用户体验更加流畅。

## 下一步

根据 CODE_REVIEW_REPORT.md，接下来应该实施以下高优先级任务：

1. 启用 TypeScript 严格模式
2. 添加全局错误处理器
3. 添加更多组件文档

---

**计划创建时间**: 2026-01-17
**预计完成时间**: 1-2 周
**优先级**: 高