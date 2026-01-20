<template>
  <view class="medical-history-list">
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

    <view
      v-if="histories.length === 0"
      class="empty"
    >
      <text>暂无病史记录</text>
    </view>

    <button @click="handleAdd">
      添加病史
    </button>
  </view>
</template>

<script setup>
const props = defineProps({
  histories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add', 'edit', 'delete'])

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
.medical-history-list {
  padding: 20rpx;
}

.history-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.condition-name {
  font-size: 32rpx;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 24rpx;
}

.actions text {
  color: #F48224;
  font-size: 28rpx;
}

.visibility-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  font-size: 24rpx;
}
</style>
