<template>
  <view class="data-overview-cards">
    <view class="section-header">
      <text class="section-title">
        数据概览
      </text>
      <text
        class="help-icon"
        @click="toggleHelp"
      >
        ❓
      </text>
    </view>

    <!-- 帮助提示框 -->
    <view
      v-if="showHelp"
      class="help-box"
    >
      <view class="help-item">
        <text class="help-item-title">
          用户总数
        </text>
        <text class="help-item-desc">
          社区中所有状态为"正常"的用户数量
        </text>
      </view>
      <view class="help-item">
        <text class="help-item-title">
          今日打卡率
        </text>
        <text class="help-item-desc">
          (实际打卡次数 ÷ 应打卡次数) × 100%，其中应打卡次数 = 用户总数 × 社区规则数量
        </text>
      </view>
      <view class="help-item">
        <text class="help-item-title">
          未打卡人数
        </text>
        <text class="help-item-desc">
          至少有一个规则今日未完成打卡的用户数量
        </text>
      </view>
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
      v-else
      class="overview-cards"
    >
      <view class="overview-card total-count">
        <text class="card-title">
          用户总数
        </text>
        <text class="card-number">
          {{ totalUsers }}
        </text>
        <text class="card-desc">
          人
        </text>
      </view>

      <view class="overview-card checkin-rate">
        <text class="card-title">
          今日打卡率
        </text>
        <text class="card-number">
          {{ checkinRate }}%
        </text>
        <text class="card-desc">
          平均完成率
        </text>
      </view>

      <view class="overview-card unchecked-count">
        <text class="card-title">
          未打卡人数
        </text>
        <text class="card-number">
          {{ uncheckedCount }}
        </text>
        <text class="card-desc">
          人
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  checkinRate: {
    type: Number,
    default: 0
  },
  uncheckedCount: {
    type: Number,
    default: 0
  },
  totalRules: {
    type: Number,
    default: 0
  }
})

// 帮助框显示状态
const showHelp = ref(false)

// 切换帮助框显示/隐藏
const toggleHelp = () => {
  showHelp.value = !showHelp.value
}
</script>

<style lang="scss" scoped>
.data-overview-cards {
  margin: 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 30rpx;

  .section-title {
    font-size: $uni-font-size-base;
    font-weight: bold;
    color: #333;
  }

  .help-icon {
    font-size: $uni-font-size-base;
    color: #999;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.9);
    }
  }
}

.help-box {
  margin-bottom: 30rpx;
  padding: 24rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  border-left: 4rpx solid #667eea;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.help-item-title {
  font-size: $uni-font-size-sm;
  font-weight: 600;
  color: #333;
}

.help-item-desc {
  font-size: $uni-font-size-md;
  color: #666;
  line-height: 1.6;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 50rpx 0;
}

.overview-cards {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.overview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &.total-count {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.checkin-rate {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.unchecked-count {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
}

.card-title {
  font-size: $uni-font-size-xs;
  color: #fff;
  margin-bottom: 20rpx;
}

.card-number {
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.card-desc {
  font-size: $uni-font-size-xs;
  color: rgba(255, 255, 255, 0.8);
}
</style>
