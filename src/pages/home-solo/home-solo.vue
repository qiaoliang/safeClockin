<template>
  <view class="home-solo-container">
    <!-- 顶部问候区域 -->
    <view class="greeting-header">
      <view class="greeting-card">
        <view class="greeting-content">
          <view class="user-info-row">
            <view class="user-avatar-section">
              <image 
                :src="userInfo?.avatarUrl || 'https://s.coze.cn/image/dhcVCXur50w/'" 
                class="user-avatar-img"
                mode="aspectFill"
              />
              <view class="user-greeting">
                <text class="greeting-text">
                  {{ getGreetingText() }}，{{ getDisplayName(userInfo) }}
                </text>
                <text class="date-text">
                  {{ getCurrentDate() }}
                </text>
              </view>
            </view>
            <view class="weather-info">
              <view class="weather-content">
                <text class="weather-icon">
                  ☀️
                </text>
                <text class="weather-text">
                  晴 18°C
                </text>
              </view>
            </view>
          </view>
          
          <!-- 角色切换标签 -->
          <view class="role-tabs">
            <view 
              :class="['role-tab', currentRole === 'checkin' ? 'active' : '']"
              @click="switchRole('checkin')"
            >
              <text class="tab-icon">
                🕐
              </text>
              <text class="tab-text">
                今日打卡
              </text>
            </view>
            <view 
              :class="['role-tab', currentRole === 'supervisor' ? 'active' : '']"
              @click="switchRole('supervisor')"
            >
              <text class="tab-icon">
                🛡️
              </text>
              <text class="tab-text">
                当前监护
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 今日打卡概览 -->
    <view class="checkin-overview-section">
      <view class="section-header">
        <text class="section-title">
          今日打卡概览
        </text>
        <text class="section-subtitle">
          完成打卡，让关爱无处不在
        </text>
        <view
          class="refresh-btn"
          :class="{ loading: checkinStore.isLoading }"
          @click="refreshCheckinData"
        >
          <text class="refresh-icon">
            {{ checkinStore.isLoading ? '⏳' : '🔄' }}
          </text>
        </view>
      </view>
      
      <view class="overview-cards">
        <view class="overview-card pending-checkin">
          <text class="card-title">
            待打卡
          </text>
          <text class="card-number">
            {{ pendingCheckinCount }}
          </text>
          <text class="card-desc">
            项目
          </text>
        </view>
        
        <view class="overview-card completed-checkin">
          <text class="card-title">
            已完成
          </text>
          <text class="card-number">
            {{ completedCheckinCount }}
          </text>
          <text class="card-desc">
            项目
          </text>
        </view>
        
        <view class="overview-card missed-checkin">
          <text class="card-title">
            已错过
          </text>
          <text class="card-number">
            {{ missedCheckinCount }}
          </text>
          <text class="card-desc">
            项目
          </text>
        </view>
        
        <view class="overview-card completion-rate">
          <text class="card-title">
            完成率
          </text>
          <text class="card-number">
            {{ completionRate }}%
          </text>
          <text class="card-desc">
            今日目标
          </text>
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
        <text class="btn-icon">
          📋
        </text>
        <text class="btn-text">
          {{ mainBtnText }}
        </text>
        <text
          v-if="mainBtnSubtext"
          class="btn-subtext"
        >
          {{ mainBtnSubtext }}
        </text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useCheckinStore } from '@/store/modules/checkin'

const userStore = useUserStore()
const checkinStore = useCheckinStore()

const mainBtnText = ref('今日待办')
const mainBtnSubtext = ref('点击进入打卡事项列表')
const clicking = ref(false)
const currentRole = ref('checkin')

// 计算属性：用户信息 - 添加防御性验证
const userInfo = computed(() => {
  // Layer 1: 入口点验证 - 确保用户信息存在
  const user = userStore.userInfo
  
  if (!user) {
    console.log('用户信息为空')
    return null
  }
  
  // Layer 2: 业务逻辑验证 - 确保关键字段存在
  if (!user.nickName && !user.nickname) {
    console.warn('⚠️ 用户信息缺少昵称字段')
    // 尝试从其他字段获取昵称
    if (user.wechat_openid) {
      user.nickName = `微信用户${user.wechat_openid.slice(-6)}`
    } else {
      user.nickName = '用户'
    }
  }
  
  console.log('用户信息验证通过:', user.nickName || user.nickname)
  return user
})

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

// 获取用户显示名称 - 添加多层防御
const getDisplayName = (user) => {
  // Layer 1: 入口点验证
  if (!user) {
    console.log('用户对象为空，显示未登录用户')
    return '未登录用户'
  }
  
  // Layer 2: 业务逻辑验证 - 尝试多种昵称字段
  let displayName = user.nickName || user.nickname || user.userName || user.name
  
  if (displayName) {
    console.log('找到用户昵称:', displayName)
    return displayName
  }
  
  // Layer 3: 环境保护 - 生成临时显示名称
  if (user.wechat_openid) {
    displayName = `微信用户${user.wechat_openid.slice(-6)}`
    console.log('使用微信openid生成临时昵称:', displayName)
    return displayName
  }
  
  if (user.phone_number) {
    displayName = `用户${user.phone_number.slice(-4)}`
    console.log('使用手机号生成临时昵称:', displayName)
    return displayName
  }
  
  // Layer 4: 最终兜底
  console.log('无法获取用户昵称，使用默认值')
  return '用户'
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

// 获取问候语
const getGreetingText = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// 获取当前日期
const getCurrentDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const date = now.getDate()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[now.getDay()]
  return `${year}年${month}月${date}日 ${weekday}`
}

// 切换角色
const switchRole = (role) => {
  currentRole.value = role
  // 这里可以添加角色切换后的逻辑
  if (role === 'supervisor') {
    // 切换到监护人视图的逻辑
    console.log('切换到监护人视图')
  } else {
    // 切换到打卡视图的逻辑
    console.log('切换到打卡视图')
  }
}



onMounted(() => {
  initCheckinData()
})

onShow(() => {
  // Layer 1: 入口点验证 - 确保用户状态正确初始化
  console.log('=== Layer 1: 首页onShow入口点验证 ===')
  console.log('当前登录状态:', userStore.isLoggedIn)
  console.log('用户信息:', userStore.userInfo)
  console.log('用户角色:', userStore.role)
  
  // Layer 2: 业务逻辑验证 - 确保数据一致性
  if (!userStore.userInfo) {
    console.log('用户信息为空，尝试初始化用户状态')
    userStore.initUserState()
  }
  
  // Layer 3: 环境保护 - 防止数据过期
  if (userStore.isLoggedIn && !userStore.userInfo) {
    console.warn('⚠️ 异常状态：已登录但无用户信息，尝试重新获取')
    userStore.fetchUserInfo().catch(error => {
      console.error('重新获取用户信息失败:', error)
    })
  }
  
  // Layer 4: 调试日志 - 记录数据刷新
  console.log('=== Layer 4: 开始刷新打卡数据 ===')
  
  // 刷新打卡数据，确保从其他页面返回时数据是最新的
  refreshCheckinData().catch(error => {
    console.error('首页onShow刷新数据失败:', error)
  })
})

// 监听打卡规则更新事件
uni.$on('checkinRulesUpdated', (data) => {
  console.log('=== 检测到打卡规则更新事件 ===')
  console.log('事件数据:', data)
  
  // 强制刷新打卡数据，确保显示最新状态
  checkinStore.refreshData().then(() => {
    console.log('✅ 响应规则更新事件，数据已刷新')
    updateMainButton()
  }).catch(error => {
    console.error('❌ 响应规则更新事件失败:', error)
  })
})
</script>

<style lang="scss" scoped>
.home-solo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx 32rpx 80rpx;
}

.greeting-header {
  padding: 48rpx 0 32rpx;
}

.greeting-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(60rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.greeting-content {
  
}

.user-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-avatar-img {
  width: 104rpx;
  height: 104rpx;
  border-radius: 64rpx;
  border: 6rpx solid #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.user-greeting {
  
}

.greeting-text {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #624731;
  margin-bottom: 8rpx;
}

.date-text {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.weather-info {
  
}

.weather-content {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.weather-icon {
  font-size: 40rpx;
}

.weather-text {
  font-size: 24rpx;
  color: #666;
}

.role-tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 50rpx;
  padding: 4rpx;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
  transition: all 0.3s ease;
}

.role-tab.active {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.3);
}

.tab-icon {
  font-size: 24rpx;
}

.tab-text {
  font-size: 24rpx;
  font-weight: 500;
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
  padding: 4rpx 16rpx;
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
  font-size: 24rpx;
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


</style>
