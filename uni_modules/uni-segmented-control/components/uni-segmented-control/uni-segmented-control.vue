<template>
  <view class="uni-seg">
    <view class="uni-seg-row">
      <view
        v-for="(v, idx) in values"
        :key="idx"
        class="uni-seg-item"
        :style="itemStyle(idx)"
        @tap="onClick(idx)"
      >
        <text class="uni-seg-text" :style="textStyle(idx)">{{ v }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 0 },
  values: { type: Array, default: () => [] },
  styleType: { type: String, default: 'text' },
  activeColor: { type: String, default: '#F48224' }
})
const emit = defineEmits(['clickItem'])

const onClick = (idx) => {
  emit('clickItem', { currentIndex: idx })
}

const itemStyle = (idx) => {
  const active = idx === props.current
  return `border:2rpx solid ${active ? props.activeColor : '#E5E5E5'};`+
         `background:${active ? '#FEF3C7' : '#FFFFFF'};`+
         `box-shadow:${active ? '0 4rpx 12rpx rgba(244,130,36,0.25)' : 'none'};`
}

const textStyle = (idx) => {
  const active = idx === props.current
  return `color:${active ? props.activeColor : '#6A6A6A'};`
}
</script>

<style scoped>
.uni-seg{width:100%}
.uni-seg-row{display:flex;gap:12rpx;flex-wrap:wrap;justify-content:flex-start}
.uni-seg-item{border-radius:9999rpx;padding:12rpx 20rpx}
.uni-seg-text{font-size:26rpx}
</style>
