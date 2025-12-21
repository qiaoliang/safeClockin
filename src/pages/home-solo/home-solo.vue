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
      :class="['today-tasks-btn', { disabled: disableMainBtn }]"
      :disabled="disableMainBtn"
      @click="handleMainAction"
    >
      <text class="btn-icon"> 📋 </text>
      <text class="btn-text">
        {{ mainBtnText }}
      </text>
      <text v-if="mainBtnSubtext" class="btn-subtext">
        {{ mainBtnSubtext }}
      </text>
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

const mainBtnText = ref("今日待办");
const mainBtnSubtext = ref("点击进入打卡事项列表");
const clicking = ref(false);
const currentRole = ref("checkin");

// 计算属性：用户信息 - 添加防御性验证
const userInfo = computed(() => {
  // Layer 1: 入口点验证 - 确保用户信息存在
  const user = userStore.userInfo;

  if (!user) {
    console.log("用户信息为空");
    return null;
  }

  // Layer 2: 业务逻辑验证 - 确保关键字段存在
  if (!user.nickName && !user.nickname) {
    console.warn("⚠️ 用户信息缺少昵称字段");
    // 尝试从其他字段获取昵称
    if (user.wechat_openid) {
      user.nickName = `微信用户${user.wechat_openid.slice(-6)}`;
    } else {
      user.nickName = "用户";
    }
  }

  console.log("用户信息验证通过:", user.nickName || user.nickname);
  return user;
});

// 计算属性：今日打卡数量（从store获取）
const todayCheckinCount = computed(() => checkinStore.todayCheckinCount);
const pendingCheckinCount = computed(() => checkinStore.pendingCheckinCount);
const completedCheckinCount = computed(() => checkinStore.completedCheckinCount);
const missedCheckinCount = computed(() => checkinStore.missedCheckinCount);
const allRulesCount = computed(() => checkinStore.allRulesCount);
const nearestPending = computed(() => checkinStore.nearestPending);
const completionRate = computed(() => checkinStore.completionRate);

const disableMainBtn = computed(() => {
  if (allRulesCount.value === 0) return false;
  if (todayCheckinCount.value === 0) return false;
  return !nearestPending.value;
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

const updateMainButton = () => {
  if (allRulesCount.value === 0) {
    mainBtnText.value = "一键求助";
    mainBtnSubtext.value = "";
    return;
  }
  if (nearestPending.value) {
    mainBtnText.value = "打卡";
    mainBtnSubtext.value = nearestPending.value.rule_name;
  } else {
    if (todayCheckinCount.value > 0) {
      mainBtnText.value = "今日没有打卡任务了";
      mainBtnSubtext.value = "";
    } else {
      mainBtnText.value = "今日待办";
      mainBtnSubtext.value = "点击进入打卡事项列表";
    }
  }
};

const handleMainAction = async () => {
  if (clicking.value) return;
  clicking.value = true;
  setTimeout(() => (clicking.value = false), 300);

  if (disableMainBtn.value) return;

  if (allRulesCount.value === 0) {
    uni.navigateTo({ url: "/pages/add-rule/add-rule" });
    return;
  }
  if (!nearestPending.value) {
    goToCheckinList();
    return;
  }

  const now = new Date();
  const planned = parseTodayTime(nearestPending.value.planned_time);
  const diffMs = now - planned;
  const diffMin = diffMs / 60000;

  if (diffMin < -30) {
    uni.showToast({
      title: "打卡时间未到，请于规定时间前30分钟内再来打卡",
      icon: "none",
      duration: 3000,
    });
    return;
  }

  if (diffMin > 30) {
    try {
      await checkinStore.markAsMissed(nearestPending.value.rule_id);
      updateMainButton();
    } catch (e) {
      console.error("" + e);
    }
    uni.showToast({ title: "已错过打卡时间", icon: "none", duration: 3000 });
    return;
  }

  try {
    await checkinStore.performCheckin(nearestPending.value.rule_id);
    updateMainButton();
    uni.showToast({ title: "打卡成功", icon: "success" });
  } catch (e) {
    console.warn("⚠️ 打卡失败:", e);
    uni.showToast({ title: "网络错误，请稍后重试", icon: "none" });
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
  initCheckinData();
});

onShow(() => {
  // Layer 1: 入口点验证 - 确保用户状态正确初始化
  console.log("=== Layer 1: 首页onShow入口点验证 ===");
  console.log("当前登录状态:", userStore.isLoggedIn);
  console.log("用户信息:", userStore.userInfo);
  console.log("用户角色:", userStore.role);

  // Layer 2: 业务逻辑验证 - 确保数据一致性
  if (!userStore.userInfo) {
    console.log("用户信息为空，尝试初始化用户状态");
    userStore.initUserState();
  }

  // Layer 3: 环境保护 - 防止数据过期
  if (userStore.isLoggedIn && !userStore.userInfo) {
    console.warn("⚠️ 异常状态：已登录但无用户信息，尝试重新获取");
    userStore.fetchUserInfo().catch((error) => {
      console.error("重新获取用户信息失败:", error);
    });
  }

  // Layer 4: 调试日志 - 记录数据刷新
  console.log("=== Layer 4: 开始刷新打卡数据 ===");

  // 刷新打卡数据，确保从其他页面返回时数据是最新的
  refreshCheckinData().catch((error) => {
    console.error("首页onShow刷新数据失败:", error);
  });
});

// 监听打卡规则更新事件
uni.$on("checkinRulesUpdated", (data) => {
  console.log("=== 检测到打卡规则更新事件 ===");
  console.log("事件数据:", data);

  // 强制刷新打卡数据，确保显示最新状态
  checkinStore
    .refreshData()
    .then(() => {
      console.log("✅ 响应规则更新事件，数据已刷新");
      updateMainButton();
    })
    .catch((error) => {
      console.error("❌ 响应规则更新事件失败:", error);
    });
});
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
</style>
