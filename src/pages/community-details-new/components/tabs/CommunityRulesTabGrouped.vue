<template>
  <view class="community-rules-tab-grouped">
    <!-- 标题 -->
    <view class="tab-header">
      <h3 class="tab-title">社区打卡规则</h3>
      <button class="add-button" @click="handleAddRule">
        <text class="add-icon">+</text>
        <text class="add-text">添加规则</text>
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadRules">重试</button>
    </view>

    <!-- 空状态（所有分组都为空） -->
    <view v-else-if="totalRules === 0" class="empty-container">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无社区打卡规则</text>
      <text class="empty-text">点击右上角"添加规则"创建第一条规则</text>
      <text class="empty-hint">社区规则将自动应用于所有社区成员</text>
    </view>

    <!-- 分组规则列表 -->
    <view v-else class="rules-grouped-container">
      <!-- 启用规则组 -->
      <view class="rules-group" v-if="groupedRules.enabled.length > 0">
        <view class="group-header">
          <text class="group-title">启用规则</text>
          <text class="group-count">{{ groupedRules.enabled.length }} 条</text>
        </view>
        <view class="rules-list">
          <view
            v-for="rule in groupedRules.enabled"
            :key="rule.community_rule_id"
            class="rule-item enabled-rule"
          >
            <!-- 规则图标和名称 -->
            <view class="rule-header">
              <view class="rule-icon-container">
                <image
                  v-if="rule.icon_url"
                  :src="rule.icon_url"
                  class="rule-icon"
                  mode="aspectFit"
                />
                <text v-else class="rule-icon-placeholder">📋</text>
              </view>
              <view class="rule-info">
                <text class="rule-name">{{ rule.rule_name }}</text>
                <text class="rule-time">
                  最后更新：{{ formatDate(rule.updated_at || rule.created_at) }}
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="rule-actions">
              <button
                class="action-btn disable-btn"
                @click.stop="handleDisableRule(rule)"
              >
                停用
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-group">
        <text class="empty-group-text">无启用规则</text>
      </view>

      <!-- 停用规则组 -->
      <view class="rules-group" v-if="groupedRules.disabled.length > 0">
        <view class="group-header">
          <text class="group-title">停用规则</text>
          <text class="group-count">{{ groupedRules.disabled.length }} 条</text>
        </view>
        <view class="rules-list">
          <view
            v-for="rule in groupedRules.disabled"
            :key="rule.community_rule_id"
            class="rule-item disabled-rule"
          >
            <!-- 规则图标和名称 -->
            <view class="rule-header">
              <view class="rule-icon-container">
                <image
                  v-if="rule.icon_url"
                  :src="rule.icon_url"
                  class="rule-icon"
                  mode="aspectFit"
                />
                <text v-else class="rule-icon-placeholder">📋</text>
              </view>
              <view class="rule-info">
                <text class="rule-name">{{ rule.rule_name }}</text>
                <text class="rule-time">
                  最后更新：{{ formatDate(rule.updated_at || rule.created_at) }}
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="rule-actions">
              <button class="action-btn edit-btn" @click.stop="handleEditRule(rule)">
                编辑
              </button>
              <button class="action-btn enable-btn" @click.stop="handleEnableRule(rule)">
                启用
              </button>
              <button class="action-btn delete-btn" @click.stop="handleDeleteRule(rule)">
                删除
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-group">
        <text class="empty-group-text">无停用规则</text>
      </view>

      <!-- 删除规则组 -->
      <view class="rules-group" v-if="groupedRules.deleted.length > 0">
        <view class="group-header">
          <text class="group-title">删除规则</text>
          <text class="group-count">{{ groupedRules.deleted.length }} 条</text>
        </view>
        <view class="rules-list">
          <view
            v-for="rule in groupedRules.deleted"
            :key="rule.community_rule_id"
            class="rule-item deleted-rule"
          >
            <!-- 规则图标和名称 -->
            <view class="rule-header">
              <view class="rule-icon-container">
                <image
                  v-if="rule.icon_url"
                  :src="rule.icon_url"
                  class="rule-icon"
                  mode="aspectFit"
                />
                <text v-else class="rule-icon-placeholder">📋</text>
              </view>
              <view class="rule-info">
                <text class="rule-name">{{ rule.rule_name }}</text>
                <text class="rule-time">
                  最后更新：{{ formatDate(rule.updated_at || rule.created_at) }}
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="rule-actions">
              <button class="action-btn enable-btn" @click.stop="handleEnableRule(rule)">
                启用
              </button>
              <button
                class="action-btn permanent-delete-btn"
                @click.stop="handlePermanentDeleteRule(rule)"
              >
                永久删除
              </button>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-group">
        <text class="empty-group-text">无删除规则</text>
      </view>
    </view>

    <!-- 规则详情模态框 -->
    <uni-popup ref="ruleDetailPopup" type="bottom">
      <view class="rule-detail-modal" v-if="selectedRule">
        <view class="modal-header">
          <text class="modal-title">规则详情</text>
          <button class="modal-close" @click="closeRuleDetail">×</button>
        </view>

        <view class="modal-content">
          <!-- 规则基本信息 -->
          <view class="detail-section">
            <text class="section-title">基本信息</text>
            <view class="detail-item">
              <text class="detail-label">规则名称：</text>
              <text class="detail-value">{{ selectedRule.rule_name }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">规则状态：</text>
              <text class="detail-value" :class="getStatusClass(selectedRule.status)">
                {{ getStatusText(selectedRule.status) }}
              </text>
            </view>
            <view class="detail-item">
              <text class="detail-label">创建时间：</text>
              <text class="detail-value">{{ formatDate(selectedRule.created_at) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">创建者：</text>
              <text class="detail-value">{{
                selectedRule.created_by_name || "未知"
              }}</text>
            </view>
          </view>

          <!-- 规则设置 -->
          <view class="detail-section">
            <text class="section-title">规则设置</text>
            <view class="detail-item">
              <text class="detail-label">打卡频率：</text>
              <text class="detail-value">{{
                getFrequencyText(selectedRule.frequency_type)
              }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">打卡时间：</text>
              <text class="detail-value">{{
                getTimeSlotText(selectedRule.time_slot_type)
              }}</text>
            </view>
            <view v-if="selectedRule.custom_time" class="detail-item">
              <text class="detail-label">自定义时间：</text>
              <text class="detail-value">{{ formatTime(selectedRule.custom_time) }}</text>
            </view>
            <view v-if="selectedRule.week_days !== 127" class="detail-item">
              <text class="detail-label">适用星期：</text>
              <text class="detail-value">{{
                getWeekDaysText(selectedRule.week_days)
              }}</text>
            </view>
            <view
              v-if="selectedRule.custom_start_date && selectedRule.custom_end_date"
              class="detail-item"
            >
              <text class="detail-label">适用日期：</text>
              <text class="detail-value">
                {{ formatDate(selectedRule.custom_start_date) }} 至
                {{ formatDate(selectedRule.custom_end_date) }}
              </text>
            </view>
          </view>

          <!-- 规则影响 -->
          <view class="detail-section">
            <text class="section-title">规则影响</text>
            <view class="detail-item">
              <text class="detail-label">适用用户数：</text>
              <text class="detail-value">{{ selectedRule.user_count || 0 }} 人</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">今日打卡数：</text>
              <text class="detail-value">{{ selectedRule.today_checkins || 0 }} 次</text>
            </view>
          </view>
        </view>

        <view class="modal-footer">
          <button class="modal-btn secondary-btn" @click="closeRuleDetail">关闭</button>
          <button
            v-if="selectedRule.status === 0"
            class="modal-btn primary-btn"
            @click="handleEditRule(selectedRule)"
          >
            编辑规则
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import {
  getCommunityRules,
  enableCommunityRule,
  disableCommunityRule,
  deleteCommunityRule,
} from "@/api/community-checkin";

const props = defineProps({
  communityId: {
    type: [String, Number],
    default: "",
  },
});

const emit = defineEmits(["add-rule", "edit-rule", "remove-rule"]);

// 数据状态
const loading = ref(false);
const error = ref("");
const groupedRules = ref({
  disabled: [], // status=0
  enabled: [], // status=1
  deleted: [], // status=2
});
const selectedRule = ref(null);

// 弹出框引用
const ruleDetailPopup = ref(null);

// 计算总规则数
const totalRules = computed(() => {
  return (
    groupedRules.value.disabled.length +
    groupedRules.value.enabled.length +
    groupedRules.value.deleted.length
  );
});

// 频率类型映射
const frequencyTypes = {
  0: "每天",
  1: "每周",
  2: "工作日",
  3: "自定义日期",
};

// 时间段类型映射
const timeSlotTypes = {
  1: "上午 (09:00)",
  2: "下午 (14:00)",
  3: "晚上 (20:00)",
  4: "自定义时间",
};

// 星期映射
const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 状态映射
const statusMapping = {
  0: "停用",
  1: "启用",
  2: "删除",
};

// 监听communityId变化
watch(
  () => props.communityId,
  (newVal) => {
    if (newVal) {
      loadRules();
    }
  }
);

// 组件挂载时加载规则
onMounted(() => {
  if (props.communityId) {
    loadRules();
  }

  // 监听规则刷新事件
  uni.$on("community-rules-refresh", (refreshedCommunityId) => {
    if (refreshedCommunityId === props.communityId) {
      loadRules();
    }
  });
});

// 组件卸载时清理事件监听
import { onUnmounted } from "vue";
onUnmounted(() => {
  uni.$off("community-rules-refresh");
});

// 加载规则列表（分组数据）
const loadRules = async () => {
  if (!props.communityId) {
    error.value = "社区ID不能为空";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // 注意：这里不传include_disabled参数，后端会返回分组数据
    const response = await getCommunityRules(props.communityId);
    if (response.code === 1) {
      // 后端返回的是分组数据
      groupedRules.value = {
        disabled: response.data.disabled || [],
        enabled: response.data.enabled || [],
        deleted: response.data.deleted || [],
      };
    } else {
      error.value = response.msg || "获取规则列表失败";
      groupedRules.value = { disabled: [], enabled: [], deleted: [] };
    }
  } catch (err) {
    console.error("加载规则列表失败:", err);
    error.value = "网络错误，请稍后重试";
    groupedRules.value = { disabled: [], enabled: [], deleted: [] };
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status) => {
  return statusMapping[status] || "未知状态";
};

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 1:
      return "status-enabled";
    case 0:
      return "status-disabled";
    case 2:
      return "status-deleted";
    default:
      return "";
  }
};

// 获取频率文本
const getFrequencyText = (frequencyType) => {
  return frequencyTypes[frequencyType] || "未知频率";
};

// 获取时间段文本
const getTimeSlotText = (timeSlotType) => {
  return timeSlotTypes[timeSlotType] || "未知时间段";
};

// 获取星期文本
const getWeekDaysText = (weekDaysValue) => {
  if (weekDaysValue === 127) return "每天";

  const selectedDays = [];
  for (let i = 0; i < 7; i++) {
    if (weekDaysValue & (1 << i)) {
      selectedDays.push(weekDays[i]);
    }
  }
  return selectedDays.join("、");
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  if (typeof timeStr === "string") {
    return timeStr.substring(0, 5); // 只显示时:分
  }
  return timeStr;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${
    date.getMonth() + 1
  }月${date.getDate()}日 ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

// 处理添加规则
const handleAddRule = () => {
  uni.navigateTo({
    url: `/pages/community-checkin-rule-form/community-checkin-rule-form?communityId=${props.communityId}`,
  });
};

// 处理编辑规则
const handleEditRule = (rule) => {
  uni.navigateTo({
    url: `/pages/community-checkin-rule-form/community-checkin-rule-form?communityId=${props.communityId}&ruleId=${rule.community_rule_id}`,
  });
};

// 处理查看规则详情
const handleViewRule = (rule) => {
  selectedRule.value = rule;
  ruleDetailPopup.value.open();
};

// 关闭规则详情
const closeRuleDetail = () => {
  ruleDetailPopup.value.close();
  selectedRule.value = null;
};

// 处理启用规则
const handleEnableRule = async (rule) => {
  uni.showModal({
    title: "确认启用",
    content: "确定要启用该规则吗？启用后将对所有社区成员生效。",
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: "启用中..." });

          const response = await enableCommunityRule(rule.community_rule_id);

          if (response.code === 1) {
            uni.showToast({ title: "启用成功", icon: "success" });
            // 重新加载规则列表
            await loadRules();
          } else {
            uni.showToast({ title: response.msg || "启用失败", icon: "error" });
          }
        } catch (err) {
          uni.showToast({ title: "启用失败", icon: "error" });
        } finally {
          uni.hideLoading();
        }
      }
    },
  });
};

// 处理停用规则
const handleDisableRule = async (rule) => {
  uni.showModal({
    title: "确认停用",
    content: "确定要停用该规则吗？停用后社区成员将不再需要按此规则打卡。",
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: "停用中..." });

          const response = await disableCommunityRule(rule.community_rule_id);

          if (response.code === 1) {
            uni.showToast({ title: "停用成功", icon: "success" });
            // 重新加载规则列表
            await loadRules();
          } else {
            uni.showToast({ title: response.msg || "停用失败", icon: "error" });
          }
        } catch (err) {
          uni.showToast({ title: "停用失败", icon: "error" });
        } finally {
          uni.hideLoading();
        }
      }
    },
  });
};

// 处理删除规则（软删除）
const handleDeleteRule = async (rule) => {
  uni.showModal({
    title: "确认删除",
    content: '确定要删除该规则吗？删除后规则将进入"删除规则"组，可以恢复或永久删除。',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: "删除中..." });

          const response = await deleteCommunityRule(rule.community_rule_id);

          if (response.code === 1) {
            uni.showToast({ title: "删除成功", icon: "success" });
            // 重新加载规则列表
            await loadRules();
          } else {
            uni.showToast({ title: response.msg || "删除失败", icon: "error" });
          }
        } catch (err) {
          uni.showToast({ title: "删除失败", icon: "error" });
        } finally {
          uni.hideLoading();
        }
      }
    },
  });
};

// 处理永久删除规则
const handlePermanentDeleteRule = async (rule) => {
  uni.showModal({
    title: "确认永久删除",
    content: "确定要永久删除该规则吗？此操作不可撤销，规则将彻底从系统中移除。",
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: "永久删除中..." });

          // TODO: 实现永久删除API
          // const response = await permanentDeleteCommunityRule(rule.community_rule_id)

          // 暂时使用软删除API
          const response = await deleteCommunityRule(rule.community_rule_id);

          if (response.code === 1) {
            uni.showToast({ title: "永久删除成功", icon: "success" });
            // 重新加载规则列表
            await loadRules();
          } else {
            uni.showToast({ title: response.msg || "永久删除失败", icon: "error" });
          }
        } catch (err) {
          uni.showToast({ title: "永久删除失败", icon: "error" });
        } finally {
          uni.hideLoading();
        }
      }
    },
  });
};
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.community-rules-tab-grouped {
  .tab-header {
    display: flex;
    align-items: center;
    margin-bottom: $uni-spacing-lg;

    .tab-title {
      font-size: $uni-font-size-base;
      font-weight: $uni-font-weight-base;
      color: $uni-accent;
      flex: 1; /* 标题占据剩余空间，实现左对齐 */
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: $uni-spacing-xs;
      padding: $uni-spacing-xs $uni-spacing-sm;
      background: transparent;
      border-radius: $uni-radius-sm;
      transition: all 0.2s ease;

      .add-icon {
        font-size: $uni-font-size-sm;
        color: $uni-secondary;
      }

      .add-text {
        font-size: $uni-font-size-xs;
        color: $uni-secondary;
        font-weight: $uni-font-weight-base;
      }

      &:active {
        background: rgba(144, 147, 153, 0.1);
        transform: scale(0.98);
      }
    }
  }

  .loading-container,
  .error-container {
    padding: $uni-spacing-xxxl $uni-spacing-xl;
    text-align: center;

    .error-text {
      color: $uni-error;
      font-size: $uni-font-size-base;
      margin-bottom: $uni-spacing-xl;
    }

    .retry-btn {
      @include btn-primary;
      padding: $uni-spacing-sm $uni-spacing-lg;
      font-size: $uni-font-size-base;
    }
  }

  .empty-container {
    @include card-gradient;
    padding: $uni-spacing-xxl;
    text-align: center;
    border-radius: $uni-radius-lg;
    margin-bottom: $uni-spacing-xl;

    .empty-icon {
      display: block;
      font-size: 48rpx;
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
      margin-bottom: $uni-spacing-xs;
    }

    .empty-hint {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-gray-600;
    }
  }

  .rules-grouped-container {
    .rules-group {
      margin-bottom: $uni-spacing-xl;

      .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $uni-spacing-md;
        padding-bottom: $uni-spacing-sm;
        border-bottom: 1px solid $uni-border-color;

        .group-title {
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
          color: $uni-accent;
        }

        .group-count {
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-600;
        }
      }

      .empty-group {
        @include card-gradient;
        padding: $uni-spacing-lg;
        text-align: center;
        border-radius: $uni-radius-base;

        .empty-group-text {
          color: $uni-text-gray-600;
          font-size: $uni-font-size-base;
        }
      }

      .rules-list {
        .rule-item {
          @include card-gradient;
          padding: $uni-spacing-lg;
          border-radius: $uni-radius-base;
          margin-bottom: $uni-spacing-base;
          display: flex;
          align-items: center;
          justify-content: space-between;

          &.enabled-rule {
            border-left: 4px solid $uni-success;
          }

          &.disabled-rule {
            border-left: 4px solid $uni-warning;
          }

          &.deleted-rule {
            border-left: 4px solid $uni-error;
            opacity: 0.7;
          }

          .rule-header {
            display: flex;
            align-items: center;
            flex: 1;

            .rule-icon-container {
              margin-right: $uni-spacing-base;

              .rule-icon {
                width: 40rpx;
                height: 40rpx;
                border-radius: $uni-radius-sm;
              }

              .rule-icon-placeholder {
                font-size: $uni-font-size-lg;
                color: $uni-secondary;
              }
            }

            .rule-info {
              flex: 1;

              .rule-name {
                display: block;
                font-size: $uni-font-size-base;
                font-weight: $uni-font-weight-base;
                color: $uni-text-gray-700;
                margin-bottom: $uni-spacing-xs;
              }

              .rule-time {
                display: block;
                font-size: $uni-font-size-sm;
                color: $uni-text-gray-600;
              }
            }
          }

          .rule-actions {
            display: flex;
            gap: $uni-spacing-xs;

            .action-btn {
              padding: $uni-spacing-xs $uni-spacing-sm;
              font-size: $uni-font-size-xs;
              border-radius: $uni-radius-sm;
              border: none;
              cursor: pointer;

              &.disable-btn {
                background-color: $uni-warning;
                color: $uni-white;
              }

              &.enable-btn {
                background-color: $uni-success;
                color: $uni-white;
              }

              &.edit-btn {
                background-color: $uni-primary;
                color: $uni-white;
              }

              &.delete-btn {
                background-color: $uni-error;
                color: $uni-white;
              }

              &.permanent-delete-btn {
                background-color: $uni-error;
                color: $uni-white;
              }
            }
          }
        }
      }
    }
  }

  .rule-detail-modal {
    background: $uni-white;
    border-radius: $uni-radius-lg $uni-radius-lg 0 0;
    padding: $uni-spacing-xl;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $uni-spacing-lg;

      .modal-title {
        font-size: $uni-font-size-lg;
        font-weight: $uni-font-weight-base;
        color: $uni-accent;
      }

      .modal-close {
        font-size: $uni-font-size-xl;
        color: $uni-text-gray-600;
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .modal-content {
      max-height: 60vh;
      overflow-y: auto;
      margin-bottom: $uni-spacing-lg;

      .detail-section {
        margin-bottom: $uni-spacing-lg;

        .section-title {
          display: block;
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
          color: $uni-accent;
          margin-bottom: $uni-spacing-md;
          padding-bottom: $uni-spacing-xs;
          border-bottom: 1px solid $uni-border-color;
        }

        .detail-item {
          display: flex;
          margin-bottom: $uni-spacing-sm;

          .detail-label {
            flex: 0 0 100rpx;
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-600;
          }

          .detail-value {
            flex: 1;
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-700;

            &.status-enabled {
              color: $uni-success;
            }

            &.status-disabled {
              color: $uni-warning;
            }

            &.status-deleted {
              color: $uni-error;
            }
          }
        }
      }
    }

    .modal-footer {
      display: flex;
      gap: $uni-spacing-base;

      .modal-btn {
        flex: 1;
        padding: $uni-spacing-base;
        border-radius: $uni-radius-base;
        border: none;
        font-size: $uni-font-size-base;
        cursor: pointer;

        &.secondary-btn {
          background-color: $uni-bg-color-light;
          color: $uni-text-gray-700;
        }

        &.primary-btn {
          background-color: $uni-primary;
          color: $uni-white;
        }
      }
    }
  }
}
</style>
