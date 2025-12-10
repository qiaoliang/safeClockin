<!-- components/user-info-form/user-info-form.vue -->
<template>
  <view class="user-info-modal" v-if="visible">
    <view class="modal-mask" @click="onCancel"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">完善个人信息</text>
      </view>
      
      <form @submit="onSubmit">
        <!-- 头像选择 -->
        <view class="form-item">
          <text class="form-label">头像</text>
          <button 
            class="avatar-button" 
            open-type="chooseAvatar" 
            @chooseavatar="onChooseAvatar"
          >
            <image 
              class="avatar-image" 
              :src="formData.avatarUrl || defaultAvatarUrl"
              mode="aspectFill"
            ></image>
            <text class="avatar-tip">点击选择头像</text>
          </button>
        </view>
        
        <!-- 昵称填写 -->
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input 
            class="nickname-input"
            type="nickname" 
            name="nickname"
            :value="formData.nickName"
            placeholder="请输入昵称"
            @input="onNicknameInput"
            @blur="onNicknameBlur"
          />
        </view>
        
        <!-- 操作按钮 -->
        <view class="form-actions">
          <button class="cancel-btn" @click="onCancel">取消</button>
          <button 
            class="confirm-btn" 
            form-type="submit"
            :disabled="!isFormValid || isLoading"
          >
            {{ isLoading ? '提交中...' : '确认' }}
          </button>
        </view>
      </form>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  code: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['cancel', 'confirm'])

const isLoading = ref(false)
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const formData = ref({
  avatarUrl: '',
  nickName: ''
})

const isFormValid = computed(() => {
  return formData.value.avatarUrl && formData.value.nickName.trim()
})

const onChooseAvatar = (e) => {
  const { avatarUrl } = e.detail
  formData.value.avatarUrl = avatarUrl
}

const onNicknameInput = (e) => {
  formData.value.nickName = e.detail.value
}

const onNicknameBlur = (e) => {
  // 昵称安全检测在blur事件后异步进行
  formData.value.nickName = e.detail.value
}

const onSubmit = async (e) => {
  if (!isFormValid.value || isLoading.value) return
  
  isLoading.value = true
  
  try {
    // 提交用户信息，并等待父组件处理完成
    await new Promise((resolve, reject) => {
      emit('confirm', {
        code: props.code,
        userInfo: {
          avatarUrl: formData.value.avatarUrl,
          nickName: formData.value.nickName
        },
        onSuccess: resolve,
        onError: reject
      })
    })
    
    // 成功后关闭表单
    emit('cancel')
    
  } catch (error) {
    console.error('提交用户信息失败:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    // 无论成功失败，都重置loading状态
    isLoading.value = false
  }
}

const uploadAvatar = (tempPath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'https://your-api-domain.com/api/upload-avatar',
      filePath: tempPath,
      name: 'avatar',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data.url)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.user-info-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600rpx;
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
}

.modal-header {
  text-align: center;
  margin-bottom: 48rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.avatar-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 16rpx;
}

.avatar-tip {
  font-size: 24rpx;
  color: #999;
}

.nickname-input {
  width: 100%;
  height: 80rpx;
  background: #F8F8F8;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.form-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
}

.cancel-btn {
  background: #F5F5F5;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
}

.confirm-btn:disabled {
  background: #CCCCCC;
}
</style>