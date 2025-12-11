<template>
  <view class="invite-container">
    <view class="header">
      <text class="title">
        监督邀请
      </text>
      <text class="subtitle">
        点击同意建立监督关系
      </text>
    </view>

    <view
      v-if="errorMsg"
      class="error"
    >
      {{ errorMsg }}
    </view>

    <view
      v-if="relation"
      class="card"
    >
      <text class="row">
        邀请人用户ID：{{ relation.solo_user_id }}
      </text>
      <text class="row">
        规则：{{ relation.rule_id ? relation.rule_id : '全部规则' }}
      </text>
      <view class="actions">
        <button
          class="btn danger"
          @click="doReject"
        >
          拒绝
        </button>
        <button
          class="btn"
          @click="doAccept"
        >
          同意
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { authApi } from '@/api/auth'

const token = ref('')
const relation = ref(null)
const errorMsg = ref('')

onLoad(async (query) => {
  token.value = query?.token || ''
  if (!token.value) {
    errorMsg.value = '邀请参数缺失'
    return
  }
  const res = await authApi.resolveInviteToken({ token: token.value })
  if (res.code === 1) {
    relation.value = res.data
  } else {
    errorMsg.value = res.msg || '邀请解析失败'
  }
})

const doAccept = async () => {
  if (!relation.value) return
  const r = await authApi.acceptSupervisionInvitation({ relation_id: relation.value.relation_id })
  if (r.code === 1) {
    uni.showToast({ title: '已同意', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/supervisor-manage/supervisor-manage' }), 1000)
  } else {
    uni.showToast({ title: r.msg || '处理失败', icon: 'none' })
  }
}

const doReject = async () => {
  if (!relation.value) return
  const r = await authApi.rejectSupervisionInvitation({ relation_id: relation.value.relation_id })
  if (r.code === 1) {
    uni.showToast({ title: '已拒绝', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/supervisor-manage/supervisor-manage' }), 1000)
  } else {
    uni.showToast({ title: r.msg || '处理失败', icon: 'none' })
  }
}

// 分享给朋友
onShareAppMessage((res) => {
  return {
    title: '安全守护 - 监督邀请',
    path: '/pages/supervisor-invite/supervisor-invite',
    imageUrl: '/static/share-logo.png'
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  return {
    title: '安全守护 - 监督邀请',
    query: '',
    imageUrl: '/static/share-logo.png'
  }
})
</script>

<style scoped>
.invite-container{min-height:100vh;background:linear-gradient(135deg,#FAE9DB 0%,#F8E0D0 100%);padding:48rpx 32rpx}
.header{text-align:center;margin-bottom:24rpx}
.title{display:block;font-size:44rpx;font-weight:700;color:#624731;margin-bottom:8rpx}
.subtitle{display:block;font-size:26rpx;color:#666}
.error{background:#FEE2E2;color:#EF4444;border-radius:16rpx;padding:24rpx;text-align:center}
.card{background:#fff;border-radius:24rpx;padding:32rpx;margin-top:24rpx;box-shadow:0 4rpx 16rpx rgba(0,0,0,0.08)}
.row{display:block;font-size:28rpx;color:#333;margin-bottom:12rpx}
.actions{display:flex;gap:16rpx;justify-content:flex-end;margin-top:16rpx}
.btn{background:#E0F2FE;color:#0284C7;border-radius:16rpx;padding:16rpx 24rpx;font-size:24rpx;border:none}
.btn.danger{background:#FEE2E2;color:#EF4444}
</style>
