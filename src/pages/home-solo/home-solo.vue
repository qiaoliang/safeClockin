<template>
  <!-- 顶部问候区域 -->
  <uni-card
    class="greeting-card"
    :is-shadow="false"
    :is-full="false"
    :border="false"
    padding="40rpx"
  >
    <template #default>
      <view class="greeting-content">
        <view class="user-info-row">
          <view class="user-avatar-section">
            <image
              :src="userInfo?.avatarUrl || 'https://s.coze.cn/image/dhcVCXur50w/'"
              class="user-avatar-img"
              mode="aspectFill"
            />
            <view class="user-greeting">
              <text class="greeting-text">
                {{ getGreetingText() }}，{{ getDisplayName(userInfo) }}
              </text>
              <text
                v-if="userInfo?.community_name"
                class="community-text"
              >
                {{ userInfo.community_name }}
              </text>
              <text class="date-text">
                {{ getCurrentDate() }}
              </text>
            </view>
          </view>
          <view class="weather-info">
            <view class="weather-content">
              <text class="weather-icon">
                ☀️
              </text>
              <text class="weather-text">
                晴 18°C
              </text>
            </view>
          </view>
        </view>

        <!-- 角色切换标签 -->
        <view class="role-tabs">
          <view
            :class="['role-tab', currentRole === 'checkin' ? 'active' : '']"
            @click="switchRole('checkin')"
          >
            <text class="tab-icon">
              🕐
            </text>
            <text class="tab-text">
              今日打卡
            </text>
          </view>
          <view
            :class="['role-tab', currentRole === 'supervisor' ? 'active' : '']"
            @click="switchRole('supervisor')"
          >
            <text class="tab-icon">
              🛡️
            </text>
            <text class="tab-text">
              当前监护
            </text>
          </view>
        </view>
      </view>
    </template>
  </uni-card>

  <!-- 当前任务悬浮按钮 -->
  <view class="floating-tasks-section">
    <button
      class="floating-tasks-btn"
      :class="{
        'btn-no-rules': hasNoRules,
        'btn-all-completed': hasAllCompleted,
        'btn-missed-only': hasMissedOnly
      }"
      @click="handleTasksClick"
    >
      <view class="tasks-btn-content">
        <view class="tasks-icon-wrapper">
          <text class="tasks-icon">
            {{ tasksIcon }}
          </text>
          <view
            v-if="hasPendingTasks"
            class="tasks-badge"
          >
            {{ pendingCheckinCount }}
          </view>
        </view>
        <view class="tasks-text-content">
          <text class="tasks-title">
            {{ tasksTitle }}
          </text>
          <text class="tasks-subtitle">
            {{ tasksSubtitle }}
          </text>
        </view>
        <text class="tasks-arrow">
          ›
        </text>
      </view>
    </button>
  </view>

  <!-- 功能快捷入口 -->
  <uni-grid
    :column="3"
    :show-border="false"
    :square="false"
  >
    <uni-grid-item>
      <view
        class="grid-item-content"
        @click="handleSetRules"
      >
        <view
          class="grid-icon-wrapper"
          style="background: #b37fef"
        >
          <text class="grid-icon">
            ⚙️
          </text>
        </view>
        <text class="grid-text">
          查看规则
        </text>
      </view>
    </uni-grid-item>

    <uni-grid-item>
      <view
        class="grid-item-content"
        @click="handleGuardianManage"
      >
        <view
          class="grid-icon-wrapper"
          style="background: #8ce0a0"
        >
          <text class="grid-icon">
            👨‍👩‍👧
          </text>
        </view>
        <text class="grid-text">
          监护管理
        </text>
      </view>
    </uni-grid-item>

    <uni-grid-item>
      <view
        class="grid-item-content"
        @click="handleHealthRecord"
      >
        <view
          class="grid-icon-wrapper"
          style="background: #ffa0a0"
        >
          <text class="grid-icon">
            💗
          </text>
        </view>
        <text class="grid-text">
          健康记录
        </text>
      </view>
    </uni-grid-item>
  </uni-grid>

  <!-- 一键求助主按钮 / 事件进展卡片 -->
  <view class="today-tasks-section">
    <!-- 有进行中的事件时显示事件进展卡片 -->
    <view
      v-if="hasActiveEvent"
      class="event-progress-card"
    >
      <!-- 顶部操作栏 -->
      <view class="event-header">
        <button
          class="header-btn continue-btn"
          @click="handleContinueHelp"
        >
          <text class="btn-text">
            继续求助
          </text>
        </button>
        <button
          class="header-btn close-btn"
          @click="handleCloseEvent"
        >
          <text class="btn-text">
            问题已解决
          </text>
        </button>
      </view>

      <!-- 时间线区域 -->
      <view class="timeline-section">
        <EventTimeline
          :messages="eventMessages"
          :event-info="activeEvent"
        />
      </view>

      <!-- 底部输入区域 -->
      <view
        v-if="showInputSection"
        class="input-section"
      >
        <view class="input-row">
          <input
            v-model="messageInput"
            class="message-input"
            placeholder="输入消息..."
            @confirm="handleSendMessage"
          >
          <button
            class="send-btn"
            @click="handleSendMessage"
          >
            <text>发送</text>
          </button>
        </view>
        <view class="input-actions">
          <button
            class="action-btn"
            :class="{ 'recording': isRecording }"
            @touchstart="startRecording"
            @touchend="stopRecording"
          >
            <text>{{ isRecording ? `${recordingDuration}"` : '🎤' }}</text>
          </button>
          <button
            class="action-btn"
            @click="handleChooseImage"
          >
            <text>📷</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 没有进行中的事件时显示一键求助按钮 -->
    <button
      v-else
      class="help-btn"
      @click="handleOneClickHelp"
    >
      <text class="btn-icon">
        🆘
      </text>
      <text class="btn-text">
        一键求助
      </text>
      <text class="btn-subtext">
        遇到困难？立即求助
      </text>
    </button>
  </view>

  <!-- 关闭事件模态对话框 -->
  <uni-popup
    ref="closePopup"
    type="center"
    @change="onPopupChange"
  >
    <view class="close-event-modal">
      <view class="close-event-header">
        <text class="close-event-title">
          关闭事件
        </text>
      </view>
      <view class="close-event-content">
        <text class="close-event-hint">
          请说明事件当前的现状和关闭原因：
        </text>
        <textarea
          v-model="closeReason"
          class="close-reason-input"
          placeholder="请输入关闭原因（至少5个字符）"
          :maxlength="200"
        />
      </view>
      <view class="close-event-footer">
        <button
          class="close-event-btn cancel-btn"
          @click="handleCancelClose"
        >
          取消
        </button>
        <button
          class="close-event-btn confirm-btn"
          @click="confirmCloseEvent"
        >
          确认
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from '@/store/modules/user'
import { request } from '@/api/request'
import { useCheckinStore } from "@/store/modules/checkin";
import { useEventStore } from "@/store/modules/event";
import EventTimeline from "@/components/event/EventTimeline.vue";

const userStore = useUserStore();
const checkinStore = useCheckinStore();
const eventStore = useEventStore();

// 事件相关状态
const messageInput = ref('');
const showCloseModal = ref(false);
const closeReason = ref('');
const showInputSection = ref(false); // 控制输入区域的显示
const closePopup = ref(null); // 关闭事件模态框 ref

// 响应式变量
const currentRole = ref('checkin');
const pendingCheckinCount = ref(0);
const nearbyTasks = ref([]);

// 计算属性：任务状态
const hasNoRules = computed(() => nearbyTasks.value.length === 0);
const hasAllCompleted = computed(() => nearbyTasks.value.length > 0 && pendingCheckinCount.value === 0);
const hasPendingTasks = computed(() => pendingCheckinCount.value > 0);
const hasMissedTasks = computed(() => checkinStore.missedCheckinCount > 0);
const hasMissedOnly = computed(() => pendingCheckinCount.value === 0 && checkinStore.missedCheckinCount > 0 && nearbyTasks.value.length > 0);

// 计算属性：任务图标
const tasksIcon = computed(() => {
  if (hasNoRules.value) return '⏱️';
  if (hasMissedOnly.value) return '⚠️';
  if (hasAllCompleted.value) return '✅';
  return '📋';
});

// 计算属性：任务标题
const tasksTitle = computed(() => {
  if (hasNoRules.value) return '';
  if (hasMissedOnly.value) return '';
  if (hasAllCompleted.value) return '';
  return '当前任务';
});

// 计算属性：任务副标题
const tasksSubtitle = computed(() => {
  if (hasNoRules.value) return '开始行动，创建你的第一个打卡规则吧~';
  if (hasMissedOnly.value) return '今天你有错过的打卡记录，记得明天早点儿来哦~';
  if (hasAllCompleted.value) return '恭喜你，今日的打卡任务已全部完成。你是一个有超强行动力的人。';
  return `还有 ${pendingCheckinCount.value} 项未完成`;
});

// 计算属性：事件相关
const hasActiveEvent = computed(() => eventStore.hasActiveEvent);
const eventMessages = computed(() => eventStore.eventMessages);
const isRecording = computed(() => eventStore.isRecording);
const recordingDuration = computed(() => eventStore.recordingDuration);

// 计算属性：用户信息
const userInfo = computed(() => {
  const user = userStore.userInfo;
  if (!user) {
    return null;
  }

  // 确保昵称字段存在
  if (!user.nickName && !user.nickname) {
    if (user.wechat_openid) {
      user.nickName = `微信用户${user.wechat_openid.slice(-6)}`;
    } else {
      user.nickName = "用户";
    }
  }

  return user;
});

// 获取用户角色文本
const getRoleText = (role) => {
  const roleMap = {
    solo: "普通用户",
    supervisor: "监护人",
    community: "社区工作人员",
  };
  return roleMap[role] || "用户";
};

// 获取用户显示名称 - 添加多层防御
const getDisplayName = (user) => {
  // Layer 1: 入口点验证
  if (!user) {
    return "未登录用户";
  }

  // Layer 2: 业务逻辑验证 - 尝试多种昵称字段
  let displayName = user.nickName || user.nickname || user.userName || user.name;

  if (displayName) {
    return displayName;
  }

  // Layer 3: 环境保护 - 生成临时显示名称
  if (user.wechat_openid) {
    displayName = `微信用户${user.wechat_openid.slice(-6)}`;
    return displayName;
  }

  if (user.phone_number) {
    displayName = `用户${user.phone_number.slice(-4)}`;
    return displayName;
  }

  // Layer 4: 最终兜底
  return "用户";
};

// 初始化打卡数据
const initCheckinData = async () => {
  try {
    await checkinStore.initCheckinData();
    updateMainButton();
  } catch (error) {
    console.warn("⚠️ 初始化打卡数据失败:", error);
  }
};

// 更新主按钮状态
const updateMainButton = () => {
  try {
    // 根据当前任务状态更新按钮显示
    const hasPendingTasks = pendingCheckinCount.value > 0;
  } catch (error) {
    console.error("更新主按钮状态失败:", error);
  }
};

// 刷新打卡数据
const refreshCheckinData = async () => {
  try {
    await checkinStore.refreshData();
    updateMainButton();
    uni.showToast({ title: "数据已更新", icon: "success" });
  } catch (error) {
    console.error("刷新打卡数据失败:", error);
    uni.showToast({ title: "刷新失败", icon: "none" });
  }
};

const parseTodayTime = (hhmmss) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const t = hhmmss || "00:00:00";
  return new Date(`${todayStr}T${t}`);
};



// 一键求助处理函数
const handleOneClickHelp = async () => {
  try {
    // 获取用户信息
    const userInfo = userStore.userInfo;
    if (!userInfo || !userInfo.community_id) {
      uni.showToast({
        title: "请先加入社区后再使用求助功能",
        icon: "none",
        duration: 3000
      });
      return;
    }

    // 显示确认对话框
    uni.showModal({
      title: "一键求助",
      content: "确认要发起求助吗？社区工作人员将收到通知并为您提供帮助。",
      confirmText: "确认求助",
      cancelText: "取消",
      success: async (res) => {
        if (res.confirm) {
          await createHelpEvent(userInfo);
        }
      }
    });
  } catch (error) {
    console.error("一键求助失败:", error);
    uni.showToast({
      title: "求助失败，请稍后重试",
      icon: "none",
      duration: 3000
    });
  }
};

// 创建求助事件
const createHelpEvent = async (userInfo) => {
  try {
    // 显示加载提示
    uni.showLoading({
      title: "正在发起求助...",
      mask: true
    });

    const response = await request({
      url: "/api/events",
      method: "POST",
      data: {
        community_id: userInfo.community_id,
        title: "紧急求助",
        description: "用户通过一键求助功能发起求助",
        event_type: "call_for_help",
        location: "", // 可以后续扩展获取地理位置
        target_user_id: userInfo.user_id
      }
    });

    uni.hideLoading();

    if (response.code === 1) {
      uni.showToast({
        title: "求助已发送，社区工作人员将尽快为您提供帮助",
        icon: "success",
        duration: 3000
      });

      // 刷新事件数据，显示事件进展卡片
      await eventStore.fetchActiveEvent(true);
    } else {
      uni.showToast({
        title: response.msg || "求助失败",
        icon: "none",
        duration: 3000
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error("创建求助事件失败:", error);
    uni.showToast({
      title: "网络错误，请稍后重试",
      icon: "none",
      duration: 3000
    });
  }
};

// 处理任务按钮点击
const handleTasksClick = () => {
  if (hasNoRules.value) {
    // 无规则时跳转到规则设置页面
    uni.navigateTo({
      url: "/pages/rule-setting/rule-setting",
    });
  } else {
    // 有规则时跳转到打卡列表
    uni.navigateTo({
      url: "/pages/checkin-list/checkin-list",
    });
  }
};

// 获取问候语
const getGreetingText = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
};

// 获取当前日期
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${date}日 ${weekday}`;
};

// 切换角色
const switchRole = (role) => {
  currentRole.value = role;
  // 这里可以添加角色切换后的逻辑
  if (role === "supervisor") {
    // 切换到监护人视图的逻辑
  } else {
    // 切换到打卡视图的逻辑
  }
};

// 功能快捷入口点击处理
const handleInviteGuardian = () => {
  uni.showToast({
    title: "邀请监护功能开发中",
    icon: "none",
  });
};

const handleSetRules = () => {
  uni.navigateTo({
    url: "/pages/rule-setting/rule-setting",
  });
};

const handleGuardianManage = () => {
  uni.showToast({
    title: "监护管理功能开发中",
    icon: "none",
  });
};

const handleHealthRecord = () => {
  uni.showToast({
    title: "健康记录功能开发中",
    icon: "none",
  });
};

// 处理任务操作
const handleTaskAction = async (task) => {
  if (task.status === "pending") {
    // 待打卡
    try {
      await checkinStore.performCheckin(task.rule_id);
      updateMainButton();
      uni.showToast({ title: "打卡成功", icon: "success" });
    } catch (e) {
      console.error("打卡失败:", e);
      uni.showToast({ title: "打卡失败，请稍后重试", icon: "none" });
    }
  } else {
    // 补打卡
    uni.showToast({
      title: "补打卡功能开发中",
      icon: "none",
    });
  }
};

// ==================== 事件相关方法 ====================

// 初始化事件数据
const initEventData = async () => {
  try {
    // 先尝试从缓存恢复
    if (eventStore.restoreFromCache()) {
      if (!eventStore.isCacheExpired) {
        console.log("使用缓存的事件数据");
        return;
      }
    }

    // 获取最新数据
    await eventStore.fetchActiveEvent();
  } catch (error) {
    console.warn("初始化事件数据失败:", error);
  }
};

// 继续求助
const handleContinueHelp = () => {
  showInputSection.value = true;
};

// 关闭事件
const handleCloseEvent = () => {
  console.log('🔍 DEBUG handleCloseEvent 被调用');
  console.log('🔍 DEBUG closePopup value:', closePopup.value);
  
  if (closePopup.value) {
    console.log('🔍 DEBUG 调用 closePopup.open()');
    closePopup.value.open();
    showCloseModal.value = true;
    console.log('🔍 DEBUG showCloseModal.value 设置为 true');
  } else {
    console.error('🔍 DEBUG closePopup ref 为空');
  }
};

// 模态框状态变化监听
const onPopupChange = (e) => {
  console.log('🔍 DEBUG onPopupChange 被调用, e:', e);
  showCloseModal.value = e.show;
  console.log('🔍 DEBUG showCloseModal.value:', showCloseModal.value);
};

// 取消关闭事件
const handleCancelClose = () => {
  console.log('🔍 DEBUG handleCancelClose 被调用');
  if (closePopup.value) {
    closePopup.value.close();
  }
  showCloseModal.value = false;
};

// 确认关闭事件
const confirmCloseEvent = async () => {
  console.log('🔍 DEBUG confirmCloseEvent 被调用');
  console.log('🔍 DEBUG closeReason.value:', closeReason.value);
  
  if (!closeReason.value || closeReason.value.trim().length < 5) {
    console.log('🔍 DEBUG 关闭原因验证失败');
    uni.showToast({
      title: "关闭原因至少需要5个字符",
      icon: "none",
    });
    return;
  }

  console.log('🔍 DEBUG 开始关闭事件');
  try {
    uni.showLoading({
      title: "正在关闭事件...",
      mask: true
    });

    console.log('🔍 DEBUG 调用 eventStore.closeEvent');
    await eventStore.closeEvent(closeReason.value.trim());

    uni.hideLoading();
    uni.showToast({
      title: "事件已解决",
      icon: "success",
    });

    // 关闭模态框
    if (closePopup.value) {
      closePopup.value.close();
    }
    
    // 重置状态
    showCloseModal.value = false;
    closeReason.value = '';
    
    console.log('🔍 DEBUG 事件关闭成功，刷新数据');
    // 刷新事件数据，确保界面更新
    await eventStore.fetchActiveEvent(true);
  } catch (error) {
    uni.hideLoading();
    console.error("关闭事件失败:", error);
    uni.showToast({
      title: error.message || "关闭失败，请稍后重试",
      icon: "none",
    });
  }
};

// 发送文字消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim()) {
    return;
  }

  try {
    await eventStore.addMessage({
      message_type: 'text',
      content: messageInput.value.trim()
    });

    messageInput.value = '';
    uni.showToast({
      title: "发送成功",
      icon: "success",
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    uni.showToast({
      title: error.message || "发送失败，请稍后重试",
      icon: "none",
    });
  }
};

// 开始录音
const startRecording = () => {
  eventStore.startRecording();
};

// 停止录音
const stopRecording = async () => {
  const result = eventStore.stopRecording();

  if (!result) {
    uni.showToast({
      title: "录音时间太短",
      icon: "none",
    });
    return;
  }

  try {
    uni.showLoading({
      title: "正在上传...",
      mask: true
    });

    // 这里需要实现录音文件上传逻辑
    // 暂时使用模拟数据
    await eventStore.addMessage({
      message_type: 'voice',
      media_url: '/static/uploads/voice/sample.mp3',
      media_duration: result.duration
    });

    uni.hideLoading();
    uni.showToast({
      title: "发送成功",
      icon: "success",
    });
  } catch (error) {
    uni.hideLoading();
    console.error("上传语音失败:", error);
    uni.showToast({
      title: error.message || "上传失败，请稍后重试",
      icon: "none",
    });
  }
};

// 选择图片
const handleChooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({
          title: "正在上传...",
          mask: true
        });

        // 这里需要实现图片上传逻辑
        // 暂时使用模拟数据
        await eventStore.addMessage({
          message_type: 'image',
          media_url: res.tempFilePaths[0]
        });

        uni.hideLoading();
        uni.showToast({
          title: "发送成功",
          icon: "success",
        });
      } catch (error) {
        uni.hideLoading();
        console.error("上传图片失败:", error);
        uni.showToast({
          title: error.message || "上传失败，请稍后重试",
          icon: "none",
        });
      }
    }
  });
};

onMounted(() => {
  // 页面加载时的初始化逻辑
  initializePageData();

  // 监听打卡规则更新事件
  uni.$on('checkinRulesUpdated', async (data) => {
    console.log('收到打卡规则更新事件:', data);
    try {
      // 强制刷新打卡数据
      await checkinStore.refreshData();
      // 更新任务显示
      updateTaskData();
      console.log('打卡数据已刷新');
    } catch (error) {
      console.error('刷新打卡数据失败:', error);
    }
  });
});

onUnmounted(() => {
  // 清理事件监听
  uni.$off('checkinRulesUpdated');
});

onShow(() => {
  // 页面显示时的逻辑
  
  // 确保用户信息存在
  if (!userStore.userInfo) {
    userStore.initUserState();
  }
  
  // 刷新页面数据
  initializePageData();
});

// 初始化页面数据
const initializePageData = async () => {
  try {
    // 初始化打卡数据
    await initCheckinData();

    // 初始化事件数据
    await initEventData();

    // 更新任务数据
    updateTaskData();
  } catch (error) {
    console.warn("⚠️ 初始化页面数据失败:", error);
  }
};

// 更新任务数据
const updateTaskData = () => {
  try {
    // 获取今日任务数据
    const todayTasks = checkinStore.todayCheckinItems || [];
    nearbyTasks.value = todayTasks.map(task => ({
      rule_id: task.rule_id,
      rule_name: task.rule_name,
      planned_time: task.planned_time,
      end_time: task.end_time,
      icon: task.icon_url || '📋',
      iconBg: task.icon_bg || '#4CAF50',
      status: task.status || 'pending'
    }));
    
    // 计算待打卡数量
    pendingCheckinCount.value = nearbyTasks.value.filter(task => task.status === 'pending' || task.status === 'unchecked').length;
    
  } catch (error) {
    console.error("更新任务数据失败:", error);
    nearbyTasks.value = [];
    pendingCheckinCount.value = 0;
  }
};
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

/* 工具类 */
.mb-10 {
  margin-bottom: $uni-font-size-base;
}

/* uni-section 标题样式自定义 */
::v-deep .uni-section {
  .uni-section__content-title {
    color: $uni-text-base;
    font-size: $uni-font-size-base;
  }
}

.greeting-content {
}

.user-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-avatar-img {
  width: 104rpx;
  height: 104rpx;
  border-radius: 64rpx;
  border: 6rpx solid $uni-bg-color-white;
  box-shadow: $uni-shadow-sm;
}

.user-greeting {
}

.greeting-text {
  display: block;
  font-size: $uni-font-size-sm;
  font-weight: 700;
  color: $uni-tabbar-color;
  margin-bottom: 8rpx;
}

.community-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-primary;
  font-weight: 600;
  margin-bottom: 4rpx;
}

.date-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.weather-info {
}

.weather-content {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.weather-icon {
  font-size: 40rpx;
}

.weather-text {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.role-tabs {
  display: flex;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-full;
  padding: $uni-spacing-xs;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $uni-spacing-sm;
  padding: $uni-spacing-base $uni-spacing-xl;
  border-radius: $uni-radius-full;
  transition: all 0.3s ease;
}

.role-tab.active {
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  color: $uni-white;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.3);
}

.tab-icon {
  font-size: $uni-font-size-sm;
}

.tab-text {
  font-size: $uni-font-size-sm;
  font-weight: 500;
}

.grid-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 8rpx;
}

.grid-icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.grid-icon {
  font-size: 48rpx;
}

.grid-text {
  font-size: $uni-font-size-sm;
  color: $uni-main-color;
  text-align: center;
  line-height: 1.5;
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.link-text {
  font-size: $uni-font-size-sm;
  color: $uni-primary;
}

.link-arrow {
  font-size: $uni-font-size-lg;
  color: $uni-primary;
  font-weight: bold;
}

.btn-icon {
  font-size: $uni-font-size-base;
}

.btn-text {
  font-size: $uni-font-size-sm;
}

.floating-tasks-section {
  margin: 0 $uni-spacing-xxl $uni-spacing-lg;
}

.floating-tasks-btn {
  width: 100%;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  box-shadow: $uni-shadow-primary;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
  border-radius: $uni-radius-xxl;
  padding: 0;
  border: none;
  position: relative;
  overflow: hidden;
}

.floating-tasks-btn.btn-no-rules {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 16rpx 48rpx rgba(102, 126, 234, 0.4);
}

.floating-tasks-btn.btn-all-completed {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 16rpx 48rpx rgba(17, 153, 142, 0.4);
}

.floating-tasks-btn.btn-missed-only {
  background: linear-gradient(135deg, $uni-warning 0%, $uni-warning-dark 100%);
  box-shadow: 0 16rpx 48rpx rgba(245, 158, 11, 0.4);
}

.floating-tasks-btn::before {
  content: "";
  position: absolute;
  top: -4rpx;
  left: -4rpx;
  right: -4rpx;
  bottom: -4rpx;
  background: linear-gradient(135deg, rgba(244, 130, 36, 0.6), rgba(232, 116, 26, 0.6));
  border-radius: $uni-radius-xxl;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.floating-tasks-btn:active::before {
  opacity: 1;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.tasks-btn-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-xxxl $uni-spacing-xl;
}

.tasks-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tasks-icon {
  font-size: 60rpx;
  color: white;
}

.tasks-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 48rpx;
  height: 48rpx;
  background: $uni-error;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-sm;
  font-weight: bold;
  color: $uni-white;
}

.tasks-text-content {
  flex: 1;
  margin-left: 32rpx;
  text-align: left;
}

.tasks-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: bold;
  color: $uni-white;
  margin-bottom: 8rpx;
  line-height: 1.2;
}

.tasks-subtitle {
  display: block;
  font-size: $uni-font-size-base;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.2;
}

.tasks-arrow {
  font-size: 48rpx;
  color: $uni-white;
  font-weight: bold;
}

.today-tasks-section {
  margin: 0 $uni-spacing-xxl $uni-spacing-xxxl;
}

.today-tasks-btn {
  width: 100%;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border: none;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-xxxl;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: $uni-shadow-primary-xl;
}

.today-tasks-btn.disabled {
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.btn-text {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-white;
  margin-bottom: 8rpx;
}

.btn-subtext {
  display: block;
  font-size: $uni-font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

// 一键求助按钮样式
.help-btn {
  width: 100%;
  background: linear-gradient(135deg, $uni-danger 0%, $uni-danger-dark 100%);
  border: none;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-xxxl;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: $uni-shadow-danger-xl;
  transition: all 0.3s ease;
}

.help-btn:active {
  transform: translateY(4rpx);
  box-shadow: $uni-shadow-danger;
}

.help-btn .btn-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.help-btn .btn-text {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: 600;
  color: $uni-white;
  margin-bottom: 8rpx;
}

.help-btn .btn-subtext {
  display: block;
  font-size: $uni-font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

// ==================== 事件进展卡片样式 ====================

.event-progress-card {
  width: 100%;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  padding: $uni-spacing-xl;
  box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-lg;
}

.event-header {
  display: flex;
  gap: $uni-spacing-base;
  padding-bottom: $uni-spacing-base;
  border-bottom: 2rpx solid $uni-border-light;
}

.header-btn {
  flex: 1;
  padding: $uni-spacing-base;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-base;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;

  .btn-text {
    font-size: $uni-font-size-base;
  }
}

.continue-btn {
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  color: $uni-white;
  box-shadow: $uni-shadow-primary-sm;
}

.close-btn {
  background: linear-gradient(135deg, $uni-success 0%, $uni-success-dark 100%);
  color: $uni-white;
  box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
}

.timeline-section {
  max-height: 600rpx;
  overflow-y: auto;
  padding: $uni-spacing-sm $uni-spacing-base;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-lg;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: $uni-spacing-base;
  padding-top: $uni-spacing-base;
  border-top: 2rpx solid $uni-border-light;
}

.input-row {
  display: flex;
  gap: $uni-spacing-base;
}

.message-input {
  flex: 1;
  padding: $uni-spacing-base;
  background: $uni-bg-color-lighter;
  border: 2rpx solid $uni-border-light;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-base;
}

.send-btn {
  padding: $uni-spacing-base $uni-spacing-lg;
  background: $uni-primary;
  color: $uni-white;
  border-radius: $uni-radius-lg;
  border: none;
  font-size: $uni-font-size-base;
}

.input-actions {
  display: flex;
  gap: $uni-spacing-base;
}

.action-btn {
  flex: 1;
  padding: $uni-spacing-base;
  background: $uni-bg-color-lighter;
  border: 2rpx solid $uni-border-light;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-xl;
  transition: all 0.3s ease;

  &.recording {
    background: $uni-error;
    color: $uni-white;
    border-color: $uni-error;
    animation: pulse 1s infinite;
  }
}

/* 自定义关闭事件模态框样式 */
.close-event-modal {
  width: 600rpx;
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  overflow: hidden;
}

.close-event-header {
  padding: $uni-spacing-xl;
  border-bottom: 2rpx solid $uni-border-light;
  text-align: center;
}

.close-event-title {
  font-size: $uni-font-size-lg;
  font-weight: 700;
  color: $uni-text-base;
}

.close-event-content {
  padding: $uni-spacing-xl;
}

.close-event-hint {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-secondary;
  margin-bottom: $uni-spacing-base;
}

.close-reason-input {
  width: 100%;
  min-height: 200rpx;
  padding: $uni-spacing-base;
  background: $uni-bg-color-lighter;
  border: 2rpx solid $uni-border-light;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-base;
  color: $uni-text-base;
  box-sizing: border-box;
}

.close-event-footer {
  display: flex;
  gap: $uni-spacing-base;
  padding: $uni-spacing-xl;
  border-top: 2rpx solid $uni-border-light;
}

.close-event-btn {
  flex: 1;
  padding: $uni-spacing-base;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-base;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: $uni-bg-color-lighter;
  color: $uni-text-secondary;
  border: 2rpx solid $uni-border-light;
}

.confirm-btn {
  background: linear-gradient(135deg, $uni-success 0%, $uni-success-dark 100%);
  color: $uni-white;
  box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
}
</style>
