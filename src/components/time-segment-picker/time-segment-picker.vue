<template>
  <view class="time-picker">
    <text class="section-label">
      时间段
    </text>
    <radio-group
      class="radio-row"
      @change="onSegmentChange"
    >
      <label
        v-for="opt in options"
        :key="opt.value"
        class="radio-item"
      >
        <radio
          :value="opt.value"
          :checked="localSegment===opt.value"
        />
        <text :class="['radio-text', localSegment===opt.value ? 'active' : '']">{{ opt.label }}</text>
      </label>
    </radio-group>

    <view
      v-if="localSegment==='custom'"
      class="custom-row"
    >
      <text class="custom-label">
        自定义时间
      </text>
      <picker
        mode="time"
        :value="localTime"
        @change="onTimeChange"
      >
        <view class="time-input">
          {{ localTime }}
        </view>
      </picker>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  segment: { type: String, default: 'custom' },
  time: { type: String, default: '08:00' }
})
const emit = defineEmits(['change', 'update:segment', 'update:time'])

const options = [
  { label: '上午', value: 'morning' },
  { label: '下午', value: 'afternoon' },
  { label: '晚上', value: 'evening' },
  { label: '自定义时间', value: 'custom' }
]

const localSegment = ref(props.segment)
const localTime = ref(props.time)

watch(() => props.segment, v => localSegment.value = v)
watch(() => props.time, v => localTime.value = v)

const onSegmentChange = (e) => {
  localSegment.value = e.detail.value
  emit('update:segment', localSegment.value)
  emit('change', { segment: localSegment.value, time: localTime.value })
}

const onTimeChange = (e) => {
  localTime.value = e.detail.value
  emit('update:time', localTime.value)
  emit('change', { segment: localSegment.value, time: localTime.value })
}
</script>

<style scoped>
.time-picker{background:#F7DCCB;padding:24rpx;border-radius:24rpx}
.section-label{display:block;color:#624731;margin-bottom:12rpx}
.radio-row{display:flex;gap:16rpx;flex-wrap:wrap;margin-bottom:12rpx}
.radio-item{display:flex;align-items:center;gap:8rpx;background:#fff;border:2rpx solid #E5E5E5;border-radius:9999rpx;padding:8rpx 16rpx}
.radio-text{color:#6A6A6A;font-size:26rpx}
.radio-text.active{color:#E49A2A}
.custom-row{margin-top:8rpx}
.custom-label{display:block;color:#624731;margin-bottom:8rpx}
.time-input{height:80rpx;display:flex;align-items:center;border:2rpx solid #E5E5E5;border-radius:16rpx;background:#fff;padding:0 24rpx;color:#333}
</style>
