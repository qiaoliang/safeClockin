<template>
  <view class="community-events-container">
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

    <!-- 顶部导航 -->
    <view class="header">
      <view
        class="nav-left"
        @click="handleBack"
      >
        <text class="back-icon">
          ←
        </text>
      </view>
      <view class="nav-center">
        <text class="nav-title">
          社区事件
        </text>
      </view>
      <view class="nav-right">
        <text
          class="refresh-icon"
          @click="refreshEvents"
        >
          🔄
        </text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view
      v-if="loading"
      class="loading-container"
    >
      <uni-load-more status="loading" />
    </view>

    <!-- 错误状态 -->
    <view
      v-else-if="error"
      class="error-container"
    >
      <text class="error-text">
        {{ error }}
      </text>
      <button
        class="retry-btn"
        @click="loadEvents"
      >
        重试
      </button>
    </view>

    <!-- 事件列表 -->
    <view
      v-else
      class="events-content"
    >
      <!-- 筛选器 -->
      <view class="filter-section">
        <view class="filter-tabs">
          <view 
            v-for="filter in filters" 
            :key="filter.value"
            :class="['filter-tab', { active: activeFilter === filter.value }]"
            @click="handleFilterChange(filter.value)"
          >
            <text class="filter-text">
              {{ filter.label }}
            </text>
            <text
              v-if="filter.count"
              class="filter-count"
            >
              ({{ filter.count }})
            </text>
          </view>
        </view>
      </view>

      <!-- 事件列表 -->
      <view
        v-if="eventsList.length === 0"
        class="empty-state"
      >
        <text class="empty-icon">
          📋
        </text>
        <text class="empty-text">
          暂无{{ getFilterLabel() }}事件
        </text>
      </view>

      <view
        v-else
        class="events-list"
      >
        <view 
          v-for="event in eventsList" 
          :key="event.event_id"
          class="event-item"
          @click="handleEventClick(event)"
        >
          <!-- 事件头部 -->
          <view class="event-header">
            <view class="event-title-section">
              <text class="event-title">
                {{ event.title }}
              </text>
              <view :class="['event-type', event.event_type]">
                <text class="type-text">
                  {{ event.event_type_label }}
                </text>
              </view>
            </view>
            <view class="event-status">
              <text :class="['status-text', `status-${event.status}`]">
                {{ event.status_label }}
              </text>
            </view>
          </view>

          <!-- 事件内容 -->
          <view class="event-content">
            <text
              v-if="event.description"
              class="description"
            >
              {{ event.description }}
            </text>
            <view
              v-if="event.location"
              class="location-info"
            >
              <text class="location-icon">
                📍
              </text>
              <text class="location-text">
                {{ event.location }}
              </text>
            </view>
          </view>

          <!-- 事件底部 -->
          <view class="event-footer">
            <view class="event-meta">
              <text class="creator-info">
                {{ event.creator_name }}
              </text>
              <text class="time-info">
                {{ formatTime(event.created_at) }}
              </text>
            </view>
            <view class="event-actions">
              <text class="support-count">
                {{ event.support_count }}个应援
              </text>
              <text
                v-if="canSupport(event)"
                class="support-btn"
                @click.stop="handleSupport(event)"
              >
                应援
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 应援弹窗 -->
    <view
      v-if="showSupportModal"
      class="modal-overlay"
      @click="closeSupportModal"
    >
      <view
        class="support-modal"
        @click.stop
      >
        <view class="modal-header">
          <text class="modal-title">
            提供应援
          </text>
          <text
            class="close-btn"
            @click="closeSupportModal"
          >
            ×
          </text>
        </view>
        <view class="modal-content">
          <view class="event-info">
            <text class="event-title">
              {{ selectedEvent?.title }}
            </text>
            <text class="event-desc">
              {{ selectedEvent?.description }}
            </text>
          </view>
          <view class="input-section">
            <textarea 
              v-model="supportContent"
              class="support-input"
              placeholder="请输入您的支援信息..."
              maxlength="500"
            />
            <text class="char-count">
              {{ supportContent.length }}/500
            </text>
          </view>
        </view>
        <view class="modal-actions">
          <button
            class="cancel-btn"
            @click="closeSupportModal"
          >
            取消
          </button>
          <button 
            class="confirm-btn" 
            :disabled="!supportContent.trim() || submitting"
            @click="confirmSupport"
          >
            {{ submitting ? '提交中...' : '确认应援' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

// 页面参数
const communityId = ref('');
const loading = ref(false);
const error = ref('');

// 事件数据
const eventsList = ref([]);
const activeFilter = ref('all'); // all, call_for_help, supporting
const filters = ref([
  { value: 'all', label: '全部', count: 0 },
  { value: 'call_for_help', label: '求助', count: 0 },
  { value: 'supporting', label: '应援', count: 0 }
]);

// 应援弹窗
const showSupportModal = ref(false);
const selectedEvent = ref(null);
const supportContent = ref('');
const submitting = ref(false);

// 页面加载
onLoad((options) => {
  if (options.community_id) {
    communityId.value = options.community_id;
    loadEvents();
  } else {
    error.value = '缺少社区ID参数';
  }
});

// 获取筛选标签
const getFilterLabel = () => {
  const filter = filters.value.find(f => f.value === activeFilter.value);
  return filter ? filter.label : '';
};

// 加载事件列表
const loadEvents = async () => {
  if (!communityId.value) {
    error.value = '社区ID不能为空';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      error.value = '请先登录';
      return;
    }

    const response = await uni.request({
      url: `/api/communities/${communityId.value}/events`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        event_type_filter: activeFilter.value === 'all' ? null : activeFilter.value,
        status_filter: 1 // 只获取进行中的事件
      }
    });

    if (response.data.code === 1) {
      eventsList.value = response.data.events || [];
      updateFilterCounts();
    } else {
      error.value = response.data.msg || '获取事件列表失败';
    }
  } catch (err) {
    console.error('加载事件列表失败:', err);
    error.value = '网络错误，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 更新筛选计数
const updateFilterCounts = async () => {
  try {
    const token = uni.getStorageSync('token');
    
    // 获取全部事件计数
    const allResponse = await uni.request({
      url: `/api/communities/${communityId.value}/events`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { status_filter: 1 }
    });

    if (allResponse.data.code === 1) {
      const allEvents = allResponse.data.events || [];
      
      // 更新筛选计数
      filters.value[0].count = allEvents.length;
      filters.value[1].count = allEvents.filter(e => e.event_type === 'call_for_help').length;
      filters.value[2].count = allEvents.filter(e => e.event_type === 'supporting').length;
    }
  } catch (err) {
    console.error('更新筛选计数失败:', err);
  }
};

// 刷新事件
const refreshEvents = () => {
  loadEvents();
};

// 筛选切换
const handleFilterChange = (filterValue) => {
  activeFilter.value = filterValue;
  loadEvents();
};

// 返回
const handleBack = () => {
  uni.navigateBack();
};

// 事件点击
const handleEventClick = (event) => {
  // 可以跳转到事件详情页
  console.log('查看事件详情:', event);
  // TODO: 实现事件详情页面
};

// 判断是否可以应援
const canSupport = (event) => {
  const userInfo = userStore.userInfo;
  if (!userInfo) return false;
  
  // 只有社区工作人员可以应援
  // 这里简化判断，实际应该调用权限验证API
  return userInfo.role >= 2 && event.event_type === 'call_for_help' && event.status === 1;
};

// 处理应援
const handleSupport = (event) => {
  selectedEvent.value = event;
  supportContent.value = '';
  showSupportModal.value = true;
};

// 关闭应援弹窗
const closeSupportModal = () => {
  showSupportModal.value = false;
  selectedEvent.value = null;
  supportContent.value = '';
};

// 确认应援
const confirmSupport = async () => {
  if (!selectedEvent.value || !supportContent.value.trim()) {
    return;
  }

  submitting.value = true;

  try {
    const token = uni.getStorageSync('token');
    
    const response = await uni.request({
      url: `/api/events/${selectedEvent.value.event_id}/support`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        support_content: supportContent.value.trim()
      }
    });

    if (response.data.code === 1) {
      uni.showToast({
        title: '应援成功',
        icon: 'success',
        duration: 2000
      });
      
      closeSupportModal();
      refreshEvents(); // 刷新事件列表
    } else {
      uni.showToast({
        title: response.data.msg || '应援失败',
        icon: 'none',
        duration: 2000
      });
    }
  } catch (err) {
    console.error('应援失败:', err);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none',
      duration: 2000
    });
  } finally {
    submitting.value = false;
  }
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString();
  }
};
</script>

<style lang="scss" scoped>
.community-events-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.status-bar {
  height: 88rpx;
  background: #000;
  padding: 0 30rpx;
  
  .status-bar-content {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .status-time {
      color: #fff;
      font-size: 32rpx;
    }
    
    .status-icons {
      display: flex;
      gap: 12rpx;
      
      text {
        color: #fff;
        font-size: 28rpx;
      }
    }
  }
}

.header {
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  border-bottom: 1px solid #eee;
  
  .nav-left, .nav-right {
    width: 80rpx;
    display: flex;
    justify-content: center;
  }
  
  .nav-center {
    flex: 1;
    text-align: center;
    
    .nav-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
  }
  
  .back-icon, .refresh-icon {
    font-size: 40rpx;
    color: #666;
  }
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .error-text {
    color: #666;
    margin-bottom: 30rpx;
  }
  
  .retry-btn {
    padding: 20rpx 40rpx;
    background: #007aff;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    font-size: 28rpx;
  }
}

.events-content {
  flex: 1;
}

.filter-section {
  background: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #eee;
  
  .filter-tabs {
    display: flex;
    gap: 20rpx;
    
    .filter-tab {
      padding: 16rpx 24rpx;
      background: #f5f5f5;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      &.active {
        background: #007aff;
        
        .filter-text {
          color: #fff;
        }
        
        .filter-count {
          color: rgba(255, 255, 255, 0.8);
        }
      }
      
      .filter-text {
        font-size: 28rpx;
        color: #666;
      }
      
      .filter-count {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    color: #999;
    font-size: 28rpx;
  }
}

.events-list {
  padding: 0 30rpx;
}

.event-item {
  background: #fff;
  margin: 20rpx 0;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20rpx;
    
    .event-title-section {
      flex: 1;
      margin-right: 20rpx;
      
      .event-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 12rpx;
      }
      
      .event-type {
        display: inline-block;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
        
        &.call_for_help {
          background: #ff4757;
        }
        
        &.supporting {
          background: #2ed573;
        }
        
        .type-text {
          font-size: 24rpx;
          color: #fff;
        }
      }
    }
    
    .event-status {
      .status-text {
        font-size: 24rpx;
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
        
        &.status-1 {
          background: #ffa502;
          color: #fff;
        }
        
        &.status-2 {
          background: #2ed573;
          color: #fff;
        }
        
        &.status-3 {
          background: #747d8c;
          color: #fff;
        }
      }
    }
  }
  
  .event-content {
    margin-bottom: 20rpx;
    
    .description {
      font-size: 28rpx;
      color: #666;
      line-height: 1.5;
      margin-bottom: 16rpx;
    }
    
    .location-info {
      display: flex;
      align-items: center;
      gap: 8rpx;
      
      .location-icon {
        font-size: 24rpx;
        color: #999;
      }
      
      .location-text {
        font-size: 26rpx;
        color: #666;
      }
    }
  }
  
  .event-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .event-meta {
      .creator-info {
        font-size: 24rpx;
        color: #999;
        margin-right: 20rpx;
      }
      
      .time-info {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .event-actions {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      .support-count {
        font-size: 24rpx;
        color: #2ed573;
      }
      
      .support-btn {
        padding: 8rpx 20rpx;
        background: #007aff;
        color: #fff;
        border: none;
        border-radius: 16rpx;
        font-size: 24rpx;
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.support-modal {
  background: #fff;
  border-radius: 20rpx;
  margin: 60rpx;
  max-height: 80vh;
  width: calc(100vw - 120rpx);
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1px solid #eee;
    
    .modal-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
    
    .close-btn {
      font-size: 48rpx;
      color: #999;
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .modal-content {
    padding: 30rpx;
    
    .event-info {
      margin-bottom: 30rpx;
      
      .event-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 16rpx;
      }
      
      .event-desc {
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
      }
    }
    
    .input-section {
      .support-input {
        width: 100%;
        min-height: 200rpx;
        padding: 20rpx;
        border: 1px solid #ddd;
        border-radius: 12rpx;
        font-size: 28rpx;
        margin-bottom: 16rpx;
      }
      
      .char-count {
        font-size: 24rpx;
        color: #999;
        text-align: right;
      }
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 20rpx;
    padding: 30rpx;
    border-top: 1px solid #eee;
    
    .cancel-btn, .confirm-btn {
      flex: 1;
      padding: 24rpx;
      border: none;
      border-radius: 12rpx;
      font-size: 32rpx;
      
      &.cancel-btn {
        background: #f5f5f5;
        color: #666;
      }
      
      &.confirm-btn {
        background: #007aff;
        color: #fff;
        
        &:disabled {
          background: #ccc;
        }
      }
    }
  }
}
</style>