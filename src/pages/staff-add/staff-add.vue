<template>
  <view class="staff-add-container">
    <!-- 搜索栏 -->
    <view class="search-section">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="输入手机号或昵称搜索"
        @confirm="handleSearch"
        @input="handleSearchInput"
      />
    </view>

    <!-- 角色选择 -->
    <view class="role-selector">
      <text class="selector-label">
        添加为：
      </text>
      <uni-data-checkbox
        v-model="selectedRole"
        :localdata="roleOptions"
        mode="button"
      />
    </view>

    <!-- 搜索结果列表 -->
    <view class="search-results">
      <view
        v-for="user in searchResults"
        :key="user.user_id"
        :class="['user-item', {
          selected: isSelected(user.user_id),
          disabled: user.is_staff
        }]"
        @click="toggleSelect(user)"
      >
        <image
          :src="user.avatar_url || DEFAULT_AVATAR"
          class="user-avatar"
          mode="aspectFill"
        />

        <view class="user-info">
          <text class="user-name">
            {{ user.nickname }}
          </text>
          <text class="user-phone">
            {{ user.phone_number }}
          </text>
        </view>

        <view
          v-if="user.is_staff"
          class="already-staff-tag"
        >
          已是工作人员
        </view>

        <uni-icons
          v-else-if="isSelected(user.user_id)"
          type="checkbox-filled"
          color="#F48224"
          size="24"
        />
      </view>

      <!-- 空状态 -->
      <view
        v-if="searchResults.length === 0 && searchKeyword"
        class="empty-state"
      >
        <text class="empty-text">
          未找到用户
        </text>
        <button
          class="invite-btn"
          @click="inviteRegister"
        >
          邀请注册
        </button>
      </view>

      <!-- 未搜索提示 -->
      <view
        v-if="!searchKeyword && searchResults.length === 0"
        class="search-tip"
      >
        <text class="tip-text">
          请输入手机号或昵称搜索用户
        </text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button
        class="confirm-btn"
        :disabled="selectedUsers.length === 0"
        @click="confirmAdd"
      >
        确认添加 ({{ selectedUsers.length }})
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { debounce } from '@/utils/community'
import {
  DEFAULT_AVATAR,
  StaffRole,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

const communityStore = useCommunityStore()

// 搜索关键词
const searchKeyword = ref('')

// 搜索结果
const searchResults = ref([])

// 选中的用户
const selectedUsers = ref([])

// 选中的角色
const selectedRole = ref([StaffRole.STAFF])

// 当前社区ID
const currentCommunityId = ref('')

// 模式：add（添加）或 select（选择）
const mode = ref('add')

// 角色选项
const roleOptions = [
  { text: '专员', value: StaffRole.STAFF },
  { text: '主管', value: StaffRole.MANAGER }
]

// 判断是否选中
const isSelected = (userId) => {
  return selectedUsers.value.some(u => u.user_id === userId)
}

// 切换选中状态
const toggleSelect = (user) => {
  if (user.is_staff) {
    uni.showToast({
      title: ERROR_MESSAGES.STAFF_EXISTS,
      icon: 'none'
    })
    return
  }

  const index = selectedUsers.value.findIndex(u => u.user_id === user.user_id)

  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    // 如果是主管，只能选择一个
    if (selectedRole.value[0] === StaffRole.MANAGER) {
      selectedUsers.value = [user]
    } else {
      selectedUsers.value.push(user)
    }
  }
}

// 搜索处理（防抖）
const handleSearchInput = debounce(async () => {
  await handleSearch()
}, 500)

// 执行搜索
const handleSearch = async () => {
  if (!searchKeyword.value) {
    searchResults.value = []
    return
  }

  try {
    uni.showLoading({ title: LOADING_MESSAGES.SEARCHING })

    const response = await communityStore.searchUsers(
      searchKeyword.value,
      currentCommunityId.value
    )

    uni.hideLoading()

    if (response.code === 1) {
      searchResults.value = response.data.users || []
    } else {
      uni.showToast({
        title: ERROR_MESSAGES.SEARCH_FAILED,
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.SEARCH_FAILED,
      icon: 'none'
    })
  }
}

// 确认添加
const confirmAdd = async () => {
  if (selectedUsers.value.length === 0) {
    return
  }

  // 主管只能选择一个
  if (selectedRole.value[0] === StaffRole.MANAGER && selectedUsers.value.length > 1) {
    uni.showToast({
      title: ERROR_MESSAGES.MANAGER_LIMIT,
      icon: 'none'
    })
    return
  }

  if (mode.value === 'select') {
    // 选择模式：返回选中的用户
    const selectedUser = selectedUsers.value[0]
    uni.$emit('managerSelected', selectedUser)
    uni.navigateBack()
    return
  }

  try {
    uni.showLoading({ title: LOADING_MESSAGES.ADDING })

    await communityStore.addStaffMembers(
      currentCommunityId.value,
      selectedUsers.value.map(u => u.user_id),
      selectedRole.value[0]
    )

    uni.hideLoading()
    uni.showToast({
      title: SUCCESS_MESSAGES.ADD_SUCCESS,
      icon: 'success'
    })

    // 触发工作人员添加事件
    uni.$emit('staffAdded')

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('添加工作人员失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.msg || ERROR_MESSAGES.ADD_FAILED,
      icon: 'none'
    })
  }
}

// 邀请注册
const inviteRegister = () => {
  uni.showToast({
    title: '邀请注册功能开发中',
    icon: 'none'
  })
}

onLoad((options) => {
  // 页面权限检查
  if (!checkPagePermission(PagePath.STAFF_ADD)) {
    return
  }
  console.log('[添加工作人员] 权限检查通过')
  
  if (options.communityId) {
    currentCommunityId.value = options.communityId
  }

  if (options.mode) {
    mode.value = options.mode
  }

  if (options.role) {
    selectedRole.value = [options.role]
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.staff-add-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 160rpx;
}

.search-section {
  background: $uni-bg-color-white;
  padding: 24rpx 32rpx;
  box-shadow: $uni-shadow-sm;
}

.role-selector {
  background: $uni-bg-color-white;
  padding: 24rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.selector-label {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.search-results {
  padding: 32rpx;
}

.user-item {
  @include card-default;
  margin-bottom: 24rpx;
  padding: 32rpx;
  flex-direction: row;
  align-items: center;
  transition: all 0.3s ease;

  &.selected {
    border: 2rpx solid $uni-primary;
    background: rgba(244, 130, 36, 0.05);
  }

  &.disabled {
    opacity: 0.5;
  }
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: $uni-radius-full;
  margin-right: 24rpx;
  background: $uni-bg-color-grey;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
  margin-bottom: 8rpx;
}

.user-phone {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.already-staff-tag {
  padding: 4rpx 12rpx;
  background: $uni-bg-color-grey;
  color: $uni-secondary-color;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-lg;
  color: $uni-base-color;
  margin-bottom: 32rpx;
}

.invite-btn {
  padding: 16rpx 48rpx;
  background: $uni-primary-light;
  color: $uni-primary;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  border: none;
}

.search-tip {
  text-align: center;
  padding: 120rpx 40rpx;
}

.tip-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: $uni-bg-color-white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  @include safe-area-bottom;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  @include btn-primary;
  border: none;

  &:disabled {
    background: $uni-bg-color-grey;
    color: $uni-secondary-color;
    box-shadow: none;
  }
}
</style>
