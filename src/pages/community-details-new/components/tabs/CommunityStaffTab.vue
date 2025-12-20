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
        v-for="staff in normalizedStaffList"
        :key="staff.user_id"
        class="staff-card"
      >
        <view class="staff-info">
          <view class="staff-avatar">
            <text class="avatar-icon">{{ getRoleIcon(staff.role) }}</text>
          </view>
          
          <view class="staff-details">
            <text class="staff-name">{{ staff.name }}</text>
            <text class="staff-phone">{{ staff.phone }}</text>
            <text class="staff-role">{{ staff.roleDisplay }}</text>
          </view>
        </view>
        
        <button class="remove-button" @click="$emit('remove-staff', staff.user_id)">
          <text class="remove-icon">🗑️</text>
        </button>
      </view>
      
      <!-- 空状态 -->
      <view v-if="normalizedStaffList.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无专员</text>
        <text class="empty-hint">点击"添加专员"按钮添加第一个专员</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

// 规范化工作人员数据，处理字段名映射
const normalizedStaffList = computed(() => {
  return props.staffList.map(staff => {
    // 处理字段名映射：后端返回nickname和phone_number，前端期望name和phone
    const id = staff.id || staff.user_id
    const name = staff.name || staff.nickname || '未知'
    const phone = staff.phone || staff.phone_number || '未知'
    const role = staff.role || 'staff'
    const roleDisplay = getRoleDisplay(role)
    
    return {
      id,
      name,
      phone,
      role,
      roleDisplay,
      // 保留原始数据用于调试
      _raw: staff
    }
  })
})

// 获取角色显示文本
const getRoleDisplay = (role) => {
  const roleMap = {
    'manager': '主管',
    'staff': '专员',
    'admin': '管理员'
  }
  return roleMap[role] || role || '专员'
}

// 获取角色图标
const getRoleIcon = (role) => {
  const iconMap = {
    'manager': '👑',
    'staff': '👔',
    'admin': '⚙️'
  }
  return iconMap[role] || '👤'
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-staff-tab {
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
        @include btn-primary; /* 使用与刷新按钮相同的橙色背景 */
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: $uni-radius-xl; /* 24rpx = 12px，与刷新按钮一致 */
        width: 60rpx;
        height: 60rpx;
        
        .remove-icon {
          font-size: $uni-font-size-xl;
          color: $uni-white;
        }
        
        &:active {
          transform: scale(0.95);
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
  
}
</style>