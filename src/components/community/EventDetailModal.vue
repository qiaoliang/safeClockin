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
            {{ currentEvent?.creator_name || '用户' }}
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
          <view
            v-for="message in eventMessages"
            :key="message.support_id"
            :class="['timeline-item', message.is_staff ? 'staff' : 'user']"
          >
            <view class="timeline-dot" />
            <view class="timeline-content">
              <view class="message-header">
                <text class="message-name">
                  {{ message.sender_name }}
                </text>
                <text class="message-time">
                  {{ formatMessageTime(message.created_at) }}
                </text>
              </view>
              
              <!-- 预设标签 -->
              <view
                v-if="message.support_tags && message.support_tags.length > 0"
                class="tags-container"
              >
                <text
                  v-for="tag in message.support_tags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </text>
              </view>

              <!-- 文字内容 -->
              <text
                v-if="message.message_type === 'text' && message.support_content"
                class="message-text"
              >
                {{ message.support_content }}
              </text>

              <!-- 图片内容 -->
              <image
                v-if="message.message_type === 'image' && message.media_url"
                class="message-image"
                :src="message.media_url"
                mode="aspectFill"
                @click="previewImage(message.media_url)"
              />

              <!-- 语音内容 -->
              <view
                v-if="message.message_type === 'voice' && message.media_url"
                class="message-voice"
                @click="playVoice(message)"
              >
                <text class="voice-icon">
                  🎤
                </text>
                <text class="voice-duration">
                  {{ message.media_duration || 0 }}"
                </text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view
            v-if="eventMessages.length === 0"
            class="empty-state"
          >
            <text class="empty-text">
              暂无进展记录
            </text>
          </view>
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
              class="action-btn"
              :disabled="!responseText.trim() && !selectedImage"
              @click="handleSendResponse"
            >
              发送
            </button>
          </view>
        </view>

        <!-- 预设标签 -->
        <view class="preset-tags">
          <text
            v-for="tag in presetTags"
            :key="tag"
            :class="['preset-tag', selectedTags.includes(tag) ? 'selected' : '']"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </text>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommunityStore } from '@/store/modules/community'

const emit = defineEmits(['close'])
const communityStore = useCommunityStore()

const popup = ref(null)
const responseText = ref('')
const selectedImage = ref(null)
const selectedTags = ref([])
const scrollTop = ref(0)

const presetTags = [
  '已电话联系',
  '正在前往',
  '已到达现场',
  '问题已解决',
  '需要进一步协助'
]

const currentEvent = computed(() => communityStore.currentEvent)
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

const formatMessageTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
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
  if (!responseText.value.trim() && !selectedImage.value) {
    uni.showToast({
      title: '请输入回应内容或选择图片',
      icon: 'none'
    })
    return
  }

  try {
    uni.showLoading({ title: '发送中...' })

    const messageData = {
      message_type: selectedImage.value ? 'image' : 'text',
      support_content: responseText.value,
      support_tags: selectedTags.value
    }

    if (selectedImage.value) {
      // 上传图片
      const uploadRes = await uploadMedia(selectedImage.value, 'image')
      messageData.media_url = uploadRes.url
    }

    await communityStore.addResponse(messageData)

    // 清空输入
    responseText.value = ''
    selectedImage.value = null
    selectedTags.value = []

    uni.hideLoading()
    uni.showToast({
      title: '发送成功',
      icon: 'success'
    })

    // 滚动到底部
    setTimeout(() => {
      scrollTop.value = 999999
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

const previewImage = (url) => {
  uni.previewImage({
    urls: [url]
  })
}

const playVoice = (message) => {
  uni.showToast({
    title: '语音播放功能开发中',
    icon: 'none'
  })
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
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid $uni-border-light;
}

.header-left {
  flex: 1;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-main-color;
  margin-bottom: 8rpx;
}

.header-time {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.close-btn {
  font-size: 48rpx;
  color: $uni-base-color;
  padding: 8rpx;
}

.event-info {
  padding: 24rpx 32rpx;
  background: $uni-bg-color-lighter;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  min-width: 120rpx;
}

.info-value {
  flex: 1;
  font-size: $uni-font-size-base;
  color: $uni-main-color;
}

.timeline-section {
  flex: 1;
  padding: 24rpx 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: $uni-font-size-lg;
  font-weight: 600;
  color: $uni-main-color;
  margin-bottom: 24rpx;
}

.timeline-scroll {
  flex: 1;
  max-height: 400rpx;
}

.timeline-item {
  display: flex;
  margin-bottom: 32rpx;
  position: relative;
}

.timeline-item.user {
  flex-direction: row-reverse;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: $uni-primary;
  margin: 8rpx 16rpx;
  flex-shrink: 0;
}

.timeline-item.user .timeline-dot {
  background: $uni-success;
}

.timeline-content {
  flex: 1;
  background: $uni-bg-color-lighter;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
}

.timeline-item.user .timeline-content {
  background: $uni-primary;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.message-name {
  font-size: $uni-font-size-base;
  font-weight: 500;
  color: $uni-main-color;
}

.timeline-item.user .message-name {
  color: $uni-white;
}

.message-time {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.timeline-item.user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.tag {
  padding: 4rpx 12rpx;
  background: $uni-bg-color-white;
  border-radius: 8rpx;
  font-size: $uni-font-size-sm;
  color: $uni-primary;
}

.message-text {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-main-color;
  line-height: 1.6;
}

.timeline-item.user .message-text {
  color: $uni-white;
}

.message-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
}

.message-voice {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  background: $uni-bg-color-white;
  border-radius: 24rpx;
  width: fit-content;
}

.voice-icon {
  font-size: 32rpx;
}

.voice-duration {
  font-size: $uni-font-size-base;
  color: $uni-main-color;
}

.empty-state {
  text-align: center;
  padding: 64rpx 0;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.response-section {
  padding: 24rpx 32rpx;
  border-top: 2rpx solid $uni-border-light;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.response-input {
  flex: 1;
  padding: 16rpx 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: 24rpx;
  font-size: $uni-font-size-base;
}

.input-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  background: $uni-primary;
  color: $uni-white;
  border-radius: 24rpx;
  font-size: $uni-font-size-base;
  border: none;
}

.action-btn:disabled {
  background: $uni-border-base;
  color: $uni-base-color;
}

.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.preset-tag {
  padding: 8rpx 16rpx;
  background: $uni-bg-color-lighter;
  border-radius: 24rpx;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
  transition: all 0.3s ease;
}

.preset-tag.selected {
  background: $uni-primary;
  color: $uni-white;
}
</style>