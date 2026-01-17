# 组件开发规范

## 概述

本文档定义了 SafeGuard 前端项目的组件开发规范，包括 Props 定义、事件处理、样式约定等方面的最佳实践。

## 组件基本原则

1. **单一职责** - 每个组件只负责一个功能
2. **可复用性** - 组件应该高度可配置和可复用
3. **可测试性** - 组件应该易于测试
4. **可访问性** - 组件应该支持无障碍访问

## 组件文件组织

### 目录结构

```
components/
├── common/              # 通用组件
│   ├── Button.vue
│   ├── Input.vue
│   └── Modal.vue
├── user-info-form/      # 复杂组件（使用目录）
│   ├── index.vue
│   ├── components/
│   │   ├── PersonalInfo.vue
│   │   └── ContactInfo.vue
│   ├── composables/
│   │   ├── useValidation.js
│   │   └── useFormData.js
│   └── styles/
│       └── index.scss
└── community/           # 业务组件
    └── CommunityCard.vue
```

### 文件命名

```javascript
// ✅ 使用 PascalCase
UserInfoCard.vue
CommunityList.vue
EventDetailModal.vue

// ❌ 避免使用 kebab-case
user-info-card.vue
community-list.vue
```

## Props 定义规范

### 1. 基本定义

```vue
<script setup>
import { defineProps } from 'vue'

// ✅ 简单场景使用数组
defineProps(['title', 'content'])

// ✅ 推荐使用对象定义
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
  },
  count: {
    type: Number,
    default: 0
  }
})
</script>
```

### 2. TypeScript 类型定义（推荐）

```vue
<script setup lang="ts">
interface Props {
  title: string
  content?: string
  disabled?: boolean
  count?: number
  metadata?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  disabled: false,
  count: 0,
  metadata: () => ({})
})
</script>
```

### 3. Props 验证

```vue
<script setup>
defineProps({
  // ✅ 必填
  userId: {
    type: String,
    required: true
  },

  // ✅ 默认值
  message: {
    type: String,
    default: 'Hello'
  },

  // ✅ 自定义验证
  email: {
    type: String,
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
  },

  // ✅ 复杂类型默认值
  user: {
    type: Object,
    default: () => ({
      id: '',
      name: '',
      avatar: ''
    })
  },

  // ✅ 数组类型
  tags: {
    type: Array,
    default: () => []
  }
})
</script>
```

### 4. Props 命名规范

```javascript
// ✅ 使用 camelCase
defineProps({
  userName: String,
  userId: String,
  isActive: Boolean,
  hasPermission: Boolean
})

// ❌ 避免使用 kebab-case
defineProps({
  'user-name': String,
  'user-id': String
})
```

### 5. Props 数量限制

- 单个组件的 Props 不超过 **7 个**
- 超过 7 个考虑使用对象参数

```vue
<script setup>
// ❌ Props 过多
defineProps({
  title: String,
  subtitle: String,
  description: String,
  imageUrl: String,
  linkUrl: String,
  showIcon: Boolean,
  disabled: Boolean,
  onClick: Function
})

// ✅ 使用对象参数
interface CardProps {
  title: string
  subtitle?: string
  description?: string
  image?: {
    url: string
    link?: string
  }
  options?: {
    showIcon?: boolean
    disabled?: boolean
  }
  onClick?: () => void
}

const props = withDefaults(defineProps<CardProps>(), {
  subtitle: '',
  description: '',
  image: undefined,
  options: () => ({}),
  onClick: undefined
})
</script>
```

## 事件定义规范

### 1. 基本定义

```vue
<script setup>
// ✅ 使用数组定义
const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

// ✅ 使用 TypeScript 类型定义
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: FormData): void
  (e: 'cancel'): void
  (e: 'change', value: string, oldValue: string): void
}

const emit = defineEmits<Emits>()
</script>
```

### 2. 事件命名规范

```javascript
// ✅ 使用 kebab-case
emit('update:modelValue', value)
emit('item-click', item)
emit('form-submit', data)

// ❌ 避免使用 camelCase
emit('updateModelValue', value)
emit('itemClick', item)
```

### 3. 事件处理

```vue
<template>
  <button @click="handleClick">
    {{ title }}
  </button>
</template>

<script setup>
const props = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  click: []
  update:title: [value: string]
}>()

const handleClick = () => {
  emit('click')
  emit('update:title', 'New Title')
}
</script>
```

### 4. v-model 支持

```vue
<template>
  <input
    :value="modelValue"
    @input="handleInput"
  />
</template>

<script setup>
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
```

### 5. 自定义 v-model

```vue
<template>
  <input
    :value="title"
    @input="handleInput"
  />
</template>

<script setup>
defineProps<{
  title: string
}>()

const emit = defineEmits<{
  'update:title': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:title', target.value)
}
</script>

<!-- 使用 -->
<MyComponent v-model:title="pageTitle" />
```

## 插槽（Slots）规范

### 1. 基本插槽

```vue
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- 使用 -->
<Card>
  <p>Card content</p>
</Card>
```

### 2. 命名插槽

```vue
<template>
  <div class="modal">
    <div class="modal-header">
      <slot name="header">
        <h3>Default Header</h3>
      </slot>
    </div>
    <div class="modal-body">
      <slot name="body" />
    </div>
    <div class="modal-footer">
      <slot name="footer">
        <button>OK</button>
      </slot>
    </div>
  </div>
</template>

<!-- 使用 -->
<Modal>
  <template #header>
    <h3>Custom Header</h3>
  </template>
  <template #body>
    <p>Custom body content</p>
  </template>
  <template #footer>
    <button>Custom Button</button>
  </template>
</Modal>
```

### 3. 作用域插槽

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot name="item" :item="item" :index="index">
        {{ item.name }}
      </slot>
    </li>
  </ul>
</template>

<script setup>
defineProps<{
  items: Array<{ id: string; name: string }>
}>()
</script>

<!-- 使用 -->
<MyList :items="items">
  <template #item="{ item, index }">
    <span>{{ index + 1 }}. {{ item.name }}</span>
  </template>
</MyList>
```

## 样式规范

### 1. Scoped 样式

```vue
<template>
  <div class="user-card">
    <img class="user-card__avatar" :src="avatar" />
    <h3 class="user-card__name">{{ name }}</h3>
  </div>
</template>

<style scoped lang="scss">
.user-card {
  padding: 20px;
  border-radius: 8px;
  background: #fff;

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
  }

  &__name {
    margin-top: 12px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
```

### 2. BEM 命名规范

```scss
// Block
.user-card { }

// Element
.user-card__avatar { }
.user-card__name { }
.user-card__description { }

// Modifier
.user-card--disabled { }
.user-card--active { }
```

### 3. CSS 变量

```vue
<template>
  <div class="card">
    <h2 class="card__title">{{ title }}</h2>
  </div>
</template>

<style scoped lang="scss">
.card {
  --card-padding: 20px;
  --card-radius: 8px;
  --card-bg: #ffffff;

  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--card-bg);

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}
</style>
```

### 4. 响应式设计

```scss
<style scoped lang="scss">
.container {
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
}
</style>
```

## 组件通信

### 1. 父子通信

```vue
<!-- 父组件 -->
<template>
  <ChildComponent
    :title="pageTitle"
    :is-disabled="isDisabled"
    @update:title="handleTitleUpdate"
    @submit="handleSubmit"
  />
</template>

<!-- 子组件 -->
<script setup>
const props = defineProps<{
  title: string
  isDisabled: boolean
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  submit: [data: FormData]
}>()
</script>
```

### 2. 跨层级通信（provide/inject）

```vue
<!-- 祖先组件 -->
<script setup>
import { provide } from 'vue'

const theme = ref('light')

provide('theme', theme)
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme', ref('light'))
</script>
```

### 3. 全局状态（Pinia）

```vue
<script setup>
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
</script>
```

## 组件生命周期

### 1. 生命周期使用

```vue
<script setup>
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  console.log('Component mounted')
  // 初始化数据、订阅事件等
})

onUpdated(() => {
  console.log('Component updated')
  // DOM 更新后的操作
})

onUnmounted(() => {
  console.log('Component unmounted')
  // 清理定时器、取消订阅等
})
</script>
```

### 2. 清理资源

```vue
<script setup>
import { onUnmounted, ref } from 'vue'

let timer: number | null = null

const startTimer = () => {
  timer = window.setInterval(() => {
    console.log('Timer tick')
  }, 1000)
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>
```

## 组件最佳实践

### 1. 组件拆分

```vue
<!-- ❌ 单个组件过大（>500行） -->
<template>
  <div class="complex-component">
    <!-- 大量模板代码 -->
  </div>
</template>

<script setup>
// 大量逻辑代码
</script>

<!-- ✅ 拆分为多个子组件 -->
<template>
  <div class="complex-component">
    <HeaderSection />
    <ContentSection />
    <FooterSection />
  </div>
</template>
```

### 2. 使用 Composables

```javascript
// composables/usePagination.js
import { ref, computed } from 'vue'

export function usePagination(items: any[], pageSize: number = 10) {
  const currentPage = ref(1)
  const totalPages = computed(() => Math.ceil(items.length / pageSize))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return items.slice(start, end)
  })

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage
  }
}
```

### 3. 组件文档

```vue
<!--
  @description 用户卡片组件
  @example
  <UserCard
    :user="userData"
    :show-avatar="true"
    @click="handleUserClick"
  />
-->
<template>
  <div class="user-card" @click="handleClick">
    <img v-if="showAvatar" class="user-card__avatar" :src="user.avatar" />
    <h3 class="user-card__name">{{ user.name }}</h3>
  </div>
</template>

<script setup lang="ts">
interface User {
  id: string
  name: string
  avatar: string
}

interface Props {
  user: User
  showAvatar?: boolean
}

interface Emits {
  click: [user: User]
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click', props.user)
}
</script>
```

## 可访问性（Accessibility）

### 1. 语义化 HTML

```vue
<template>
  <!-- ✅ 使用语义化标签 -->
  <article class="article">
    <header class="article__header">
      <h1>{{ title }}</h1>
    </header>
    <main class="article__content">
      <p>{{ content }}</p>
    </main>
    <footer class="article__footer">
      <time>{{ date }}</time>
    </footer>
  </article>

  <!-- ❌ 避免过度使用 div -->
  <div class="article">
    <div class="header">
      <div class="title">{{ title }}</div>
    </div>
  </div>
</template>
```

### 2. ARIA 属性

```vue
<template>
  <button
    :aria-label="ariaLabel"
    :aria-disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps<{
  ariaLabel?: string
  disabled?: boolean
}>()
</script>
```

### 3. 键盘导航

```vue
<template>
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    @keydown.esc="handleClose"
  >
    <div class="modal__content">
      <slot />
    </div>
  </div>
</template>
```

## 性能优化

### 1. 懒加载组件

```javascript
// ✅ 使用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

### 2. v-once 静态内容

```vue
<template>
  <div>
    <!-- 静态内容只渲染一次 -->
    <div v-once>
      <h1>{{ staticTitle }}</h1>
      <p>{{ staticDescription }}</p>
    </div>

    <!-- 动态内容 -->
    <div>{{ dynamicContent }}</div>
  </div>
</template>
```

### 3. 计算属性缓存

```vue
<script setup>
const list = ref([])

// ✅ 使用计算属性缓存结果
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})

// ❌ 避免在模板中直接调用方法
const getFilteredList = () => {
  return list.value.filter(item => item.active)
}
</script>
```

## 测试

### 1. 组件测试示例

```javascript
// tests/unit/UserCard.spec.js
import { mount } from '@vue/test-utils'
import UserCard from '@/components/UserCard.vue'

describe('UserCard', () => {
  it('renders user name correctly', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      avatar: 'avatar.jpg'
    }

    const wrapper = mount(UserCard, {
      props: { user }
    })

    expect(wrapper.text()).toContain('John Doe')
  })

  it('emits click event when clicked', async () => {
    const user = {
      id: '1',
      name: 'John Doe',
      avatar: 'avatar.jpg'
    }

    const wrapper = mount(UserCard, {
      props: { user }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

## 参考资料

- [Vue 3 组件官方文档](https://cn.vuejs.org/guide/essentials/component-basics.html)
- [Vue 3 组件深入](https://cn.vuejs.org/guide/components/registration.html)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)