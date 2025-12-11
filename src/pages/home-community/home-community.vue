<template>
  <view class="home-community-container">
    <!-- 顶部用户信息 -->
    <view class="user-info-section">
      <view class="user-avatar">
        <image 
          :src="userInfo?.avatarUrl || '/static/logo.png'" 
          class="avatar-image"
          mode="aspectFill"
        ></image>
      </view>
      <view class="user-details">
        <text class="user-name">{{ userInfo?.nickName || '未登录用户' }}</text>
        <text class="user-role">社区工作人员</text>
      </view>
    </view>

    <!-- 数据概览 -->
    <view class="overview-section">
      <view class="section-header">
        <text class="section-title">数据概览</text>
        <text class="section-subtitle">辖区内用户情况</text>
      </view>
      
      <view class="overview-cards">
        <view class="overview-card total-count">
          <text class="card-title">用户总数</text>
          <text class="card-number">{{ totalCount }}</text>
          <text class="card-desc">人</text>
        </view>
        
        <view class="overview-card checkin-rate">
          <text class="card-title">今日打卡率</text>
          <text class="card-number">{{ checkinRate }}%</text>
          <text class="card-desc">平均完成率</text>
        </view>
        
        <view class="overview-card unchecked-count">
          <text class="card-title">未打卡人数</text>
          <text class="card-number">{{ uncheckedCount }}</text>
          <text class="card-desc">人</text>
        </view>
      </view>
    </view>

    <!-- 高频逾期事项 -->
    <view class="frequent-issues-section">
      <view class="section-header">
        <text class="section-title">高频逾期事项</text>
        <text class="section-subtitle">近期未完成打卡最多的事项</text>
      </view>
      
      <view class="issues-list">
        <view class="issue-item" v-for="issue in issuesList" :key="issue.id">
          <text class="issue-rank">{{ issue.rank }}</text>
          <text class="issue-name">{{ issue.name }}</text>
          <text class="issue-count">{{ issue.count }}人未完成</text>
        </view>
      </view>
    </view>

    <!-- 未打卡详情按钮 -->
    <view class="unchecked-detail-section">
      <button 
        class="unchecked-detail-btn"
        @click="goToUncheckedDetail"
      >
        <text class="btn-text">查看未打卡详情</text>
        <text class="btn-subtext">当前有{{ uncheckedCount }}位用户未完成今日打卡，请及时关注并联系</text>
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
.home-community-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx 32rpx 80rpx;
}

.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 48rpx;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-avatar {
  margin-right: 24rpx;
}

.avatar-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid #F48224;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: 24rpx;
  color: #F48224;
  background: rgba(244, 130, 36, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.overview-section {
  margin-bottom: 48rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 8rpx;
}

.section-subtitle {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.overview-cards {
  display: flex;
  gap: 24rpx;
}

.overview-card {
  flex: 1;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.card-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 20rpx;
  color: #999;
}

.total-count {
  border-top: 8rpx solid #F48224;
}

.checkin-rate {
  border-top: 8rpx solid #10B981;
}

.unchecked-count {
  border-top: 8rpx solid #EF4444;
}

.frequent-issues-section {
  margin-bottom: 48rpx;
}

.issues-list {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.issue-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.issue-item:last-child {
  border-bottom: none;
}

.issue-rank {
  font-size: 28rpx;
  font-weight: 600;
  color: #624731;
  margin-right: 16rpx;
  width: 40rpx;
}

.issue-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.issue-count {
  font-size: 24rpx;
  color: #666;
}

.unchecked-detail-section {
  margin-bottom: 48rpx;
}

.unchecked-detail-btn {
  width: 100%;
  background: white;
  border: none;
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: left;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.btn-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.btn-subtext {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}


</style>
