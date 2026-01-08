<template>
  <view class="member-detail-modal">
    <view class="modal-header">
      <text class="modal-title">
        成员详情
      </text>
      <text
        class="modal-close"
        @click="handleClose"
      >
        ✕
      </text>
    </view>

    <scroll-view
      class="modal-content"
      scroll-y
    >
      <!-- 基本信息 -->
      <view class="member-info-section">
        <image
          :src="member?.avatar_url || DEFAULT_AVATAR"
          class="member-avatar"
          mode="aspectFill"
        />
        <text class="member-name">
          {{ member?.nickname || '未知用户' }}
        </text>
        <text class="member-phone">
          📱 {{ formatPhone(member?.phone_number) }}
        </text>
      </view>

      <!-- 病史信息 -->
      <view
        v-if="medicalHistories.length > 0"
        class="medical-section"
      >
        <view class="section-title">
          病史信息
        </view>
        <view
          v-for="history in visibleMedicalHistories"
          :key="history.id"
          class="history-item"
        >
          <text class="condition-name">
            {{ history.condition_name }}
          </text>
          <text
            v-if="history.treatment_plan"
            class="treatment-text"
          >
            {{ formatTreatmentPlan(history.treatment_plan) }}
          </text>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        v-if="medicalHistories.length === 0"
        class="empty-state"
      >
        <text class="empty-text">
          暂无病史信息
        </text>
      </view>
    </scroll-view>

    <!-- 关闭按钮 -->
    <view class="modal-footer">
      <button
        class="close-btn"
        @click="handleClose"
      >
        关闭
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { formatPhone } from '@/utils/community'
import { DEFAULT_AVATAR } from '@/constants/community'
import { getUserMedicalHistories } from '@/api/user'

const props = defineProps({
  member: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const userStore = useUserStore()

// 病史列表
const medicalHistories = ref([])

// 可见的病史（根据权限过滤）
const visibleMedicalHistories = computed(() => {
  if (!userStore.isCommunityStaff) {
    return []
  }
  return medicalHistories.value
})

// 加载病史信息
const loadMedicalHistories = async () => {
  if (!props.member?.user_id) return

  try {
    const response = await getUserMedicalHistories(props.member.user_id)
    if (response.code === 1 || response.code === 0) {
      medicalHistories.value = response.data || []
    }
  } catch (error) {
    console.error('加载病史失败:', error)
  }
}

// 格式化治疗方案
const formatTreatmentPlan = (plan) => {
  if (!plan) return ''

  if (typeof plan === 'string') {
    try {
      plan = JSON.parse(plan)
    } catch (e) {
      return plan
    }
  }

  if (plan.type === 'medication') {
    return `吃药: ${plan.medications?.join(', ') || '无'}`
  } else if (plan.type === 'injection') {
    return `打针: ${plan.medication || '未指定'}`
  }

  return plan.note || '未指定'
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

onMounted(() => {
  loadMedicalHistories()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.member-detail-modal {
  width: 600rpx;
  max-height: 70vh;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid $uni-border-1;
}

.modal-title {
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-main-color;
}

.modal-close {
  font-size: $uni-font-size-xxl;
  color: $uni-base-color;
  padding: 8rpx;
}

.modal-content {
  max-height: 60vh;
  padding: 32rpx;
}

.member-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  margin-bottom: 32rpx;
  border-bottom: 1rpx solid $uni-border-1;
}

.member-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: $uni-radius-full;
  background: $uni-bg-color-grey;
  margin-bottom: 24rpx;
}

.member-name {
  font-size: $uni-font-size-xxl;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.member-phone {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.medical-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.history-item {
  padding: 16rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
  margin-bottom: 12rpx;
}

.condition-name {
  display: block;
  font-size: $uni-font-size-base;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.treatment-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  line-height: 1.6;
}

.empty-state {
  padding: 80rpx 32rpx;
  text-align: center;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-secondary-color;
}

.modal-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid $uni-border-1;
}

.close-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: $uni-bg-color-lighter;
  color: $uni-main-color;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-lg;
}

.close-btn:active {
  background: $uni-bg-color-grey;
}
</style>
