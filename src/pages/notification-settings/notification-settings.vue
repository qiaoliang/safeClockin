<!-- pages/notification-settings/notification-settings.vue -->
<template>
  <view class="notification-settings-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">通知设置</text>
      </view>
    </view>

    <!-- 通知设置选项 -->
    <view class="settings-section">
      <view class="setting-item">
        <view class="setting-info">
          <text class="setting-title">接收被监督人完成打卡通知</text>
          <text class="setting-desc">当被监督的用户完成打卡时，您会收到推送通知</text>
        </view>
        <switch 
          class="setting-switch"
          :checked="settings.checkin_completion"
          @change="toggleSetting('checkin_completion')"
        />
      </view>
      
      <view class="setting-item">
        <view class="setting-info">
          <text class="setting-title">接收未打卡提醒</text>
          <text class="setting-desc">当被监督人未按时打卡时，您会收到提醒</text>
        </view>
        <switch 
          class="setting-switch"
          :checked="settings.checkin_reminder"
          @change="toggleSetting('checkin_reminder')"
        />
      </view>
      
      <view class="setting-item">
        <view class="setting-info">
          <text class="setting-title">接收规则变更通知</text>
          <text class="setting-desc">当被监督人修改打卡规则时，您会收到通知</text>
        </view>
        <switch 
          class="setting-switch"
          :checked="settings.rule_change"
          @change="toggleSetting('rule_change')"
        />
      </view>
    </view>

    <!-- 通知说明 -->
    <view class="info-section">
      <view class="info-card">
        <view class="info-header">
          <view class="info-icon">ℹ️</view>
          <view class="info-content">
            <text class="info-title">通知说明</text>
            <text class="info-desc">开启相应通知后，您将通过站内消息、短信或微信推送收到相关提醒。您可以根据需要灵活调整通知偏好。</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 通知设置
const settings = ref({
  checkin_completion: true,   // 接收打卡完成通知
  checkin_reminder: true,     // 接收未打卡提醒
  rule_change: false          // 接收规则变更通知
})

// 切换设置
const toggleSetting = (key) => {
  settings.value[key] = !settings.value[key]
  
  // 在实际项目中，这里会调用API保存设置
  saveSettings()
}

// 保存设置到服务器
const saveSettings = async () => {
  try {
    // 这里应调用保存通知设置的API
    console.log('保存通知设置:', settings.value)
    // 模拟API调用
    // await request({
    //   url: '/api/notification/settings',
    //   method: 'POST',
    //   data: settings.value
    // })
  } catch (error) {
    console.error('保存通知设置失败:', error)
    // 恢复之前的设置状态
    settings.value[Object.keys(settings.value).find(key => 
      settings.value[key] !== !settings.value[key]
    )] = !settings.value[Object.keys(settings.value).find(key => 
      settings.value[key] !== !settings.value[key]
    )]
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  // 加载保存的通知设置
  loadSettings()
})

// 加载通知设置
const loadSettings = async () => {
  try {
    // 这里应调用获取通知设置的API
    // const response = await request({
    //   url: '/api/notification/settings',
    //   method: 'GET'
    // })
    // if (response.code === 1) {
    //   settings.value = response.data
    // }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}
</script>

<style scoped>
.notification-settings-container {
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

.settings-section {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 48rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.setting-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.setting-switch {
  transform: scale(0.8);
}

.info-section {
  margin-top: 24rpx;
}

.info-card {
  background: #FEF3C7;
  border-radius: 24rpx;
  padding: 32rpx;
  border-left: 8rpx solid #F59E0B;
}

.info-header {
  display: flex;
  align-items: flex-start;
}

.info-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.info-content {
  flex: 1;
}

.info-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 16rpx;
}

.info-desc {
  display: block;
  font-size: 24rpx;
  color: #78350F;
  line-height: 1.5;
}
</style>
