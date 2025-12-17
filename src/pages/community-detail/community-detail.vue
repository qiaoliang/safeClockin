<template>
  <view class="community-detail-container">
    <!-- 顶部导航栏 -->
    <view class="header-bar">
      <view class="header-left" @click="goBack">
        <text class="icon-back">←</text>
      </view>
      <text class="header-title">{{ communityName || '社区详情' }}</text>
      <view v-if="hasEditPermission" class="header-right" @click="showSettingsMenu">
        <text class="icon-settings">⋮</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadCommunityDetail">重试</button>
    </view>

    <!-- 内容区域 -->
    <view v-else class="content-area">
      <!-- 社区基本信息卡片 -->
      <view class="community-info-card">
        <view class="info-header">
          <text class="community-name">{{ communityData.name }}</text>
          <view :class="['status-tag', communityData.status === 'active' ? 'status-tag-active' : 'status-tag-inactive']">
            {{ communityData.status === 'active' ? '启用' : '停用' }}
          </view>
        </view>

        <view class="info-location">
          <text class="location-icon">📍</text>
          <text class="location-text">{{ communityData.location || '未设置位置' }}</text>
        </view>

        <view v-if="communityData.description" class="info-description">
          <text class="description-text">{{ communityData.description }}</text>
        </view>

        <!-- 统计信息网格 -->
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ communityData.stats?.admin_count || 0 }}</text>
            <text class="stat-label">专员</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ communityData.stats?.user_count || 0 }}</text>
            <text class="stat-label">成员</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ communityData.stats?.staff_count || 0 }}</text>
            <text class="stat-label">工作人员</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ communityData.stats?.checkin_rate || 0 }}%</text>
            <text class="stat-label">打卡率</text>
          </view>
        </view>

        <!-- 创建信息 -->
        <view class="creation-info">
          <text class="info-text">创建者: {{ communityData.creator?.nickname || '未知' }}</text>
          <text class="info-text">创建时间: {{ formatDate(communityData.created_at) }}</text>
        </view>
      </view>

      <!-- Tab切换栏 -->
      <view class="tab-bar">
        <view 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-item', activeTab === tab.id ? 'tab-item-active' : '']"
          @click="switchTab(tab.id)"
        >
          <text class="tab-text">{{ tab.name }}</text>
        </view>
      </view>

      <!-- Tab内容区域 -->
      <view class="tab-content">
        <!-- 专员管理 -->
        <view v-if="activeTab === 'staff'" class="tab-panel">
          <community-staff-list :community-id="communityId" />
        </view>

        <!-- 用户管理 -->
        <view v-else-if="activeTab === 'users'" class="tab-panel">
          <community-user-list :community-id="communityId" />
        </view>

        <!-- 打卡规则 -->
        <view v-else-if="activeTab === 'checkin'" class="tab-panel">
          <community-checkin-rules :community-id="communityId" />
        </view>

        <!-- 任务分配 -->
        <view v-else-if="activeTab === 'tasks'" class="tab-panel">
          <text class="placeholder-text">任务分配功能开发中...</text>
        </view>

        <!-- 应援记录 -->
        <view v-else-if="activeTab === 'support'" class="tab-panel">
          <text class="placeholder-text">应援记录功能开发中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { communityApi } from '@/api'
import CommunityStaffList from '@/components/community/CommunityStaffList.vue'
import CommunityUserList from '@/components/community/CommunityUserList.vue'
import CommunityCheckinRules from '@/components/community/CommunityCheckinRules.vue'

// 路由参数
const communityId = ref('')
const communityName = ref('')

// 数据状态
const loading = ref(true)
const error = ref('')
const communityData = ref({})

// Tab状态
const activeTab = ref('staff')
const tabs = [
  { id: 'staff', name: '专员管理' },
  { id: 'users', name: '用户管理' },
  { id: 'checkin', name: '打卡规则' },
  { id: 'tasks', name: '任务分配' },
  { id: 'support', name: '应援记录' }
]

// Store
const userStore = useUserStore()

// 计算属性
const hasEditPermission = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    const userCommunities = userStore.managedCommunities || []
    
    // 防御性检查
    if (!userRole || !communityId.value) {
      return false
    }
    
    // 超级管理员可以编辑所有社区
    if (userRole === 4) return true
    
    // 社区主管可以编辑自己管理的社区
    if (userRole === 3) {
      return userCommunities.some(c => 
        c && c.id === communityId.value && c.user_role === 'manager'
      )
    }
    
    return false
  } catch (error) {
    console.error('权限计算错误:', error)
    return false
  }
})

// 检查是否有查看权限
const hasViewPermission = computed(() => {
  try {
    const userRole = userStore.userInfo?.role
    const userCommunities = userStore.managedCommunities || []
    
    if (!userRole || !communityId.value) {
      return false
    }
    
    // 超级管理员可以查看所有社区
    if (userRole === 4) return true
    
    // 社区工作人员可以查看自己管理的社区
    if (userRole === 3) {
      return userCommunities.some(c => 
        c && c.id === communityId.value
      )
    }
    
    return false
  } catch (error) {
    console.error('查看权限计算错误:', error)
    return false
  }
})

// 生命周期
onLoad((options) => {
  communityId.value = options.communityId || ''
  communityName.value = options.communityName || ''
  
  if (communityId.value) {
    loadCommunityDetail()
  } else {
    error.value = '社区ID不能为空'
    loading.value = false
  }
})

// 方法
const loadCommunityDetail = async () => {
  if (!communityId.value) {
    error.value = '社区ID不能为空'
    loading.value = false
    return
  }
  
  // 检查查看权限
  if (!hasViewPermission.value) {
    error.value = '无权限查看该社区详情'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await communityApi.getCommunityDetail(communityId.value)
    if (response.code === 1) {
      communityData.value = response.data.community || {}
      
      // 验证返回的数据是否属于当前用户有权限的社区
      if (communityData.value.id && communityData.value.id.toString() !== communityId.value.toString()) {
        error.value = '数据验证失败'
        communityData.value = {}
      }
    } else {
      error.value = response.msg || '获取社区详情失败'
      communityData.value = {}
    }
  } catch (err) {
    console.error('加载社区详情失败:', err)
    error.value = '网络错误，请稍后重试'
    communityData.value = {}
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const showSettingsMenu = () => {
  // 显示编辑/更多操作菜单
  const items = ['编辑社区', '删除社区', '导出数据']
  
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const index = res.tapIndex
      if (index === 0) {
        editCommunity()
      } else if (index === 1) {
        deleteCommunity()
      } else if (index === 2) {
        exportData()
      }
    }
  })
}

const switchTab = (tabId) => {
  activeTab.value = tabId
  // 这里可以添加加载对应Tab数据的逻辑
}

const editCommunity = () => {
  uni.navigateTo({
    url: `/pages/community-form/community-form?communityId=${communityId.value}&mode=edit`
  })
}

const deleteCommunity = () => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除社区"${communityData.value.name}"吗？此操作不可恢复。`,
    success: (res) => {
      if (res.confirm) {
        // 调用删除API
        console.log('删除社区:', communityId.value)
      }
    }
  })
}

const exportData = () => {
  uni.showToast({
    title: '导出功能开发中',
    icon: 'none'
  })
}

const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  } catch (e) {
    return dateString
  }
}
</script>

<style lang="scss" scoped>
.community-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  
  .header-left,
  .header-right {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon-back,
    .icon-settings {
      font-size: 20px;
      color: #333;
    }
  }
  
  .header-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.loading-container,
.error-container {
  padding: 40px 20px;
  text-align: center;
  
  .error-text {
    color: #f56c6c;
    margin-bottom: 20px;
  }
  
  .retry-btn {
    background-color: #409eff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
  }
}

.content-area {
  padding: 16px;
}

.community-info-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .community-name {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
    
    .status-tag {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      
      &.status-tag-active {
        background-color: #e8f5e9;
        color: #4caf50;
      }
      
      &.status-tag-inactive {
        background-color: #ffebee;
        color: #f44336;
      }
    }
  }
  
  .info-location {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .location-icon {
      margin-right: 8px;
      color: #666;
    }
    
    .location-text {
      color: #666;
      font-size: 14px;
    }
  }
  
  .info-description {
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 4px;
    
    .description-text {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    
    .stat-item {
      text-align: center;
      padding: 12px 8px;
      background-color: #f9f9f9;
      border-radius: 6px;
      
      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
      }
    }
  }
  
  .creation-info {
    border-top: 1px solid #eee;
    padding-top: 12px;
    
    .info-text {
      display: block;
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
  }
}

.tab-bar {
  display: flex;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    border-bottom: 2px solid transparent;
    
    &.tab-item-active {
      border-bottom-color: #409eff;
      
      .tab-text {
        color: #409eff;
      }
    }
    
    .tab-text {
      font-size: 14px;
      color: #666;
    }
  }
}

.tab-content {
  .tab-panel {
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    min-height: 200px;
    
    .placeholder-text {
      color: #999;
      text-align: center;
      display: block;
      padding: 40px 0;
    }
  }
}
</style>