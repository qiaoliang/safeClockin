<template>
  <view class="community-support-tab">
    <!-- 标题 -->
    <view class="tab-header">
      <h3 class="tab-title">应援管理</h3>
      <button class="add-button" @click="$emit('add-support')">
        <text class="add-icon">+</text>
        <text class="add-text">发起应援</text>
      </button>
    </view>
    
    <!-- 占位提示 -->
    <view class="placeholder-container">
      <text class="placeholder-icon">🤝</text>
      <text class="placeholder-title">应援管理功能</text>
      <text class="placeholder-text">正在开发中...</text>
      <text class="placeholder-hint">此功能将用于管理社区支持和互助活动</text>
    </view>
    
    <!-- 占位应援列表 -->
    <view class="placeholder-list">
      <view class="placeholder-item">
        <view class="item-header">
          <text class="item-icon">🍱</text>
          <text class="item-title">送餐服务</text>
          <text class="item-status active">进行中</text>
        </view>
        <text class="item-description">为独居老人提供每周三次的送餐服务</text>
        <view class="item-stats">
          <text class="stat">👥 5人参与</text>
          <text class="stat">📅 持续2周</text>
        </view>
      </view>
      <view class="placeholder-item">
        <view class="item-header">
          <text class="item-icon">🏥</text>
          <text class="item-title">医疗陪同</text>
          <text class="item-status pending">待确认</text>
        </view>
        <text class="item-description">陪同社区成员进行定期医疗检查</text>
        <view class="item-stats">
          <text class="stat">👥 3人报名</text>
          <text class="stat">📅 本周六</text>
        </view>
      </view>
      <view class="placeholder-item">
        <view class="item-header">
          <text class="item-icon">📚</text>
          <text class="item-title">学习辅导</text>
          <text class="item-status completed">已结束</text>
        </view>
        <text class="item-description">为社区儿童提供课后学习辅导</text>
        <view class="item-stats">
          <text class="stat">👥 8人受益</text>
          <text class="stat">⭐ 4.8评分</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  supportList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['add-support', 'join-support', 'cancel-support'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-support-tab {
  .tab-header {
    display: flex;
    align-items: center;
    margin-bottom: $uni-spacing-lg;
    
    .tab-title {
      font-size: $uni-font-size-base;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      flex: 1; /* 标题占据剩余空间，实现左对齐 */
    }
    
    .add-button {
      display: flex;
      align-items: center;
      gap: $uni-spacing-xs;
      padding: $uni-spacing-xs $uni-spacing-sm;
      background: transparent;
      border-radius: $uni-radius-sm;
      transition: all 0.2s ease;
      
      .add-icon {
        font-size: $uni-font-size-sm;
        color: $uni-secondary;
      }
      
      .add-text {
        font-size: $uni-font-size-xs;
        color: $uni-secondary;
        font-weight: $uni-font-weight-base;
      }
      
      &:active {
        background: rgba(144, 147, 153, 0.1);
        transform: scale(0.98);
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
      
      .item-header {
        display: flex;
        align-items: center;
        margin-bottom: $uni-spacing-sm;
        
        .item-icon {
          font-size: $uni-font-size-lg;
          margin-right: $uni-spacing-base;
          color: $uni-secondary;
        }
        
        .item-title {
          flex: 1;
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
          color: $uni-text-gray-700;
        }
        
        .item-status {
          font-size: $uni-font-size-xs;
          padding: $uni-spacing-xs $uni-spacing-sm;
          border-radius: $uni-radius-sm;
          
          &.active {
            background: rgba(16, 185, 129, 0.1);
            color: $uni-success;
          }
          
          &.pending {
            background: rgba(245, 158, 11, 0.1);
            color: $uni-warning;
          }
          
          &.completed {
            background: rgba(59, 130, 246, 0.1);
            color: $uni-info;
          }
        }
      }
      
      .item-description {
        display: block;
        font-size: $uni-font-size-sm;
        color: $uni-text-gray-600;
        margin-bottom: $uni-spacing-sm;
        line-height: 1.4;
      }
      
      .item-stats {
        display: flex;
        gap: $uni-spacing-lg;
        
        .stat {
          font-size: $uni-font-size-xs;
          color: $uni-text-gray-600;
        }
      }
    }
  }
}
</style>