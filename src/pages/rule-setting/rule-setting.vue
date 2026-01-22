<template>
  <view
    class="rule-setting-container"
    data-testid="rule-list-page"
  >
    <!-- 顶部标题 -->
    <view class="header-section">
      <text
        class="header-title"
        data-testid="rule-list-title"
      >
        打卡规则
      </text>
      <text class="header-subtitle">
        管理您的个人打卡规则和查看社区规则
      </text>
    </view>

    <!-- 加载状态 -->
    <view
      v-if="loading"
      class="loading-container"
    >
      <uni-load-more status="loading" />
    </view>

    <!-- 错误状态 -->
    <view
      v-else-if="error"
      class="error-container"
    >
      <text class="error-text">
        {{ error }}
      </text>
      <button
        class="retry-btn"
        @click="getCheckinRules"
      >
        重试
      </button>
    </view>

    <!-- 规则列表 -->
    <view
      v-else-if="rules.length > 0"
      class="rules-list-section"
    >
      <!-- 个人规则 -->
      <view
        v-if="personalRules.length > 0"
        class="rules-group"
      >
        <view class="group-title">
          <text class="group-icon">
            👤
          </text>
          <text class="group-text">
            个人规则
          </text>
        </view>
        <view
          v-for="rule in personalRules"
          :key="rule.rule_id"
          class="rule-item"
          :data-testid="`rule-item-${rule.rule_name}`"
        >
          <view class="rule-icon">
            <text
              v-if="rule.icon_url"
              class="icon-emoji"
            >
              {{ rule.icon_url }}
            </text>
            <text
              v-else
              class="icon-default"
            >
              📋
            </text>
          </view>
          <view class="rule-info">
            <text class="rule-name">
              {{ rule.rule_name }}
            </text>
            <text class="rule-details">
              {{ getFrequencyDetail(rule) }}
              <text v-if="displayTimeSlot(rule)">
                • {{ getTimeSlotDetail(rule) }}
              </text>
            </text>
            <text class="rule-source personal-source">
              👤 个人规则
            </text>
          </view>
          
          <view class="rule-actions">
            <button
              class="edit-btn"
              data-testid="rule-edit-button"
              @click="editRule(rule)"
            >
              编辑
            </button>
            <button
              class="delete-btn"
              data-testid="rule-delete-button"
              @click="showDeleteModal(rule)"
            >
              删除
            </button>
            <button
              class="invite-btn"
              data-testid="rule-invite-button"
              @click="inviteForRule(rule)"
            >
              分享
            </button>
            <button
              class="invite-btn invite-btn-primary"
              data-testid="rule-invite-button"
              @click="showInviteModal(rule)"
            >
              邀请
            </button>
          </view>
        </view>
      </view>

      <!-- 社区规则 -->
      <view
        v-if="communityRules.length > 0"
        class="rules-group"
      >
        <view class="group-title">
          <text class="group-icon">
            🏘️
          </text>
          <text class="group-text">
            社区规则
          </text>
          <text class="group-hint">
            （由社区管理员设置）
          </text>
        </view>
        <view 
          v-for="rule in communityRules" 
          :key="rule.community_rule_id" 
          class="rule-item community-rule-item"
        >
          <view class="rule-icon">
            <text
              v-if="rule.icon_url"
              class="icon-emoji"
            >
              {{ rule.icon_url }}
            </text>
            <text
              v-else
              class="icon-default"
            >
              🏘️
            </text>
          </view>
          <view class="rule-info">
            <text class="rule-name">
              {{ rule.rule_name }}
            </text>
            <text class="rule-details">
              {{ getFrequencyDetail(rule) }}
              <text v-if="displayTimeSlot(rule)">
                • {{ getTimeSlotDetail(rule) }}
              </text>
            </text>
            <text class="rule-source community-source">
              🏘️ {{ rule.community_name || '社区' }}要求
              <text
                v-if="!rule.is_enabled"
                class="rule-status-disabled"
              >
                （已停用）
              </text>
            </text>
          </view>
          
          <view class="rule-actions">
            <button
              class="view-btn"
              @click="viewCommunityRule(rule)"
            >
              查看
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 无规则提示 -->
    <view
      v-else
      class="empty-section"
    >
      <text class="empty-text">
        暂无打卡规则
      </text>
      <text class="empty-subtext">
        点击下方按钮添加您的第一个打卡事项
      </text>
    </view>

    <!-- 添加规则按钮 -->
    <view class="add-rule-section">
      <button
        class="add-rule-btn"
        data-testid="add-personal-rule-button"
        @click="addNewRule"
      >
        <text class="add-icon">
          +
        </text>
        <text class="add-text">
          添加个人规则
        </text>
      </button>
    </view>

    <!-- 删除确认弹窗 -->
    <view
      v-if="showDeleteConfirm"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            删除打卡规则
          </text>
        </view>
        <view class="modal-body">
          <text class="modal-text">
            确定要删除 "{{ selectedRule?.rule_name }}" 吗？
          </text>
          <text class="modal-subtext">
            删除后该打卡规则将不再生效
          </text>
        </view>
        <view class="modal-actions">
          <button
            class="modal-cancel-btn"
            @click="hideDeleteModal"
          >
            取消
          </button>
          <button
            class="modal-confirm-btn"
            @click="confirmDelete"
          >
            删除
          </button>
        </view>
      </view>
    </view>
    <!-- 分享链接弹窗 -->
    <view
      v-if="showShareModal"
      class="modal-overlay"
    >
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">
            分享链接
          </text>
        </view>
        <view class="modal-body">
          <text class="modal-subtext">
            复制以下链接或在微信中分享此页面
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

    <!-- 邀请监护人弹窗 -->
    <InviteModal
      :visible="showInviteModal"
      :rule-id="selectedRuleForInvite?.rule_id"
      :rule-name="selectedRuleForInvite?.rule_name"
      @close="hideInviteModal"
      @success="handleInviteSuccess"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { authApi } from '@/api/auth'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { request } from '@/api/request'
import { getUserAllRules, isRuleEditable } from '@/api/user-checkin'
import InviteModal from '@/components/InviteModal.vue'

const userStore = useUserStore()
const rules = ref([])
const loading = ref(false)
const error = ref('')
const showDeleteConfirm = ref(false)
const selectedRule = ref(null)

// 计算属性：个人规则
const personalRules = computed(() => {
  return rules.value.filter(rule => rule.rule_source === 'personal')
})

// 计算属性：社区规则
const communityRules = computed(() => {
  return rules.value.filter(rule => rule.rule_source === 'community')
})

// 获取频率类型文本
const getFrequencyText = (type) => {
  const frequencyMap = {
    0: '每天',
    1: '每周',
    2: '工作日',
    3: '自定义'
  }
  return frequencyMap[type] || '未知'
}

// 频率详情：自定义则显示日期范围，否则显示选项本身
const getFrequencyDetail = (rule) => {
  if (rule.frequency_type === 3) {
    const start = rule.custom_start_date || '?'
    const end = rule.custom_end_date || '?'
    return `${start} 至 ${end}`
  }
  return getFrequencyText(rule.frequency_type)
}

// 是否显示时间段信息
const displayTimeSlot = (rule) => {
  return (rule.time_slot_type >= 1 && rule.time_slot_type <= 3) || (rule.time_slot_type === 4 && !!rule.custom_time)
}

// 时间段详情：1/2/3显示中文；4只显示时间，不显示"自定义时间"字样
const getTimeSlotDetail = (rule) => {
  if (rule.time_slot_type === 1) return '上午'
  if (rule.time_slot_type === 2) return '下午'
  if (rule.time_slot_type === 3) return '晚上'
  if (rule.time_slot_type === 4) return rule.custom_time || ''
  return ''
}

// 获取打卡规则列表
const getCheckinRules = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await getUserAllRules()
    
    if (response.code === 1) {
      rules.value = response.data.rules || []
    } else {
      error.value = response.msg || '获取打卡规则失败'
      rules.value = []
    }
  } catch (error) {
    console.error('获取打卡规则失败:', error)
    error.value = '网络错误，请稍后重试'
    rules.value = []
  } finally {
    loading.value = false
  }
}

// 添加新规则
const addNewRule = () => {
  uni.navigateTo({
    url: '/pages/add-rule/add-rule'
  })
}

// 编辑规则
const editRule = (rule) => {
  if (!isRuleEditable(rule)) {
    uni.showToast({
      title: '社区规则不可编辑',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/add-rule/add-rule?ruleId=${rule.rule_id}`
  })
}

// 查看社区规则
const viewCommunityRule = (rule) => {
  uni.showToast({
    title: '社区规则详情功能开发中',
    icon: 'none'
  })
}

// 显示删除确认弹窗
const showDeleteModal = (rule) => {
  if (!isRuleEditable(rule)) {
    uni.showToast({
      title: '社区规则不可删除',
      icon: 'none'
    })
    return
  }
  
  selectedRule.value = rule
  showDeleteConfirm.value = true
}

// 隐藏删除确认弹窗
const hideDeleteModal = () => {
  showDeleteConfirm.value = false
  selectedRule.value = null
}

// 确认删除规则
const confirmDelete = async () => {
  try {
    if (!selectedRule.value) return
    
    uni.showLoading({
      title: '删除中...'
    })
    
    // 使用新的API删除规则
    const response = await request({
      url: '/api/user-checkin/rules',
      method: 'DELETE',
      data: {
        rule_id: selectedRule.value.rule_id,
        rule_source: selectedRule.value.rule_source
      }
    })
    
    uni.hideLoading()
    
    if (response.code === 1) {
      uni.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
      // 从本地数据中移除
      const index = rules.value.findIndex(r => 
        r.rule_id === selectedRule.value.rule_id && 
        r.rule_source === selectedRule.value.rule_source
      )
      if (index !== -1) {
        rules.value.splice(index, 1)
      }
      
      hideDeleteModal()
    } else {
      uni.showToast({
        title: response.msg || '删除失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('删除打卡规则失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    })
  }
}

onMounted(() => {
  getCheckinRules()
})

onShow(() => {
  getCheckinRules()
})

// 生成某规则的分享链接
const showShareModal = ref(false)
const lastInvitePath = ref('')
const hideShareModal = () => { showShareModal.value = false }
const copyInvitePath = () => {
  if (!lastInvitePath.value) return
  uni.setClipboardData({ data: lastInvitePath.value, success(){ uni.showToast({ title:'已复制', icon:'none' }) } })
}

// 邀请监护人
const showInviteModal = ref(false)
const selectedRuleForInvite = ref(null)
const hideInviteModal = () => { showInviteModal.value = false }
const showInviteModalForRule = (rule) => {
  selectedRuleForInvite.value = rule
  showInviteModal.value = true
}

const inviteForRule = async (rule) => {
  // 社区规则不能分享
  if (rule.rule_source === 'community') {
    uni.showToast({
      title: '社区规则不能分享监督人',
      icon: 'none'
    })
    return
  }
  
  const res = await authApi.inviteSupervisorLink({ rule_ids: [rule.rule_id] })
  if (res.code === 1) {
    lastInvitePath.value = res.data?.mini_path || ''
    showShareModal.value = true
  } else {
    uni.showToast({ title: res.msg || '生成分享失败', icon: 'none' })
  }
}

const handleInviteSuccess = (data) => {
  uni.showToast({
    title: '邀请已发送',
    icon: 'success'
  })
  hideInviteModal()
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.rule-setting-container {
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

.loading-container,
.error-container {
  padding: $uni-spacing-xxxl $uni-spacing-xl;
  text-align: center;
  
  .error-text {
    color: $uni-error;
    font-size: $uni-font-size-base;
    margin-bottom: $uni-spacing-xl;
  }
  
  .retry-btn {
    @include btn-primary;
    padding: $uni-spacing-sm $uni-spacing-lg;
    font-size: $uni-font-size-base;
  }
}

.rules-group {
  margin-bottom: 48rpx;
}

.group-title {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  
  .group-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
  }
  
  .group-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #624731;
  }
  
  .group-hint {
    font-size: 24rpx;
    color: #999;
    margin-left: 12rpx;
  }
}

.rule-item {
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.community-rule-item {
  border-left: 8rpx solid #52c41a;
}

.rule-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  background: #FFF7ED;
  border: 2rpx solid #F59E0B;
  border-radius: 16rpx;
  margin-right: 24rpx;
  
  .icon-emoji {
    font-size: 48rpx;
  }
  
  .icon-default {
    font-size: 48rpx;
  }
}

.rule-info {
  flex: 1;
}

.rule-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.rule-details {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.rule-source {
  display: block;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  width: fit-content;
  
  &.personal-source {
    background: #E0F2FE;
    color: #0284C7;
  }
  
  &.community-source {
    background: #F6FFED;
    color: #52c41a;
  }
}

.rule-status-disabled {
  color: #999;
  font-size: 20rpx;
}

.rule-actions {
  display: flex;
  gap: 16rpx;
}

.view-btn {
  background: #F6FFED;
  color: #52c41a;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: 2rpx solid #52c41a;
}

.invite-btn {
  background: #FFF7ED;
  color: #F48224;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: 2rpx solid #F48224;
}

.invite-btn-primary {
  background: $uni-primary;
  color: #fff;
  border: none;
}

.edit-btn {
  background: #E0F2FE;
  color: #0284C7;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
}

.delete-btn {
  background: #FEE2E2;
  color: #EF4444;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  border: none;
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

.add-rule-section {
  position: fixed;
  bottom: 48rpx;
  left: 32rpx;
  right: 32rpx;
}

.add-rule-btn {
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

.add-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.add-text {
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