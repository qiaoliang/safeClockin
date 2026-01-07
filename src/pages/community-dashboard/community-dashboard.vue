<template>
  <view class="community-dashboard-container">
    <!-- 顶部导航栏 -->
    <view class="dashboard-header">
      <text class="header-title">数据看板</text>
    </view>

    <!-- 事件通知条（条件显示） -->
    <EventNotificationBar
      v-if="hasPendingEvents"
      :events="pendingEvents"
      @event-click="handleEventClick"
    />

    <!-- 社区选择器 -->
    <view class="community-selector-section">
      <CommunitySelector @change="handleCommunityChange" />
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
    <TrendTable
      :loading="trendsLoading"
      :date-range="trends.date_range"
      :checkin-rates="trends.checkin_rates"
      :rule-missed-stats="trends.rule_missed_stats"
      :days="trendDays"
      @days-change="handleDaysChange"
    />

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
      <text class="empty-text">无社区规则，请工作人员根据实际需要创建</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CommunitySelector from '@/components/CommunitySelector.vue'
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

// Store
const communityStore = useCommunityStore()

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

// 初始化
onMounted(() => {
  currentCommunityId.value = communityStore.currentCommunityId
  loadAllData()

  // 启动事件自动刷新（每30秒）
  startEventsRefresh()
})

onUnmounted(() => {
  stopEventsRefresh()
})

// 页面显示时刷新数据
onShow(() => {
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
const handleCommunityChange = (communityId) => {
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
.community-dashboard-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20rpx;
}

.dashboard-header {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1rpx solid #e5e5e5;

  .header-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.community-selector-section {
  margin: 20rpx 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style>
