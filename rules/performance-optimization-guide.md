# 性能优化指南

## 概述

本文档定义了 SafeGuard 前端项目的性能优化最佳实践，涵盖防抖、节流、虚拟滚动、懒加载等方面。

## 优化原则

1. **按需优化** - 先测量，后优化
2. **用户体验优先** - 优化应该提升用户体验
3. **渐进增强** - 从简单到复杂逐步优化
4. **可维护性** - 优化不应牺牲代码可读性

## 防抖（Debounce）

### 1. 基本概念

防抖：在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

### 2. 使用场景

- 搜索输入
- 窗口 resize
- 滚动事件
- 表单验证

### 3. 实现方式

```javascript
// utils/debounce.js

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
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
```

### 4. 使用示例

```vue
<template>
  <view class="search-container">
    <input
      v-model="searchKeyword"
      @input="handleSearchInput"
      placeholder="搜索用户..."
    />
    <view v-if="searching" class="searching">
      搜索中...
    </view>
    <view v-else>
      <user-item
        v-for="user in searchResults"
        :key="user.id"
        :user="user"
      />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { debounce } from '@/utils/debounce'

const searchKeyword = ref('')
const searchResults = ref([])
const searching = ref(false)

// ✅ 使用防抖
const handleSearchInput = debounce(async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }

  searching.value = true

  try {
    const results = await api.searchUsers(searchKeyword.value)
    searchResults.value = results
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    searching.value = false
  }
}, 300)

// ❌ 不使用防抖（会导致频繁请求）
const handleSearchInput = async () => {
  // 每次输入都会触发请求
  await api.searchUsers(searchKeyword.value)
}
</script>
```

## 节流（Throttle）

### 1. 基本概念

节流：规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

### 2. 使用场景

- 滚动加载
- 按钮点击
- 鼠标移动
- 窗口 resize

### 3. 实现方式

```javascript
// utils/throttle.js

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 节流后的函数
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
  }

  return throttled
}
```

### 4. 使用示例

```vue
<template>
  <scroll-view
    class="scroll-container"
    scroll-y
    @scrolltolower="handleScrollToLower"
  >
    <view v-for="item in items" :key="item.id" class="item">
      {{ item.name }}
    </view>
    <view v-if="loading" class="loading">
      加载中...
    </view>
  </scroll-view>
</template>

<script setup>
import { ref } from 'vue'
import { throttle } from '@/utils/throttle'

const items = ref([])
const loading = ref(false)
const currentPage = ref(1)

// ✅ 使用节流
const handleScrollToLower = throttle(async () => {
  if (loading.value) return

  loading.value = true
  currentPage.value++

  try {
    const newItems = await api.loadItems(currentPage.value)
    items.value.push(...newItems)
  } catch (error) {
    console.error('Load failed:', error)
  } finally {
    loading.value = false
  }
}, 500)

// ❌ 不使用节流（可能导致重复加载）
const handleScrollToLower = async () => {
  // 每次滚动到底部都会触发
  await api.loadItems(currentPage.value)
}
</script>
```

## 虚拟滚动

### 1. 基本概念

虚拟滚动：只渲染可视区域内的元素，大幅提升长列表性能。

### 2. 使用场景

- 长列表（>1000 项）
- 复杂列表项
- 需要高性能渲染的场景

### 3. 实现方式

```vue
<template>
  <view class="virtual-list-container">
    <view
      class="virtual-list-content"
      :style="{ height: `${totalHeight}px` }"
    >
      <view
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-list-item"
        :style="{
          transform: `translateY(${item.offset}px)`,
          height: `${itemHeight}px`
        }"
      >
        <slot :item="item.data" :index="item.index" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  items: any[]
  itemHeight: number
  containerHeight: number
}>()

const scrollTop = ref(0)

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

const startIndex = computed(() => {
  return Math.floor(scrollTop.value / props.itemHeight)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  return Math.min(
    startIndex.value + visibleCount + 5,
    props.items.length - 1
  )
})

const visibleItems = computed(() => {
  const items = []
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    items.push({
      id: props.items[i].id,
      data: props.items[i],
      index: i,
      offset: i * props.itemHeight
    })
  }
  return items
})

const handleScroll = (event) => {
  scrollTop.value = event.detail.scrollTop
}

onMounted(() => {
  // 添加滚动监听
})

onUnmounted(() => {
  // 移除滚动监听
})
</script>

<style scoped>
.virtual-list-container {
  height: 100%;
  overflow-y: auto;
}

.virtual-list-content {
  position: relative;
}

.virtual-list-item {
  position: absolute;
  left: 0;
  right: 0;
}
</style>
```

### 4. 使用示例

```vue
<template>
  <view class="user-list-container">
    <VirtualList
      :items="users"
      :item-height="80"
      :container-height="600"
    >
      <template #default="{ item, index }">
        <view class="user-item">
          <image :src="item.avatar" class="user-avatar" />
          <text class="user-name">{{ item.name }}</text>
        </view>
      </template>
    </VirtualList>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VirtualList from '@/components/VirtualList.vue'

const users = ref([])

onMounted(async () => {
  // 加载大量用户数据
  users.value = await api.loadUsers(10000)
})
</script>
```

## 懒加载

### 1. 图片懒加载

```vue
<template>
  <view class="image-container">
    <image
      v-for="(item, index) in images"
      :key="index"
      :src="item.loaded ? item.url : placeholder"
      :lazy-load="true"
      @load="handleImageLoad(index)"
      class="lazy-image"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'

const placeholder = '/static/placeholder.png'

const images = ref([
  { url: 'https://example.com/image1.jpg', loaded: false },
  { url: 'https://example.com/image2.jpg', loaded: false },
  { url: 'https://example.com/image3.jpg', loaded: false }
])

const handleImageLoad = (index) => {
  images.value[index].loaded = true
}
</script>
```

### 2. 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/pages/community-manage/community-manage',
    component: () => import('@/pages/community-manage/community-manage.vue')
  }
]

// 组件懒加载
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
)

// 带加载状态的懒加载
const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/AsyncComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

### 3. 路由懒加载

```javascript
// pages.json
{
  "pages": [
    {
      "path": "pages/community-manage/community-manage",
      "style": {
        "navigationBarTitleText": "社区管理"
      }
    }
  ]
}

// 使用分包懒加载
{
  "subPackages": [
    {
      "root": "pages/community",
      "pages": [
        {
          "path": "community-manage/community-manage",
          "style": {
            "navigationBarTitleText": "社区管理"
          }
        }
      ]
    }
  ]
}
```

## 计算属性优化

### 1. 使用计算属性缓存

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([])

// ✅ 使用计算属性（自动缓存）
const filteredItems = computed(() => {
  return items.value.filter(item => item.active)
})

const sortedItems = computed(() => {
  return filteredItems.value.sort((a, b) => a.id - b.id)
})

// ❌ 避免在模板中直接调用方法
const getFilteredItems = () => {
  return items.value.filter(item => item.active)
}
</script>
```

### 2. 避免不必要的计算

```vue
<script setup>
import { ref, computed } from 'vue'

const list = ref([])
const filterText = ref('')

// ✅ 只在 filterText 变化时重新计算
const filteredList = computed(() => {
  if (!filterText.value) {
    return list.value
  }
  return list.value.filter(item =>
    item.name.includes(filterText.value)
  )
})

// ❌ 每次访问都重新计算
const getFilteredList = () => {
  if (!filterText.value) {
    return list.value
  }
  return list.value.filter(item =>
    item.name.includes(filterText.value)
  )
}
</script>
```

## 列表渲染优化

### 1. 使用 key

```vue
<!-- ✅ 使用唯一的 key -->
<view v-for="item in items" :key="item.id">
  {{ item.name }}
</view>

<!-- ❌ 使用 index 作为 key（可能导致性能问题） -->
<view v-for="(item, index) in items" :key="index">
  {{ item.name }}
</view>
```

### 2. 避免不必要的响应式

```vue
<script setup>
import { ref, shallowRef } from 'vue'

// ✅ 使用 shallowRef 处理大数组
const largeList = shallowRef([])

// 加载数据
const loadData = async () => {
  const data = await api.loadLargeList()
  largeList.value = data
}

// ❌ 使用 ref（会导致深度响应式，性能差）
const largeList = ref([])
</script>
```

### 3. 使用 v-once

```vue
<template>
  <view>
    <!-- ✅ 静态内容只渲染一次 -->
    <div v-once>
      <h1>{{ staticTitle }}</h1>
      <p>{{ staticDescription }}</p>
    </div>

    <!-- 动态内容 -->
    <div>{{ dynamicContent }}</div>
  </div>
</template>
```

## 状态管理优化

### 1. 按需订阅状态

```vue
<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// ✅ 只订阅需要的状态
const userName = computed(() => userStore.userInfo?.nickname)
const userAvatar = computed(() => userStore.userInfo?.avatarUrl)

// ❌ 订阅整个 store（会导致不必要的更新）
const userInfo = computed(() => userStore.userInfo)
</script>
```

### 2. 使用持久化缓存

```javascript
// store/modules/user.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)

  // ✅ 使用缓存
  const loadUserInfo = async (forceRefresh = false) => {
    const cacheKey = 'user_info_cache'
    const cacheTime = 5 * 60 * 1000 // 5分钟

    // 检查缓存
    if (!forceRefresh) {
      const cached = uni.getStorageSync(cacheKey)
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        userInfo.value = cached.data
        return
      }
    }

    // 从服务器加载
    const data = await api.getUserInfo()
    userInfo.value = data

    // 保存到缓存
    uni.setStorageSync(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  return { userInfo, loadUserInfo }
})
```

## 网络请求优化

### 1. 请求合并

```javascript
// utils/requestBatcher.js

class RequestBatcher {
  constructor(batchDelay = 100) {
    this.batchDelay = batchDelay
    this.pendingRequests = new Map()
    this.timer = null
  }

  async batchRequest(key, requestFn) {
    return new Promise((resolve, reject) => {
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, [])
      }

      this.pendingRequests.get(key).push({ resolve, reject })

      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.executeBatch(key, requestFn)
        }, this.batchDelay)
      }
    })
  }

  async executeBatch(key, requestFn) {
    const requests = this.pendingRequests.get(key)
    this.pendingRequests.delete(key)
    this.timer = null

    try {
      const result = await requestFn()
      requests.forEach(({ resolve }) => resolve(result))
    } catch (error) {
      requests.forEach(({ reject }) => reject(error))
    }
  }
}

export const requestBatcher = new RequestBatcher()
```

### 2. 请求缓存

```javascript
// utils/requestCache.js

class RequestCache {
  constructor(cacheTime = 5 * 60 * 1000) {
    this.cache = new Map()
    this.cacheTime = cacheTime
  }

  async get(key, requestFn) {
    // 检查缓存
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data
    }

    // 发起请求
    const data = await requestFn()

    // 保存到缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    return data
  }

  clear() {
    this.cache.clear()
  }
}

export const requestCache = new RequestCache()
```

## 资源优化

### 1. 图片优化

```javascript
// utils/imageOptimizer.js

/**
 * 获取优化后的图片 URL
 * @param {string} url - 原始图片 URL
 * @param {Object} options - 优化选项
 * @returns {string} 优化后的图片 URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp'
  } = options

  // 如果是腾讯云 COS，可以使用图片处理参数
  if (url.includes('myqcloud.com')) {
    return `${url}?imageMogr2/thumbnail/${width}x${height}/quality/${quality}/format/${format}`
  }

  // 如果是阿里云 OSS，可以使用图片处理参数
  if (url.includes('aliyuncs.com')) {
    return `${url}?x-oss-process=image/resize,w_${width},h_${height}/quality,q_${quality},format,${format}`
  }

  return url
}
```

### 2. 字体优化

```css
/* 只加载需要的字体 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

/* 使用 font-display: swap 优化加载 */
body {
  font-family: 'CustomFont', sans-serif;
}
```

## 性能监控

### 1. 性能指标收集

```javascript
// utils/performanceMonitor.js

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
  }

  startMark(name) {
    this.metrics.set(name, {
      startTime: Date.now(),
      endTime: null,
      duration: null
    })
  }

  endMark(name) {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.endTime = Date.now()
      metric.duration = metric.endTime - metric.startTime

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${metric.duration}ms`)
      }

      return metric.duration
    }
  }

  measure(name, fn) {
    return async (...args) => {
      this.startMark(name)
      try {
        const result = await fn(...args)
        this.endMark(name)
        return result
      } catch (error) {
        this.endMark(name)
        throw error
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### 2. 使用示例

```javascript
import { performanceMonitor } from '@/utils/performanceMonitor'

// 监控函数执行时间
const loadData = performanceMonitor.measure('loadData', async () => {
  const data = await api.getData()
  return data
})

// 手动标记
performanceMonitor.startMark('processData')
// ... 处理数据
performanceMonitor.endMark('processData')
```

## 最佳实践

### 1. 优先级排序

1. **关键渲染路径** - 首屏渲染、用户交互
2. **网络请求** - 减少、合并、缓存
3. **DOM 操作** - 减少重排重绘
4. **JavaScript 执行** - 减少主线程阻塞

### 2. 测量优先

```javascript
// 在优化前先测量
const startTime = performance.now()

// 执行操作
await someOperation()

const endTime = performance.now()
console.log(`Operation took ${endTime - startTime}ms`)
```

### 3. 渐进式优化

```javascript
// 第一版：基本功能
const loadData = async () => {
  return await api.getData()
}

// 第二版：添加缓存
const loadData = async () => {
  const cached = getCachedData()
  if (cached) return cached
  const data = await api.getData()
  setCachedData(data)
  return data
}

// 第三版：添加预加载
const loadData = async () => {
  const cached = getCachedData()
  if (cached) {
    // 后台刷新缓存
    refreshCacheInBackground()
    return cached
  }
  const data = await api.getData()
  setCachedData(data)
  return data
}
```

## 参考资料

- [Vue 3 性能优化](https://cn.vuejs.org/guide/best-practices/performance.html)
- [Web 性能优化](https://web.dev/performance/)
- [uni-app 性能优化](https://uniapp.dcloud.net.cn/performance.html)