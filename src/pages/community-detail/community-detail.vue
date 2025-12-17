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

        <!-- 主管信息 -->
        <view v-if="communityData.manager" class="info-manager">
          <text class="manager-icon">👨‍💼</text>
          <text class="manager-text">主管: {{ communityData.manager.nickname || '未知' }}</text>
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
            <text class="stat-label">社区用户</text>
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
          <view class="management-card">
            <text class="card-title">社区专员管理</text>
            <text class="card-description">管理社区的工作人员，包括主管和专员</text>
            <view class="card-stats">
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.staff_count || 0 }}</text>
                <text class="stat-label">工作人员</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.admin_count || 0 }}</text>
                <text class="stat-label">专员</text>
              </view>
            </view>
            <button class="manage-btn" @click="navigateToStaffManage">
              进入专员管理
            </button>
          </view>
        </view>

        <!-- 用户管理 -->
        <view v-else-if="activeTab === 'users'" class="tab-panel">
          <view class="management-card">
            <text class="card-title">社区用户管理</text>
            <text class="card-description">管理社区成员，查看用户信息和打卡情况</text>
            <view class="card-stats">
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.user_count || 0 }}</text>
                <text class="stat-label">成员</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.checkin_rate || 0 }}%</text>
                <text class="stat-label">打卡率</text>
              </view>
            </view>
            <button class="manage-btn" @click="navigateToUserManage">
              进入用户管理
            </button>
          </view>
        </view>

        <!-- 打卡规则 -->
        <view v-else-if="activeTab === 'checkin'" class="tab-panel">
          <view class="management-card">
            <text class="card-title">打卡规则管理</text>
            <text class="card-description">设置和管理社区的打卡规则</text>
            <view class="card-stats">
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.checkin_rules || 0 }}</text>
                <text class="stat-label">规则数</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ communityData.stats?.active_users || 0 }}</text>
                <text class="stat-label">活跃用户</text>
              </view>
            </view>
            <button class="manage-btn" @click="navigateToCheckinRules">
              进入规则管理
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { communityApi } from '@/api'

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
  { id: 'checkin', name: '打卡规则' }
]

// Store
const userStore = useUserStore()

// 计算属性
const hasEditPermission = computed(() => {
  try {
    const userRole = userStore.role
    const userInfo = userStore.userInfo || {}
    
    // 防御性检查
    if (!userRole || !communityId.value) {
      return false
    }
    
    // 超级管理员可以编辑所有社区
    if (userRole === 4 || userRole === '超级系统管理员') return true
    
    // 社区主管可以编辑自己管理的社区
    // 注意：这里简化了逻辑，实际应该检查用户是否是该社区的主管
    // 由于社区角色信息可能存储在communityRoles中，这里先返回false
    // 实际实现应该从API获取用户在该社区的角色
    return false
  } catch (error) {
    console.error('权限计算错误:', error)
    return false
  }
})

// 检查是否有查看权限
const hasViewPermission = computed(() => {
  try {
    const userRole = userStore.role
    const userInfo = userStore.userInfo || {}
    
    if (!userRole || !communityId.value) {
      return false
    }
    
    // 超级管理员可以查看所有社区
    if (userRole === 4 || userRole === '超级系统管理员') return true
    
    // 社区工作人员可以查看自己管理的社区
    // 注意：这里简化了逻辑，实际应该从API获取用户管理的社区列表
    // 或者检查用户是否是该社区的工作人员
    // 由于权限检查主要在后端进行，这里先返回true，让后端进行最终验证
    if (userRole === 3 || userRole === '社区主管' || userRole === '社区专员') {
      return true
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
  communityName.value = decodeURIComponent(options.communityName || '')
  
  if (communityId.value) {
    loadCommunityDetail()
  } else {
    error.value = '社区ID不能为空'
    loading.value = false
  }
})

// URL解码函数
const decodeText = (text) => {
  if (!text || typeof text !== 'string') return text
  
  try {
    // 尝试解码URL编码的文本
    return decodeURIComponent(text)
  } catch (error) {
    // 如果解码失败，返回原文本
    console.warn('URL解码失败:', error)
    return text
  }
}

// 解码社区数据中的文本字段
const decodeCommunityData = (data) => {
  if (!data || typeof data !== 'object') return data
  
  const decoded = { ...data }
  
  // 解码基本文本字段
  if (decoded.name) decoded.name = decodeText(decoded.name)
  if (decoded.description) decoded.description = decodeText(decoded.description)
  if (decoded.location) decoded.location = decodeText(decoded.location)
  
  // 解码创建者信息
  if (decoded.creator && decoded.creator.nickname) {
    decoded.creator.nickname = decodeText(decoded.creator.nickname)
  }
  
  // 解码主管信息
  if (decoded.manager && decoded.manager.nickname) {
    decoded.manager.nickname = decodeText(decoded.manager.nickname)
  }
  
  return decoded
}

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
      // 解码API返回的数据
      communityData.value = decodeCommunityData(response.data.community || {})
      
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

// 导航到专员管理页面
const navigateToStaffManage = () => {
  uni.navigateTo({
    url: `/pages/community-staff-manage/community-staff-manage?communityId=${communityId.value}&communityName=${encodeURIComponent(communityData.value.name || '')}`
  })
}

// 导航到用户管理页面
const navigateToUserManage = () => {
  uni.navigateTo({
    url: `/pages/community-user-manage/community-user-manage?communityId=${communityId.value}&communityName=${encodeURIComponent(communityData.value.name || '')}`
  })
}

// 导航到打卡规则页面
const navigateToCheckinRules = () => {
  uni.showToast({
    title: '打卡规则功能开发中',
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
  
  .info-manager {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .manager-icon {
      margin-right: 8px;
      color: #666;
    }
    
    .manager-text {
      color: #666;
      font-size: 14px;
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
    grid-template-columns: repeat(3, 1fr);
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
    
    .management-card {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      
      .card-title {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      
      .card-description {
        display: block;
        font-size: 14px;
        color: #666;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .card-stats {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        
        .stat-item {
          flex: 1;
          text-align: center;
          padding: 12px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          
          .stat-value {
            display: block;
            font-size: 20px;
            font-weight: 600;
            color: #409eff;
            margin-bottom: 4px;
          }
          
          .stat-label {
            display: block;
            font-size: 12px;
            color: #666;
          }
        }
      }
      
      .manage-btn {
        width: 100%;
        background-color: #409eff;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }
}
</style>