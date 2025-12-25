<template>
  <view class="community-list-container">
    <view class="section-header">
      <text class="section-title">
        {{ userRole === 'super_admin' ? '全部社区' : '我的社区' }}
      </text>
      <text class="section-subtitle">
        {{ userRole === 'super_admin' ? '您管理的所有社区' : '您有管理权限的社区' }}
      </text>
    </view>
    
    <scroll-view 
      class="community-list-scroll" 
      scroll-x 
      :show-scrollbar="false"
      enhanced
      :bounces="true"
    >
      <view class="community-list">
        <view 
          v-for="community in communities" 
          :key="community.community_id" 
          class="community-card"
          @click="handleCommunityClick(community)"
        >
          <view class="card-header">
            <text class="community-name">
              {{ community.name }}
            </text>
            <view
              class="role-badge"
              :class="getRoleBadgeClass(community.user_role)"
            >
              <text class="role-text">
                {{ getRoleDisplayName(community.user_role) }}
              </text>
            </view>
          </view>
          
          <view class="card-content">
            <text
              v-if="community.description"
              class="community-desc"
            >
              {{ community.description }}
            </text>
            <text class="community-location">
              📍 {{ community.location || '未知地址' }}
            </text>
          </view>
          
          <view class="card-stats">
            <view class="stat-item">
              <text class="stat-number">
                {{ community.user_count || 0 }}
              </text>
              <text class="stat-label">
                用户
              </text>
            </view>
            <view class="stat-divider" />
            <view class="stat-item">
              <text class="stat-number">
                {{ community.admin_count || 0 }}
              </text>
              <text class="stat-label">
                管理员
              </text>
            </view>
          </view>
          
          <view
            v-if="community.is_default"
            class="card-footer"
          >
            <text class="default-badge">
              默认社区
            </text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view
          v-if="communities.length === 0 && !loading"
          class="empty-state"
        >
          <view class="empty-icon">
            🏘️
          </view>
          <text class="empty-text">
            暂无管理社区
          </text>
          <text class="empty-subtext">
            您还没有被分配到任何社区
          </text>
        </view>
        
        <!-- 加载状态 -->
        <view
          v-if="loading"
          class="loading-state"
        >
          <view
            v-for="i in 3"
            :key="i"
            class="loading-card"
          >
            <view class="skeleton-line" />
            <view class="skeleton-line short" />
            <view class="skeleton-line" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getManagedCommunities } from '@/api/api'

const props = defineProps({
  // 是否自动加载数据
  autoLoad: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['community-click', 'load-complete'])

const communities = ref([])
const userRole = ref('')
const loading = ref(false)
const error = ref('')

// 获取社区列表
const loadCommunities = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await getManagedCommunities()
    
    if (response.code === 1) {
      communities.value = response.data.communities || []
      userRole.value = response.data.user_role || ''
      
      console.log('社区列表加载成功:', {
        total: response.data.total,
        userRole: userRole.value,
        communities: communities.value.length
      })
    } else {
      error.value = response.msg || '加载社区列表失败'
      console.error('社区列表加载失败:', response)
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('社区列表加载异常:', err)
  } finally {
    loading.value = false
    emit('load-complete', {
      success: !error.value,
      communities: communities.value,
      userRole: userRole.value
    })
  }
}

// 处理社区点击
const handleCommunityClick = (community) => {
  console.log('社区被点击:', community)
  emit('community-click', community)
}

// 获取角色徽章样式
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'super_admin':
      return 'role-super-admin'
    case 'primary_admin':
      return 'role-primary-admin'
    case 'normal_admin':
      return 'role-normal-admin'
    default:
      return 'role-default'
  }
}

// 获取角色显示名称
const getRoleDisplayName = (role) => {
  switch (role) {
    case 'super_admin':
      return '超级管理员'
    case 'primary_admin':
      return '主管'
    case 'normal_admin':
      return '管理员'
    default:
      return '成员'
  }
}

// 暴露方法给父组件
defineExpose({
  loadCommunities,
  refresh: loadCommunities
})

// 自动加载
onMounted(() => {
  if (props.autoLoad) {
    loadCommunities()
  }
})
</script>

<style lang="scss" scoped>
.community-list-container {
  margin-top: 16rpx;
  margin-bottom: 48rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 8rpx;
}

.section-subtitle {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.community-list-scroll {
  white-space: nowrap;
  padding: 0 32rpx;
}

.community-list {
  display: flex;
  gap: 24rpx;
  padding-bottom: 16rpx;
}

.community-card {
  flex: 0 0 280rpx;
  background: white;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
}

.community-card:active {
  transform: scale(0.95);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.community-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.role-super-admin {
  background: linear-gradient(135deg, #F48224, #D67A1F);
}

.role-primary-admin {
  background: linear-gradient(135deg, #10B981, #059669);
}

.role-normal-admin {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
}

.role-default {
  background: linear-gradient(135deg, #6B7280, #4B5563);
}

.role-text {
  font-size: 20rpx;
  color: white;
  font-weight: 500;
}

.card-content {
  margin-bottom: 16rpx;
  flex: 1;
}

.community-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.community-location {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.card-stats {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #624731;
}

.stat-label {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background: #E5E7EB;
  margin: 0 16rpx;
}

.card-footer {
  text-align: center;
}

.default-badge {
  font-size: 20rpx;
  color: #F48224;
  background: rgba(244, 130, 36, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.empty-state {
  flex: 0 0 280rpx;
  background: white;
  border-radius: 24rpx;
  padding: 48rpx 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200rpx;
}

.empty-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.empty-subtext {
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.loading-state {
  display: flex;
  gap: 24rpx;
}

.loading-card {
  flex: 0 0 280rpx;
  background: white;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 12rpx;
}

.skeleton-line.short {
  width: 60%;
  height: 20rpx;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>