<template>
  <view class="community-info-card">
    <view class="card-container">
      <!-- 社区名称和位置 -->
      <view class="info-header">
        <h2 class="community-name">{{ community.name || '未命名社区' }}</h2>
        
        <view class="info-details">
          <view class="detail-item">
            <text class="detail-icon">📍</text>
            <text class="detail-text">{{ community.location || '未设置位置' }}</text>
          </view>
          
          <view v-if="community.manager" class="detail-item">
            <text class="detail-icon">👤</text>
            <text class="detail-text">主管：{{ community.manager.nickname || '未知' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 分隔线 -->
      <view class="divider" />
      
      <!-- 统计信息 -->
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number staff-count">{{ stats.staff_count || 0 }}</text>
          <text class="stat-label">专员</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number user-count">{{ stats.user_count || 0 }}</text>
          <text class="stat-label">成员</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number support-count">{{ stats.support_count || 0 }}</text>
          <text class="stat-label">应援</text>
        </view>
        
        <view class="stat-item">
          <text class="stat-number active-count">{{ stats.active_events || 0 }}</text>
          <text class="stat-label">活跃</text>
        </view>
      </view>
      
      <!-- 打卡率（单独一行） -->
      <view v-if="stats.checkin_rate !== undefined" class="checkin-rate-row">
        <text class="checkin-rate-label">打卡率</text>
        <view class="checkin-rate-progress">
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ width: `${Math.min(stats.checkin_rate, 100)}%` }"
            />
          </view>
          <text class="checkin-rate-value">{{ stats.checkin_rate }}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  community: {
    type: Object,
    default: () => ({})
  },
  stats: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-info-card {
  margin-bottom: $uni-spacing-xl;
  
  .card-container {
    @include greeting-card;
    padding: $uni-spacing-xl;
    
    .info-header {
      margin-bottom: $uni-spacing-xl;
      padding-bottom: $uni-spacing-lg;
      border-bottom: 1px solid $uni-divider;
      
      .community-name {
        font-size: $uni-font-size-xxl;
        font-weight: $uni-font-weight-base;
        color: $uni-accent;
        margin-bottom: $uni-spacing-md;
      }
      
      .info-details {
        display: flex;
        flex-wrap: wrap;
        gap: $uni-spacing-lg;
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: $uni-spacing-sm;
          
          .detail-icon {
            font-size: $uni-font-size-sm;
            color: $uni-secondary;
          }
          
          .detail-text {
            font-size: $uni-font-size-sm;
            color: $uni-text-gray-600;
          }
        }
      }
    }
    
    .divider {
      height: 1px;
      background: $uni-divider;
      margin: $uni-spacing-lg 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: $uni-spacing-base;
      margin-bottom: $uni-spacing-lg;
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          display: block;
          font-size: $uni-font-size-xxl;
          font-weight: $uni-font-weight-base;
          margin-bottom: $uni-spacing-xs;
          
          &.staff-count {
            color: $uni-secondary;
          }
          
          &.user-count {
            color: $uni-accent;
          }
          
          &.support-count {
            color: $uni-success;
          }
          
          &.active-count {
            color: $uni-danger;
          }
        }
        
        .stat-label {
          font-size: $uni-font-size-xs;
          color: $uni-text-gray-600;
        }
      }
    }
    
    .checkin-rate-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: $uni-spacing-md;
      
      .checkin-rate-label {
        font-size: $uni-font-size-sm;
        color: $uni-text-gray-700;
        font-weight: $uni-font-weight-base;
      }
      
      .checkin-rate-progress {
        display: flex;
        align-items: center;
        gap: $uni-spacing-md;
        flex: 1;
        max-width: 200rpx;
        
        .progress-bar {
          flex: 1;
          height: 8rpx;
          background: $uni-bg-color-light;
          border-radius: $uni-radius-full;
          overflow: hidden;
          
          .progress-fill {
            height: 100%;
            background: linear-gradient($uni-deg-base, $uni-success 0%, $uni-success-dark 100%);
            border-radius: $uni-radius-full;
            transition: width 0.5s ease;
          }
        }
        
        .checkin-rate-value {
          font-size: $uni-font-size-sm;
          font-weight: $uni-font-weight-base;
          color: $uni-success;
          min-width: 60rpx;
          text-align: right;
        }
      }
    }
  }
}
</style>