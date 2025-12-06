<template>
  <view class="container">
    <view class="card">
      <view class="row">
        <text class="label">昵称</text>
        <input class="input" v-model="nickName" placeholder="请输入昵称" />
        <button class="btn" @click="saveNickname" :disabled="savingNick">保存</button>
      </view>

      <view class="row">
        <text class="label">手机号</text>
        <text class="value">{{ displayPhone }}</text>
        <button class="link" @click="openPhoneBind">{{ phoneBindText }}</button>
      </view>

      <view class="row">
        <text class="label">微信号</text>
        <text class="value">{{ displayWechat }}</text>
        <button class="link" @click="bindWechat">{{ wechatBindText }}</button>
      </view>
    </view>

    <view v-if="phoneModal" class="modal">
      <view class="modal-card">
        <text class="modal-title">绑定/更换手机号</text>
        <view class="row">
          <picker mode="selector" :range="countryCodes" :value="countryIndex" @change="onCountryChange">
            <view class="picker">{{ countryCodes[countryIndex] }}</view>
          </picker>
          <input class="input" type="number" v-model="phone" placeholder="请输入手机号" />
        </view>
        <view class="row">
          <input class="input" type="number" v-model="code" placeholder="验证码" />
          <button class="btn" :disabled="countdown>0 || sending" @click="sendCode">{{ countdown>0? `${countdown}s` : '获取验证码' }}</button>
        </view>
        <view class="row">
          <button class="btn primary" :disabled="binding" @click="confirmBindPhone">确认绑定</button>
          <button class="btn" @click="closePhoneBind">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { authApi } from '@/api/auth'

const userStore = useUserStore()
const nickName = ref(userStore.userInfo?.nickName || '')
const savingNick = ref(false)

const displayPhone = computed(() => userStore.userInfo?.phoneNumber || '未关联')
const displayWechat = computed(() => userStore.userInfo?.wechatOpenid ? maskOpenid(userStore.userInfo.wechatOpenid) : '未关联')
const phoneBindText = computed(() => (userStore.userInfo?.phoneNumber ? '更换' : '关联'))
const wechatBindText = computed(() => (userStore.userInfo?.wechatOpenid ? '更换' : '关联'))

function maskOpenid(id) { return id.length > 8 ? id.slice(0,4)+'****'+id.slice(-4) : id }

async function saveNickname() {
  if (!nickName.value) return uni.showToast({ title: '请输入昵称', icon: 'none' })
  try {
    savingNick.value = true
    const res = await authApi.updateUserProfile({ nickname: nickName.value })
    if (res.code === 1) {
      await userStore.fetchUserInfo()
      uni.showToast({ title: '昵称已更新', icon: 'none' })
    } else {
      uni.showToast({ title: res.msg || '更新失败', icon: 'none' })
    }
  } finally { savingNick.value = false }
}

// Phone bind modal
const phoneModal = ref(false)
const countryCodes = ['+86', '+852', '+853', '+886']
const countryIndex = ref(0)
const phone = ref('')
const code = ref('')
const sending = ref(false)
const countdown = ref(0)
const binding = ref(false)
let timer = null

function openPhoneBind() { phoneModal.value = true }
function closePhoneBind() { phoneModal.value = false; code.value=''; phone.value=''; stopCountdown() }
function onCountryChange(e){ countryIndex.value = Number(e.detail.value || 0) }
function fullPhone(){ return `${countryCodes[countryIndex.value]}${phone.value}` }
function startCountdown(){ countdown.value=60; timer=setInterval(()=>{countdown.value-=1; if(countdown.value<=0) stopCountdown()},1000) }
function stopCountdown(){ if(timer){ clearInterval(timer); timer=null }; countdown.value=0 }

async function sendCode(){
  if(!phone.value) return uni.showToast({ title:'请输入手机号', icon:'none' })
  try{
    sending.value=true
    const res = await authApi.sendSmsCode({ phone: fullPhone(), purpose: 'bind_phone' })
    if(res.code===1){ startCountdown(); uni.showToast({ title:'验证码已发送', icon:'none' }) }
    else{ uni.showToast({ title: res.msg || '发送失败', icon:'none' }) }
  }finally{ sending.value=false }
}

async function confirmBindPhone(){
  if(!phone.value || !code.value) return uni.showToast({ title:'请输入手机号和验证码', icon:'none' })
  try{
    binding.value=true
    const res = await authApi.bindPhone({ phone: fullPhone(), code: code.value })
    if(res.code===1){ await userStore.fetchUserInfo(); closePhoneBind(); uni.showToast({ title:'手机号已关联', icon:'none' }) }
    else{ uni.showToast({ title: res.msg || '绑定失败', icon:'none' }) }
  }finally{ binding.value=false }
}

async function bindWechat(){
  uni.showModal({ title:'提示', content:'将发起微信授权以绑定/更换微信账号，确认继续？', success: async (res)=>{
    if(!res.confirm) return
    try{
      const loginRes = await uni.login()
      if(!loginRes.code) return uni.showToast({ title:'微信授权失败', icon:'none' })
      const r = await authApi.bindWechat({ code: loginRes.code })
      if(r.code===1){ await userStore.fetchUserInfo(); uni.showToast({ title:'微信已关联', icon:'none' }) }
      else{ uni.showToast({ title: r.msg || '绑定失败', icon:'none' }) }
    }catch(e){ uni.showToast({ title:'网络错误', icon:'none' }) }
  }})
}
</script>

<style scoped>
.container{ padding:24rpx; min-height:100vh; background: #FAE9DB }
.card{ background:#fff; border-radius:24rpx; padding:24rpx }
.row{ display:flex; align-items:center; gap:12rpx; margin-bottom:16rpx }
.label{ width:160rpx; color:#624731 }
.input{ flex:1; padding: 16rpx; border: 2rpx solid #ddd; border-radius: 8rpx }
.value{ flex:1; color:#333 }
.btn{ padding: 16rpx 24rpx; background:#eee; border-radius: 8rpx }
.btn.primary{ background:#F48224; color:#fff }
.link{ color:#F48224 }
.modal{ position: fixed; left:0; top:0; right:0; bottom:0; background: rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center }
.modal-card{ width: 90%; background:#fff; border-radius:16rpx; padding:24rpx }
.picker{ width:160rpx; padding: 16rpx; border: 2rpx solid #ddd; border-radius: 8rpx }
</style>
