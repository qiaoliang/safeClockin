<template>
  <view class="infinite-scroll">
    <scroll-view
      class="scroll-container"
      scroll-y
      :scroll-top="scrollTop"
      @scrolltolower="handleScrollToLower"
    >
      <slot :items="items" />

      <view
        v-if="loading"
        class="loading-state"
      >
        <uni-load-more status="loading" />
      </view>

      <view
        v-if="hasMore === false && items.length > 0"
        class="end-state"
      >
        <text class="end-text">
          没有更多数据了
        </text>
      </view>

      <view
        v-if="items.length === 0 && !loading"
        class="empty-state"
      >
        <text class="empty-text">
          暂无数据
        </text>
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