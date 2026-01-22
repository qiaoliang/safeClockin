<template>
  <view class="batch-actions-toolbar" v-if="showToolbar">
    <view class="toolbar-content">
      <view class="selection-info">
        <checkbox
          :checked="isAllSelected"
          @change="handleSelectAll"
          class="select-all-checkbox"
        />
        <text class="selected-count">已选择 {{ selectedCount }} 项</text>
      </view>

      <view class="action-buttons">
        <button
          class="action-btn accept-btn"
          :disabled="selectedCount === 0 || loading"
          @click="$emit('batch-accept')"
        >
          {{ loading ? '处理中...' : '批量同意' }}
        </button>
        <button
          class="action-btn reject-btn"
          :disabled="selectedCount === 0 || loading"
          @click="$emit('batch-reject')"
        >
          {{ loading ? '处理中...' : '批量拒绝' }}
        </button>
        <button
          class="action-btn cancel-btn"
          @click="$emit('cancel')"
        >
          取消
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalCount: {
    type: Number,
    default: 0
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-all', 'batch-accept', 'batch-reject', 'cancel'])

const showToolbar = computed(() => props.selectedIds.length > 0)

const selectedCount = computed(() => props.selectedIds.length)

const isAllSelected = computed(() => {
  return props.totalCount > 0 && props.selectedIds.length === props.totalCount
})

const handleSelectAll = (e) => {
  emit('select-all', e.detail.checked)
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.batch-actions-toolbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1rpx solid $uni-border-1;
  z-index: 100;
  padding: $uni-spacing-base;
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200rpx;
  margin: 0 auto;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: $uni-spacing-sm;
}

.select-all-checkbox {
  transform: scale(0.8);
}

.selected-count {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}

.action-buttons {
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
  background-color: $uni-error;
  color: #fff;
}

.cancel-btn {
  background-color: $uni-bg-color-grey;
  color: $uni-text-light;
}

.action-btn[disabled] {
  opacity: 0.6;
}
</style>