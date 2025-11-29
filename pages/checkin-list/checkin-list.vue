<!-- pages/checkin-list/checkin-list.vue -->
<template>
  <view class="checkin-list-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <text class="header-title">打卡事项</text>
      <text class="header-subtitle">完成每日打卡，让关爱无处不在</text>
    </view>

    <!-- 打卡事项列表 -->
    <view class="checkin-list-section" v-if="checkinItems.length > 0">
      <view class="list-title">今日打卡事项</view>
      <view 
        class="checkin-item" 
        v-for="item in checkinItems" 
        :key="item.rule_id"
      >
        <view class="item-info">
          <text class="item-name">{{ item.rule_name }}</text>
          <text class="item-time">计划时间: {{ item.planned_time }}</text>
        </view>
        
        <view class="item-actions" v-if="item.status === 'checked'">
          <text class="status-checked">✓ 已打卡</text>
          <text class="checkin-time">{{ item.checkin_time }}</text>
          <button 
            class="cancel-btn" 
            @click="showCancelModal(item)"
            v-if="isWithin30Minutes(item.checkin_time)"
          >
            撤销
          </button>
        </view>
        
        <button 
          class="checkin-btn" 
          v-else
          @click="performCheckin(item)"
        >
          打卡
        </button>
      </view>
    </view>

    <!-- 无打卡事项提示 -->
    <view class="empty-section" v-else>
      <text class="empty-text">今天没有需要打卡的事项</text>
      <text class="empty-subtext">请先在"打卡规则"中添加打卡事项</text>
    </view>

    <!-- 全部完成提示 -->
    <view class="completed-section" v-if="isAllCompleted">
      <text class="completed-text">🎉 今日所有打卡事项已完成</text>
      <text class="completed-subtext">您的健康管理做得很棒！</text>
    </view>

    <!-- 撤销确认弹窗 -->
    <view class="modal-overlay" v-if="showCancelConfirm">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">撤销打卡</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">确定要撤销 "{{ selectedCheckinItem?.rule_name }}" 的打卡吗？</text>
          <text class="modal-subtext">撤销后，该事项将恢复为未打卡状态</text>
        </view>
        <view class="modal-actions">
          <button class="modal-cancel-btn" @click="hideCancelModal">取消</button>
          <button class="modal-confirm-btn" @click="confirmCancel">确定</button>
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
    const response = await request({
      url: '/api/checkin/today',
      method: 'GET'
    })
    
    if (response.code === 1) {
      checkinItems.value = response.data.checkin_items || []
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

// 执行打卡
const performCheckin = async (item) => {
  try {
    uni.showLoading({
      title: '打卡中...'
    })
    
    const response = await request({
      url: '/api/checkin',
      method: 'POST',
      data: {
        rule_id: item.rule_id
      }
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

<style scoped>
.checkin-list-container {
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

.checkin-item {
  background: white;
  border-radius: 24rpx;
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
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.item-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.status-checked {
  font-size: 24rpx;
  color: #10B981;
  font-weight: 500;
}

.checkin-time {
  font-size: 24rpx;
  color: #6B7280;
}

.checkin-btn {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border-radius: 16rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(244, 130, 36, 0.3);
}

.cancel-btn {
  background: #FEE2E2;
  color: #EF4444;
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
  font-size: 24rpx;
  border: none;
  margin-top: 8rpx;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  text-align: center;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-subtext {
  font-size: 24rpx;
  color: #999;
}

.completed-section {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  margin-top: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.completed-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #10B981;
  margin-bottom: 16rpx;
}

.completed-subtext {
  display: block;
  font-size: 28rpx;
  color: #666;
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
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border: none;
  border-radius: 16rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}
</style>