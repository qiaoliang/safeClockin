<template>
  <view class="community-auth-container">
    <view class="header">
      <text class="title">社区身份验证</text>
      <text class="subtitle">请验证您的社区工作人员身份</text>
    </view>
    
    <view class="form-section">
      <view class="form-item">
        <text class="label">真实姓名</text>
        <input 
          class="input" 
          v-model="formData.realName" 
          placeholder="请输入您的真实姓名"
        />
      </view>
      
      <view class="form-item">
        <text class="label">工作证号</text>
        <input 
          class="input" 
          v-model="formData.workId" 
          placeholder="请输入您的工作证号"
        />
      </view>
      
      <view class="form-item">
        <text class="label">所属社区</text>
        <input 
          class="input" 
          v-model="formData.community" 
          placeholder="请输入您所属的社区名称"
        />
      </view>
      
      <view class="form-item">
        <text class="label">联系电话</text>
        <input 
          class="input" 
          v-model="formData.phone" 
          placeholder="请输入您的联系电话"
        />
      </view>
    </view>
    
    <view class="action-section">
      <button class="submit-btn" @tap="submitAuth">提交验证</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({
  realName: '',
  workId: '',
  community: '',
  phone: ''
})

const submitAuth = () => {
  // TODO: 实现身份验证逻辑
  uni.showToast({
    title: '验证功能待实现',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.community-auth-container {
  padding: 60rpx 48rpx;
  min-height: 100vh;
  background: #FAE9DB;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.form-section {
  margin-bottom: 80rpx;
}

.form-item {
  margin-bottom: 48rpx;
}

.label {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.input {
  width: 100%;
  height: 88rpx;
  background: white;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  box-sizing: border-box;

  &:focus {
    border-color: #F48224;
  }
}

.action-section {
  margin-top: 80rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #F48224 0%, #E67E22 100%);
  color: white;
  border: none;
  border-radius: 48rpx;
  font-size: 36rpx;
  font-weight: 600;
}
</style>