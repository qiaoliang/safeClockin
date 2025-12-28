<template>
  <view class="home-community-container">
    <!-- 顶部操作栏 -->
    <view class="header-bar">
      <text class="page-title">
        数据看板
      </text>
      <view
        class="header-actions"
        @click="showQuickMenu"
      >
        <text class="action-btn">
          管理
        </text>
      </view>
    </view>

    <!-- 社区选择器 -->
    <view class="community-selector-section">
      <CommunitySelector @change="handleCommunityChange" />
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
        <text 
          v-if="totalRules > 3"
          class="more-link"
          @click="showAllStats"
        >
          更多
        </text>
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
import { getCommunityDailyStats, getCommunityCheckinStats } from '@/api/community'

const userStore = useUserStore()
const communityStore = useCommunityStore()
const totalCount = ref(128)
const checkinRate = ref(89.8)
const uncheckedCount = ref(13)
const checkinStatsModal = ref(null)
const allStats = ref([])
const totalRules = ref(0)

// 计算属性：显示前3个逾期事项
const topIssues = computed(() => {
  return allStats.value.slice(0, 3)
})

// 计算属性：是否是社区主管
const isCommunityManager = computed(() => userStore.isCommunityManager)

// 计算属性：是否是社区工作人员（role >= 2）
const isCommunityStaff = computed(() => {
  const role = userStore.userInfo?.role
  return role !== undefined && role >= 2
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

// 显示快捷管理菜单
const showQuickMenu = () => {
  const items = ['用户管理']
  
  // manager 可以看到工作人员管理
  if (isCommunityManager.value) {
    items.unshift('工作人员管理')
  }
  
  items.push('更多功能...')
  
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const index = res.tapIndex
      
      if (items[index] === '用户管理') {
        uni.navigateTo({
          url: '/pages/community-user-manage/community-user-manage'
        })
      } else if (items[index] === '工作人员管理') {
        uni.navigateTo({
          url: '/pages/community-staff-manage/community-staff-manage'
        })
      } else if (items[index] === '更多功能...') {
        // 跳转到个人中心
        uni.switchTab({
          url: '/pages/profile/profile'
        })
      }
    }
  })
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

onMounted(async () => {
  // 初始化数据 - 只在首次挂载时执行
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

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: #FAE9DB;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  .page-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }
  
  .header-actions {
    .action-btn {
      padding: 12rpx 24rpx;
      background: #FF6B35;
      color: #fff;
      border-radius: 32rpx;
      font-size: 28rpx;
      font-weight: 500;
    }
  }
}

.community-selector-section {
  margin: 24rpx 32rpx;
}

.overview-section {
  margin: 0 32rpx $uni-radius-xxl;
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
  margin-bottom: 8rpx;
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

.overview-cards {
  display: flex;
  gap: $uni-font-size-base;
}

.overview-card {
  flex: 1;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-font-size-xl;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
  margin-bottom: $uni-radius-base;
}

.card-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: $uni-tabbar-color;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 20rpx;
  color: $uni-secondary-color;
}

.total-count {
  border-top: 8rpx solid $uni-primary;
}

.checkin-rate {
  border-top: 8rpx solid $uni-success;
}

.unchecked-count {
  border-top: 8rpx solid $uni-error;
}

.frequent-issues-section {
  margin: 0 32rpx $uni-radius-xxl;
}

.issues-list {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-font-size-xl;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
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
  font-size: 48rpx;
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
  margin: 0 32rpx $uni-radius-xxl;
}

.unchecked-detail-btn {
  width: 100%;
  background: $uni-bg-color-white;
  border: none;
  border-radius: $uni-radius-xl;
  padding: $uni-radius-xxl;
  text-align: left;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
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
