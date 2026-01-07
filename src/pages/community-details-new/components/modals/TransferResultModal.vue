<template>
  <uni-popup
    ref="popup"
    type="dialog"
    :safe-area="false"
  >
    <view class="transfer-result-modal">
      <view class="modal-header">
        <text
          v-if="isSuccess"
          class="modal-icon success-icon"
        >
          ✅
        </text>
        <text
          v-else
          class="modal-icon warning-icon"
        >
          ⚠️
        </text>
        <text class="modal-title">
          {{ isSuccess ? '转移成功' : '转移完成' }}
        </text>
      </view>

      <view class="modal-body">
        <view class="result-items">
          <view
            v-if="result.success_count > 0"
            class="result-item success"
          >
            <text class="result-icon">
              ✓
            </text>
            <text class="result-text">
              成功转移 {{ result.success_count }} 个用户
            </text>
          </view>

          <view
            v-if="result.skipped_count > 0"
            class="result-item warning"
          >
            <text class="result-icon">
              ⚠️
            </text>
            <text class="result-text">
              跳过 {{ result.skipped_count }} 个用户（已离开源社区）
            </text>
          </view>

          <view
            v-if="result.failed && result.failed.length > 0"
            class="result-item error"
          >
            <text class="result-icon">
              ✗
            </text>
            <text class="result-text">
              {{ result.failed.length }} 个用户转移失败
            </text>
          </view>

          <view
            v-if="result.events_transferred > 0"
            class="result-item info"
          >
            <text class="result-icon">
              📋
            </text>
            <text class="result-text">
              已转移 {{ result.events_transferred }} 个进行中的事件
            </text>
          </view>

          <view
            v-if="result.rules_updated > 0"
            class="result-item info"
          >
            <text class="result-icon">
              ⚙️
            </text>
            <text class="result-text">
              已激活目标社区的打卡规则
            </text>
          </view>
        </view>

        <view
          v-if="result.failed && result.failed.length > 0"
          class="failed-details"
        >
          <text class="failed-title">
            失败详情：
          </text>
          <view
            v-for="(fail, index) in result.failed"
            :key="index"
            class="failed-item"
          >
            <text class="failed-user">
              用户{{ fail.user_id }}: {{ fail.reason }}
            </text>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button
          class="confirm-button"
          @click="handleConfirm"
        >
          确定
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['confirm'])

const popup = ref(null)

// 判断是否完全成功
const isSuccess = computed(() => {
  return props.result.failed && props.result.failed.length === 0
})

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.transfer-result-modal {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 80vw;
  max-width: 400px;
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.success-icon {
  color: #4CAF50;
}

.warning-icon {
  color: #FF9800;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-body {
  margin-bottom: 20px;
}

.result-items {
  margin-bottom: 15px;
}

.result-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-icon {
  margin-right: 10px;
  font-size: 16px;
}

.result-text {
  font-size: 14px;
  color: #333;
}

.result-item.success .result-icon {
  color: #4CAF50;
}

.result-item.warning .result-icon {
  color: #FF9800;
}

.result-item.error .result-icon {
  color: #f44336;
}

.result-item.info .result-icon {
  color: #2196F3;
}

.failed-details {
  background-color: #ffebee;
  border-radius: 8px;
  padding: 10px;
}

.failed-title {
  font-size: 13px;
  font-weight: bold;
  color: #c62828;
  margin-bottom: 8px;
  display: block;
}

.failed-item {
  margin-bottom: 5px;
}

.failed-item:last-child {
  margin-bottom: 0;
}

.failed-user {
  font-size: 12px;
  color: #c62828;
}

.modal-footer {
  display: flex;
  gap: 10px;
}

.confirm-button {
  flex: 1;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}
</style>