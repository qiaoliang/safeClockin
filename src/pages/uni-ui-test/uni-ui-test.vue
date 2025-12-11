<template>
  <view class="test-container">
    <view class="test-section">
      <text class="section-title">uni-ui 组件测试页面</text>
      
      <!-- 最简单的 uni-ui 组件展示 -->
      <view class="simple-uniui">
        <text class="section-subtitle">最简单的 uni-ui 组件：</text>
        <uni-badge text="测试" type="primary" />
      </view>
      
      <!-- 简单测试 - 先不使用uni-ui组件 -->
      <view class="simple-test">
        <text class="section-subtitle">基础组件测试：</text>
        <view class="test-card">
          <text class="card-title">测试卡片</text>
          <text class="card-content">这是一个简单的测试卡片</text>
          <button class="test-button" @click="handleClick">点击测试</button>
        </view>
        
        <view class="badge-section">
          <text class="section-subtitle">徽章样式测试：</text>
          <view class="badge primary">1</view>
          <view class="badge success">2</view>
          <view class="badge warning">3</view>
          <view class="badge error">99</view>
        </view>
        
        <view class="list-section">
          <text class="section-subtitle">列表样式测试：</text>
          <view class="list-item">
            <text class="list-title">列表项1</text>
            <text class="list-note">这是第一个列表项</text>
          </view>
          <view class="list-item">
            <text class="list-title">列表项2</text>
            <text class="list-note">这是第二个列表项</text>
            <view class="badge">新</view>
          </view>
        </view>
      </view>
      
      <!-- 逐步添加uni-ui组件测试 -->
      <view class="uniui-test">
        <text class="section-subtitle">uni-ui 组件测试：</text>
        
        <!-- Badge 组件测试 -->
        <view class="component-group">
          <text class="component-title">Badge 徽章组件：</text>
          <view class="badge-examples">
            <uni-badge text="1" type="primary" size="normal" />
            <uni-badge text="99" type="error" size="small" />
            <uni-badge text="新" type="success" />
            <uni-badge text="Hot" type="warning" />
          </view>
        </view>
        
        <!-- Card 组件测试 -->
        <view class="component-group">
          <text class="component-title">Card 卡片组件：</text>
          <uni-card title="卡片标题" extra="额外信息" thumbnail="https://picsum.photos/100/100">
            <text>这是卡片的内容区域，可以放置任意内容。</text>
            <template v-slot:actions>
              <view class="card-actions">
                <button size="mini" type="primary">操作1</button>
                <button size="mini" type="default">操作2</button>
              </view>
            </template>
          </uni-card>
        </view>
        
        <!-- List 组件测试 -->
        <view class="component-group">
          <text class="component-title">List 列表组件：</text>
          <uni-list>
            <uni-list-item title="列表项1" note="这是第一个列表项的描述" showArrow></uni-list-item>
            <uni-list-item title="列表项2" note="这是第二个列表项的描述" showBadge badgeText="新" showArrow></uni-list-item>
            <uni-list-item title="列表项3" note="这是第三个列表项的描述" showSwitch @switchChange="switchChange"></uni-list-item>
          </uni-list>
        </view>
        
        <!-- Button Group 测试 -->
        <view class="component-group">
          <text class="component-title">Button 按钮组件：</text>
          <view class="button-group">
            <button type="primary" size="mini">主要按钮</button>
            <button type="default" size="mini">默认按钮</button>
            <button type="warn" size="mini">警告按钮</button>
          </view>
        </view>
        
        <!-- Section 组件测试 -->
        <view class="component-group">
          <text class="component-title">Section 分组组件：</text>
          <uni-section title="分组标题" type="line">
            <text>这是分组内容，可以包含任意组件。</text>
          </uni-section>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UniUITest',
  setup() {
    const showPopup = ref(false)
    
    const handleClick = () => {
      uni.showToast({
        title: '点击成功',
        icon: 'success'
      })
    }
    
    const switchChange = (e: any) => {
      console.log('开关状态变化:', e)
    }
    
    const change = (e: any) => {
      if (!e.show) {
        showPopup.value = false
      }
    }
    
    return {
      showPopup,
      handleClick,
      switchChange,
      change
    }
  }
})
</script>

<style lang="scss" scoped>
.test-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.test-section {
  background-color: white;
  padding: 20rpx;
  border-radius: 10rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.section-subtitle {
  font-size: 28rpx;
  color: #666;
  margin: 20rpx 0 10rpx;
  display: block;
}

.simple-test {
  margin-bottom: 40rpx;
}

.simple-uniui {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background-color: #e8f4fd;
  border-radius: 12rpx;
  border: 2rpx solid #007aff;
}

.test-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin: 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .card-content {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
    display: block;
  }
}

.test-button {
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

.badge-section {
  margin: 20rpx 0;
  display: flex;
  gap: 20rpx;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 12rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
  
  &.primary {
    background: #007aff;
  }
  
  &.success {
    background: #4cd964;
  }
  
  &.warning {
    background: #f0ad4e;
  }
  
  &.error {
    background: #dd524d;
  }
}

.list-section {
  margin: 20rpx 0;
}

.list-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .list-title {
    font-size: 30rpx;
    color: #333;
    font-weight: 500;
  }
  
  .list-note {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
  }
}

.uniui-test {
  margin-top: 40rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.component-group {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.component-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.badge-examples {
  display: flex;
  gap: 20rpx;
  align-items: center;
  flex-wrap: wrap;
}

.card-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.button-group {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}
</style>