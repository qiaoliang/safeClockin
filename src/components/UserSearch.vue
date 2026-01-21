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
      <view
        v-if="searching"
        class="search-indicator"
      >
        <uni-load-more
          status="loading"
          :content-text="{ contentdown: '搜索中...' }"
        />
      </view>
    </view>

    <view
      v-if="error"
      class="error-message"
    >
      {{ error }}
    </view>

    <view
      v-if="searchResults.length > 0"
      class="search-results"
    >
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
          <text class="user-name">
            {{ user.nickname || user.name }}
          </text>
          <text class="user-phone">
            {{ formatPhone(user.phone_number) }}
          </text>
        </view>
      </view>
    </view>

    <view
      v-else-if="searchKeyword && !searching && searchResults.length === 0"
      class="empty-state"
    >
      <text class="empty-text">
        未找到匹配的用户
      </text>
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