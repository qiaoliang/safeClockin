<template>
  <view class="community-detail-header">
    <header class="header-container">
      <button class="header-button back-button" @click="$emit('back')">
        <view class="button-icon">
          <text class="icon-arrow">←</text>
        </view>
      </button>
      
      <h1 class="header-title">{{ title }}</h1>
      
      <button class="header-button settings-button" @click="$emit('settings')">
        <view class="button-icon">
          <text class="icon-settings">⚙️</text>
        </view>
      </button>
    </header>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '社区详情'
  }
})

defineEmits(['back', 'settings'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-detail-header {
  padding: $uni-spacing-base $uni-spacing-base $uni-spacing-sm;
  
  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .header-button {
      width: 80rpx;
      height: 80rpx;
      border-radius: $uni-radius-full;
      background: $uni-bg-color-white;
      opacity: 0.8;
      box-shadow: $uni-shadow-sm;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.95);
        opacity: 1;
      }
      
      .button-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        
        .icon-arrow,
        .icon-settings {
          font-size: $uni-font-size-xl;
          color: $uni-accent;
        }
      }
    }
    
    .header-title {
      flex: 1;
      text-align: center;
      font-size: $uni-font-size-lg;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      margin: 0 $uni-spacing-base;
    }
  }
}
</style>