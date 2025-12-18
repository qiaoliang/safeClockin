<template>
  <view class="community-staff-tab">
    <!-- 标题和操作按钮 -->
    <view class="tab-header">
      <h3 class="tab-title">专员管理</h3>
      <button class="add-button" @click="$emit('add-staff')">
        <text class="add-icon">+</text>
        <text class="add-text">添加专员</text>
      </button>
    </view>
    
    <!-- 专员列表 -->
    <view class="staff-list">
      <view
        v-for="staff in staffList"
        :key="staff.id"
        class="staff-card"
      >
        <view class="staff-info">
          <view class="staff-avatar">
            <text class="avatar-icon">👔</text>
          </view>
          
          <view class="staff-details">
            <text class="staff-name">{{ staff.name }}</text>
            <text class="staff-phone">{{ staff.phone }}</text>
            <text class="staff-role">{{ staff.role }}</text>
          </view>
        </view>
        
        <button class="remove-button" @click="$emit('remove-staff', staff.id)">
          <text class="remove-icon">🗑️</text>
          <text class="remove-text">移除</text>
        </button>
      </view>
      
      <!-- 空状态 -->
      <view v-if="staffList.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无专员</text>
        <text class="empty-hint">点击"添加专员"按钮添加第一个专员</text>
      </view>
    </view>
    
    <!-- 刷新按钮 -->
    <button class="refresh-button" @click="$emit('refresh')">
      <text class="refresh-icon">🔄</text>
      <text class="refresh-text">刷新列表</text>
    </button>
  </view>
</template>

<script setup>
defineProps({
  staffList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: String,
    default: ''
  }
})

defineEmits(['add-staff', 'remove-staff', 'refresh'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-staff-tab {
  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $uni-spacing-lg;
    
    .tab-title {
      font-size: $uni-font-size-base;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
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
  
  .staff-list {
    .staff-card {
      @include card-gradient;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $uni-spacing-md;
      margin-bottom: $uni-spacing-sm;
      transition: all 0.3s ease;
      
      &:active {
        transform: translateY(-1px);
        box-shadow: $uni-shadow-card-hover;
      }
      
      .staff-info {
        display: flex;
        align-items: center;
        gap: $uni-spacing-md;
        
        .staff-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: $uni-radius-full;
          background: rgba(144, 147, 153, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          
          .avatar-icon {
            font-size: $uni-font-size-lg;
            color: $uni-secondary;
          }
        }
        
        .staff-details {
          .staff-name {
            display: block;
            font-size: $uni-font-size-base;
            font-weight: $uni-font-weight-base;
            color: $uni-accent;
            margin-bottom: $uni-spacing-xs;
          }
          
          .staff-phone {
            display: block;
            font-size: $uni-font-size-xs;
            color: $uni-text-gray-600;
            margin-bottom: $uni-spacing-xs;
          }
          
          .staff-role {
            display: block;
            font-size: $uni-font-size-xxs;
            color: $uni-secondary;
            background: rgba(144, 147, 153, 0.1);
            padding: 2rpx 8rpx;
            border-radius: $uni-radius-xs;
            display: inline-block;
          }
        }
      }
      
      .remove-button {
        @include btn-danger;
        padding: $uni-spacing-xs $uni-spacing-sm;
        font-size: $uni-font-size-xs;
        display: flex;
        align-items: center;
        gap: $uni-spacing-xs;
        
        .remove-icon {
          font-size: $uni-font-size-sm;
        }
        
        .remove-text {
          font-weight: $uni-font-weight-base;
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: $uni-spacing-xxxl $uni-spacing-xl;
      
      .empty-icon {
        font-size: $uni-font-size-xxxl;
        color: $uni-text-gray-600;
        display: block;
        margin-bottom: $uni-spacing-md;
      }
      
      .empty-text {
        display: block;
        font-size: $uni-font-size-base;
        color: $uni-text-gray-700;
        margin-bottom: $uni-spacing-xs;
      }
      
      .empty-hint {
        display: block;
        font-size: $uni-font-size-xs;
        color: $uni-text-gray-600;
      }
    }
  }
  
  .refresh-button {
    @include btn-primary;
    width: 100%;
    padding: $uni-spacing-sm;
    margin-top: $uni-spacing-lg;
    font-size: $uni-font-size-base;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $uni-spacing-sm;
    
    .refresh-icon {
      font-size: $uni-font-size-base;
    }
    
    .refresh-text {
      font-weight: $uni-font-weight-base;
    }
  }
}
</style>