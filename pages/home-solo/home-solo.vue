<template>
  <view class="home-solo-container">
    <!-- 顶部用户信息 -->
    <view class="user-info-section">
      <view class="user-avatar">
        <image 
          :src="userInfo?.avatarUrl || '/static/logo.png'" 
          class="avatar-image"
          mode="aspectFill"
        ></image>
      </view>
      <view class="user-details">
        <text class="user-name">{{ userInfo?.nickName || '未登录用户' }}</text>
        <text class="user-role">{{ getRoleText(userInfo?.role) }}</text>
      </view>
    </view>

    <!-- 今日打卡概览 -->
    <view class="checkin-overview-section">
      <view class="section-header">
        <text class="section-title">今日打卡概览</text>
        <text class="section-subtitle">完成打卡，让关爱无处不在</text>
        <view class="refresh-btn" @click="refreshCheckinData" :class="{ loading: checkinStore.isLoading }">
          <text class="refresh-icon">{{ checkinStore.isLoading ? '⏳' : '🔄' }}</text>
        </view>
      </view>
      
      <view class="overview-cards">
        <view class="overview-card pending-checkin">
          <text class="card-title">待打卡</text>
          <text class="card-number">{{ pendingCheckinCount }}</text>
          <text class="card-desc">项目</text>
        </view>
        
        <view class="overview-card completed-checkin">
          <text class="card-title">已完成</text>
          <text class="card-number">{{ completedCheckinCount }}</text>
          <text class="card-desc">项目</text>
        </view>
        
        <view class="overview-card missed-checkin">
          <text class="card-title">已错过</text>
          <text class="card-number">{{ missedCheckinCount }}</text>
          <text class="card-desc">项目</text>
        </view>
        
        <view class="overview-card completion-rate">
          <text class="card-title">完成率</text>
          <text class="card-number">{{ completionRate }}%</text>
          <text class="card-desc">今日目标</text>
        </view>
      </view>
    </view>

    <!-- 今日行动主按钮 -->
    <view class="today-tasks-section">
      <button 
        :class="['today-tasks-btn', { disabled: disableMainBtn }]"
        :disabled="disableMainBtn"
        @click="handleMainAction"
      >
        <text class="btn-icon">📋</text>
        <text class="btn-text">{{ mainBtnText }}</text>
        <text v-if="mainBtnSubtext" class="btn-subtext">{{ mainBtnSubtext }}</text>
      </button>
    </view>

    <!-- 快捷功能 -->
    <view class="quick-actions-section">
      <view class="section-header">
        <text class="section-title">快捷功能</text>
      </view>
      
      <view class="quick-actions-grid">
        <view class="quick-action-item" @click="goToRuleSetting">
          <view class="action-icon">⚙️</view>
          <text class="action-text">打卡规则</text>
        </view>
        
        <!-- 监督管理：所有用户都可以使用 -->
        <view class="quick-action-item" @click="goToSupervisionFeatures">
          <view class="action-icon">👁️</view>
          <text class="action-text">监督管理</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { useCheckinStore } from '@/store/modules/checkin'

const userStore = useUserStore()
const checkinStore = useCheckinStore()

const mainBtnText = ref('今日待办')
const mainBtnSubtext = ref('点击进入打卡事项列表')
const clicking = ref(false)

// 计算属性：用户信息
const userInfo = computed(() => userStore.userInfo)

// 计算属性：今日打卡数量（从store获取）
const todayCheckinCount = computed(() => checkinStore.todayCheckinCount)
const pendingCheckinCount = computed(() => checkinStore.pendingCheckinCount)
const completedCheckinCount = computed(() => checkinStore.completedCheckinCount)
const missedCheckinCount = computed(() => checkinStore.missedCheckinCount)
const allRulesCount = computed(() => checkinStore.allRulesCount)
const nearestPending = computed(() => checkinStore.nearestPending)
const completionRate = computed(() => checkinStore.completionRate)

const disableMainBtn = computed(() => {
  if (allRulesCount.value === 0) return false
  if (todayCheckinCount.value === 0) return false
  return !nearestPending.value
})

// 获取用户角色文本
const getRoleText = (role) => {
  const roleMap = {
    solo: '普通用户',
    supervisor: '监护人',
    community: '社区工作人员'
  }
  return roleMap[role] || '用户'
}

// 初始化打卡数据
const initCheckinData = async () => {
  try {
    await checkinStore.initCheckinData()
    updateMainButton()
  } catch (error) {
    console.error('初始化打卡数据失败:', error)
  }
}

// 刷新打卡数据
const refreshCheckinData = async () => {
  try {
    await checkinStore.refreshData()
    updateMainButton()
    uni.showToast({ title: '数据已更新', icon: 'success' })
  } catch (error) {
    console.error('刷新打卡数据失败:', error)
    uni.showToast({ title: '刷新失败', icon: 'none' })
  }
}

const parseTodayTime = (hhmmss) => {
  const todayStr = new Date().toISOString().slice(0,10)
  const t = hhmmss || '00:00:00'
  return new Date(`${todayStr}T${t}`)
}

const updateMainButton = () => {
  if (allRulesCount.value === 0) {
    mainBtnText.value = '马上行动吧'
    mainBtnSubtext.value = ''
    return
  }
  if (nearestPending.value) {
    mainBtnText.value = '打卡'
    mainBtnSubtext.value = nearestPending.value.rule_name
  } else {
    if (todayCheckinCount.value > 0) {
      mainBtnText.value = '今日没有打卡任务了'
      mainBtnSubtext.value = ''
    } else {
      mainBtnText.value = '今日待办'
      mainBtnSubtext.value = '点击进入打卡事项列表'
    }
  }
}

const handleMainAction = async () => {
  if (clicking.value) return
  clicking.value = true
  setTimeout(()=> clicking.value=false, 300)

  if (disableMainBtn.value) return

  if (allRulesCount.value === 0) {
    uni.navigateTo({ url: '/pages/add-rule/add-rule' })
    return
  }
  if (!nearestPending.value) {
    goToCheckinList()
    return
  }
  
  const now = new Date()
  const planned = parseTodayTime(nearestPending.value.planned_time)
  const diffMs = now - planned
  const diffMin = diffMs / 60000
  
  if (diffMin < -30) {
    uni.showToast({ title: '打卡时间未到，请于规定时间前30分钟内再来打卡', icon: 'none', duration: 3000 })
    return
  }
  
  if (diffMin > 30) {
    try {
      await checkinStore.markAsMissed(nearestPending.value.rule_id)
      updateMainButton()
    } catch(e) {}
    uni.showToast({ title: '已错过打卡时间', icon: 'none', duration: 3000 })
    return
  }
  
  try {
    await checkinStore.performCheckin(nearestPending.value.rule_id)
    updateMainButton()
    uni.showToast({ title: '打卡成功', icon: 'success' })
  } catch(e) {
    console.error('打卡失败:', e)
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
  }
}

// 跳转到打卡事项列表
const goToCheckinList = () => {
  uni.navigateTo({
    url: '/pages/checkin-list/checkin-list'
  })
}

// 跳转到打卡规则设置
const goToRuleSetting = () => {
  uni.navigateTo({
    url: '/pages/rule-setting/rule-setting'
  })
}


// 跳转到监督管理
const goToSupervisionFeatures = () => {
  // 这里可以导航到监督管理页面，或者一个包含多个监督选项的页面
  uni.navigateTo({
    url: '/pages/home-supervisor/home-supervisor'
  })
}

onMounted(() => {
  initCheckinData()
})
</script>

<style lang="scss" scoped>
.home-solo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx 32rpx 160rpx;
}

.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 48rpx;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-avatar {
  margin-right: 24rpx;
}

.avatar-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid #F48224;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: 24rpx;
  color: #F48224;
  background: rgba(244, 130, 36, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.checkin-overview-section {
  margin-bottom: 48rpx;
}

.section-header {
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
  margin-bottom: 8rpx;
}

.section-subtitle {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.refresh-btn {
  padding: 8rpx 16rpx;
  background: rgba(244, 130, 36, 0.1);
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.refresh-btn:active {
  transform: scale(0.95);
  background: rgba(244, 130, 36, 0.2);
}

.refresh-btn.loading {
  opacity: 0.6;
}

.refresh-icon {
  font-size: 24rpx;
}

.overview-cards {
  display: flex;
  gap: 12rpx;
  overflow-x: auto;
  padding-bottom: 4rpx;
}

.overview-card {
  background: white;
  border-radius: 12rpx;
  padding: 16rpx 12rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 140rpx;
  flex: 1;
}

.card-title {
  display: block;
  font-size: 18rpx;
  color: #666;
  margin-bottom: 6rpx;
  font-weight: 500;
}

.card-number {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 2rpx;
  line-height: 1;
}

.card-desc {
  display: block;
  font-size: 16rpx;
  color: #999;
}

.pending-checkin {
  border-top: 4rpx solid #FF7A3D;
}

.completed-checkin {
  border-top: 4rpx solid #4CAF50;
}

.missed-checkin {
  border-top: 4rpx solid #F44336;
}

.completion-rate {
  border-top: 4rpx solid #2196F3;
}

.today-tasks-section {
  margin-bottom: 48rpx;
}

.today-tasks-btn {
  width: 100%;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 24rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 48rpx rgba(244, 130, 36, 0.4);
}

.today-tasks-btn.disabled {
  background: linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.btn-text {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: white;
  margin-bottom: 8rpx;
}

.btn-subtext {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.quick-actions-section {
  margin-top: 24rpx;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.quick-action-item {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.quick-action-item:active {
  transform: scale(0.95);
}

.action-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.action-text {
  display: block;
  font-size: 24rpx;
  color: #666;
}
</style>
