<template>
  <view class="container">
    <view class="header">
      <text class="title">用户状态调试工具</text>
    </view>
    
    <view class="section">
      <text class="section-title">当前状态</text>
      <view class="state-info">
        <text>登录状态: {{ diagnosis.isLoggedIn ? '已登录' : '未登录' }}</text>
        <text>Token有效: {{ diagnosis.isTokenValid ? '是' : '否' }}</text>
        <text>有用户数据: {{ diagnosis.hasUserState ? '是' : '否' }}</text>
        <text>有Token: {{ diagnosis.hasToken ? '是' : '否' }}</text>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">调试操作</text>
      <button @click="runDiagnosis" class="btn">诊断用户状态</button>
      <button @click="forceClear" class="btn danger">强制清理状态</button>
      <button @click="testNetwork" class="btn">测试网络连接</button>
    </view>
    
    <view class="section">
      <text class="section-title">控制台日志</text>
      <scroll-view class="log-container" scroll-y>
        <text class="log-text">{{ logText }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const diagnosis = ref({
  isLoggedIn: false,
  isTokenValid: false,
  hasUserState: false,
  hasToken: false
})
const logText = ref('')

function appendLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  logText.value += `[${timestamp}] ${message}\n`
}

function runDiagnosis() {
  appendLog('开始诊断用户状态...')
  const result = userStore.diagnoseUserState()
  diagnosis.value = result
  appendLog(`诊断完成: ${JSON.stringify(result, null, 2)}`)
}

function forceClear() {
  uni.showModal({
    title: '确认清理',
    content: '这将清除所有用户数据，需要重新登录。确定继续吗？',
    success: (res) => {
      if (res.confirm) {
        appendLog('开始强制清理用户状态...')
        userStore.forceClearUserState()
        appendLog('用户状态已清理')
        runDiagnosis()
      }
    }
  })
}

async function testNetwork() {
  appendLog('测试网络连接...')
  try {
    const response = await uni.request({
      url: 'http://localhost:8080/api/sms/send_code',
      method: 'POST',
      data: { phone: '13800138000', purpose: 'test' },
      timeout: 5000
    })
    
    if (response.statusCode === 200) {
      appendLog('网络连接正常')
    } else {
      appendLog(`网络异常: ${response.statusCode}`)
    }
  } catch (error) {
    appendLog(`网络测试失败: ${error.message}`)
  }
}

onMounted(() => {
  runDiagnosis()
})
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.section {
  background-color: white;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.state-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.state-info text {
  font-size: 14px;
  color: #666;
}

.btn {
  background-color: #007aff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  margin: 5px;
  font-size: 14px;
}

.btn.danger {
  background-color: #ff3b30;
}

.log-container {
  height: 200px;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.log-text {
  font-family: monospace;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>