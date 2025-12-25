<!-- pages/profile/profile.vue -->
<template>
  <view class="profile-container">
    <!-- 用户信息区域 -->
    <view class="user-info-section">
      <view class="user-avatar" @click="editProfile">
        <image
          :src="userInfo?.avatarUrl || '/static/logo.png'"
          class="avatar-image"
          mode="aspectFill"
        />
      </view>
      <view class="user-details">
        <text class="user-name">
          {{ getDisplayName(userInfo) }}
        </text>
        <text class="user-role">
          {{ getRoleText(userInfo?.role) }}
        </text>
      </view>
    </view>

    <view v-if="needCompleteInfo" class="hint-section">
      <text class="hint-text"> 完善头像、昵称、联系方式，提升使用体验 </text>
    </view>

    <view v-if="needCommunityVerify" class="hint-section">
      <text class="hint-text"> 社区身份未验证，完成后可使用社区功能 </text>
      <button
        class="hint-btn"
        @click="navigateTo('/pages/community-auth/community-auth')"
      >
        去验证
      </button>
    </view>

    <!-- 用户统计区域 -->
    <view v-if="userInfo" class="user-stats-section">
      <view class="user-stats-card">
        <view class="stat-item">
          <text class="stat-value success-color">
            {{ getConsecutiveCheckins() }}
          </text>
          <text class="stat-label"> 连续打卡 </text>
        </view>
        <view class="stat-item">
          <text class="stat-value warning-color"> {{ getCompletionRate() }}% </text>
          <text class="stat-label"> 完成率 </text>
        </view>
        <view class="stat-item">
          <text class="stat-value accent-color">
            {{ getSupervisorCount() }}
          </text>
          <text class="stat-label"> 监督人 </text>
        </view>
      </view>
    </view>

    <!-- 功能菜单列表 -->
    <!-- 打卡选项管理：社区相关角色不显示 -->
    <view v-if="showCheckinManagement" class="menu-section">
      <view class="menu-group-title"> 打卡选项管理 </view>
      <view class="menu-item" @click="navigateTo('/pages/checkin-list/checkin-list')">
        <view class="menu-icon"> 📋 </view>
        <text class="menu-text"> 打卡事项 </text>
        <text class="menu-arrow"> › </text>
      </view>

      <view class="menu-item" @click="navigateTo('/pages/rule-setting/rule-setting')">
        <view class="menu-icon"> ⚙️ </view>
        <text class="menu-text"> 打卡规则 </text>
        <text class="menu-arrow"> › </text>
      </view>

      <!-- 监督功能菜单：所有用户都可以访问 -->
      <view
        class="menu-item"
        @click="navigateTo('/pages/supervisor-manage/supervisor-manage')"
      >
        <view class="menu-icon"> 👥 </view>
        <text class="menu-text"> 监护人管理 </text>
        <text class="menu-arrow"> › </text>
      </view>

      <view
        class="menu-item"
        @click="navigateTo('/pages/notification-settings/notification-settings')"
      >
        <view class="menu-icon"> 🔔 </view>
        <text class="menu-text"> 通知设置 </text>
        <text class="menu-arrow"> › </text>
      </view>
    </view>

    <!-- 社区管理菜单组 -->
    <view v-if="communityManagementItems.length > 0" class="menu-section">
      <view class="menu-group-title"> 社区管理 </view>
      
      <!-- 管理功能菜单 -->
      <view
        v-for="item in communityManagementItems"
        :key="item.name"
        class="menu-item"
        @click="navigateTo(item.path)"
      >
        <view class="menu-icon">
          {{ item.icon }}
        </view>
        <text class="menu-text">
          {{ item.name }}
        </text>
        <text class="menu-arrow"> › </text>
      </view>
    </view>

    <!-- 其他设置 -->
    <view class="menu-section">
      <view class="menu-item" @click="showAbout">
        <view class="menu-icon"> ℹ️ </view>
        <text class="menu-text"> 关于我们 </text>
        <text class="menu-arrow"> › </text>
      </view>

      <view class="menu-item" @click="showHelp">
        <view class="menu-icon"> ❓ </view>
        <text class="menu-text"> 帮助中心 </text>
        <text class="menu-arrow"> › </text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/modules/user";
import { routeGuard } from "@/utils/router";

const userStore = useUserStore();

// 计算属性：社区管理菜单项 - 根据角色动态生成
const communityManagementItems = computed(() => {
  const items = [];

  // super_admin (role=4) 可以看到所有功能
  if (userStore.isSuperAdmin) {
    items.push(
      { name: "社区列表", icon: "🏘️", path: "/pages/community-manage/community-manage" },
      {
        name: "工作人员管理",
        icon: "👥",
        path: "/pages/community-staff-manage/community-staff-manage",
      },
      {
        name: "用户管理",
        icon: "👤",
        path: "/pages/community-user-manage/community-user-manage",
      },
      { name: "社区合并", icon: "🔗", path: "/pages/community-merge/community-merge" },
      { name: "社区拆分", icon: "✂️", path: "/pages/community-split/community-split" }
    );
  }
  // community_manager 可以管理工作人员和用户
  else if (userStore.isCommunityManager) {
    items.push(
      {
        name: "工作人员管理",
        icon: "👥",
        path: "/pages/community-staff-manage/community-staff-manage",
      },
      {
        name: "用户管理",
        icon: "👤",
        path: "/pages/community-user-manage/community-user-manage",
      }
    );
  }
  // community_staff 只能管理用户
  else if (userStore.isCommunityStaff) {
    items.push({
      name: "用户管理",
      icon: "👤",
      path: "/pages/community-user-manage/community-user-manage",
    });
  }

  return items;
});

// 计算属性：是否显示打卡选项管理section
// 社区相关角色（超级管理员、社区主管、社区专员）不显示打卡选项管理
const showCheckinManagement = computed(() => {
  return !(
    userStore.isSuperAdmin ||
    userStore.isCommunityManager ||
    userStore.isCommunityStaff
  );
});

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

const getRoleText = (role) => {
  // 首先检查 role 是否为字符串
  if (typeof role === "string") {
    // 后端返回的是中文角色名称，直接返回
    if (
      role.includes("用户") ||
      role.includes("管理员") ||
      role.includes("主管") ||
      role.includes("专员")
    ) {
      return role;
    }
  }

  // 向后兼容：处理数字角色值或其他类型
  const roleMap = {
    1: "普通用户",
    2: "社区专员",
    3: "社区主管",
    4: "超级系统管理员",
    solo: "普通用户",
    supervisor: "监护人",
    community: "社区工作人员",
  };
  return roleMap[role] || "未知角色";
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
  return "未设置昵称";
};

// 获取连续打卡天数（对于新用户显示0）
const getConsecutiveCheckins = () => {
  // TODO: 从后端API获取实际的连续打卡天数
  // 临时返回0，直到实现实际的打卡功能
  return 0;
};

// 获取完成率百分比（对于新用户显示0）
const getCompletionRate = () => {
  // TODO: 从后端API获取实际的完成率
  // 临时返回0，直到实现实际的打卡功能
  return 0;
};

// 获取监督人数量（对于新用户显示0或根据实际关系显示）
const getSupervisorCount = () => {
  // TODO: 从后端API获取实际的监督人数量
  // 临时返回0，直到实现实际的监护关系功能
  return 0;
};

const navigateTo = (url) => {
  // 如果是社区列表，则跳转到使用managed-communities API的页面
  if (url === "/pages/community-manage/community-manage") {
    // 跳转到社区管理页面，该页面应该使用 /api/user/managed-communities API
    routeGuard(url);
  } else {
    routeGuard(url);
  }
};



const editProfile = () => {
  routeGuard("/pages/profile-edit/profile-edit");
};

const needCompleteInfo = computed(() => {
  const u = userInfo.value || {};
  return !u.avatarUrl || !u.nickName || !u.phoneNumber;
});

const needCommunityVerify = computed(() => {
  const u = userInfo.value || {};
  return u.role === "community" && u.verification_status !== 2;
});

const showAbout = () => {
  uni.navigateTo({
    url: "/pages/uni-ui-time/uni-ui-time",
  });
};

const showHelp = () => {
  uni.showModal({
    title: "帮助中心",
    content: "如有问题请联系客服：\n电话：400-123-4567\n邮箱：support@anka.com",
    showCancel: false,
  });
};

const handleLogout = () => {
  uni.showModal({
    title: "提示",
    content: "确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.redirectTo({
          url: "/pages/login/login",
        });
      }
    },
  });
};

// 页面显示时刷新用户数据
onShow(() => {
  // Layer 1: 入口点验证 - 确保用户状态正确初始化
  console.log("=== Layer 1: 个人中心onShow入口点验证 ===");
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

  

  // Layer 4: 调试日志 - 记录当前状态
  console.log("=== Layer 4: 个人中心页面显示完成 ===");
  console.log(
    "最终用户昵称:",
    userInfo.value?.nickName || userInfo.value?.nickname || "未设置昵称"
  );
});
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.hint-section {
  background: #fef3c7;
  border-left: 8rpx solid #f59e0b;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.hint-text {
  display: block;
  color: #78350f;
  margin-bottom: 12rpx;
}
.hint-btn {
  background: #f48224;
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 12rpx 16rpx;
}

.profile-container {
  min-height: 100vh;
  @include bg-gradient;
  padding: 40rpx 24rpx;
}

.user-info-section {
  @include card-default;
}

.user-stats-section {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.user-stats-card {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: $uni-font-size-xl;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.success-color {
  color: $uni-success;
}

.warning-color {
  color: #f59e0b;
}

.accent-color {
  color: #624731;
}

.user-avatar {
  margin-right: 32rpx;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #f48224;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: 28rpx;
  color: #f48224;
  background: rgba(244, 130, 36, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  width: fit-content;
}

.menu-section {
  background: white;
  border-radius: 24rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.menu-group-title {
  padding: 24rpx 48rpx 16rpx;
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 2rpx solid #f0f0f0;
}



.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 48rpx;
  border-bottom: 2rpx solid #f8f8f8;
  transition: background-color 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f8f8f8;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
  width: 40rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.logout-section {
  margin-top: 48rpx;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: white;
  border: 2rpx solid #ff4757;
  border-radius: 32rpx;
  color: #ff4757;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.2);
}

.logout-btn:active {
  transform: scale(0.98);
  background-color: #fff5f5;
}
</style>
