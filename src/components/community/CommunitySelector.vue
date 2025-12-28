<template>
  <view class="community-selector">
    <!-- 当前社区显示 -->
    <view 
      class="selector-trigger"
      @click="handleToggleDropdown"
    >
      <view class="current-community">
        <image 
          v-if="currentCommunity?.avatar"
          :src="currentCommunity.avatar" 
          class="community-avatar"
          mode="aspectFill"
        />
        <view v-else class="community-avatar-placeholder">
          <text class="placeholder-text">
            {{ currentCommunity?.name?.charAt(0) || '社' }}
          </text>
        </view>
        <text class="community-name">
          {{ currentCommunity?.name || '选择社区' }}
        </text>
      </view>
      
      <!-- 更多按钮 -->
      <view 
        v-if="showMoreButton"
        class="more-button"
        @click.stop="handleToggleDropdown"
      >
        <text class="more-text">
          {{ isDropdownOpen ? '收起' : '更多' }}
        </text>
        <text 
          class="arrow-icon"
          :class="{ 'arrow-up': isDropdownOpen }"
        >
          ▼
        </text>
      </view>
    </view>

    <!-- 下拉列表 -->
    <view 
      v-if="isDropdownOpen && communityList.length > 1"
      class="dropdown-list"
    >
      <view 
        v-for="community in communityList"
        :key="community.community_id"
        class="dropdown-item"
        :class="{ 'active': community.community_id === currentCommunity?.community_id }"
        @click="handleSelectCommunity(community)"
      >
        <image 
          v-if="community.avatar"
          :src="community.avatar" 
          class="item-avatar"
          mode="aspectFill"
        />
        <view v-else class="item-avatar-placeholder">
          <text class="item-placeholder-text">
            {{ community.name?.charAt(0) || '社' }}
          </text>
        </view>
        <text class="item-name">
          {{ community.name }}
        </text>
        <text 
          v-if="community.community_id === currentCommunity?.community_id"
          class="check-icon"
        >
          ✓
        </text>
      </view>
    </view>

    <!-- 遮罩层 -->
    <view 
      v-if="isDropdownOpen"
      class="mask"
      @click="handleCloseDropdown"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommunityStore } from '@/store/modules/community'

const emit = defineEmits(['change'])

const communityStore = useCommunityStore()

// 是否展开下拉列表
const isDropdownOpen = ref(false)

// 社区列表
const communityList = computed(() => communityStore.communities || [])

// 当前社区
const currentCommunity = computed(() => communityStore.currentCommunity)

// 是否显示更多按钮（当社区数量 > 1 时）
const showMoreButton = computed(() => communityList.value.length > 1)

/**
 * 切换下拉列表
 */
const handleToggleDropdown = () => {
  if (!showMoreButton.value) return
  isDropdownOpen.value = !isDropdownOpen.value
}

/**
 * 关闭下拉列表
 */
const handleCloseDropdown = () => {
  isDropdownOpen.value = false
}

/**
 * 选择社区
 */
const handleSelectCommunity = async (community) => {
  if (community.community_id === currentCommunity.value?.community_id) {
    handleCloseDropdown()
    return
  }

  try {
    // 更新当前社区
    communityStore.setCurrentCommunity(community)
    
    // 触发变更事件
    emit('change', community)
    
    // 关闭下拉列表
    handleCloseDropdown()
  } catch (error) {
    console.error('切换社区失败:', error)
    uni.showToast({
      title: '切换社区失败',
      icon: 'none'
    })
  }
}

// 监听社区列表变化，自动设置当前社区
watch(communityList, (newList) => {
  if (newList.length > 0 && !currentCommunity.value) {
    // 如果没有当前社区，默认选择第一个（最近创建的）
    communityStore.setCurrentCommunity(newList[0])
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-selector {
  position: relative;
  z-index: 100;
}

.selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-base $uni-spacing-lg;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.current-community {
  display: flex;
  align-items: center;
  flex: 1;
}

.community-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  margin-right: $uni-spacing-base;
  border: 2rpx solid $uni-border-color;
}

.community-avatar-placeholder {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  margin-right: $uni-spacing-base;
  background: $uni-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $uni-border-color;
}

.placeholder-text {
  color: #fff;
  font-size: $uni-font-size-lg;
  font-weight: 600;
}

.community-name {
  font-size: $uni-font-size-lg;
  font-weight: 600;
  color: $uni-main-color;
  flex: 1;
}

.more-button {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  background: rgba(244, 130, 36, 0.1);
  border-radius: $uni-radius-base;
  margin-left: $uni-spacing-base;
}

.more-text {
  font-size: $uni-font-size-sm;
  color: $uni-primary;
  margin-right: 8rpx;
}

.arrow-icon {
  font-size: 20rpx;
  color: $uni-primary;
  transition: transform 0.3s ease;
}

.arrow-up {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 8rpx);
  left: 0;
  right: 0;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 101;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-base $uni-spacing-lg;
  border-bottom: 1rpx solid $uni-border-color-light;
  transition: background-color 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:active {
  background: $uni-bg-color-light;
}

.dropdown-item.active {
  background: rgba(244, 130, 36, 0.05);
}

.item-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  margin-right: $uni-spacing-base;
  border: 2rpx solid $uni-border-color;
}

.item-avatar-placeholder {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  margin-right: $uni-spacing-base;
  background: $uni-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid $uni-border-color;
}

.item-placeholder-text {
  color: #fff;
  font-size: $uni-font-size-base;
  font-weight: 600;
}

.item-name {
  font-size: $uni-font-size-base;
  color: $uni-main-color;
  flex: 1;
}

.check-icon {
  font-size: $uni-font-size-lg;
  color: $uni-primary;
  font-weight: 600;
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 99;
}
</style>