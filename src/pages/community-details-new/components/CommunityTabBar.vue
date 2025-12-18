<template>
  <view class="community-tab-bar">
    <view class="tab-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', activeTab === tab.id ? 'active' : '']"
        @click="$emit('tab-change', tab.id)"
      >
        <text class="tab-text">{{ tab.name }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  activeTab: {
    type: String,
    default: "",
  },
});

defineEmits(["tab-change"]);
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.community-tab-bar {
  margin-bottom: $uni-spacing-xl;

  .tab-container {
    display: flex;
    background: transparent;
    border-radius: 0;
    padding: 0;

    .tab-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12rpx 0;
      border-radius: 0;
      transition: all 0.3s ease;
      background: #e0e0e0; /* 浅灰色背景 */
      position: relative;

      // 添加标签之间的分隔线（除了第一个标签）
      &:not(:first-child)::before {
        content: "";
        position: absolute;
        left: 0;
        top: 20%;
        bottom: 20%;
        width: 1px;
        background: #bdbdbd; /* 浅灰色分隔线 */
      }

      .tab-text {
        font-size: 32rpx; /* 约16px */
        font-weight: $uni-font-weight-base;
        transition: all 0.3s ease;
        color: #212121; /* 深灰色文字 */
      }

      // 非激活状态
      &:not(.active) {
        .tab-text {
          color: #212121; /* 深灰色文字 */
        }

        &:active {
          background: #bdbdbd; /* 点击时背景变深 */
          transform: scale(0.98);
        }
      }

      // 激活状态
      &.active {
        background: $uni-primary; /* 橙色背景 */
        box-shadow: none;

        .tab-text {
          color: #ffffff; /* 白色文字 */
          font-weight: $uni-font-weight-base;
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }
}
</style>
