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
        <text class="section-subtitle">
          辖区内用户情况
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
        <text class="section-title">
          高频逾期事项
        </text>
        <text class="section-subtitle">
          近期未完成打卡最多的事项
        </text>
      </view>
      
      <view class="issues-list">
        <view
          v-for="issue in issuesList"
          :key="issue.id"
          class="issue-item"
        >
          <text class="issue-rank">
            {{ issue.rank }}
          </text>
          <text class="issue-name">
            {{ issue.name }}
          </text>
          <text class="issue-count">
            {{ issue.count }}人未完成
          </text>
        </view>
      </view>
    </view>

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
import { getCommunityDailyStats } from '@/api/community'

const userStore = useUserStore()
const communityStore = useCommunityStore()
const totalCount = ref(128)
const checkinRate = ref(89.8)
const uncheckedCount = ref(13)
const issuesList = ref([
  { id: 1, rank: '1.', name: '睡觉打卡', count: 8 },
  { id: 2, rank: '2.', name: '晚餐打卡', count: 6 },
  { id: 3, rank: '3.', name: '午餐打卡', count: 5 }
])

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
  } catch (error) {
    console.error('加载页面数据失败:', error)
  }
}

/**
 * 加载社区统计数据
 */
const loadCommunityStats = async () => {
  try {
    // Layer 3: 环境守卫 - 验证必要条件
    if (!communityStore.currentCommunity?.community_id) {
      console.warn('跳过加载统计数据：未选择社区')
      return
    }

    if (typeof getCommunityDailyStats !== 'function') {
      console.error('getCommunityDailyStats 不是函数，API 导入失败')
      return
    }

    const response = await getCommunityDailyStats(communityStore.currentCommunity.community_id)

    if (response.code === 1 && response.data) {
      const stats = response.data

      // Layer 2: 数据验证 - 确保数据类型正确
      totalCount.value = typeof stats.user_count === 'number' ? stats.user_count : 0
      checkinRate.value = typeof stats.checkin_rate === 'number' ? stats.checkin_rate : 0
      uncheckedCount.value = typeof stats.unchecked_user_count === 'number' ? stats.unchecked_user_count : 0
    }
  } catch (error) {
    console.error('加载社区统计数据失败:', error)
    // Layer 4: 调试仪表 - 记录错误上下文
    console.error('错误上下文:', {
      communityId: communityStore.currentCommunity?.community_id,
      apiFunctionExists: typeof getCommunityDailyStats === 'function',
      timestamp: new Date().toISOString()
    })
  }
}

onMounted(async () => {
  // 初始化数据
  await loadPageData()
})

onShow(() => {
  // 页面显示时检查权限
  checkPermission()
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
  padding: $uni-radius-base 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.issue-item:last-child {
  border-bottom: none;
}

.issue-rank {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-tabbar-color;
  margin-right: $uni-radius-base;
  width: 40rpx;
}

.issue-name {
  font-size: $uni-font-size-base;
  font-weight: 500;
  color: $uni-main-color;
  flex: 1;
}

.issue-count {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
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
