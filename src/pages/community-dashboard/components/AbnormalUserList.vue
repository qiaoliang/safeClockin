<template>
  <view class="abnormal-user-list">
    <view class="section-header">
      <text class="section-title">
        异常用户清单
      </text>
      <text
        v-if="total > 0"
        class="section-subtitle"
      >
        共{{ total }}人
      </text>
    </view>

    <view
      v-if="loading"
      class="loading-container"
    >
      <uni-load-more
        status="loading"
        :content-text="{ contentdown: '', contentrefresh: '加载中...', contentnomore: '' }"
      />
    </view>

    <view
      v-else-if="users.length === 0"
      class="empty-state"
    >
      <text class="empty-text">
        暂无异常用户，所有用户都按时打卡
      </text>
    </view>

    <view
      v-else
      class="user-list"
    >
      <view
        v-for="user in users"
        :key="user.user_id"
        class="user-item"
        @click="handleUserClick(user)"
      >
        <image
          class="user-avatar"
          :src="user.avatar_url || '/static/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="user-info">
          <text class="user-name">
            {{ user.nickname }}
          </text>
          <view class="user-tags">
            <text :class="['abnormality-tag', `level-${user.abnormality_level}`]">
              {{ getAbnormalityLabel(user.abnormality_level) }}
            </text>
            <text class="rules-count">
              {{ user.unfinished_rules_count }}个规则未完成
            </text>
          </view>
          <view class="rule-abnormalities">
            <text
              v-for="rule in user.rule_abnormalities"
              :key="rule.rule_name"
              class="rule-item"
            >
              {{ rule.rule_name }}: {{ rule.abnormality }}
            </text>
          </view>
        </view>
        <view class="user-abnormality">
          <text class="abnormality-value">
            {{ user.total_abnormality }}
          </text>
          <text class="abnormality-label">
            异常值
          </text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view
        v-if="hasNext"
        class="load-more"
        @click="handleLoadMore"
      >
        <text class="load-more-text">
          加载更多
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  users: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  hasNext: {
    type: Boolean,
    default: false
  },
  communityId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['loadMore', 'userClick'])

const handleLoadMore = () => {
  emit('loadMore')
}

const handleUserClick = (user) => {
  emit('userClick', user)
}

const getAbnormalityLabel = (level) => {
  const labels = {
    low: '轻度异常',
    medium: '中度异常',
    high: '重度异常'
  }
  return labels[level] || '未知'
}
</script>

<style lang="scss" scoped>
.abnormal-user-list {
  margin: 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;

  .section-title {
    font-size: $uni-font-size-base;
    font-weight: bold;
    color: #333;
  }

  .section-subtitle {
    font-size: $uni-font-size-md;
    color: #999;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 50rpx 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;

  .empty-text {
    font-size: $uni-font-size-sm;
    color: #999;
  }
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 25rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  transition: all 0.3s;

  &:active {
    background-color: #f0f0f0;
    transform: scale(0.98);
  }
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #e5e5e5;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-name {
  font-size: $uni-font-size-md;
  font-weight: bold;
  color: #333;
}

.user-tags {
  display: flex;
  gap: 15rpx;
}

.abnormality-tag {
  padding: 5rpx 15rpx;
  border-radius: 20rpx;
  font-size: $uni-font-size-xs;
  font-weight: bold;

  &.level-low {
    background-color: #e8f5e9;
    color: #43e97b;
  }

  &.level-medium {
    background-color: #fff3e0;
    color: #f093fb;
  }

  &.level-high {
    background-color: #ffebee;
    color: #f5576c;
  }
}

.rules-count {
  padding: 5rpx 15rpx;
  background-color: #e3f2fd;
  color: #4facfe;
  border-radius: 20rpx;
  font-size: $uni-font-size-xs;
}

.rule-abnormalities {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.rule-item {
  padding: 5rpx 10rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: $uni-font-size-xs;
  color: #666;
}

.user-abnormality {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 20rpx;
}

.abnormality-value {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: #f5576c;
}

.abnormality-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 5rpx;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx;
  margin-top: 20rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;

  &:active {
    background-color: #f0f0f0;
  }
}

.load-more-text {
  font-size: $uni-font-size-sm;
  color: #667eea;
}
</style>
