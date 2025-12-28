<template>
  <view class="user-info-card">
    <!-- 用户头像和基本信息 -->
    <view class="user-header">
      <view
        class="user-avatar"
        @click="handleEditProfile"
      >
        <image
          :src="userInfo?.avatarUrl || '/static/logo.png'"
          class="avatar-image"
          mode="aspectFill"
        />
        <view class="edit-btn">
          <text class="edit-icon">
            ✏️
          </text>
        </view>
      </view>
      <view class="user-details">
        <text class="user-name">
          {{ displayName }}
        </text>
        <text
          class="user-role"
          :style="{ background: roleColor }"
        >
          {{ roleText }}
        </text>
      </view>
    </view>

    <!-- 详细信息列表 -->
    <view class="info-list">
      <!-- 第一行：姓名和社区 -->
      <view class="info-row">
        <!-- 真实姓名 -->
        <view class="info-item">
          <text class="info-icon">
            👤
          </text>
          <text class="info-label">
            姓名
          </text>
          <text
            class="info-value"
            :class="{ 'empty-value': !userInfo?.name }"
          >
            {{ displayTruncatedName }}
          </text>
        </view>

        <!-- 所在社区 -->
        <view class="info-item">
          <text class="info-icon">
            🏠
          </text>
          <text class="info-label">
            社区
          </text>
          <text
            class="info-value"
            :class="{ 'empty-value': !userInfo?.community_name }"
          >
            {{ userInfo?.community_name || '未加入社区' }}
          </text>
        </view>
      </view>

      <!-- 第二行：电话和地址 -->
      <view class="info-row">
        <!-- 电话号码 -->
        <view
          class="info-item"
          @click="handleCopyPhone"
        >
          <text class="info-icon">
            📞
          </text>
          <text class="info-label">
            电话
          </text>
          <text
            class="info-value"
            :class="{ 'empty-value': !userInfo?.phone_number }"
          >
            {{ displayPhone }}
          </text>
          <text
            v-if="userInfo?.phone_number"
            class="copy-hint"
          >
            点击复制
          </text>
        </view>

        <!-- 个人地址 -->
        <view
          class="info-item address-item"
          @click="handleToggleAddress"
        >
          <text class="info-icon">
            📍
          </text>
          <text class="info-label">
            地址
          </text>
          <text
            class="info-value"
            :class="{ 'address-collapsed': !addressExpanded, 'empty-value': !userInfo?.address }"
          >
            {{ userInfo?.address || '未设置地址' }}
          </text>
          <text
            v-if="shouldShowExpandHint"
            class="expand-hint"
          >
            {{ addressExpanded ? '收起' : '展开' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['edit-profile'])

const addressExpanded = ref(false)

// 计算属性：用户显示名称
const displayName = computed(() => {
  const user = props.userInfo
  if (!user) return '未登录用户'
  return user.nickName || user.nickname || user.userName || user.name || '用户'
})

// 计算属性：显示的姓名（截断到6个字符）
const displayTruncatedName = computed(() => {
  const name = props.userInfo?.name || '未设置姓名'
  if (name.length > 6) {
    return name.slice(0, 6) + '...'
  }
  return name
})

// 计算属性：用户角色文本
const roleText = computed(() => {
  const role = props.userInfo?.role
  const roleMap = {
    0: '普通用户',
    1: '监护人',
    2: '社区工作人员',
    3: '社区主管'
  }
  return roleMap[role] || '用户'
})

// 计算属性：角色标签颜色
const roleColor = computed(() => {
  const role = props.userInfo?.role
  const colorMap = {
    0: 'rgba(244, 130, 36, 0.1)',
    1: 'rgba(76, 175, 80, 0.1)',
    2: 'rgba(33, 150, 243, 0.1)',
    3: 'rgba(156, 39, 176, 0.1)'
  }
  return colorMap[role] || 'rgba(244, 130, 36, 0.1)'
})

// 计算属性：显示的电话号码（带掩码）
const displayPhone = computed(() => {
  const phone = props.userInfo?.phone_number
  console.log('[UserInfoCard] displayPhone - phone_number:', phone, 'userInfo:', props.userInfo)
  if (!phone) return '未绑定手机'
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
  return phone
})

// 计算属性：是否显示展开/收起提示
const shouldShowExpandHint = computed(() => {
  const address = props.userInfo?.address
  return address && address.length > 30
})

// 处理编辑个人信息
const handleEditProfile = () => {
  emit('edit-profile')
}

// 处理复制电话号码
const handleCopyPhone = () => {
  const phone = props.userInfo?.phone_number
  if (!phone) return
  
  uni.setClipboardData({
    data: phone,
    success: () => {
      uni.showToast({
        title: '电话号码已复制',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

// 处理切换地址展开状态
const handleToggleAddress = () => {
  if (!props.userInfo?.address) return
  addressExpanded.value = !addressExpanded.value
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.user-info-card {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: 24rpx;
  margin-bottom: $uni-font-size-base;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.user-avatar {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  margin-right: 20rpx;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid $uni-primary;
}

.edit-btn {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 40rpx;
  height: 40rpx;
  background: $uni-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.edit-icon {
  font-size: 20rpx;
  color: $uni-white;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.user-role {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: $uni-primary;
  background: rgba(244, 130, 36, 0.1);
  width: fit-content;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  gap: 0;
}

.info-row:not(:last-child) {
  margin-bottom: 12rpx;
  padding-bottom: 12rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 0;
  min-height: 64rpx;
  flex: 1;
}

.info-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  width: 40rpx;
  text-align: center;
  flex-shrink: 0;
}

.info-label {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
  min-width: 80rpx;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: $uni-font-size-sm;
  color: $uni-tabbar-color;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-collapsed {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300rpx;
}

.copy-hint,
.expand-hint {
  color: $uni-primary;
  font-size: $uni-font-size-sm;
  margin-left: 12rpx;
}

.address-item:active {
  opacity: 0.7;
}

.empty-value {
  color: $uni-text-light;
}
</style>