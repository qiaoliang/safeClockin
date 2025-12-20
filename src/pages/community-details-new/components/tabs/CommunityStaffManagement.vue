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
      :visible="showAddModal"
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
const hasMore = ref(false) // 由后端API的pagination.has_more字段更新

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
    // Layer 1: 入口点验证 - 调用API
    const response = await fetchStaffList(page)
    
    // Layer 2: 业务逻辑验证 - 检查响应结构
    if (!response || typeof response !== 'object') {
      throw new Error('API返回无效响应')
    }
    
    if (response.code === 1) {
      // Layer 3: 环境守卫 - 安全地访问响应字段
      const staff_members = response.data?.staff_members || []
      const pagination = response.data?.pagination || {}
      
      // Layer 4: 调试仪表 - 记录响应结构用于取证
      console.log('专员列表API响应:', {
        code: response.code,
        has_staff_members: Array.isArray(staff_members),
        staff_members_count: staff_members.length,
        has_pagination: !!pagination,
        pagination_fields: pagination
      })
      
      if (isLoadMore) {
        // 加载更多时追加数据
        staffList.value = [...staffList.value, ...staff_members]
      } else {
        // 首次加载时替换数据
        staffList.value = staff_members
      }
      
      // 安全地设置分页值，提供默认值
      totalCount.value = pagination.total || 0
      currentPage.value = pagination.page || page
      hasMore.value = pagination.has_more || false
      
      // 更新社区信息中的专员数量
      updateCommunityStaffCount()
    } else {
      // Layer 3: 环境守卫 - 处理业务错误
      error.value = response.msg || '加载专员列表失败'
      
      // Layer 4: 调试仪表 - 记录错误详情
      console.error('专员列表API业务错误:', {
        code: response.code,
        msg: response.msg,
        data: response.data
      })
    }
  } catch (err) {
    // Layer 3: 环境守卫 - 捕获所有异常
    console.error('加载专员列表失败:', err)
    
    // Layer 4: 调试仪表 - 记录完整错误信息
    console.error('完整错误堆栈:', err.stack || '无堆栈信息')
    
    error.value = '网络错误，请稍后重试'
  } finally {
    // 确保加载状态被重置
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
  console.log('添加专员按钮被点击，设置showAddModal为true')
  showAddModal.value = true
  console.log('showAddModal当前值:', showAddModal.value)
}

const hideAddStaffModal = () => {
  showAddModal.value = false
}

// 处理添加专员确认
const handleAddStaffConfirm = async (addedUsers) => {
  // Layer 1: 入口点验证 - 检查上下文
  if (!props.communityId) {
    console.error('handleAddStaffConfirm: 缺少社区ID')
    return
  }
  
  // Layer 4: 调试仪表 - 记录添加操作
  console.log('处理添加专员确认:', {
    communityId: props.communityId,
    addedUsersCount: addedUsers?.length || 0,
    addedUsers: addedUsers || []
  })
  
  // Layer 2: 业务逻辑验证 - 重新加载专员列表
  try {
    // 保存当前列表长度作为基准
    const beforeRefreshCount = staffList.value.length
    
    // 重新加载专员列表
    await loadStaffList(1, false)
    
    // 更新社区信息中的专员数量
    updateCommunityStaffCount()
    
    // Layer 3: 环境守卫 - 验证刷新结果
    const afterRefreshCount = staffList.value.length
    const expectedIncrease = addedUsers?.length || 0
    const actualIncrease = afterRefreshCount - beforeRefreshCount
    
    // Layer 4: 调试仪表 - 记录刷新结果
    console.log('专员列表刷新验证:', {
      beforeRefreshCount,
      afterRefreshCount,
      expectedIncrease,
      actualIncrease,
      match: actualIncrease === expectedIncrease
    })
    
    // 如果addedUsers有值，可以显示添加了多少个专员
    if (addedUsers && addedUsers.length > 0) {
      console.log(`添加了${addedUsers.length}个专员:`, addedUsers.map(u => u.nickname || u.user_id))
      
      // 可选：显示添加成功的提示
      if (actualIncrease > 0) {
        // 已经在子组件中显示过成功提示，这里不再重复显示
      }
    }
  } catch (err) {
    // Layer 3: 环境守卫 - 优雅地处理错误
    console.error('重新加载专员列表失败:', err)
    
    // Layer 4: 调试仪表 - 记录完整错误信息
    console.error('重新加载专员列表完整错误堆栈:', err.stack || '无堆栈信息')
    
    // 不显示错误给用户，因为添加操作本身可能已成功
    // 但我们可以尝试其他恢复策略，比如只重新加载而不重置分页
    try {
      // 尝试使用当前页面重新加载，而不是重置到第一页
      await loadStaffList(currentPage.value, false)
    } catch (retryErr) {
      console.error('恢复策略也失败:', retryErr)
    }
  }
}

// 处理删除专员
const handleDeleteStaff = (staff) => {
  // Layer 1: 入口点验证 - 检查必要参数
  if (!staff || !staff.user_id) {
    console.error('删除专员失败: 无效的专员数据', staff)
    uni.showToast({ title: '无效的专员数据', icon: 'error' })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要将 ${staff.nickname || '该专员'} 从专员列表中移除吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          
          // Layer 4: 调试仪表 - 记录删除操作
          console.log('开始删除专员:', {
            userId: staff.user_id,
            nickname: staff.nickname,
            communityId: props.communityId
          })
          
          const response = await removeStaffMember(staff.user_id)
          
          // Layer 2: 业务逻辑验证 - 检查响应结构
          if (!response || typeof response !== 'object') {
            throw new Error('API返回无效响应')
          }
          
          if (response.code === 1) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            
            // Layer 3: 环境守卫 - 安全地从列表中移除
            const originalLength = staffList.value.length
            staffList.value = staffList.value.filter(s => s.user_id !== staff.user_id)
            const newLength = staffList.value.length
            
            // Layer 4: 调试仪表 - 验证删除结果
            console.log('删除结果验证:', {
              originalLength,
              newLength,
              deleted: originalLength > newLength,
              userId: staff.user_id
            })
            
            // 更新社区信息中的专员数量
            updateCommunityStaffCount()
          } else {
            // Layer 3: 环境守卫 - 处理业务错误
            const errorMsg = response.msg || '删除失败'
            console.error('删除专员业务错误:', {
              code: response.code,
              msg: errorMsg,
              data: response.data
            })
            uni.showToast({ title: errorMsg, icon: 'error' })
          }
        } catch (err) {
          // Layer 3: 环境守卫 - 捕获所有异常
          console.error('删除专员失败:', err)
          
          // Layer 4: 调试仪表 - 记录完整错误信息
          console.error('删除操作完整错误堆栈:', err.stack || '无堆栈信息')
          
          uni.showToast({ title: '删除失败，请稍后重试', icon: 'error' })
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
  try {
    // Layer 1: 入口点验证 - 检查必要参数
    if (!props.communityId) {
      console.error('缺少社区ID参数')
      throw new Error('缺少社区ID参数')
    }
    
    if (page < 1) {
      page = 1
    }
    
    // Layer 2: 业务逻辑验证 - 准备请求参数
    const params = { 
      page: page, 
      limit: pageSize.value,
      role: 'staff' // 只获取专员，不包括主管
    }
    
    // Layer 4: 调试仪表 - 记录请求详情
    console.log('请求专员列表:', {
      communityId: props.communityId,
      params: params
    })
    
    const response = await getCommunityStaffList(props.communityId, params)
    
    // Layer 3: 环境守卫 - 验证响应结构
    if (!response || typeof response !== 'object') {
      console.error('API返回无效响应类型:', typeof response)
      throw new Error('API返回无效响应')
    }
    
    // Layer 4: 调试仪表 - 记录响应摘要
    console.log('API响应摘要:', {
      code: response.code,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    })
    
    return response
  } catch (error) {
    // Layer 3: 环境守卫 - 捕获并重新包装错误
    console.error('fetchStaffList失败:', error)
    
    // 返回一个结构化的错误响应，避免上游崩溃
    return {
      code: 0,
      msg: error.message || '获取专员列表失败',
      data: null
    }
  }
}



const removeStaffMember = async (userId) => {
  try {
    // Layer 1: 入口点验证 - 检查必要参数
    if (!props.communityId) {
      console.error('removeStaffMember: 缺少社区ID')
      throw new Error('缺少社区ID')
    }
    
    if (!userId) {
      console.error('removeStaffMember: 缺少用户ID')
      throw new Error('缺少用户ID')
    }
    
    // Layer 4: 调试仪表 - 记录API调用详情
    console.log('调用removeCommunityStaff API:', {
      communityId: props.communityId,
      userId: userId,
      timestamp: new Date().toISOString()
    })
    
    const response = await removeCommunityStaff(props.communityId, userId)
    
    // Layer 2: 业务逻辑验证 - 检查响应结构
    if (!response || typeof response !== 'object') {
      console.error('removeStaffMember: API返回无效响应类型:', typeof response)
      throw new Error('API返回无效响应')
    }
    
    // Layer 4: 调试仪表 - 记录响应摘要
    console.log('removeStaffMember API响应:', {
      code: response.code,
      msg: response.msg,
      hasData: !!response.data
    })
    
    return response
  } catch (error) {
    // Layer 3: 环境守卫 - 捕获并重新包装错误
    console.error('removeStaffMember失败:', error)
    
    // 返回一个结构化的错误响应，避免上游崩溃
    return {
      code: 0,
      msg: error.message || '移除专员失败',
      data: null
    }
  }
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