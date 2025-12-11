<!-- pages/login/login.vue -->
<template>
  <view class="login-container">
    <!-- Logo和标题 -->
    <view class="logo-section">
      <view class="app-logo floating-card">
        <text class="shield-icon">
          🛡️
        </text>
      </view>
      <text class="app-title slide-up">
        安全守护
      </text>
      <text
        class="app-subtitle slide-up"
        style="animation-delay: 0.1s;"
      >
        让关爱无处不在，守护每一份安心
      </text>
    </view>
    
    <!-- 特色功能展示 -->
    <view
      class="features-section slide-up"
      style="animation-delay: 0.2s;"
    >
      <view class="feature-card">
        <view class="feature-icon success-bg">
          <text class="icon">
            ✓
          </text>
        </view>
        <view class="feature-content">
          <text class="feature-title">
            独居者自主管理
          </text>
          <text class="feature-desc">
            简单打卡，轻松记录日常生活
          </text>
        </view>
      </view>
      
      <view class="feature-card">
        <view class="feature-icon blue-bg">
          <text class="icon">
            🛡️
          </text>
        </view>
        <view class="feature-content">
          <text class="feature-title">
            监护人实时关注
          </text>
          <text class="feature-desc">
            及时掌握状态，安心放心
          </text>
        </view>
      </view>
      
      <view class="feature-card">
        <view class="feature-icon orange-bg">
          <text class="icon">
            🏢
          </text>
        </view>
        <view class="feature-content">
          <text class="feature-title">
            社区高效服务
          </text>
          <text class="feature-desc">
            专业管理，快速响应
          </text>
        </view>
      </view>
    </view>
    
    <!-- 微信登录按钮 -->
    <button 
      class="wechat-login-button"
      :disabled="isLoading"
      @click="onWechatLogin"
    >
      <text class="wechat-icon">
        💬
      </text>
      <text class="button-text">
        微信快捷登录
      </text>
    </button>
    
    <!-- 分割线 -->
    <view class="divider">
      <view class="divider-line" />
      <text class="divider-text">
        或
      </text>
      <view class="divider-line" />
    </view>
    
    <!-- 手机号登录入口 -->
    <button
      class="phone-login-button"
      @click="showPhoneLogin"
    >
      <text class="phone-icon">
        📱
      </text>
      <text>手机号登录</text>
    </button>
    
    <!-- 用户协议 -->
    <view class="agreement-section">
      <text class="agreement-text">
        登录即表示您同意
      </text>
      <view class="agreement-links">
        <text
          class="link"
          @click="showUserAgreement"
        >
          《用户服务协议》
        </text>
        <text class="separator">
          和
        </text>
        <text
          class="link"
          @click="showPrivacyPolicy"
        >
          《隐私政策》
        </text>
      </view>
      
      <!-- 版本信息 -->
      <view class="version-info">
        <text class="version-text">
          版本 v1.0.0
        </text>
        <text class="slogan pulse-animation">
          让科技温暖生活
        </text>
      </view>
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
@import '@/uni.scss';

.login-container {
  min-height: 100vh;
  @include bg-gradient;
  padding: 120rpx 48rpx 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-section {
  text-align: center;
  margin-bottom: 120rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 48rpx auto;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.4);
}

.shield-icon {
  font-size: 80rpx;
  line-height: 1;
  display: block;
}

.app-title {
  display: block;
  font-size: 60rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.app-subtitle {
  display: block;
  font-size: 28rpx;
  color: #6B7280;
  line-height: 1.5;
  max-width: 480rpx;
  margin: 0 auto;
}

/* 特色功能展示 */
.features-section {
  width: 100%;
  max-width: 600rpx;
  margin-bottom: 60rpx;
}

.feature-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.feature-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.success-bg {
  background: rgba(16, 185, 129, 0.2);
}

.blue-bg {
  background: rgba(59, 130, 246, 0.2);
}

.orange-bg {
  background: rgba(244, 130, 36, 0.2);
}

.feature-icon .icon {
  font-size: 36rpx;
  font-weight: bold;
}

.success-bg .icon {
  color: #10B981;
}

.blue-bg .icon {
  color: #2563EB;
}

.orange-bg .icon {
  color: #E8741A;
}

.feature-content {
  flex: 1;
}

.feature-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8rpx;
}

.feature-desc {
  display: block;
  font-size: 24rpx;
  color: #6B7280;
}

.wechat-login-button {
  width: 600rpx;
  height: 96rpx;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border-radius: $uni-radius-xl;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $uni-white;
  font-size: $uni-font-size-lg;
  font-weight: 600;
  box-shadow: $uni-shadow-primary;
  margin-bottom: 48rpx;
  border: none;
  transition: all 0.3s ease;
}

.wechat-login-button:active {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 40rpx rgba(244, 130, 36, 0.5);
}

.wechat-login-button:disabled {
  opacity: 0.6;
}

.wechat-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.button-text {
  font-size: 32rpx;
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
  background-color: $uni-border-1;
}

.divider-text {
  margin: 0 32rpx;
  font-size: 28rpx;
  color: #6B7280;
}

.phone-login-button {
  width: 600rpx;
  height: 96rpx;
  background: #ffffff;
  border: 4rpx solid #F48224;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F48224;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 80rpx;
  transition: all 0.3s ease;
}

.phone-login-button:active {
  transform: translateY(-2rpx);
  background: rgba(244, 130, 36, 0.1);
}

.phone-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.agreement-section {
  margin-top: auto;
  text-align: center;
}

.agreement-text {
  font-size: 24rpx;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.agreement-links {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.separator {
  font-size: 24rpx;
  color: #6B7280;
  margin: 0 16rpx;
}

.link {
  color: #F48224;
  text-decoration: underline;
  font-size: 24rpx;
}

.version-info {
  margin-top: 32rpx;
}

.version-text {
  display: block;
  font-size: 20rpx;
  color: #9CA3AF;
  margin-bottom: 8rpx;
}

.slogan {
  display: block;
  font-size: 20rpx;
  color: #9CA3AF;
}

/* 动画效果 */
.floating-card {
  animation: float 3s ease-in-out infinite;
}

.slide-up {
  animation: slideUp 0.5s ease-out;
}

.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-20rpx); 
  }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(60rpx);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
  }
  50% { 
    opacity: 0.7; 
  }
}
</style>
