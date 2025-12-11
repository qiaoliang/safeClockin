<template>
  <view class="home-supervisor-container">
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
          亲友监督人
        </text>
      </view>
    </view>

    <!-- 监督概览 -->
    <view class="overview-section">
      <view class="section-header">
        <text class="section-title">
          监督概览
        </text>
        <text class="section-subtitle">
          关注被监督人的日常状况
        </text>
      </view>
      
      <view class="overview-cards">
        <view class="overview-card supervised-count">
          <text class="card-title">
            监督人数
          </text>
          <text class="card-number">
            {{ supervisedCount }}
          </text>
          <text class="card-desc">
            位用户
          </text>
        </view>
        
        <view class="overview-card today-checkin">
          <text class="card-title">
            今日打卡率
          </text>
          <text class="card-number">
            {{ todayCheckinRate }}%
          </text>
          <text class="card-desc">
            平均完成率
          </text>
        </view>
        
        <view class="overview-card unchecked-count">
          <text class="card-title">
            未打卡
          </text>
          <text class="card-number">
            {{ uncheckedCount }}
          </text>
          <text class="card-desc">
            人未打卡
          </text>
        </view>
      </view>
    </view>

    <!-- 被监督人列表 -->
    <view class="supervised-list-section">
      <view class="section-header">
        <text class="section-title">
          被监督人
        </text>
      </view>
      
      <view class="supervised-list">
        <view 
          v-for="person in supervisedList"
          :key="person.user_id"
          class="supervised-item"
          @click="goToSupervisorDetail(person)"
        >
          <view class="person-avatar">
            <image 
              :src="person.avatar_url || '/static/logo.png'" 
              class="avatar-image"
              mode="aspectFill"
            />
          </view>
          <view class="person-info">
            <text class="person-name">
              {{ person.nickname }}
            </text>
            <text class="person-checkin-status">
              {{ person.today_checkin_status }}
            </text>
          </view>
          <text class="arrow">
            ›
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const supervisedCount = ref(3)
const todayCheckinRate = ref(85)
const uncheckedCount = ref(1)
const supervisedList = ref([
  {
    user_id: 1,
    nickname: '张阿姨',
    avatar_url: '/static/logo.png',
    today_checkin_status: '已打卡(3/3)'
  },
  {
    user_id: 2,
    nickname: '王大爷',
    avatar_url: '/static/logo.png',
    today_checkin_status: '未打卡(0/2)'
  },
  {
    user_id: 3,
    nickname: '刘奶奶',
    avatar_url: '/static/logo.png',
    today_checkin_status: '已打卡(2/2)'
  }
])

// 计算属性：用户信息
const userInfo = computed(() => userStore.userInfo)

// 跳转到监护详情
const goToSupervisorDetail = (person) => {
  uni.navigateTo({
    url: `/pages/supervisor-detail/supervisor-detail?userId=${person.user_id}`
  })
}



onMounted(() => {
  // 初始化数据，实际项目中应从API获取
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.home-supervisor-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $uni-bg-gradient-start 0%, $uni-bg-gradient-end 100%);
  padding: $uni-radius-xl $uni-font-size-xl 80rpx;
}

.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: $uni-radius-xl;
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
  margin-bottom: $uni-radius-xl;
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

.supervised-count {
  border-top: 8rpx solid $uni-primary;
}

.today-checkin {
  border-top: 8rpx solid $uni-success;
}

.unchecked-count {
  border-top: 8rpx solid $uni-error;
}

.supervised-list-section {
  margin-bottom: $uni-radius-xl;
}

.supervised-list {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.supervised-item {
  display: flex;
  align-items: center;
  padding: $uni-font-size-xl;
  border-bottom: 2rpx solid #F8F8F8;
}

.supervised-item:last-child {
  border-bottom: none;
}

.person-avatar {
  margin-right: $uni-font-size-base;
}

.person-info {
  flex: 1;
}

.person-name {
  display: block;
  font-size: $uni-font-size-lg;
  font-weight: 600;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.person-checkin-status {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.arrow {
  font-size: $uni-font-size-lg;
  color: $uni-secondary-color;
}


</style>
