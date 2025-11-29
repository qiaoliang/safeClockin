<!-- pages/invite-supervisor/invite-supervisor.vue -->
<template>
  <view class="invite-supervisor-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">邀请监护人</text>
      </view>
    </view>

    <!-- 邀请方式选择 -->
    <view class="invite-method-section">
      <view class="section-title">选择邀请方式</view>
      <view class="method-options">
        <view 
          class="method-item"
          :class="{ active: selectedMethod === 'wechat' }"
          @click="selectedMethod = 'wechat'"
        >
          <text class="method-icon">>WeChat</text>
          <text class="method-name">微信好友</text>
        </view>
        
        <view 
          class="method-item"
          :class="{ active: selectedMethod === 'phone' }"
          @click="selectedMethod = 'phone'"
        >
          <text class="method-icon">📱</text>
          <text class="method-name">手机号码</text>
        </view>
      </view>
    </view>

    <!-- 邀请表单 -->
    <view class="invite-form" v-if="selectedMethod === 'wechat'">
      <view class="form-group">
        <text class="label">选择微信好友</text>
        <view class="friend-selector">
          <view class="friend-item" v-for="friend in wechatFriends" :key="friend.id">
            <image :src="friend.avatar" class="friend-avatar"></image>
            <text class="friend-name">{{ friend.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="invite-form" v-if="selectedMethod === 'phone'">
      <view class="form-group">
        <text class="label">监护人手机号</text>
        <input 
          class="input"
          type="number"
          v-model="phone"
          placeholder="请输入监护人手机号码"
          maxlength="11"
        />
      </view>
      
      <view class="form-group">
        <text class="label">验证码</text>
        <view class="verification-input">
          <input 
            class="input"
            type="number"
            v-model="verificationCode"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button 
            class="verification-btn"
            :disabled="countdown > 0"
            @click="sendVerificationCode"
          >
            {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
          </button>
        </view>
      </view>
      
      <view class="form-group">
        <text class="label">监护人姓名</text>
        <input 
          class="input"
          type="text"
          v-model="supervisorName"
          placeholder="请输入监护人姓名"
          maxlength="20"
        />
      </view>
    </view>

    <!-- 邀请说明 -->
    <view class="invite-info">
      <text class="info-text">• 监督人可以查看您的打卡记录，但无法修改您的设置。您可以随时移除监督人。</text>
      <text class="info-text">• 被邀请人需要同意后才能成为您的监督人。</text>
    </view>

    <!-- 邀请按钮 -->
    <view class="invite-section">
      <button 
        class="invite-btn"
        :disabled="!canInvite || isInviting"
        @click="performInvite"
      >
        {{ isInviting ? '邀请中...' : '发送邀请' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const selectedMethod = ref('wechat')
const phone = ref('')
const verificationCode = ref('')
const supervisorName = ref('')
const countdown = ref(0)
const isInviting = ref(false)

// 模拟微信好友列表
const wechatFriends = ref([
  { id: 1, name: '小明', avatar: '/static/logo.png' },
  { id: 2, name: '小红', avatar: '/static/logo.png' },
  { id: 3, name: '张阿姨', avatar: '/static/logo.png' }
])

// 计算属性：是否可以邀请
const canInvite = ref(() => {
  if (selectedMethod.value === 'wechat') {
    // 微信方式暂时返回true，实际应检查是否选择了好友
    return true
  } else {
    // 手机号方式需要填写完整信息
    return phone.value.length === 11 && 
           verificationCode.value.length === 6 && 
           supervisorName.value.trim().length > 0
  }
})

// 发送验证码
const sendVerificationCode = async () => {
  if (phone.value.length !== 11) {
    uni.showToast({
      title: '请输入正确的手机号码',
      icon: 'none'
    })
    return
  }
  
  try {
    // 这里应调用发送验证码的API
    uni.showLoading({
      title: '发送中...'
    })
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uni.hideLoading()
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })
  } catch (error) {
    console.error('发送验证码失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '发送验证码失败',
      icon: 'none'
    })
  }
}

// 执行邀请
const performInvite = async () => {
  if (!canInvite.value || isInviting.value) return
  
  isInviting.value = true
  
  try {
    // 这里应调用邀请监护人的API
    uni.showLoading({
      title: '邀请中...'
    })
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    uni.hideLoading()
    
    uni.showToast({
      title: '邀请已发送',
      icon: 'success'
    })
    
    // 延迟返回，让用户看到成功提示
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('邀请失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '邀请失败',
      icon: 'none'
    })
  } finally {
    isInviting.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.invite-supervisor-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 32rpx;
}

.header-section {
  margin-bottom: 48rpx;
}

.header-content {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 48rpx;
  color: #624731;
  margin-right: 24rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #624731;
}

.invite-method-section {
  margin-bottom: 48rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 24rpx;
}

.method-options {
  display: flex;
  gap: 24rpx;
}

.method-item {
  flex: 1;
  padding: 32rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  border: 2rpx solid #E5E5E5;
  text-align: center;
  cursor: pointer;
}

.method-item.active {
  background: #FEF3C7;
  border-color: #F59E0B;
}

.method-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.method-name {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.method-item.active .method-name {
  color: #92400E;
}

.invite-form {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 48rpx;
}

.form-group {
  margin-bottom: 48rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  height: 96rpx;
  background: #FAFAFA;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #333;
  box-sizing: border-box;
}

.verification-input {
  display: flex;
  gap: 16rpx;
}

.verification-btn {
  width: 200rpx;
  height: 96rpx;
  background: #F48224;
  color: white;
  border: none;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.verification-btn:disabled {
  background: #D1D5DB;
  opacity: 0.6;
}

.friend-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
}

.friend-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  margin-right: 16rpx;
}

.friend-name {
  font-size: 24rpx;
  color: #666;
}

.invite-info {
  margin: 48rpx 0;
  padding: 24rpx;
  background: #FEF3C7;
  border-radius: 16rpx;
  border-left: 8rpx solid #F59E0B;
}

.info-text {
  display: block;
  font-size: 24rpx;
  color: #78350F;
  line-height: 1.5;
  margin-bottom: 8rpx;
}

.invite-info .info-text:last-child {
  margin-bottom: 0;
}

.invite-section {
  margin-top: 32rpx;
}

.invite-btn {
  width: 100%;
  height: 112rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 32rpx;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 16rpx 48rpx rgba(244, 130, 36, 0.4);
}

.invite-btn:disabled {
  background: #D1D5DB;
  box-shadow: none;
  opacity: 0.6;
}
</style>