<!-- pages/supervisor-manage/supervisor-manage.vue -->
<template>
  <view class="supervisor-manage-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <text class="header-title">监护人管理</text>
      <text class="header-subtitle">管理关注您的亲友监督人</text>
    </view>

    <!-- 监护人列表 -->
    <view class="supervisor-list-section">
      <view class="list-title">我的监护人</view>
      <view class="supervisor-list">
        <view 
          class="supervisor-item"
          v-for="supervisor in supervisorList"
          :key="supervisor.user_id"
        >
          <view class="supervisor-avatar">
            <image 
              :src="supervisor.avatar_url || '/static/logo.png'" 
              class="avatar-image"
              mode="aspectFill"
            ></image>
          </view>
          <view class="supervisor-info">
            <text class="supervisor-name">{{ supervisor.nickname }}</text>
            <text class="supervisor-status">可查看您的打卡记录</text>
          </view>
          <button class="remove-btn" @click="showRemoveModal(supervisor)">移除</button>
        </view>
      </view>
    </view>

    <!-- 邀请监护人按钮 -->
    <view class="invite-section">
      <button class="invite-btn" @click="goToInviteSupervisor">
        <text class="invite-icon">+</text>
        <text class="invite-text">邀请监护人</text>
      </button>
    </view>

    <!-- 移除确认弹窗 -->
    <view class="modal-overlay" v-if="showRemoveConfirm">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">移除监护人</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">确定要移除 {{ selectedSupervisor?.nickname }} 作为您的监督人吗？</text>
          <text class="modal-subtext">移除后他们将无法查看您的打卡记录。</text>
        </div>
        <view class="modal-actions">
          <button class="modal-cancel-btn" @click="hideRemoveModal">取消</button>
          <button class="modal-confirm-btn" @click="confirmRemove">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const supervisorList = ref([
  {
    user_id: 1,
    nickname: '儿子-小明',
    avatar_url: '/static/logo.png',
    status: 'active'
  },
  {
    user_id: 2,
    nickname: '女儿-小红',
    avatar_url: '/static/logo.png',
    status: 'active'
  },
  {
    user_id: 3,
    nickname: '邻居-张阿姨',
    avatar_url: '/static/logo.png',
    status: 'active'
  }
])

const showRemoveConfirm = ref(false)
const selectedSupervisor = ref(null)

// 显示移除确认弹窗
const showRemoveModal = (supervisor) => {
  selectedSupervisor.value = supervisor
  showRemoveConfirm.value = true
}

// 隐藏移除确认弹窗
const hideRemoveModal = () => {
  showRemoveConfirm.value = false
  selectedSupervisor.value = null
}

// 确认移除监护人
const confirmRemove = async () => {
  try {
    // 这里应调用API移除监护人关系
    // 模拟API调用
    uni.showLoading({
      title: '移除中...'
    })
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uni.hideLoading()
    
    // 从本地列表中移除
    const index = supervisorList.value.findIndex(s => s.user_id === selectedSupervisor.value.user_id)
    if (index !== -1) {
      supervisorList.value.splice(index, 1)
    }
    
    uni.showToast({
      title: '移除成功',
      icon: 'success'
    })
    
    hideRemoveModal()
  } catch (error) {
    console.error('移除监护人失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '移除失败',
      icon: 'none'
    })
  }
}

// 跳转到邀请监护人页面
const goToInviteSupervisor = () => {
  uni.navigateTo({
    url: '/pages/invite-supervisor/invite-supervisor'
  })
}
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

.supervisor-list {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.supervisor-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.supervisor-item:last-child {
  border-bottom: none;
}

.supervisor-avatar {
  margin-right: 24rpx;
}

.avatar-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  border: 4rpx solid #F48224;
}

.supervisor-info {
  flex: 1;
}

.supervisor-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.supervisor-status {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.remove-btn {
  background: #FEE2E2;
  color: #EF4444;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
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

/* 模态框样式 */
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
  background: white;
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
  margin-bottom: 48rpx;
}

.modal-text {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 16rpx;
  text-align: center;
}

.modal-subtext {
  display: block;
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-cancel-btn {
  flex: 1;
  height: 80rpx;
  background: #F5F5F5;
  border: none;
  border-radius: 16rpx;
  color: #666;
  font-size: 32rpx;
  font-weight: 500;
}

.modal-confirm-btn {
  flex: 1;
  height: 80rpx;
  background: #EF4444;
  border: none;
  border-radius: 16rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}
</style>