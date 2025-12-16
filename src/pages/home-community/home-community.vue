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

    <!-- 顶部用户信息 -->
    <view class="user-info-section">
      <view class="user-avatar">
        <image 
          :src="userInfo?.avatarUrl || '/static/logo.png'" 
          class="avatar-image"
          mode="aspectFill"
        />
      </view>
      <view class="user-details">
        <text class="user-name">
          {{ userInfo?.nickName || '未登录用户' }}
        </text>
        <text class="user-role">
          社区工作人员
        </text>
      </view>
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
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const totalCount = ref(128)
const checkinRate = ref(89.8)
const uncheckedCount = ref(13)
const issuesList = ref([
  { id: 1, rank: '1.', name: '睡觉打卡', count: 8 },
  { id: 2, rank: '2.', name: '晚餐打卡', count: 6 },
  { id: 3, rank: '3.', name: '午餐打卡', count: 5 }
])

// 计算属性：用户信息
const userInfo = computed(() => userStore.userInfo)

// 计算属性：是否是社区主管
const isCommunityManager = computed(() => userStore.isCommunityManager)

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



onMounted(() => {
  // 初始化数据，实际项目中应从API获取
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

.user-info-section {
  margin-top: 24rpx;
  margin-left: 32rpx;
  margin-right: 32rpx;
  display: flex;
  align-items: center;
  margin-bottom: $uni-radius-xxl;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-font-size-xl;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-avatar {
  margin-right: $uni-font-size-base;
}

.avatar-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid $uni-primary;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-primary;
  background: rgba(244, 130, 36, 0.1);
  padding: 8rpx $uni-font-size-base;
  border-radius: $uni-radius-base;
  width: fit-content;
}

.overview-section {
  margin-bottom: $uni-radius-xxl;
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
  margin-bottom: $uni-radius-xxl;
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
  margin-bottom: $uni-radius-xxl;
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
