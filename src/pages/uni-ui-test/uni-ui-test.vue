<template>
  <uni-section
    class="test-container"
    title="uni-ui 组件测试页面"
    type="line"
  >
    <!-- 最简单的 uni-ui 组件展示 -->
    <uni-card
      title="快速开始"
      extra="基础组件"
      thumbnail="https://picsum.photos/100/100?random=1"
    >
      <text>这是最简单的 uni-badge 组件展示：</text>
      <view class="simple-demo">
        <uni-badge
          text="测试"
          type="primary"
        />
      </view>
    </uni-card>
    <uni-card>
      <view class="page">
        <text class="example-info">
          可以同时选择日期和时间的选择器
        </text>
        <uni-section
          :title="'日期用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            type="date"
            :value="single"
            start="2021-3-20"
            end="2021-6-20"
            @change="change"
          />
        </view>
        <uni-section
          :title="'时间戳用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            return-type="timestamp"
            start="2021-3-20"
            end="2021-5-20"
            @change="changeLog($event)"
          />
        </view>
        <uni-section
          :title="'日期时间用法：' + datetimesingle"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            v-model="datetimesingle"
            type="datetime"
            @change="changeLog"
          />
        </view>
        <uni-section
          :title="'v-model用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker v-model="single" />
        </view>
        <uni-section
          :title="'插槽用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker v-model="single">
            我是一个插槽，点击我
          </uni-datetime-picker>
        </view>
        <uni-section
          :title="'无边框用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            v-model="single"
            :border="false"
          />
        </view>
        <uni-section
          :title="'disabled用法：' + single"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            v-model="single"
            disabled
          />
        </view>
        <uni-section
          :title="'日期范围用法：' + '[' + range + ']'"
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            v-model="range"
            type="daterange"
            start="2021-3-20"
            end="2021-5-20"
            range-separator="至"
          />
        </view>
        <uni-section
          :title="'日期时间范围用法：' + '[' + datetimerange + ']' "
          type="line"
        />
        <view class="example-body">
          <uni-datetime-picker
            v-model="datetimerange"
            type="datetimerange"
            start="2021-3-20 12:00:00"
            end="2021-6-20 20:00:00"
            range-separator="至"
          />
        </view>
      </view>
    </uni-card>


    <!-- 徽章组件展示 -->
    <uni-card
      title="Badge 徽章组件"
      extra="多种样式"
      thumbnail="https://picsum.photos/100/100?random=2"
    >
      <uni-row :gutter="20">
        <uni-col :span="6">
          <uni-badge
            text="1"
            type="primary"
            size="normal"
          />
        </uni-col>
        <uni-col :span="6">
          <uni-badge
            text="99"
            type="error"
            size="small"
          />
        </uni-col>
        <uni-col :span="6">
          <uni-badge
            text="新"
            type="success"
          />
        </uni-col>
        <uni-col :span="6">
          <uni-badge
            text="Hot"
            type="warning"
          />
        </uni-col>
      </uni-row>
    </uni-card>
    
    <!-- 卡片组件展示 -->
    <uni-card
      title="Card 卡片组件"
      extra="交互示例"
      thumbnail="https://picsum.photos/100/100?random=3"
    >
      <text>这是卡片的内容区域，可以放置任意内容。</text>
      <template #actions>
        <uni-row :gutter="20">
          <uni-col :span="6">
            <button
              size="mini"
              type="primary"
              @click="handleClick"
            >
              点击测试
            </button>
          </uni-col>
          <uni-col :span="6">
            <button
              size="mini"
              type="default"
            >
              操作2
            </button>
          </uni-col>
        </uni-row>
      </template>
    </uni-card>
    
    <!-- 列表组件展示 -->
    <uni-card
      title="List 列表组件"
      extra="数据展示"
      thumbnail="https://picsum.photos/100/100?random=4"
    >
      <uni-list>
        <uni-list-item
          title="列表项1"
          note="这是第一个列表项的描述"
          show-arrow
        />
        <uni-list-item
          title="列表项2"
          note="这是第二个列表项的描述"
          show-badge
          badge-text="新"
          show-arrow
        />
        <uni-list-item
          title="列表项3"
          note="这是第三个列表项的描述"
          show-switch
          @switch-change="switchChange"
        />
      </uni-list>
    </uni-card>
    
    <!-- 按钮组件展示 -->
    <uni-card
      title="Button 按钮组件"
      extra="操作按钮"
      thumbnail="https://picsum.photos/100/100?random=5"
    >
      <uni-row :gutter="20">
        <uni-col :span="8">
          <button
            type="primary"
            size="mini"
          >
            主要按钮
          </button>
        </uni-col>
        <uni-col :span="8">
          <button
            type="default"
            size="mini"
          >
            默认按钮
          </button>
        </uni-col>
        <uni-col :span="8">
          <button
            type="warn"
            size="mini"
          >
            警告按钮
          </button>
        </uni-col>
      </uni-row>
    </uni-card>
    
    <!-- 分组组件展示 -->
    <uni-card
      title="Section 分组组件"
      extra="内容分组"
      thumbnail="https://picsum.photos/100/100?random=6"
    >
      <uni-section
        title="子分组标题"
        type="line"
      >
        <text>这是分组内容，可以包含任意组件。</text>
        <view class="section-content">
          <uni-tag
            text="标签1"
            type="primary"
          />
          <uni-tag
            text="标签2"
            type="success"
          />
          <uni-tag
            text="标签3"
            type="warning"
          />
        </view>
      </uni-section>
    </uni-card>
    
    <!-- 更多组件展示 -->
    <uni-card
      title="更多 uni-ui 组件"
      extra="扩展功能"
      thumbnail="https://picsum.photos/100/100?random=7"
    >
      <uni-row :gutter="20">
        <uni-col :span="12">
          <uni-section
            title="评分组件"
            type="dot"
          >
            <uni-rate v-model="rate" />
          </uni-section>
        </uni-col>
        <uni-col :span="12">
          <uni-section
            title="数字输入框"
            type="dot"
          >
            <uni-number-box
              v-model="number"
              :min="1"
              :max="10"
            />
          </uni-section>
        </uni-col>
      </uni-row>
      
      <uni-section
        title="步骤条"
        type="dot"
      >
        <uni-steps
          :options="steps"
          :active="activeStep"
        />
      </uni-section>
      
      <uni-section
        title="弹出层"
        type="dot"
      >
        <button @click="showPopup = true">
          显示弹出层
        </button>
        <uni-popup
          ref="popup"
          :show="showPopup"
          type="center"
          @change="change"
        >
          <view class="popup-content">
            <text>这是一个弹出层内容</text>
            <button @click="showPopup = false">
              关闭
            </button>
          </view>
        </uni-popup>
      </uni-section>
    </uni-card>
  </uni-section>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UniUITest',
  setup() {
    const showPopup = ref(false)
    const rate = ref(3)
    const number = ref(1)
    const activeStep = ref(1)
    
    const steps = ref([
      { title: '步骤一' },
      { title: '步骤二' },
      { title: '步骤三' }
    ])
    
    const handleClick = () => {
      uni.showToast({
        title: '点击成功',
        icon: 'success'
      })
    }
    
    const switchChange = (e) => {
    }
    
    const change = (e) => {
      if (!e.show) {
        showPopup.value = false
      }
    }
    
    return {
      showPopup,
      rate,
      number,
      activeStep,
      steps,
      handleClick,
      switchChange,
      change
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/uni.scss";

.test-container {
  padding: $uni-spacing-xl;
  background-color: $uni-bg-color-grey;
  min-height: 100vh;
}

.simple-demo {
  margin: $uni-spacing-xl 0;
  text-align: center;
}

.section-content {
  margin: $uni-spacing-xl 0;
  display: flex;
  gap: $uni-spacing-xl;
  flex-wrap: wrap;
}

.popup-content {
  padding: $uni-spacing-xxxl;
  background-color: $uni-white;
  border-radius: $uni-radius-base;
  text-align: center;

  text {
    margin-bottom: $uni-spacing-xl;
    display: block;
  }
}
</style>