<!-- pages/login/login.vue -->
<template>
  <view class="login-container">
    <!-- Logo和标题 -->
    <view class="logo-section">
      <image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-title">安卡好习惯</text>
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
    
    <!-- 头像昵称填写组件 -->
    <user-info-form 
      :visible="showUserInfoForm"
      :code="loginCode"
      @confirm="onUserInfoConfirm"
      @cancel="onUserInfoCancel"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { handleLoginSuccess, handleLoginError } from '@/utils/auth'
import UserInfoForm from '@/components/user-info-form/user-info-form.vue'
import { storage } from '@/store/modules/storage'

const isLoading = ref(false)
const showUserInfoForm = ref(false)
const loginCode = ref('')
const userStore = useUserStore()

// 添加一个标志来防止重复的微信登录请求
let isWechatLoginProcessing = false

// 页面加载时初始化用户状态
onMounted(() => {
  try {
    userStore.initUserState()
  } catch (error) {
    console.error('初始化用户状态失败:', error)
  }
})

const onWechatLogin = async () => {
  if (isLoading.value || isWechatLoginProcessing) return
  
  isLoading.value = true
  isWechatLoginProcessing = true
  
  try {
    // 第一步：获取微信登录凭证
    const loginRes = await uni.login()
    
    if (!loginRes.code) {
      throw new Error('获取微信登录凭证失败')
    }
    
    // 第二步：检查登录场景和用户状态
    const loginScenario = storage.get('login_scenario') || uni.getStorageSync('login_scenario')
    const localUserInfo = userStore.userInfo
    const hasWechatBind = !!(localUserInfo && (localUserInfo.wechatOpenid || localUserInfo.wechat_openid))
    
    console.log('登录场景:', loginScenario, '微信绑定状态:', hasWechatBind)
    
    if (loginScenario === 'relogin' && hasWechatBind) {
      // 重新登录场景：直接使用微信绑定信息登录
      console.log('重新登录场景，使用微信绑定信息')
      await handleLoginSuccess({ code: loginRes.code })
      // 清除场景标记
      storage.remove('login_scenario')
      uni.removeStorageSync('login_scenario')
    } else if (hasWechatBind) {
      // 已有微信绑定：非首次登录
      console.log('检测到微信绑定，执行非首次登录流程')
      await handleLoginSuccess({ code: loginRes.code })
    } else {
      // 首次登录场景
      console.log('首次登录场景')
      try {
        userStore.clearCache()
      } catch (error) {
        console.warn('清理缓存时出错，但继续登录流程:', error)
      }
      loginCode.value = loginRes.code
      showUserInfoForm.value = true
    }
  } catch (error) {
    console.error('登录失败:', error)
    handleLoginError(error)
  } finally {
    isLoading.value = false
    isWechatLoginProcessing = false
  }
}

const onUserInfoConfirm = async (userInfo) => {
  try {
    // 执行登录流程，包括登录和更新用户信息
    await handleLoginSuccess({
      code: userInfo.code,
      userInfo: userInfo.userInfo
    })
    
    // 调用成功回调
    if (userInfo.onSuccess) {
      userInfo.onSuccess()
    }
    
    showUserInfoForm.value = false
  } catch (error) {
    console.error('登录失败:', error)
    
    // 调用错误回调
    if (userInfo.onError) {
      userInfo.onError(error)
    } else {
      handleLoginError(error)
    }
  }
}

const onUserInfoCancel = () => {
  showUserInfoForm.value = false
}

const showPhoneLogin = () => {
  uni.navigateTo({ url: '/pages/phone-login/phone-login?mode=login' })
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
