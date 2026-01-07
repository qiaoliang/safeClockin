<template>
  <uni-popup
    ref="popup"
    type="center"
    :safe-area="false"
    :mask-click="true"
    @mask-click="handleMaskClick"
  >
    <view class="event-detail-modal">
      <!-- 模态框头部 -->
      <view class="modal-header">
        <view class="header-left">
          <text class="header-title">
            {{ currentEvent?.title || '求助事件' }}
          </text>
          <text class="header-time">
            {{ formatEventTime(currentEvent?.created_at) }}
          </text>
        </view>
        <view class="header-right">
          <text
            class="close-btn"
            @click="close"
          >
            ✕
          </text>
        </view>
      </view>

      <!-- 事件信息 -->
      <view class="event-info">
        <view class="info-row">
          <text class="info-label">
            发起人：
          </text>
          <text class="info-value">
            {{ currentEvent?.creator_nickname || '用户' }}
          </text>
        </view>
        <view
          v-if="currentEvent?.description"
          class="info-row"
        >
          <text class="info-label">
            描述：
          </text>
          <text class="info-value">
            {{ currentEvent.description }}
          </text>
        </view>
        <view
          v-if="currentEvent?.location"
          class="info-row"
        >
          <text class="info-label">
            地点：
          </text>
          <text class="info-value">
            {{ currentEvent.location }}
          </text>
        </view>
      </view>

      <!-- 时间线 -->
      <view class="timeline-section">
        <view class="section-title">
          事件进展
        </view>
        <scroll-view
          class="timeline-scroll"
          scroll-y
          :scroll-top="scrollTop"
        >
          <EventTimeline
            :messages="eventMessages"
            :event-info="currentEvent"
            :is-staff-view="props.isStaffView"
          />
        </scroll-view>
      </view>

      <!-- 回应输入区 -->
      <view class="response-section">
        <view class="input-wrapper">
          <input
            v-model="responseText"
            class="response-input"
            placeholder="输入回应内容..."
            :maxlength="500"
          >
          <view class="input-actions">
            <button
              class="action-btn"
              @click="handleChooseImage"
            >
              📷
            </button>
            <button
              v-if="isStaffView && currentEvent?.status === 1"
              class="resolve-btn"
              @click="openResolveDialog"
            >
              问题已解决
            </button>
            <button
              class="action-btn"
              :disabled="!responseText.trim() && !selectedImage && selectedTags.length === 0"
              @click="handleSendResponse"
            >
              发送
            </button>
          </view>
        </view>

        <!-- 预设标签 -->
        <view class="preset-tags">
          <text
            v-for="tag in quickTags"
            :key="tag.text"
            :class="['preset-tag', getTagClass(tag.text), selectedTags.includes(tag.text) ? 'selected' : '']"
            @click="toggleTag(tag.text)"
          >
            {{ tag.text }}
          </text>
        </view>
      </view>

      <!-- 解决对话框 -->
      <uni-popup
        ref="resolvePopup"
        type="dialog"
        :safe-area="false"
      >
        <view class="resolve-dialog">
          <view class="dialog-header">
            <text class="dialog-title">
              确认问题已解决
            </text>
          </view>
          <view class="dialog-body">
            <textarea
              v-model="resolveReason"
              class="resolve-textarea"
              placeholder="请详细说明问题解决情况..."
              :maxlength="200"
            />
            <text
              :class="['char-count', { 'invalid': resolveReason.length < 5 }]"
            >
              {{ characterCountText }}
            </text>
          </view>
          <view class="dialog-footer">
            <button
              class="cancel-btn"
              @click="closeResolveDialog"
            >
              取消
            </button>
            <button
              class="confirm-btn"
              :disabled="!isResolveReasonValid || isResolving"
              @click="handleConfirmResolve"
            >
              {{ isResolving ? '关闭中...' : '确认' }}
            </button>
          </view>
        </view>
      </uni-popup>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommunityStore } from '@/store/modules/community'
import EventTimeline from '@/components/event/EventTimeline.vue'
import { getCurrentLocation, formatLocationMessage } from '@/utils/locationHelper.js'
import { QUICK_TAGS_CONFIG, getTagClassByType } from '@/config/quickTags.js'

const emit = defineEmits(['close'])
const props = defineProps({
  isStaffView: {
    type: Boolean,
    default: true
  }
})
const communityStore = useCommunityStore()

const popup = ref(null)
const resolvePopup = ref(null)
const responseText = ref('')
const selectedImage = ref(null)
const selectedTags = ref([])
const scrollTop = ref(0)

// 解决事件相关状态
const showResolveDialog = ref(false)
const resolveReason = ref('')
const isResolving = ref(false)

// 获取当前事件（从store）
const currentEvent = computed(() => communityStore.currentEvent)

// 验证解决原因是否有效
const isResolveReasonValid = computed(() =>
  resolveReason.value.length >= 5 && resolveReason.value.length <= 200
)

// 字符计数文本
const characterCountText = computed(() => {
  const count = resolveReason.value.length
  if (count < 5) {
    return `${count}/200字 (最少5字)`
  }
  return `${count}/200字`
})

const quickTags = computed(() => {
  return props.isStaffView ? QUICK_TAGS_CONFIG.staff : QUICK_TAGS_CONFIG.user
})

const getTagClass = (tag) => {
  const tagConfig = quickTags.value.find(t => t.text === tag)
  return tagConfig ? getTagClassByType(tagConfig.type) : '' 
}
const eventMessages = computed(() => communityStore.eventMessages)

const open = () => {
  popup.value?.open()
}

const close = () => {
  popup.value?.close()
  emit('close')
}

const handleMaskClick = () => {
  close()
}

const formatEventTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

const toggleTag = (tag) => {
  const tagConfig = quickTags.value.find(t => t.text === tag)
  
  // 特殊处理：定位按钮
  if (tagConfig?.action === 'getLocation') {
    handleLocationTag()
    return
  }
  
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}


const handleLocationTag = async () => {
  try {
    uni.showLoading({ title: '获取位置中...' })
    
    // 获取当前位置
    const location = await getCurrentLocation()
    
    // 格式化位置消息
    const locationMessage = formatLocationMessage(location)
    
    // 发送消息
    await sendMessage(locationMessage)
    
  } catch (error) {
    console.error('获取位置失败:', error)
    
    // 检查是否是权限拒绝
    if (error.errMsg && error.errMsg.includes('auth deny')) {
      uni.showModal({
        title: '位置权限',
        content: '请授权获取您的位置信息以便发送定位',
        confirmText: '去设置',
        success: (modalRes) => {
          if (modalRes.confirm) {
            uni.openSetting()
          }
        }
      })
    } else {
      uni.showToast({
        title: '获取位置失败',
        icon: 'none'
      })
    }
  } finally {
    uni.hideLoading()
  }
}

const sendMessage = async (content) => {
  try {
    const messageData = {
      message_type: 'text',
      message_content: content,
      message_tags: []
    }
    
    // 根据角色调用不同的 API
    if (props.isStaffView) {
      await communityStore.addResponse(messageData)
    } else {
      await communityStore.addEventMessage(messageData)
    }
    
    uni.showToast({
      title: '发送成功',
      icon: 'success'
    })
    
    // 滚动到顶部
    setTimeout(() => {
      scrollTop.value = 0
    }, 100)
  } catch (error) {
    console.error('发送消息失败:', error)
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    })
  }
}
const handleChooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      selectedImage.value = res.tempFilePaths[0]
    }
  })
}

const handleSendResponse = async () => {
  if (!responseText.value.trim() && !selectedImage.value && selectedTags.value.length === 0) {
    uni.showToast({
      title: '请输入回应内容或选择图片或选择快捷指令',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({ title: '发送中...' })

    const messageData = {
      message_type: selectedImage.value ? 'image' : 'text',
      message_content: responseText.value,
      message_tags: selectedTags.value
    }

    if (selectedImage.value) {
      // 上传图片
      const uploadRes = await uploadMedia(selectedImage.value, 'image')
      messageData.media_url = uploadRes.url
    }

    // 根据角色调用不同的 API
    if (props.isStaffView) {
      await communityStore.addResponse(messageData)
    } else {
      await communityStore.addEventMessage(messageData)
    }

    // 清空输入
    responseText.value = ''
    selectedImage.value = null
    selectedTags.value = []

    uni.hideLoading()
    uni.showToast({
      title: '发送成功',
      icon: 'success'
    })

    // 滚动到顶部（因为消息是按时间倒序排列，最新的在最上面）
    setTimeout(() => {
      scrollTop.value = 0
    }, 100)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    })
  }
}

const uploadMedia = async (filePath, type) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'http://localhost:9999/api/misc/upload',
      filePath,
      name: 'file',
      formData: {
        file_type: type
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 1) {
          resolve(data.data)
        } else {
          reject(new Error(data.msg || '上传失败'))
        }
      },
      fail: reject
    })
  })
}

// 打开解决对话框
const openResolveDialog = () => {
  resolveReason.value = ''
  showResolveDialog.value = true
  resolvePopup.value?.open()
}

// 关闭解决对话框
const closeResolveDialog = () => {
  showResolveDialog.value = false
  resolvePopup.value?.close()
}

// 确认解决事件
const handleConfirmResolve = async () => {
  if (!isResolveReasonValid.value || isResolving.value) return

  isResolving.value = true
  try {
    await communityStore.resolveEvent(
      currentEvent.value.event_id,
      resolveReason.value
    )

    uni.showToast({
      title: '问题已解决',
      icon: 'success'
    })

    closeResolveDialog()
    close() // 关闭事件详情模态框
  } catch (error) {
    uni.showToast({
      title: error.message || '关闭失败，请重试',
      icon: 'none'
    })
  } finally {
    isResolving.value = false
  }
}

// 监听事件消息变化，自动滚动到底部
watch(eventMessages, () => {
  setTimeout(() => {
    scrollTop.value = 999999
  }, 100)
}, { deep: true })

defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.event-detail-modal {
  width: 650rpx;
  max-height: 80vh;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-xxxl;
  border-bottom: 2rpx solid $uni-border-light;
}

.header-left {
  flex: 1;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-bold;
  color: $uni-text-primary;
  margin-bottom: $uni-spacing-xs;
}

.header-time {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-base;
}

.close-btn {
  font-size: $uni-font-size-xxxl;
  color: $uni-text-base;
  padding: $uni-spacing-xs;
}

.event-info {
  padding: $uni-spacing-xl $uni-spacing-xxxl;
  background: $uni-bg-color-lighter;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: $uni-spacing-base;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: $uni-font-size-base;
  color: $uni-text-base;
  min-width: 120rpx;
}

.info-value {
  flex: 1;
  font-size: $uni-font-size-base;
  color: $uni-text-primary;
}

.timeline-section {
  flex: 1;
  padding: $uni-spacing-xl $uni-spacing-xxxl;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-bold;
  color: $uni-text-primary;
  margin-bottom: $uni-spacing-xl;
}

.timeline-scroll {
  flex: 1;
  max-height: 400rpx;
  overflow-y: auto;
}

.response-section {
  padding: $uni-spacing-xl $uni-spacing-xxxl;
  border-top: 2rpx solid $uni-border-light;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: $uni-spacing-xl;
  margin-bottom: $uni-spacing-xl;
}

.response-input {
  flex: 1;
  padding: $uni-spacing-base $uni-spacing-xl;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-base;
}

.input-actions {
  display: flex;
  gap: $uni-spacing-base;
}

.action-btn {
  padding: $uni-spacing-base $uni-spacing-xl;
  background: $uni-primary;
  color: $uni-white;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-base;
  border: none;
}

.action-btn:disabled {
  background: $uni-border-base;
  color: $uni-text-base;
}

.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-base;
}

.preset-tag {
  padding: $uni-spacing-sm $uni-spacing-xl;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-sm;
  color: $uni-text-base;
  transition: all 0.3s ease;
}

.preset-tag.selected {
  background: $uni-primary;
  color: $uni-white;
}

.preset-tag.urgent {
  border: 2rpx solid $uni-danger;
  color: $uni-danger;
}

.preset-tag.warning {
  border: 2rpx solid $uni-warning;
  color: $uni-warning;
}

.preset-tag.location {
  border: 2rpx solid $uni-info;
  color: $uni-info;
}

.preset-tag.success {
  border: 2rpx solid $uni-success;
  color: $uni-success;
}

.resolve-btn {
  padding: $uni-spacing-base $uni-spacing-xl;
  background: $uni-success;
  color: $uni-white;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-base;
  border: none;
}

.resolve-dialog {
  width: 600rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xxxl;
}

.dialog-header {
  margin-bottom: $uni-spacing-xl;
}

.dialog-title {
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-text-primary;
}

.dialog-body {
  margin-bottom: $uni-spacing-xl;
}

.resolve-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: $uni-spacing-base;
  border: 2rpx solid $uni-border-base;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  margin-bottom: $uni-spacing-base;
  box-sizing: border-box;
}

.char-count {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-text-secondary;
  text-align: right;

  &.invalid {
    color: $uni-error;
  }
}

.dialog-footer {
  display: flex;
  gap: $uni-spacing-base;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: $uni-spacing-base;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
}

.cancel-btn {
  background: $uni-bg-color-lighter;
  color: $uni-text-primary;
}

.confirm-btn {
  background: $uni-success;
  color: $uni-white;

  &:disabled {
    background: $uni-border-base;
    color: $uni-text-secondary;
  }
}
</style>
