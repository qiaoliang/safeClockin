<template>
  <view class="invite-modal-container" v-if="visible">
    <view class="modal-overlay" @click="handleClose">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">邀请监护人</text>
          <view class="close-btn" @click="handleClose">
            <text class="close-icon">×</text>
          </view>
        </view>

        <view class="modal-body">
          <view class="rule-info">
            <text class="rule-label">规则：</text>
            <text class="rule-name">{{ ruleName }}</text>
          </view>

          <view class="search-section">
            <text class="search-label">选择监护人：</text>
            <UserSearch
              @user-select="handleUserSelect"
              :auto-focus="true"
            />
          </view>

          <view class="selected-users" v-if="selectedUsers.length > 0">
            <text class="selected-label">已选择：</text>
            <view class="user-list">
              <view
                v-for="(user, index) in selectedUsers"
                :key="user.user_id"
                class="selected-user-item"
              >
                <image
                  :src="user.avatar_url || '/static/logo.png'"
                  class="user-avatar"
                  mode="aspectFill"
                />
                <text class="user-nickname">{{ user.nickname }}</text>
                <view class="remove-btn" @click="handleRemoveUser(index)">
                  <text class="remove-icon">×</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="modal-footer">
          <button class="cancel-btn" @click="handleClose">取消</button>
          <button
            class="confirm-btn"
            :disabled="selectedUsers.length === 0 || loading"
            @click="handleConfirm"
          >
            {{ loading ? '发送中...' : '确定' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import UserSearch from './UserSearch.vue'
import { authApi } from '@/api/auth'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  ruleId: {
    type: Number,
    required: true
  },
  ruleName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'success'])

const selectedUsers = ref([])
const loading = ref(false)

const handleClose = () => {
  emit('close')
  selectedUsers.value = []
}

const handleUserSelect = (user) => {
  // 检查是否已选择
  const exists = selectedUsers.value.some(u => u.user_id === user.user_id)
  if (!exists) {
    selectedUsers.value.push(user)
  }
}

const handleRemoveUser = (index) => {
  selectedUsers.value.splice(index, 1)
}

const handleConfirm = async () => {
  if (selectedUsers.value.length === 0) {
    uni.showToast({
      title: '请选择监护人',
      icon: 'none'
    })
    return
  }

  loading.value = true

  try {
    const receiverIds = selectedUsers.value.map(u => u.user_id)
    const res = await authApi.inviteSupervisor({
      rule_id: props.ruleId,
      receiver_ids: receiverIds,
      message: `${props.ruleName} - 邀请您成为监护人`
    })

    if (res.code === 1) {
      uni.showToast({
        title: '邀请已发送',
        icon: 'success'
      })
      emit('success', res.data)
      handleClose()
    } else {
      uni.showToast({
        title: res.msg || '发送失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.invite-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-overlay {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-base;
  border-bottom: 1rpx solid $uni-border-1;
}

.modal-title {
  font-size: $uni-font-size-lg;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 48rpx;
  color: $uni-text-light;
  line-height: 1;
}

.modal-body {
  padding: $uni-spacing-base;
  flex: 1;
  overflow-y: auto;
}

.rule-info {
  padding: $uni-spacing-base;
  background-color: $uni-bg-color-grey;
  border-radius: 8rpx;
  margin-bottom: $uni-spacing-base;
}

.rule-label {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
  margin-bottom: 4rpx;
}

.rule-name {
  font-size: $uni-font-size-base;
  color: $uni-tabbar-color;
  font-weight: 500;
}

.search-section {
  margin-bottom: $uni-spacing-base;
}

.search-label {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
  margin-bottom: $uni-spacing-sm;
}

.selected-users {
  margin-top: $uni-spacing-base;
  padding: $uni-spacing-base;
  background-color: $uni-bg-color-grey;
  border-radius: 8rpx;
}

.selected-label {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
  margin-bottom: $uni-spacing-sm;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-sm;
}

.selected-user-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-sm;
  background-color: #fff;
  border-radius: 8rpx;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: $uni-spacing-sm;
}

.user-nickname {
  flex: 1;
  font-size: $uni-font-size-base;
  color: $uni-tabbar-color;
}

.remove-btn {
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $uni-bg-color-grey;
  border-radius: 50%;
}

.remove-icon {
  font-size: 36rpx;
  color: $uni-text-light;
  line-height: 1;
}

.modal-footer {
  display: flex;
  gap: $uni-spacing-base;
  padding: $uni-spacing-base;
  border-top: 1rpx solid $uni-border-1;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: $uni-font-size-base;
  border: none;
}

.cancel-btn {
  background-color: $uni-bg-color-grey;
  color: $uni-text-light;
}

.confirm-btn {
  background-color: $uni-primary;
  color: #fff;
}

.confirm-btn[disabled] {
  opacity: 0.6;
}
</style>