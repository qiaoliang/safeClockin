<template>
  <view class="container">
    <view class="header">
      <text class="title">
        编辑个人资料
      </text>
    </view>

    <!-- 基本信息区域 -->
    <view class="card">
      <!-- 头像 -->
      <view class="row avatar-row">
        <text class="label">
          头像
        </text>
        <view
          class="avatar-container"
          @click="chooseAvatar"
        >
          <image
            :src="formData.avatar_url || '/static/logo.png'"
            class="avatar"
            mode="aspectFill"
          />
          <view class="avatar-hint">
            点击更换
          </view>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="row">
        <text class="label">
          昵称
        </text>
        <input
          v-model="formData.nickname"
          class="input"
          placeholder="请输入昵称"
          maxlength="20"
        >
        <button
          class="btn"
          :disabled="saving"
          @click="saveNickname"
        >
          保存
        </button>
      </view>

      <!-- 真实姓名 -->
      <view class="row">
        <text class="label">
          真实姓名
        </text>
        <input
          v-model="formData.name"
          class="input"
          placeholder="请输入真实姓名"
          maxlength="20"
        >
      </view>

      <!-- 电话号码 -->
      <view class="row">
        <text class="label">
          手机号
        </text>
        <text class="value">
          {{ displayPhone }}
        </text>
        <button
          class="link"
          @click="openPhoneBind"
        >
          {{ phoneBindText }}
        </button>
      </view>

      <!-- 密码 -->
      <view class="row">
        <text class="label">
          密码
        </text>
        <text class="value">
          ******
        </text>
        <button
          class="link"
          @click="openPasswordChange"
        >
          更换
        </button>
      </view>

      <!-- 个人地址 -->
      <view class="row">
        <text class="label">
          个人地址
        </text>
        <textarea
          v-model="formData.address"
          class="textarea"
          placeholder="请输入个人地址"
          maxlength="200"
        />
      </view>

      <!-- 座右铭 -->
      <view class="row">
        <text class="label">
          座右铭
        </text>
        <textarea
          v-model="formData.motto"
          class="textarea"
          placeholder="请输入座右铭"
          maxlength="100"
        />
      </view>
    </view>

    <!-- 紧急联系人区域 -->
    <view class="card">
      <view class="card-title">
        紧急联系人
      </view>
      
      <view class="row">
        <text class="label">
          姓名
        </text>
        <input
          v-model="formData.emergency_contact_name"
          class="input"
          placeholder="请输入联系人姓名"
          maxlength="20"
        >
      </view>

      <view class="row">
        <text class="label">
          电话
        </text>
        <input
          v-model="formData.emergency_contact_phone"
          class="input"
          type="number"
          placeholder="请输入联系人电话"
          maxlength="11"
        >
      </view>

      <view class="row">
        <text class="label">
          地址
        </text>
        <textarea
          v-model="formData.emergency_contact_address"
          class="textarea"
          placeholder="请输入联系人地址"
          maxlength="100"
        />
      </view>
    </view>

    <!-- 病史信息区域 -->
    <view class="card">
      <view class="card-title">
        病史信息
      </view>
      
      <MedicalHistoryList
        v-if="!isEditingMedicalHistory"
        :histories="medicalHistories"
        @add="handleAddMedicalHistory"
        @edit="handleEditMedicalHistory"
        @delete="handleDeleteMedicalHistory"
      />
      
      <view
        v-else
        class="editing-container"
      >
        <MedicalHistoryForm
          :model-value="editingMedicalHistory"
          @submit="handleSaveMedicalHistory"
          @cancel="handleCancelEditMedicalHistory"
        />
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="footer">
      <button
        class="save-btn"
        :disabled="saving"
        @click="saveAll"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </view>

    <!-- 手机号绑定弹窗 -->
    <view
      v-if="phoneModal"
      class="modal"
      @click="closePhoneBind"
    >
      <view
        class="modal-card"
        @click.stop
      >
        <text class="modal-title">
          绑定/更换手机号
        </text>
        <view class="row">
          <input
            v-model="phone"
            class="input"
            type="number"
            placeholder="请输入手机号"
          >
        </view>
        <view class="row">
          <input
            v-model="code"
            class="input"
            type="number"
            placeholder="验证码"
          >
          <button
            class="btn"
            :disabled="countdown > 0 || sending"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
        <view class="row">
          <button
            class="btn primary"
            :disabled="binding"
            @click="confirmBindPhone"
          >
            确认绑定
          </button>
          <button
            class="btn"
            @click="closePhoneBind"
          >
            取消
          </button>
        </view>
      </view>
    </view>

    <!-- 密码修改弹窗 -->
    <view
      v-if="passwordModal"
      class="modal"
      @click="closePasswordChange"
    >
      <view
        class="modal-card"
        @click.stop
      >
        <text class="modal-title">
          修改密码
        </text>
        <view class="row">
          <text class="label">
            原密码
          </text>
          <input
            v-model="passwordForm.old_password"
            class="input"
            type="password"
            placeholder="请输入原密码"
          >
        </view>
        <view class="row">
          <text class="label">
            新密码
          </text>
          <input
            v-model="passwordForm.new_password"
            class="input"
            type="password"
            placeholder="请输入新密码（6-20字符）"
          >
        </view>
        <view class="row">
          <text class="label">
            确认密码
          </text>
          <input
            v-model="passwordForm.confirm_password"
            class="input"
            type="password"
            placeholder="请再次输入新密码"
          >
        </view>
        <view class="row">
          <button
            class="btn primary"
            :disabled="changingPassword"
            @click="confirmChangePassword"
          >
            确认修改
          </button>
          <button
            class="btn"
            @click="closePasswordChange"
          >
            取消
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'
import MedicalHistoryList from '@/components/medical-history/MedicalHistoryList.vue'
import MedicalHistoryForm from '@/components/medical-history/MedicalHistoryForm.vue'

const userStore = useUserStore()
const saving = ref(false)

const formData = ref({
  nickname: '',
  name: '',
  address: '',
  motto: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_address: '',
  avatar_url: ''
})

const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const displayPhone = computed(() => {
  const phone = userStore.userInfo?.phone_number
  if (!phone) return '未关联'
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
  return phone
})
const phoneBindText = computed(() => (userStore.userInfo?.phone_number ? '更换' : '关联'))

// Phone bind modal
const phoneModal = ref(false)
const phone = ref('')
const code = ref('')
const sending = ref(false)
const countdown = ref(0)
const binding = ref(false)
let timer = null

// Password change modal
const passwordModal = ref(false)
const changingPassword = ref(false)

// Medical history management
const medicalHistories = ref([])
const isEditingMedicalHistory = ref(false)
const editingMedicalHistory = ref(null)

onMounted(() => {
  // 加载用户数据
  const userInfo = userStore.userInfo
  if (userInfo) {
    formData.value = {
      nickname: userInfo.nickname || '',
      name: userInfo.name || '',
      address: userInfo.address || '',
      motto: userInfo.motto || '',
      emergency_contact_name: userInfo.emergency_contact_name || '',
      emergency_contact_phone: userInfo.emergency_contact_phone || '',
      emergency_contact_address: userInfo.emergency_contact_address || '',
      avatar_url: userInfo.avatar_url || ''
    }
  }
  
  // 加载病史数据
  loadMedicalHistories()
})

async function saveNickname() {
  if (!formData.value.nickname.trim()) return uni.showToast({ title: '请输入昵称', icon: 'none' })
  try {
    saving.value = true
    const res = await authApi.updateUserProfile({ nickname: formData.value.nickname })
    if (res.code === 1) {
      await userStore.fetchUserInfo()
      uni.showToast({ title: '昵称已更新', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '更新失败', icon: 'none' })
    }
  } finally { saving.value = false }
}

async function saveAll() {
  if (!formData.value.nickname.trim()) return uni.showToast({ title: '请输入昵称', icon: 'none' })
  
  try {
    saving.value = true
    const res = await authApi.updateUserProfile({
      name: formData.value.name,
      address: formData.value.address,
      motto: formData.value.motto,
      emergency_contact_name: formData.value.emergency_contact_name,
      emergency_contact_phone: formData.value.emergency_contact_phone,
      emergency_contact_address: formData.value.emergency_contact_address
    })
    
    if (res.code === 1) {
      await userStore.fetchUserInfo()
      uni.showToast({ title: '保存成功', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } finally { saving.value = false }
}

// 头像上传
function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uploadAvatar(tempFilePath)
    }
  })
}

async function uploadAvatar(filePath) {
  try {
    uni.showLoading({ title: '上传中...' })
    
    uni.uploadFile({
      url: 'http://localhost:9999/api/user/upload-avatar',
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${userStore.token}`
      },
      success: async (uploadRes) => {
        const data = JSON.parse(uploadRes.data)
        if (data.code === 1) {
          formData.value.avatar_url = data.data.avatar_url
          await userStore.fetchUserInfo()
          uni.showToast({ title: '头像上传成功', icon: 'none' })
        } else {
          uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        uni.hideLoading()
      }
    })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

// Phone bind functions
function openPhoneBind() { phoneModal.value = true }
function closePhoneBind() { phoneModal.value = false; code.value = ''; phone.value = ''; stopCountdown() }
function startCountdown() { countdown.value = 60; timer = setInterval(() => { countdown.value -= 1; if (countdown.value <= 0) stopCountdown() }, 1000) }
function stopCountdown() { if (timer) { clearInterval(timer); timer = null } countdown.value = 0 }

async function sendCode() {
  if (!phone.value) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  try {
    sending.value = true
    const res = await authApi.sendSmsCode({ phone: phone.value, purpose: 'bind_phone' })
    if (res.code === 1) { startCountdown(); uni.showToast({ title: '验证码已发送', icon: 'none' }) }
    else { uni.showToast({ title: res.msg || '发送失败', icon: 'none' }) }
  } finally { sending.value = false }
}

async function confirmBindPhone() {
  if (!phone.value || !code.value) return uni.showToast({ title: '请输入手机号和验证码', icon: 'none' })
  try {
    binding.value = true
    const res = await authApi.bindPhone({ phone: phone.value, code: code.value })
    if (res.code === 1) { await userStore.fetchUserInfo(); closePhoneBind(); uni.showToast({ title: '手机号已关联', icon: 'none' }) }
    else { uni.showToast({ title: res.msg || '绑定失败', icon: 'none' }) }
  } finally { binding.value = false }
}

// Password change functions
function openPasswordChange() { passwordModal.value = true }
function closePasswordChange() { passwordModal.value = false; passwordForm.value = { old_password: '', new_password: '', confirm_password: '' } }

async function confirmChangePassword() {
  const { old_password, new_password, confirm_password } = passwordForm.value
  
  if (!old_password || !new_password || !confirm_password) {
    return uni.showToast({ title: '请填写所有字段', icon: 'none' })
  }
  
  if (new_password.length < 6 || new_password.length > 20) {
    return uni.showToast({ title: '新密码长度必须在 6-20 个字符之间', icon: 'none' })
  }
  
  if (new_password !== confirm_password) {
    return uni.showToast({ title: '两次密码不一致', icon: 'none' })
  }
  
  if (old_password === new_password) {
    return uni.showToast({ title: '新密码不能与原密码相同', icon: 'none' })
  }
  
  try {
    changingPassword.value = true
    const res = await authApi.changePassword({ old_password, new_password })
    if (res.code === 1) {
      closePasswordChange()
      uni.showToast({ title: '密码修改成功', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '修改失败', icon: 'none' })
    }
  } finally { changingPassword.value = false }
}

// Medical history functions
async function loadMedicalHistories() {
  try {
    const userId = userStore.userInfo?.user_id
    if (!userId) return
    
    const res = await userApi.getUserMedicalHistories(userId)
    if (res.code === 1) {
      medicalHistories.value = res.data || []
    }
  } catch (error) {
    console.error('加载病史失败:', error)
  }
}

function handleAddMedicalHistory() {
  editingMedicalHistory.value = {
    condition_name: '',
    treatment_plan: {
      type: [],
      medication: '',
      frequency: '',
      notes: ''
    },
    visibility: 1
  }
  isEditingMedicalHistory.value = true
}

function handleEditMedicalHistory(history) {
  editingMedicalHistory.value = { ...history }
  isEditingMedicalHistory.value = true
}

async function handleSaveMedicalHistory(formData) {
  try {
    saving.value = true
    
    let res
    if (editingMedicalHistory.value.id) {
      // 更新病史
      res = await userApi.updateMedicalHistory(editingMedicalHistory.value.id, formData)
    } else {
      // 添加病史
      res = await userApi.addMedicalHistory({
        ...formData,
        user_id: userStore.userInfo?.user_id
      })
    }
    
    if (res.code === 1) {
      uni.showToast({ title: '保存成功', icon: 'none' })
      await loadMedicalHistories()
      isEditingMedicalHistory.value = false
      editingMedicalHistory.value = null
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } catch (error) {
    console.error('保存病史失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function handleCancelEditMedicalHistory() {
  isEditingMedicalHistory.value = false
  editingMedicalHistory.value = null
}

async function handleDeleteMedicalHistory(historyId) {
  try {
    uni.showLoading({ title: '删除中...' })
    
    const res = await userApi.deleteMedicalHistory(historyId, userStore.userInfo?.user_id)
    
    if (res.code === 1) {
      uni.showToast({ title: '删除成功', icon: 'none' })
      await loadMedicalHistories()
    } else {
      uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
    }
  } catch (error) {
    console.error('删除病史失败:', error)
    uni.showToast({ title: '删除失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style scoped>
.container {
  padding: 24rpx;
  min-height: 100vh;
  background: #FAE9DB;
  padding-bottom: 120rpx;
}

.header {
  padding: 24rpx 0;
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.row:last-child {
  margin-bottom: 0;
}

.avatar-row {
  justify-content: space-between;
}

.label {
  width: 160rpx;
  color: #624731;
  font-size: 28rpx;
}

.input {
  flex: 1;
  padding: 16rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.textarea {
  flex: 1;
  padding: 16rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  min-height: 80rpx;
}

.value {
  flex: 1;
  color: #333;
  font-size: 28rpx;
}

.btn {
  padding: 16rpx 24rpx;
  background: #eee;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.btn.primary {
  background: #F48224;
  color: #fff;
}

.btn:disabled {
  opacity: 0.5;
}

.link {
  color: #F48224;
  font-size: 28rpx;
  background: none;
  border: none;
  padding: 0;
}

.avatar-container {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #F48224;
}

.avatar-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  padding: 8rpx 0;
  border-bottom-left-radius: 60rpx;
  border-bottom-right-radius: 60rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: #F48224;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.save-btn:disabled {
  opacity: 0.5;
}

.modal {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 90%;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.modal-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 32rpx;
}

.picker {
  width: 160rpx;
  padding: 16rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  text-align: center;
}

.editing-container {
  padding: 20rpx;
}
</style>