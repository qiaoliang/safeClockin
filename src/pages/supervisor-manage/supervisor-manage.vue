<!-- pages/supervisor-manage/supervisor-manage.vue -->
<template>
  <view class="supervisor-manage-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <text class="header-title">
        监护管理
      </text>
      <text class="header-subtitle">
        查看与处理您的监督关系与邀请
      </text>
    </view>

    <!-- 我的监护 -->
    <view class="supervised-list-section">
      <view class="list-title">
        我的监护
      </view>
      <view class="supervised-list">
        <view
          v-for="person in mySupervised"
          :key="person.user_id"
          class="supervised-item"
          @click="goToSupervisorDetail(person)"
        >
          <view class="person-avatar">
            <image
              :src="person.avatar_url || '/static/logo.png'"
              class="avatar-image"
              mode="aspectFill"
            />
          </view>
          <view class="person-info">
            <text class="person-name">
              {{ person.nickname }}
            </text>
            <text class="person-rules">
              {{ formatRules(person.rules) }}
            </text>
          </view>
          <text class="arrow">
            ›
          </text>
        </view>
      </view>
    </view>

    <!-- 邀请列表 -->
    <view class="invitation-list-section">
      <view class="list-title">
        监督邀请
      </view>
      <view class="invitation-list">
        <view
          v-for="inv in receivedInvitations"
          :key="inv.relation_id"
          class="invitation-item"
          @click="openInvitation(inv)"
        >
          <view class="person-avatar">
            <image
              :src="inv.solo_user.avatar_url || '/static/logo.png'"
              class="avatar-image"
              mode="aspectFill"
            />
          </view>
          <view class="inv-info">
            <text class="inv-name">
              {{ inv.solo_user.nickname }}
            </text>
            <text class="inv-rule">
              {{ inv.rule?.rule_name || '全部规则' }}
            </text>
            <text class="inv-status">
              等待同意
            </text>
          </view>
          <text class="arrow">
            ›
          </text>
        </view>
      </view>
    </view>

    <!-- 邀请监护人按钮 -->
    <view class="invite-section">
      <button
        class="invite-btn"
        @click="createInviteLink"
      >
        <text class="invite-icon">
          +
        </text>
        <text class="invite-text">
          邀请监护人
        </text>
      </button>
    </view>

    <!-- 邀请详情弹窗 -->
    <view
      v-if="showInvitationModal"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            监督邀请
          </text>
        </view>
        <view class="modal-body">
          <text class="modal-text">
            来自：{{ selectedInvitation?.solo_user?.nickname }}
          </text>
          <text class="modal-subtext">
            规则：{{ selectedInvitation?.rule?.rule_name || '全部规则' }}
          </text>
          <text class="modal-subtext">
            时间：若是具体规则请在详情页查看
          </text>
        </view>
        <view class="modal-actions">
          <button
            class="modal-cancel-btn"
            @click="hideInvitation"
          >
            搁置
          </button>
          <button
            class="modal-danger-btn"
            @click="rejectSelected"
          >
            拒绝
          </button>
          <button
            class="modal-confirm-btn"
            @click="acceptSelected"
          >
            同意
          </button>
        </view>
      </view>
    </view>

    <!-- 分享链接弹窗 -->
    <view
      v-if="showShareModal"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            邀请链接
          </text>
        </view>
        <view class="modal-body">
          <text class="modal-subtext">
            复制以下链接或使用微信分享
          </text>
          <text class="modal-text">
            {{ lastInvitePath }}
          </text>
        </view>
        <view class="modal-actions">
          <button
            class="modal-cancel-btn"
            @click="hideShareModal"
          >
            关闭
          </button>
          <button
            class="modal-confirm-btn"
            @click="copyInvitePath"
          >
            复制
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useSupervisionStore } from '@/store/modules/supervision'
import { authApi } from '@/api/auth'

const supervisionStore = useSupervisionStore()
const mySupervised = ref([])
const receivedInvitations = ref([])

const showInvitationModal = ref(false)
const selectedInvitation = ref(null)

const formatRules = (rules=[]) => {
  const names = (rules || []).map(r => r.rule_name)
  return names.length ? names.join(' · ') : '全部规则'
}

const openInvitation = (inv) => {
  selectedInvitation.value = inv
  showInvitationModal.value = true
}
const hideInvitation = () => {
  showInvitationModal.value = false
  selectedInvitation.value = null
}

const acceptSelected = async () => {
  if (!selectedInvitation.value) return
  const res = await supervisionStore.acceptInvitation(selectedInvitation.value.relation_id)
  if (res.code === 1) {
    uni.showToast({ title: '已同意', icon: 'success' })
    hideInvitation()
    await supervisionStore.fetchInvitations('received')
    await supervisionStore.fetchMySupervised()
    receivedInvitations.value = supervisionStore.receivedInvitations
    mySupervised.value = supervisionStore.mySupervised
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

const rejectSelected = async () => {
  if (!selectedInvitation.value) return
  const res = await supervisionStore.rejectInvitation(selectedInvitation.value.relation_id)
  if (res.code === 1) {
    uni.showToast({ title: '已拒绝', icon: 'success' })
    hideInvitation()
    await supervisionStore.fetchInvitations('received')
    receivedInvitations.value = supervisionStore.receivedInvitations
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

const goToInviteSupervisor = () => {
  uni.navigateTo({ url: '/pages/invite-supervisor/invite-supervisor' })
}

const goToSupervisorDetail = (person) => {
  uni.navigateTo({ url: `/pages/supervisor-detail/supervisor-detail?userId=${person.user_id}` })
}

onLoad(async () => {
  await supervisionStore.fetchMySupervised()
  await supervisionStore.fetchInvitations('received')
  mySupervised.value = supervisionStore.mySupervised
  receivedInvitations.value = supervisionStore.receivedInvitations
})
</script>

<style scoped>
.supervisor-manage-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx 32rpx;
}

.header-section {
  margin-bottom: 48rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.header-subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.list-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 32rpx;
}
.avatar-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  border: 4rpx solid #F48224;
}

.supervised-list,.invitation-list{background:#fff;border-radius:24rpx;padding:32rpx;box-shadow:0 4rpx 16rpx rgba(0,0,0,0.08)}
.supervised-item,.invitation-item{display:flex;align-items:center;padding:24rpx 0;border-bottom:2rpx solid #F8F8F8}
.supervised-item:last-child,.invitation-item:last-child{border-bottom:none}
.person-avatar{margin-right:24rpx}
.person-info{flex:1}
.person-name,.inv-name{display:block;font-size:32rpx;font-weight:600;color:#333;margin-bottom:8rpx}
.person-rules,.inv-rule{display:block;font-size:24rpx;color:#666}
.inv-status{display:block;font-size:22rpx;color:#F48224;background:rgba(244,130,36,0.1);padding:4rpx 10rpx;border-radius:9999rpx;width:fit-content;margin-top:6rpx}
.arrow{font-size:32rpx;color:#999}

.invite-section {
  margin-top: 48rpx;
}

.invite-btn {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border-radius: 24rpx;
  padding: 32rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(244, 130, 36, 0.4);
}

.invite-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.invite-text {
  font-size: 32rpx;
  font-weight: 600;
}

/* 邀请弹窗样式 */
.modal-overlay {position: fixed;top: 0;left:0;width:100%;height:100%;background: rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:48rpx}
.modal-content {background:#fff;border-radius:24rpx;padding:48rpx;width:100%;max-width:600rpx;box-shadow:0 24rpx 48rpx rgba(0,0,0,0.2)}
.modal-header {text-align:center;margin-bottom:32rpx}
.modal-title {font-size:36rpx;font-weight:600;color:#624731}
.modal-body {margin-bottom:32rpx}
.modal-text {display:block;font-size:32rpx;color:#333;margin-bottom:12rpx}
.modal-subtext {display:block;font-size:28rpx;color:#666}
.modal-actions {display:flex;gap:16rpx;justify-content:flex-end}
.modal-confirm-btn {background:#E0F2FE;color:#0284C7;border-radius:16rpx;padding:16rpx 24rpx;font-size:24rpx;border:none}
.modal-danger-btn {background:#FEE2E2;color:#EF4444;border-radius:16rpx;padding:16rpx 24rpx;font-size:24rpx;border:none}
.modal-cancel-btn {background:#F3F4F6;color:#374151;border-radius:16rpx;padding:16rpx 24rpx;font-size:24rpx;border:none}
</style>
const showShareModal = ref(false)
const lastInvitePath = ref('')
const hideShareModal = () => { showShareModal.value = false }
const copyInvitePath = () => {
  if (!lastInvitePath.value) return
  uni.setClipboardData({ data: lastInvitePath.value, success(){ uni.showToast({ title:'已复制', icon:'none' }) } })
}

const createInviteLink = async () => {
  const res = await authApi.inviteSupervisorLink({ rule_ids: [] })
  if (res.code === 1) {
    lastInvitePath.value = res.data.mini_path
    showShareModal.value = true
  } else {
    uni.showToast({ title: res.msg || '生成邀请失败', icon: 'none' })
  }
}
