<!-- pages/checkin-list/checkin-list.vue -->
<template>
  <view class="checkin-list-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <text class="header-title">
        打卡事项
      </text>
      <text class="header-subtitle">
        完成每日打卡，让关爱无处不在
      </text>
    </view>

    <!-- 打卡事项列表 -->
    <view
      v-if="checkinItems.length > 0"
      class="checkin-list-section"
    >
      <view class="list-title">
        今日打卡事项
      </view>
      <view 
        v-for="item in checkinItems" 
        :key="item.rule_id" 
        class="checkin-item"
      >
        <view class="item-info">
          <text class="item-name">
            {{ item.rule_name }}
          </text>
          <text class="item-time">
            计划时间: {{ item.planned_time }}
          </text>
        </view>
        
        <view
          v-if="item.status === 'checked'"
          class="item-actions"
        >
          <text class="status-checked">
            ✓ 已打卡
          </text>
          <text class="checkin-time">
            {{ item.checkin_time }}
          </text>
          <button 
            v-if="isWithin30Minutes(item.checkin_time)" 
            class="cancel-btn"
            @click="showCancelModal(item)"
          >
            撤销
          </button>
        </view>
        
        <view
          v-else-if="item.status === 'missed'"
          class="item-actions"
        >
          <text class="status-missed">
            ✕ 已错过
          </text>
        </view>
        
        <button 
          v-else 
          class="checkin-btn"
          @click="performCheckin(item)"
        >
          打卡
        </button>
      </view>
    </view>

    <!-- 无打卡事项提示 -->
    <view
      v-else
      class="empty-section"
    >
      <text class="empty-text">
        今天没有需要打卡的事项
      </text>
      <text class="empty-subtext">
        请先在"打卡规则"中添加打卡事项
      </text>
    </view>

    <!-- 全部完成提示 -->
    <view
      v-if="isAllCompleted"
      class="completed-section"
    >
      <text class="completed-text">
        🎉 今日所有打卡事项已完成
      </text>
      <text class="completed-subtext">
        您的健康管理做得很棒！
      </text>
    </view>

    <!-- 撤销确认弹窗 -->
    <view
      v-if="showCancelConfirm"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            撤销打卡
          </text>
        </view>
        <view class="modal-body">
          <text class="modal-text">
            确定要撤销 "{{ selectedCheckinItem?.rule_name }}" 的打卡吗？
          </text>
          <text class="modal-subtext">
            撤销后，该事项将恢复为未打卡状态
          </text>
        </view>
        <view class="modal-actions">
          <button
            class="modal-cancel-btn"
            @click="hideCancelModal"
          >
            取消
          </button>
          <button
            class="modal-confirm-btn"
            @click="confirmCancel"
          >
            确定
          </button>
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
const showCancelConfirm = ref(false)
const selectedCheckinItem = ref(null)

// 计算属性：是否全部完成打卡
const isAllCompleted = computed(() => {
  return checkinItems.value.length > 0 && 
         checkinItems.value.every(item => item.status === 'checked')
})

// 判断打卡时间是否在30分钟内
const isWithin30Minutes = (checkinTimeStr) => {
  if (!checkinTimeStr) return false
  
  // 将时间字符串转换为时间戳
  const checkinTime = new Date(`2023-01-01T${checkinTimeStr}`)
  const now = new Date()
  
  // 计算时间差（分钟）
  const diffMinutes = Math.floor((now - checkinTime) / (1000 * 60))
  
  return diffMinutes <= 30
}

// 获取今日打卡事项
const getTodayCheckinItems = async () => {
  try {
    // 使用新的API获取今日打卡计划（混合个人规则和社区规则）
    const response = await request({
      url: '/api/user-checkin/today-plan',
      method: 'GET'
    })
    
    if (response.code === 1) {
      // 适配新的数据结构格式
      const items = response.data?.items || response.data || []
      checkinItems.value = items.map(it => ({ ...it }))
      normalizeMissedStatuses()
    } else {
      uni.showToast({
        title: response.msg || '获取打卡事项失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取今日打卡事项失败:', error)
    uni.showToast({
      title: '获取打卡事项失败',
      icon: 'none'
    })
  }
}

const parseTodayTime = (hhmmss) => {
  const todayStr = new Date().toISOString().slice(0,10)
  const t = hhmmss || '00:00:00'
  return new Date(`${todayStr}T${t}`)
}

const normalizeMissedStatuses = () => {
  const now = new Date()
  checkinItems.value.forEach(it => {
    const planned = parseTodayTime(it.planned_time)
    const diffMin = (now - planned) / 60000
    if (diffMin > 30 && it.status !== 'checked') {
      it.status = 'missed'
    }
  })
}

// 执行打卡
const performCheckin = async (item) => {
  try {
    uni.showLoading({
      title: '打卡中...'
    })
    
    // 构建打卡数据，支持社区规则
    const checkinData = {
      rule_id: item.rule_id
    }
    
    // 如果是社区规则，需要传递rule_source
    if (item.rule_source === 'community') {
      checkinData.rule_source = 'community'
    }
    
    const response = await request({
      url: '/api/checkin',
      method: 'POST',
      data: checkinData
    })
    
    uni.hideLoading()
    
    if (response.code === 1) {
      uni.showToast({
        title: '打卡成功',
        icon: 'success'
      })
      
      // 更新本地数据
      const index = checkinItems.value.findIndex(i => i.rule_id === item.rule_id)
      if (index !== -1) {
        checkinItems.value[index].status = 'checked'
        checkinItems.value[index].checkin_time = response.data.checkin_time.split(' ')[1].substring(0, 8) // 只取时间部分
        checkinItems.value[index].record_id = response.data.record_id
      }
    } else {
      uni.showToast({
        title: response.msg || '打卡失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('打卡失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '打卡失败',
      icon: 'none'
    })
  }
}

// 显示撤销确认弹窗
const showCancelModal = (item) => {
  selectedCheckinItem.value = item
  showCancelConfirm.value = true
}

// 隐藏撤销确认弹窗
const hideCancelModal = () => {
  showCancelConfirm.value = false
  selectedCheckinItem.value = null
}

// 确认撤销打卡
const confirmCancel = async () => {
  try {
    if (!selectedCheckinItem.value) return
    
    uni.showLoading({
      title: '撤销中...'
    })
    
    const response = await request({
      url: '/api/checkin/cancel',
      method: 'POST',
      data: {
        record_id: selectedCheckinItem.value.record_id
      }
    })
    
    uni.hideLoading()
    
    if (response.code === 1) {
      uni.showToast({
        title: '撤销成功',
        icon: 'success'
      })
      
      // 更新本地数据
      const index = checkinItems.value.findIndex(i => i.rule_id === selectedCheckinItem.value.rule_id)
      if (index !== -1) {
        checkinItems.value[index].status = 'unchecked'
        checkinItems.value[index].checkin_time = null
      }
      
      hideCancelModal()
    } else {
      uni.showToast({
        title: response.msg || '撤销失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('撤销打卡失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '撤销失败',
      icon: 'none'
    })
  }
}

onMounted(() => {
  getTodayCheckinItems()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.checkin-list-container {
  min-height: 100vh;
  @include bg-gradient;
  padding: 48rpx 32rpx 80rpx;
}

.header-section {
  margin-bottom: 48rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-tabbar-color;
  margin-bottom: 16rpx;
}

.header-subtitle {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.list-title {
  @include section-title;
}

.checkin-item {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: $uni-font-size-lg;
  font-weight: 600;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.item-time {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.status-checked {
  font-size: $uni-font-size-sm;
  color: $uni-success;
  font-weight: 500;
}

.status-missed {
  font-size: $uni-font-size-sm;
  color: $uni-error;
  font-weight: 500;
}

.checkin-time {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  margin-top: 4rpx;
}

.checkin-btn {
  width: 160rpx;
  height: 64rpx;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border-radius: $uni-radius-xl;
  color: $uni-white;
  font-size: $uni-font-size-base;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(244, 130, 36, 0.3);
}

.cancel-btn {
  width: 160rpx;
  height: 64rpx;
  background: $uni-error-light;
  color: $uni-error;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-base;
  font-weight: 600;
  border: none;
}

.empty-section {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  display: block;
  font-size: $uni-font-size-lg;
  color: $uni-tabbar-color;
  margin-bottom: 16rpx;
}

.empty-subtext {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.completed-section {
  text-align: center;
  padding: 80rpx 40rpx;
}

.completed-text {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-success;
  margin-bottom: 16rpx;
}

.completed-subtext {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-tabbar-color;
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
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  padding: 48rpx;
  width: 560rpx;
}

.modal-header {
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: $uni-font-size-lg;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.modal-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.modal-subtext {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
  margin-bottom: 32rpx;
}

.modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-cancel-btn {
  flex: 1;
  height: 80rpx;
  background: $uni-bg-color-grey;
  color: $uni-main-color;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: 600;
  border: none;
}

.modal-confirm-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  color: $uni-white;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: 600;
  border: none;
}
</style>
