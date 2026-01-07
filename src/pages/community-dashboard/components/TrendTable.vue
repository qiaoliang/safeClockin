<template>
  <view class="trend-table">
    <view class="section-header">
      <view class="section-title-group">
        <text class="section-title">历史趋势</text>
        <text class="section-subtitle">近{{ days }}天打卡率趋势</text>
      </view>
      <view class="days-selector">
        <text
          :class="['day-option', days === 7 ? 'active' : '']"
          @click="handleDaysChange(7)"
        >7天</text>
        <text
          :class="['day-option', days === 30 ? 'active' : '']"
          @click="handleDaysChange(30)"
        >30天</text>
      </view>
    </view>

    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" :content-text="{ contentdown: '', contentrefresh: '加载中...', contentnomore: '' }" />
    </view>

    <view v-else class="trend-content">
      <!-- 打卡率趋势表格 -->
      <view class="trend-table-container">
        <view class="table-row table-header">
          <text class="table-cell">日期</text>
          <text class="table-cell">打卡率</text>
        </view>
        <view v-for="(date, index) in dateRange" :key="index" class="table-row">
          <text class="table-cell">{{ formatDate(date) }}</text>
          <text :class="['table-cell', getRateClass(checkinRates[index])]">
            {{ checkinRates[index] }}%
          </text>
        </view>
      </view>

      <!-- 各规则逾期情况 -->
      <view class="rule-missed-section">
        <text class="rule-missed-title">各规则逾期情况</text>
        <view v-if="ruleMissedStats.length === 0" class="empty-tip">
          <text class="empty-text">暂无逾期记录</text>
        </view>
        <view v-else class="rule-missed-list">
          <view
            v-for="(stat, index) in ruleMissedStats"
            :key="stat.rule_id"
            class="rule-missed-item"
          >
            <text class="rule-rank">{{ index + 1 }}.</text>
            <text class="rule-icon">{{ stat.rule_icon }}</text>
            <text class="rule-name">{{ stat.rule_name }}</text>
            <text
              :class="['rule-count', stat.missed_count > 0 ? 'rule-count-error' : 'rule-count-success']"
            >
              {{ stat.missed_count }}人次
            </text>
          </view>
        </view>
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
  dateRange: {
    type: Array,
    default: () => []
  },
  checkinRates: {
    type: Array,
    default: () => []
  },
  ruleMissedStats: {
    type: Array,
    default: () => []
  },
  days: {
    type: Number,
    default: 7
  }
})

const emit = defineEmits(['daysChange'])

const handleDaysChange = (days) => {
  emit('daysChange', days)
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getRateClass = (rate) => {
  if (rate >= 90) return 'rate-excellent'
  if (rate >= 70) return 'rate-good'
  if (rate >= 50) return 'rate-fair'
  return 'rate-poor'
}
</script>

<style lang="scss" scoped>
.trend-table {
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
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-subtitle {
  font-size: 24rpx;
  color: #999;
}

.days-selector {
  display: flex;
  gap: 20rpx;
}

.day-option {
  padding: 10rpx 30rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background-color: #f5f5f5;
  color: #666;

  &.active {
    background-color: #667eea;
    color: #fff;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 50rpx 0;
}

.trend-content {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.trend-table-container {
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  overflow: hidden;
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #e5e5e5;

  &:last-child {
    border-bottom: none;
  }

  &.table-header {
    background-color: #f9f9f9;
  }
}

.table-cell {
  flex: 1;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333;
  text-align: center;
}

.rate-excellent { color: #43e97b; }
.rate-good { color: #4facfe; }
.rate-fair { color: #f093fb; }
.rate-poor { color: #f5576c; }

.rule-missed-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.rule-missed-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.rule-missed-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.rule-missed-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
}

.rule-rank {
  font-size: 24rpx;
  color: #999;
  margin-right: 15rpx;
}

.rule-icon {
  font-size: 36rpx;
  margin-right: 15rpx;
}

.rule-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.rule-count {
  font-size: 26rpx;
  font-weight: bold;

  &.rule-count-error {
    color: #f5576c;
  }

  &.rule-count-success {
    color: #43e97b;
  }
}

.empty-tip {
  display: flex;
  justify-content: center;
  padding: 50rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>
