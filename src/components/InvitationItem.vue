<template>
  <view class="invitation-item">
    <view class="invitation-left">
      <image
        :src="invitation.inviter_info?.avatar_url || '/static/logo.png'"
        class="inviter-avatar"
        mode="aspectFill"
      />
      <view class="invitation-info">
        <text class="inviter-name">{{ invitation.inviter_info?.nickname }}</text>
        <text class="rule-name">{{ invitation.rule_info?.rule_name }}</text>
        <text class="invite-time">{{ formatTime(invitation.created_at) }}</text>
      </view>
    </view>

    <view class="invitation-actions" v-if="showActions">
      <button
        class="action-btn accept-btn"
        @click="$emit('accept', invitation.relation_id)"
      >
        同意
      </button>
      <button
        class="action-btn reject-btn"
        @click="$emit('reject', invitation.relation_id)"
      >
        拒绝
      </button>
    </view>

    <view class="invitation-status" v-else>
      <text class="status-text" :class="statusClass">
        {{ statusText }}
      </text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  invitation: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['accept', 'reject'])

const statusMap = {
  1: { text: '待确认', class: 'pending' },
  2: { text: '已接受', class: 'accepted' },
  3: { text: '已拒绝', class: 'rejected' },
  4: { text: '已过期', class: 'expired' },
  5: { text: '已撤回', class: 'withdrawn' }
}

const statusText = computed(() => {
  return statusMap[props.invitation.status]?.text || '未知'
})

const statusClass = computed(() => {
  return statusMap[props.invitation.status]?.class || ''
})

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return `${Math.floor(diff / 86400000)}天前`
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.invitation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-base;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: $uni-spacing-sm;
  border: 1rpx solid $uni-border-1;
}

.invitation-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.inviter-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: $uni-spacing-base;
}

.invitation-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.inviter-name {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.rule-name {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}

.invite-time {
  font-size: $uni-font-size-xs;
  color: $uni-text-light-grey;
}

.invitation-actions {
  display: flex;
  gap: $uni-spacing-sm;
}

.action-btn {
  padding: $uni-spacing-sm $uni-spacing-base;
  border-radius: 8rpx;
  font-size: $uni-font-size-sm;
  border: none;
}

.accept-btn {
  background-color: $uni-primary;
  color: #fff;
}

.reject-btn {
  background-color: $uni-bg-color-grey;
  color: $uni-text-light;
}

.invitation-status {
  padding: $uni-spacing-sm $uni-spacing-base;
  border-radius: 8rpx;
}

.status-text {
  font-size: $uni-font-size-sm;
}

.pending {
  color: $uni-warning;
}

.accepted {
  color: $uni-success;
}

.rejected {
  color: $uni-error;
}

.expired,
.withdrawn {
  color: $uni-text-light-grey;
}
</style>