<template>
  <view class="container">
    <view class="header">
      <text class="title">
        编辑个人资料
      </text>
    </view>

    <!-- 基本信息区域 -->
    <view class="card">
      <view class="card-title">
        个人信息
      </view>

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

      <!-- 性别 -->
      <view class="row">
        <text class="label">
          性别
        </text>
        <picker
          :value="genderIndex"
          :range="genderOptions"
          @change="onGenderChange"
        >
          <view class="picker-value">
            {{ formData.gender ? genderText(formData.gender) : '请选择性别' }}
          </view>
        </picker>
      </view>

      <!-- 出生日期 -->
      <view class="row">
        <text class="label">
          出生日期
        </text>
        <picker
          mode="date"
          :value="formData.birth_date"
          @change="onBirthDateChange"
        >
          <view class="picker-value">
            {{ formData.birth_date || '请选择出生日期' }}
          </view>
        </picker>
      </view>

      <!-- 紧急联系人 -->
      <view class="section-title">
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

      <!-- 保存基本信息按钮 -->
      <view class="save-section">
        <button
          class="save-btn"
          :disabled="savingBasic"
          @click="saveBasicInfo"
        >
          {{ savingBasic ? '保存中...' : '保存基本信息' }}
        </button>
      </view>
    </view>

    <!-- 病史信息区域 -->
    <view class="card">
      <view class="card-title">
        病史记录
      </view>

      <view
        v-if="loadingMedicalHistory"
        class="loading-state"
      >
        <text class="loading-text">
          加载中...
        </text>
      </view>

      <MedicalHistoryList
        v-else-if="!isEditingMedicalHistory"
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

      <view
        v-if="medicalHistories.length === 0 && !isEditingMedicalHistory"
        class="empty-state"
      >
        <text class="empty-text">
          暂无病史记录
        </text>
      </view>
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
import { getUserMedicalHistories, addMedicalHistory, updateMedicalHistory, deleteMedicalHistory } from '@/api/user'
import MedicalHistoryList from '@/components/medical-history/MedicalHistoryList.vue'
import MedicalHistoryForm from '@/components/medical-history/MedicalHistoryForm.vue'

const userStore = useUserStore()

// 保存状态
const savingBasic = ref(false)
const savingMedical = ref(false)

// 表单数据
const formData = ref({
  nickname: '',
  name: '',
  address: '',
  motto: '',
  gender: '',
  birth_date: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_address: '',
  avatar_url: ''
})

// 性别选项
const genderOptions = ['男', '女', '其他']

function genderText(value) {
  const map = { male: '男', female: '女', other: '其他' }
  return map[value] || value || ''
}

const genderIndex = computed(() => {
  const map = { male: 0, female: 1, other: 2 }
  return map[formData.value.gender] ?? -1
})

function onGenderChange(e) {
  const index = parseInt(e.detail.value)
  const values = ['male', 'female', 'other']
  formData.value.gender = values[index]
}

function onBirthDateChange(e) {
  formData.value.birth_date = e.detail.value
}

const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const displayPhone = computed(() => {
  const phone = userStore.userInfo?.phoneNumber
  if (!phone) return '未关联'
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
  return phone
})
const phoneBindText = computed(() => (userStore.userInfo?.phoneNumber ? '更换' : '关联'))

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
const loadingMedicalHistory = ref(false)
const isEditingMedicalHistory = ref(false)
const editingMedicalHistory = ref(null)

onMounted(() => {
  // 加载用户数据
  const userInfo = userStore.userInfo
  if (userInfo) {
    formData.value = {
      nickname: userInfo.nickname || userInfo.nickName || '',
      name: userInfo.name || '',
      address: userInfo.address || '',
      motto: userInfo.motto || '',
      gender: userInfo.gender || '',
      birth_date: userInfo.birth_date || userInfo.birthDate || '',
      emergency_contact_name: userInfo.emergency_contact_name || userInfo.emergencyContactName || '',
      emergency_contact_phone: userInfo.emergency_contact_phone || userInfo.emergencyContactPhone || '',
      emergency_contact_address: userInfo.emergency_contact_address || userInfo.emergencyContactAddress || '',
      avatar_url: userInfo.avatarUrl || userInfo.avatar_url || ''
    }
  }

  // 加载病史数据
  loadMedicalHistories()
})

/**
 * 保存基本信息
 */
async function saveBasicInfo() {
  if (!formData.value.nickname.trim()) {
    return uni.showToast({ title: '请输入昵称', icon: 'none' })
  }

  try {
    savingBasic.value = true

    const updateData = {
      nickname: formData.value.nickname || '',
      nickName: formData.value.nickname || '',
      name: formData.value.name,
      address: formData.value.address,
      motto: formData.value.motto,
      gender: formData.value.gender,
      birthDate: formData.value.birth_date,
      emergencyContactName: formData.value.emergency_contact_name,
      emergencyContactPhone: formData.value.emergency_contact_phone,
      emergencyContactAddress: formData.value.emergency_contact_address
    }

    const res = await authApi.updateUserProfile(updateData)

    if (res.code === 1) {
      await userStore.fetchUserInfo()
      uni.showToast({ title: '基本信息已保存', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } catch (error) {
    console.error('保存基本信息失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    savingBasic.value = false
  }
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
  const userId = userStore.userInfo?.userId || userStore.userInfo?.user_id
  if (!userId) {
    return
  }

  try {
    loadingMedicalHistory.value = true
    const res = await getUserMedicalHistories(userId)

    if (res.code === 1) {
      if (Array.isArray(res.data)) {
        medicalHistories.value = res.data
      } else if (res.data && typeof res.data === 'object') {
        medicalHistories.value = res.data.histories || res.data.list || res.data.items || res.data.medical_history || []
      } else {
        medicalHistories.value = []
      }
    }
  } catch (error) {
    console.error('加载病史失败:', error)
  } finally {
    loadingMedicalHistory.value = false
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
    savingMedical.value = true

    let res
    if (editingMedicalHistory.value.id) {
      // 更新病史
      res = await updateMedicalHistory(editingMedicalHistory.value.id, {
        ...formData,
        user_id: userStore.userInfo?.userId || userStore.userInfo?.user_id
      })
    } else {
      // 添加病史
      res = await addMedicalHistory({
        ...formData,
        user_id: userStore.userInfo?.userId || userStore.userInfo?.user_id
      })
    }

    if (res.code === 1) {
      uni.showToast({ title: '病史已保存', icon: 'none' })
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
    savingMedical.value = false
  }
}

function handleCancelEditMedicalHistory() {
  isEditingMedicalHistory.value = false
  editingMedicalHistory.value = null
}

async function handleDeleteMedicalHistory(historyId) {
  try {
    uni.showLoading({ title: '删除中...' })
    
    const res = await deleteMedicalHistory(historyId, userStore.userInfo?.userId || userStore.userInfo?.user_id)
    
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

<style scoped lang="scss">
@import '@/uni.scss';

.container {
  padding: $uni-spacing-xl;
  min-height: 100vh;
  background: $uni-bg-primary;
  padding-bottom: $uni-spacing-xl;
}

.header {
  padding: $uni-spacing-xl 0;
  text-align: center;
}

.title {
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-bold;
  color: $uni-accent;
}

.card {
  background: $uni-white;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xl;
  margin-bottom: $uni-spacing-xl;
}

.card-title {
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-bold;
  color: $uni-accent;
  margin-bottom: $uni-spacing-xl;
  padding-bottom: $uni-spacing-base;
  border-bottom: 2rpx solid $uni-border-1;
}

.section-title {
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;
  color: $uni-accent;
  margin: $uni-spacing-xxl 0 $uni-spacing-xl 0;
  padding-top: $uni-spacing-base;
  border-top: 2rpx solid $uni-border-1;
}

.row {
  display: flex;
  align-items: center;
  gap: $uni-spacing-md;
  margin-bottom: $uni-spacing-xl;
}

.row:last-child {
  margin-bottom: 0;
}

.avatar-row {
  justify-content: space-between;
}

.label {
  width: 160rpx;
  color: $uni-accent;
  font-size: $uni-font-size-base;
}

.input {
  flex: 1;
  padding: $uni-spacing-base;
  border: 2rpx solid $uni-border-input;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-base;
}

.textarea {
  flex: 1;
  padding: $uni-spacing-base;
  border: 2rpx solid $uni-border-input;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-base;
  min-height: 80rpx;
}

.value {
  flex: 1;
  color: $uni-main-color;
  font-size: $uni-font-size-base;
}

.btn {
  padding: $uni-spacing-base $uni-spacing-lg;
  background: $uni-bg-color-grey;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-base;
  color: $uni-main-color;
}

.btn.primary {
  background: $uni-primary;
  color: $uni-white;
}

.btn:disabled {
  opacity: 0.5;
}

.link {
  color: $uni-primary;
  font-size: $uni-font-size-base;
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
  border: 4rpx solid $uni-primary;
}

.avatar-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: $uni-bg-overlay;
  color: $uni-white;
  font-size: $uni-font-size-xxs;
  text-align: center;
  padding: $uni-spacing-xs 0;
  border-bottom-left-radius: 60rpx;
  border-bottom-right-radius: 60rpx;
}

.save-btn {
  width: 100%;
  height: 88rpx;
  background: $uni-primary;
  color: $uni-white;
  border-radius: $uni-radius-xxl;
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-bold;
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
  background: $uni-mask-light;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 90%;
  background: $uni-white;
  border-radius: $uni-radius-md;
  padding: $uni-spacing-xl;
}

.modal-title {
  display: block;
  text-align: center;
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-bold;
  color: $uni-main-color;
  margin-bottom: $uni-spacing-xxl;
}

.picker {
  flex: 1;
  padding: $uni-spacing-base;
  border: 2rpx solid $uni-border-input;
  border-radius: $uni-radius-sm;
  text-align: center;
}

.picker-value {
  flex: 1;
  padding: $uni-spacing-base;
  color: $uni-main-color;
  font-size: $uni-font-size-base;
}

.editing-container {
  padding: $uni-spacing-lg;
}

.save-section {
  margin-top: $uni-spacing-xxl;
  padding-top: $uni-spacing-xl;
  border-top: 2rpx solid $uni-border-1;
}

.loading-state {
  padding: $uni-spacing-xxxl;
  text-align: center;
}

.loading-text {
  color: $uni-text-secondary;
  font-size: $uni-font-size-base;
}

.empty-state {
  padding: $uni-spacing-xxxl;
  text-align: center;
}

.empty-text {
  display: block;
  color: $uni-text-secondary;
  font-size: $uni-font-size-base;
  margin-bottom: $uni-spacing-sm;
}
</style>