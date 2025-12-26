<template>
  <view
    v-if="visible"
    class="community-add-user-modal"
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
          {{ isAnkaFamily ? "创建新用户" : "添加社区用户" }}
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

      <!-- 表单内容 -->
      <view class="modal-body">
        <!-- 安卡大家庭：创建表单 -->
        <template v-if="isAnkaFamily">
          <form
            class="create-user-form"
            @submit.prevent="handleCreateUser"
          >
            <view class="form-field">
              <text class="field-label">
                用户姓名
              </text>
              <input
                v-model="formData.nickname"
                class="form-input"
                type="text"
                placeholder="请输入用户姓名"
                maxlength="20"
                :disabled="submitting"
              >
              <text
                v-if="formErrors.nickname"
                class="error-text"
              >
                {{
                  formErrors.nickname
                }}
              </text>
            </view>

            <view class="form-field">
              <text class="field-label">
                手机号码
              </text>
              <input
                v-model="formData.phone"
                class="form-input"
                type="text"
                placeholder="请输入手机号码"
                maxlength="11"
                :disabled="submitting"
                @input="handlePhoneInput"
              >
              <text
                v-if="formErrors.phone"
                class="error-text"
              >
                {{
                  formErrors.phone
                }}
              </text>
            </view>

            <view class="form-field">
              <text class="field-label">
                用户角色
              </text>
              <view class="readonly-field">
                <text class="readonly-text">
                  独居者
                </text>
              </view>
            </view>

            <view class="form-field">
              <text class="field-label">
                初始密码
              </text>
              <view class="readonly-field">
                <text class="readonly-text">
                  A123456
                </text>
                <text class="password-hint">
                  （默认密码）
                </text>
              </view>
            </view>

            <view class="form-field">
              <text class="field-label">
                备注信息（可选）
              </text>
              <textarea
                v-model="formData.remark"
                class="form-textarea"
                placeholder="可输入备注信息"
                maxlength="200"
                :disabled="submitting"
              />
            </view>

            <view
              v-if="showSuperAdminHint"
              class="super-admin-hint"
            >
              <text class="hint-icon">
                🔑
              </text>
              <text class="hint-text">
                超级管理员模式：免验证码创建
              </text>
            </view>
          </form>
        </template>

        <!-- 普通社区：搜索界面 -->
        <template v-else>
          <view class="search-section">
            <view class="search-input-wrapper">
              <text class="search-icon">
                🔍
              </text>
              <input
                v-model="searchQuery"
                class="search-input"
                type="text"
                placeholder="搜索用户姓名或手机号"
                :disabled="searching"
                @input="handleSearchInput"
              >
              <button
                v-if="searchQuery"
                class="clear-button"
                :disabled="searching"
                @click="clearSearch"
              >
                <text class="clear-icon">
                  ×
                </text>
              </button>
            </view>
          </view>

          <view class="search-results">
            <!-- 加载状态 -->
            <view
              v-if="searching"
              class="loading-state"
            >
              <text class="loading-icon">
                ⏳
              </text>
              <text class="loading-text">
                搜索中...
              </text>
            </view>

            <!-- 空状态 -->
            <view
              v-else-if="searchResults.length === 0"
              class="empty-state"
            >
              <text
                v-if="searchQuery"
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
              <text class="empty-text">
                {{ searchQuery ? "未找到匹配的用户" : "请输入搜索关键词" }}
              </text>
              <text
                v-if="!searchQuery"
                class="empty-hint"
              >
                请输入用户姓名或手机号进行搜索
              </text>
            </view>

            <!-- 搜索结果列表 -->
            <view
              v-else
              class="result-list"
            >
              <view
                v-for="user in searchResults"
                :key="user.userId"
                class="result-item"
              >
                <view class="user-info">
                  <view class="user-avatar">
                    <text class="avatar-icon">
                      👤
                    </text>
                  </view>
                  <view class="user-details">
                    <text class="user-name">
                      {{ user.nickname || "未设置昵称" }}
                    </text>
                    <text class="user-phone">
                      {{
                        formatPhoneNumber(user.phoneNumber)
                      }}
                    </text>
                  </view>
                </view>
                <button
                  class="add-button"
                  :disabled="addingUser === user.userId"
                  @click="handleAddExistingUser(user.userId)"
                >
                  <text
                    v-if="addingUser === user.userId"
                    class="button-text"
                  >
                    添加中...
                  </text>
                  <text
                    v-else
                    class="button-text"
                  >
                    添加
                  </text>
                </button>
              </view>
            </view>
          </view>
        </template>
      </view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <button
          class="cancel-button"
          :disabled="submitting"
          @click="handleClose"
        >
          <text class="button-text">
            取消
          </text>
        </button>

        <!-- 安卡大家庭：创建按钮 -->
        <button
          v-if="isAnkaFamily"
          class="submit-button"
          :disabled="!isFormValid || submitting"
          @click="handleCreateUser"
        >
          <text
            v-if="submitting"
            class="button-text"
          >
            创建中...
          </text>
          <text
            v-else
            class="button-text"
          >
            确认创建
          </text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useUserStore } from "@/store/modules/user";
import { authApi } from "@/api/auth";
import { SPECIAL_COMMUNITY_NAMES } from "@/constants/community";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  communityId: {
    type: [String, Number],
    default: "",
  },
  communityName: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "confirm"]);

// Store
const userStore = useUserStore();

// 计算属性：是否为安卡大家庭
const isAnkaFamily = computed(() => {
  return props.communityName === SPECIAL_COMMUNITY_NAMES.ANKA_FAMILY;
});

// 计算属性：是否为超级管理员
const isSuperAdmin = computed(() => {
  return userStore.isSuperAdmin;
});

// 计算属性：显示超级管理员提示
const showSuperAdminHint = computed(() => {
  return isAnkaFamily.value && isSuperAdmin.value;
});

// 安卡大家庭表单数据
const formData = ref({
  nickname: "",
  phone: "",
  remark: "",
});

// 表单错误信息
const formErrors = ref({
  nickname: "",
  phone: "",
});

// 表单验证
const isFormValid = computed(() => {
  return (
    formData.value.nickname.trim().length >= 2 &&
    formData.value.phone.trim().length === 11 &&
    /^1[3-9]\d{9}$/.test(formData.value.phone)
  );
});

// 提交状态
const submitting = ref(false);

// 搜索相关状态
const searchQuery = ref("");
const searchResults = ref([]);
const searching = ref(false);
const addingUser = ref(null);
let searchTimer = null;

// 搜索防抖处理
const handleSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    performSearch();
  }, 300);
};

// 执行搜索
const performSearch = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    searchResults.value = [];
    return;
  }

  try {
    searching.value = true;
    let response;

    // 根据社区类型使用不同的搜索API
    if (isAnkaFamily.value) {
      // 安卡大家庭：使用通用搜索API
      response = await authApi.searchUsers({
        nickname: query,
        per_page: 20,
      });
    } else {
      // 普通社区：只从安卡大家庭搜索用户
      response = await authApi.searchAnkaFamilyUsers({
        keyword: query,
        per_page: 20,
      });
    }

    if (response.code === 1) {
      searchResults.value = response.data.users || [];
    } else {
      searchResults.value = [];
      uni.showToast({
        title: response.msg || "搜索失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("搜索用户失败:", error);
    searchResults.value = [];
    uni.showToast({
      title: "搜索失败，请重试",
      icon: "none",
    });
  } finally {
    searching.value = false;
  }
};

// 清空搜索
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
};

// 处理手机号输入，过滤非数字字符
const handlePhoneInput = (event) => {
  // 过滤非数字字符
  formData.value.phone = event.detail.value.replace(/\D/g, "");
};

// 格式化手机号显示
const formatPhoneNumber = (phone) => {
  if (!phone) return "未设置手机号";
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
};

// 验证表单
const validateForm = () => {
  let isValid = true;
  formErrors.value = { nickname: "", phone: "" };

  // 验证姓名
  if (!formData.value.nickname.trim()) {
    formErrors.value.nickname = "请输入用户姓名";
    isValid = false;
  } else if (formData.value.nickname.trim().length < 2) {
    formErrors.value.nickname = "姓名至少2个字符";
    isValid = false;
  }

  // 验证手机号
  if (!formData.value.phone.trim()) {
    formErrors.value.phone = "请输入手机号码";
    isValid = false;
  } else if (!/^1[3-9]\d{9}$/.test(formData.value.phone.trim())) {
    formErrors.value.phone = "请输入正确的手机号码";
    isValid = false;
  }

  return isValid;
};

// 创建新用户（安卡大家庭）
const handleCreateUser = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    submitting.value = true;

    // 准备注册数据
    const registerData = {
      phone: formData.value.phone.trim(),
      nickname: formData.value.nickname.trim(),
      password: "A123456", // 默认密码
      role: 1, // 默认角色：独居者
      // 如果是超级管理员，使用特殊验证码或由后端处理
      code: isSuperAdmin.value ? "000000" : "", // 需要后端支持
    };

    // 调用注册API
    const response = await authApi.registerPhone(registerData);

    if (response.code === 1) {
      uni.showToast({
        title: "用户创建成功",
        icon: "success",
      });

      // 传递创建的用户数据给父组件
      emit("confirm", {
        type: "create",
        userData: {
          userId: response.data.userId,
          nickname: formData.value.nickname.trim(),
          phoneNumber: formData.value.phone.trim(),
          remark: formData.value.remark.trim(),
        },
      });

      // 重置表单
      resetForm();
      handleClose();
    } else {
      uni.showToast({
        title: response.msg || "创建用户失败",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("创建用户失败:", error);
    uni.showToast({
      title: "创建用户失败，请重试",
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
};

// 添加现有用户（普通社区）
const handleAddExistingUser = async (userId) => {
  try {
    addingUser.value = userId;

    // 直接传递用户ID给父组件，由父组件调用社区添加API
    emit("confirm", {
      type: "add",
      userId: userId,
    });

    // 关闭模态框
    handleClose();
  } catch (error) {
    console.error("添加用户失败:", error);
    uni.showToast({
      title: "添加失败，请重试",
      icon: "none",
    });
  } finally {
    addingUser.value = null;
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    nickname: "",
    phone: "",
    remark: "",
  };
  formErrors.value = {
    nickname: "",
    phone: "",
  };
  searchQuery.value = "";
  searchResults.value = [];
  searching.value = false;
  addingUser.value = null;
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
};

// 关闭模态框
const handleClose = () => {
  if (!submitting.value && !searching.value) {
    resetForm();
    emit("close");
  }
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);

// 组件挂载时初始化
onMounted(() => {
  // 初始化逻辑
});
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.community-add-user-modal {
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
    background: $uni-bg-color-white;
    border-radius: $uni-radius-lg;
    box-shadow: $uni-shadow-modal;
    overflow: hidden;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $uni-spacing-xl;
      border-bottom: 1px solid $uni-divider;

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

    .modal-body {
      padding: $uni-spacing-xl;
      max-height: 70vh;
      overflow-y: auto;

      // 创建用户表单样式
      .create-user-form {
        .form-field {
          margin-bottom: $uni-spacing-lg;

          .field-label {
            display: block;
            font-size: $uni-font-size-sm;
            font-weight: $uni-font-weight-base;
            color: $uni-text-gray-700;
            margin-bottom: $uni-spacing-xs;
          }

          .form-input,
          .form-textarea {
            width: 100%;
            padding: $uni-spacing-base;
            background: $uni-bg-color-white;
            border: 1px solid $uni-divider;
            border-radius: $uni-radius-base;
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-800;
            transition: all 0.2s ease;

            &::placeholder {
              color: $uni-text-gray-600;
            }

            &:focus {
              border-color: $uni-primary;
              outline: none;
            }

            &:disabled {
              background: $uni-bg-color-light;
              color: $uni-text-gray-600;
              cursor: not-allowed;
            }
          }

          .form-textarea {
            min-height: 120rpx;
            resize: vertical;
          }

          .readonly-field {
            padding: $uni-spacing-base;
            background: $uni-bg-color-light;
            border: 1px solid $uni-divider;
            border-radius: $uni-radius-base;
            display: flex;
            align-items: center;
            gap: $uni-spacing-xs;

            .readonly-text {
              font-size: $uni-font-size-sm;
              color: $uni-text-gray-800;
              font-weight: $uni-font-weight-base;
            }

            .password-hint {
              font-size: $uni-font-size-xs;
              color: $uni-text-gray-600;
            }
          }

          .error-text {
            display: block;
            font-size: $uni-font-size-xs;
            color: $uni-error;
            margin-top: $uni-spacing-xs;
          }
        }

        .super-admin-hint {
          display: flex;
          align-items: center;
          gap: $uni-spacing-xs;
          padding: $uni-spacing-sm;
          background: rgba(59, 130, 246, 0.1);
          border-radius: $uni-radius-base;
          margin-top: $uni-spacing-lg;

          .hint-icon {
            font-size: $uni-font-size-sm;
            color: $uni-info;
          }

          .hint-text {
            font-size: $uni-font-size-xs;
            color: $uni-info;
            font-weight: $uni-font-weight-base;
          }
        }
      }

      // 搜索界面样式
      .search-section {
        margin-bottom: $uni-spacing-lg;

        .search-input-wrapper {
          @include search-input;
          display: flex;
          align-items: center;
          padding: $uni-spacing-sm $uni-spacing-md;

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

            &:disabled {
              color: $uni-text-gray-600;
              cursor: not-allowed;
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

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      .search-results {
        min-height: 200rpx;

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: $uni-spacing-xxxl $uni-spacing-xl;

          .loading-icon {
            font-size: $uni-font-size-xxxl;
            color: $uni-text-gray-600;
            margin-bottom: $uni-spacing-md;
            animation: spin 1s linear infinite;
          }

          .loading-text {
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-600;
          }
        }

        .empty-state {
          text-align: center;
          padding: $uni-spacing-xxxl $uni-spacing-xl;

          .empty-icon {
            font-size: $uni-font-size-xxxl;
            color: $uni-text-gray-600;
            display: block;
            margin-bottom: $uni-spacing-md;
          }

          .empty-text {
            display: block;
            font-size: $uni-font-size-base;
            color: $uni-text-gray-700;
            margin-bottom: $uni-spacing-xs;
          }

          .empty-hint {
            display: block;
            font-size: $uni-font-size-xs;
            color: $uni-text-gray-600;
          }
        }

        .result-list {
          .result-item {
            @include card-gradient;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: $uni-spacing-md;
            margin-bottom: $uni-spacing-sm;
            transition: all 0.3s ease;

            &:active {
              transform: translateY(-1px);
              box-shadow: $uni-shadow-card-hover;
            }

            .user-info {
              display: flex;
              align-items: center;
              gap: $uni-spacing-md;

              .user-avatar {
                width: 80rpx;
                height: 80rpx;
                border-radius: $uni-radius-full;
                background: rgba(59, 130, 246, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;

                .avatar-icon {
                  font-size: $uni-font-size-lg;
                  color: $uni-info;
                }
              }

              .user-details {
                .user-name {
                  display: block;
                  font-size: $uni-font-size-base;
                  font-weight: $uni-font-weight-base;
                  color: $uni-accent;
                  margin-bottom: $uni-spacing-xs;
                }

                .user-phone {
                  display: block;
                  font-size: $uni-font-size-xs;
                  color: $uni-text-gray-600;
                }
              }
            }

            .add-button {
              @include btn-primary;
              padding: $uni-spacing-xs $uni-spacing-md;
              font-size: $uni-font-size-xs;
              border-radius: $uni-radius-sm;
              min-width: 100rpx;

              .button-text {
                font-weight: $uni-font-weight-base;
              }

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }

    .modal-footer {
      display: flex;
      padding: $uni-spacing-xl;
      border-top: 1px solid $uni-divider;
      gap: $uni-spacing-base;

      .cancel-button,
      .submit-button {
        flex: 1;
        padding: $uni-spacing-base;
        border-radius: $uni-radius-base;
        text-align: center;
        transition: all 0.2s ease;

        .button-text {
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .cancel-button {
        background: $uni-bg-color-light;
        color: $uni-text-gray-600;

        &:active:not(:disabled) {
          background: $uni-bg-color-grey;
        }
      }

      .submit-button {
        @include btn-primary;

        &:disabled {
          background: rgba(244, 130, 36, 0.5);
          border-color: rgba(244, 130, 36, 0.5);
        }
      }
    }
  }
}

// 旋转动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
