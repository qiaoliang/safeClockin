<template>
  <view class="uni-dtp">
    <picker mode="time" :value="modelValue" @change="onChange">
      <view class="uni-dtp-input">{{ displayValue }}</view>
    </picker>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'time' },
  returnType: { type: String, default: 'string' },
  return: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const displayValue = computed(() => props.modelValue || '08:00')

const onChange = (e) => {
  const v = e.detail.value
  emit('update:modelValue', v)
}
</script>

<style scoped>
.uni-dtp-input{height:80rpx;display:flex;align-items:center;border:2rpx solid #E5E5E5;border-radius:16rpx;background:#fff;padding:0 24rpx;color:#333}
</style>
