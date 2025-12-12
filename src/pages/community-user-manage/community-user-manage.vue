<template>
  <view class="user-manage-container">
    <!-- 顶部标题区 -->
    <view class="header-section">
      <text class="header-title">社区用户管理</text>
      <text class="header-subtitle">当前社区：{{ currentCommunity?.name || '未选择' }}</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar-section">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索用户"
        @input="handleSearchInput"
      />
    </view>

    <!-- 用户列表 -->
    <view class="user-list">
      <uni-swipe-action>
        <uni-swipe-action-item
          v-for="item in displayUsers"
          :key="item.user_id"
          :id="'user-' + item.user_id"
          :options="swipeOptions"
          @click="handleSwipeClick($event, item)"
        >
          <view class="user-item" @click="viewUserDetail(item)">
            <image
              :src="item.avatar_url || DEFAULT_AVATAR"
              class="user-avatar"
              mode="aspectFill"
            />

            <view class="user-info">
              <text class="user-name">{{ item.nickname }}</text>
              <text class="user-phone">{{ formatPhone(item.phone_number) }}</text>

              <view class="user-meta">
                <text class="join-time">
                  📅 {{ formatDate(item.join_time) }}
                </text>

                <view
                  v-if="item.unchecked_count > 0"
                  class="unchecked-badge"
                  @click.stop="showUncheckedDetail(item)"
                >
                  <text class="badge-icon">⚠️</text>
                  <text class="badge-text">{{ item.unchecked_count }}</text>
                </view>
              </view>
            </view>
          </view>
        </uni-swipe-action-item>
      </uni-swipe-action>

      <!-- 空状态 -->
      <view v-if="displayUsers.length === 0 && !loading" class="empty-state">
        <text class="empty-text">{{ EMPTY_MESSAGES.NO_USERS }}</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="loading-more">
        <uni-load-more :status="loadMoreStatus" />
      </view>
    </view>

    <!-- 底部悬浮按钮 -->
    <view class="floating-add-btn" @click="addUsers">
      <text class="add-icon">+</text>
    </view>

    <!-- 未完成打卡详情弹窗 -->
    <uni-popup ref="uncheckedPopup" type="bottom">
      <view class="unchecked-detail-panel">
        <view class="panel-header">
          <text class="panel-title">未完成打卡</text>
          <text class="panel-close" @click="closeUncheckedDetail">✕</text>
        </view>

        <view class="unchecked-list">
          <view
            v-for="item in currentUserUnchecked"
            :key="item.rule_id"
            class="unchecked-item"
          >
            <text class="item-name">{{ item.rule_name }}</text>
            <text class="item-time">计划时间：{{ item.planned_time }}</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { formatPhone, formatDate, getRemoveUserTip } from '@/utils/community'
import {
  DEFAULT_AVATAR,
  SPECIAL_COMMUNITY_NAMES,
  EMPTY_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'

const communityStore = useCommunityStore()

// 当前社区
const currentCommunity = ref(null)

// 搜索关键词
const searchKeyword = ref('')

// 当前用户未完成打卡
const currentUserUnchecked = ref([])

// 未完成打卡弹窗引用
const uncheckedPopup = ref(null)

// 加载状态
const loading = ref(false)

// 加载更多状态
const loadMoreStatus = computed(() => {
  if (loading.value) return 'loading'
  if (!communityStore.hasMore) return 'noMore'
  return 'more'
})

// 滑动操作选项
const swipeOptions = [
  {
    text: '移除',
    style: {
      backgroundColor: '#EF4444',
      color: '#ffffff',
      fontSize: '28rpx'
    }
  }
]

// 显示的用户列表（经过搜索过滤）
const displayUsers = computed(() => {
  if (!searchKeyword.value) {
    return communityStore.communityUsers
  }

  const keyword = searchKeyword.value.toLowerCase()
  return communityStore.communityUsers.filter(user =>
    user.nickname.toLowerCase().includes(keyword) ||
    user.phone_number.includes(keyword)
  )
})

// 搜索处理（实时过滤）
const handleSearchInput = () => {
  // 搜索逻辑已在 computed 中处理
}

// 加载用户列表
const loadUserList = async (refresh = false) => {
  if (!currentCommunity.value || loading.value) return

  try {
    loading.value = true
    await communityStore.loadCommunityUsers(currentCommunity.value.id, refresh)
  } catch (error) {
    console.error('加载用户列表失败:', error)
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 查看用户详情
const viewUserDetail = (item) => {
  // TODO: 跳转到用户详情页
  uni.showToast({
    title: `查看用户：${item.nickname}`,
    icon: 'none'
  })
}

// 显示未完成打卡详情
const showUncheckedDetail = (user) => {
  currentUserUnchecked.value = user.unchecked_items || []
  uncheckedPopup.value?.open()
}

// 关闭未完成打卡详情
const closeUncheckedDetail = () => {
  uncheckedPopup.value?.close()
}

// 处理滑动操作
const handleSwipeClick = async (e, item) => {
  await showRemoveConfirm(item)
}

// 显示移除确认
const showRemoveConfirm = async (user) => {
  try {
    // 获取用户所属社区
    const response = await communityStore.getUserCommunities(user.user_id)

    let otherCommunitiesCount = 0
    if (response.code === 1) {
      const userCommunities = response.data.communities || []
      // 计算其他普通社区数量
      otherCommunitiesCount = userCommunities.filter(
        c => c.id !== currentCommunity.value.id && c.name !== SPECIAL_COMMUNITY_NAMES.ANKA_FAMILY
      ).length
    }

    const confirmMessage = getRemoveUserTip(
      currentCommunity.value.name,
      otherCommunitiesCount
    )

    uni.showModal({
      title: '移除用户',
      content: confirmMessage,
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          await removeUser(user.user_id)
        }
      }
    })
  } catch (error) {
    console.error('获取用户社区失败:', error)
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  }
}

// 移除用户
const removeUser = async (userId) => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.PROCESSING })

    const response = await communityStore.removeCommunityUser(
      currentCommunity.value.id,
      userId
    )

    if (response.code === 1) {
      // 根据返回的目标社区显示不同提示
      const targetCommunity = response.data.target_community
      let toastMessage = '已移除'

      if (targetCommunity === 'anka_family') {
        toastMessage = '已移入安卡大家庭'
      } else if (targetCommunity === 'blackhouse') {
        toastMessage = '已移入黑屋'
      }

      // 添加滑出动画
      const userElement = document.querySelector(`#user-${userId}`)
      if (userElement) {
        userElement.classList.add('slide-out-animation')
      }

      setTimeout(() => {
        uni.hideLoading()
        uni.showToast({
          title: toastMessage,
          icon: 'success'
        })
      }, 300)
    } else {
      uni.hideLoading()
      uni.showToast({
        title: response.msg || ERROR_MESSAGES.REMOVE_FAILED,
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('移除用户失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.REMOVE_FAILED,
      icon: 'none'
    })
  }
}

// 添加用户
const addUsers = () => {
  uni.navigateTo({
    url: `/pages/community-user-add/community-user-add?communityId=${currentCommunity.value.id}`
  })
}

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await loadUserList(true)
    uni.stopPullDownRefresh()
    uni.showToast({
      title: SUCCESS_MESSAGES.REFRESH_SUCCESS,
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    uni.stopPullDownRefresh()
  }
})

// 上拉加载更多
onReachBottom(async () => {
  if (!communityStore.hasMore || loading.value) return
  await loadUserList(false)
})

onLoad((options) => {
  if (options.communityId) {
    // 从 store 中查找社区
    const community = communityStore.communities.find(c => c.id === options.communityId)
    if (community) {
      currentCommunity.value = community
    }
  }
})

onMounted(async () => {
  // 如果没有传入社区ID，使用第一个社区
  if (!currentCommunity.value && communityStore.communities.length > 0) {
    currentCommunity.value = communityStore.communities[0]
  }

  if (currentCommunity.value) {
    await loadUserList(true)
  }
})

// 监听用户添加事件
uni.$on('usersAdded', () => {
  loadUserList(true)
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.user-manage-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 80rpx;
}

.header-section {
  background: $uni-bg-color-white;
  padding: 32rpx;
  box-shadow: $uni-shadow-sm;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.header-subtitle {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.search-bar-section {
  background: $uni-bg-color-white;
  padding: 24rpx 32rpx;
  box-shadow: $uni-shadow-sm;
}

.user-list {
  padding: 32rpx;
}

.user-item {
  @include card-default;
  margin-bottom: 24rpx;
  padding: 32rpx;
  flex-direction: row;
  align-items: center;
  transition: transform 0.3s ease;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
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
  margin-bottom: 12rpx;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.join-time {
  font-size: $uni-font-size-xs;
  color: $uni-secondary-color;
}

.unchecked-badge {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: $uni-error-light;
  color: $uni-error;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.badge-icon {
  font-size: 24rpx;
}

.badge-text {
  font-weight: $uni-font-weight-base;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
}

.loading-more {
  padding: 32rpx;
}

.floating-add-btn {
  @include floating-button;
  position: fixed;
  bottom: 120rpx;
  right: 32rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: $uni-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.add-icon {
  font-size: 56rpx;
  color: $uni-white;
  font-weight: bold;
}

.slide-out-animation {
  animation: slideOut 0.3s ease-out forwards;
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

/* 未完成打卡详情弹窗 */
.unchecked-detail-panel {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg $uni-radius-lg 0 0;
  padding: 48rpx 32rpx;
  max-height: 60vh;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.panel-title {
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
}

.panel-close {
  font-size: $uni-font-size-xxl;
  color: $uni-base-color;
  padding: 8rpx;
}

.unchecked-list {
  max-height: 50vh;
  overflow-y: auto;
}

.unchecked-item {
  padding: 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
  margin-bottom: 16rpx;
}

.item-name {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.item-time {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
}
</style>
