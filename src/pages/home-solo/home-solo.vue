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
              <text class="community-text" v-if="userInfo?.community_name">
                {{ userInfo.community_name }}
              </text>
              <text class="date-text">
                {{ getCurrentDate() }}
              </text>
            </view>
          </view>
          <view class="weather-info">
            <view class="weather-content">
              <text class="weather-icon"> ☀️ </text>
              <text class="weather-text"> 晴 18°C </text>
            </view>
          </view>
        </view>

        <!-- 角色切换标签 -->
        <view class="role-tabs">
          <view
            :class="['role-tab', currentRole === 'checkin' ? 'active' : '']"
            @click="switchRole('checkin')"
          >
            <text class="tab-icon"> 🕐 </text>
            <text class="tab-text"> 今日打卡 </text>
          </view>
          <view
            :class="['role-tab', currentRole === 'supervisor' ? 'active' : '']"
            @click="switchRole('supervisor')"
          >
            <text class="tab-icon"> 🛡️ </text>
            <text class="tab-text"> 当前监护 </text>
          </view>
        </view>
      </view>
    </template>
  </uni-card>

  <!-- 当前任务悬浮按钮 -->
  <button class="floating-tasks-btn" @click="goToCheckinList">
    <view class="tasks-btn-content">
      <view class="tasks-icon-wrapper">
        <text class="tasks-icon"> 📋 </text>
        <view class="tasks-badge">
          {{ pendingCheckinCount }}
        </view>
      </view>
      <view class="tasks-text-content">
        <text class="tasks-title"> 当前任务 </text>
        <text class="tasks-subtitle"> 还有 {{ pendingCheckinCount }} 项未完成 </text>
      </view>
      <text class="tasks-arrow"> › </text>
    </view>
  </button>

  <!-- 功能快捷入口 -->
  <uni-grid :column="3" :show-border="false" :square="false">
    <uni-grid-item>
      <view class="grid-item-content" @click="handleSetRules">
        <view class="grid-icon-wrapper" style="background: #b37fef">
          <text class="grid-icon"> ⚙️ </text>
        </view>
        <text class="grid-text"> 查看规则 </text>
      </view>
    </uni-grid-item>

    <uni-grid-item>
      <view class="grid-item-content" @click="handleGuardianManage">
        <view class="grid-icon-wrapper" style="background: #8ce0a0">
          <text class="grid-icon"> 👨‍👩‍👧 </text>
        </view>
        <text class="grid-text"> 监护管理 </text>
      </view>
    </uni-grid-item>

    <uni-grid-item>
      <view class="grid-item-content" @click="handleHealthRecord">
        <view class="grid-icon-wrapper" style="background: #ffa0a0">
          <text class="grid-icon"> 💗 </text>
        </view>
        <text class="grid-text"> 健康记录 </text>
      </view>
    </uni-grid-item>
  </uni-grid>

  <!-- 当前任务列表 -->
  <uni-card>
    <uni-section class="mb-10" title="当前任务">
      <template #right>
        <view class="section-link" @click="goToCheckinList">
          <text class="link-text"> 点击查看今天活动 </text>
          <text class="link-arrow"> › </text>
        </view>
      </template>
    </uni-section>
    <uni-list :border="false">
      <uni-list-item
        v-for="task in nearbyTasks"
        :key="task.rule_id"
        :title="task.rule_name"
        :note="`${task.planned_time} - ${task.end_time || '23:59'}`"
        :show-arrow="false"
      >
        <template #header>
          <view class="task-icon-wrapper" :style="{ background: task.iconBg }">
            <text class="task-icon-emoji">
              {{ task.icon }}
            </text>
          </view>
        </template>
        <template #footer>
          <button
            :class="[
              'task-action-btn',
              task.status === 'pending' ? 'btn-pending' : 'btn-makeup',
            ]"
            @click="handleTaskAction(task)"
          >
            <text class="btn-icon">
              {{ task.status === "pending" ? "🕐" : "🔄" }}
            </text>
            <text class="btn-text">
              {{ task.status === "pending" ? "待打卡" : "补打卡" }}
            </text>
          </button>
        </template>
      </uni-list-item>
    </uni-list>
  </uni-card>

  <!-- 一键求助主按钮 -->
  <view class="today-tasks-section">
    <button
      class="help-btn"
      @click="handleOneClickHelp"
    >
      <text class="btn-icon"> 🆘 </text>
      <text class="btn-text">一键求助</text>
      <text class="btn-subtext">遇到困难？立即求助</text>
    </button>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/modules/user";
import { useCheckinStore } from "@/store/modules/checkin";

const userStore = useUserStore();
const checkinStore = useCheckinStore();

// 响应式变量
const currentRole = ref('checkin');
const pendingCheckinCount = ref(0);
const nearbyTasks = ref([]);

// 计算属性：用户信息
const userInfo = computed(() => {
  const user = userStore.userInfo;
  if (!user) {
    console.log("用户信息为空");
    return null;
  }

  // 调试：检查社区信息
  if (user.community_id || user.community_name) {
    console.log(`用户社区信息: ID=${user.community_id}, 名称=${user.community_name}`);
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
    console.log("用户对象为空，显示未登录用户");
    return "未登录用户";
  }

  // Layer 2: 业务逻辑验证 - 尝试多种昵称字段
  let displayName = user.nickName || user.nickname || user.userName || user.name;

  if (displayName) {
    console.log("找到用户昵称:", displayName);
    return displayName;
  }

  // Layer 3: 环境保护 - 生成临时显示名称
  if (user.wechat_openid) {
    displayName = `微信用户${user.wechat_openid.slice(-6)}`;
    console.log("使用微信openid生成临时昵称:", displayName);
    return displayName;
  }

  if (user.phone_number) {
    displayName = `用户${user.phone_number.slice(-4)}`;
    console.log("使用手机号生成临时昵称:", displayName);
    return displayName;
  }

  // Layer 4: 最终兜底
  console.log("无法获取用户昵称，使用默认值");
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
    console.log(`更新主按钮状态: ${hasPendingTasks ? '有待完成任务' : '无待完成任务'}`);
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

    const response = await uni.request({
      url: "/api/events",
      method: "POST",
      header: {
        "Authorization": `Bearer ${uni.getStorageSync("token")}`,
        "Content-Type": "application/json"
      },
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

    if (response.data.code === 1) {
      uni.showToast({
        title: "求助已发送，社区工作人员将尽快为您提供帮助",
        icon: "success",
        duration: 3000
      });
      
      // 可以在这里添加后续逻辑，比如跳转到求助详情页
      console.log("求助事件创建成功:", response.data.data);
    } else {
      uni.showToast({
        title: response.data.msg || "求助失败",
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

// 跳转到打卡事项列表
const goToCheckinList = () => {
  uni.navigateTo({
    url: "/pages/checkin-list/checkin-list",
  });
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
    console.log("切换到监护人视图");
  } else {
    // 切换到打卡视图的逻辑
    console.log("切换到打卡视图");
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

onMounted(() => {
  // 页面加载时的初始化逻辑
  console.log("首页加载完成");
  initializePageData();
});

onShow(() => {
  // 页面显示时的逻辑
  console.log("首页显示");
  
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
    const todayTasks = checkinStore.todayCheckinRules || [];
    nearbyTasks.value = todayTasks.map(task => ({
      rule_id: task.rule_id,
      rule_name: task.rule_name,
      planned_time: task.planned_time,
      end_time: task.end_time,
      icon: task.icon || '📋',
      iconBg: task.icon_bg || '#4CAF50',
      status: task.status || 'pending'
    }));
    
    // 计算待打卡数量
    pendingCheckinCount.value = nearbyTasks.value.filter(task => task.status === 'pending').length;
    
    console.log(`更新任务数据: ${nearbyTasks.value.length} 项任务，${pendingCheckinCount.value} 项待完成`);
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
  background: #f3f4f6;
  border-radius: 50rpx;
  padding: 4rpx;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
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

.task-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.task-icon-emoji {
  font-size: 40rpx;
}

.task-action-btn {
  padding: 12rpx 24rpx;
  border-radius: $uni-radius-lg;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: $uni-font-size-sm;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.btn-pending {
  background: linear-gradient(135deg, $uni-success 0%, $uni-success-dark 100%);
  color: $uni-white;
  box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.3);
}

.btn-makeup {
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  color: $uni-white;
  box-shadow: 0 4rpx 16rpx rgba(244, 130, 36, 0.3);
}

.btn-icon {
  font-size: $uni-font-size-base;
}

.btn-text {
  font-size: $uni-font-size-sm;
}

.floating-tasks-btn {
  width: 100%;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  box-shadow: $uni-shadow-primary;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
  border-radius: 48rpx;
  padding: 0;
  border: none;
  position: relative;
  overflow: hidden;
}

.floating-tasks-btn::before {
  content: "";
  position: absolute;
  top: -4rpx;
  left: -4rpx;
  right: -4rpx;
  bottom: -4rpx;
  background: linear-gradient(135deg, rgba(244, 130, 36, 0.6), rgba(232, 116, 26, 0.6));
  border-radius: 48rpx;
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
  padding: 48rpx 40rpx;
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
  margin-bottom: 48rpx;
}

.today-tasks-btn {
  width: 100%;
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  border: none;
  border-radius: $uni-radius-lg;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 48rpx rgba(244, 130, 36, 0.4);
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
  background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
  border: none;
  border-radius: $uni-radius-lg;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 48rpx rgba(255, 71, 87, 0.4);
  transition: all 0.3s ease;
}

.help-btn:active {
  transform: translateY(4rpx);
  box-shadow: 0 8rpx 24rpx rgba(255, 71, 87, 0.3);
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
</style>
