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
        message_content: supportContent.value.trim()
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
@import '@/uni.scss';

.community-events-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
}

.status-bar {
  height: 88rpx;
  background: $uni-black;
  padding: 0 $uni-spacing-xl;
  
  .status-bar-content {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .status-time {
      color: $uni-white;
      font-size: $uni-font-size-xl;
    }
    
    .status-icons {
      display: flex;
      gap: $uni-spacing-sm;
      
      text {
        color: $uni-white;
        font-size: $uni-font-size-lg;
      }
    }
  }
}

.header {
  height: 88rpx;
  background: $uni-bg-color-white;
  display: flex;
  align-items: center;
  padding: 0 $uni-spacing-xl;
  border-bottom: 1px solid $uni-border-light;
  
  .nav-left, .nav-right {
    width: 80rpx;
    display: flex;
    justify-content: center;
  }
  
  .nav-center {
    flex: 1;
    text-align: center;
    
    .nav-title {
      font-size: $uni-font-size-xxl;
      font-weight: $uni-font-weight-bold;
      color: $uni-text-primary;
    }
  }
  
  .back-icon, .refresh-icon {
    font-size: $uni-font-size-xxl;
    color: $uni-text-base;
  }
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .error-text {
    color: $uni-text-base;
    margin-bottom: $uni-spacing-lg;
  }
  
  .retry-btn {
    padding: $uni-spacing-lg $uni-spacing-xl;
    background: $uni-info;
    color: $uni-white;
    border: none;
    border-radius: $uni-radius-sm;
    font-size: $uni-font-size-base;
  }
}

.events-content {
  flex: 1;
}

.filter-section {
  background: $uni-bg-color-white;
  padding: $uni-spacing-lg $uni-spacing-xl;
  border-bottom: 1px solid $uni-border-light;
  
  .filter-tabs {
    display: flex;
    gap: $uni-spacing-lg;
    
    .filter-tab {
      padding: $uni-spacing-base $uni-spacing-lg;
      background: $uni-bg-color-grey;
      border-radius: $uni-radius-lg;
      display: flex;
      align-items: center;
      gap: $uni-spacing-xs;
      
      &.active {
        background: $uni-info;
        
        .filter-text {
          color: $uni-white;
        }
        
        .filter-count {
          color: rgba(255, 255, 255, 0.8);
        }
      }
      
      .filter-text {
        font-size: $uni-font-size-base;
        color: $uni-text-base;
      }
      
      .filter-count {
        font-size: $uni-font-size-sm;
        color: $uni-text-secondary;
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
    margin-bottom: $uni-spacing-lg;
  }
  
  .empty-text {
    color: $uni-text-secondary;
    font-size: $uni-font-size-base;
  }
}

.events-list {
  padding: 0 $uni-spacing-xl;
}

.event-item {
  background: $uni-bg-color-white;
  margin: $uni-spacing-lg 0;
  border-radius: $uni-radius-md;
  padding: $uni-spacing-xl;
  box-shadow: $uni-shadow-card;
  
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $uni-spacing-lg;
    
    .event-title-section {
      flex: 1;
      margin-right: $uni-spacing-lg;
      
      .event-title {
        font-size: $uni-font-size-xl;
        font-weight: $uni-font-weight-bold;
        color: $uni-text-primary;
        margin-bottom: $uni-spacing-base;
      }
      
      .event-type {
        display: inline-block;
        padding: $uni-spacing-xs $uni-spacing-base;
        border-radius: $uni-radius-base;
        
        &.call_for_help {
          background: $uni-error;
        }
        
        &.supporting {
          background: $uni-success;
        }
        
        .type-text {
          font-size: $uni-font-size-sm;
          color: $uni-white;
        }
      }
    }
    
    .event-status {
      .status-text {
        font-size: $uni-font-size-sm;
        padding: $uni-spacing-xs $uni-spacing-base;
        border-radius: $uni-radius-base;
        
        &.status-1 {
          background: $uni-warning;
          color: $uni-white;
        }
        
        &.status-2 {
          background: $uni-success;
          color: $uni-white;
        }
        
        &.status-3 {
          background: $uni-secondary;
          color: $uni-white;
        }
      }
    }
  }
  
  .event-content {
    margin-bottom: $uni-spacing-lg;
    
    .description {
      font-size: $uni-font-size-base;
      color: $uni-text-base;
      line-height: 1.5;
      margin-bottom: $uni-spacing-base;
    }
    
    .location-info {
      display: flex;
      align-items: center;
      gap: $uni-spacing-xs;
      
      .location-icon {
        font-size: $uni-font-size-sm;
        color: $uni-text-secondary;
      }
      
      .location-text {
        font-size: $uni-font-size-md;
        color: $uni-text-base;
      }
    }
  }
  
  .event-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .event-meta {
      .creator-info {
        font-size: $uni-font-size-sm;
        color: $uni-text-secondary;
        margin-right: $uni-spacing-lg;
      }
      
      .time-info {
        font-size: $uni-font-size-sm;
        color: $uni-text-secondary;
      }
    }
    
    .event-actions {
      display: flex;
      align-items: center;
      gap: $uni-spacing-lg;
      
      .support-count {
        font-size: $uni-font-size-sm;
        color: $uni-success;
      }
      
      .support-btn {
        padding: $uni-spacing-xs $uni-spacing-lg;
        background: $uni-info;
        color: $uni-white;
        border: none;
        border-radius: $uni-radius-md;
        font-size: $uni-font-size-sm;
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
  background: $uni-bg-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.support-modal {
  background: $uni-bg-color-white;
  border-radius: $uni-radius-xl;
  margin: $uni-spacing-xxxl;
  max-height: 80vh;
  width: calc(100vw - 120rpx);
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $uni-spacing-xl;
    border-bottom: 1px solid $uni-border-light;
    
    .modal-title {
      font-size: $uni-font-size-xxl;
      font-weight: $uni-font-weight-bold;
      color: $uni-text-primary;
    }
    
    .close-btn {
      font-size: $uni-font-size-xxxl;
      color: $uni-text-secondary;
      width: $uni-spacing-xxxl;
      height: $uni-spacing-xxxl;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .modal-content {
    padding: $uni-spacing-xl;
    
    .event-info {
      margin-bottom: $uni-spacing-xl;
      
      .event-title {
        font-size: $uni-font-size-xl;
        font-weight: $uni-font-weight-bold;
        color: $uni-text-primary;
        margin-bottom: $uni-spacing-base;
      }
      
      .event-desc {
        font-size: $uni-font-size-base;
        color: $uni-text-base;
        line-height: 1.5;
      }
    }
    
    .input-section {
      .support-input {
        width: 100%;
        min-height: 200rpx;
        padding: $uni-spacing-lg;
        border: 1px solid $uni-border-base;
        border-radius: $uni-radius-base;
        font-size: $uni-font-size-base;
        margin-bottom: $uni-spacing-base;
      }
      
      .char-count {
        font-size: $uni-font-size-sm;
        color: $uni-text-secondary;
        text-align: right;
      }
    }
  }
  
  .modal-actions {
    display: flex;
    gap: $uni-spacing-lg;
    padding: $uni-spacing-xl;
    border-top: 1px solid $uni-border-light;
    
    .cancel-btn, .confirm-btn {
      flex: 1;
      padding: $uni-spacing-xl;
      border: none;
      border-radius: $uni-radius-base;
      font-size: $uni-font-size-xxl;
      
      &.cancel-btn {
        background: $uni-bg-color-grey;
        color: $uni-text-base;
      }
      
      &.confirm-btn {
        background: $uni-info;
        color: $uni-white;
        
        &:disabled {
          background: $uni-border-dark;
        }
      }
    }
  }
}
</style>