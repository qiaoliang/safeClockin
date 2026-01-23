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

    <!-- Section 1: 我的监护 -->
    <view class="section">
      <view class="section-title">
        我的监护
      </view>
      <view class="supervised-list">
        <SupervisedRuleItem
          v-for="person in mySupervised"
          :key="person.user_id"
          :user="person"
          :rules="person.rules"
          @click="goToSupervisorDetail(person)"
        />
        <view v-if="mySupervised.length === 0" class="empty-state">
          <text class="empty-text">暂无监护对象</text>
        </view>
      </view>
    </view>

    <!-- Section 2: 监督邀请 -->
    <view class="section">
      <view class="section-title">
        监督邀请
      </view>
      <BatchActionsToolbar
        :total-count="receivedInvitations.length"
        :selected-count="selectedInvitationIds.length"
        :show-select-all="receivedInvitations.length > 0"
        @select-all="handleSelectAllInvitations"
        @batch-accept="handleBatchAcceptInvitations"
        @batch-reject="handleBatchRejectInvitations"
      />
      <view class="invitation-list">
        <InvitationItem
          v-for="inv in receivedInvitations"
          :key="inv.relation_id"
          :invitation="inv"
          :selected="selectedInvitationIds.includes(inv.relation_id)"
          @select="toggleInvitationSelection"
          @accept="handleAcceptInvitation"
          @reject="handleRejectInvitation"
        />
        <view v-if="receivedInvitations.length === 0" class="empty-state">
          <text class="empty-text">暂无监督邀请</text>
        </view>
      </view>
    </view>

    <!-- Section 3: 我发起的邀请 -->
    <view class="section">
      <view class="section-title">
        我发起的邀请
      </view>
      <view class="sent-invitation-list">
        <view
          v-for="inv in sentInvitations"
          :key="inv.relation_id"
          class="sent-invitation-item"
        >
          <view class="sent-inv-avatar">
            <image
              :src="inv.invitee_info?.avatar_url || '/static/logo.png'"
              class="avatar-image"
              mode="aspectFill"
            />
          </view>
          <view class="sent-inv-info">
            <text class="sent-inv-name">
              {{ inv.invitee_info?.nickname || '未知用户' }}
            </text>
            <text class="sent-inv-rule">
              {{ inv.rule_info?.rule_name || '全部规则' }}
            </text>
            <text class="sent-inv-time">
              {{ formatTime(inv.created_at) }}
            </text>
          </view>
          <view class="sent-inv-actions">
            <text class="sent-inv-status" :class="getStatusClass(inv.status)">
              {{ getStatusText(inv.status) }}
            </text>
            <button
              v-if="inv.status === 1"
              class="withdraw-btn"
              @click="handleWithdrawInvitation(inv.relation_id)"
            >
              撤回
            </button>
          </view>
        </view>
        <view v-if="sentInvitations.length === 0" class="empty-state">
          <text class="empty-text">暂无发起的邀请</text>
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

    <!-- 分享链接弹窗 -->
    <view
      v-if="showShareModal"
      class="modal-overlay"
      @click="hideShareModal"
    >
      <view class="modal-content" @click.stop>
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
import SupervisedRuleItem from '@/components/SupervisedRuleItem.vue'
import InvitationItem from '@/components/InvitationItem.vue'
import BatchActionsToolbar from '@/components/BatchActionsToolbar.vue'

const supervisionStore = useSupervisionStore()

// 数据
const mySupervised = ref([])
const receivedInvitations = ref([])
const sentInvitations = ref([])
const selectedInvitationIds = ref([])

// 弹窗控制
const showShareModal = ref(false)
const lastInvitePath = ref('')

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '待处理',
    2: '已同意',
    3: '已拒绝',
    4: '已过期',
    5: '已撤回'
  }
  return statusMap[status] || '未知'
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    1: 'status-pending',
    2: 'status-accepted',
    3: 'status-rejected',
    4: 'status-expired',
    5: 'status-withdrawn'
  }
  return classMap[status] || ''
}

// 邀请选择处理
const toggleInvitationSelection = (relationId) => {
  const index = selectedInvitationIds.value.indexOf(relationId)
  if (index > -1) {
    selectedInvitationIds.value.splice(index, 1)
  } else {
    selectedInvitationIds.value.push(relationId)
  }
}

const handleSelectAllInvitations = () => {
  if (selectedInvitationIds.value.length === receivedInvitations.value.length) {
    selectedInvitationIds.value = []
  } else {
    selectedInvitationIds.value = receivedInvitations.value.map(inv => inv.relation_id)
  }
}

// 接受邀请
const handleAcceptInvitation = async (relationId) => {
  const res = await supervisionStore.acceptInvitation(relationId)
  if (res.code === 1) {
    uni.showToast({ title: '已同意', icon: 'success' })
    await refreshData()
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

// 拒绝邀请
const handleRejectInvitation = async (relationId) => {
  const res = await supervisionStore.rejectInvitation(relationId)
  if (res.code === 1) {
    uni.showToast({ title: '已拒绝', icon: 'success' })
    await refreshData()
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

// 批量接受邀请
const handleBatchAcceptInvitations = async () => {
  if (selectedInvitationIds.value.length === 0) {
    uni.showToast({ title: '请选择要接受的邀请', icon: 'none' })
    return
  }
  
  const res = await supervisionStore.batchAcceptInvitations(selectedInvitationIds.value)
  if (res.code === 1) {
    uni.showToast({ title: `已接受${res.data.success_count}个邀请`, icon: 'success' })
    selectedInvitationIds.value = []
    await refreshData()
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

// 批量拒绝邀请
const handleBatchRejectInvitations = async () => {
  if (selectedInvitationIds.value.length === 0) {
    uni.showToast({ title: '请选择要拒绝的邀请', icon: 'none' })
    return
  }
  
  const res = await supervisionStore.batchRejectInvitations(selectedInvitationIds.value)
  if (res.code === 1) {
    uni.showToast({ title: `已拒绝${res.data.success_count}个邀请`, icon: 'success' })
    selectedInvitationIds.value = []
    await refreshData()
  } else {
    uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
  }
}

// 撤回邀请
const handleWithdrawInvitation = async (invitationId) => {
  uni.showModal({
    title: '确认撤回',
    content: '确定要撤回这个邀请吗？',
    success: async (res) => {
      if (res.confirm) {
        const result = await supervisionStore.withdrawInvitation(invitationId)
        if (result.code === 1) {
          uni.showToast({ title: '已撤回', icon: 'success' })
          await refreshData()
        } else {
          uni.showToast({ title: result.msg || '撤回失败', icon: 'none' })
        }
      }
    }
  })
}

// 刷新数据
const refreshData = async () => {
  await supervisionStore.fetchMySupervised()
  await supervisionStore.fetchInvitations()
  await supervisionStore.fetchSentInvitations()

  mySupervised.value = supervisionStore.mySupervised
  receivedInvitations.value = supervisionStore.receivedInvitations
  sentInvitations.value = supervisionStore.sentInvitations || []
}

// 跳转到监护人详情
const goToSupervisorDetail = (person) => {
  uni.navigateTo({ url: `/pages/supervisor-detail/supervisor-detail?userId=${person.user_id}` })
}

// 分享弹窗
const hideShareModal = () => {
  showShareModal.value = false
}

const copyInvitePath = () => {
  if (!lastInvitePath.value) return
  uni.setClipboardData({
    data: lastInvitePath.value,
    success() {
      uni.showToast({ title: '已复制', icon: 'none' })
    }
  })
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

onLoad(async () => {
  await refreshData()
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

.section {
  margin-bottom: 48rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
}

.supervised-list,
.invitation-list,
.sent-invitation-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 我发起的邀请样式 */
.sent-invitation-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.sent-invitation-item:last-child {
  border-bottom: none;
}

.sent-inv-avatar {
  margin-right: 24rpx;
}

.avatar-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  border: 4rpx solid #F48224;
}

.sent-inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sent-inv-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.sent-inv-rule {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 6rpx;
}

.sent-inv-time {
  font-size: 22rpx;
  color: #999;
}

.sent-inv-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
}

.sent-inv-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 9999rpx;
}

.status-pending {
  color: #F48224;
  background: rgba(244, 130, 36, 0.1);
}

.status-accepted {
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
}

.status-rejected {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}

.status-expired {
  color: #999;
  background: rgba(153, 153, 153, 0.1);
}

.status-withdrawn {
  color: #6B7280;
  background: rgba(107, 114, 128, 0.1);
}

.withdraw-btn {
  background: #F3F4F6;
  color: #666;
  border: none;
  border-radius: 12rpx;
  padding: 8rpx 20rpx;
  font-size: 22rpx;
  line-height: 1;
}

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
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
}

.modal-body {
  margin-bottom: 32rpx;
}

.modal-text {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
  word-break: break-all;
}

.modal-subtext {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.modal-confirm-btn {
  background: #E0F2FE;
  color: #0284C7;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
}

.modal-cancel-btn {
  background: #F3F4F6;
  color: #374151;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
}
</style>