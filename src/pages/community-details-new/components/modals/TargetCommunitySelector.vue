<template>
  <uni-popup
    ref="popup"
    type="bottom"
    :safe-area="false"
  >
    <view class="target-community-selector">
      <view class="selector-header">
        <text class="selector-title">
          选择目标社区
        </text>
        <button
          class="close-button"
          @click="handleClose"
        >
          <text class="close-icon">
            ×
          </text>
        </button>
      </view>

      <view class="community-list">
        <view
          v-for="community in communities"
          :key="community.community_id"
          class="community-item"
          :class="{ 'selected': selectedCommunityId === community.community_id }"
          @click="handleSelectCommunity(community)"
        >
          <view class="community-info">
            <text class="community-name">
              {{ community.name }}
            </text>
            <text class="community-count">
              {{ community.user_count || 0 }}人
            </text>
          </view>
          <view
            v-if="selectedCommunityId === community.community_id"
            class="selected-icon"
          >
            <text class="check-icon">
              ✓
            </text>
          </view>
        </view>

        <view
          v-if="communities.length === 0"
          class="empty-state"
        >
          <text class="empty-icon">
            🏘️
          </text>
          <text class="empty-text">
            暂无可用社区
          </text>
        </view>
      </view>

      <view class="selector-footer">
        <button
          class="cancel-button"
          @click="handleClose"
        >
          取消
        </button>
        <button
          class="confirm-button"
          :disabled="!selectedCommunityId"
          @click="handleConfirm"
        >
          下一步
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTransferStore } from '@/store/modules/transfer'

const props = defineProps({
  sourceCommunityId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['select', 'close'])

const transferStore = useTransferStore()
const popup = ref(null)
const selectedCommunityId = ref(null)

// 过滤掉源社区
const communities = computed(() => {
  return transferStore.managerCommunities.filter(
    c => c.community_id !== Number(props.sourceCommunityId)
  )
})

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
}

const handleClose = () => {
  close()
  emit('close')
}

const handleSelectCommunity = (community) => {
  selectedCommunityId.value = community.community_id
}

const handleConfirm = () => {
  if (!selectedCommunityId.value) {
    uni.showToast({
      title: '请选择目标社区',
      icon: 'none'
    })
    return
  }

  const selectedCommunity = communities.value.find(
    c => c.community_id === selectedCommunityId.value
  )

  emit('select', selectedCommunity)
  close()
}

defineExpose({
  open,
  close
})
</script>

<style scoped>
.target-community-selector {
  background-color: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  max-height: 60vh;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.selector-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.close-button {
  padding: 5px 10px;
  background-color: transparent;
  border: none;
  font-size: 24px;
  color: #999;
}

.close-icon {
  font-size: 24px;
}

.community-list {
  max-height: 40vh;
  overflow-y: auto;
  margin-bottom: 20px;
}

.community-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 2px solid transparent;
}

.community-item.selected {
  border-color: #4CAF50;
  background-color: #e8f5e9;
}

.community-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.community-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.community-count {
  font-size: 14px;
  color: #666;
}

.selected-icon {
  width: 24px;
  height: 24px;
  background-color: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: white;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.selector-footer {
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