<template>
  <view class="community-users-tab">
    <!-- 标题和操作按钮 -->
    <view class="tab-header">
      <h3 class="tab-title">用户管理</h3>
      <button class="add-button" @click="handleAddUserClick">
        <text class="add-icon">+</text>
        <text class="add-text">添加用户</text>
      </button>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchQuery"
          class="search-input"
          type="text"
          placeholder="搜索用户姓名或手机号"
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-button" @click="clearSearch">
          <text class="clear-icon">×</text>
        </button>
      </view>
    </view>
    
    <!-- 用户列表 -->
    <view class="users-list">
      <view
        v-for="user in filteredUsers"
        :key="user.user_id"
        class="user-card"
      >
        <view class="user-info">
          <view class="user-avatar">
            <text class="avatar-icon">👤</text>
            <view v-if="user.verification_status === 1" class="status-indicator status-verified" />
            <view v-else-if="user.verification_status === 0" class="status-indicator status-unverified" />
            <view v-else class="status-indicator status-unknown" />
          </view>
          
          <view class="user-details">
            <text class="user-name">{{ user.nickname || '未设置昵称' }}</text>
            <text class="user-phone">{{ user.phone_number || '未设置手机号' }}</text>
            <view class="user-tags">
              <text class="user-status-tag" :class="getVerificationStatusClass(user.verification_status)">
                {{ getVerificationStatusText(user.verification_status) }}
              </text>
              <text v-if="user.created_at" class="checkin-tag">
                加入时间: {{ formatDate(user.created_at) }}
              </text>
            </view>
          </view>
        </view>
        
        <button class="remove-button" @click="$emit('remove-user', user.user_id)">
          <text class="remove-icon">🗑️</text>
        </button>
      </view>
      
      <!-- 空状态 -->
      <view v-if="filteredUsers.length === 0" class="empty-state">
        <text v-if="searchQuery" class="empty-icon">🔍</text>
        <text v-else class="empty-icon">👥</text>
        
        <text class="empty-text">
          {{ searchQuery ? '未找到匹配的用户' : '暂无用户' }}
        </text>
        
        <text class="empty-hint">
          {{ searchQuery ? '请尝试其他搜索关键词' : '点击"添加用户"按钮添加第一个用户' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  userList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['add-user', 'remove-user', 'refresh'])

// 处理添加用户按钮点击
const handleAddUserClick = () => {
  console.log('CommunityUsersTab: 添加用户按钮被点击')
  emit('add-user')
}

// 搜索功能
const searchQuery = ref('')

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.userList
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return props.userList.filter(user => 
    (user.nickname && user.nickname.toLowerCase().includes(query)) ||
    (user.phone_number && user.phone_number.includes(query))
  )
})

// 辅助函数：获取验证状态对应的CSS类
const getVerificationStatusClass = (status) => {
  switch (status) {
    case 1: return 'verified'
    case 0: return 'unverified'
    default: return 'unknown'
  }
}

// 辅助函数：获取验证状态文本
const getVerificationStatusText = (status) => {
  switch (status) {
    case 1: return '已验证'
    case 0: return '未验证'
    default: return '状态未知'
  }
}

// 辅助函数：格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return '日期格式错误'
  }
}

const handleSearch = () => {
  // 搜索逻辑已通过computed属性处理
}

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-users-tab {
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
  
  .search-container {
    margin-bottom: $uni-spacing-lg;
    
    .search-input-wrapper {
      @include search-input;
      display: flex;
      align-items: center;
      padding: $uni-spacing-sm $uni-spacing-md;
      
      .search-icon {
        font-size: $uni-font-size-sm;
        color: $uni-text-gray-600;
        margin-right: $uni-spacing-sm;
      }
      
      .search-input {
        flex: 1;
        font-size: $uni-font-size-sm;
        color: $uni-text-gray-800;
        background: transparent;
        border: none;
        outline: none;
        
        &::placeholder {
          color: $uni-text-gray-600;
        }
      }
      
      .clear-button {
        width: 32rpx;
        height: 32rpx;
        border-radius: $uni-radius-full;
        background: $uni-bg-color-light;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        
        .clear-icon {
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-600;
        }
        
        &:active {
          background: $uni-bg-color-grey;
          transform: scale(0.9);
        }
      }
    }
  }
  
  .users-list {
    .user-card {
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
      
      .user-info {
        display: flex;
        align-items: center;
        gap: $uni-spacing-md;
        
        .user-avatar {
          position: relative;
          width: 80rpx;
          height: 80rpx;
          border-radius: $uni-radius-full;
          background: rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          
          .avatar-icon {
            font-size: $uni-font-size-lg;
            color: $uni-info;
          }
          
          .status-indicator {
            position: absolute;
            bottom: -2rpx;
            right: -2rpx;
            width: 16rpx;
            height: 16rpx;
            border-radius: $uni-radius-full;
            border: 2rpx solid $uni-white;
            
            &.normal {
              background: $uni-success;
            }
            
            &.abnormal {
              background: $uni-warning;
            }
            
            &.unknown {
              background: $uni-text-gray-600;
            }
            
            // 验证状态样式 - 使用CSS类名
            &.status-verified {
              background: $uni-success;
            }
            
            &.status-unverified {
              background: $uni-warning;
            }
            
            &.status-unknown {
              background: $uni-text-gray-600;
            }
          }
        }
        
        .user-details {
          .user-name {
            display: block;
            font-size: $uni-font-size-base;
            font-weight: $uni-font-weight-base;
            color: $uni-accent;
            margin-bottom: $uni-spacing-xs;
          }
          
          .user-phone {
            display: block;
            font-size: $uni-font-size-xs;
            color: $uni-text-gray-600;
            margin-bottom: $uni-spacing-xs;
          }
          
          .user-tags {
            display: flex;
            align-items: center;
            gap: $uni-spacing-xs;
            
            .user-status-tag {
              font-size: $uni-font-size-xxs;
              padding: 2rpx 8rpx;
              border-radius: $uni-radius-xs;
              display: inline-block;
              
              &.verified {
                background: rgba(16, 185, 129, 0.1);
                color: $uni-success;
              }
              
              &.unverified {
                background: rgba(245, 158, 11, 0.1);
                color: $uni-warning;
              }
              
              &.unknown {
                background: rgba(107, 114, 128, 0.1);
                color: $uni-text-gray-600;
              }
            }
            
            .checkin-tag {
              font-size: $uni-font-size-xxs;
              color: $uni-text-gray-600;
              background: rgba(107, 114, 128, 0.1);
              padding: 2rpx 8rpx;
              border-radius: $uni-radius-xs;
              display: inline-block;
            }
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