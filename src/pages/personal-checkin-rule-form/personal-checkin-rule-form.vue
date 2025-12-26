<template>
  <CheckinRuleForm
    ref="ruleFormRef"
    :rule-type="'personal'"
    :form-title="isEditMode ? '编辑个人规则' : '创建个人规则'"
    :show-enable-button="false"
    :rule-id="ruleId"
    :community-id="''"
    :initial-data="initialData"
    @submit="handleSubmit"
    @back="handleBack"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CheckinRuleForm from "@/components/CheckinRuleForm.vue";
import {
  getPersonalRuleDetail,
  createPersonalRule,
  updatePersonalRule,
} from "@/api/personal-checkin";

// 页面参数
const ruleId = ref("");
const isEditMode = computed(() => !!ruleId.value);

// 初始表单数据
const initialData = ref({});

// 表单组件引用
const ruleFormRef = ref(null);

// 页面加载
onLoad((options) => {
  ruleId.value = options.ruleId;

  if (ruleId.value) {
    loadRuleDetail();
  }
});

// 加载规则详情
const loadRuleDetail = async () => {
  try {
    const response = await getPersonalRuleDetail(ruleId.value);
    if (response.code === 1) {
      const rule = response.data.rule;
      initialData.value = {
        rule_name: rule.rule_name || "",
        icon_url: rule.icon_url || "",
        frequency_type: rule.frequency_type || 0,
        time_slot_type: rule.time_slot_type || 4,
        custom_time: rule.custom_time || "",
        custom_start_date: rule.custom_start_date || "",
        custom_end_date: rule.custom_end_date || "",
        week_days: rule.week_days || 127,
        is_enabled: rule.is_enabled || false,
      };
    } else {
      uni.showToast({ title: response.msg || "加载规则详情失败", icon: "error" });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  } catch (err) {
    console.error("加载规则详情失败:", err);
    uni.showToast({ title: "网络错误，请稍后重试", icon: "error" });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
};

// 处理返回
const handleBack = () => {
  uni.navigateBack();
};

// 处理提交
const handleSubmit = async (submitData) => {
  try {
    let response;

    if (isEditMode.value) {
      // 编辑模式
      response = await updatePersonalRule(ruleId.value, submitData);
    } else {
      // 创建模式
      response = await createPersonalRule(submitData);
    }

    if (response.code === 1) {
      uni.showToast({
        title: isEditMode.value ? "规则更新成功" : "规则创建成功",
        icon: "success",
      });

      // 触发规则列表刷新事件
      uni.$emit("personal-rules-refresh");

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({
        title: response.msg || (isEditMode.value ? "更新失败" : "创建失败"),
        icon: "error",
      });
      // 重置提交状态
      if (ruleFormRef.value) {
        ruleFormRef.value.setSubmitting(false);
      }
    }
  } catch (err) {
    console.error("提交规则失败:", err);
    uni.showToast({ title: "网络错误，请稍后重试", icon: "error" });
    // 重置提交状态
    if (ruleFormRef.value) {
      ruleFormRef.value.setSubmitting(false);
    }
  }
};
</script>

<style lang="scss" scoped>
// 样式由 CheckinRuleForm 组件提供
</style>