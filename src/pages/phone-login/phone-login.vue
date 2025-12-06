<template>
  <view class="container">
    <view class="tabs">
      <view :class="['tab', activeTab==='register'?'active':'']" @click="activeTab='register'">注册</view>
      <view :class="['tab', activeTab==='login'?'active':'']" @click="activeTab='login'">手机登录</view>
    </view>

    <view class="form">
      <view class="row">
        <picker mode="selector" :range="countryCodes" :value="countryIndex" @change="onCountryChange">
          <view class="picker">{{ countryCodes[countryIndex] }}</view>
        </picker>
        <input class="input" type="number" v-model="phone" placeholder="请输入手机号" />
      </view>

      <view v-if="activeTab==='register' || activeTab==='login'" class="row">
        <input class="input" type="number" v-model="code" placeholder="验证码" />
        <button class="code-btn" :disabled="countdown>0 || sending" @click="onSendCode">
          {{ countdown>0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </view>

      <view v-if="activeTab==='register' || activeTab==='login'" class="row">
        <input class="input" type="password" v-model="password" :placeholder="activeTab==='register' ? '设置密码（至少8位，含字母和数字）' : '输入密码'" />
      </view>

      <view v-if="activeTab==='register'" class="agreement">
        <checkbox-group @change="onAgreeChange">
          <label class="agree-label">
            <checkbox value="agree" :checked="agree" />
            <text>我已阅读并同意《用户协议》《隐私政策》</text>
          </label>
        </checkbox-group>
      </view>

      <button class="submit" :disabled="submitting" @click="onSubmit">{{ submitText }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'
import { storage } from '@/store/modules/storage'

const userStore = useUserStore()
const activeTab = ref('login')
const countryCodes = ['+86', '+852', '+853', '+886']
const countryIndex = ref(0)
const phone = ref('')
const code = ref('')
const password = ref('')
const agree = ref(false)
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)
let timer = null

const fullPhone = computed(() => `${countryCodes[countryIndex.value]}${phone.value}`)
const submitText = computed(() => {
  return activeTab.value==='register' ? '注册' : '登录'
})

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function onCountryChange(e) {
  countryIndex.value = Number(e.detail.value || 0)
}

async function onSendCode() {
  if (!phone.value) {
    return uni.showToast({ title: '请输入手机号', icon: 'none' })
  }
  try {
    sending.value = true
    const purpose = activeTab.value==='register' ? 'register' : 'login'
    const res = await authApi.sendSmsCode({ phone: fullPhone.value, purpose })
    if (res.code === 1) {
      startCountdown()
      uni.showToast({ title: '验证码已发送', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    sending.value = false
  }
}

// 密码强度验证
function validatePassword(pwd) {
  if (!pwd) {
    return { valid: false, message: '请输入密码' }
  }
  if (pwd.length < 8) {
    return { valid: false, message: '密码至少8位' }
  }
  if (!/[a-zA-Z]/.test(pwd)) {
    return { valid: false, message: '密码需包含字母' }
  }
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, message: '密码需包含数字' }
  }
  return { valid: true }
}

async function onSubmit() {
  if (!phone.value) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  
  // 密码强度验证
  const passwordValidation = validatePassword(password.value)
  if (!passwordValidation.valid) {
    return uni.showToast({ title: passwordValidation.message, icon: 'none' })
  }
  
  submitting.value = true
  try {
    if (activeTab.value==='register') {
      if (!agree.value) return uni.showToast({ title: '需勾选协议', icon: 'none' })
      if (!code.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
      const res = await authApi.registerPhone({ phone: fullPhone.value, code: code.value, password: password.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        uni.showToast({ title: res.msg || '注册失败', icon: 'none' })
      }
    } else {
      // 手机登录需要同时验证验证码和密码
      if (!code.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
      const res = await authApi.loginPhone({ phone: fullPhone.value, code: code.value, password: password.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    }
  } catch (e) {
    console.error('登录失败:', e)
    const errorMsg = e.response?.data?.msg || '网络错误，请稍后重试'
    uni.showToast({ title: errorMsg, icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function afterLogin(res) {
  const token = res.data?.token
  const refreshToken = res.data?.refresh_token
  if (token) {
    // token 和 refreshToken 会在 userStore.login 中自动处理
    console.log('Token 会在 userStore.login 中自动保存')
  }
  if (refreshToken) {
    // token 和 refreshToken 会在 userStore.login 中自动处理
    console.log('RefreshToken 会在 userStore.login 中自动保存')
  }
  await userStore.fetchUserInfo()
  uni.switchTab({ url: '/pages/home-solo/home-solo' })
}

function onAgreeChange(e) {
  const vals = e.detail && e.detail.value ? e.detail.value : []
  agree.value = Array.isArray(vals) && vals.includes('agree')
}

onLoad((opts)=>{
  const m = String((opts && opts.mode) || '')
  if(['register','login'].includes(m)) activeTab.value = m
})
</script>

<style scoped>
.container { padding: 32rpx }
.tabs { display:flex; margin-bottom: 24rpx }
.tab { flex:1; text-align:center; padding: 24rpx; border-bottom: 4rpx solid #eee }
.tab.active { color:#F48224; border-color:#F48224 }
.form { background:#fff; border-radius: 16rpx; padding: 24rpx }
.row { display:flex; align-items:center; margin-bottom: 16rpx }
.picker { width: 160rpx; padding: 16rpx; border: 2rpx solid #ddd; border-radius: 8rpx; margin-right: 12rpx }
.input { flex:1; padding: 16rpx; border: 2rpx solid #ddd; border-radius: 8rpx }
.code-btn { margin-left: 12rpx; padding: 16rpx; background:#F48224; color:#fff; border-radius: 8rpx }
.agreement { display:flex; align-items:center; color:#666; margin: 12rpx 0 }
.agree-label { display:flex; align-items:center; gap: 12rpx }
.submit { width:100%; padding: 20rpx; background:#F48224; color:#fff; border-radius: 8rpx }
</style>
