<!-- pages/profile/profile.vue -->
<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <UserInfoCard
      :user-info="userInfo"
      @edit-profile="editProfile"
    />

    <view
      v-if="needCompleteInfo"
      class="hint-section"
    >
      <text class="hint-text">
        完善头像、昵称、联系方式，提升使用体验
      </text>
    </view>

    <!-- 用户统计区域 -->
    <view
      v-if="userInfo"
      class="user-stats-section"
    >
      <view class="user-stats-card">
        <view class="stat-item">
          <text class="stat-value success-color">
            {{ getConsecutiveCheckins() }}
          </text>
          <text class="stat-label">
            连续打卡
          </text>
        </view>
        <view class="stat-item">
          <text class="stat-value warning-color">
            {{ getCompletionRate() }}%
          </text>
          <text class="stat-label">
            完成率
          </text>
        </view>
        <view class="stat-item">
          <text class="stat-value accent-color">
            {{ getSupervisorCount() }}
          </text>
          <text class="stat-label">
            监督人
          </text>
        </view>
      </view>
    </view>

    <!-- 功能菜单列表 -->
    <!-- 打卡选项管理：社区相关角色不显示 -->
    <view
      v-if="showCheckinManagement"
      class="menu-section"
    >
      <view class="menu-group-title">
        打卡选项管理
      </view>
      <view
        class="menu-item"
        @click="navigateTo('/pages/checkin-list/checkin-list')"
      >
        <view class="menu-icon">
          📋
        </view>
        <text class="menu-text">
          打卡事项
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>

      <view
        class="menu-item"
        @click="navigateTo('/pages/rule-setting/rule-setting')"
      >
        <view class="menu-icon">
          ⚙️
        </view>
        <text class="menu-text">
          打卡规则
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>

      <!-- 监督功能菜单：所有用户都可以访问 -->
      <view
        class="menu-item"
        @click="navigateTo('/pages/supervisor-manage/supervisor-manage')"
      >
        <view class="menu-icon">
          👥
        </view>
        <text class="menu-text">
          监护人管理
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>

      <view
        class="menu-item"
        @click="navigateTo('/pages/notification-settings/notification-settings')"
      >
        <view class="menu-icon">
          🔔
        </view>
        <text class="menu-text">
          通知设置
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>
    </view>

    <!-- 社区管理菜单组 -->
    <view
      v-if="communityManagementItems.length > 0"
      class="menu-section"
    >
      <view class="menu-group-title">
        社区管理
      </view>
      
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
        <text class="menu-arrow">
          ›
        </text>
      </view>
    </view>

    <!-- 其他设置 -->
    <view class="menu-section">
      <view
        class="menu-item"
        @click="showAbout"
      >
        <view class="menu-icon">
          ℹ️
        </view>
        <text class="menu-text">
          关于我们
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>

      <view
        class="menu-item"
        @click="showHelp"
      >
        <view class="menu-icon">
          ❓
        </view>
        <text class="menu-text">
          帮助中心
        </text>
        <text class="menu-arrow">
          ›
        </text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button
        class="logout-btn"
        @click="handleLogout"
      >
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/modules/user";
import { routeGuard } from "@/utils/router";
import UserInfoCard from "@/components/UserInfoCard.vue";

const userStore = useUserStore();

// Community management menu items
// ⚠️ MODIFIED: Only show to super_admin
const communityManagementItems = computed(() => {
  const user = userStore.userInfo

  if (!user) return []

  // KEY CHANGE: Only super_admin sees this section
  // Support multiple role formats: numeric (4), English ('super_admin', 'community_admin'), Chinese ('超级系统管理员')
  const userRole = user.role
  const isSuperAdmin = userRole === 4 ||
                       userRole === 'super_admin' ||
                       userRole === 'community_admin' ||
                       userRole === '超级系统管理员'

  if (!isSuperAdmin) {
    return []
  }

  // Super admin's community management menu
  const items = []

  // Community list management
  items.push({
    name: '社区列表',
    icon: '🏘️',
    path: '/pages/community-manage/community-manage'
  })

  // Staff management
  items.push({
    name: '工作人员管理',
    icon: '👥',
    path: '/pages/community-staff-manage/community-staff-manage'
  })

  // User management
  items.push({
    name: '用户管理',
    icon: '👤',
    path: '/pages/community-user-manage/community-user-manage'
  })

  // Merge/split community features
  items.push({
    name: '社区合并',
    icon: '🔗',
    path: '/pages/community-merge/community-merge'
  })

  items.push({
    name: '社区拆分',
    icon: '✂️',
    path: '/pages/community-split/community-split'
  })

  return items
})

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

  return user;
});

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
  return !u.avatarUrl || !u.nickName || !u.phone_number;
});

const showAbout = () => {
  uni.navigateTo({
    url: "/pages/about/about",
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

  // Layer 2: 业务逻辑验证 - 确保数据一致性
  if (!userStore.userInfo) {
    userStore.initUserState();
  }

  // Layer 3: 环境保护 - 防止数据过期
  if (userStore.isLoggedIn && !userStore.userInfo) {
    console.warn("⚠️ 异常状态：已登录但无用户信息，尝试重新获取");
    userStore.fetchUserInfo().catch((error) => {
      console.error("重新获取用户信息失败:", error);
    });
  }
});
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.hint-section {
  background: $uni-bg-yellow-50;
  border-left: $uni-spacing-sm solid $uni-warning;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-xl;
  margin-bottom: $uni-spacing-xl;
}
.hint-text {
  display: block;
  color: $uni-text-gray-800;
  margin-bottom: $uni-spacing-base;
}
.hint-btn {
  background: $uni-primary;
  color: $uni-white;
  border: none;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-base $uni-spacing-lg;
}

.profile-container {
  min-height: 100vh;
  @include bg-gradient;
  padding: $uni-spacing-xxxl $uni-spacing-xl;
}

.user-info-section {
  @include card-default;
  position: relative;
}

.user-avatar {
  margin-right: $uni-spacing-xxl;
  position: relative;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: $uni-spacing-xs solid $uni-primary;
}

.edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: $uni-primary;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid $uni-white;
  box-shadow: $uni-shadow-sm;
}

.edit-icon {
  font-size: $uni-font-size-xs;
  color: $uni-white;
}

.user-stats-section {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-xxl;
  margin-bottom: $uni-spacing-xxl;
  box-shadow: $uni-shadow-card;
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
  margin-bottom: $uni-spacing-sm;
}

.stat-label {
  font-size: $uni-font-size-sm;
  color: $uni-base-color;
}

.success-color {
  color: $uni-success;
}

.warning-color {
  color: $uni-warning;
}

.accent-color {
  color: $uni-accent;
}

.user-avatar {
  margin-right: $uni-spacing-xxl;
}

.avatar-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: $uni-spacing-xs solid $uni-primary;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: $uni-font-size-xxl;
  font-weight: 600;
  color: $uni-text-primary;
  margin-bottom: $uni-spacing-sm;
}

.user-role {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-primary;
  background: rgba(244, 130, 36, 0.1);
  padding: $uni-spacing-sm $uni-spacing-base;
  border-radius: $uni-radius-lg;
  width: fit-content;
}

.menu-section {
  background: $uni-white;
  border-radius: $uni-radius-xl;
  margin-bottom: $uni-spacing-xxl;
  box-shadow: $uni-shadow-card;
  overflow: hidden;
}

.menu-group-title {
  padding: $uni-spacing-xl $uni-spacing-xxxl $uni-spacing-base;
  font-size: $uni-font-size-base;
  color: $uni-text-secondary;
  font-weight: 500;
  background: $uni-bg-color-lighter;
  border-bottom: 2rpx solid $uni-border-1;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $uni-spacing-xxl $uni-spacing-xxxl;
  border-bottom: 2rpx solid $uni-bg-color-lighter;
  transition: background-color 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: $uni-bg-color-lighter;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: $uni-spacing-xl;
  width: 40rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: $uni-font-size-lg;
  color: $uni-text-primary;
}

.menu-arrow {
  font-size: $uni-font-size-base;
  color: $uni-text-secondary;
}

.logout-section {
  margin-top: $uni-spacing-xxxl;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: $uni-white;
  border: 2rpx solid $uni-danger;
  border-radius: $uni-radius-xl;
  color: $uni-danger;
  font-size: $uni-font-size-xxl;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.2);
}

.logout-btn:active {
  transform: scale(0.98);
  background-color: $uni-bg-red-50;
}
</style>
