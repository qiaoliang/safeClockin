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
      </view>
      
      <view class="overview-cards">
        <view class="overview-card today-checkin">
          <text class="card-title">今日待打卡</text>
          <text class="card-number">{{ pendingCheckinCount }}/{{ allRulesCount }}</text>
          <text class="card-desc">项目</text>
        </view>
        
        <view class="overview-card completed-checkin">
          <text class="card-title">完成/错过</text>
          <text class="card-number">{{ finishedOrMissedCount }}</text>
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
        class="today-tasks-btn"
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
import { request } from '@/api/request'

const userStore = useUserStore()
const checkinItems = ref([])
const allRulesCount = ref(0)
const nearestPending = ref(null)
const mainBtnText = ref('今日待办')
const mainBtnSubtext = ref('点击进入打卡事项列表')
const clicking = ref(false)

// 计算属性：用户信息
const userInfo = computed(() => userStore.userInfo)

// 计算属性：今日打卡数量
const todayCheckinCount = computed(() => checkinItems.value.length)
const pendingCheckinCount = computed(() => checkinItems.value.filter(item => item.status !== 'checked' && item.status !== 'missed').length)
const finishedOrMissedCount = computed(() => checkinItems.value.filter(item => item.status === 'checked' || item.status === 'missed').length)

// 计算属性：已完成打卡数量
const completedCheckinCount = computed(() => {
  return checkinItems.value.filter(item => item.status === 'checked').length
})

// 计算属性：完成率
const completionRate = computed(() => {
  const total = todayCheckinCount.value
  if (total === 0) return 0
  return Math.round((completedCheckinCount.value / total) * 100)
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

// 获取今日打卡事项
const getTodayCheckinItems = async () => {
  try {
    const response = await request({
      url: '/api/checkin/today',
      method: 'GET'
    })
    
    if (response.code === 1) {
      checkinItems.value = response.data.checkin_items || []
      computeNearestPending()
      updateMainButton()
    } else {
      console.error('获取今日打卡事项失败:', response.msg)
    }
  } catch (error) {
    console.error('获取今日打卡事项失败:', error)
  }
}

const getAllRulesCount = async () => {
  try {
    const res = await request({ url: '/api/checkin/rules', method: 'GET' })
    if (res.code === 1) {
      allRulesCount.value = (res.data?.rules || []).length
      updateMainButton()
    }
  } catch(e){
    console.error(e)
  }
}

const parseTodayTime = (hhmmss) => {
  const todayStr = new Date().toISOString().slice(0,10)
  const t = hhmmss || '00:00:00'
  return new Date(`${todayStr}T${t}`)
}

const computeNearestPending = () => {
  const pending = checkinItems.value.filter(it => it.status !== 'checked' && it.status !== 'missed')
  if (!pending.length) { nearestPending.value = null; return }
  pending.sort((a,b)=>{
    const da = parseTodayTime(a.planned_time)
    const db = parseTodayTime(b.planned_time)
    return db - da // 时间倒序
  })
  nearestPending.value = pending[0]
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
    mainBtnText.value = '今日待办'
    mainBtnSubtext.value = '点击进入打卡事项列表'
  }
}

const handleMainAction = async () => {
  if (clicking.value) return
  clicking.value = true
  setTimeout(()=> clicking.value=false, 300)

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
      await request({ url: '/api/checkin/miss', method: 'POST', data: { rule_id: nearestPending.value.rule_id } })
    } catch(e){}
    uni.showToast({ title: '已错过打卡时间', icon: 'none', duration: 3000 })
    await getTodayCheckinItems()
    return
  }
  try {
    const res = await request({ url: '/api/checkin', method: 'POST', data: { rule_id: nearestPending.value.rule_id } })
    if (res.code === 1) {
      uni.showToast({ title: '打卡成功', icon: 'success' })
      await getTodayCheckinItems()
    } else {
      uni.showToast({ title: res.msg || '打卡失败', icon: 'none' })
    }
  } catch(e){
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
  getTodayCheckinItems()
  getAllRulesCount()
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

.overview-cards {
  display: flex;
  gap: 24rpx;
}

.overview-card {
  flex: 1;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.card-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 20rpx;
  color: #999;
}

.today-checkin {
  border-top: 8rpx solid #F48224;
}

.completed-checkin {
  border-top: 8rpx solid #10B981;
}

.completion-rate {
  border-top: 8rpx solid #3B82F6;
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
