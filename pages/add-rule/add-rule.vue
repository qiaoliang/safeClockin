<!-- pages/add-rule/add-rule.vue -->
<template>
  <view class="add-rule-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">{{ isEditing ? '编辑打卡规则' : '添加打卡规则' }}</text>
      </view>
    </view>

    <!-- 表单 -->
    <form class="rule-form" @submit="submitForm">
      <!-- 事项名称 -->
      <view class="form-group">
        <text class="label">事项名称 <text class="required">*</text></text>
        <input 
          class="input"
          type="text"
          v-model="formData.rule_name"
          placeholder="请输入事项名称，如：早餐打卡"
          maxlength="50"
        />
      </view>

      <!-- 打卡频率 -->
      <view class="form-group">
        <text class="label">打卡频率</text>
        <uni-segmented-control :current="freqIndex" :values="freqValues" styleType="text" activeColor="#F48224" @clickItem="onFreqClick" />
      </view>

      <!-- 时间段 -->
      <view class="form-group">
        <text class="label">时间段</text>
        <uni-segmented-control :current="timeIndex" :values="timeValues" styleType="text" activeColor="#F48224" @clickItem="onTimeClick" />
        <view class="custom-time-input" v-if="timeIndex === 3">
          <text class="label">自定义时间</text>
          <uni-datetime-picker type="time" v-model="formData.custom_time" return-type="string" />
        </view>
      </view>

      <!-- 图标选择 -->
      <view class="form-group">
        <text class="label">图标</text>
        <view class="icon-selector">
          <view 
            class="icon-item" 
            v-for="icon in iconOptions" 
            :key="icon.value"
            :class="{ active: formData.icon_url === icon.value }"
            @click="formData.icon_url = icon.value"
          >
            <text class="icon-text">{{ icon.label }}</text>
          </view>
        </view>
      </view>

      <!-- 宽限期说明 -->
      <view class="info-section">
        <text class="info-text">• 系统为每个打卡事项提供30分钟的宽限期，允许在计划时间后30分钟内打卡仍视为有效。</text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button 
          class="submit-btn" 
          :disabled="!isFormValid || isSubmitting"
          form-type="submit"
        >
          {{ isSubmitting ? '提交中...' : (isEditing ? '更新规则' : '添加规则') }}
        </button>
      </view>
    </form>

    <!-- 二次确认弹窗 -->
    <view class="modal-overlay" v-if="showConfirmModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">{{ isEditing ? '确认更新' : '确认添加' }}</text>
        </view>
        <view class="modal-body">
          <text class="modal-text" v-if="isEditing">修改打卡规则后，系统将自动通知您的监督人。确定要继续吗？</text>
          <text class="modal-text" v-else>确定要添加新的打卡规则吗？</text>
        </view>
        <view class="modal-actions">
          <button class="modal-cancel-btn" @click="hideConfirmModal">取消</button>
          <button class="modal-confirm-btn" @click="confirmSubmit">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/api/request'

const formData = ref({
  rule_name: '',
  frequency_type: 0, // 0-每天, 1-每周, 2-工作日, 3-自定义
  time_slot_type: 4, // 1-上午, 2-下午, 3-晚上, 4-自定义时间
  custom_time: '08:00', // 自定义时间
  icon_url: '⏰', // 默认图标
  status: 1
})

const isEditing = ref(false)
const ruleId = ref(null)
const isSubmitting = ref(false)
const showConfirmModal = ref(false)
const submitCallback = ref(null) // 存储提交回调

// 表单验证
const isFormValid = ref(false)

const freqValues = ['每天','每周','工作日','自定义']
const timeValues = ['上午','下午','晚上','自定义时间']
const freqIndex = ref(0)
const timeIndex = ref(3)

const onFreqClick = (e) => {
  const idx = e?.currentIndex ?? e?.detail?.current ?? e
  freqIndex.value = Number(idx)
  formData.value.frequency_type = freqIndex.value
}

const onTimeClick = (e) => {
  const idx = e?.currentIndex ?? e?.detail?.current ?? e
  timeIndex.value = Number(idx)
  formData.value.time_slot_type = timeIndex.value + 1
}

// 图标选项
const iconOptions = ref([
  { label: '⏰', value: '⏰' },
  { label: '🌅', value: '🌅' },
  { label: '🌞', value: '🌞' },
  { label: '🌙', value: '🌙' },
  { label: '💊', value: '💊' },
  { label: '🍎', value: '🍎' },
  { label: '🏃', value: '🏃' },
  { label: '🧘', value: '🧘' }
])

// 表单验证
const validateForm = () => {
  isFormValid.value = formData.value.rule_name.trim().length > 0
}

// 监听表单变化
const updateFormValidation = () => {
  validateForm()
}

// 监听表单数据变化
const watchFormChanges = () => {
  // 这里使用定时器来模拟监听变化
  setInterval(() => {
    updateFormValidation()
  }, 500)
}

// 获取规则详情（编辑模式）
  const getRuleDetail = async (id) => {
    try {
      const response = await request({
        url: '/api/checkin/rules',
        method: 'GET'
      })
      
      if (response.code === 1) {
        const rule = response.data.rules.find(r => r.rule_id == id)
        if (rule) {
          formData.value.rule_name = rule.rule_name
          const ft = Number(rule.frequency_type)
          const fixedFt = isNaN(ft) ? 0 : Math.min(Math.max(ft, 0), 3)
          formData.value.frequency_type = fixedFt
          freqIndex.value = fixedFt

          const ts = Number(rule.time_slot_type)
          const fixedTs = [1,2,3,4].includes(ts) ? ts : 4
          formData.value.time_slot_type = fixedTs
          timeIndex.value = fixedTs - 1

          const ct = typeof rule.custom_time === 'string' ? rule.custom_time : ''
          formData.value.custom_time = fixedTs === 4 && /^\d{2}:\d{2}/.test(ct) ? ct.slice(0,5) : '08:00'

          formData.value.icon_url = rule.icon_url || '⏰'
          formData.value.status = rule.status
        }
      } else {
        uni.showToast({
          title: response.msg || '获取规则详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取规则详情失败:', error)
      uni.showToast({
        title: '获取规则详情失败',
        icon: 'none'
      })
    }
  }

// 提交表单
const submitForm = (e) => {
  e.preventDefault()
  showConfirmModal.value = true
}

// 隐藏确认弹窗
const hideConfirmModal = () => {
  showConfirmModal.value = false
}

// 确认提交
const confirmSubmit = async () => {
  hideConfirmModal()
  await performSubmit()
}

// 执行提交
const performSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    let response
    if (isEditing.value) {
      // 更新规则
      response = await request({
        url: '/api/checkin/rules',
        method: 'PUT',
        data: {
          ...formData.value,
          rule_id: ruleId.value
        }
      })
    } else {
      // 创建规则
      response = await request({
        url: '/api/checkin/rules',
        method: 'POST',
        data: formData.value
      })
    }
    
    if (response.code === 1) {
      uni.showToast({
        title: isEditing.value ? '更新成功' : '添加成功',
        icon: 'success'
      })
      
      // 延迟返回，确保用户看到成功提示
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: response.msg || (isEditing.value ? '更新失败' : '添加失败'),
        icon: 'none'
      })
    }
  } catch (error) {
    console.error(isEditing.value ? '更新规则失败:' : '添加规则失败:', error)
    uni.showToast({
      title: isEditing.value ? '更新失败' : '添加失败',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面加载
onLoad((options) => {
  if (options.ruleId) {
    isEditing.value = true
    ruleId.value = parseInt(options.ruleId)
    getRuleDetail(ruleId.value)
  }
  
  // 初始化表单验证
  validateForm()
  freqIndex.value = formData.value.frequency_type
  timeIndex.value = formData.value.time_slot_type - 1
})

onMounted(() => {
  // 监听表单变化
  watchFormChanges()
})
</script>

<style scoped>
.add-rule-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 32rpx;
}

.header-section {
  margin-bottom: 48rpx;
}

.header-content {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 48rpx;
  color: #624731;
  margin-right: 24rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #624731;
}

.rule-form {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 48rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.required {
  color: #EF4444;
}

.input {
  width: 100%;
  height: 96rpx;
  background: #FAFAFA;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #333;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.radio-item {
  padding: 16rpx 24rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  border: 2rpx solid #E5E5E5;
  cursor: pointer;
}

.radio-item.active {
  background: #FEF3C7;
  border-color: #F59E0B;
  color: #92400E;
}

.radio-text {
  font-size: 28rpx;
  color: #666;
}

.radio-item.active .radio-text {
  color: #92400E;
}

.custom-time-input {
  margin-top: 24rpx;
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.icon-item {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F8;
  border-radius: 16rpx;
  border: 2rpx solid #E5E5E5;
  cursor: pointer;
  font-size: 36rpx;
}

.icon-item.active {
  background: #FEF3C7;
  border-color: #F59E0B;
  transform: scale(1.1);
}

.info-section {
  margin: 48rpx 0;
  padding: 24rpx;
  background: #FEF3C7;
  border-radius: 16rpx;
  border-left: 8rpx solid #F59E0B;
}

.info-text {
  font-size: 24rpx;
  color: #78350F;
  line-height: 1.5;
}

.submit-section {
  margin-top: 32rpx;
}

.submit-btn {
  width: 100%;
  height: 112rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 32rpx;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 16rpx 48rpx rgba(244, 130, 36, 0.4);
}

.submit-btn:disabled {
  background: #D1D5DB;
  box-shadow: none;
  opacity: 0.6;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 48rpx;
}

.modal-content {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
}

.modal-body {
  margin-bottom: 48rpx;
}

.modal-text {
  display: block;
  font-size: 32rpx;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-cancel-btn {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border: none;
  border-radius: 16rpx;
  color: #666;
  font-size: 32rpx;
  font-weight: 500;
}

.modal-confirm-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 16rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
