<!-- pages/supervisor-detail/supervisor-detail.vue -->
<template>
  <view class="supervisor-detail-container">
    <!-- 被监督人信息 -->
    <view class="person-info-section">
      <view class="person-avatar">
        <image 
          :src="personInfo.avatar_url || '/static/logo.png'" 
          class="avatar-image"
          mode="aspectFill"
        />
      </view>
      <view class="person-details">
        <text class="person-name">
          {{ personInfo.nickname }}
        </text>
        <text class="person-checkin-status">
          {{ personInfo.today_checkin_status }}
        </text>
        <view class="contact-actions">
          <button
            class="contact-btn"
            @click="callPerson"
          >
            📞 拨打电话
          </button>
          <button
            class="contact-btn"
            @click="sendMessage"
          >
            💬 发送消息
          </button>
        </view>
      </view>
    </view>

    <!-- 今日打卡概览 -->
    <view class="checkin-overview-section">
      <view class="section-header">
        <text class="section-title">
          今日打卡概览
        </text>
        <view class="date-selector">
          <button
            class="date-btn"
            @click="selectDate('today')"
          >
            今天
          </button>
          <button
            class="date-btn"
            @click="selectDate('yesterday')"
          >
            昨天
          </button>
          <button
            class="date-btn"
            @click="selectDate('week')"
          >
            近7天
          </button>
        </view>
      </view>
      
      <view class="checkin-list">
        <view 
          v-for="item in checkinList"
          :key="item.rule_id"
          class="checkin-item"
        >
          <view class="item-info">
            <text class="item-name">
              {{ item.rule_name }}
            </text>
            <text class="item-planned-time">
              计划: {{ item.planned_time }}
            </text>
          </view>
          <view
            class="item-status"
            :class="item.status"
          >
            <text
              v-if="item.status === 'checked'"
              class="status-text checked"
            >
              ✓ 已打卡
            </text>
            <text
              v-else-if="item.status === 'unchecked'"
              class="status-text unchecked"
            >
              ✗ 未打卡
            </text>
            <text
              v-else
              class="status-text revoked"
            >
              ↺ 已撤销
            </text>
            <text
              v-if="item.checkin_time"
              class="checkin-time"
            >
              {{ item.checkin_time }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 页面参数
const userId = ref(null)

// 被监督人信息
const personInfo = ref({
  nickname: '张阿姨',
  avatar_url: '/static/logo.png',
  today_checkin_status: '今日已打卡 2/3'
})

// 打卡列表
const checkinList = ref([
  {
    rule_id: 1,
    rule_name: '起床打卡',
    planned_time: '07:00',
    status: 'checked',
    checkin_time: '06:55'
  },
  {
    rule_id: 2,
    rule_name: '早餐打卡',
    planned_time: '08:30',
    status: 'checked',
    checkin_time: '08:25'
  },
  {
    rule_id: 3,
    rule_name: '晚餐打卡',
    planned_time: '18:30',
    status: 'unchecked',
    checkin_time: null
  }
])

// 当前选中的日期范围
const selectedDateRange = ref('today')

// 页面加载
onLoad((options) => {
  if (options.userId) {
    userId.value = options.userId
    // 在实际项目中，这里会根据userId获取被监督人的详细信息
  }
})

// 拨打电话
const callPerson = () => {
  uni.showModal({
    title: '拨打电话',
    content: `确定要拨打 ${personInfo.value.nickname} 的电话吗？`,
    success: (res) => {
      if (res.confirm) {
        // 实际项目中应有电话号码
        uni.makePhoneCall({
          phoneNumber: '13800138000'
        })
      }
    }
  })
}

// 发送消息
const sendMessage = () => {
  uni.showModal({
    title: '发送消息',
    content: `确定要给 ${personInfo.value.nickname} 发送消息吗？`,
    success: (res) => {
      if (res.confirm) {
        // 实际项目中应跳转到消息页面
        uni.showToast({
          title: '消息发送功能开发中',
          icon: 'none'
        })
      }
    }
  })
}

// 选择日期范围
const selectDate = (range) => {
  selectedDateRange.value = range
  
  // 在实际项目中，这里会根据日期范围获取对应的打卡记录
  if (range === 'today') {
    // 今天的数据（当前显示的数据）
  } else if (range === 'yesterday') {
    // 昨天的数据
    personInfo.value.today_checkin_status = '昨日打卡 3/3'
  } else if (range === 'week') {
    // 近7天的数据
    personInfo.value.today_checkin_status = '近7天平均 85%'
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.supervisor-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 48rpx 32rpx;
}

.person-info-section {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
}

.person-avatar {
  margin-right: 32rpx;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #F48224;
}

.person-details {
  flex: 1;
}

.person-name {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.person-checkin-status {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 32rpx;
}

.contact-actions {
  display: flex;
  gap: 24rpx;
}

.contact-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border: none;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.checkin-overview-section {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #624731;
}

.date-selector {
  display: flex;
  gap: 16rpx;
}

.date-btn {
  padding: 12rpx 24rpx;
  background: #F8F8F8;
  color: #666;
  border: none;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.date-btn.active {
  background: #F48224;
  color: white;
}

.checkin-list {
  margin-top: 32rpx;
}

.checkin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F8F8F8;
}

.checkin-item:last-child {
  border-bottom: none;
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

.item-planned-time {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.item-status {
  text-align: right;
}

.status-text {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.status-text.checked {
  color: #10B981;
}

.status-text.unchecked {
  color: #EF4444;
}

.status-text.revoked {
  color: #6B7280;
}

.checkin-time {
  display: block;
  font-size: 24rpx;
  color: #666;
}
</style>