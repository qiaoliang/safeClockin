<!-- pages/profile/profile.vue -->
<template>
  <view class="profile-container">
    <!-- 用户信息区域 -->
    <view class="user-info-section">
      <view class="user-avatar">
        <image 
          :src="userInfo?.avatarUrl || '/static/logo.png'" 
          class="avatar-image"
          mode="aspectFill"
        ></image>
      </view>
      <view class="user-details">
        <text class="user-name">{{ userInfo?.nickName || '未设置昵称' }}</text>
        <text class="user-role">{{ getRoleText(userInfo?.role) }}</text>
      </view>
    </view>

    <view class="hint-section" v-if="needCompleteInfo">
      <text class="hint-text">完善头像、昵称、联系方式，提升使用体验</text>
      <button class="hint-btn" @click="navigateTo('/pages/supervisor-manage/supervisor-manage')">去完善与邀请监护人</button>
    </view>

    <view class="hint-section" v-if="needCommunityVerify">
      <text class="hint-text">社区身份未验证，完成后可使用社区功能</text>
      <button class="hint-btn" @click="navigateTo('/pages/community-auth/community-auth')">去验证</button>
    </view>

    <!-- 用户统计区域 -->
    <view class="user-stats-section" v-if="userInfo">
      <view class="user-stats-card">
        <view class="stat-item">
          <text class="stat-value success-color">{{ getConsecutiveCheckins() }}</text>
          <text class="stat-label">连续打卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-value warning-color">{{ getCompletionRate() }}%</text>
          <text class="stat-label">完成率</text>
        </view>
        <view class="stat-item">
          <text class="stat-value accent-color">{{ getSupervisorCount() }}</text>
          <text class="stat-label">监督人</text>
        </view>
      </view>
    </view>
    
    <!-- 功能菜单列表 -->
    <view class="menu-section">
      <view class="menu-item" @click="navigateTo('/pages/checkin-list/checkin-list')">
        <view class="menu-icon">📋</view>
        <text class="menu-text">打卡事项</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="navigateTo('/pages/rule-setting/rule-setting')">
        <view class="menu-icon">⚙️</view>
        <text class="menu-text">打卡规则</text>
        <text class="menu-arrow">></text>
      </view>
      
      <!-- 监督功能菜单：所有用户都可以访问 -->
      <view class="menu-item" @click="navigateTo('/pages/supervisor-manage/supervisor-manage')">
        <view class="menu-icon">👥</view>
        <text class="menu-text">监护人管理</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="navigateTo('/pages/home-supervisor/home-supervisor')">
        <view class="menu-icon">👁️</view>
        <text class="menu-text">我的监督</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="navigateTo('/pages/notification-settings/notification-settings')">
        <view class="menu-icon">🔔</view>
        <text class="menu-text">通知设置</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
    
    <!-- 其他设置 -->
    <view class="menu-section">
      <view class="menu-item" @click="showAbout">
        <view class="menu-icon">ℹ️</view>
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="showHelp">
        <view class="menu-icon">❓</view>
        <text class="menu-text">帮助中心</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { routeGuard } from '@/utils/router'

const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)

const getRoleText = (role) => {
  const roleMap = {
    solo: '普通用户',
    supervisor: '监护人',
    community: '社区工作人员'
  }
  return roleMap[role] || '未知角色'
}

// 获取连续打卡天数（对于新用户显示0）
const getConsecutiveCheckins = () => {
  // TODO: 从后端API获取实际的连续打卡天数
  // 临时返回0，直到实现实际的打卡功能
  return 0
}

// 获取完成率百分比（对于新用户显示0）
const getCompletionRate = () => {
  // TODO: 从后端API获取实际的完成率
  // 临时返回0，直到实现实际的打卡功能
  return 0
}

// 获取监督人数量（对于新用户显示0或根据实际关系显示）
const getSupervisorCount = () => {
  // TODO: 从后端API获取实际的监督人数量
  // 临时返回0，直到实现实际的监护关系功能
  return 0
}

const navigateTo = (url) => {
  routeGuard(url)
}

const needCompleteInfo = computed(() => {
  const u = userInfo.value || {}
  return !u.avatarUrl || !u.nickName || !u.phoneNumber
})

const needCommunityVerify = computed(() => {
  const u = userInfo.value || {}
  return u.role === 'community' && u.verification_status !== 2
})

const showAbout = () => {
  uni.showModal({
    title: '关于安卡小习惯',
    content: '安卡小习惯是一款关注用户安全的监护小程序，通过日常打卡机制让关爱无处不在。',
    showCancel: false
  })
}

const showHelp = () => {
  uni.showModal({
    title: '帮助中心',
    content: '如有问题请联系客服：\n电话：400-123-4567\n邮箱：support@anka.com',
    showCancel: false
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.redirectTo({
          url: '/pages/login/login'
        })
      }
    }
  })
}
</script>

<style scoped>
.hint-section{background:#FEF3C7;border-left:8rpx solid #F59E0B;border-radius:16rpx;padding:24rpx;margin-bottom:24rpx}
.hint-text{display:block;color:#78350F;margin-bottom:12rpx}
.hint-btn{background:#F48224;color:#fff;border:none;border-radius:16rpx;padding:12rpx 16rpx}
.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 40rpx 24rpx;
}

.user-info-section {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-stats-section {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-stats-card {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.success-color {
  color: #10B981;
}

.warning-color {
  color: #F59E0B;
}

.accent-color {
  color: #624731;
}

.user-avatar {
  margin-right: 32rpx;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
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
  font-size: 28rpx;
  color: #F48224;
  background: rgba(244, 130, 36, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.menu-section {
  background: white;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 48rpx;
  border-bottom: 2rpx solid #F8F8F8;
  transition: background-color 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #F8F8F8;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
  width: 40rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.logout-section {
  margin-top: 48rpx;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: white;
  border: 2rpx solid #FF4757;
  border-radius: 32rpx;
  color: #FF4757;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.2);
}

.logout-btn:active {
  transform: scale(0.98);
  background-color: #FFF5F5;
}
</style>
