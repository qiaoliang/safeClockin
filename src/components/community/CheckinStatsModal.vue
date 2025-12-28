<template>
  <uni-popup
    ref="popup"
    type="center"
    :safe-area="false"
  >
    <view class="checkin-stats-modal">
      <!-- 标题栏 -->
      <view class="modal-header">
        <text class="modal-title">
          逾期事项详情
        </text>
        <view
          class="close-btn"
          @click="handleClose"
        >
          <text class="close-icon">
            ×
          </text>
        </view>
      </view>

      <!-- 规则列表 -->
      <scroll-view
        class="modal-content"
        scroll-y
      >
        <view
          v-for="(stat, index) in stats"
          :key="stat.rule_id"
          class="stat-item"
        >
          <!-- 规则简要信息 -->
          <view
            class="stat-header"
            @click="toggleExpand(index)"
          >
            <view class="stat-left">
              <text class="stat-icon">
                {{ stat.rule_icon }}
              </text>
              <text class="stat-name">
                {{ stat.rule_name }}
              </text>
            </view>
            <view class="stat-right">
              <text class="stat-total">
                {{ stat.total_missed }}人次
              </text>
              <text class="expand-icon">
                {{ expandedIndex === index ? '▲' : '▼' }}
              </text>
            </view>
          </view>

          <!-- 每日详情（可展开） -->
          <view
            v-if="expandedIndex === index"
            class="stat-details"
          >
            <view
              v-for="(missed, dateIndex) in stat.daily_missed"
              :key="dateIndex"
              class="daily-item"
            >
              <text class="daily-date">
                {{ stat.dates[dateIndex] }}
              </text>
              <text class="daily-count">
                {{ missed }}人次
              </text>
            </view>
          </view>
        </view>

        <!-- 无数据提示 -->
        <view
          v-if="stats.length === 0"
          class="empty-tip"
        >
          <text class="empty-text">
            暂无逾期事项
          </text>
        </view>
      </scroll-view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  stats: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const popup = ref(null)
const expandedIndex = ref(-1)

/**
 * 打开模态框
 */
const open = () => {
  popup.value?.open()
}

/**
 * 关闭模态框
 */
const handleClose = () => {
  popup.value?.close()
  emit('close')
}

/**
 * 切换展开状态
 */
const toggleExpand = (index) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = -1
  } else {
    expandedIndex.value = index
  }
}

// 暴露方法给父组件
defineExpose({
  open,
  close: handleClose,
  toggleExpand
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.checkin-stats-modal {
  width: 600rpx;
  max-height: 80vh;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-xl;
  border-bottom: 2rpx solid $uni-border-light;
}

.modal-title {
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: $uni-bg-color-light;
}

.close-icon {
  font-size: 48rpx;
  color: $uni-base-color;
  line-height: 1;
}

.modal-content {
  max-height: 60vh;
  padding: $uni-spacing-base;
}

.stat-item {
  margin-bottom: $uni-spacing-base;
  background: $uni-bg-color-light;
  border-radius: $uni-radius-base;
  overflow: hidden;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-base;
  background: $uni-bg-color-white;
}

.stat-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.stat-icon {
  font-size: 48rpx;
  margin-right: $uni-spacing-base;
}

.stat-name {
  font-size: $uni-font-size-base;
  font-weight: 500;
  color: $uni-main-color;
}

.stat-right {
  display: flex;
  align-items: center;
}

.stat-total {
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-error;
  margin-right: $uni-spacing-base;
}

.expand-icon {
  font-size: 24rpx;
  color: $uni-base-color;
}

.stat-details {
  padding: $uni-spacing-base;
  background: $uni-bg-color-white;
  border-top: 2rpx solid $uni-border-light;
}

.daily-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-sm 0;
  border-bottom: 2rpx solid $uni-bg-color-lighter;
}

.daily-item:last-child {
  border-bottom: none;
}

.daily-date {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.daily-count {
  font-size: $uni-font-size-sm;
  color: $uni-error;
  font-weight: 500;
}

.empty-tip {
  padding: $uni-spacing-xxl;
  text-align: center;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}
</style>