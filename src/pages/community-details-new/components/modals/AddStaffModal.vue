<template>
  <view
    v-if="visible"
    class="add-staff-modal"
  >
    <!-- 遮罩层 -->
    <view
      class="modal-mask"
      @click="handleClose"
    />

    <!-- 模态框内容 -->
    <view class="modal-content">
      <!-- 标题和关闭按钮 -->
      <view class="modal-header">
        <h3 class="modal-title">
          添加专员
        </h3>
        <button
          class="close-button"
          @click="handleClose"
        >
          <text class="close-icon">
            ×
          </text>
        </button>
      </view>

      <!-- 搜索区域 -->
      <view class="search-section">
        <view class="search-input-wrapper">
          <text class="search-icon">
            🔍
          </text>
          <input
            v-model="searchKeyword"
            class="search-input"
            type="text"
            placeholder="搜索用户姓名或手机号"
            @input="handleSearchInput"
          >
          <button
            v-if="searchKeyword"
            class="clear-button"
            @click="clearSearch"
          >
            <text class="clear-icon">
              ×
            </text>
          </button>
        </view>
        <text class="search-hint">
          在所有用户中搜索
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
          @click="searchUsers(1, false)"
        >
          重试
        </button>
      </view>

      <!-- 用户列表 -->
      <view
        v-else
        class="users-list"
      >
        <view
          v-for="user in userList"
          :key="user.user_id"
          class="user-item"
          :class="{ selected: isSelected(user.user_id) }"
          @click="toggleSelect(user.user_id)"
        >
          <!-- 用户头像和信息 -->
          <view class="user-info">
            <view class="user-avatar-container">
              <image
                v-if="user.avatar_url"
                :src="user.avatar_url"
                class="user-avatar"
                mode="aspectFit"
              />
              <text
                v-else
                class="user-avatar-placeholder"
              >
                👤
              </text>
            </view>
            <view class="user-details">
              <text class="user-name">
                {{ user.nickname || "未设置昵称" }}
              </text>
              <text class="user-phone">
                {{ user.phone_number || "未设置手机号" }}
              </text>
              <view class="user-tags">
                <text
                  v-if="user.is_staff"
                  class="staff-tag"
                >
                  已是专员
                </text>
                <text
                  v-if="user.community_id"
                  class="community-tag"
                >
                  社区ID: {{ user.community_id }}
                </text>
              </view>
            </view>
          </view>

          <!-- 选择状态指示器 -->
          <view class="selection-indicator">
            <text
              v-if="isSelected(user.user_id)"
              class="selected-icon"
            >
              ✓
            </text>
            <text
              v-else
              class="unselected-icon"
            >
              ○
            </text>
          </view>
        </view>

        <!-- 空状态 -->
        <view
          v-if="userList.length === 0"
          class="empty-container"
        >
          <text
            v-if="searchKeyword"
            class="empty-icon"
          >
            🔍
          </text>
          <text
            v-else
            class="empty-icon"
          >
            👥
          </text>

          <text class="empty-title">
            {{ searchKeyword ? "未找到匹配的用户" : "暂无用户数据" }}
          </text>

          <text class="empty-text">
            {{ searchKeyword ? "请尝试其他搜索关键词" : "请输入关键词搜索用户" }}
          </text>
        </view>

        <!-- 加载更多 -->
        <view
          v-if="hasMore"
          class="load-more-container"
        >
          <button
            class="load-more-btn"
            :disabled="loadingMore"
            @click="loadMore"
          >
            <text
              v-if="loadingMore"
              class="loading-text"
            >
              加载中...
            </text>
            <text
              v-else
              class="load-more-text"
            >
              加载更多
            </text>
          </button>
        </view>
      </view>

      <!-- 已选用户区域 -->
      <view
        v-if="selectedUsers.length > 0"
        class="selected-section"
      >
        <view class="selected-header">
          <text class="selected-title">
            已选择 {{ selectedUsers.length }} 个用户
          </text>
          <button
            class="clear-selection-btn"
            @click="clearSelection"
          >
            <text class="clear-text">
              清空
            </text>
          </button>
        </view>

        <view class="selected-users">
          <view
            v-for="userId in selectedUsers"
            :key="userId"
            class="selected-user-tag"
          >
            <text class="selected-user-name">
              {{ getUserName(userId) }}
            </text>
            <button
              class="remove-user-btn"
              @click.stop="removeSelectedUser(userId)"
            >
              <text class="remove-icon">
                ×
              </text>
            </button>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="modal-footer">
        <button
          class="cancel-button"
          @click="handleClose"
        >
          <text class="button-text">
            取消
          </text>
        </button>
        <button
          class="confirm-button"
          :disabled="selectedUsers.length === 0"
          @click="handleConfirm"
        >
          <text class="button-text">
            确认添加 ({{ selectedUsers.length }})
          </text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { request } from "@/api/request";
import { addCommunityStaff } from "@/api/community";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  communityId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "confirm"]);

// 状态管理
const searchKeyword = ref("");
const userList = ref([]);
const selectedUsers = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

// 分页相关
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const hasMore = ref(false); // 由后端API的pagination.has_more字段更新

// 搜索防抖
let searchTimer = null;

// 监听visible变化，显示时重置状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetState();
      // 延迟搜索，避免模态框动画期间搜索
      setTimeout(() => {
        searchUsers();
      }, 300);
    }
  }
);

// 重置状态
const resetState = () => {
  searchKeyword.value = "";
  userList.value = [];
  selectedUsers.value = [];
  currentPage.value = 1;
  totalCount.value = 0;
  hasMore.value = false;
  error.value = "";
};

// 搜索用户
const searchUsers = async (page = 1, isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    error.value = "";
  }

  try {
    // 调用后端API搜索用户（排除黑屋社区）
    const response = await searchUsersExcludingBlackroom(page);

    if (response.code === 1) {
      
      // 适应后端返回的分页结构
      const users = response.data.users || [];
      const pagination = response.data.pagination || {};
      
      // 过滤掉当前社区的工作人员和超级管理员
      const filteredUsers = users.filter(user => {
        // 排除当前社区的专员和管理员
        if (user.is_current_community_staff || user.is_current_community_manager) {
          return false;
        }
        
        // 排除超级管理员（role=4）
        if (user.role === 4) {
          return false;
        }
        
        return true;
      });

      if (isLoadMore) {
        // 加载更多时追加数据
        userList.value = [...userList.value, ...filteredUsers];
      } else {
        // 首次加载时替换数据
        userList.value = filteredUsers;
      }

      totalCount.value = pagination.total || 0;
      currentPage.value = pagination.page || 1;
      hasMore.value = pagination.has_more || false;
    } else {
      error.value = response.msg || "搜索用户失败";
    }
  } catch (err) {
    console.error("搜索用户失败:", err);
    error.value = "网络错误，请稍后重试";
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 搜索输入处理（防抖）
const handleSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    searchUsers(1, false);
  }, 500);
};

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = "";
  searchUsers(1, false);
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return;
  searchUsers(currentPage.value + 1, true);
};

// 用户选择处理
const toggleSelect = (userId) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index === -1) {
    // 添加选中
    selectedUsers.value.push(userId);
  } else {
    // 移除选中
    selectedUsers.value.splice(index, 1);
  }
};

const isSelected = (userId) => {
  return selectedUsers.value.includes(userId);
};

const clearSelection = () => {
  selectedUsers.value = [];
};

const removeSelectedUser = (userId) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index !== -1) {
    selectedUsers.value.splice(index, 1);
  }
};

// 获取用户名称
const getUserName = (userId) => {
  const user = userList.value.find((u) => u.user_id === userId);
  return user ? user.nickname || "未设置昵称" : "未知用户";
};

// 关闭模态框
const handleClose = () => {
  emit("close");
};

// 确认添加
const handleConfirm = async () => {
  console.log('🔍 handleConfirm 被调用', {
    selectedUsers: selectedUsers.value,
    selectedUsersLength: selectedUsers.value.length
  });

  if (selectedUsers.value.length === 0) {
    console.warn('⚠️ 没有选择任何用户，取消添加');
    uni.showToast({
      title: '请先选择要添加的用户',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  try {
    // 验证selectedUsers中的元素是否为有效ID
    const invalidIds = selectedUsers.value.filter((id) => {
      // 检查是否为有效数字或数字字符串
      if (typeof id === "string") {
        const num = parseInt(id, 10);
        return isNaN(num) || num <= 0;
      } else if (typeof id === "number") {
        return id <= 0 || !Number.isInteger(id);
      }
      return true; // 其他类型都视为无效
    });

    if (invalidIds.length > 0) {
      console.error("❌ Layer 1验证失败: 发现无效的用户ID", invalidIds);
      uni.showToast({
        title: `发现${invalidIds.length}个无效的用户ID`,
        icon: "none",
        duration: 3000,
      });
      return;
    }

    // Layer 2: 业务逻辑验证 - 准备发送给后端的数据
    // 确保user_ids是数字类型（后端期望整数）
    const user_ids_for_api = selectedUsers.value.map((id) => {
      if (typeof id === "string") {
        return parseInt(id, 10);
      }
      return id;
    });

    uni.showLoading({ title: "添加中...", mask: true });

    const response = await addCommunityStaff({
      community_id: props.communityId,
      user_ids: user_ids_for_api,
      role: "staff",
    });

    if (response.code === 1) {
      uni.showToast({
        title:
          response.data.added_count > 0
            ? `成功添加${response.data.added_count}名专员`
            : "操作完成",
        icon: "success",
      });

      // 触发父组件重新加载专员列表，传递添加成功的用户信息
      emit("confirm", response.data.added_users || []);
    } else {
      // 显示后端返回的错误信息
      let errorMessage = response.msg || "添加失败";

      // 如果有失败明细，可以提供更详细的错误信息
      if (response.data?.failed?.length > 0) {
        const failedCount = response.data.failed.length;
        const failedReasons = response.data.failed.map((f) => f.reason).join("、");
        errorMessage = `${errorMessage}（${failedCount}个失败：${failedReasons}）`;
      }

      uni.showToast({
        title: errorMessage,
        icon: "none",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error("添加专员失败:", error);
    uni.showToast({
      title: "网络错误，请稍后重试",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    emit("close");
  }
};

// API调用函数
const searchUsersExcludingBlackroom = async (page = 1) => {
  try {
    const response = await request({
      url: "/api/user/search",
      method: "GET",
      data: {
        keyword: searchKeyword.value,
        type: "all", // 全局搜索
        page: page,
        per_page: pageSize.value,
        community_id: props.communityId, // 传递社区ID用于过滤
      },
    });

    return response;
  } catch (error) {
    console.error("API调用失败:", error);
    throw error;
  }
};
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.add-staff-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    width: 90%;
    max-width: 600rpx;
    max-height: 80vh;
    background: $uni-white;
    border-radius: $uni-radius-lg;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: $uni-shadow-modal;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $uni-spacing-lg $uni-spacing-xl;
      border-bottom: 1px solid $uni-border-color;

      .modal-title {
        font-size: $uni-font-size-lg;
        font-weight: $uni-font-weight-base;
        color: $uni-accent;
      }

      .close-button {
        width: 40rpx;
        height: 40rpx;
        border-radius: $uni-radius-full;
        background: $uni-bg-color-light;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        .close-icon {
          font-size: $uni-font-size-lg;
          color: $uni-text-gray-600;
        }

        &:active {
          background: $uni-bg-color-grey;
          transform: scale(0.9);
        }
      }
    }

    .search-section {
      padding: $uni-spacing-lg $uni-spacing-xl;
      border-bottom: 1px solid $uni-border-color;

      .search-input-wrapper {
        @include search-input;
        display: flex;
        align-items: center;
        padding: $uni-spacing-sm $uni-spacing-md;
        margin-bottom: $uni-spacing-xs;

        .search-icon {
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-600;
          margin-right: $uni-spacing-sm;
        }

        .search-input {
          flex: 1;
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-800;
          background: transparent;
          border: none;
          outline: none;

          &::placeholder {
            color: $uni-text-gray-600;
          }
        }

        .clear-button {
          width: 32rpx;
          height: 32rpx;
          border-radius: $uni-radius-full;
          background: $uni-bg-color-light;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;

          .clear-icon {
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-600;
          }

          &:active {
            background: $uni-bg-color-grey;
            transform: scale(0.9);
          }
        }
      }

      .search-hint {
        display: block;
        font-size: $uni-font-size-xs;
        color: $uni-text-gray-600;
      }
    }

    .loading-container,
    .error-container {
      padding: $uni-spacing-xxl;
      text-align: center;

      .error-text {
        display: block;
        font-size: $uni-font-size-base;
        color: $uni-error;
        margin-bottom: $uni-spacing-md;
      }

      .retry-btn {
        @include btn-primary;
        padding: $uni-spacing-sm $uni-spacing-base;
      }
    }

    .users-list {
      flex: 1;
      overflow-y: auto;
      padding: $uni-spacing-base $uni-spacing-xl;

      .user-item {
        @include card-gradient;
        padding: $uni-spacing-md;
        border-radius: $uni-radius-base;
        margin-bottom: $uni-spacing-sm;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
        cursor: pointer;

        &.selected {
          border: 2px solid $uni-primary;
          background: rgba(59, 130, 246, 0.05);
        }

        &:active {
          transform: translateY(-1px);
          box-shadow: $uni-shadow-card-hover;
        }

        .user-info {
          display: flex;
          align-items: center;
          flex: 1;

          .user-avatar-container {
            margin-right: $uni-spacing-base;

            .user-avatar {
              width: 60rpx;
              height: 60rpx;
              border-radius: $uni-radius-full;
            }

            .user-avatar-placeholder {
              font-size: $uni-font-size-lg;
              color: $uni-secondary;
            }
          }

          .user-details {
            flex: 1;

            .user-name {
              display: block;
              font-size: $uni-font-size-base;
              font-weight: $uni-font-weight-base;
              color: $uni-text-gray-700;
              margin-bottom: $uni-spacing-xs;
            }

            .user-phone {
              display: block;
              font-size: $uni-font-size-sm;
              color: $uni-text-gray-600;
              margin-bottom: $uni-spacing-xs;
            }

            .user-tags {
              display: flex;
              gap: $uni-spacing-xs;

              .staff-tag {
                font-size: $uni-font-size-xxs;
                padding: 2rpx 6rpx;
                border-radius: $uni-radius-xs;
                background: rgba(16, 185, 129, 0.1);
                color: $uni-success;
              }

              .community-tag {
                font-size: $uni-font-size-xxs;
                padding: 2rpx 6rpx;
                border-radius: $uni-radius-xs;
                background: rgba(107, 114, 128, 0.1);
                color: $uni-text-gray-600;
              }
            }
          }
        }

        .selection-indicator {
          width: 40rpx;
          height: 40rpx;
          border-radius: $uni-radius-full;
          display: flex;
          align-items: center;
          justify-content: center;

          .selected-icon {
            font-size: $uni-font-size-lg;
            color: $uni-primary;
          }

          .unselected-icon {
            font-size: $uni-font-size-lg;
            color: $uni-text-gray-600;
          }
        }
      }

      .empty-container {
        text-align: center;
        padding: $uni-spacing-xxl $uni-spacing-xl;

        .empty-icon {
          font-size: 48rpx;
          color: $uni-text-gray-600;
          display: block;
          margin-bottom: $uni-spacing-md;
        }

        .empty-title {
          display: block;
          font-size: $uni-font-size-lg;
          font-weight: $uni-font-weight-base;
          color: $uni-accent;
          margin-bottom: $uni-spacing-sm;
        }

        .empty-text {
          display: block;
          font-size: $uni-font-size-base;
          color: $uni-text-gray-600;
        }
      }

      .load-more-container {
        text-align: center;
        margin-top: $uni-spacing-lg;

        .load-more-btn {
          @include btn-primary;
          padding: $uni-spacing-sm $uni-spacing-xl;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .loading-text,
          .load-more-text {
            font-size: $uni-font-size-sm;
          }
        }
      }
    }

    .selected-section {
      padding: $uni-spacing-lg $uni-spacing-xl;
      border-top: 1px solid $uni-border-color;
      background: $uni-bg-color-light;

      .selected-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $uni-spacing-sm;

        .selected-title {
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
          color: $uni-accent;
        }

        .clear-selection-btn {
          font-size: $uni-font-size-sm;
          color: $uni-error;
          background: transparent;
          border: none;
          padding: $uni-spacing-xs $uni-spacing-sm;
          border-radius: $uni-radius-sm;

          &:active {
            background: rgba(239, 68, 68, 0.1);
          }
        }
      }

      .selected-users {
        display: flex;
        flex-wrap: wrap;
        gap: $uni-spacing-xs;

        .selected-user-tag {
          display: flex;
          align-items: center;
          gap: $uni-spacing-xs;
          padding: $uni-spacing-xs $uni-spacing-sm;
          background: $uni-primary;
          color: $uni-white;
          border-radius: $uni-radius-sm;
          font-size: $uni-font-size-xs;

          .remove-user-btn {
            width: 20rpx;
            height: 20rpx;
            border-radius: $uni-radius-full;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;

            .remove-icon {
              font-size: $uni-font-size-xs;
              color: $uni-white;
            }

            &:active {
              background: rgba(255, 255, 255, 0.3);
            }
          }
        }
      }
    }

    .modal-footer {
      display: flex;
      padding: $uni-spacing-lg $uni-spacing-xl;
      border-top: 1px solid $uni-border-color;
      gap: $uni-spacing-base;

      .cancel-button,
      .confirm-button {
        flex: 1;
        padding: $uni-spacing-base;
        border-radius: $uni-radius-base;
        font-size: $uni-font-size-base;
        font-weight: $uni-font-weight-base;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .cancel-button {
        background: $uni-bg-color-light;
        color: $uni-text-gray-700;

        &:active {
          background: $uni-bg-color-grey;
        }
      }

      .confirm-button {
        background: $uni-primary;
        color: $uni-white;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:active:not(:disabled) {
          background: darken($uni-primary, 10%);
        }
      }
    }
  }
}
</style>
