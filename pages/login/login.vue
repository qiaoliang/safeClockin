<!-- pages/login/login.vue -->
<template>
  <view class="login-container">
    <!-- Logo和标题 -->
    <view class="logo-section">
      <image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-title">安卡守护</text>
      <text class="app-subtitle">让关爱无处不在</text>
    </view>
    
    <!-- 微信登录按钮 -->
    <button 
      class="wechat-login-button"
      @click="onWechatLogin"
      :disabled="isLoading"
    >
      <text class="wechat-icon">🟢</text>
      <text class="button-text">微信快捷登录</text>
    </button>
    
    <!-- 分割线 -->
    <view class="divider">
      <view class="divider-line"></view>
      <text class="divider-text">或</text>
      <view class="divider-line"></view>
    </view>
    
    <!-- 手机号登录入口 -->
    <button class="phone-login-button" @click="showPhoneLogin">
      <text class="phone-icon">📱</text>
      <text>手机号登录</text>
    </button>
    
    <!-- 用户协议 -->
    <view class="agreement-section">
      <text class="agreement-text">
        登录即表示同意
        <text class="link" @click="showUserAgreement">《用户协议》</text>
        和
        <text class="link" @click="showPrivacyPolicy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { handleLoginSuccess, handleLoginError } from '@/utils/auth'
import {authApi} from '@/api/auth'

const isLoading = ref(false)
const userStore = useUserStore()

const onWechatLogin = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
	const res = await new Promise((resolve) => {
		uni.showModal({
			title:'哈哈',
			content:'亲！授权登录一下。',
			success: resolve
		})
	})
	
	if(res.confirm){
		const loginData = await new Promise((resolve, reject) => {
			uni.login({
				success: resolve,
				fail: reject
			})
		})
		
		console.log(loginData)
		const response = await authApi.login(loginData.code)
		console.log(response)
		//uni.setStorageSync('token',token)
		// 获取用户信息
		//userInfoRes.value = await authApi.getUserProfile()
		//console.log(userInfoRes.value)
	}
    
    
  } catch (error) {
    console.error('登录失败:', error)
    
    // 如果用户拒绝授权
    if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
      handleLoginError({ type: 'USER_DENIED' })
    } else {
      handleLoginError(error)
    }
  } finally {
    isLoading.value = false
  }
}

const showPhoneLogin = () => {
  uni.showToast({
    title: '手机号登录功能开发中',
    icon: 'none'
  })
}

const showUserAgreement = () => {
  uni.showToast({
    title: '用户协议功能开发中',
    icon: 'none'
  })
}

const showPrivacyPolicy = () => {
  uni.showToast({
    title: '隐私政策功能开发中',
    icon: 'none'
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 120rpx 48rpx 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-section {
  text-align: center;
  margin-bottom: 160rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 48rpx;
  border-radius: 32rpx;
  box-shadow: 0 0 60rpx rgba(244, 130, 36, 0.3);
}

.app-title {
  display: block;
  font-size: 60rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 32rpx;
  color: #666;
}

.wechat-login-button {
  width: 600rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #07C160 0%, #00A651 100%);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.4);
  margin-bottom: 48rpx;
}

.wechat-login-button:active {
  transform: scale(0.98);
}

.wechat-login-button:disabled {
  opacity: 0.6;
}

.wechat-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.button-text {
  font-size: 36rpx;
}

.divider {
  display: flex;
  align-items: center;
  width: 600rpx;
  margin-bottom: 48rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background-color: #E5E5E5;
}

.divider-text {
  margin: 0 32rpx;
  font-size: 28rpx;
  color: #999;
}

.phone-login-button {
  width: 600rpx;
  height: 96rpx;
  background: white;
  border: 4rpx solid #F48224;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F48224;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 80rpx;
}

.phone-login-button:active {
  transform: scale(0.98);
}

.phone-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.agreement-section {
  margin-top: auto;
  text-align: center;
}

.agreement-text {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.link {
  color: #F48224;
  text-decoration: underline;
}
</style>