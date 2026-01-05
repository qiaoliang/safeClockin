<template>
  <view class="event-timeline">
    <!-- 将事件发起信息和消息列表合并显示 -->
    <view
      v-for="item in displayList"
      :key="item.id || item.support_id"
      class="timeline-item"
      :class="{ 'is-staff': isStaffMessage(item), 'is-user': isUserMessage(item) }"
    >
      <!-- 时间点 -->
      <view class="timeline-time">
        <text class="time-text">
          {{ formatTime(item.created_at) }}
        </text>
      </view>

      <!-- 消息内容 -->
      <view class="timeline-content">
        <!-- 头像 -->
        <image class="avatar" :src="getUserAvatar(item)" mode="aspectFill" />

        <!-- 消息主体 -->
        <view class="message-body">
          <!-- 姓名 -->
          <text class="user-name">
            {{ getUserName(item) }}
          </text>

          <!-- 回应标签（工作人员） -->
          <view
            v-if="item.support_tags && item.support_tags.length > 0"
            class="tags-container"
          >
            <text
              v-for="(tag, tagIndex) in item.support_tags"
              :key="tagIndex"
              class="tag"
            >
              {{ tag }}
            </text>
          </view>

          <!-- 文字内容 -->
          <text v-if="item.support_content || item.event_content" class="message-text">
            {{ item.event_content || item.support_content }}
          </text>

          <!-- 图片消息 -->
          <image
            v-if="item.message_type === 'image' && item.media_url"
            class="message-image"
            :src="getMediaUrl(item.media_url)"
            mode="aspectFill"
            @click="previewImage(item.media_url)"
          />

          <!-- 语音消息 -->
          <view
            v-if="item.message_type === 'voice' && item.media_url"
            class="voice-message"
            @click="playVoice(item)"
          >
            <text class="voice-icon"> 🎤 </text>
            <text class="voice-duration"> {{ item.media_duration }}" </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="displayList.length === 0" class="empty-state">
      <text class="empty-text"> 暂无消息 </text>
    </view>
  </view>
</template>

<script setup>
import { computed, watch } from "vue";
import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  eventInfo: {
    type: Object,
    default: null,
  },
  // 是否为工作人员视图
  isStaffView: {
    type: Boolean,
    default: false,
  },
});

// 计算属性：合并事件发起信息和消息列表，按时间倒序排列
const displayList = computed(() => {
  const list = [];

  console.log('🔍 [DEBUG] EventTimeline - eventInfo:', props.eventInfo);
  console.log('🔍 [DEBUG] EventTimeline - messages:', props.messages);

  // 如果有事件信息，将事件发起作为第一条消息
  if (props.eventInfo) {
    console.log('🔍 [DEBUG] EventTimeline - 添加事件发起消息');
    list.push({
      id: "event-start",
      support_id: "event-start",
      created_at: props.eventInfo.created_at,
      supporter_id: props.eventInfo.created_by,
      support_tags: [],
      message_type: "text",
      media_url: null,
      media_duration: null,
      support_content: null,
      event_content: `${props.eventInfo.creator_nickname || '用户'}发起了求助：${props.eventInfo.title}${
        props.eventInfo.description ? `（${props.eventInfo.description}）` : ""
      }`,
      is_event_start: true,
    });
  } else {
    console.log('🔍 [DEBUG] EventTimeline - eventInfo 为空，不添加事件发起消息');
  }

  // 添加所有消息
  if (props.messages && props.messages.length > 0) {
    list.push(...props.messages);
  }

  // 按时间倒序排列（最新的在上面）
  const sorted = list.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  console.log('EventTimeline displayList:', sorted);
  return sorted;
});

// 判断消息是否由当前用户发送
const isMyMessage = (message) => {
  if (message.is_event_start) return false;
  const currentUserId = userStore.userInfo?.userId;
  return message.supporter_id === currentUserId;
};

// 判断是否为工作人员消息
const isStaffMessage = (message) => {
  // 事件发起信息不算工作人员消息
  if (message.is_event_start) {
    return false;
  }
  // 工作人员视图：所有非事件发起的消息都是工作人员消息（包括"我"和其他工作人员）
  if (props.isStaffView) {
    return true;
  }
  // 用户视图：有快捷指令的认为是工作人员消息
  return message.support_tags && message.support_tags.length > 0;
};

// 判断是否为用户消息
const isUserMessage = (message) => {
  return !isStaffMessage(message);
};

// 获取用户头像
const getUserAvatar = (message) => {
  // 这里需要从用户信息中获取头像
  return "https://s.coze.cn/image/dhcVCXur50w/";
};

// 获取用户名称
const getUserName = (message) => {
  // 事件发起信息
  if (message.is_event_start) {
    return props.isStaffView ? "用户" : "我";
  }
  // 如果是当前用户，显示"我"
  if (isMyMessage(message)) {
    return "我";
  }
  // 工作人员视图：显示发送人名称
  if (props.isStaffView) {
    return message.sender_name || "工作人员";
  }
  // 用户视图：显示"工作人员"
  return "工作人员";
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return "刚刚";
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  // 超过24小时，显示具体时间
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 获取媒体URL
const getMediaUrl = (url) => {
  // 这里需要根据实际情况处理URL
  return url;
};

// 预览图片
const previewImage = (url) => {
  uni.previewImage({
    urls: [getMediaUrl(url)],
  });
};

// 播放语音
const playVoice = () => {
  uni.showToast({
    title: "语音播放功能开发中",
    icon: "none",
  });
};

// 监听 messages 变化
watch(() => props.messages, (newVal) => {
  console.log('EventTimeline messages changed:', newVal);
}, { deep: true });
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.event-timeline {
  padding: $uni-spacing-base;
}

.timeline-item {
  display: flex;
  flex-direction: row;
  margin-bottom: $uni-spacing-xl;

  &.is-staff {
    .timeline-content {
      flex-direction: row;
    }

    .avatar {
      margin-right: $uni-spacing-base;
    }

    .message-body {
      background: $uni-bg-color-white;
      border-radius: $uni-radius-lg;
      padding: $uni-spacing-base;
      box-shadow: $uni-shadow-sm;
    }
  }

  &.is-user {
    .timeline-content {
      flex-direction: row-reverse;
    }

    .avatar {
      margin-left: $uni-spacing-base;
    }

    .message-body {
      background: $uni-primary;
      color: $uni-white;
      border-radius: $uni-radius-lg;
      padding: $uni-spacing-base;
      box-shadow: $uni-shadow-primary-sm;
    }
  }
}

.timeline-time {
  width: 120rpx;
  display: flex;
  align-items: flex-start;
  padding-top: $uni-spacing-xs;
}

.time-text {
  font-size: $uni-font-size-xs;
  color: $uni-text-secondary;
  text-align: center;
}

.timeline-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: $uni-radius-full;
  flex-shrink: 0;
}

.message-body {
  flex: 1;
  max-width: 70%;
}

.user-name {
  display: block;
  font-size: $uni-font-size-sm;
  font-weight: $uni-font-weight-bold;
  margin-bottom: $uni-spacing-xs;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-xs;
  margin-bottom: $uni-spacing-xs;
}

.tag {
  display: inline-block;
  padding: $uni-spacing-xs $uni-spacing-base;
  background: $uni-primary-light;
  color: $uni-primary;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
}

.message-text {
  display: block;
  font-size: $uni-font-size-base;
  line-height: 1.6;
  word-wrap: break-word;
}

.event-description {
  font-size: $uni-font-size-sm;
  color: $uni-text-secondary;
}

.message-image {
  width: 100%;
  max-width: 400rpx;
  max-height: 400rpx;
  border-radius: $uni-radius-md;
  margin-top: $uni-spacing-xs;
}

.voice-message {
  display: flex;
  align-items: center;
  gap: $uni-spacing-sm;
  padding: $uni-spacing-sm $uni-spacing-base;
  background: $uni-bg-overlay-light;
  border-radius: $uni-radius-lg;
  margin-top: $uni-spacing-xs;

  .is-user & {
    background: rgba(255, 255, 255, 0.2);
  }
}

.voice-icon {
  font-size: $uni-font-size-xl;
}

.voice-duration {
  font-size: $uni-font-size-sm;
}

.empty-state {
  text-align: center;
  padding: $uni-spacing-xxl;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-text-secondary;
}
</style>
