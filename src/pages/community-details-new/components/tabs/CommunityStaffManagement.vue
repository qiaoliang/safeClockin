<template>
  <view class="community-staff-management">
    <!-- 标题和操作按钮 -->
    <view class="tab-header">
      <h3 class="tab-title">专员管理</h3>
      <button class="add-button" @click="showAddStaffModal">
        <text class="add-icon">+</text>
        <text class="add-text">添加专员</text>
      </button>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-container" v-if="staffList.length > 0">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchQuery"
          class="search-input"
          type="text"
          placeholder="搜索专员姓名或手机号"
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-button" @click="clearSearch">
          <text class="clear-icon">×</text>
        </button>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadStaffList">重试</button>
    </view>
    
    <!-- 专员列表 -->
    <view v-else class="staff-list">
      <view
        v-for="staff in filteredStaffList"
        :key="staff.user_id"
        class="staff-item"
      >
        <!-- 专员头像和信息 -->
        <view class="staff-header">
          <view class="staff-avatar-container">
            <image 
              v-if="staff.avatar_url" 
              :src="staff.avatar_url" 
              class="staff-avatar"
              mode="aspectFit"
            />
            <text v-else class="staff-avatar-placeholder">👤</text>
          </view>
          <view class="staff-info">
            <text class="staff-name">{{ staff.nickname || '未设置昵称' }}</text>
            <text class="staff-phone">{{ staff.phone_number || '未设置手机号' }}</text>
            <text class="staff-added-time">
              成为专员时间：{{ formatDate(staff.added_time) }}
            </text>
          </view>
        </view>
        
        <!-- 删除按钮 -->
        <button class="delete-btn" @click.stop="handleDeleteStaff(staff)">
          <text class="delete-icon">🗑️</text>
        </button>
      </view>
      
      <!-- 空状态 -->
      <view v-if="filteredStaffList.length === 0" class="empty-container">
        <text v-if="searchQuery" class="empty-icon">🔍</text>
        <text v-else class="empty-icon">👥</text>
        
        <text class="empty-title">
          {{ searchQuery ? '未找到匹配的专员' : '暂无专员' }}
        </text>
        
        <text class="empty-text">
          {{ searchQuery ? '请尝试其他搜索关键词' : '点击"添加专员"按钮添加第一个专员' }}
        </text>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && !searchQuery" class="load-more-container">
        <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
          <text v-if="loadingMore" class="loading-text">加载中...</text>
          <text v-else class="load-more-text">加载更多</text>
        </button>
      </view>
    </view>
    
    <!-- 添加专员模态框 -->
    <AddStaffModal
      v-if="showAddModal"
      :community-id="communityId"
      @close="hideAddStaffModal"
      @confirm="handleAddStaffConfirm"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AddStaffModal from '../modals/AddStaffModal.vue'
import { getCommunityStaffList, removeCommunityStaff } from '@/api/community'

const props = defineProps({
  communityId: {
    type: String,
    required: true
  }
})

// 状态管理
const staffList = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const searchQuery = ref('')
const showAddModal = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const hasMore = computed(() => (currentPage.value * pageSize.value) < totalCount.value)

// 过滤后的专员列表
const filteredStaffList = computed(() => {
  if (!searchQuery.value.trim()) {
    return staffList.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return staffList.value.filter(staff => 
    (staff.nickname && staff.nickname.toLowerCase().includes(query)) ||
    (staff.phone_number && staff.phone_number.includes(query))
  )
})

// 加载专员列表
const loadStaffList = async (page = 1, isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    error.value = ''
  }
  
  try {
    // 调用后端API获取专员列表
    const response = await fetchStaffList(page)
    
    if (response.code === 1) {
      const { staff_members, pagination } = response.data
      
      if (isLoadMore) {
        // 加载更多时追加数据
        staffList.value = [...staffList.value, ...staff_members]
      } else {
        // 首次加载时替换数据
        staffList.value = staff_members
      }
      
      totalCount.value = pagination.total
      currentPage.value = pagination.page
      
      // 更新社区信息中的专员数量
      updateCommunityStaffCount()
    } else {
      error.value = response.msg || '加载专员列表失败'
    }
  } catch (err) {
    console.error('加载专员列表失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return
  loadStaffList(currentPage.value + 1, true)
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已通过computed属性处理
}

const clearSearch = () => {
  searchQuery.value = ''
}

// 显示添加专员模态框
const showAddStaffModal = () => {
  showAddModal.value = true
}

const hideAddStaffModal = () => {
  showAddModal.value = false
}

// 处理添加专员确认
const handleAddStaffConfirm = async (addedUsers) => {
  // 添加操作已在子组件中完成，这里只需重新加载专员列表
  try {
    // 重新加载专员列表
    await loadStaffList(1, false)
    
    // 更新社区信息中的专员数量
    updateCommunityStaffCount()
    
    // 如果addedUsers有值，可以显示添加了多少个专员
    if (addedUsers && addedUsers.length > 0) {
      console.log(`添加了${addedUsers.length}个专员:`, addedUsers.map(u => u.nickname || u.user_id))
    }
  } catch (err) {
    console.error('重新加载专员列表失败:', err)
    // 不显示错误，因为添加操作本身可能已成功
  }
}

// 处理删除专员
const handleDeleteStaff = (staff) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要将 ${staff.nickname || '该专员'} 从专员列表中移除吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          
          const response = await removeStaffMember(staff.user_id)
          
          if (response.code === 1) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            
            // 从列表中移除
            staffList.value = staffList.value.filter(s => s.user_id !== staff.user_id)
            
            // 更新社区信息中的专员数量
            updateCommunityStaffCount()
          } else {
            uni.showToast({ title: response.msg || '删除失败', icon: 'error' })
          }
        } catch (err) {
          console.error('删除专员失败:', err)
          uni.showToast({ title: '删除失败', icon: 'error' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 辅助函数：格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    // 计算时间差
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks}周前`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months}个月前`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years}年前`
    }
  } catch (error) {
    return '日期格式错误'
  }
}

// API调用函数
const fetchStaffList = async (page = 1) => {
  return getCommunityStaffList(props.communityId, { 
    page: page, 
    limit: pageSize.value,
    role: 'staff' // 只获取专员，不包括主管
  })
}



const removeStaffMember = async (userId) => {
  return removeCommunityStaff(props.communityId, userId)
}

const updateCommunityStaffCount = () => {
  // 更新社区信息中的专员数量
  // 可以通过事件总线或props传递
  console.log('更新社区专员数量')
}

// 组件挂载时加载数据
onMounted(() => {
  loadStaffList()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-staff-management {
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
  
  .loading-container,
  .error-container {
    @include card-gradient;
    padding: $uni-spacing-xxl;
    text-align: center;
    border-radius: $uni-radius-lg;
    margin-bottom: $uni-spacing-xl;
    
    .error-text {
      display: block;
      font-size: $uni-font-size-base;
      color: $uni-error;
      margin-bottom: $uni-spacing-md;
    }
    
    .retry-btn {
      @include btn-primary;
      padding: $uni-spacing-sm $uni-spacing-base;
    }
  }
  
  .staff-list {
    .staff-item {
      @include card-gradient;
      padding: $uni-spacing-lg;
      border-radius: $uni-radius-base;
      margin-bottom: $uni-spacing-base;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 4px solid $uni-info;
      
      .staff-header {
        display: flex;
        align-items: center;
        flex: 1;
        
        .staff-avatar-container {
          margin-right: $uni-spacing-base;
          
          .staff-avatar {
            width: 60rpx;
            height: 60rpx;
            border-radius: $uni-radius-full;
          }
          
          .staff-avatar-placeholder {
            font-size: $uni-font-size-lg;
            color: $uni-secondary;
          }
        }
        
        .staff-info {
          flex: 1;
          
          .staff-name {
            display: block;
            font-size: $uni-font-size-base;
            font-weight: $uni-font-weight-base;
            color: $uni-text-gray-700;
            margin-bottom: $uni-spacing-xs;
          }
          
          .staff-phone {
            display: block;
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-600;
            margin-bottom: $uni-spacing-xs;
          }
          
          .staff-added-time {
            display: block;
            font-size: $uni-font-size-xs;
            color: $uni-text-gray-600;
          }
        }
      }
      
      .delete-btn {
        @include btn-primary;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: $uni-radius-xl;
        width: 60rpx;
        height: 60rpx;
        background-color: $uni-error;
        
        .delete-icon {
          font-size: $uni-font-size-xl;
          color: $uni-white;
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
    }
    
    .empty-container {
      @include card-gradient;
      padding: $uni-spacing-xxl;
      text-align: center;
      border-radius: $uni-radius-lg;
      margin-bottom: $uni-spacing-xl;
      
      .empty-icon {
        font-size: 48rpx;
        color: $uni-text-gray-600;
        display: block;
        margin-bottom: $uni-spacing-md;
      }
      
      .empty-title {
        display: block;
        font-size: $uni-font-size-lg;
        font-weight: $uni-font-weight-base;
        color: $uni-accent;
        margin-bottom: $uni-spacing-sm;
      }
      
      .empty-text {
        display: block;
        font-size: $uni-font-size-base;
        color: $uni-text-gray-600;
      }
    }
    
    .load-more-container {
      text-align: center;
      margin-top: $uni-spacing-lg;
      
      .load-more-btn {
        @include btn-primary;
        padding: $uni-spacing-sm $uni-spacing-xl;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-text,
        .load-more-text {
          font-size: $uni-font-size-sm;
        }
      }
    }
  }
}
</style>