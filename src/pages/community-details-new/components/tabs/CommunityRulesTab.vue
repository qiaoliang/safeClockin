<template>
  <view class="community-rules-tab">
    <!-- 标题 -->
    <view class="tab-header">
      <h3 class="tab-title">社区打卡规则</h3>
      <button class="add-button" @click="handleAddRule">
        <text class="add-icon">+</text>
        <text class="add-text">添加规则</text>
      </button>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadRules">重试</button>
    </view>
    
    <!-- 空状态 -->
    <view v-else-if="rules.length === 0" class="empty-container">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无社区打卡规则</text>
      <text class="empty-text">点击右上角"添加规则"创建第一条规则</text>
      <text class="empty-hint">社区规则将自动应用于所有社区成员</text>
    </view>
    
    <!-- 规则列表 -->
    <view v-else class="rules-list">
      <view 
        v-for="rule in rules" 
        :key="rule.community_rule_id"
        class="rule-item"
        @click="handleViewRule(rule)"
      >
        <!-- 规则图标和名称 -->
        <view class="rule-header">
          <view class="rule-icon-container">
            <image 
              v-if="rule.icon_url" 
              :src="rule.icon_url" 
              class="rule-icon"
              mode="aspectFit"
            />
            <text v-else class="rule-icon-placeholder">📋</text>
          </view>
          <view class="rule-info">
            <text class="rule-name">{{ rule.rule_name }}</text>
            <text class="rule-details">
              {{ getFrequencyText(rule.frequency_type) }} · 
              {{ getTimeSlotText(rule.time_slot_type) }}
              <text v-if="rule.custom_time">
                ({{ formatTime(rule.custom_time) }})
              </text>
            </text>
          </view>
        </view>
        
        <!-- 规则状态和操作 -->
        <view class="rule-footer">
          <view class="rule-status">
            <text 
              class="status-badge"
              :class="{
                'status-enabled': rule.is_enabled,
                'status-disabled': !rule.is_enabled
              }"
            >
              {{ rule.is_enabled ? '已启用' : '已停用' }}
            </text>
            <text class="rule-time">
              创建于 {{ formatDate(rule.created_at) }}
            </text>
          </view>
          <view class="rule-actions">
            <!-- 启用/停用按钮 -->
            <button 
              v-if="rule.is_enabled"
              class="action-btn disable-btn"
              @click.stop="handleToggleRule(rule, false)"
            >
              停用
            </button>
            <button 
              v-else
              class="action-btn enable-btn"
              @click.stop="handleToggleRule(rule, true)"
            >
              启用
            </button>
            
            <!-- 编辑按钮 -->
            <button 
              class="action-btn edit-btn"
              @click.stop="handleEditRule(rule)"
            >
              编辑
            </button>
            
            <!-- 删除按钮 -->
            <button 
              class="action-btn delete-btn"
              @click.stop="handleDeleteRule(rule)"
            >
              删除
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 规则详情模态框 -->
    <uni-popup ref="ruleDetailPopup" type="bottom">
      <view class="rule-detail-modal" v-if="selectedRule">
        <view class="modal-header">
          <text class="modal-title">规则详情</text>
          <button class="modal-close" @click="closeRuleDetail">×</button>
        </view>
        
        <view class="modal-content">
          <!-- 规则基本信息 -->
          <view class="detail-section">
            <text class="section-title">基本信息</text>
            <view class="detail-item">
              <text class="detail-label">规则名称：</text>
              <text class="detail-value">{{ selectedRule.rule_name }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">规则状态：</text>
              <text 
                class="detail-value"
                :class="{
                  'status-enabled': selectedRule.is_enabled,
                  'status-disabled': !selectedRule.is_enabled
                }"
              >
                {{ selectedRule.is_enabled ? '已启用' : '已停用' }}
              </text>
            </view>
            <view class="detail-item">
              <text class="detail-label">创建时间：</text>
              <text class="detail-value">{{ formatDate(selectedRule.created_at) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">创建者：</text>
              <text class="detail-value">{{ selectedRule.creator?.nickname || '未知' }}</text>
            </view>
          </view>
          
          <!-- 规则设置 -->
          <view class="detail-section">
            <text class="section-title">规则设置</text>
            <view class="detail-item">
              <text class="detail-label">打卡频率：</text>
              <text class="detail-value">{{ getFrequencyText(selectedRule.frequency_type) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">打卡时间：</text>
              <text class="detail-value">{{ getTimeSlotText(selectedRule.time_slot_type) }}</text>
            </view>
            <view v-if="selectedRule.custom_time" class="detail-item">
              <text class="detail-label">自定义时间：</text>
              <text class="detail-value">{{ formatTime(selectedRule.custom_time) }}</text>
            </view>
            <view v-if="selectedRule.week_days !== 127" class="detail-item">
              <text class="detail-label">适用星期：</text>
              <text class="detail-value">{{ getWeekDaysText(selectedRule.week_days) }}</text>
            </view>
            <view v-if="selectedRule.custom_start_date && selectedRule.custom_end_date" class="detail-item">
              <text class="detail-label">适用日期：</text>
              <text class="detail-value">
                {{ formatDate(selectedRule.custom_start_date) }} 至 {{ formatDate(selectedRule.custom_end_date) }}
              </text>
            </view>
          </view>
          
          <!-- 规则影响 -->
          <view class="detail-section">
            <text class="section-title">规则影响</text>
            <view class="detail-item">
              <text class="detail-label">适用用户数：</text>
              <text class="detail-value">{{ selectedRule.user_count || 0 }} 人</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">今日打卡数：</text>
              <text class="detail-value">{{ selectedRule.today_checkins || 0 }} 次</text>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-btn secondary-btn" @click="closeRuleDetail">关闭</button>
          <button class="modal-btn primary-btn" @click="handleEditRule(selectedRule)">编辑规则</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getCommunityRules, createCommunityRule, updateCommunityRule, deleteCommunityRule, enableCommunityRule, disableCommunityRule } from '@/api/community-checkin'

const props = defineProps({
  ruleList: {
    type: Array,
    default: () => []
  },
  communityId: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['add-rule', 'edit-rule', 'remove-rule'])

// 数据状态
const loading = ref(false)
const error = ref('')
const rules = ref([])
const selectedRule = ref(null)

// 弹出框引用
const ruleDetailPopup = ref(null)

// 频率类型映射
const frequencyTypes = {
  0: '每天',
  1: '每周',
  2: '工作日',
  3: '自定义日期'
}

// 时间段类型映射
const timeSlotTypes = {
  1: '上午 (09:00)',
  2: '下午 (14:00)',
  3: '晚上 (20:00)',
  4: '自定义时间'
}

// 星期映射
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 监听communityId变化
watch(() => props.communityId, (newVal) => {
  if (newVal) {
    loadRules()
  }
})

// 组件挂载时加载规则
onMounted(() => {
  if (props.communityId) {
    loadRules()
  }
  
  // 监听规则刷新事件
  uni.$on('community-rules-refresh', (refreshedCommunityId) => {
    if (refreshedCommunityId === props.communityId) {
      loadRules()
    }
  })
})

// 组件卸载时清理事件监听
import { onUnmounted } from 'vue'
onUnmounted(() => {
  uni.$off('community-rules-refresh')
})

// 加载规则列表
const loadRules = async () => {
  if (!props.communityId) {
    error.value = '社区ID不能为空'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await getCommunityRules(props.communityId)
    if (response.code === 1) {
      rules.value = response.data.rules || []
    } else {
      error.value = response.msg || '获取规则列表失败'
      rules.value = []
    }
  } catch (err) {
    console.error('加载规则列表失败:', err)
    error.value = '网络错误，请稍后重试'
    rules.value = []
  } finally {
    loading.value = false
  }
}

// 获取频率文本
const getFrequencyText = (frequencyType) => {
  return frequencyTypes[frequencyType] || '未知频率'
}

// 获取时间段文本
const getTimeSlotText = (timeSlotType) => {
  return timeSlotTypes[timeSlotType] || '未知时间段'
}

// 获取星期文本
const getWeekDaysText = (weekDaysValue) => {
  if (weekDaysValue === 127) return '每天'
  
  const selectedDays = []
  for (let i = 0; i < 7; i++) {
    if (weekDaysValue & (1 << i)) {
      selectedDays.push(weekDays[i])
    }
  }
  return selectedDays.join('、')
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  if (typeof timeStr === 'string') {
    return timeStr.substring(0, 5) // 只显示时:分
  }
  return timeStr
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 处理添加规则
const handleAddRule = () => {
  uni.navigateTo({
    url: `/pages/community-checkin-rule-form/community-checkin-rule-form?communityId=${props.communityId}`
  })
}

// 处理编辑规则
const handleEditRule = (rule) => {
  uni.navigateTo({
    url: `/pages/community-checkin-rule-form/community-checkin-rule-form?communityId=${props.communityId}&ruleId=${rule.community_rule_id}`
  })
}

// 处理查看规则详情
const handleViewRule = (rule) => {
  selectedRule.value = rule
  ruleDetailPopup.value.open()
}

// 关闭规则详情
const closeRuleDetail = () => {
  ruleDetailPopup.value.close()
  selectedRule.value = null
}

// 处理启用/停用规则
const handleToggleRule = async (rule, enable) => {
  const action = enable ? '启用' : '停用'
  const confirmText = `确定要${action}该规则吗？${enable ? '启用后将对所有社区成员生效。' : '停用后社区成员将不再需要按此规则打卡。'}`
  
  uni.showModal({
    title: `确认${action}`,
    content: confirmText,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: `${action}中...` })
          
          let response
          if (enable) {
            response = await enableCommunityRule(rule.community_rule_id)
          } else {
            response = await disableCommunityRule(rule.community_rule_id)
          }
          
          if (response.code === 1) {
            uni.showToast({ title: `${action}成功`, icon: 'success' })
            // 重新加载规则列表
            await loadRules()
          } else {
            uni.showToast({ title: response.msg || `${action}失败`, icon: 'error' })
          }
        } catch (err) {
          console.error(`${action}规则失败:`, err)
          uni.showToast({ title: `${action}失败`, icon: 'error' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 处理删除规则
const handleDeleteRule = async (rule) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该规则吗？删除后所有社区成员将不再需要按此规则打卡，此操作不可撤销。',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          
          const response = await deleteCommunityRule(rule.community_rule_id)
          
          if (response.code === 1) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            // 重新加载规则列表
            await loadRules()
          } else {
            uni.showToast({ title: response.msg || '删除失败', icon: 'error' })
          }
        } catch (err) {
          console.error('删除规则失败:', err)
          uni.showToast({ title: '删除失败', icon: 'error' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-rules-tab {
  .tab-header {
    display: flex;
    align-items: center;
    margin-bottom: $uni-spacing-lg;
    
    .tab-title {
      font-size: $uni-font-size-base;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      flex: 1; /* 标题占据剩余空间，实现左对齐 */
    }
    
    .add-button {
      display: flex;
      align-items: center;
      gap: $uni-spacing-xs;
      padding: $uni-spacing-xs $uni-spacing-sm;
      background: transparent;
      border-radius: $uni-radius-sm;
      transition: all 0.2s ease;
      
      .add-icon {
        font-size: $uni-font-size-sm;
        color: $uni-secondary;
      }
      
      .add-text {
        font-size: $uni-font-size-xs;
        color: $uni-secondary;
        font-weight: $uni-font-weight-base;
      }
      
      &:active {
        background: rgba(144, 147, 153, 0.1);
        transform: scale(0.98);
      }
    }
  }
  
  .placeholder-container {
    @include card-gradient;
    padding: $uni-spacing-xxl;
    text-align: center;
    border-radius: $uni-radius-lg;
    margin-bottom: $uni-spacing-xl;
    
    .placeholder-icon {
      display: block;
      font-size: 48rpx;
      margin-bottom: $uni-spacing-md;
    }
    
    .placeholder-title {
      display: block;
      font-size: $uni-font-size-lg;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      margin-bottom: $uni-spacing-sm;
    }
    
    .placeholder-text {
      display: block;
      font-size: $uni-font-size-base;
      color: $uni-text-gray-600;
      margin-bottom: $uni-spacing-xs;
    }
    
    .placeholder-hint {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-gray-600;
    }
  }
  
  .placeholder-list {
    .placeholder-item {
      @include card-gradient;
      padding: $uni-spacing-lg;
      border-radius: $uni-radius-base;
      margin-bottom: $uni-spacing-base;
      display: flex;
      align-items: center;
      
      .item-icon {
        font-size: $uni-font-size-lg;
        margin-right: $uni-spacing-base;
        color: $uni-secondary;
      }
      
      .item-text {
        flex: 1;
        font-size: $uni-font-size-base;
        color: $uni-text-gray-700;
      }
      
      .item-status {
        font-size: $uni-font-size-xs;
        padding: $uni-spacing-xs $uni-spacing-sm;
        border-radius: $uni-radius-sm;
        background: $uni-bg-color-light;
        color: $uni-success;
      }
    }
  }
}
</style>