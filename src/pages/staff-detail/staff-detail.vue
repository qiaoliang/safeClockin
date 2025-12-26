<template>
  <view class="staff-detail-container">
    <!-- 工作人员头部 -->
    <view class="staff-header">
      <image
        :src="staffInfo.avatar_url || DEFAULT_AVATAR"
        class="staff-avatar-large"
        mode="aspectFill"
      />
      <text class="staff-name-large">
        {{ staffInfo.nickname }}
      </text>
      <view
        :class="['role-tag-large', staffInfo.role === 'manager' ? 'role-tag-manager' : 'role-tag-staff']"
      >
        {{ staffInfo.role === 'manager' ? '社区主管' : '社区专员' }}
      </view>
    </view>

    <!-- 基本信息 -->
    <uni-section title="基本信息">
      <uni-list>
        <uni-list-item
          title="联系电话"
          :right-text="staffInfo.phone_number"
        />
        <uni-list-item
          title="添加时间"
          :right-text="formatDate(staffInfo.added_time)"
        />
      </uni-list>
    </uni-section>

    <!-- 所属社区 -->
    <uni-section title="所属社区">
      <uni-list>
        <uni-list-item
          v-for="community in staffInfo.communities"
          :key="community.id"
          :title="community.name"
          :note="community.location || '未知地址'"
          show-arrow
          @click="viewCommunity(community)"
        />
      </uni-list>
    </uni-section>

    <!-- 负责范围（仅专员显示） -->
    <uni-section
      v-if="staffInfo.role === 'staff'"
      title="负责范围"
    >
      <view class="scope-content">
        <text class="scope-text">
          {{ staffInfo.scope || '暂无' }}
        </text>
      </view>
    </uni-section>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { formatDate } from '@/utils/community'
import {
  DEFAULT_AVATAR,
  ERROR_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

const communityStore = useCommunityStore()

// 工作人员信息
const staffInfo = ref({
  user_id: '',
  nickname: '',
  avatar_url: '',
  phone_number: '',
  role: 'staff',
  communities: [],
  scope: '',
  added_time: ''
})

// 当前社区ID
const currentCommunityId = ref('')

// 加载工作人员详情
const loadStaffDetail = async (userId) => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.LOADING })

    // 从 store 中查找工作人员
    const staff = communityStore.staffMembers.find(s => s.user_id === userId)

    if (staff) {
      staffInfo.value = { ...staff }

      // 如果没有社区列表，获取用户所属社区
      if (!staff.communities || staff.communities.length === 0) {
        const response = await communityStore.getUserCommunities(userId)
        if (response.code === 1) {
          staffInfo.value.communities = response.data.communities || []
        }
      }
    } else {
      uni.showToast({
        title: ERROR_MESSAGES.USER_NOT_FOUND,
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }

    uni.hideLoading()
  } catch (error) {
    console.error('加载工作人员详情失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  }
}

// 查看社区
const viewCommunity = (community) => {
  // TODO: 跳转到社区详情页
  uni.showToast({
    title: `查看社区：${community.name}`,
    icon: 'none'
  })
}

onLoad((options) => {
  // 页面权限检查
  if (!checkPagePermission(PagePath.STAFF_DETAIL)) {
    return
  }
  
  if (options.userId) {
    currentCommunityId.value = options.communityId || ''
    loadStaffDetail(options.userId)
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.staff-detail-container {
  min-height: 100vh;
  @include bg-gradient;
}

.staff-header {
  background: $uni-bg-color-white;
  padding: 64rpx 32rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.staff-avatar-large {
  width: 160rpx;
  height: 160rpx;
  border-radius: $uni-radius-full;
  margin: 0 auto 24rpx;
  background: $uni-bg-color-grey;
  display: block;
}

.staff-name-large {
  display: block;
  font-size: $uni-font-size-xxl;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.role-tag-large {
  display: inline-block;
  padding: 8rpx 24rpx;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
}

.role-tag-manager {
  background: $uni-info-light;
  color: $uni-info;
}

.role-tag-staff {
  background: $uni-primary-light;
  color: $uni-primary;
}

.scope-content {
  padding: 32rpx;
  background: $uni-bg-color-white;
}

.scope-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  line-height: 1.6;
}
</style>
