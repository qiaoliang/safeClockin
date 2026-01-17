# 代码风格指南

## 概述

本文档定义了 SafeGuard 前端项目的统一代码风格规范，重点关注 Vue 3 Composition API 的使用规范。

## 基本原则

1. **一致性优先** - 全项目保持一致的代码风格
2. **可读性** - 代码应该易于理解和维护
3. **简洁性** - 避免不必要的复杂度
4. **现代化** - 使用最新的 Vue 3 和 JavaScript 特性

## Vue 3 Composition API 规范

### 1. 组件定义

#### ✅ 推荐使用 `<script setup>`

```vue
<!-- ✅ 推荐：使用 script setup -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const loading = ref(false)
const dataList = ref([])

onMounted(async () => {
  await loadData()
})
</script>

<!-- ❌ 避免：使用 Options API -->
<script>
export default {
  data() {
    return {
      loading: false,
      dataList: []
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() { }
  }
}
</script>
```

### 2. 响应式数据定义

#### ✅ 使用 `ref` 定义基本类型和对象

```javascript
// ✅ 基本类型
const count = ref(0)
const message = ref('Hello')
const isVisible = ref(false)

// ✅ 对象类型
const userInfo = ref({
  userId: '',
  nickname: '',
  avatarUrl: ''
})

// ✅ 数组类型
const items = ref([])

// ❌ 避免：混用 reactive 和 ref
const state = reactive({
  count: 0,
  message: 'Hello'
})
```

#### ✅ 解构 ref 时使用 `.value`

```javascript
const count = ref(0)

// ✅ 在 setup 中使用 .value
const increment = () => {
  count.value++
}

// ✅ 在模板中自动解包，不需要 .value
<template>
  <div>{{ count }}</div>
</template>

// ❌ 错误：在模板中使用 .value
<template>
  <div>{{ count.value }}</div>
</template>
```

### 3. 计算属性

#### ✅ 使用 `computed` 定义计算属性

```javascript
const firstName = ref('John')
const lastName = ref('Doe')

// ✅ 只读计算属性
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// ✅ 可写计算属性
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(value) {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last
  }
})
```

### 4. 侦听器

#### ✅ 使用 `watch` 和 `watchEffect`

```javascript
const count = ref(0)
const user = ref({ name: 'John' })

// ✅ 监听单个 ref
watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
})

// ✅ 监听多个 ref
watch([count, user], ([newCount, newUser], [oldCount, oldUser]) => {
  console.log('Values changed:', newCount, newUser)
})

// ✅ 监听对象深层变化
watch(
  user,
  (newUser) => {
    console.log('User changed:', newUser)
  },
  { deep: true }
)

// ✅ 立即执行侦听器
watch(
  count,
  (newVal) => {
    console.log('Count is:', newVal)
  },
  { immediate: true }
)

// ✅ 使用 watchEffect 自动追踪依赖
watchEffect(() => {
  console.log(`Count is ${count.value}`)
})
```

### 5. 生命周期钩子

#### ✅ 在 `<script setup>` 中直接使用

```vue
<script setup>
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  console.log('Component mounted')
})

onUpdated(() => {
  console.log('Component updated')
})

onUnmounted(() => {
  console.log('Component unmounted')
})
</script>
```

### 6. Props 定义

#### ✅ 使用 `defineProps` 和 TypeScript 类型

```vue
<script setup>
// ✅ 使用数组定义（简单场景）
defineProps(['title', 'content'])

// ✅ 使用对象定义（推荐）
defineProps({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// ✅ 使用 TypeScript 类型定义（最佳）
interface Props {
  title: string
  content?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  disabled: false
})
</script>
```

### 7. 事件定义

#### ✅ 使用 `defineEmits`

```vue
<script setup>
// ✅ 使用数组定义
const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

// ✅ 使用 TypeScript 类型定义
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: FormData): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 使用事件
const handleSubmit = () => {
  emit('submit', formData.value)
}

const handleCancel = () => {
  emit('cancel')
}
</script>
```

### 8. 模板引用

#### ✅ 使用 `ref` 定义模板引用

```vue
<template>
  <input ref="inputRef" type="text" />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>
```

### 9. Composables（组合式函数）

#### ✅ 提取可复用逻辑

```javascript
// composables/useUserSearch.js
import { ref } from 'vue'
import { api } from '@/api'

export function useUserSearch() {
  const searchKeyword = ref('')
  const searchResults = ref([])
  const searching = ref(false)
  const error = ref('')

  const searchUsers = async () => {
    if (!searchKeyword.value.trim()) {
      searchResults.value = []
      return
    }

    searching.value = true
    error.value = ''

    try {
      const results = await api.searchUsers(searchKeyword.value)
      searchResults.value = results
    } catch (err) {
      error.value = '搜索失败，请重试'
      console.error('Search failed:', err)
    } finally {
      searching.value = false
    }
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
    error.value = ''
  }

  return {
    searchKeyword,
    searchResults,
    searching,
    error,
    searchUsers,
    clearSearch
  }
}
```

#### ✅ 在组件中使用 Composables

```vue
<script setup>
import { useUserSearch } from '@/composables/useUserSearch'

const {
  searchKeyword,
  searchResults,
  searching,
  searchUsers,
  clearSearch
} = useUserSearch()
</script>
```

## JavaScript/TypeScript 规范

### 1. 变量命名

```javascript
// ✅ 使用驼峰命名法
const userName = 'John'
const userId = '123'
const isLoading = false
const hasPermission = true

// ❌ 避免使用下划线
const user_name = 'John'
const user_id = '123'

// ✅ 常量使用大写
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'

// ✅ 布尔值使用 is/has/can 前缀
const isVisible = true
const hasPermission = true
const canEdit = false
```

### 2. 函数命名

```javascript
// ✅ 使用动词开头
const getUserInfo = () => { }
const handleSearch = () => { }
const onSubmit = () => { }
const isLoading = () => { }

// ✅ 异步函数使用 async/await
const loadData = async () => {
  try {
    const data = await api.fetchData()
    return data
  } catch (error) {
    console.error('Failed to load data:', error)
    throw error
  }
}

// ❌ 避免使用回调
const loadData = (callback) => {
  api.fetchData().then(callback)
}
```

### 3. 错误处理

```javascript
// ✅ 使用 try-catch 处理错误
const fetchData = async () => {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    console.error('Failed to fetch data:', error)
    showToast({ message: '加载数据失败，请重试' })
    throw error
  }
}

// ❌ 避免使用 .catch()
api.getData()
  .then(data => { })
  .catch(error => console.error(error))
```

### 4. 解构赋值

```javascript
// ✅ 使用解构赋值
const { userId, nickname, avatarUrl } = userInfo.value

// ✅ 解构并重命名
const { userId: id, nickname: name } = userInfo.value

// ✅ 解构数组
const [first, second] = items.value

// ✅ 解构函数参数
const processUser = ({ userId, nickname }) => {
  console.log(userId, nickname)
}
```

### 5. 模板字符串

```javascript
// ✅ 使用模板字符串
const message = `Hello, ${userName.value}!`

// ✅ 多行字符串
const html = `
  <div class="card">
    <h1>${title}</h1>
    <p>${content}</p>
  </div>
`

// ❌ 避免使用字符串拼接
const message = 'Hello, ' + userName.value + '!'
```

## CSS/SCSS 规范

### 1. 命名规范

```scss
// ✅ 使用 BEM 命名规范
.user-card { }
.user-card__avatar { }
.user-card__name { }
.user-card--disabled { }

// ✅ 使用 kebab-case
.my-component { }
.my-button { }
.my-input { }

// ❌ 避免使用驼峰
.myComponent { }
.myButton { }
```

### 2. 样式组织

```vue
<template>
  <div class="user-card">
    <div class="user-card__header">
      <img class="user-card__avatar" :src="avatarUrl" />
      <h3 class="user-card__name">{{ name }}</h3>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-card {
  padding: 20px;
  border-radius: 8px;
  background: #fff;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
```

## 导入顺序

```javascript
// 1. Vue 相关
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from 'pinia'

// 2. 第三方库
import { debounce } from 'lodash-es'
import { showToast } from '@dcloudio/uni-ui'

// 3. 项目内部导入
import { api } from '@/api'
import { useUserSearch } from '@/composables/useUserSearch'
import { formatDate } from '@/utils/date'

// 4. 类型定义
import type { UserInfo } from '@/types'

// 5. 样式导入
import './styles.scss'
```

## 注释规范

```javascript
// ✅ 单行注释：解释"为什么"
// 使用 Map 而不是 Object，因为需要保持插入顺序
const userMap = new Map()

// ✅ 多行注释：解释复杂逻辑
/**
 * 计算用户的完整地址
 * 包含省、市、区、街道等详细信息
 * 如果缺少某些字段，则跳过该字段
 */
const getFullAddress = (user) => {
  const parts = []
  if (user.province) parts.push(user.province)
  if (user.city) parts.push(user.city)
  return parts.join('')
}

// ❌ 避免无意义的注释
// 声明变量
const count = 0
```

## 最佳实践

### 1. 组件大小控制

- 单个组件文件不超过 **500 行**
- 超过 300 行考虑拆分
- 使用 composables 提取逻辑

### 2. Props 数量控制

- Props 数量不超过 **7 个**
- 超过 7 个考虑使用对象参数

### 3. 函数长度控制

- 单个函数不超过 **50 行**
- 复杂逻辑拆分为多个小函数

### 4. 嵌套层级控制

- 嵌套层级不超过 **3 层**
- 深层嵌套使用提前返回

```javascript
// ✅ 使用提前返回
const processUser = (user) => {
  if (!user) return null
  if (!user.userId) return null
  if (!user.isActive) return null

  // 处理逻辑
  return processData(user)
}

// ❌ 避免深层嵌套
const processUser = (user) => {
  if (user) {
    if (user.userId) {
      if (user.isActive) {
        // 处理逻辑
        return processData(user)
      }
    }
  }
}
```

## 工具配置

### ESLint 规则

项目已配置 ESLint，请确保遵循规则：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix
```

### Prettier 配置

建议使用 Prettier 格式化代码：

```bash
# 格式化代码
npx prettier --write "src/**/*.{vue,js,ts,scss}"
```

## 迁移指南

### 从 Options API 迁移到 Composition API

```vue
<!-- ❌ Options API -->
<script>
export default {
  data() {
    return {
      count: 0,
      message: 'Hello'
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  mounted() {
    console.log('Mounted')
  }
}
</script>

<!-- ✅ Composition API -->
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const message = ref('Hello')

const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}

onMounted(() => {
  console.log('Mounted')
})
</script>
```

## 参考资料

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Composition API FAQ](https://cn.vuejs.org/guide/extras/composition-api-faq.html)
- [Vue Style Guide](https://cn.vuejs.org/style-guide/)