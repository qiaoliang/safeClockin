<template>
  <view class="uni-dtp">
    <picker v-if="type==='time'" mode="time" :value="modelValue" @change="onChange">
      <view class="uni-dtp-input">{{ displayValue }}</view>
    </picker>
    <picker v-else mode="date" :value="modelValue" @change="onChange">
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

const displayValue = computed(() => {
  if (props.type === 'time') return props.modelValue || '08:00'
  return props.modelValue || formatDate(new Date())
})

const onChange = (e) => {
  const v = e.detail.value
  emit('update:modelValue', v)
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
</script>

<style scoped>
.uni-dtp{width:100%}
.uni-dtp-input{height:80rpx;display:flex;align-items:center;border:2rpx solid #E5E5E5;border-radius:16rpx;background:#fff;padding:0 24rpx;color:#333;width:100%}
</style>
