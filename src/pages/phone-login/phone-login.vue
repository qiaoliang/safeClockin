<template>
  <view class="container">
    <view class="tabs">
      <view
        :class="['tab', activeTab==='register'?'active':'']"
        @click="activeTab='register'"
      >
        注册
      </view>
      <view
        :class="['tab', activeTab==='login-code'?'active':'']"
        @click="activeTab='login-code'"
      >
        验证码登录
      </view>
      <view
        :class="['tab', activeTab==='login-password'?'active':'']"
        @click="activeTab='login-password'"
      >
        密码登录
      </view>
    </view>

    <view class="form">
      <view class="row">
        <input
          v-model="phone"
          class="input"
          type="number"
          placeholder="请输入手机号"
        >
      </view>

      <view
        v-if="activeTab==='register' || activeTab==='login-code'"
        class="row"
      >
        <input
          v-model="code"
          class="input"
          type="number"
          placeholder="验证码"
        >
        <button
          class="code-btn"
          :disabled="countdown>0 || sending"
          @click="onSendCode"
        >
          {{ countdown>0 ? `${countdown}s` : '获取验证码' }}
        </button>
      </view>

      <view
        v-if="activeTab==='register' || activeTab==='login-password'"
        class="row"
      >
        <input
          v-model="password"
          class="input"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="activeTab==='register' ? '设置密码（至少8位，含字母和数字）' : '输入密码'"
        >
        <text
          class="password-toggle"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? '👁️' : '👁️‍🗨️' }}
        </text>
      </view>

      <view
        v-if="activeTab==='login-password'"
        class="row-options"
      >
        <view
          class="remember-me"
          @click="rememberMe = !rememberMe"
        >
          <checkbox :checked="rememberMe" />
          <text>记住手机号</text>
        </view>
        <text
          class="forgot-password"
          @click="goToForgotPassword"
        >
          忘记密码？
        </text>
      </view>

      <view
        v-if="activeTab==='register'"
        class="agreement"
      >
        <checkbox-group @change="onAgreeChange">
          <label class="agree-label">
            <checkbox
              value="agree"
              :checked="agree"
            />
            <text>我已阅读并同意《用户协议》《隐私政策》</text>
          </label>
        </checkbox-group>
      </view>

      <button
        class="submit"
        :disabled="submitting"
        @click="onSubmit"
      >
        {{ submitText }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const activeTab = ref('login-code')
const phone = ref('')
const code = ref('')
const password = ref('')
const agree = ref(false)
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
let timer = null

const fullPhone = computed(() => phone.value)
const submitText = computed(() => {
  if (activeTab.value === 'register') return '注册'
  if (activeTab.value === 'login-code') return '验证码登录'
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
      
      // 从 localStorage 加载记住的手机号
      const savedPhone = uni.getStorageSync('remembered_phone')
      if (savedPhone) {
        phone.value = savedPhone
        rememberMe.value = true
      }
      
      async function onSendCode() {
  if (!phone.value) {
    return uni.showToast({ title: '请输入手机号', icon: 'none' })
  }
  try {
    sending.value = true
    const purpose = activeTab.value === 'register' ? 'register' : 'login'
    
    const res = await authApi.sendSmsCode({ phone: fullPhone.value, purpose })
    
    if (res.code === 1) {
      startCountdown()
      uni.showToast({ title: '验证码已发送', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
    }
  } catch (e) {
    console.error('发送验证码失败:', e)
    uni.showToast({ title: '网络错误，请重试', icon: 'none' })
  } finally {
    sending.value = false
  }
}

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

function goToForgotPassword() {
  uni.navigateTo({ url: '/pages/forgot-password/forgot-password' })
}

async function onSubmit() {
  if (!phone.value) return uni.showToast({ title: '请输入手机号', icon: 'none' })
  
  submitting.value = true
  try {
    if (activeTab.value === 'register') {
      const passwordValidation = validatePassword(password.value)
      if (!passwordValidation.valid) {
        return uni.showToast({ title: passwordValidation.message, icon: 'none' })
      }
      
      if (!agree.value) return uni.showToast({ title: '需勾选协议', icon: 'none' })
      if (!code.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
      
      const res = await authApi.registerPhone({ phone: fullPhone.value, code: code.value, password: password.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        if (res.data && res.data.code === 'PHONE_EXISTS') {
          uni.showToast({ title: '该手机号已注册，请直接登录', icon: 'none' })
          activeTab.value = 'login-code'
          code.value = ''
        } else {
          uni.showToast({ title: res.msg || '注册失败', icon: 'none' })
        }
      }
    } else if (activeTab.value === 'login-code') {
      if (!code.value) return uni.showToast({ title: '请输入验证码', icon: 'none' })
      
      const res = await authApi.loginPhoneCode({ phone: fullPhone.value, code: code.value })
      if (res.code === 1) {
        await afterLogin(res)
      } else {
        if (res.data && res.data.code === 'USER_NOT_FOUND') {
          uni.showToast({ title: '账号不存在，请先注册', icon: 'none' })
          activeTab.value = 'register'
          code.value = ''
        } else {
          uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
        }
      }
    } else if (activeTab.value === 'login-password') {
      if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
      
      const res = await authApi.loginPhonePassword({ phone: fullPhone.value, password: password.value })
      if (res.code === 1) {
        // 记住手机号
        if (rememberMe.value) {
          uni.setStorageSync('remembered_phone', phone.value)
        } else {
          uni.removeStorageSync('remembered_phone')
        }
        await afterLogin(res)
      } else {
        uni.showToast({ title: res.msg || '登录失败', icon: 'none' })
      }
    }
  } catch (e) {
    console.error('登录失败:', e)
    let errorMsg = '登录失败，请重试'
    
    if (e.response) {
      if (e.response.status === 401) {
        errorMsg = '认证失败，请重新登录'
        userStore.logout()
      } else if (e.response.data && e.response.data.msg) {
        errorMsg = e.response.data.msg
      }
    } else if (e.request) {
      errorMsg = '网络连接失败，请检查网络设置'
    } else {
      errorMsg = e.message || '未知错误'
    }
    
    uni.showToast({ title: errorMsg, icon: 'none' })
    
    if (errorMsg.includes('认证') || errorMsg.includes('token')) {
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/login' })
      }, 1500)
    }
  } finally {
    submitting.value = false
  }
}

async function afterLogin(res) {
  try {
    await userStore.processLoginSuccess(res, '手机')
    uni.switchTab({ url: '/pages/home-solo/home-solo' })
  } catch (error) {
    console.error('登录后处理失败:', error)
    uni.showToast({ title: '登录处理失败', icon: 'none' })
  }
}

function onAgreeChange(e) {
  const vals = e.detail && e.detail.value ? e.detail.value : []
  agree.value = Array.isArray(vals) && vals.includes('agree')
}

onLoad((opts)=>{
  const m = String((opts && opts.mode) || '')
  if(m === 'register') activeTab.value = 'register'
  else if(m === 'login') activeTab.value = 'login-code'
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.container { padding: $uni-font-size-xl }
.tabs { display:flex; margin-bottom: $uni-font-size-base }
.tab { flex:1; text-align:center; padding: $uni-font-size-base; border-bottom: 4rpx solid #eee }
.tab.active { color:$uni-primary; border-color:$uni-primary }
.form { background:$uni-bg-color-white; border-radius: $uni-radius-lg; padding: $uni-font-size-base }
.row { display:flex; align-items:center; margin-bottom: $uni-radius-base }
.input { flex:1; padding: $uni-radius-base; border: 2rpx solid #ddd; border-radius: 8rpx }
.code-btn { margin-left: 12rpx; padding: $uni-radius-base; background:$uni-primary; color:$uni-bg-color-white; border-radius: 8rpx }
.password-toggle { padding: 0 12rpx; font-size: 32rpx; cursor: pointer }
.row-options { display:flex; justify-content:space-between; align-items:center; margin-bottom: $uni-radius-base }
.remember-me { display:flex; align-items:center; gap: 8rpx; color:$uni-base-color }
.forgot-password { color:$uni-primary; cursor: pointer }
.agreement { display:flex; align-items:center; color:$uni-base-color; margin: $uni-radius-base 0 }
.agree-label { display:flex; align-items:center; gap: $uni-radius-base }
.submit { width:100%; padding: 20rpx; background:$uni-primary; color:$uni-bg-color-white; border-radius: 8rpx }
</style>