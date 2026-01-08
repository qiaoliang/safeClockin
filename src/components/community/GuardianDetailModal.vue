<template>
  <view class="guardian-detail-modal">
    <view class="modal-header">
      <text class="modal-title">
        监护人详情
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
      <!-- 监护人基本信息 -->
      <view class="guardian-info-section">
        <view class="avatar-wrapper">
          <image
            :src="guardian?.avatar_url || DEFAULT_AVATAR"
            class="guardian-avatar"
            mode="aspectFill"
          />
        </view>
        <text class="guardian-name">
          {{ guardian?.nickname || '未知' }}
        </text>
        <text class="guardian-phone">
          📱 {{ formatPhone(guardian?.phone_number) }}
        </text>
        <view
          v-if="guardian?.relationship"
          class="relationship-tag"
        >
          {{ guardian.relationship }}
        </view>
      </view>

      <!-- 监护关系信息 -->
      <view
        v-if="ward"
        class="ward-info-section"
      >
        <view class="section-title">
          监护对象
        </view>
        <view class="ward-info">
          <image
            :src="ward.avatar_url || DEFAULT_AVATAR"
            class="ward-avatar"
            mode="aspectFill"
          />
          <view class="ward-details">
            <text class="ward-name">
              {{ ward.nickname || '未知' }}
            </text>
            <text class="ward-phone">
              {{ formatPhone(ward.phone_number) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 监护人病史信息 -->
      <view
        v-if="canViewMedicalHistory && medicalHistories.length > 0"
        class="medical-history-section"
      >
        <view class="section-title">
          病史信息
        </view>
        <view
          v-for="history in visibleMedicalHistories"
          :key="history.id"
          class="history-item"
        >
          <view class="history-header">
            <text class="condition-name">
              {{ history.condition_name }}
            </text>
            <view
              :class="['visibility-tag', getVisibilityClass(history.visibility)]"
            >
              {{ getVisibilityText(history.visibility) }}
            </view>
          </view>
          <view
            v-if="history.treatment_plan"
            class="treatment-plan"
          >
            <text class="plan-label">
              治疗方案:
            </text>
            <text class="plan-content">
              {{ formatTreatmentPlan(history.treatment_plan) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="contact-section">
        <view class="section-title">
          快速联系
        </view>
        <view class="contact-buttons">
          <button
            class="contact-btn call-btn"
            @click="handleCall"
          >
            📞 拨打电话
          </button>
          <button
            class="contact-btn message-btn"
            @click="handleMessage"
          >
            💬 发送消息
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { formatPhone, formatDate } from '@/utils/community'
import { DEFAULT_AVATAR } from '@/constants/community'
import { getUserMedicalHistories, logViewGuardianInfo } from '@/api/user'

const props = defineProps({
  guardian: {
    type: Object,
    default: null
  },
  ward: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const userStore = useUserStore()

// 病史列表
const medicalHistories = ref([])

// 当前社区ID（从 store 或路由获取）
const currentCommunityId = ref(userStore.currentCommunity?.id || '')

// 权限检查
const canViewMedicalHistory = computed(() => {
  // 工作人员可以查看监护人病史
  return userStore.isCommunityStaff
})

// 可见的病史（根据权限过滤）
const visibleMedicalHistories = computed(() => {
  if (!userStore.isCommunityStaff) {
    // 普通用户只能看到 visibility=2 的病史
    return medicalHistories.value.filter(h => h.visibility === 2)
  }
  // 工作人员可以看到所有病史
  return medicalHistories.value
})

// 加载监护人病史
const loadGuardianMedicalHistory = async () => {
  if (!props.guardian?.user_id || !canViewMedicalHistory.value) {
    return
  }

  try {
    const response = await getUserMedicalHistories(props.guardian.user_id)
    if (response.code === 1 || response.code === 0) {
      medicalHistories.value = response.data || []
    }

    // 记录查看监护人信息日志
    if (props.ward?.user_id) {
      await logViewGuardianInfo(
        props.guardian.user_id,
        props.ward.user_id,
        currentCommunityId.value
      )
    }
  } catch (error) {
    console.error('加载监护人病史失败:', error)
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
    return `吃药: ${plan.medications?.join(', ') || '无'} (${plan.frequency || '未指定'})`
  } else if (plan.type === 'injection') {
    return `打针: ${plan.medication || '未指定'} (${plan.frequency || '未指定'})`
  }

  return plan.note || '未指定治疗方案'
}

// 获取可见性文本
const getVisibilityText = (visibility) => {
  return visibility === 1 ? '仅工作人员' : '工作人员和监护人'
}

// 获取可见性样式类
const getVisibilityClass = (visibility) => {
  return visibility === 1 ? 'visibility-staff' : 'visibility-guardian'
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

// 拨打电话
const handleCall = () => {
  if (!props.guardian?.phone_number) {
    uni.showToast({
      title: '该监护人未绑定电话',
      icon: 'none'
    })
    return
  }

  uni.makePhoneCall({
    phoneNumber: props.guardian.phone_number
  })
}

// 发送消息
const handleMessage = () => {
  // TODO: 实现发送消息功能
  uni.showToast({
    title: '消息功能开发中',
    icon: 'none'
  })
}

onMounted(() => {
  loadGuardianMedicalHistory()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.guardian-detail-modal {
  width: 650rpx;
  max-height: 80vh;
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
  max-height: 70vh;
  padding: 32rpx;
}

.guardian-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid $uni-border-1;
  margin-bottom: 32rpx;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 24rpx;
}

.guardian-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: $uni-radius-full;
  background: $uni-bg-color-grey;
}

.guardian-name {
  font-size: $uni-font-size-xxl;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.guardian-phone {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  margin-bottom: 16rpx;
}

.relationship-tag {
  padding: 8rpx 24rpx;
  background: $uni-primary-light;
  color: $uni-primary;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-sm;
}

.ward-info-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.ward-info {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
}

.ward-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: $uni-radius-full;
  background: $uni-bg-color-grey;
  margin-right: 24rpx;
}

.ward-details {
  flex: 1;
}

.ward-name {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.ward-phone {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.medical-history-section {
  margin-bottom: 32rpx;
}

.history-item {
  padding: 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
  margin-bottom: 16rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.condition-name {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-main-color;
}

.visibility-tag {
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.visibility-staff {
  background: $uni-warning-light;
  color: $uni-warning;
}

.visibility-guardian {
  background: $uni-success-light;
  color: $uni-success;
}

.treatment-plan {
  padding: 16rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-sm;
}

.plan-label {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  margin-bottom: 8rpx;
}

.plan-content {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  line-height: 1.6;
}

.contact-section {
  margin-top: 32rpx;
}

.contact-buttons {
  display: flex;
  gap: 16rpx;
}

.contact-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
}

.call-btn {
  background: $uni-success;
  color: $uni-white;
}

.message-btn {
  background: $uni-primary;
  color: $uni-white;
}

.contact-btn:active {
  opacity: 0.8;
}
</style>
