<template>
  <view class="community-manage-container">
    <!-- 顶部标题栏 -->
    <view class="header-bar">
      <view
        v-if="hasFeaturePermission(FeaturePermission.MERGE_COMMUNITY) || hasFeaturePermission(FeaturePermission.SPLIT_COMMUNITY)"
        class="header-left"
        @click="showMoreMenu"
      >
        <text class="icon-more">
          ⋮
        </text>
      </view>
      <text class="header-title">
        社区管理
      </text>
      <view
        class="header-right"
        @click="showFilterPanel"
      >
        <text class="icon-filter">
          🔍
        </text>
      </view>
    </view>

    <!-- 社区列表 -->
    <view class="community-list">
      <uni-swipe-action>
        <uni-swipe-action-item
          v-for="item in displayCommunities"
          :key="item.id"
          :options="swipeOptions"
          @click="handleSwipeClick($event, item)"
        >
          <view
            class="community-item"
            @click="viewCommunityDetail(item)"
            @longpress="showActionMenu(item)"
          >
            <view class="community-header">
              <text class="community-name">
                {{ item.name }}
              </text>
              <view
                :class="['status-tag', item.status === 'active' ? 'status-tag-active' : 'status-tag-inactive']"
              >
                {{ item.status === 'active' ? '启用' : '停用' }}
              </view>
            </view>

            <view class="community-location">
              <text class="location-icon">
                📍
              </text>
              <text class="location-text">
                {{ item.location }}
              </text>
            </view>

            <view class="community-meta">
              <text class="meta-text">
                👤 {{ item.manager_name || '未分配' }}
              </text>
              <text class="meta-divider">
                |
              </text>
              <text class="meta-text">
                {{ formatDate(item.created_at) }}
              </text>
            </view>
          </view>
        </uni-swipe-action-item>
      </uni-swipe-action>

      <!-- 空状态 -->
      <view
        v-if="displayCommunities.length === 0 && !loading"
        class="empty-state"
      >
        <text class="empty-text">
          {{ EMPTY_MESSAGES.NO_COMMUNITIES }}
        </text>
      </view>

      <!-- 加载更多 -->
      <view
        v-if="loading"
        class="loading-more"
      >
        <uni-load-more :status="loadMoreStatus" />
      </view>
    </view>

    <!-- 底部悬浮按钮 - 仅有创建权限的用户可见 -->
    <view
      v-if="hasFeaturePermission(FeaturePermission.CREATE_COMMUNITY)"
      class="floating-add-btn"
      @click="createCommunity"
    >
      <text class="add-icon">
        +
      </text>
    </view>

    <!-- 筛选面板 -->
    <uni-popup
      ref="filterPopup"
      type="bottom"
    >
      <view class="filter-panel">
        <view class="filter-header">
          <text class="filter-title">
            筛选
          </text>
          <text
            class="filter-close"
            @click="closeFilter"
          >
            ✕
          </text>
        </view>

        <view class="filter-section">
          <text class="filter-label">
            状态
          </text>
          <uni-data-checkbox
            v-model="filterStatus"
            :localdata="statusOptions"
            mode="button"
          />
        </view>

        <view class="filter-section">
          <text class="filter-label">
            搜索
          </text>
          <uni-easyinput
            v-model="filterKeyword"
            placeholder="输入社区名称"
          />
        </view>

        <view class="filter-actions">
          <button
            class="reset-btn"
            @click="resetFilter"
          >
            重置
          </button>
          <button
            class="confirm-btn"
            @click="applyFilter"
          >
            确认
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { formatDate } from '@/utils/community'
import {
  CommunityStatus,
  EMPTY_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath, FeaturePermission } from '@/constants/permissions'
import { hasFeaturePermission } from '@/utils/permission'
import { useUserStore } from '@/store/modules/user'

const communityStore = useCommunityStore()
const userStore = useUserStore()

// 页面权限检查
onLoad(() => {
  if (!checkPagePermission(PagePath.COMMUNITY_MANAGE)) {
    return
  }
  // 页面权限检查通过,继续初始化
  console.log('[社区管理] 权限检查通过,开始加载数据')
})

// 筛选状态
const filterStatus = ref(['all'])
const filterKeyword = ref('')
const filterPopup = ref(null)

// 加载状态
const loading = ref(false)
const loadMoreStatus = computed(() => {
  if (loading.value) return 'loading'
  if (!communityStore.hasMore) return 'noMore'
  return 'more'
})

// 状态选项
const statusOptions = [
  { text: '全部', value: 'all' },
  { text: '启用', value: CommunityStatus.ACTIVE },
  { text: '停用', value: CommunityStatus.INACTIVE }
]

// 滑动操作选项
const swipeOptions = [
  {
    text: '操作',
    style: {
      backgroundColor: '#F48224'
    }
  }
]

// 显示的社区列表（经过筛选）
const displayCommunities = computed(() => {
  let list = communityStore.communities

  // 状态筛选
  if (!filterStatus.value.includes('all')) {
    list = list.filter(item => filterStatus.value.includes(item.status))
  }

  // 关键词筛选
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    )
  }

  return list
})

// 加载社区列表
const loadCommunities = async (refresh = false) => {
  if (loading.value) return

  try {
    loading.value = true
    await communityStore.loadCommunities(refresh)
  } catch (error) {
    console.error('加载社区列表失败:', error)
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 显示更多菜单
const showMoreMenu = () => {
  uni.showActionSheet({
    itemList: ['社区合并', '社区拆分'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 社区合并
        uni.navigateTo({
          url: '/pages/community-merge/community-merge'
        })
      } else if (res.tapIndex === 1) {
        // 社区拆分
        uni.navigateTo({
          url: '/pages/community-split/community-split'
        })
      }
    }
  })
}

// 显示筛选面板
const showFilterPanel = () => {
  filterPopup.value?.open()
}

// 关闭筛选面板
const closeFilter = () => {
  filterPopup.value?.close()
}

// 重置筛选
const resetFilter = () => {
  filterStatus.value = ['all']
  filterKeyword.value = ''
}

// 应用筛选
const applyFilter = () => {
  closeFilter()
}

// 显示操作菜单
const showActionMenu = (item) => {
  const itemList = item.status === CommunityStatus.ACTIVE
    ? ['查看工作人员', '查看用户', '修改', '停用']
    : ['查看工作人员', '查看用户', '修改', '启用', '删除']

  uni.showActionSheet({
    itemList,
    success: (res) => {
      const index = res.tapIndex
      
      // 前两个选项始终是查看工作人员和用户
      if (index === 0) {
        viewStaff(item)
        return
      }
      if (index === 1) {
        viewUsers(item)
        return
      }
      
      // 后续选项根据状态不同而不同
      if (item.status === CommunityStatus.ACTIVE) {
        switch (index) {
          case 2: // 修改
            editCommunity(item)
            break
          case 3: // 停用
            toggleCommunityStatus(item, CommunityStatus.INACTIVE)
            break
        }
      } else {
        switch (index) {
          case 2: // 修改
            editCommunity(item)
            break
          case 3: // 启用
            toggleCommunityStatus(item, CommunityStatus.ACTIVE)
            break
          case 4: // 删除
            deleteCommunity(item)
            break
        }
      }
    }
  })
}

// 查看社区的工作人员
const viewStaff = (community) => {
  uni.navigateTo({
    url: `/pages/community-staff-manage/community-staff-manage?communityId=${community.id}&communityName=${encodeURIComponent(community.name)}`
  })
}

// 查看社区的用户
const viewUsers = (community) => {
  uni.navigateTo({
    url: `/pages/community-user-manage/community-user-manage?communityId=${community.id}&communityName=${encodeURIComponent(community.name)}`
  })
}

// 查看社区详情
const viewCommunityDetail = (community) => {
  // 检查用户权限
  if (!hasCommunityAccess(community.id)) {
    uni.showToast({
      title: '无权限查看该社区详情',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/community-details-new/community-details-new?communityId=${community.id}&communityName=${encodeURIComponent(community.name)}`
  })
}

// 检查用户对社区的访问权限
const hasCommunityAccess = (communityId) => {
  const userRole = userStore.role
  const userInfo = userStore.userInfo || {}
  
  // 超级管理员可以查看所有社区
  if (userRole === 4 || userRole === '超级系统管理员') return true
  
  // 社区工作人员可以查看社区
  // 注意：这里简化了逻辑，实际应该从API获取用户管理的社区列表
  // 或者检查用户是否是该社区的工作人员
  // 由于权限检查主要在后端进行，这里先返回true，让后端进行最终验证
  if (userRole === 3 || userRole === '社区主管' || userRole === '社区专员') {
    return true
  }
  
  return false
}

// 处理滑动操作
const handleSwipeClick = (e, item) => {
  showActionMenu(item)
}

// 创建社区
const createCommunity = () => {
  uni.navigateTo({
    url: '/pages/community-form/community-form'
  })
}

// 编辑社区
const editCommunity = (item) => {
  uni.navigateTo({
    url: `/pages/community-form/community-form?id=${item.id}`
  })
}

// 切换社区状态
const toggleCommunityStatus = (item, newStatus) => {
  const confirmMsg = newStatus === CommunityStatus.ACTIVE
    ? CONFIRM_MESSAGES.TOGGLE_ACTIVE
    : CONFIRM_MESSAGES.TOGGLE_INACTIVE

  uni.showModal({
    title: '确认操作',
    content: confirmMsg,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: LOADING_MESSAGES.PROCESSING })

          await communityStore.toggleCommunityStatus(item.id, newStatus)

          uni.hideLoading()
          uni.showToast({
            title: SUCCESS_MESSAGES.TOGGLE_SUCCESS,
            icon: 'success'
          })
        } catch (error) {
          console.error('切换状态失败:', error)
          uni.hideLoading()
          uni.showToast({
            title: ERROR_MESSAGES.UPDATE_FAILED,
            icon: 'none'
          })
        }
      }
    }
  })
}

// 删除社区
const deleteCommunity = (item) => {
  if (item.status !== CommunityStatus.INACTIVE) {
    uni.showToast({
      title: ERROR_MESSAGES.MUST_INACTIVE_FIRST,
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '删除社区',
    content: CONFIRM_MESSAGES.DELETE_COMMUNITY,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: LOADING_MESSAGES.DELETING })

          await communityStore.deleteCommunity(item.id)

          uni.hideLoading()
          uni.showToast({
            title: SUCCESS_MESSAGES.DELETE_SUCCESS,
            icon: 'success'
          })
        } catch (error) {
          console.error('删除社区失败:', error)
          uni.hideLoading()
          uni.showToast({
            title: ERROR_MESSAGES.DELETE_FAILED,
            icon: 'none'
          })
        }
      }
    }
  })
}

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await loadCommunities(true)
    uni.stopPullDownRefresh()
    uni.showToast({
      title: SUCCESS_MESSAGES.REFRESH_SUCCESS,
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    uni.stopPullDownRefresh()
  }
})

// 上拉加载更多
onReachBottom(async () => {
  if (!communityStore.hasMore || loading.value) return
  await loadCommunities(false)
})

onMounted(() => {
  loadCommunities(true)
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-manage-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 80rpx;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: $uni-bg-color-white;
  box-shadow: $uni-shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
}

.icon-more,
.icon-filter {
  font-size: $uni-font-size-xxl;
  color: $uni-base-color;
  padding: 8rpx;
}

.community-list {
  padding: 24rpx 0;
}

.community-item {
  @include card-default;
  margin: 0 32rpx 24rpx;
  padding: 32rpx;
  display: block;
}

.community-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.community-name {
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
  flex: 1;
  @include text-ellipsis;
}

.status-tag-active {
  background: $uni-success-light;
  color: $uni-success;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.status-tag-inactive {
  background: $uni-bg-color-grey;
  color: $uni-secondary-color;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.community-location {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.location-icon {
  font-size: 28rpx;
}

.location-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  flex: 1;
  @include text-ellipsis;
}

.community-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.meta-text {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
}

.meta-divider {
  color: $uni-border-base;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
}

.loading-more {
  padding: 32rpx;
}

.floating-add-btn {
  @include floating-button;
  position: fixed;
  bottom: 120rpx;
  right: 32rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: $uni-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.add-icon {
  font-size: 56rpx;
  color: $uni-white;
  font-weight: bold;
}

/* 筛选面板样式 */
.filter-panel {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg $uni-radius-lg 0 0;
  padding: 48rpx 32rpx;
  max-height: 80vh;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.filter-title {
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
}

.filter-close {
  font-size: $uni-font-size-xxl;
  color: $uni-base-color;
  padding: 8rpx;
}

.filter-section {
  margin-bottom: 32rpx;
}

.filter-label {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  margin-bottom: 16rpx;
}

.filter-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
}

.reset-btn {
  flex: 1;
  height: 80rpx;
  background: $uni-bg-color-grey;
  color: $uni-main-color;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;
  border: none;
}

.confirm-btn {
  flex: 1;
  height: 80rpx;
  @include btn-primary;
}
</style>
