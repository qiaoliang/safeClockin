<template>
  <view class="staff-manage-container">
    <!-- 顶部标题栏 -->
    <view class="header-bar">
      <text class="header-title">工作人员管理</text>
      <view class="header-right" @click="showSortMenu">
        <text class="icon-sort">排序</text>
      </view>
    </view>

    <!-- 社区切换栏 -->
    <scroll-view
      class="community-tabs"
      scroll-x
      :scroll-into-view="'tab-' + currentCommunityId"
    >
      <view
        v-for="community in communities"
        :key="community.id"
        :id="'tab-' + community.id"
        :class="['community-tab-item', { active: currentCommunityId === community.id }]"
        @click="switchCommunity(community.id)"
      >
        {{ community.name }}
      </view>
    </scroll-view>

    <!-- 工作人员列表 -->
    <view class="staff-list">
      <view
        v-for="item in displayStaffMembers"
        :key="item.user_id"
        :id="'staff-' + item.user_id"
        class="staff-item"
        @click="viewStaffDetail(item)"
        @longpress="showDeleteConfirm(item)"
      >
        <image
          :src="item.avatar_url || DEFAULT_AVATAR"
          class="staff-avatar"
          mode="aspectFill"
        />

        <view class="staff-info">
          <view class="staff-name-row">
            <text class="staff-name">{{ item.nickname }}</text>
            <view
              :class="['role-tag', item.role === 'manager' ? 'role-tag-manager' : 'role-tag-staff']"
            >
              {{ item.role === 'manager' ? '主管' : '专员' }}
            </view>
          </view>

          <text class="staff-contact">
            📱 {{ formatPhone(item.phone_number) }}
          </text>

          <text class="staff-date">
            📅 {{ formatDate(item.added_time) }}
          </text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="displayStaffMembers.length === 0 && !loading" class="empty-state">
        <text class="empty-text">{{ EMPTY_MESSAGES.NO_STAFF }}</text>
      </view>
    </view>

    <!-- 底部悬浮按钮 -->
    <view class="floating-add-btn" @click="addStaff">
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { formatPhone, formatDate } from '@/utils/community'
import {
  DEFAULT_AVATAR,
  SortType,
  EMPTY_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'

const communityStore = useCommunityStore()

// 当前社区ID
const currentCommunityId = ref('')

// 排序方式
const sortBy = ref(SortType.TIME)

// 加载状态
const loading = ref(false)

// 社区列表
const communities = computed(() => communityStore.activeCommunities)

// 显示的工作人员列表（经过排序）
const displayStaffMembers = computed(() => {
  let list = [...communityStore.staffMembers]

  // 排序
  switch (sortBy.value) {
    case SortType.NAME:
      list.sort((a, b) => a.nickname.localeCompare(b.nickname, 'zh-CN'))
      break
    case SortType.ROLE:
      list.sort((a, b) => {
        if (a.role === 'manager') return -1
        if (b.role === 'manager') return 1
        return 0
      })
      break
    case SortType.TIME:
    default:
      list.sort((a, b) => new Date(b.added_time) - new Date(a.added_time))
      break
  }

  return list
})

// 切换社区
const switchCommunity = async (communityId) => {
  if (currentCommunityId.value === communityId) return

  currentCommunityId.value = communityId
  await loadStaffMembers()
}

// 显示排序菜单
const showSortMenu = () => {
  uni.showActionSheet({
    itemList: ['按时间排序', '按姓名排序', '按角色排序'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          sortBy.value = SortType.TIME
          break
        case 1:
          sortBy.value = SortType.NAME
          break
        case 2:
          sortBy.value = SortType.ROLE
          break
      }
    }
  })
}

// 加载工作人员列表
const loadStaffMembers = async () => {
  if (!currentCommunityId.value || loading.value) return

  try {
    loading.value = true
    await communityStore.loadStaffMembers(currentCommunityId.value, {
      sortBy: sortBy.value
    })
  } catch (error) {
    console.error('加载工作人员列表失败:', error)
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 查看工作人员详情
const viewStaffDetail = (item) => {
  uni.navigateTo({
    url: `/pages/staff-detail/staff-detail?userId=${item.user_id}&communityId=${currentCommunityId.value}`
  })
}

// 显示删除确认
const showDeleteConfirm = (staff) => {
  uni.showModal({
    title: '移除工作人员',
    content: `确定要移除"${staff.nickname}"吗？`,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        await removeStaff(staff)
      }
    }
  })
}

// 移除工作人员
const removeStaff = async (staff) => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.REMOVING })

    await communityStore.removeStaffMember(currentCommunityId.value, staff.user_id)

    // 添加渐隐动画
    const staffElement = document.querySelector(`#staff-${staff.user_id}`)
    if (staffElement) {
      staffElement.classList.add('fade-out')
    }

    setTimeout(() => {
      uni.hideLoading()
      uni.showToast({
        title: SUCCESS_MESSAGES.REMOVE_SUCCESS,
        icon: 'success'
      })
    }, 300)
  } catch (error) {
    console.error('移除工作人员失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.REMOVE_FAILED,
      icon: 'none'
    })
  }
}

// 添加工作人员
const addStaff = () => {
  uni.navigateTo({
    url: `/pages/staff-add/staff-add?communityId=${currentCommunityId.value}`
  })
}

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await loadStaffMembers()
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

onMounted(async () => {
  // 加载社区列表
  if (communityStore.communities.length === 0) {
    await communityStore.loadCommunities(true)
  }

  // 设置默认社区
  if (communities.value.length > 0) {
    currentCommunityId.value = communities.value[0].id
    await loadStaffMembers()
  }
})

// 监听工作人员添加事件
uni.$on('staffAdded', () => {
  loadStaffMembers()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.staff-manage-container {
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
}

.header-title {
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
}

.header-right {
  padding: 8rpx 16rpx;
}

.icon-sort {
  font-size: $uni-font-size-base;
  color: $uni-primary;
}

.community-tabs {
  background: $uni-bg-color-white;
  padding: 24rpx 32rpx;
  box-shadow: $uni-shadow-sm;
  white-space: nowrap;
}

.community-tab-item {
  display: inline-block;
  padding: 16rpx 32rpx;
  margin-right: 24rpx;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  position: relative;
  transition: all 0.3s ease;

  &.active {
    color: $uni-primary;
    font-weight: $uni-font-weight-base;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 4rpx;
      background: $uni-primary;
      border-radius: $uni-radius-xs;
    }
  }
}

.staff-list {
  padding: 32rpx;
}

.staff-item {
  @include card-default;
  margin-bottom: 24rpx;
  padding: 32rpx;
  flex-direction: row;
  align-items: center;
  transition: opacity 0.3s ease;
}

.staff-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: $uni-radius-full;
  margin-right: 24rpx;
  background: $uni-bg-color-grey;
}

.staff-info {
  flex: 1;
}

.staff-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.staff-name {
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
}

.role-tag-manager {
  display: inline-block;
  background: $uni-info-light;
  color: $uni-info;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
  margin-left: 12rpx;
}

.role-tag-staff {
  display: inline-block;
  background: $uni-primary-light;
  color: $uni-primary;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
  margin-left: 12rpx;
}

.staff-contact,
.staff-date {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  margin-top: 8rpx;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
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

.fade-out {
  animation: fadeOut 0.3s ease-out forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}
</style>
