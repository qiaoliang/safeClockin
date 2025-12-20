<template>
  <view class="community-assign-tab">
    <!-- 标题 -->
    <view class="tab-header">
      <h3 class="tab-title">分配管理</h3>
      <button class="add-button" @click="$emit('assign')">
        <text class="add-icon">+</text>
        <text class="add-text">分配任务</text>
      </button>
    </view>
    
    <!-- 占位提示 -->
    <view class="placeholder-container">
      <text class="placeholder-icon">📝</text>
      <text class="placeholder-title">分配管理功能</text>
      <text class="placeholder-text">正在开发中...</text>
      <text class="placeholder-hint">此功能将用于管理任务分配和人员调度</text>
    </view>
    
    <!-- 占位分配列表 -->
    <view class="placeholder-list">
      <view class="placeholder-item">
        <text class="item-icon">👤</text>
        <view class="item-content">
          <text class="item-title">日常巡查任务</text>
          <text class="item-subtitle">分配给：张三</text>
        </view>
        <text class="item-status">进行中</text>
      </view>
      <view class="placeholder-item">
        <text class="item-icon">👥</text>
        <view class="item-content">
          <text class="item-title">周会组织</text>
          <text class="item-subtitle">分配给：李四团队</text>
        </view>
        <text class="item-status">待开始</text>
      </view>
      <view class="placeholder-item">
        <text class="item-icon">📊</text>
        <view class="item-content">
          <text class="item-title">月度报告</text>
          <text class="item-subtitle">分配给：王五</text>
        </view>
        <text class="item-status">已完成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  assignList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['assign', 'unassign'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-assign-tab {
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
      display: flex;
      align-items: center;
      
      .item-icon {
        font-size: $uni-font-size-lg;
        margin-right: $uni-spacing-base;
        color: $uni-secondary;
      }
      
      .item-content {
        flex: 1;
        
        .item-title {
          display: block;
          font-size: $uni-font-size-base;
          color: $uni-text-gray-700;
          margin-bottom: $uni-spacing-xs;
        }
        
        .item-subtitle {
          display: block;
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-600;
        }
      }
      
      .item-status {
        font-size: $uni-font-size-xs;
        padding: $uni-spacing-xs $uni-spacing-sm;
        border-radius: $uni-radius-sm;
        
        &.in-progress {
          background: rgba(245, 158, 11, 0.1);
          color: $uni-warning;
        }
        
        &.pending {
          background: rgba(59, 130, 246, 0.1);
          color: $uni-info;
        }
        
        &.completed {
          background: rgba(16, 185, 129, 0.1);
          color: $uni-success;
        }
      }
    }
  }
}
</style>