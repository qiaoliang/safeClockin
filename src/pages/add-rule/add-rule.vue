<!-- pages/add-rule/add-rule.vue -->
<template>
  <view class="add-rule-container" data-testid="rule-form-page">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text
          class="back-btn"
          @click="goBack"
        >
          ←
        </text>
        <text class="header-title">
          {{ isEditing ? '编辑打卡规则' : '添加打卡规则' }}
        </text>
      </view>
    </view>

    <!-- 表单 -->
    <form
      class="rule-form"
      @submit="submitForm"
    >
      <!-- 事项名称 -->
      <view class="form-group">
        <text class="label">
          事项名称 <text class="required">
            *
          </text>
        </text>
        <input
          v-model="formData.rule_name"
          class="input"
          type="text"
          placeholder="请输入事项名称，如：早餐打卡"
          maxlength="50"
          data-testid="rule-name-input"
        >
      </view>

      <!-- 打卡频率 -->
      <view class="form-group">
        <view class="row">
          <text class="label">
            打卡频率
          </text>
          <uni-segmented-control
            class="seg-control"
            :current="freqIndex"
            :values="freqValues"
            style-type="text"
            active-color="#F48224"
            @click-item="onFreqClick"
          />
        </view>
        <view
          v-if="freqIndex===3"
          class="custom-date-range"
        >
          <text class="label">
            选择日期范围
          </text>
          <view class="date-row">
            <view class="date-col">
              <text class="sub-label">
                开始日期
              </text>
              <uni-datetime-picker
                v-model="formData.custom_start_date"
                class="date-picker"
                type="date"
              />
            </view>
            <view class="date-col">
              <text class="sub-label">
                结束日期
              </text>
              <uni-datetime-picker
                v-model="formData.custom_end_date"
                class="date-picker"
                type="date"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 时间段 -->
      <view class="form-group">
        <view class="row">
          <text class="label">
            时间段
          </text>
          <uni-segmented-control
            class="seg-control"
            :current="timeIndex"
            :values="timeValues"
            style-type="text"
            active-color="#F48224"
            @click-item="onTimeClick"
          />
        </view>
        <view
          v-if="timeIndex === 3"
          class="custom-time-input"
        >
          <text class="label">
            自定义时间
          </text>
          <picker 
            mode="time" 
            :value="formData.custom_time"
            class="time-picker"
            @change="onTimeChange"
          >
            <view class="picker-input">
              <text
                class="picker-text"
                :class="{ placeholder: !formData.custom_time }"
              >
                {{ formData.custom_time || '请选择时间' }}
              </text>
              <text class="picker-icon">
                🕐
              </text>
            </view>
          </picker>
        </view>
        <view
          v-if="timeIndex === 4"
          class="all-day-hint"
        >
          <text class="hint-text">
            全天规则可以在一天 24 小时内的任何时间打卡
          </text>
        </view>
      </view>

      <!-- 图标选择 -->
      <view class="form-group">
        <text class="label">
          图标
        </text>
        <view class="icon-selector">
          <view 
            v-for="icon in iconOptions" 
            :key="icon.value" 
            class="icon-item"
            :class="{ active: formData.icon_url === icon.value }"
            @click="formData.icon_url = icon.value"
          >
            <text class="icon-text">
              {{ icon.label }}
            </text>
          </view>
        </view>
      </view>

      <!-- 宽限期说明 -->
      <view class="info-section">
        <text class="info-text">
          • 系统为每个打卡事项提供30分钟的宽限期，允许在计划时间后30分钟内打卡仍视为有效。
        </text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          :disabled="!isFormValid || isSubmitting"
          form-type="submit"
          @click="handleSubmitButtonClick"
          data-testid="rule-submit-button"
        >
          {{ isSubmitting ? '提交中...' : (isEditing ? '更新规则' : '添加规则') }}
        </button>
      </view>
    </form>

    <!-- 二次确认弹窗 -->
    <view
      v-if="showConfirmModal"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            {{ isEditing ? '确认更新' : '确认添加' }}
          </text>
        </view>
        <view class="modal-body">
          <text
            v-if="isEditing"
            class="modal-text"
          >
            修改打卡规则后，系统将自动通知您的监督人。确定要继续吗？
          </text>
          <text
            v-else
            class="modal-text"
          >
            确定要添加新的打卡规则吗？
          </text>
        </view>
        <view class="modal-actions">
          <button
            class="modal-cancel-btn"
            @click="hideConfirmModal"
          >
            取消
          </button>
          <button
            class="modal-confirm-btn"
            @click="confirmSubmit"
          >
            确定
          </button>
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
  custom_time: '08:00:00', // 自定义时间，格式必须是 HH:mm:ss
  custom_start_date: '',
  custom_end_date: '',
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
const timeValues = ['上午','下午','晚上','自定义时间','全天']
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
  if (timeIndex.value === 0) formData.value.custom_time = '08:00:00'
  else if (timeIndex.value === 1) formData.value.custom_time = '14:00:00'
  else if (timeIndex.value === 2) formData.value.custom_time = '20:00:00'
  else if (timeIndex.value === 4) formData.value.custom_time = '00:00:00' // 全天规则设置为 00:00:00
}

// 处理时间选择变化
const onTimeChange = (e) => {
  formData.value.custom_time = e.detail.value
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
  let ok = formData.value.rule_name.trim().length > 0
  if (freqIndex.value === 3) {
    ok = ok && !!formData.value.custom_start_date && !!formData.value.custom_end_date && (new Date(formData.value.custom_end_date) >= new Date(formData.value.custom_start_date))
  }
  isFormValid.value = ok
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
          // 确保时间格式为 HH:mm（只包含小时和分钟）
          let timeStr = '08:00'
          if (fixedTs === 4 && ct) {
            if (/^\d{2}:\d{2}/.test(ct)) {
              timeStr = ct.slice(0, 5) // 只取 HH:mm 部分
            }
          }
          formData.value.custom_time = timeStr

          formData.value.custom_start_date = rule.custom_start_date || ''
          formData.value.custom_end_date = rule.custom_end_date || ''
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
  console.log('🔍 submitForm 被调用', {
    isFormValid: isFormValid.value,
    isSubmitting: isSubmitting.value,
    ruleName: formData.value.rule_name,
    freqIndex: freqIndex.value
  })
  
  e.preventDefault()
  
  // 检查表单是否有效
  if (!isFormValid.value) {
    console.log('❌ 表单验证失败', {
      ruleName: formData.value.rule_name,
      ruleNameLength: formData.value.rule_name.trim().length
    })
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  
  // 自定义频率必须设置起止日期
  if (freqIndex.value === 3) {
    if (!formData.value.custom_start_date || !formData.value.custom_end_date) {
      uni.showToast({ title: '请设置起止日期', icon: 'none' })
      return
    }
    if (new Date(formData.value.custom_end_date) < new Date(formData.value.custom_start_date)) {
      uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
      return
    }
  }
  
  console.log('✅ 表单验证通过，显示确认弹窗')
  showConfirmModal.value = true
}

// 备用：按钮点击事件处理器（用于 H5 环境）
const handleSubmitButtonClick = (e) => {
  console.log('🔍 handleSubmitButtonClick 被调用（H5 备用）')
  // 在 H5 环境下，form-type="submit" 可能不生效
  // 所以我们需要手动调用 submitForm
  submitForm(e)
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
    
    // Layer 2: 业务逻辑验证 - 检查响应
    if (response.code === 1) {
      uni.showToast({
        title: isEditing.value ? '更新成功' : '添加成功',
        icon: 'success'
      })

      // 延迟返回，确保用户看到成功提示
      setTimeout(() => {
        // 触发全局事件，通知其他页面数据已更新
        uni.$emit('checkinRulesUpdated', {
          action: isEditing.value ? 'update' : 'create',
          ruleId: response.data?.rule_id,
          timestamp: Date.now()
        })

        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: response.msg || (isEditing.value ? '更新失败' : '添加失败'),
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('❌ 网络请求异常:', error)
    console.error('错误堆栈:', error.stack)
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

<style lang="scss" scoped>
@import '@/uni.scss';

.add-rule-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $uni-bg-gradient-start 0%, $uni-bg-gradient-end 100%);
  padding: $uni-font-size-xl;
}

.header-section {
  margin-bottom: $uni-radius-xxl;
}

.header-content {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 48rpx;
  color: $uni-tabbar-color;
  margin-right: $uni-radius-base;
}

.header-title {
  font-size: 40rpx;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.rule-form {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-radius-xxl;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: $uni-radius-xxl;
}

.label {
  display: block;
  font-size: $uni-font-size-base;
  font-weight: 600;
  color: $uni-tabbar-color;
  margin-bottom: $uni-radius-base;
}

.row{display:flex;align-items:center;gap:$uni-radius-base}
.seg-control{flex:1}
.time-picker{width:100%}

.required {
  color: $uni-error;
}

.input {
  width: 100%;
  height: 96rpx;
  background: #FAFAFA;
  border: 2rpx solid #E5E5E5;
  border-radius: $uni-radius-lg;
  padding: 0 $uni-font-size-xl;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-radius-base;
}

.radio-item {
  padding: $uni-radius-base $uni-font-size-base;
  background: #F8F8F8;
  border-radius: $uni-radius-lg;
  border: 2rpx solid #E5E5E5;
  cursor: pointer;
}

.radio-item.active {
  background: #FEF3C7;
  border-color: $uni-warning;
  color: #92400E;
}

.radio-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.radio-item.active .radio-text {
  color: #92400E;
}

.custom-time-input {
  margin-top: $uni-font-size-base;
}

.all-day-hint {
  margin-top: $uni-font-size-base;
  padding: $uni-spacing-base;
  background: #E0F2FE;
  border-radius: $uni-radius-lg;
  border-left: 8rpx solid $uni-primary;
}

.hint-text {
  font-size: $uni-font-size-sm;
  color: $uni-main-color;
  line-height: 1.5;
}

.picker-input {
  width: 100%;
  height: 96rpx;
  background: #FAFAFA;
  border: 2rpx solid #E5E5E5;
  border-radius: $uni-radius-lg;
  padding: 0 $uni-font-size-xl;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.picker-text {
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  flex: 1;
}

.picker-text.placeholder {
  color: #999999;
}

.picker-icon {
  font-size: $uni-font-size-xl;
  color: $uni-base-color;
  margin-left: 16rpx;
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-radius-base;
}

.icon-item {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F8;
  border-radius: $uni-radius-lg;
  border: 2rpx solid #E5E5E5;
  cursor: pointer;
  font-size: $uni-font-size-xl;
}

.icon-item.active {
  background: #FEF3C7;
  border-color: $uni-warning;
  transform: scale(1.1);
}

.info-section {
  margin: $uni-radius-xxl 0;
  padding: $uni-font-size-base;
  background: #FEF3C7;
  border-radius: $uni-radius-lg;
  border-left: 8rpx solid $uni-warning;
}

.info-text {
  font-size: $uni-font-size-sm;
  color: #78350F;
  line-height: 1.5;
}

.submit-section {
  margin-top: $uni-font-size-xl;
}

.submit-btn {
  width: 100%;
  height: 112rpx;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border: none;
  border-radius: $uni-radius-xxl;
  color: white;
  font-size: $uni-font-size-xl;
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
  padding: $uni-radius-xxl;
}

.modal-content {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-radius-xxl;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  text-align: center;
  margin-bottom: $uni-font-size-xl;
}

.modal-title {
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-tabbar-color;
}

.modal-body {
  margin-bottom: $uni-radius-xxl;
}

.modal-text {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-main-color;
  text-align: center;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: $uni-font-size-base;
}

.modal-cancel-btn {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border: none;
  border-radius: $uni-radius-lg;
  color: $uni-base-color;
  font-size: $uni-font-size-lg;
  font-weight: 500;
}

.modal-confirm-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border: none;
  border-radius: $uni-radius-lg;
  color: white;
  font-size: $uni-font-size-lg;
  font-weight: 500;
}
</style>
