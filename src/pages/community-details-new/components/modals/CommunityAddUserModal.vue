<template>
  <view v-if="visible" class="community-add-user-modal">
    <!-- 遮罩层 -->
    <view class="modal-mask" @click="$emit('close')" />
    
    <!-- 模态框内容 -->
    <view class="modal-content">
      <!-- 标题和关闭按钮 -->
      <view class="modal-header">
        <h3 class="modal-title">添加社区用户</h3>
        <button class="close-button" @click="$emit('close')">
          <text class="close-icon">×</text>
        </button>
      </view>
      
      <!-- 表单内容 -->
      <view class="modal-body">
        <!-- 占位提示 -->
        <view class="placeholder-container">
          <text class="placeholder-icon">👤</text>
          <text class="placeholder-title">添加用户功能</text>
          <text class="placeholder-text">正在开发中...</text>
          <text class="placeholder-hint">此功能将用于向社区添加新的用户成员</text>
        </view>
        
        <!-- 占位表单 -->
        <view class="placeholder-form">
          <view class="form-field">
            <text class="field-label">用户姓名</text>
            <view class="field-input placeholder-input">
              <text class="placeholder-text">请输入用户姓名</text>
            </view>
          </view>
          
          <view class="form-field">
            <text class="field-label">手机号码</text>
            <view class="field-input placeholder-input">
              <text class="placeholder-text">请输入手机号码</text>
            </view>
          </view>
          
          <view class="form-field">
            <text class="field-label">用户角色</text>
            <view class="placeholder-roles">
              <text class="role-tag active">独居者</text>
              <text class="role-tag">监护人</text>
              <text class="role-tag">工作人员</text>
            </view>
          </view>
          
          <view class="form-field">
            <text class="field-label">加入方式</text>
            <view class="placeholder-options">
              <text class="option-tag">邀请加入</text>
              <text class="option-tag">自主申请</text>
              <text class="option-tag">管理员添加</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">
          <text class="button-text">取消</text>
        </button>
        <button class="submit-button" @click="$emit('confirm', {})">
          <text class="button-text">确认添加</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  communityId: {
    type: [String, Number],
    default: ''
  }
})

defineEmits(['close', 'confirm'])
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-add-user-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    position: relative;
    width: 90%;
    max-width: 600rpx;
    background: $uni-bg-color-white;
    border-radius: $uni-radius-lg;
    box-shadow: $uni-shadow-modal;
    overflow: hidden;
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $uni-spacing-xl;
      border-bottom: 1px solid $uni-divider;
      
      .modal-title {
        font-size: $uni-font-size-lg;
        font-weight: $uni-font-weight-base;
        color: $uni-accent;
      }
      
      .close-button {
        width: 40rpx;
        height: 40rpx;
        border-radius: $uni-radius-full;
        background: $uni-bg-color-light;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .close-icon {
          font-size: $uni-font-size-lg;
          color: $uni-text-gray-600;
        }
      }
    }
    
    .modal-body {
      padding: $uni-spacing-xl;
      max-height: 70vh;
      overflow-y: auto;
      
      .placeholder-container {
        text-align: center;
        margin-bottom: $uni-spacing-xl;
        padding: $uni-spacing-lg;
        background: $uni-bg-color-light;
        border-radius: $uni-radius-base;
        
        .placeholder-icon {
          display: block;
          font-size: 36rpx;
          margin-bottom: $uni-spacing-sm;
        }
        
        .placeholder-title {
          display: block;
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
          color: $uni-accent;
          margin-bottom: $uni-spacing-xs;
        }
        
        .placeholder-text {
          display: block;
          font-size: $uni-font-size-sm;
          color: $uni-text-gray-600;
          margin-bottom: $uni-spacing-xs;
        }
        
        .placeholder-hint {
          display: block;
          font-size: $uni-font-size-xs;
          color: $uni-text-gray-600;
        }
      }
      
      .placeholder-form {
        .form-field {
          margin-bottom: $uni-spacing-lg;
          
          .field-label {
            display: block;
            font-size: $uni-font-size-sm;
            font-weight: $uni-font-weight-base;
            color: $uni-text-gray-700;
            margin-bottom: $uni-spacing-xs;
          }
          
          .placeholder-input {
            padding: $uni-spacing-base;
            background: $uni-bg-color-light;
            border-radius: $uni-radius-base;
            border: 1px solid $uni-divider;
            
            .placeholder-text {
              font-size: $uni-font-size-sm;
              color: $uni-text-gray-600;
            }
          }
          
          .placeholder-roles,
          .placeholder-options {
            display: flex;
            flex-wrap: wrap;
            gap: $uni-spacing-sm;
            
            .role-tag,
            .option-tag {
              padding: $uni-spacing-xs $uni-spacing-sm;
              background: $uni-bg-color-light;
              color: $uni-text-gray-600;
              font-size: $uni-font-size-xs;
              border-radius: $uni-radius-sm;
              border: 1px solid $uni-divider;
              
              &.active {
                background: rgba(244, 130, 36, 0.1);
                color: $uni-primary;
                border-color: $uni-primary;
              }
            }
          }
        }
      }
    }
    
    .modal-footer {
      display: flex;
      padding: $uni-spacing-xl;
      border-top: 1px solid $uni-divider;
      gap: $uni-spacing-base;
      
      .cancel-button,
      .submit-button {
        flex: 1;
        padding: $uni-spacing-base;
        border-radius: $uni-radius-base;
        text-align: center;
        
        .button-text {
          font-size: $uni-font-size-base;
          font-weight: $uni-font-weight-base;
        }
      }
      
      .cancel-button {
        background: $uni-bg-color-light;
        color: $uni-text-gray-600;
      }
      
      .submit-button {
        @include btn-primary;
      }
    }
  }
}
</style>