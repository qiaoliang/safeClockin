<template>
  <view class="community-rules-tab">
    <!-- 标题 -->
    <view class="tab-header">
      <h3 class="tab-title">规则管理</h3>
      <button class="add-button" @click="$emit('add-rule')">
        <text class="add-icon">+</text>
        <text class="add-text">添加规则</text>
      </button>
    </view>
    
    <!-- 占位提示 -->
    <view class="placeholder-container">
      <text class="placeholder-icon">📋</text>
      <text class="placeholder-title">规则管理功能</text>
      <text class="placeholder-text">正在开发中...</text>
      <text class="placeholder-hint">此功能将用于管理社区的打卡规则</text>
    </view>
    
    <!-- 占位规则列表 -->
    <view class="placeholder-list">
      <view class="placeholder-item">
        <text class="item-icon">⏰</text>
        <text class="item-text">每日打卡规则</text>
        <text class="item-status">已启用</text>
      </view>
      <view class="placeholder-item">
        <text class="item-icon">📅</text>
        <text class="item-text">每周总结规则</text>
        <text class="item-status">已启用</text>
      </view>
      <view class="placeholder-item">
        <text class="item-icon">🔔</text>
        <text class="item-text">提醒通知规则</text>
        <text class="item-status">配置中</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  ruleList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['add-rule', 'edit-rule', 'remove-rule'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-rules-tab {
  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $uni-spacing-xl;
    
    .tab-title {
      font-size: $uni-font-size-lg;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
    }
    
    .add-button {
      @include btn-primary;
      padding: $uni-spacing-sm $uni-spacing-base;
      
      .add-icon {
        margin-right: $uni-spacing-xs;
      }
    }
  }
  
  .placeholder-container {
    @include card-gradient;
    padding: $uni-spacing-xxl;
    text-align: center;
    border-radius: $uni-radius-lg;
    margin-bottom: $uni-spacing-xl;
    
    .placeholder-icon {
      display: block;
      font-size: 48rpx;
      margin-bottom: $uni-spacing-md;
    }
    
    .placeholder-title {
      display: block;
      font-size: $uni-font-size-lg;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      margin-bottom: $uni-spacing-sm;
    }
    
    .placeholder-text {
      display: block;
      font-size: $uni-font-size-base;
      color: $uni-text-gray-600;
      margin-bottom: $uni-spacing-xs;
    }
    
    .placeholder-hint {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-gray-600;
    }
  }
  
  .placeholder-list {
    .placeholder-item {
      @include card-gradient;
      padding: $uni-spacing-lg;
      border-radius: $uni-radius-base;
      margin-bottom: $uni-spacing-base;
      display: flex;
      align-items: center;
      
      .item-icon {
        font-size: $uni-font-size-lg;
        margin-right: $uni-spacing-base;
        color: $uni-secondary;
      }
      
      .item-text {
        flex: 1;
        font-size: $uni-font-size-base;
        color: $uni-text-gray-700;
      }
      
      .item-status {
        font-size: $uni-font-size-xs;
        padding: $uni-spacing-xs $uni-spacing-sm;
        border-radius: $uni-radius-sm;
        background: $uni-bg-color-light;
        color: $uni-success;
      }
    }
  }
}
</style>