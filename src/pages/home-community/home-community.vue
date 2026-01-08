<template>
  <view class="home-community-container">
    <!-- 滚动通知条 -->
    <view
      v-if="hasPendingEvents && latestPendingEvent"
      class="notification-bar"
      @click="handleNotificationClick"
    >
      <view class="notification-content">
        <text class="notification-icon">
          🔔
        </text>
        <text class="notification-text">
          {{ latestPendingEvent.title || '用户发起了求助' }}
        </text>
        <text class="notification-time">
          {{ formatEventTime(latestPendingEvent.created_at) }}
        </text>
      </view>
      <text class="notification-arrow">
        ›
      </text>
    </view>

    <!-- 社区选择器 + 管理按钮区域 -->
    <view class="community-header-section">
      <CommunitySelector @change="handleCommunityChange" />

      <!-- 管理按钮（仅当有权限时显示） -->
      <view
        v-if="canManageCurrentCommunity"
        class="manage-button-inline"
        @click="handleManageCommunity"
      >
        <text class="manage-text">管理</text>
      </view>
    </view>
    <!-- 数据概览 -->
    <view class="overview-section">
      <view class="section-header">
        <text class="section-title">
          数据概览
        </text>
      </view>

      <view class="overview-cards">
        <view class="overview-card total-count">
          <text class="card-title">
            用户总数
          </text>
          <text class="card-number">
            {{ totalCount }}
          </text>
          <text class="card-desc">
            人
          </text>
        </view>

        <view class="overview-card checkin-rate">
          <text class="card-title">
            今日打卡率
          </text>
          <text class="card-number">
            {{ checkinRate }}%
          </text>
          <text class="card-desc">
            平均完成率
          </text>
        </view>

        <view class="overview-card unchecked-count">
          <text class="card-title">
            未打卡人数
          </text>
          <text class="card-number">
            {{ uncheckedCount }}
          </text>
          <text class="card-desc">
            人
          </text>
        </view>
      </view>
    </view>

    <!-- 高频逾期事项 -->
    <view class="frequent-issues-section">
      <view class="section-header">
        <view class="section-title-group">
          <text class="section-title">
            高频逾期事项
          </text>
          <text class="section-subtitle">
            近期未完成打卡最多的事项
          </text>
        </view>

      </view>

      <view class="issues-list">
        <view
          v-for="(stat, index) in topIssues"
          :key="stat.rule_id"
          class="issue-item"
          @click="showStatDetail(stat)"
        >
          <text class="issue-rank">
            {{ index + 1 }}.
          </text>
          <text class="issue-icon">
            {{ stat.rule_icon }}
          </text>
          <text class="issue-name">
            {{ stat.rule_name }}
          </text>
          <text
            :class="['issue-count', stat.total_missed > 0 ? 'issue-count-error' : 'issue-count-success']"
          >
            {{ stat.total_missed }}人次
          </text>
        </view>

        <!-- 无数据提示 -->
        <view
          v-if="topIssues.length === 0"
          class="empty-tip"
        >
          <text
            v-if="totalRules === 0"
            class="empty-text"
          >
            无社区规则，请工作人员根据实际需要创建
          </text>
          <text
            v-else
            class="empty-text"
          >
            社区真棒，所有人都能按时打卡
          </text>
        </view>
      </view>
    </view>

    <!-- 打卡统计模态框 -->
    <CheckinStatsModal
      ref="checkinStatsModal"
      :stats="allStats"
      @close="handleModalClose"
    />

    <!-- 事件详情模态弹窗 -->
    <EventDetailModal
      ref="eventDetailModal"
      @close="showEventModal = false"
    />

    <!-- 未打卡详情按钮 -->
    <view class="unchecked-detail-section">
      <button
        class="unchecked-detail-btn"
        @click="goToUncheckedDetail"
      >
        <text class="btn-text">
          查看未打卡详情
        </text>
        <text class="btn-subtext">
          当前有{{ uncheckedCount }}位用户未完成今日打卡，请及时关注并联系
        </text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useCommunityStore } from '@/store/modules/community'
import CommunitySelector from '@/components/community/CommunitySelector.vue'
import CheckinStatsModal from '@/components/community/CheckinStatsModal.vue'
import EventDetailModal from '@/components/community/EventDetailModal.vue'
import { getCommunityDailyStats, getCommunityCheckinStats } from '@/api/community'

const userStore = useUserStore()
const communityStore = useCommunityStore()
const totalCount = ref(128)
const checkinRate = ref(89.8)
const uncheckedCount = ref(13)
const checkinStatsModal = ref(null)
const eventDetailModal = ref(null)
const allStats = ref([])
const totalRules = ref(0)
const showEventModal = ref(false)

// Current community
const currentCommunity = computed(() => communityStore.currentCommunity)

// Permission check for manage button visibility
// Super Admin (role=4): Can manage if assigned as manager/staff to community
// Community Manager (role=3): Can manage their assigned community only
// Community Specialist (role=2): Can manage their assigned community only
// Regular users (role=1): Cannot manage
const canManageCurrentCommunity = computed(() => {
  const user = userStore.userInfo
  const community = currentCommunity.value

  if (!user || !community) return false

  const userRole = user.role
  const communityId = community.community_id

  // Super Admin: can manage if they are a manager/specialist of this community
  if (userRole === 4) {
    return isUserManagerOfCommunity(communityId)
  }

  // Community Manager/Specialist: can manage if the community is in their accessible communities list
  if (userRole === 3  || userRole === 2 ) {
    // Check if the current community is in the user's managed communities list
    // This works whether the user manages 1 or multiple communities
    return communityStore.communities.some(c => c.community_id === communityId)
  }

  return false
})

// Check if super admin is a manager of a specific community
const isUserManagerOfCommunity = (communityId) => {
  // Check membership from user store's communityRoles
  const roleInCommunity = userStore.getRoleInCommunity(communityId)
  return roleInCommunity === 'manager' || roleInCommunity === 'staff'
}

// 计算属性：显示前3个逾期事项
const topIssues = computed(() => {
  return allStats.value.slice(0, 3)
})

// 计算属性：是否是社区工作人员
const isCommunityStaff = computed(() => userStore.isCommunityStaff)

// 计算属性：是否有未处理事件
const hasPendingEvents = computed(() => {
  return communityStore.pendingEvents.length > 0
})

// 计算属性：最新未处理事件
const latestPendingEvent = computed(() => {
  return communityStore.pendingEvents[0] || null
})

// 权限检查：超级管理员和社区工作人员可以访问
const checkPermission = () => {
  if (!userStore.isSuperAdmin && !isCommunityStaff.value) {
    uni.showModal({
      title: '权限提示',
      content: '只有超级管理员和社区工作人员才能访问此页面',
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 跳转到打卡首页
        uni.switchTab({
          url: '/pages/home-solo/home-solo'
        })
      }
    })
  }
}

// 跳转到未打卡详情
const goToUncheckedDetail = () => {
  uni.navigateTo({
    url: '/pages/unchecked-detail/unchecked-detail'
  })
}

/**
 * 处理社区切换
 */
const handleCommunityChange = async (community) => {
  try {
    uni.showLoading({
      title: '切换中...'
    })

    // 调用 store 切换社区
    await communityStore.switchCommunity(community.community_id)

    // 重新加载页面数据
    await loadPageData()

    uni.hideLoading()
    uni.showToast({
      title: '切换成功',
      icon: 'success'
    })
  } catch (error) {
    uni.hideLoading()
    console.error('切换社区失败:', error)
    uni.showToast({
      title: '切换失败',
      icon: 'none'
    })
  }
}

/**
 * 加载页面数据
 */
const loadPageData = async () => {
  try {
    // 获取社区列表
    await communityStore.loadCommunities()

    // 获取当前社区详情
    if (communityStore.currentCommunity?.community_id) {
      await communityStore.getCommunityDetail(communityStore.currentCommunity.community_id)
    }

    // 加载社区统计数据
    await loadCommunityStats()

    // 加载打卡统计
    await loadCheckinStats()

    // 加载未处理事件
    await communityStore.fetchPendingEvents()
  } catch (error) {
    console.error('加载页面数据失败:', error)
  }
}

/**
 * 加载社区统计数据
 */
const loadCommunityStats = async () => {
  try {
    if (!communityStore.currentCommunity?.community_id) {
      return
    }

    if (typeof getCommunityDailyStats !== 'function') {
      console.error('getCommunityDailyStats 不是函数，API 导入失败')
      return
    }

    const response = await getCommunityDailyStats(communityStore.currentCommunity.community_id)

    if (response.code === 1) {
      const stats = response.data
      totalCount.value = typeof stats.user_count === 'number' ? stats.user_count : 0
      checkinRate.value = typeof stats.checkin_rate === 'number' ? stats.checkin_rate : 0
      uncheckedCount.value = typeof stats.unchecked_user_count === 'number' ? stats.unchecked_user_count : 0
    }
  } catch (error) {
    console.error('加载社区统计数据失败:', error)
  }
}

/**
 * 加载打卡统计
 */
const loadCheckinStats = async () => {
  try {
    // Layer 1: 入口点验证 - 确保有当前社区
    if (!communityStore.currentCommunity?.community_id) {
      console.warn('没有当前社区，跳过加载打卡统计')
      return
    }

    const response = await getCommunityCheckinStats(communityStore.currentCommunity.community_id, 7)

    // Layer 1: 入口点验证 - 检查响应格式
    if (response.code !== 1) {
      console.error('API 返回失败:', response.msg)
      return
    }

    // Layer 1: 入口点验证 - 验证数据结构
    if (!response.data || !Array.isArray(response.data.stats)) {
      console.error('API 返回数据格式错误:', response.data)
      return
    }

    // Layer 2: 业务逻辑验证 - 确保数据类型正确
    const stats = response.data.stats || []
    const totalRulesFromApi = response.data.total_rules || 0

    // Layer 3: 环境守卫 - 防止负数
    const validatedTotalRules = Math.max(0, totalRulesFromApi)

    // Layer 4: 调试仪表 - 记录数据状态
    console.debug(`打卡统计加载成功: 规则数=${validatedTotalRules}, 统计项数=${stats.length}`)

    allStats.value = stats
    totalRules.value = validatedTotalRules
  } catch (error) {
    console.error('加载打卡统计失败:', error)
    // Layer 4: 调试仪表 - 记录错误详情
    console.error('错误堆栈:', error.stack)
  }
}

/**
 * 显示所有统计
 */
const showAllStats = () => {
  checkinStatsModal.value?.open()
}

/**
 * 显示单个规则详情
 */
const showStatDetail = (stat) => {
  // 找到该规则在 allStats 中的索引
  const index = allStats.value.findIndex(s => s.rule_id === stat.rule_id)
  if (index !== -1) {
    // 打开模态框并展开该项
    checkinStatsModal.value?.open()
    // 需要在模态框组件中添加方法来设置展开项
    setTimeout(() => {
      checkinStatsModal.value?.toggleExpand(index)
    }, 100)
  }
}

/**
 * 模态框关闭回调
 */
const handleModalClose = () => {
  // 可以在这里添加关闭后的处理逻辑
}

/**
 * 处理通知条点击
 */
const handleNotificationClick = () => {
  if (latestPendingEvent.value) {
    showEventModal.value = true
    // 加载事件详情
    communityStore.fetchEventDetail(latestPendingEvent.value.event_id)
    // 打开模态弹窗
    setTimeout(() => {
      eventDetailModal.value?.open()
    }, 100)
  }
}

/**
 * 格式化事件时间
 */
const formatEventTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

/**
 * Navigate to community details page
 */
const handleManageCommunity = () => {
  const communityId = currentCommunity.value.community_id

  if (!communityId) {
    uni.showToast({
      title: '请先选择社区',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: `/pages/community-details-new/community-details-new?community_id=${communityId}`,
    fail: (err) => {
      console.error('Navigation failed:', err)
      uni.showModal({
        title: '跳转失败',
        content: '无法打开社区详情页，请返回后重试',
        showCancel: false,
        success: () => {
          uni.navigateBack()
        }
      })
    }
  })
}

onMounted(async () => {
  console.log('Community page loaded, checking permissions...')

  // 1. Load user info
  await userStore.fetchUserInfo()

  // 2. Load community list
  await communityStore.loadCommunities()

  // 3. Check if user has any community access
  if (communityStore.communities.length === 0) {
    uni.showModal({
      title: '权限提示',
      content: '您还没有加入任何社区，请联系社区管理员',
      showCancel: false,
      success: () => {
        // Redirect to solo homepage
        uni.switchTab({
          url: '/pages/home-solo/home-solo'
        })
      }
    })
    return
  }

  // 4. Set current community if not set
  if (!communityStore.currentCommunity && communityStore.communities.length > 0) {
    communityStore.setCurrentCommunity(communityStore.communities[0])
  }

  // 5. Load page data - initialize data only on first mount
  await loadPageData()
})

onShow(() => {
  // 页面显示时检查权限
  checkPermission()

  // 刷新页面数据 - 每次显示都执行
  loadPageData()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.home-community-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $uni-bg-gradient-start 0%, $uni-bg-gradient-end 100%);
  padding: 0 0 80rpx;
}

.community-header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-xl $uni-spacing-xxxl;
  background: $uni-bg-color-white;
  border-bottom: 2rpx solid $uni-border-light;

  :deep(.community-selector) {
    flex: 1;
  }
}

.manage-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $uni-spacing-base $uni-spacing-xl;
  background: $uni-primary;
  border-radius: $uni-radius-base;
  min-width: 120rpx;
  height: 64rpx;

  .manage-text {
    font-size: $uni-font-size-base;
    color: $uni-white;
    font-weight: $uni-font-weight-bold;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.notification-bar {
  margin: 0 $uni-spacing-xxl $uni-spacing-xl;
  padding: $uni-spacing-xl $uni-spacing-xxl;
  background: linear-gradient(135deg, $uni-bg-yellow-50 0%, $uni-bg-yellow-100 100%);
  border-radius: $uni-radius-xl;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 53, 0.2);
  transition: all 0.3s ease;
}

.notification-bar:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 53, 0.15);
}

.notification-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $uni-spacing-base;
}

.notification-icon {
  font-size: $uni-font-size-xxl;
  animation: shake 2s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.notification-text {
  flex: 1;
  font-size: $uni-font-size-base;
  font-weight: 500;
  color: $uni-text-primary;
}

.notification-time {
  font-size: $uni-font-size-sm;
  color: $uni-text-secondary;
}

.notification-arrow {
  font-size: $uni-font-size-xxl;
  color: $uni-primary;
  font-weight: bold;
}

.overview-section {
  margin: 0 $uni-spacing-xxl $uni-spacing-xxxl;
}

.section-header {
  margin-bottom: $uni-font-size-base;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title-group {
  flex: 1;
}

.section-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-tabbar-color;
  margin-bottom: $uni-spacing-sm;
}

.section-subtitle {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.more-link {
  font-size: $uni-font-size-base;
  color: $uni-info;
  text-decoration: underline;
  margin-left: $uni-spacing-base;
}

.manage-button-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $uni-spacing-sm $uni-spacing-lg;
  background: $uni-primary;
  border-radius: $uni-radius-base;
  min-width: 80rpx;
  height: 56rpx;
  white-space: nowrap;

  .manage-text {
    font-size: $uni-font-size-base;
    color: $uni-white;
    font-weight: $uni-font-weight-bold;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.more-link {
  font-size: $uni-font-size-base;
  color: $uni-info;
  text-decoration: underline;
}

.overview-cards {
  display: flex;
  gap: $uni-spacing-base;
}

.overview-card {
  flex: 1;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xxxl;
  text-align: center;
  box-shadow: $uni-shadow-card;
}

.card-title {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
  margin-bottom: $uni-radius-base;
}

.card-number {
  display: block;
  font-size: $uni-font-size-xxxl;
  font-weight: bold;
  color: $uni-tabbar-color;
  margin-bottom: $uni-spacing-sm;
}

.card-desc {
  display: block;
  font-size: $uni-font-size-xs;
  color: $uni-text-secondary;
}

.total-count {
  border-top: $uni-spacing-sm solid $uni-primary;
}

.checkin-rate {
  border-top: $uni-spacing-sm solid $uni-success;
}

.unchecked-count {
  border-top: $uni-spacing-sm solid $uni-error;
}

.frequent-issues-section {
  margin: 0 $uni-spacing-xxl $uni-spacing-xxxl;
}

.issues-list {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xxxl;
  box-shadow: $uni-shadow-card;
}

.issue-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-base 0;
  border-bottom: 2rpx solid $uni-bg-color-lighter;
}

.issue-item:last-child {
  border-bottom: none;
}

.issue-rank {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-tabbar-color;
  margin-right: $uni-spacing-base;
  width: 40rpx;
}

.issue-icon {
  font-size: $uni-font-size-xxxl;
  margin-right: $uni-spacing-base;
}

.issue-name {
  font-size: $uni-font-size-base;
  font-weight: 500;
  color: $uni-main-color;
  flex: 1;
}

.issue-count {
  font-size: $uni-font-size-sm;
  font-weight: 500;
}

.issue-count-error {
  color: $uni-error;
}

.issue-count-success {
  color: $uni-success;
}

.empty-tip {
  padding: $uni-spacing-xxl;
  text-align: center;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  line-height: 1.5;
}

.unchecked-detail-section {
  margin: 0 $uni-spacing-xxl $uni-spacing-xxxl;
}

.unchecked-detail-btn {
  width: 100%;
  background: $uni-bg-color-white;
  border: none;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xxxl;
  text-align: left;
  box-shadow: $uni-shadow-card;
}

.btn-text {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-tabbar-color;
  margin-bottom: $uni-radius-base;
}

.btn-subtext {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
  line-height: 1.5;
}


</style>
