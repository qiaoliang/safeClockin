<template>
  <view class="user-add-container">
    <!-- 搜索栏 -->
    <view class="search-section">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索用户"
        @confirm="handleSearch"
        @input="handleSearchInput"
      />
    </view>

    <!-- 已选提示 -->
    <view v-if="selectedUsers.length > 0" class="selected-count-tip">
      已选 {{ selectedUsers.length }} 人
    </view>

    <!-- 搜索结果列表 -->
    <view class="search-results">
      <view
        v-for="(user, index) in searchResults"
        :key="user.user_id"
        :class="['add-user-item', {
          selected: isSelected(user.user_id),
          disabled: user.already_in_community
        }]"
        @click="toggleSelect(user)"
      >
        <image
          :src="user.avatar_url || DEFAULT_AVATAR"
          class="user-avatar"
          mode="aspectFill"
        />

        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
          <text class="user-phone">{{ user.phone_number }}</text>
        </view>

        <view v-if="user.already_in_community" class="already-in-tag">
          已在社区
        </view>

        <view
          v-else-if="isSelected(user.user_id)"
          class="selection-badge"
        >
          {{ getSelectionIndex(user.user_id) }}
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="searchResults.length === 0 && searchKeyword" class="empty-state">
        <text class="empty-text">无匹配用户</text>
      </view>

      <!-- 未搜索提示 -->
      <view v-if="!searchKeyword && searchResults.length === 0" class="search-tip">
        <text class="tip-text">请输入关键词搜索用户</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button
        class="confirm-btn"
        :disabled="selectedUsers.length === 0"
        @click="confirmAdd"
      >
        添加 ({{ selectedUsers.length }})
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { debounce } from '@/utils/community'
import {
  DEFAULT_AVATAR,
  MAX_SELECTION_COUNT,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'

const communityStore = useCommunityStore()

// 搜索关键词
const searchKeyword = ref('')

// 搜索结果
const searchResults = ref([])

// 选中的用户
const selectedUsers = ref([])

// 当前社区ID
const currentCommunityId = ref('')

// 判断是否选中
const isSelected = (userId) => {
  return selectedUsers.value.some(u => u.user_id === userId)
}

// 获取选中序号
const getSelectionIndex = (userId) => {
  const index = selectedUsers.value.findIndex(u => u.user_id === userId)
  return index + 1
}

// 切换选中状态
const toggleSelect = (user) => {
  if (user.already_in_community) {
    uni.showToast({
      title: ERROR_MESSAGES.USER_EXISTS,
      icon: 'none'
    })
    return
  }

  const index = selectedUsers.value.findIndex(u => u.user_id === user.user_id)

  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    // 检查是否超过最大选择数量
    if (selectedUsers.value.length >= MAX_SELECTION_COUNT) {
      uni.showToast({
        title: `最多选择 ${MAX_SELECTION_COUNT} 人`,
        icon: 'none'
      })
      return
    }

    selectedUsers.value.push(user)
  }
}

// 搜索处理（防抖）
const handleSearchInput = debounce(async () => {
  await handleSearch()
}, 500)

// 执行搜索
const handleSearch = async () => {
  if (!searchKeyword.value) {
    searchResults.value = []
    return
  }

  try {
    uni.showLoading({ title: LOADING_MESSAGES.SEARCHING })

    const response = await communityStore.searchUsers(
      searchKeyword.value,
      currentCommunityId.value
    )

    uni.hideLoading()

    if (response.code === 1) {
      searchResults.value = response.data.users || []
    } else {
      uni.showToast({
        title: ERROR_MESSAGES.SEARCH_FAILED,
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.SEARCH_FAILED,
      icon: 'none'
    })
  }
}

// 确认添加
const confirmAdd = async () => {
  if (selectedUsers.value.length === 0) {
    return
  }

  try {
    uni.showLoading({ title: LOADING_MESSAGES.ADDING })

    await communityStore.addCommunityUsers(
      currentCommunityId.value,
      selectedUsers.value.map(u => u.user_id)
    )

    uni.hideLoading()
    uni.showToast({
      title: `成功添加 ${selectedUsers.value.length} 人`,
      icon: 'success'
    })

    // 触发用户添加事件
    uni.$emit('usersAdded')

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('添加用户失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.msg || ERROR_MESSAGES.ADD_FAILED,
      icon: 'none'
    })
  }
}

onLoad((options) => {
  if (options.communityId) {
    currentCommunityId.value = options.communityId
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.user-add-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 160rpx;
}

.search-section {
  background: $uni-bg-color-white;
  padding: 24rpx 32rpx;
  box-shadow: $uni-shadow-sm;
}

.selected-count-tip {
  position: sticky;
  top: 0;
  background: $uni-primary-light;
  color: $uni-primary;
  padding: 16rpx 32rpx;
  text-align: center;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;
  z-index: 99;
}

.search-results {
  padding: 32rpx;
}

.add-user-item {
  @include card-default;
  margin-bottom: 24rpx;
  padding: 32rpx;
  flex-direction: row;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;

  &.disabled {
    opacity: 0.5;
  }

  &.selected {
    border: 2rpx solid $uni-primary;
    background: rgba(244, 130, 36, 0.05);
  }
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: $uni-radius-full;
  margin-right: 24rpx;
  background: $uni-bg-color-grey;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.user-phone {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.selection-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  background: $uni-primary;
  color: $uni-white;
  border-radius: $uni-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-base;
  font-weight: bold;
}

.already-in-tag {
  padding: 4rpx 12rpx;
  background: $uni-bg-color-grey;
  color: $uni-secondary-color;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
}

.search-tip {
  text-align: center;
  padding: 120rpx 40rpx;
}

.tip-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: $uni-bg-color-white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  @include safe-area-bottom;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  @include btn-primary;
  border: none;

  &:disabled {
    background: $uni-bg-color-grey;
    color: $uni-secondary-color;
    box-shadow: none;
  }
}
</style>
