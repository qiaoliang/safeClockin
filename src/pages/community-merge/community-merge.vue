<template>
  <view class="merge-container">
    <!-- 头部说明 -->
    <view class="merge-header">
      <text class="header-title">
        社区合并
      </text>
      <text class="header-subtitle">
        选择要合并的社区（至少2个）
      </text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索社区"
        @input="handleSearch"
      />
    </view>

    <!-- 社区列表 -->
    <view class="community-list">
      <view
        v-for="item in filteredCommunities"
        :key="item.id"
        :class="['community-item', { selected: isSelected(item.id) }]"
        @click="toggleSelect(item)"
      >
        <view class="checkbox-wrapper">
          <uni-icons
            v-if="isSelected(item.id)"
            type="checkbox-filled"
            color="#F48224"
            size="24"
          />
          <uni-icons
            v-else
            type="circle"
            color="#D1D5DB"
            size="24"
          />
        </view>

        <view class="community-info">
          <text class="community-name">
            {{ item.name }}
          </text>
          <text class="community-location">
            📍 {{ item.location }}
          </text>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        v-if="filteredCommunities.length === 0"
        class="empty-state"
      >
        <text class="empty-text">
          {{ EMPTY_MESSAGES.NO_SEARCH_RESULTS }}
        </text>
      </view>
    </view>

    <!-- 目标社区选择 -->
    <view class="merge-section">
      <text class="section-label">
        合并到：
      </text>
      <uni-data-select
        v-model="targetCommunityId"
        :localdata="communityOptions"
        placeholder="选择目标社区"
      />
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button
        class="merge-btn"
        :disabled="!canMerge"
        @click="confirmMerge"
      >
        确认合并 ({{ selectedCount }})
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { debounce } from '@/utils/community'
import {
  CommunityStatus,
  EMPTY_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

const communityStore = useCommunityStore()

// 页面权限检查
onLoad(() => {
  if (!checkPagePermission(PagePath.COMMUNITY_MERGE)) {
    return
  }
  console.log('[社区合并] 权限检查通过')
})

// 搜索关键词
const searchKeyword = ref('')

// 选中的社区ID列表
const selectedCommunityIds = ref([])

// 目标社区ID
const targetCommunityId = ref('')

// 筛选后的社区列表
const filteredCommunities = computed(() => {
  let list = communityStore.activeCommunities

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    )
  }

  return list
})

// 社区选项（用于目标社区选择）
const communityOptions = computed(() => {
  return communityStore.activeCommunities.map(item => ({
    text: item.name,
    value: item.id
  }))
})

// 选中数量
const selectedCount = computed(() => selectedCommunityIds.value.length)

// 是否可以合并
const canMerge = computed(() => {
  return selectedCount.value >= 2 && targetCommunityId.value
})

// 判断是否选中
const isSelected = (id) => {
  return selectedCommunityIds.value.includes(id)
}

// 切换选中状态
const toggleSelect = (item) => {
  const index = selectedCommunityIds.value.indexOf(item.id)

  if (index > -1) {
    selectedCommunityIds.value.splice(index, 1)
  } else {
    selectedCommunityIds.value.push(item.id)
  }
}

// 搜索处理（防抖）
const handleSearch = debounce(() => {
  // 搜索逻辑已在 computed 中处理
}, 500)

// 确认合并
const confirmMerge = () => {
  if (!canMerge.value) {
    if (selectedCount.value < 2) {
      uni.showToast({
        title: ERROR_MESSAGES.SELECT_AT_LEAST_TWO,
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: ERROR_MESSAGES.SELECT_TARGET,
        icon: 'none'
      })
    }
    return
  }

  // 检查目标社区是否在选中列表中
  if (selectedCommunityIds.value.includes(targetCommunityId.value)) {
    uni.showToast({
      title: '目标社区不能在合并列表中',
      icon: 'none'
    })
    return
  }

  const targetCommunity = communityStore.communities.find(c => c.id === targetCommunityId.value)

  uni.showModal({
    title: '确认合并',
    content: `将 ${selectedCount.value} 个社区合并到"${targetCommunity?.name}"？`,
    confirmColor: '#F48224',
    success: async (res) => {
      if (res.confirm) {
        await performMerge()
      }
    }
  })
}

// 执行合并
const performMerge = async () => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.PROCESSING })

    await communityStore.mergeCommunities(
      selectedCommunityIds.value,
      targetCommunityId.value
    )

    uni.hideLoading()
    uni.showToast({
      title: SUCCESS_MESSAGES.MERGE_SUCCESS,
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('合并社区失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.msg || '合并失败',
      icon: 'none'
    })
  }
}

onMounted(async () => {
  // 确保社区列表已加载
  if (communityStore.communities.length === 0) {
    await communityStore.loadCommunities(true)
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.merge-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 160rpx;
}

.merge-header {
  background: $uni-bg-color-white;
  padding: 48rpx 32rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.search-section {
  padding: 0 32rpx 24rpx;
}

.community-list {
  padding: 0 32rpx;
}

.community-item {
  @include card-default;
  margin-bottom: 24rpx;
  padding: 32rpx;
  flex-direction: row;
  align-items: center;
  transition: all 0.3s ease;

  &.selected {
    border: 2rpx solid $uni-primary;
    background: rgba(244, 130, 36, 0.05);
  }
}

.checkbox-wrapper {
  margin-right: 24rpx;
  flex-shrink: 0;
}

.community-info {
  flex: 1;
}

.community-name {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.community-location {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
}

.merge-section {
  padding: 32rpx;
  background: $uni-bg-color-white;
  margin: 24rpx 32rpx;
  border-radius: $uni-radius-lg;
  box-shadow: $uni-shadow-sm;
}

.section-label {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  margin-bottom: 16rpx;
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

.merge-btn {
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
