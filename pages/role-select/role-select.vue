<template>
  <view class="role-select-container">
    <!-- 顶部标题区域 -->
    <view class="header-section">
      <view class="logo-section">
        <view class="logo-circle">
          <text class="logo-icon">🛡️</text>
        </view>
        <text class="app-title">安全守护</text>
        <text class="app-subtitle">让关爱无处不在</text>
      </view>
      
      <text class="page-title">请选择您的角色</text>
      <text class="page-subtitle">选择最符合您身份的角色，开始使用安全守护</text>
    </view>

    <!-- 角色选择卡片 -->
    <view class="role-selection">
      <!-- 独居者角色卡片 -->
      <view 
        class="role-card" 
        :class="{ 'selected': selectedRole === 'solo' }"
        @tap="selectRole('solo')"
      >
        <view class="role-icon">
          <text class="role-icon-text">👤</text>
        </view>
        <view class="role-content">
          <text class="role-title">独居者</text>
          <text class="role-description">我是独居生活的朋友，希望通过打卡让家人放心</text>
          <view class="role-features">
            <view class="feature-item">
              <text class="feature-icon">✅</text>
              <text class="feature-text">每日打卡</text>
            </view>
            <view class="feature-item">
              <text class="feature-icon">👥</text>
              <text class="feature-text">亲友监督</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 亲友监督人角色卡片 -->
      <view 
        class="role-card" 
        :class="{ 'selected': selectedRole === 'supervisor' }"
        @tap="selectRole('supervisor')"
      >
        <view class="role-icon">
          <text class="role-icon-text">❤️</text>
        </view>
        <view class="role-content">
          <text class="role-title">亲友监督人</text>
          <text class="role-description">我关心独居的亲友，希望实时了解他们的状况</text>
          <view class="role-features">
            <view class="feature-item">
              <text class="feature-icon">👁️</text>
              <text class="feature-text">实时关注</text>
            </view>
            <view class="feature-item">
              <text class="feature-icon">📞</text>
              <text class="feature-text">一键联系</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 社区工作人员角色卡片 -->
      <view 
        class="role-card" 
        :class="{ 'selected': selectedRole === 'community' }"
        @tap="selectRole('community')"
      >
        <view class="role-icon">
          <text class="role-icon-text">👥</text>
        </view>
        <view class="role-content">
          <text class="role-title">社区工作人员</text>
          <text class="role-description">我负责社区独居者管理，需要高效的工作工具</text>
          <view class="role-features">
            <view class="feature-item">
              <text class="feature-icon">📊</text>
              <text class="feature-text">数据管理</text>
            </view>
            <view class="feature-item">
              <text class="feature-icon">🔔</text>
              <text class="feature-text">批量提醒</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="footer-section">
      <view class="info-card">
        <view class="info-icon">
          <text class="info-icon-text">ℹ️</text>
        </view>
        <text class="info-text">选择角色后，您可以开始使用相应的功能。如需切换角色，请在个人中心重新设置。</text>
      </view>
    </view>

    <!-- 确认选择按钮 -->
    <view class="confirm-section">
      <button 
        class="confirm-btn" 
        :disabled="!selectedRole"
        :class="{ 'disabled': !selectedRole }"
        @tap="confirmSelection"
      >
        确认选择
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onLoad } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from '@/utils/router'

// 响应式数据
const selectedRole = ref('')
const userStore = useUserStore()

// 选择角色
const selectRole = (role) => {
  selectedRole.value = role
  
  // 添加触觉反馈
  uni.vibrateShort({
    type: 'light'
  })
}

// 确认选择
const confirmSelection = async () => {
  if (!selectedRole.value) {
    uni.showToast({
      title: '请选择一个角色',
      icon: 'none'
    })
    return
  }

  try {
    // 显示加载提示
    uni.showLoading({
      title: '正在设置...'
    })

    // 更新用户角色
    await userStore.updateUserRole(selectedRole.value)

    // 隐藏加载提示
    uni.hideLoading()

    // 根据角色跳转到对应页面
    if (selectedRole.value === 'community') {
      // 社区工作人员需要身份验证
      uni.redirectTo({
        url: '/pages/community-auth/community-auth'
      })
    } else {
      // 其他角色跳转到对应首页
      const homePage = getHomePageByRole(selectedRole.value)
      uni.redirectTo({
        url: homePage
      })
    }

    uni.showToast({
      title: '角色设置成功',
      icon: 'success'
    })

  } catch (error) {
    console.error('角色设置失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '设置失败，请重试',
      icon: 'none'
    })
  }
}

// 页面加载检查用户状态
onLoad(() => {
  // 如果用户已经有角色，直接跳转到对应页面
  if (userStore.userInfo?.role) {
    const homePage = getHomePageByRole(userStore.userInfo.role)
    uni.redirectTo({
      url: homePage
    })
  }
})
</script>

<style lang="scss" scoped>
.role-select-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding-bottom: 40rpx;
}

.header-section {
  padding: 60rpx 48rpx 48rpx;
  text-align: center;
}

.logo-section {
  margin-bottom: 64rpx;
}

.logo-circle {
  width: 160rpx;
  height: 160rpx;
  background: white;
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.logo-icon {
  font-size: 64rpx;
}

.app-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.page-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.role-selection {
  padding: 0 48rpx;
}

.role-card {
  background: white;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  padding: 48rpx;
  margin-bottom: 48rpx;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }

  &.selected {
    border: 6rpx solid #F48224;
    box-shadow: 0 0 0 8rpx rgba(244, 130, 36, 0.1);
  }
}

.role-icon {
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  border-radius: 50%;
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.role-icon-text {
  font-size: 64rpx;
}

.role-content {
  text-align: center;
}

.role-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.role-description {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.role-features {
  display: flex;
  justify-content: center;
  gap: 48rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #888;
}

.feature-icon {
  font-size: 24rpx;
}

.feature-text {
  font-size: 24rpx;
}

.footer-section {
  padding: 32rpx 48rpx;
}

.info-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.info-icon {
  width: 48rpx;
  height: 48rpx;
  background: #E0F2FE;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.info-icon-text {
  font-size: 24rpx;
}

.info-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  flex: 1;
}

.confirm-section {
  padding: 0 48rpx;
  margin-top: 48rpx;
}

.confirm-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #F48224 0%, #E67E22 100%);
  color: white;
  border: none;
  border-radius: 48rpx;
  font-size: 36rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(244, 130, 36, 0.3);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  &.disabled {
    background: #ccc;
    box-shadow: none;
    opacity: 0.6;
  }
}
</style>