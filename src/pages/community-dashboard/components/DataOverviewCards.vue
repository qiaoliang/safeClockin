<template>
  <view class="data-overview-cards">
    <view class="section-header">
      <text class="section-title">数据概览</text>
    </view>

    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" :content-text="{ contentdown: '', contentrefresh: '加载中...', contentnomore: '' }" />
    </view>

    <view v-else class="overview-cards">
      <view class="overview-card total-count">
        <text class="card-title">用户总数</text>
        <text class="card-number">{{ totalUsers }}</text>
        <text class="card-desc">人</text>
      </view>

      <view class="overview-card checkin-rate">
        <text class="card-title">今日打卡率</text>
        <text class="card-number">{{ checkinRate }}%</text>
        <text class="card-desc">平均完成率</text>
      </view>

      <view class="overview-card unchecked-count">
        <text class="card-title">未打卡人数</text>
        <text class="card-number">{{ uncheckedCount }}</text>
        <text class="card-desc">人</text>
      </view>
    </view>
  </view>
</template>

<script setup>
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
</script>

<style lang="scss" scoped>
.data-overview-cards {
  margin: 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
}

.section-header {
  margin-bottom: 30rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
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
  font-size: 24rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.card-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.card-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}
</style>
