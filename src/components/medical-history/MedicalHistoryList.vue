<template>
  <view class="medical-history-list">
    <!-- 有病史时显示列表 -->
    <template v-if="hasHistories">
      <view
        v-for="item in histories"
        :key="item.id"
        class="history-item"
      >
        <view class="history-header">
          <text class="condition-name">
            {{ item.condition_name }}
          </text>
          <view class="actions">
            <text @click="handleEdit(item)">
              编辑
            </text>
            <text @click="handleDelete(item.id)">
              删除
            </text>
          </view>
        </view>

        <view
          v-if="item.treatment_plan"
          class="treatment-info"
        >
          <text v-if="item.treatment_plan.type">
            类型: {{ item.treatment_plan.type.join(', ') }}
          </text>
          <text v-if="item.treatment_plan.medication">
            药品: {{ item.treatment_plan.medication }}
          </text>
          <text v-if="item.treatment_plan.frequency">
            频率: {{ item.treatment_plan.frequency }}
          </text>
        </view>

        <view class="visibility-badge">
          <text>{{ item.visibility === 1 ? '仅工作人员' : '工作人员和监护人' }}</text>
        </view>
      </view>
    </template>

    <!-- 无病史时显示空状态 -->
    <view
      v-if="!hasHistories"
      class="empty"
    >
      <text class="empty-text">
        无病史信息
      </text>
      <text class="empty-hint">
        可点击下方按钮添加
      </text>
    </view>

    <!-- 添加按钮始终显示 -->
    <button @click="handleAdd">
      添加病史
    </button>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  histories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add', 'edit', 'delete'])

// 安全计算是否有数据
const hasHistories = computed(() => {
  return Array.isArray(props.histories) && props.histories.length > 0
})

const handleAdd = () => {
  emit('add')
}

const handleEdit = (item) => {
  emit('edit', item)
}

const handleDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条病史记录吗？',
    success: (res) => {
      if (res.confirm) {
        emit('delete', id)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.medical-history-list {
  padding: $uni-spacing-lg;
}

.history-item {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-md;
  padding: $uni-spacing-xl;
  margin-bottom: $uni-spacing-lg;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $uni-spacing-base;
}

.condition-name {
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-bold;
}

.actions {
  display: flex;
  gap: $uni-spacing-xl;
}

.actions text {
  color: $uni-primary;
  font-size: $uni-font-size-base;
}

.visibility-badge {
  display: inline-block;
  padding: $uni-spacing-xs $uni-spacing-base;
  background: $uni-bg-color-grey;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-sm;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $uni-spacing-xxxl 0;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-text-secondary;
  margin-bottom: $uni-spacing-sm;
}

.empty-hint {
  font-size: $uni-font-size-sm;
  color: $uni-text-light;
}
</style>
