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
      
      <view 
        v-if="userInfo?.role === 'solo'" 
        class="menu-item" 
        @click="navigateTo('/pages/supervisor-manage/supervisor-manage')"
      >
        <view class="menu-icon">👥</view>
        <text class="menu-text">监护人管理</text>
        <text class="menu-arrow">></text>
      </view>
      
      <view 
        v-if="userInfo?.role === 'supervisor'" 
        class="menu-item" 
        @click="navigateTo('/pages/supervisor-detail/supervisor-detail')"
      >
        <view class="menu-icon">👤</view>
        <text class="menu-text">监护详情</text>
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
    solo: '独居者',
    supervisor: '监护人',
    community: '社区工作人员'
  }
  return roleMap[role] || '未知角色'
}

const navigateTo = (url) => {
  routeGuard(url)
}

const showAbout = () => {
  uni.showModal({
    title: '关于安卡小习惯',
    content: '安卡小习惯是一款专为独居者设计的安全监护小程序，通过日常打卡机制让关爱无处不在。',
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