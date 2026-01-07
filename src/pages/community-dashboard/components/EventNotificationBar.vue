<template>
  <view class="event-notification-bar" @click="handleBarClick">
    <scroll-view
      class="notification-scroll"
      scroll-x
      :show-scrollbar="false"
    >
      <view class="notification-list">
        <view
          v-for="event in events"
          :key="event.event_id"
          class="notification-item"
          @click.stop="handleEventClick(event)"
        >
          <text class="notification-icon">🔔</text>
          <view class="notification-content">
            <text class="notification-title">{{ event.title }}</text>
            <text class="notification-time">{{ event.relative_time }}</text>
          </view>
          <text class="notification-arrow">›</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['eventClick'])

const handleBarClick = () => {
  // 点击通知条可以跳转到事件列表页
}

const handleEventClick = (event) => {
  emit('eventClick', event)
}
</script>

<style lang="scss" scoped>
.event-notification-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: shake 3s infinite;
  margin: 20rpx 0;
  border-radius: 12rpx;
  overflow: hidden;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5rpx); }
  75% { transform: translateX(5rpx); }
}

.notification-scroll {
  white-space: nowrap;
}

.notification-list {
  display: inline-flex;
  padding: 20rpx;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  margin-right: 20rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 8rpx;
  min-width: 500rpx;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s;

  &:active {
    transform: scale(0.95);
  }
}

.notification-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.notification-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
}

.notification-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.notification-arrow {
  font-size: 40rpx;
  color: #fff;
  margin-left: 20rpx;
}
</style>
