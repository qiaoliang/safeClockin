<!-- pages/unchecked-detail/unchecked-detail.vue -->
<template>
  <view class="unchecked-detail-container">
    <!-- 顶部标题 -->
    <view class="header-section">
      <view class="header-content">
        <text class="back-btn" @click="goBack">←</text>
        <text class="header-title">未打卡独居者详情</text>
      </view>
    </view>

    <!-- 未打卡概览 -->
    <view class="overview-section">
      <view class="overview-card unchecked-count">
        <text class="card-title">未打卡人数</text>
        <text class="card-number">{{ uncheckedCount }}</text>
        <text class="card-desc">人</text>
      </view>
      
      <view class="overview-card warning-desc">
        <text class="card-desc">当前有{{ uncheckedCount }}位独居者未完成今日打卡，请及时关注并联系。</text>
      </view>
    </view>

    <!-- 未打卡人员列表 -->
    <view class="unchecked-list-section">
      <view class="section-header">
        <text class="section-title">未打卡人员</text>
      </view>
      
      <view class="unchecked-list">
        <view 
          class="unchecked-item"
          v-for="person in uncheckedList"
          :key="person.user_id"
        >
          <view class="person-info">
            <text class="person-name">{{ person.name }}</text>
            <text class="person-phone">{{ person.phone }}</text>
          </view>
          <view class="person-checkin">
            <text class="unchecked-count-text">{{ person.unchecked_count }}项未打卡</text>
            <view class="unchecked-items" v-if="showDetail[person.user_id]">
              <view 
                class="unchecked-item-detail"
                v-for="item in person.unchecked_items"
                :key="item.rule_id"
              >
                <text class="item-name">{{ item.rule_name }}</text>
                <text class="item-time">计划: {{ item.planned_time }}</text>
              </view>
            </view>
          </view>
          <view class="person-actions">
            <button class="action-btn call" @click="callPerson(person)">📞</button>
            <button class="action-btn message" @click="sendMessage(person)">💬</button>
            <button 
              class="action-btn detail" 
              @click="toggleDetail(person.user_id)"
            >
              {{ showDetail[person.user_id] ? '▲' : '▼' }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 批量操作 -->
    <view class="batch-actions-section">
      <button class="batch-send-btn" @click="batchSendReminder">
        📢 批量发送提醒
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 未打卡人数
const uncheckedCount = ref(5)

// 未打卡人员列表
const uncheckedList = ref([
  {
    user_id: 1,
    name: '张大爷',
    phone: '138****8888',
    unchecked_count: 3,
    unchecked_items: [
      { rule_id: 1, rule_name: '起床打卡', planned_time: '07:00' },
      { rule_id: 2, rule_name: '早餐打卡', planned_time: '08:30' },
      { rule_id: 3, rule_name: '睡觉打卡', planned_time: '22:00' }
    ]
  },
  {
    user_id: 2,
    name: '李奶奶',
    phone: '139****9999',
    unchecked_count: 2,
    unchecked_items: [
      { rule_id: 1, rule_name: '午餐打卡', planned_time: '12:00' },
      { rule_id: 2, rule_name: '晚餐打卡', planned_time: '18:00' }
    ]
  },
  {
    user_id: 3,
    name: '王叔叔',
    phone: '137****7777',
    unchecked_count: 1,
    unchecked_items: [
      { rule_id: 1, rule_name: '睡觉打卡', planned_time: '22:30' }
    ]
  },
  {
    user_id: 4,
    name: '赵阿姨',
    phone: '136****6666',
    unchecked_count: 4,
    unchecked_items: [
      { rule_id: 1, rule_name: '起床打卡', planned_time: '06:30' },
      { rule_id: 2, rule_name: '早餐打卡', planned_time: '08:00' },
      { rule_id: 3, rule_name: '午餐打卡', planned_time: '12:00' },
      { rule_id: 4, rule_name: '睡觉打卡', planned_time: '21:30' }
    ]
  },
  {
    user_id: 5,
    name: '孙大爷',
    phone: '135****5555',
    unchecked_count: 2,
    unchecked_items: [
      { rule_id: 1, rule_name: '晚餐打卡', planned_time: '18:30' },
      { rule_id: 2, rule_name: '睡觉打卡', planned_time: '22:00' }
    ]
  }
])

// 控制显示详情的映射
const showDetail = ref({})

// 切换显示详情
const toggleDetail = (userId) => {
  showDetail.value[userId] = !showDetail.value[userId]
}

// 拨打电话
const callPerson = (person) => {
  uni.showModal({
    title: '拨打电话',
    content: `确定要拨打 ${person.name} 的电话 ${person.phone} 吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.makePhoneCall({
          phoneNumber: person.phone.replace(/\*/g, '8') // 替换*为实际号码
        })
      }
    }
  })
}

// 发送消息
const sendMessage = (person) => {
  uni.showModal({
    title: '发送消息',
    content: `确定要给 ${person.name} 发送消息吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '消息发送功能开发中',
          icon: 'none'
        })
      }
    }
  })
}

// 批量发送提醒
const batchSendReminder = () => {
  uni.showModal({
    title: '批量发送提醒',
    content: `确定要向这${uncheckedCount.value}位未打卡的独居者发送提醒吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '发送中...'
        })
        
        // 模拟API调用
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({
            title: '提醒已发送',
            icon: 'success'
          })
        }, 1500)
      }
    }
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.unchecked-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 32rpx 32rpx 160rpx;
}

.header-section {
  margin-bottom: 48rpx;
}

.header-content {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 48rpx;
  color: #624731;
  margin-right: 24rpx;
}

.header-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #624731;
}

.overview-section {
  display: flex;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.overview-card {
  flex: 1;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.unchecked-count {
  border-top: 8rpx solid #EF4444;
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
  color: #EF4444;
  margin-bottom: 8rpx;
}

.card-desc {
  display: block;
  font-size: 20rpx;
  color: #999;
}

.warning-desc {
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-desc .card-desc {
  font-size: 24rpx;
  color: #EF4444;
  text-align: center;
}

.unchecked-list-section {
  margin-bottom: 48rpx;
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
}

.unchecked-list {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.unchecked-item {
  display: flex;
  align-items: flex-start;
  padding: 32rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.unchecked-item:last-child {
  border-bottom: none;
}

.person-info {
  flex: 1;
  margin-right: 24rpx;
}

.person-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.person-phone {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.person-checkin {
  flex: 2;
  margin-right: 24rpx;
}

.unchecked-count-text {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #EF4444;
  margin-bottom: 16rpx;
}

.unchecked-item-detail {
  padding: 8rpx 0;
}

.item-name {
  display: block;
  font-size: 24rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.item-time {
  display: block;
  font-size: 20rpx;
  color: #666;
}

.person-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: none;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.call {
  background: #D1FAE5;
  color: #10B981;
}

.action-btn.message {
  background: #DBEAFE;
  color: #3B82F6;
}

.action-btn.detail {
  background: #F3F4F6;
  color: #6B7280;
}

.batch-actions-section {
  position: fixed;
  bottom: 32rpx;
  left: 32rpx;
  right: 32rpx;
}

.batch-send-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border: none;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(244, 130, 36, 0.4);
}
</style>