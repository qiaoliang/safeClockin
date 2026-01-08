<template>
  <view class="community-dashboard-container">
    <!-- 事件通知条（条件显示） -->
    <EventNotificationBar
      v-if="hasPendingEvents"
      :events="pendingEvents"
      @event-click="handleEventClick"
    />

    <!-- 社区选择器 + 管理按钮区域 -->
    <view class="community-header-section">
      <CommunitySelector @change="handleCommunityChange" />

      <!-- 管理按钮（仅当有权限时显示） -->
      <view
        v-if="canManageCurrentCommunity"
        class="manage-button"
        @click="handleManageCommunity"
      >
        <text class="manage-text">管理</text>
      </view>
    </view>

    <!-- 数据概览卡片 -->
    <DataOverviewCards
      :loading="statsLoading"
      :total-users="stats.total_users"
      :checkin-rate="stats.today_checkin_rate"
      :unchecked-count="stats.unchecked_count"
      :total-rules="stats.total_rules"
    />

    <!-- 历史趋势（MVP - 表格形式） -->
    <view v-if="stats.total_rules > 0">
      <TrendTable
        :loading="trendsLoading"
        :date-range="trends.date_range"
        :checkin-rates="trends.checkin_rates"
        :rule-missed-stats="trends.rule_missed_stats"
        :days="trendDays"
        @days-change="handleDaysChange"
      />
    </view>

    <!-- 异常用户清单 -->
    <AbnormalUserList
      :loading="abnormalUsersLoading"
      :users="abnormalUsers.users"
      :total="abnormalUsers.total"
      :page="currentPage"
      :has-next="abnormalUsers.has_next"
      :community-id="currentCommunityId"
      @load-more="loadMoreAbnormalUsers"
      @user-click="handleUserClick"
    />

    <!-- 空状态提示 -->
    <view v-if="!statsLoading && stats.total_rules === 0" class="empty-state">
      <text class="empty-text">还没有社区规则！</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CommunitySelector from '@/components/community/CommunitySelector.vue'
import EventNotificationBar from './components/EventNotificationBar.vue'
import DataOverviewCards from './components/DataOverviewCards.vue'
import TrendTable from './components/TrendTable.vue'
import AbnormalUserList from './components/AbnormalUserList.vue'
import {
  getCommunityStats,
  getAbnormalUsers,
  getTrendData,
  getPendingEvents
} from '@/api/community-dashboard'
import { useCommunityStore } from '@/store/modules/community'
import { useUserStore } from '@/store/modules/user'
import { RoleId } from '@/constants/roles'

// Store
const communityStore = useCommunityStore()
const userStore = useUserStore()

// 计算属性：是否是社区工作人员
const isCommunityStaff = computed(() => userStore.isCommunityStaff)

// 计算属性：当前社区
const currentCommunity = computed(() => communityStore.currentCommunity)

// 计算属性：是否有管理当前社区的权限
const canManageCurrentCommunity = computed(() => {
  const user = userStore.userInfo
  const community = currentCommunity.value

  if (!user || !community) {
    return false
  }

  const userRole = user.role
  const communityId = community.community_id

  // 超级管理员：默认可以管理所有社区
  if (userRole === RoleId.SUPER_ADMIN) {
    return true
  }

  // 社区主管/专员：管理自己所属的社区
  if (userRole === RoleId.MANAGER || userRole === RoleId.STAFF) {
    // Check if the current community is in the user's managed communities list
    // This works whether the user manages 1 or multiple communities
    return communityStore.communities.some(c => c.community_id === communityId)
  }

  return false
})

// 检查用户是否是某个社区的管理员或专员（保留此函数供未来使用）
const isUserManagerOfCommunity = (communityId) => {
  const roleInCommunity = userStore.getRoleInCommunity(communityId)
  return roleInCommunity === 'manager' || roleInCommunity === 'staff'
}

// 状态
const currentCommunityId = ref(null)
const currentPage = ref(1)
const trendDays = ref(7)

// 加载状态
const statsLoading = ref(false)
const trendsLoading = ref(false)
const abnormalUsersLoading = ref(false)

// 数据
const stats = ref({
  total_users: 0,
  today_checkin_rate: 0,
  unchecked_count: 0,
  total_rules: 0
})

const trends = ref({
  date_range: [],
  checkin_rates: [],
  rule_missed_stats: []
})

const abnormalUsers = ref({
  users: [],
  total: 0,
  has_next: false
})

const pendingEvents = ref([])

// 定时器
let eventsRefreshTimer = null

// 计算属性
const hasPendingEvents = computed(() => pendingEvents.value.length > 0)

// 权限检查：超级管理员和社区工作人员可以访问
const checkPermission = () => {
  const userRole = userStore.role
  console.log('检查权限 - 用户角色:', userRole, 'isSuperAdmin:', userStore.isSuperAdmin, 'isCommunityStaff:', isCommunityStaff.value)

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
    return false
  }
  return true
}

// 初始化
onMounted(async () => {
  // Ensure user info is loaded before checking permissions
  await userStore.fetchUserInfo()

  // 检查权限 - 如果没有权限则返回
  if (!checkPermission()) {
    return
  }

  // Load communities first to ensure we have data
  await communityStore.loadCommunities()

  // Set current community if not set
  if (!communityStore.currentCommunity && communityStore.communities.length > 0) {
    communityStore.setCurrentCommunity(communityStore.communities[0])
  }

  currentCommunityId.value = communityStore.currentCommunity?.community_id || communityStore.currentCommunityId
  loadAllData()

  // 启动事件自动刷新（每30秒）
  startEventsRefresh()
})

onUnmounted(() => {
  stopEventsRefresh()
})

// 页面显示时刷新数据
onShow(async () => {
  // 检查权限 - 如果没有权限则返回
  if (!checkPermission()) {
    return
  }

  // Reload communities to ensure fresh data
  await communityStore.loadCommunities()

  // Update current community ID
  if (communityStore.currentCommunity) {
    currentCommunityId.value = communityStore.currentCommunity.community_id
  }

  if (currentCommunityId.value) {
    loadAllData()
  }
})

// 加载所有数据
const loadAllData = () => {
  loadStats()
  loadTrends()
  loadAbnormalUsers()
  loadPendingEvents()
}

// 加载统计数据
const loadStats = async () => {
  if (!currentCommunityId.value) return

  statsLoading.value = true
  try {
    const res = await getCommunityStats(currentCommunityId.value)
    if (res.code === 1) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    uni.showToast({
      title: '获取统计数据失败',
      icon: 'none'
    })
  } finally {
    statsLoading.value = false
  }
}

// 加载趋势数据
const loadTrends = async () => {
  if (!currentCommunityId.value) return

  trendsLoading.value = true
  try {
    const res = await getTrendData(currentCommunityId.value, { days: trendDays.value })
    if (res.code === 1) {
      trends.value = res.data
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  } finally {
    trendsLoading.value = false
  }
}

// 加载异常用户列表
const loadAbnormalUsers = async (page = 1) => {
  if (!currentCommunityId.value) return

  if (page === 1) {
    abnormalUsersLoading.value = true
  }

  try {
    const res = await getAbnormalUsers(currentCommunityId.value, {
      page,
      page_size: 20
    })
    if (res.code === 1) {
      if (page === 1) {
        abnormalUsers.value = res.data
      } else {
        // 加载更多，追加数据
        abnormalUsers.value.users.push(...res.data.users)
        abnormalUsers.value.total = res.data.total
        abnormalUsers.value.has_next = res.data.has_next
      }
      currentPage.value = page
    }
  } catch (error) {
    console.error('获取异常用户列表失败:', error)
  } finally {
    abnormalUsersLoading.value = false
  }
}

// 加载未处理事件
const loadPendingEvents = async () => {
  if (!currentCommunityId.value) return

  try {
    const res = await getPendingEvents(currentCommunityId.value, { limit: 3 })
    if (res.code === 1) {
      pendingEvents.value = res.data.events
    }
  } catch (error) {
    console.error('获取未处理事件失败:', error)
  }
}

// 加载更多异常用户
const loadMoreAbnormalUsers = () => {
  if (abnormalUsers.value.has_next && !abnormalUsersLoading.value) {
    loadAbnormalUsers(currentPage.value + 1)
  }
}

// 切换社区
const handleCommunityChange = (community) => {
  // CommunitySelector 传递的是整个 community 对象，需要提取 community_id
  const communityId = typeof community === 'object' ? community.community_id : community
  console.log('切换社区:', community, 'communityId:', communityId)
  currentCommunityId.value = communityId
  currentPage.value = 1
  loadAllData()
}

// 切换趋势天数
const handleDaysChange = (days) => {
  trendDays.value = days
  loadTrends()
}

// 点击事件
const handleEventClick = (event) => {
  uni.navigateTo({
    url: `/pages/event-detail/event-detail?event_id=${event.event_id}`
  })
}

// 点击用户
const handleUserClick = (user) => {
  uni.navigateTo({
    url: `/pages/user-detail/user-detail?user_id=${user.user_id}`
  })
}

// 点击管理按钮 - 跳转到社区详情页
const handleManageCommunity = () => {
  // 优先从 currentCommunity 获取最新的 community_id
  const communityId = currentCommunity.value?.community_id || currentCommunityId.value

  console.log('点击管理按钮 - currentCommunity:', currentCommunity.value, 'currentCommunityId:', currentCommunityId.value, '最终communityId:', communityId)

  if (!communityId) {
    uni.showToast({
      title: '未指定社区ID',
      icon: 'none'
    })
    return
  }

  // 目标页面接受参数名：id 或 communityId（驼峰式）
  uni.navigateTo({
    url: `/pages/community-details-new/community-details-new?communityId=${communityId}`,
    fail: (err) => {
      console.error('跳转失败:', err)
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

// 下拉刷新
const onPullDownRefresh = () => {
  loadAllData()
  setTimeout(() => {
    uni.stopPullDownRefresh()
  }, 1000)
}

// 启动事件自动刷新
const startEventsRefresh = () => {
  stopEventsRefresh()
  eventsRefreshTimer = setInterval(() => {
    loadPendingEvents()
  }, 30000) // 每30秒刷新一次
}

// 停止事件自动刷新
const stopEventsRefresh = () => {
  if (eventsRefreshTimer) {
    clearInterval(eventsRefreshTimer)
    eventsRefreshTimer = null
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
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
    margin-right: $uni-spacing-base;
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
    font-size: $uni-font-size-sm;
    color: $uni-white;
    font-weight: $uni-font-weight-bold;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;

  .empty-text {
    font-size: $uni-font-size-sm;
    color: #999;
  }
}
</style>
