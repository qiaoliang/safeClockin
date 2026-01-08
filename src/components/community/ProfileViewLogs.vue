<template>
  <view class="profile-view-logs-container">
    <view class="panel-header">
      <text class="panel-title">
        浏览记录
      </text>
      <text
        class="panel-close"
        @click="handleClose"
      >
        ✕
      </text>
    </view>

    <!-- 筛选器 -->
    <view class="filter-section">
      <view
        :class="['filter-item', { active: filterType === 'all' }]"
        @click="handleFilterChange('all')"
      >
        全部
      </view>
      <view
        :class="['filter-item', { active: filterType === 'profile' }]"
        @click="handleFilterChange('profile')"
      >
        成员信息
      </view>
      <view
        :class="['filter-item', { active: filterType === 'guardian' }]"
        @click="handleFilterChange('guardian')"
      >
        监护人信息
      </view>
    </view>

    <!-- 日志列表 -->
    <scroll-view
      class="logs-list"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view
        v-if="loading && logs.length === 0"
        class="loading-state"
      >
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <view
        v-else-if="logs.length === 0"
        class="empty-state"
      >
        <text class="empty-text">
          暂无浏览记录
        </text>
      </view>

      <view
        v-else
        class="logs-content"
      >
        <view
          v-for="log in displayLogs"
          :key="log.id"
          class="log-item"
        >
          <view class="log-header">
            <view class="viewer-info">
              <text class="viewer-name">
                {{ log.viewer_name || '未知用户' }}
              </text>
              <text
                v-if="log.viewer_role"
                :class="['role-tag', getRoleClass(log.viewer_role)]"
              >
                {{ log.viewer_role }}
              </text>
            </view>
            <text class="log-time">
              {{ formatLogTime(log.created_at) }}
            </text>
          </view>

          <view class="log-content">
            <view class="log-type">
              <text class="type-icon">
                {{ getLogTypeIcon(log.view_type) }}
              </text>
              <text class="type-text">
                {{ getLogTypeText(log.view_type) }}
              </text>
            </view>
            <view
              v-if="log.viewed_user_name"
              class="viewed-user"
            >
              查看了 {{ log.viewed_user_name }}
              <text
                v-if="log.ward_user_name"
                class="ward-info"
              >
                的监护人 {{ log.guardian_name }} 的信息
              </text>
              <text v-else>
                的信息
              </text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view
          v-if="hasMore && !loadingMore"
          class="load-more"
        >
          <text class="load-more-text">
            下拉加载更多
          </text>
        </view>

        <view
          v-if="loadingMore"
          class="loading-more"
        >
          <text class="loading-more-text">
            加载中...
          </text>
        </view>

        <view
          v-if="!hasMore && logs.length > 0"
          class="no-more"
        >
          <text class="no-more-text">
            没有更多了
          </text>
        </view>
      </view>
    </scroll-view>

    <!-- 关闭按钮 -->
    <view class="close-section">
      <button
        class="close-btn"
        @click="handleClose"
      >
        关闭
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getProfileViewLogs } from '@/api/user'

const props = defineProps({
  communityId: {
    type: [String, Number],
    required: true
  },
  viewedUserId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['close'])

const userStore = useUserStore()

// 日志列表
const logs = ref([])

// 筛选类型
const filterType = ref('all')

// 加载状态
const loading = ref(false)
const loadingMore = ref(false)

// 分页
const page = ref(1)
const pageSize = 20
const hasMore = ref(true)

// 显示的日志（经过筛选）
const displayLogs = computed(() => {
  if (filterType.value === 'all') {
    return logs.value
  }
  return logs.value.filter(log => log.view_type === filterType.value)
})

// 加载浏览记录
const loadLogs = async (refresh = false) => {
  if (!props.communityId) return

  try {
    if (refresh) {
      loading.value = true
      page.value = 1
      hasMore.value = true
    } else {
      loadingMore.value = true
    }

    const params = {
      limit: pageSize,
      page: page.value
    }

    if (props.viewedUserId) {
      params.viewed_user_id = props.viewedUserId
    }

    const response = await getProfileViewLogs(props.communityId, params)

    if (response.code === 1 || response.code === 0) {
      const newLogs = response.data?.logs || []

      if (refresh) {
        logs.value = newLogs
      } else {
        logs.value = [...logs.value, ...newLogs]
      }

      hasMore.value = newLogs.length >= pageSize
    }
  } catch (error) {
    console.error('加载浏览记录失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return

  page.value++
  loadLogs(false)
}

// 筛选类型改变
const handleFilterChange = (type) => {
  filterType.value = type
}

// 获取日志类型图标
const getLogTypeIcon = (type) => {
  const icons = {
    profile: '👤',
    guardian: '👥'
  }
  return icons[type] || '📄'
}

// 获取日志类型文本
const getLogTypeText = (type) => {
  const texts = {
    profile: '查看成员信息',
    guardian: '查看监护人信息'
  }
  return texts[type] || '查看信息'
}

// 获取角色样式类
const getRoleClass = (role) => {
  if (role.includes('超级管理员') || role.includes('Super Admin')) {
    return 'role-super-admin'
  } else if (role.includes('主管') || role.includes('Manager')) {
    return 'role-manager'
  } else if (role.includes('专员') || role.includes('Staff')) {
    return 'role-staff'
  }
  return 'role-default'
}

// 格式化日志时间
const formatLogTime = (time) => {
  if (!time) return ''

  try {
    const date = new Date(time)
    const now = new Date()
    const diff = now - date

    // 小于1小时显示"刚刚"
    if (diff < 3600000) {
      return '刚刚'
    }

    // 小于24小时显示"X小时前"
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    }

    // 小于7天显示"X天前"
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`
    }

    // 其他显示完整日期
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return time
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

onMounted(() => {
  loadLogs(true)
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.profile-view-logs-container {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg $uni-radius-lg 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid $uni-border-1;
}

.panel-title {
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-main-color;
}

.panel-close {
  font-size: $uni-font-size-xxl;
  color: $uni-base-color;
  padding: 8rpx;
}

.filter-section {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 16rpx;
  border-bottom: 1rpx solid $uni-border-1;
}

.filter-item {
  padding: 12rpx 24rpx;
  background: $uni-bg-color-lighter;
  color: $uni-base-color;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  transition: all 0.3s ease;
}

.filter-item.active {
  background: $uni-primary;
  color: $uni-white;
}

.logs-list {
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  padding: 120rpx 32rpx;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-secondary-color;
}

.logs-content {
  padding: 32rpx;
}

.log-item {
  padding: 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
  margin-bottom: 16rpx;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.viewer-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.viewer-name {
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
}

.role-tag {
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.role-super-admin {
  background: $uni-error-light;
  color: $uni-error;
}

.role-manager {
  background: $uni-warning-light;
  color: $uni-warning;
}

.role-staff {
  background: $uni-primary-light;
  color: $uni-primary;
}

.role-default {
  background: $uni-bg-color-grey;
  color: $uni-secondary-color;
}

.log-time {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
}

.log-content {
  padding-left: 16rpx;
}

.log-type {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.type-icon {
  font-size: 32rpx;
}

.type-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.viewed-user {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  line-height: 1.6;
}

.ward-info {
  color: $uni-primary;
  font-weight: $uni-font-weight-base;
}

.load-more,
.loading-more,
.no-more {
  padding: 32rpx;
  text-align: center;
}

.load-more-text,
.loading-more-text,
.no-more-text {
  font-size: $uni-font-size-base;
  color: $uni-secondary-color;
}

.close-section {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid $uni-border-1;
}

.close-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: $uni-bg-color-lighter;
  color: $uni-main-color;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-lg;
}

.close-btn:active {
  background: $uni-bg-color-grey;
}
</style>
