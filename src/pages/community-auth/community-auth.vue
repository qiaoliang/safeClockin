<template>
  <view class="auth-container">
    <!-- 说明文字 -->
    <view class="description-section">
      <view class="info-card">
        <view class="info-header">
          <view class="info-icon">
            <text class="icon-text">🛡️</text>
          </view>
          <view class="info-content">
            <text class="info-title">身份验证</text>
            <text class="info-desc">为了确保社区服务的安全性和准确性，请您完成身份验证。验证通过后，您将获得社区管理权限，能够查看和管理辖区内用户的相关信息。</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 验证表单 -->
    <form class="auth-form" @submit="submitAuth">
      <view class="form-group">
        <text class="label">姓名 <text class="required">*</text></text>
        <input 
          class="input"
          type="text"
          v-model="formData.name"
          placeholder="请输入您的真实姓名"
          maxlength="20"
        />
        <text v-if="errors.name" class="error-text">{{ errors.name }}</text>
      </view>
      
      <view class="form-group">
        <text class="label">工号/身份证号 <text class="required">*</text></text>
        <input 
          class="input"
          type="text"
          v-model="formData.workId"
          placeholder="请输入您的工号或身份证号"
          maxlength="18"
        />
        <text v-if="errors.workId" class="error-text">{{ errors.workId }}</text>
      </view>
      
      <view class="form-group">
        <text class="label">工作证明照片 <text class="required">*</text></text>
        <view class="upload-area" @click="chooseImage">
          <input 
            type="file" 
            accept="image/*" 
            class="file-input" 
            @change="handleFileChange"
            ref="fileInput"
          />
          <image 
            v-if="formData.workProof" 
            :src="formData.workProof" 
            class="proof-image"
            mode="aspectFill"
          ></image>
          <view v-else class="upload-placeholder">
            <view class="upload-icon">
              <text class="icon-large">☁️</text>
            </view>
            <view class="upload-text">
              <text class="upload-title">点击上传工作证明照片</text>
              <text class="upload-desc">支持 JPG、PNG 格式，文件大小不超过 5MB</text>
            </view>
          </view>
        </view>
        <view v-if="formData.workProof" class="upload-actions">
          <text class="action-btn" @click.stop="changeImage">更换照片</text>
          <text class="action-btn delete" @click.stop="removeImage">删除</text>
        </view>
        <text v-if="errors.workProof" class="error-text">{{ errors.workProof }}</text>
      </view>
      
      <view class="submit-container">
        <button 
          class="submit-btn"
          :disabled="!isFormValid || isLoading"
          form-type="submit"
        >
          <text v-if="!isLoading">提交验证</text>
          <text v-else class="loading-text">
            <text class="spinner">⟳</text>
            提交中...
          </text>
        </button>
      </view>
    </form>

    <!-- 提示信息 -->
    <view class="tips-section">
      <view class="tips-card">
        <view class="tips-header">
          <view class="tips-icon">
            <text class="icon-small">ℹ️</text>
          </view>
          <view class="tips-content">
            <text class="tips-title">温馨提示</text>
            <text class="tips-desc">验证信息提交后，我们将在1-3个工作日内完成审核。审核结果将通过短信和站内信通知您。请确保提供的信息真实有效。</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 成功弹窗 -->
    <view v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="success-icon">
            <text class="icon-large">✓</text>
          </view>
          <text class="modal-title">提交成功</text>
          <text class="modal-desc">验证信息已提交，请耐心等待审核。审核结果将通过短信和站内信通知您。</text>
        </view>
        <button class="modal-btn" @click="confirmSuccess">确定</button>
      </view>
    </view>

    <!-- 错误弹窗 -->
    <view v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="error-icon">
            <text class="icon-large">⚠️</text>
          </view>
          <text class="modal-title">提交失败</text>
          <text class="modal-desc">{{ errorMessage }}</text>
        </view>
        <button class="modal-btn" @click="closeErrorModal">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole, routeGuard } from '@/utils/router'

const isLoading = ref(false)
const userStore = useUserStore()
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const fileInput = ref(null)

const formData = ref({
  name: '',
  workId: '',
  workProof: ''
})

const errors = ref({
  name: '',
  workId: '',
  workProof: ''
})

const isFormValid = computed(() => {
  return formData.value.name.trim() && 
         formData.value.workId.trim() && 
         formData.value.workProof &&
         !errors.value.name &&
         !errors.value.workId &&
         !errors.value.workProof
})

const validateForm = () => {
  errors.value = { name: '', workId: '', workProof: '' }
  let isValid = true
  
  // 验证姓名
  if (!formData.value.name.trim()) {
    errors.value.name = '请输入您的姓名'
    isValid = false
  } else if (formData.value.name.trim().length < 2) {
    errors.value.name = '姓名至少需要2个字符'
    isValid = false
  }
  
  // 验证工号/身份证号
  if (!formData.value.workId.trim()) {
    errors.value.workId = '请输入工号或身份证号'
    isValid = false
  } else if (formData.value.workId.trim().length < 6) {
    errors.value.workId = '请输入有效的工号或身份证号'
    isValid = false
  }
  
  // 验证工作证明
  if (!formData.value.workProof) {
    errors.value.workProof = '请上传工作证明照片'
    isValid = false
  }
  
  return isValid
}

const chooseImage = () => {
  if (formData.value.workProof) {
    return // 如果已上传图片，点击不会重新选择
  }
  
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      
      // 检查文件大小
      uni.getFileInfo({
        filePath: tempFilePath,
        success: (fileInfo) => {
          const fileSize = fileInfo.size
          const maxSize = 5 * 1024 * 1024 // 5MB
          
          if (fileSize > maxSize) {
            errors.value.workProof = '文件大小不能超过5MB'
            return
          }
          
          formData.value.workProof = tempFilePath
          errors.value.workProof = ''
        },
        fail: () => {
          errors.value.workProof = '文件读取失败，请重试'
        }
      })
    },
    fail: () => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
}

const changeImage = () => {
  formData.value.workProof = ''
  errors.value.workProof = ''
  // 延迟一下再打开选择器，避免立即触发
  setTimeout(() => {
    chooseImage()
  }, 100)
}

const removeImage = () => {
  formData.value.workProof = ''
  errors.value.workProof = ''
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      errors.value.workProof = '请选择图片文件'
      return
    }
    
    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      errors.value.workProof = '文件大小不能超过5MB'
      return
    }
    
    // 读取文件并显示预览
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.workProof = e.target.result
      errors.value.workProof = ''
    }
    reader.readAsDataURL(file)
  }
}

const submitAuth = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) {
    return
  }
  
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    // 调用API提交身份验证信息
    const response = await request({
      url: '/api/community/verify',
      method: 'POST',
      data: {
        name: formData.value.name,
        workId: formData.value.workId,
        workProof: formData.value.workProof
      }
    })
    
    if (response.code === 1) {
      // 更新用户验证状态
      if (userStore.userInfo) {
        userStore.userInfo.verificationStatus = 1 // 待审核
        uni.setStorageSync('userInfo', userStore.userInfo)
      }
      
      // 显示成功弹窗
      showSuccessModal.value = true
    } else {
      throw new Error(response.msg || '提交失败')
    }
    
  } catch (error) {
    console.error('身份验证提交失败:', error)
    errorMessage.value = error.message || '提交失败，请检查信息是否完整并重试。'
    showErrorModal.value = true
  } finally {
    isLoading.value = false
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
}

const confirmSuccess = () => {
  showSuccessModal.value = false
  
  // 跳转到社区首页
  const homePage = getHomePageByRole('community')
  routeGuard(homePage, { useRedirect: true })
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorMessage.value = ''
}

// 输入时清除错误
const clearError = (field) => {
  if (errors.value[field]) {
    errors.value[field] = ''
  }
}
</script>

<style lang="scss" scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx;
}

/* 说明文字区域 */
.description-section {
  margin-bottom: 48rpx;
}

.info-card {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.info-header {
  display: flex;
  align-items: flex-start;
}

.info-icon {
  width: 96rpx;
  height: 96rpx;
  background: #DBEAFE;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.icon-text {
  font-size: 48rpx;
}

.info-content {
  flex: 1;
}

.info-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.info-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 表单样式 */
.auth-form {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
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
  border-radius: 24rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #333;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #F48224;
  background: white;
  box-shadow: 0 0 0 6rpx rgba(244, 130, 36, 0.1);
}

.error-text {
  display: block;
  font-size: 24rpx;
  color: #EF4444;
  margin-top: 8rpx;
}

/* 上传区域 */
.upload-area {
  width: 100%;
  height: 240rpx;
  background: #FAFAFA;
  border: 4rpx dashed #D1D5DB;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.upload-area:hover {
  border-color: #F48224;
  background-color: rgba(244, 130, 36, 0.05);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.proof-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.upload-icon {
  margin-bottom: 24rpx;
}

.icon-large {
  font-size: 64rpx;
}

.upload-text {
  color: #6B7280;
}

.upload-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.upload-desc {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
}

.upload-actions {
  display: flex;
  justify-content: center;
  margin-top: 24rpx;
  gap: 32rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #F48224;
  cursor: pointer;
}

.action-btn.delete {
  color: #EF4444;
}

/* 提交按钮 */
.submit-container {
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled {
  background: #D1D5DB;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  transform: none;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 提示信息 */
.tips-section {
  margin-bottom: 48rpx;
}

.tips-card {
  background: #FEF3C7;
  border: 2rpx solid #F59E0B;
  border-radius: 32rpx;
  padding: 32rpx;
}

.tips-header {
  display: flex;
  align-items: flex-start;
}

.tips-icon {
  width: 48rpx;
  height: 48rpx;
  background: #F59E0B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.icon-small {
  font-size: 24rpx;
  color: white;
}

.tips-content {
  flex: 1;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 8rpx;
}

.tips-desc {
  display: block;
  font-size: 24rpx;
  color: #78350F;
  line-height: 1.5;
}

/* 弹窗样式 */
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
  border-radius: 32rpx;
  padding: 48rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.success-icon {
  width: 128rpx;
  height: 128rpx;
  background: #D1FAE5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.success-icon .icon-large {
  font-size: 64rpx;
  color: #10B981;
}

.error-icon {
  width: 128rpx;
  height: 128rpx;
  background: #FEE2E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
}

.error-icon .icon-large {
  font-size: 64rpx;
  color: #EF4444;
}

.modal-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 16rpx;
}

.modal-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.modal-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 24rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(244, 130, 36, 0.3);
}

.modal-btn:active {
  transform: scale(0.98);
}
</style>
