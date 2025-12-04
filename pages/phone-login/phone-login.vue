<template>
  <view class="container">
    <view class="tabs">
      <view :class="['tab', activeTab==='register'?'active':'']" @click="activeTab='register'">注册</view>
      <view :class="['tab', activeTab==='sms'?'active':'']" @click="activeTab='sms'">短信登录</view>
      <view :class="['tab', activeTab==='password'?'active':'']" @click="activeTab='password'">密码登录</view>
    </view>

    <view class="form">
      <view class="row">
        <picker mode="selector" :range="countryCodes" :value="countryIndex" @change="onCountryChange">
          <view class="picker">{{ countryCodes[countryIndex] }}</view>
        </picker>
        <input class="input" type="number" v-model="phone" placeholder="请输入手机号" />
      </view>

      <view v-if="activeTab!=='password'" class="row">
        <input class="input" type="number" v-model="code" placeholder="验证码" />
        <button class="code-btn" :disabled="countdown>0 || sending" @click="onSendCode">
          {{ countdown>0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </view>

      <view v-if="activeTab==='password' || activeTab==='register'" class="row">
        <input class="input" type="text" :password="true" v-model="password" placeholder="设置/输入密码（至少8位，含字母和数字）" />
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

const userStore = useUserStore()
const activeTab = ref('sms')
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
  if (activeTab.value==='register') return '注册'
  if (activeTab.value==='sms') return '短信登录'
  return '密码登录'
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
    const purpose = activeTab.value==='register' ? 'register' : (activeTab.value==='sms' ? 'login' : 'bind_phone')
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

async function onSubmit() {
  if (!phone.value) return uni.showToast({ title: '请输入手机号', icon: 'none' })
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
    } else if (activeTab.value==='sms') {
      if (!code.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
      const res = await authApi.loginPhoneCode({ phone: fullPhone.value, code: code.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    } else {
      if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
      const res = await authApi.loginPhonePassword({ phone: fullPhone.value, password: password.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function afterLogin(res) {
  const token = res.data?.token
  const refreshToken = res.data?.refresh_token
  if (token) {
    uni.setStorageSync('token', token)
  }
  if (refreshToken) {
    uni.setStorageSync('refreshToken', refreshToken)
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
  if(['register','sms','password'].includes(m)) activeTab.value = m
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
