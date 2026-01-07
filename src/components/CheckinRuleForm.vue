<template>
  <view class="checkin-rule-form">
    <!-- 状态栏 -->
    <view class="status-bar">
      <view class="status-bar-content">
        <text class="status-time">
          9:41
        </text>
        <view class="status-icons">
          <text class="icon-signal">
            📶
          </text>
          <text class="icon-wifi">
            📡
          </text>
          <text class="icon-battery">
            🔋
          </text>
        </view>
      </view>
    </view>

    <!-- 主容器 -->
    <view class="main-container">
      <!-- 顶部导航 -->
      <view class="form-header">
        <button
          class="back-btn"
          @click="handleBack"
        >
          <text class="back-icon">
            ‹
          </text>
        </button>
        <text class="form-title">
          {{ formTitle }}
        </text>
        <button
          class="submit-btn"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? "保存中..." : "保存" }}
        </button>
      </view>

      <!-- 表单内容 -->
      <scroll-view
        class="form-content"
        scroll-y
      >
        <!-- 基本信息 -->
        <view class="form-section">
          <text class="section-title">
            基本信息
          </text>

          <!-- 规则名称 -->
          <view class="form-item">
            <text class="item-label required">
              规则名称
            </text>
            <input
              v-model="formData.rule_name"
              class="item-input"
              placeholder="请输入规则名称"
              maxlength="50"
              :disabled="submitting"
            >
            <text
              v-if="errors.rule_name"
              class="error-text"
            >
              {{ errors.rule_name }}
            </text>
          </view>

          <!-- 图标URL -->
          <view class="form-item">
            <text class="item-label">
              图标URL
            </text>
            <input
              v-model="formData.icon_url"
              class="item-input"
              placeholder="请输入图标URL（可选）"
              :disabled="submitting"
            >
            <text class="item-hint">
              建议使用正方形图标，尺寸建议 100x100px
            </text>
          </view>
        </view>

        <!-- 打卡频率 -->
        <view class="form-section">
          <text class="section-title">
            打卡频率
          </text>

          <!-- 频率类型选择 -->
          <view class="form-item">
            <text class="item-label required">
              频率类型
            </text>
            <view class="radio-group">
              <label
                v-for="option in frequencyOptions"
                :key="option.value"
                class="radio-item"
                :class="{ 'radio-selected': formData.frequency_type === option.value }"
                @click="handleFrequencyChange(option.value)"
              >
                <text class="radio-icon">{{
                  formData.frequency_type === option.value ? "●" : "○"
                }}</text>
                <text class="radio-text">{{ option.label }}</text>
              </label>
            </view>
          </view>

          <!-- 每周特定日期（当频率类型为每周时显示） -->
          <view
            v-if="formData.frequency_type === 1"
            class="form-item"
          >
            <text class="item-label required">
              适用星期
            </text>
            <view class="weekday-group">
              <label
                v-for="(day, index) in weekDays"
                :key="index"
                class="weekday-item"
                :class="{ 'weekday-selected': isWeekDaySelected(index) }"
                @click="toggleWeekDay(index)"
              >
                <text class="weekday-text">{{ day }}</text>
              </label>
            </view>
          </view>

          <!-- 自定义日期范围（当频率类型为自定义日期时显示） -->
          <view
            v-if="formData.frequency_type === 3"
            class="form-item"
          >
            <text class="item-label required">
              适用日期范围
            </text>
            <view class="date-range-group">
              <view class="date-item">
                <text class="date-label">
                  开始日期
                </text>
                <picker
                  mode="date"
                  :value="formData.custom_start_date"
                  :disabled="submitting"
                  @change="handleStartDateChange"
                >
                  <view class="date-picker">
                    <text class="date-value">
                      {{
                        formData.custom_start_date || "请选择开始日期"
                      }}
                    </text>
                    <text class="date-icon">
                      📅
                    </text>
                  </view>
                </picker>
              </view>
              <view class="date-item">
                <text class="date-label">
                  结束日期
                </text>
                <picker
                  mode="date"
                  :value="formData.custom_end_date"
                  :disabled="submitting"
                  @change="handleEndDateChange"
                >
                  <view class="date-picker">
                    <text class="date-value">
                      {{
                        formData.custom_end_date || "请选择结束日期"
                      }}
                    </text>
                    <text class="date-icon">
                      📅
                    </text>
                  </view>
                </picker>
              </view>
            </view>
            <text
              v-if="errors.date_range"
              class="error-text"
            >
              {{
                errors.date_range
              }}
            </text>
          </view>
        </view>

        <!-- 打卡时间 -->
        <view class="form-section">
          <text class="section-title">
            打卡时间
          </text>

          <!-- 时间段类型选择 -->
          <view class="form-item">
            <text class="item-label required">
              时间段
            </text>
            <view class="radio-group">
              <label
                v-for="option in timeSlotOptions"
                :key="option.value"
                class="radio-item"
                :class="{ 'radio-selected': formData.time_slot_type === option.value }"
                @click="handleTimeSlotChange(option.value)"
              >
                <text class="radio-icon">{{
                  formData.time_slot_type === option.value ? "●" : "○"
                }}</text>
                <text class="radio-text">{{ option.label }}</text>
              </label>
            </view>
          </view>

          <!-- 自定义时间（当时间段类型为自定义时间时显示） -->
          <view
            v-if="formData.time_slot_type === 4"
            class="form-item"
          >
            <text class="item-label required">
              自定义时间
            </text>
            <picker
              mode="time"
              :value="formData.custom_time"
              :disabled="submitting"
              @change="handleCustomTimeChange"
            >
              <view class="time-picker">
                <text class="time-value">
                  {{ formData.custom_time || "请选择时间" }}
                </text>
                <text class="time-icon">
                  ⏰
                </text>
              </view>
            </picker>
          </view>
        </view>

        <!-- 规则状态（仅社区规则显示） -->
        <view
          v-if="showEnableButton"
          class="form-section"
        >
          <text class="section-title">
            规则状态
          </text>

          <!-- 是否启用 -->
          <view class="form-item">
            <text class="item-label">
              启用规则
            </text>
            <view class="switch-group">
              <text class="switch-label">
                创建后立即启用
              </text>
              <switch
                :checked="formData.is_enabled"
                :disabled="submitting || isEditMode"
                color="#f48224"
                @change="handleEnableChange"
              />
            </view>
            <text class="item-hint">
              启用后规则将立即对所有社区成员生效。编辑模式下请使用启用/停用按钮。
            </text>
          </view>
        </view>

        <!-- 表单验证错误 -->
        <view
          v-if="Object.keys(errors).length > 0"
          class="error-section"
        >
          <text class="error-title">
            请修正以下错误：
          </text>
          <view
            v-for="(error, field) in errors"
            :key="field"
            class="error-item"
          >
            <text class="error-field">
              {{ getFieldLabel(field) }}：
            </text>
            <text class="error-message">
              {{ error }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { ref, computed, watch } from "vue";

// Props
const props = defineProps({
  // 规则类型：'community' | 'personal'
  ruleType: {
    type: String,
    required: true,
    validator: (value) => ["community", "personal"].includes(value),
  },
  // 表单标题
  formTitle: {
    type: String,
    required: true,
  },
  // 是否显示启用按钮
  showEnableButton: {
    type: Boolean,
    default: false,
  },
  // 规则ID（编辑模式）
  ruleId: {
    type: String,
    default: "",
  },
  // 社区ID（社区规则需要）
  communityId: {
    type: String,
    default: "",
  },
  // 初始表单数据（用于编辑模式）
  initialData: {
    type: Object,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(["submit", "back"]);

// 是否为编辑模式
const isEditMode = computed(() => !!props.ruleId);

// 表单数据
const formData = ref({
  rule_name: "",
  icon_url: "",
  frequency_type: 0, // 0-每天, 1-每周, 2-工作日, 3-自定义日期
  time_slot_type: 4, // 1-上午, 2-下午, 3-晚上, 4-自定义时间
  custom_time: "",
  custom_start_date: "",
  custom_end_date: "",
  week_days: 127, // 默认全选（二进制1111111）
  is_enabled: false,
});

// 表单错误
const errors = ref({});

// 提交状态
const submitting = ref(false);

// 频率选项
const frequencyOptions = [
  { value: 0, label: "每天" },
  { value: 1, label: "每周" },
  { value: 2, label: "工作日（周一至周五）" },
  { value: 3, label: "自定义日期范围" },
];

// 时间段选项
const timeSlotOptions = [
  { value: 1, label: "上午 (09:00)" },
  { value: 2, label: "下午 (14:00)" },
  { value: 3, label: "晚上 (20:00)" },
  { value: 4, label: "自定义时间" },
];

// 星期数组
const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// 字段标签映射
const fieldLabels = {
  rule_name: "规则名称",
  frequency_type: "频率类型",
  time_slot_type: "时间段",
  date_range: "日期范围",
};

// 监听初始数据变化
watch(
  () => props.initialData,
  (newData) => {
    if (Object.keys(newData).length > 0) {
      formData.value = {
        rule_name: newData.rule_name || "",
        icon_url: newData.icon_url || "",
        frequency_type: newData.frequency_type || 0,
        time_slot_type: newData.time_slot_type || 4,
        custom_time: newData.custom_time || "",
        custom_start_date: newData.custom_start_date || "",
        custom_end_date: newData.custom_end_date || "",
        week_days: newData.week_days || 127,
        is_enabled: newData.is_enabled || false,
      };
    }
  },
  { immediate: true, deep: true }
);

// 获取字段标签
const getFieldLabel = (field) => {
  return fieldLabels[field] || field;
};

// 检查星期是否被选中
const isWeekDaySelected = (dayIndex) => {
  return (formData.value.week_days & (1 << dayIndex)) !== 0;
};

// 切换星期选择
const toggleWeekDay = (dayIndex) => {
  const mask = 1 << dayIndex;
  if (isWeekDaySelected(dayIndex)) {
    // 取消选择
    formData.value.week_days &= ~mask;
  } else {
    // 选择
    formData.value.week_days |= mask;
  }
};

// 处理频率类型变化
const handleFrequencyChange = (value) => {
  formData.value.frequency_type = value;

  // 重置相关字段
  if (value !== 1) {
    formData.value.week_days = 127; // 重置为全选
  }
  if (value !== 3) {
    formData.value.custom_start_date = "";
    formData.value.custom_end_date = "";
  }
};

// 处理时间段类型变化
const handleTimeSlotChange = (value) => {
  formData.value.time_slot_type = value;

  // 重置自定义时间
  if (value !== 4) {
    formData.value.custom_time = "";
  }
};

// 处理开始日期变化
const handleStartDateChange = (e) => {
  formData.value.custom_start_date = e.detail.value;
};

// 处理结束日期变化
const handleEndDateChange = (e) => {
  formData.value.custom_end_date = e.detail.value;
};

// 处理自定义时间变化
const handleCustomTimeChange = (e) => {
  formData.value.custom_time = e.detail.value;
};

// 处理启用状态变化
const handleEnableChange = (e) => {
  formData.value.is_enabled = e.detail.value;
};

// 表单验证
const validateForm = () => {
  errors.value = {};

  // 规则名称验证
  if (!formData.value.rule_name.trim()) {
    errors.value.rule_name = "规则名称不能为空";
  } else if (formData.value.rule_name.trim().length > 50) {
    errors.value.rule_name = "规则名称不能超过50个字符";
  }

  // 频率类型验证
  if (formData.value.frequency_type === 1 && formData.value.week_days === 0) {
    errors.value.frequency_type = "请至少选择一天";
  }

  // 自定义日期范围验证
  if (formData.value.frequency_type === 3) {
    if (!formData.value.custom_start_date || !formData.value.custom_end_date) {
      errors.value.date_range = "请选择完整的日期范围";
    } else if (formData.value.custom_end_date < formData.value.custom_start_date) {
      errors.value.date_range = "结束日期不能早于开始日期";
    }
  }

  // 自定义时间验证
  if (formData.value.time_slot_type === 4 && !formData.value.custom_time) {
    errors.value.time_slot_type = "请选择自定义时间";
  }

  return Object.keys(errors.value).length === 0;
};

// 处理返回
const handleBack = () => {
  emit("back");
};

// 处理提交
const handleSubmit = async () => {
  if (!validateForm()) {
    uni.showToast({ title: "请检查表单错误", icon: "error" });
    return;
  }

  // 如果是创建模式且选择了立即启用，弹出确认对话框
  if (props.ruleType === "community" &&
      props.showEnableButton &&
      !isEditMode.value &&
      formData.value.is_enabled) {

    uni.showModal({
      title: '确认启用',
      content: '此操作将要求所有社区成员执行此规则，确认启用？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，继续提交
          doSubmit();
        }
        // 用户点击取消，什么都不做，返回表单继续编辑
      }
    });
  } else {
    // 编辑模式或未选择启用，直接提交
    doSubmit();
  }
};

// 实际执行提交的方法
const doSubmit = async () => {
  submitting.value = true;

  try {
    // 准备提交数据
    const submitData = {
      rule_name: formData.value.rule_name.trim(),
      icon_url: formData.value.icon_url.trim() || "",
      frequency_type: formData.value.frequency_type,
      time_slot_type: formData.value.time_slot_type,
      week_days: formData.value.week_days,
      is_enabled: formData.value.is_enabled,
    };

    // 添加可选字段
    if (formData.value.custom_time) {
      submitData.custom_time = formData.value.custom_time;
    }
    if (formData.value.custom_start_date) {
      submitData.custom_start_date = formData.value.custom_start_date;
    }
    if (formData.value.custom_end_date) {
      submitData.custom_end_date = formData.value.custom_end_date;
    }

    // 添加 community_id（仅社区规则）
    if (props.ruleType === "community" && props.communityId) {
      submitData.community_id = props.communityId;
    }

    // 触发提交事件
    emit("submit", submitData);
  } catch (err) {
    console.error("提交规则失败:", err);
    uni.showToast({ title: "网络错误，请稍后重试", icon: "error" });
    submitting.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  setSubmitting: (value) => {
    submitting.value = value;
  },
});
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.checkin-rule-form {
  min-height: 100vh;
  @include bg-gradient-primary;
}

.status-bar {
  @include bg-gradient-statusbar;
  padding: $uni-spacing-xs $uni-spacing-base;

  .status-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .status-time {
      color: $uni-white;
      font-size: $uni-font-size-sm;
      font-weight: $uni-font-weight-base;
    }

    .status-icons {
      display: flex;
      gap: $uni-spacing-sm;

      .icon-signal,
      .icon-wifi,
      .icon-battery {
        color: $uni-white;
        font-size: $uni-font-size-sm;
      }
    }
  }
}

.main-container {
  padding-bottom: $uni-spacing-xxl;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-base $uni-spacing-lg;
  background: $uni-white;
  border-bottom: 1px solid $uni-border-color;

  .back-btn {
    background: none;
    border: none;
    padding: $uni-spacing-xs;

    .back-icon {
      font-size: 24px;
      color: $uni-accent;
    }
  }

  .form-title {
    font-size: $uni-font-size-lg;
    font-weight: $uni-font-weight-base;
    color: $uni-accent;
  }

  .submit-btn {
    @include btn-primary;
    padding: $uni-spacing-sm $uni-spacing-base;
    font-size: $uni-font-size-base;

    &:disabled {
      opacity: 0.6;
      background: $uni-text-gray-600;
    }
  }
}

.form-content {
  height: calc(100vh - 200rpx);
  padding: $uni-spacing-base;
}

.form-section {
  @include card-gradient;
  padding: $uni-spacing-lg;
  border-radius: $uni-radius-lg;
  margin-bottom: $uni-spacing-xl;

  .section-title {
    display: block;
    font-size: $uni-font-size-lg;
    font-weight: $uni-font-weight-base;
    color: $uni-accent;
    margin-bottom: $uni-spacing-lg;
    padding-bottom: $uni-spacing-sm;
    border-bottom: 1px solid $uni-border-color-light;
  }
}

.form-item {
  margin-bottom: $uni-spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }

  .item-label {
    display: block;
    font-size: $uni-font-size-base;
    color: $uni-text-gray-700;
    margin-bottom: $uni-spacing-sm;

    &.required::after {
      content: " *";
      color: $uni-error;
    }
  }

  .item-input {
    width: 100%;
    padding: $uni-spacing-base;
    border: 1px solid $uni-border-color;
    border-radius: $uni-radius-base;
    font-size: $uni-font-size-base;
    color: $uni-text-gray-800;
    background: $uni-white;

    &:disabled {
      background: $uni-bg-color-light;
      color: $uni-text-gray-600;
    }

    &::placeholder {
      color: $uni-text-gray-600;
    }
  }

  .item-hint {
    display: block;
    font-size: $uni-font-size-sm;
    color: $uni-text-gray-600;
    margin-top: $uni-spacing-xs;
  }
}

.radio-group {
  .radio-item {
    display: flex;
    align-items: center;
    padding: $uni-spacing-base;
    border: 1px solid $uni-border-color;
    border-radius: $uni-radius-base;
    margin-bottom: $uni-spacing-sm;
    background: $uni-white;
    transition: all 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &.radio-selected {
      border-color: $uni-primary;
      background: rgba($uni-primary, 0.1);
    }

    .radio-icon {
      margin-right: $uni-spacing-base;
      font-size: $uni-font-size-base;
      color: $uni-text-gray-600;
    }

    .radio-text {
      flex: 1;
      font-size: $uni-font-size-base;
      color: $uni-text-gray-700;
    }

    &.radio-selected .radio-icon {
      color: $uni-primary;
    }
  }
}

.weekday-group {
  display: flex;
  flex-wrap: wrap;
  gap: $uni-spacing-sm;

  .weekday-item {
    flex: 1;
    min-width: 80rpx;
    padding: $uni-spacing-sm;
    border: 1px solid $uni-border-color;
    border-radius: $uni-radius-base;
    text-align: center;
    background: $uni-white;
    transition: all 0.2s ease;

    &.weekday-selected {
      border-color: $uni-primary;
      background: $uni-primary;
      color: $uni-white;
    }

    .weekday-text {
      font-size: $uni-font-size-sm;
    }
  }
}

.date-range-group {
  display: flex;
  gap: $uni-spacing-base;

  .date-item {
    flex: 1;

    .date-label {
      display: block;
      font-size: $uni-font-size-sm;
      color: $uni-text-gray-600;
      margin-bottom: $uni-spacing-xs;
    }

    .date-picker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $uni-spacing-base;
      border: 1px solid $uni-border-color;
      border-radius: $uni-radius-base;
      background: $uni-white;

      .date-value {
        font-size: $uni-font-size-base;
        color: $uni-text-gray-700;

        &:empty::before {
          content: "请选择日期";
          color: $uni-text-gray-600;
        }
      }

      .date-icon {
        font-size: $uni-font-size-base;
        color: $uni-text-gray-600;
      }
    }
  }
}

.time-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uni-spacing-base;
  border: 1px solid $uni-border-color;
  border-radius: $uni-radius-base;
  background: $uni-white;

  .time-value {
    font-size: $uni-font-size-base;
    color: $uni-text-gray-700;

    &:empty::before {
      content: "请选择时间";
      color: $uni-text-gray-600;
    }
  }

  .time-icon {
    font-size: $uni-font-size-base;
    color: $uni-text-gray-600;
  }
}

.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .switch-label {
    font-size: $uni-font-size-base;
    color: $uni-text-gray-700;
  }
}

.error-section {
  @include card-gradient;
  padding: $uni-spacing-lg;
  border-radius: $uni-radius-lg;
  border-left: 4px solid $uni-error;
  background: rgba($uni-error, 0.05);
  margin-bottom: $uni-spacing-xl;

  .error-title {
    display: block;
    font-size: $uni-font-size-base;
    font-weight: $uni-font-weight-base;
    color: $uni-error;
    margin-bottom: $uni-spacing-base;
  }

  .error-item {
    display: flex;
    margin-bottom: $uni-spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .error-field {
      font-size: $uni-font-size-sm;
      color: $uni-text-gray-700;
      min-width: 80rpx;
    }

    .error-message {
      flex: 1;
      font-size: $uni-font-size-sm;
      color: $uni-error;
    }
  }
}

.error-text {
  display: block;
  font-size: $uni-font-size-sm;
  color: $uni-error;
  margin-top: $uni-spacing-xs;
}

.safe-bottom {
  @include safe-area-bottom;
}
</style>