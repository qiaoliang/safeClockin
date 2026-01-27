<template>
  <view class="supervised-rule-item">
    <view class="user-section">
      <image
        :src="user.avatar_url || '/static/logo.png'"
        class="user-avatar"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="user-name">
          {{ user.nickname }}
        </text>
        <text class="rules-count">
          {{ user.rules.length }} 条规则
        </text>
      </view>
      <view
        v-if="user.rules.length > 1"
        class="expand-btn"
        @click="toggleExpand"
      >
        <text class="expand-text">
          {{ isExpanded ? '收起' : '更多' }}
        </text>
        <text class="expand-icon">
          {{ isExpanded ? '▲' : '▼' }}
        </text>
      </view>
    </view>

    <view
      v-if="isExpanded || user.rules.length === 1"
      class="rules-list"
    >
      <view
        v-for="rule in (isExpanded ? user.rules : [user.rules[0]])"
        :key="rule.rule_id"
        class="rule-item"
      >
        <text class="rule-icon">
          {{ rule.rule_icon }}
        </text>
        <text class="rule-name">
          {{ rule.rule_name }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.supervised-rule-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: $uni-spacing-base;
  margin-bottom: $uni-spacing-sm;
  border: 1rpx solid $uni-border-1;
}

.user-section {
  display: flex;
  align-items: center;
  margin-bottom: $uni-spacing-sm;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: $uni-spacing-base;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.rules-count {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: $uni-spacing-sm $uni-spacing-base;
  background-color: $uni-bg-color-grey;
  border-radius: 8rpx;
}

.expand-text {
  font-size: $uni-font-size-sm;
  color: $uni-primary;
}

.expand-icon {
  font-size: $uni-font-size-xs;
  color: $uni-primary;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-sm;
  padding-left: 100rpx;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: $uni-spacing-sm;
  padding: $uni-spacing-sm;
  background-color: $uni-bg-color-grey;
  border-radius: 8rpx;
}

.rule-icon {
  font-size: 32rpx;
}

.rule-name {
  font-size: $uni-font-size-sm;
  color: $uni-tabbar-color;
}
</style>