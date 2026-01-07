<template>
  <uni-popup
    ref="popup"
    type="dialog"
    :safe-area="false"
  >
    <view class="transfer-preview-modal">
      <view class="modal-header">
        <text class="modal-title">
          转移预览
        </text>
      </view>

      <view class="modal-body">
        <view class="preview-info">
          <view class="info-row">
            <text class="info-label">
              源社区：
            </text>
            <text class="info-value">
              {{ sourceCommunityName }}
            </text>
          </view>
          <view class="info-row">
            <text class="info-label">
              目标社区：
            </text>
            <text class="info-value">
              {{ targetCommunityName }}
            </text>
          </view>
          <view class="info-row">
            <text class="info-label">
              转移用户数：
            </text>
            <text class="info-value">
              {{ userCount }} 人
            </text>
          </view>
        </view>

        <view class="preview-warning">
          <text class="warning-icon">
            ⚠️
          </text>
          <text class="warning-title">
            转移后将自动执行以下操作：
          </text>
          <view class="warning-items">
            <view class="warning-item">
              <text class="check-icon">
                ✓
              </text>
              <text class="warning-text">
                更新用户社区归属
              </text>
            </view>
            <view class="warning-item">
              <text class="check-icon">
                ✓
              </text>
              <text class="warning-text">
                停用源社区打卡规则
              </text>
            </view>
            <view class="warning-item">
              <text class="check-icon">
                ✓
              </text>
              <text class="warning-text">
                激活目标社区打卡规则
              </text>
            </view>
            <view class="warning-item">
              <text class="check-icon">
                ✓
              </text>
              <text class="warning-text">
                转移进行中的事件
              </text>
            </view>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button
          class="cancel-button"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          class="confirm-button"
          :disabled="loading"
          @click="handleConfirm"
        >
          <text v-if="!loading">
            确认转移
          </text>
          <text v-else>
            转移中...
          </text>
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  sourceCommunityName: {
    type: String,
    required: true
  },
  targetCommunityName: {
    type: String,
    required: true
  },
  userCount: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const popup = ref(null)
const loading = ref(false)

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
  loading.value = false
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const handleConfirm = () => {
  loading.value = true
  emit('confirm')
}

const setLoading = (value) => {
  loading.value = value
}

defineExpose({
  open,
  close,
  setLoading
})
</script>

<style scoped>
.transfer-preview-modal {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 80vw;
  max-width: 400px;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.modal-body {
  margin-bottom: 20px;
}

.preview-info {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.preview-warning {
  background-color: #fff3e0;
  border-radius: 8px;
  padding: 15px;
}

.warning-icon {
  font-size: 16px;
  margin-right: 5px;
}

.warning-title {
  font-size: 14px;
  font-weight: bold;
  color: #e65100;
  display: block;
  margin-bottom: 10px;
}

.warning-items {
  margin-top: 10px;
}

.warning-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.warning-item:last-child {
  margin-bottom: 0;
}

.check-icon {
  color: #4CAF50;
  margin-right: 8px;
  font-size: 14px;
}

.warning-text {
  font-size: 13px;
  color: #e65100;
}

.modal-footer {
  display: flex;
  gap: 10px;
}

.cancel-button {
  flex: 1;
  padding: 12px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 16px;
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

.confirm-button:disabled {
  background-color: #ccc;
  color: #999;
}
</style>