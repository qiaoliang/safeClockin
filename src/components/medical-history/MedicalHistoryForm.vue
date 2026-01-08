<template>
  <view class="medical-history-form">
    <uni-forms ref="form" :modelValue="formData" :rules="rules">
      <uni-forms-item label="疾病名称" required name="condition_name">
        <uni-data-picker
          v-model="formData.condition_name"
          :localdata="conditionOptions"
          placeholder="请选择或输入疾病名称"
          :clear="true"
        />
      </uni-forms-item>

      <uni-forms-item label="治疗方案" name="treatment_plan">
        <view class="treatment-plan">
          <uni-data-checkbox
            v-model="formData.treatment_plan.type"
            :localdata="treatmentTypes"
          />
          <uni-easyinput
            v-model="formData.treatment_plan.medication"
            placeholder="药品名称"
            v-if="formData.treatment_plan.type.includes('吃药')"
          />
          <uni-easyinput
            v-model="formData.treatment_plan.frequency"
            placeholder="频率（如：每天一次）"
          />
          <uni-easyinput
            v-model="formData.treatment_plan.notes"
            placeholder="备注"
            type="textarea"
          />
        </view>
      </uni-forms-item>

      <uni-forms-item label="可见性" name="visibility">
        <uni-data-checkbox
          v-model="formData.visibility"
          :localdata="visibilityOptions"
        />
      </uni-forms-item>
    </uni-forms>

    <button @click="handleSubmit">保存</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCommonConditions } from '@/api/user'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref(props.modelValue || {
  condition_name: '',
  treatment_plan: {
    type: [],
    medication: '',
    frequency: '',
    notes: ''
  },
  visibility: 1
})

const conditionOptions = ref([])
const treatmentTypes = [
  { text: '吃药', value: 'medication' },
  { text: '打针', value: 'injection' }
]

const visibilityOptions = [
  { text: '仅工作人员可见', value: 1 },
  { text: '工作人员和监护人可见', value: 2 }
]

const rules = {
  condition_name: {
    rules: [{ required: true, errorMessage: '请输入疾病名称' }]
  }
}

onMounted(async () => {
  try {
    const res = await getCommonConditions()
    if (res.code === 1) {
      conditionOptions.value = res.data.conditions.map(name => ({ text: name, value: name }))
    }
  } catch (error) {
    console.error('获取常见病史失败:', error)
  }
})

const handleSubmit = () => {
  emit('submit', formData.value)
}
</script>

<style lang="scss" scoped>
.medical-history-form {
  padding: 20rpx;
}
</style>
