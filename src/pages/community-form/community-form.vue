<template>
  <view
    class="community-form-container"
    data-testid="create-community-page"
  >
    <uni-forms
      ref="formRef"
      :model-value="formData"
      :rules="rules"
    >
      <uni-forms-item
        label="社区名称"
        name="name"
        required
      >
        <uni-easyinput
          v-model="formData.name"
          placeholder="请输入社区名称"
          :maxlength="50"
          data-testid="community-name-input"
        />
      </uni-forms-item>

      <uni-forms-item
        label="位置选择"
        name="location"
        required
      >
        <view
          class="location-selector"
          data-testid="location-select-button"
          @click="selectLocation"
        >
          <text
            v-if="formData.location"
            class="location-text"
          >
            {{ formData.location }}
          </text>
          <text
            v-else
            class="location-placeholder"
          >
            点击选择位置
          </text>
          <text class="location-icon">
            ›
          </text>
        </view>
      </uni-forms-item>

      <uni-forms-item
        label="社区主管"
        name="manager_id"
      >
        <view
          class="manager-selector"
          @click="selectManager"
        >
          <text
            v-if="formData.manager_name"
            class="manager-text"
          >
            {{ formData.manager_name }}
          </text>
          <text
            v-else
            class="manager-placeholder"
          >
            点击选择主管（可选）
          </text>
          <text class="manager-icon">
            ›
          </text>
        </view>
      </uni-forms-item>

      <uni-forms-item
        label="社区描述"
        name="description"
      >
        <uni-easyinput
          v-model="formData.description"
          type="textarea"
          placeholder="请输入社区描述（可选）"
          :maxlength="200"
        />
      </uni-forms-item>
    </uni-forms>

    <view class="form-actions">
      <view class="action-row">
        <button
          class="submit-btn"
          :disabled="submitting"
          data-testid="create-community-submit-button"
          @click="submitForm"
        >
          {{ submitting ? '提交中...' : (isEdit ? '保存修改' : '创建社区') }}
        </button>
        <button
          class="cancel-btn"
          :disabled="submitting"
          data-testid="create-community-cancel-button"
          @click="handleCancel"
        >
          取消
        </button>
      </view>
      <button
        v-if="isEdit"
        class="delete-btn"
        :disabled="submitting"
        @click="handleDelete"
      >
        删除社区
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { getCommunityDetail } from '@/api/community'
import {
  validateCommunityName,
  formatDate
} from '@/utils/community'
import {
  COMMUNITY_NAME_MIN_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  CONFIRM_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

const communityStore = useCommunityStore()

// 表单数据
const formData = ref({
  name: '',
  location: '',
  location_lat: null,
  location_lon: null,
  province: '',
  city: '',
  district: '',
  street: '',
  manager_id: '',
  manager_name: '',
  description: ''
})

// 表单引用
const formRef = ref(null)

// 状态
const isEdit = ref(false)
const communityId = ref('')
const submitting = ref(false)
const hasChanges = ref(false)

// 表单验证规则
const rules = {
  name: {
    rules: [
      {
        required: true,
        errorMessage: '请输入社区名称'
      },
      {
        validateFunction: (rule, value, data, callback) => {
          if (!validateCommunityName(value)) {
            callback(ERROR_MESSAGES.INVALID_NAME)
          }
          return true
        }
      }
    ]
  },
  location: {
    rules: [
      {
        required: true,
        errorMessage: '请选择位置'
      }
    ]
  }
}

// 监听表单变化
const watchFormChanges = () => {
  hasChanges.value = true
}

// 选择位置
const selectLocation = () => {
  console.log('selectLocation 被调用，准备跳转到地图选择页面')

  // 跳转到地图选择页面
  uni.navigateTo({
    url: '/pages/map-location-picker/map-location-picker',
    events: {
      // 监听地图选择器返回的数据
      onLocationSelected: (data) => {
        console.log('收到 onLocationSelected 事件，数据:', data)
        formData.value.location = data.location
        formData.value.location_lat = data.location_lat
        formData.value.location_lon = data.location_lon
        formData.value.province = data.province
        formData.value.city = data.city
        formData.value.district = data.district
        formData.value.street = data.street
        watchFormChanges()
        console.log('表单数据已更新:', formData.value)
      }
    },
    success: () => {
      console.log('跳转到地图选择页面成功')
    },
    fail: (err) => {
      console.error('跳转到地图选择页面失败:', err)
    }
  })
}

// 选择主管
const selectManager = () => {
  uni.navigateTo({
    url: '/pages/staff-add/staff-add?mode=select&role=manager'
  })
}

// 提交表单
const submitForm = async () => {
  if (submitting.value) return

  try {
    // 表单验证
    await formRef.value.validate()

    submitting.value = true
    uni.showLoading({ title: isEdit.value ? LOADING_MESSAGES.UPDATING : LOADING_MESSAGES.CREATING })

    if (isEdit.value) {
      // 更新社区
      await communityStore.updateCommunity(communityId.value, formData.value)
      uni.hideLoading()
      uni.showToast({
        title: SUCCESS_MESSAGES.UPDATE_SUCCESS,
        icon: 'success'
      })
    } else {
      // 创建社区
      await communityStore.createCommunity(formData.value)
      uni.hideLoading()
      uni.showToast({
        title: SUCCESS_MESSAGES.CREATE_SUCCESS,
        icon: 'success'
      })
    }

    // 延迟返回，让用户看到提示
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('提交表单失败:', error)
    uni.hideLoading()

    if (error.errors) {
      // 表单验证错误
      const firstError = error.errors[0]
      uni.showToast({
        title: firstError.errorMessage,
        icon: 'none'
      })
    } else {
      // 网络或业务错误
      uni.showToast({
        title: error.msg || (isEdit.value ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED),
        icon: 'none'
      })
    }
  } finally {
    submitting.value = false
  }
}

// 加载社区详情（编辑模式）
const loadCommunityDetail = async (id) => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.LOADING })

    // 通过 API 获取社区详情
    const response = await getCommunityDetail(id)

    if (response.code === 1 && response.data) {
      const community = response.data.community || response.data
      formData.value = {
        name: community.name || '',
        location: community.location || '',
        location_lat: community.location_lat || null,
        location_lon: community.location_lon || null,
        province: community.province || '',
        city: community.city || '',
        district: community.district || '',
        street: community.street || '',
        manager_id: community.manager_id || '',
        manager_name: community.manager_name || community.manager?.nickname || '',
        description: community.description || ''
      }
    } else {
      uni.showToast({
        title: response.msg || ERROR_MESSAGES.COMMUNITY_NOT_FOUND,
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }

    uni.hideLoading()
  } catch (error) {
    console.error('加载社区详情失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: ERROR_MESSAGES.LOAD_FAILED,
      icon: 'none'
    })
  }
}

// 删除社区
const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除按钮会涉及很多用户，它们会到默认社区中，你确定吗？',
    confirmColor: '#E53935',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })

          // 调用删除API
          await communityStore.deleteCommunity(communityId.value)

          uni.hideLoading()
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })

          // 延迟返回到上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          console.error('删除社区失败:', error)
          uni.hideLoading()
          uni.showToast({
            title: error.msg || '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 取消操作
const handleCancel = () => {
  uni.navigateBack()
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    isEdit.value = true
    communityId.value = options.id
    loadCommunityDetail(options.id)
  }
})

// 页面卸载前确认
onUnload(() => {
  if (hasChanges.value && !submitting.value) {
    // 注意：onUnload 中无法使用异步确认
    // 这里只是标记，实际确认需要在返回按钮拦截
  }
})

// 监听主管选择结果
uni.$on('managerSelected', (manager) => {
  if (manager) {
    formData.value.manager_id = manager.user_id
    formData.value.manager_name = manager.nickname
    watchFormChanges()
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-form-container {
  min-height: 100vh;
  @include bg-gradient;
  padding: 32rpx;
  padding-bottom: 160rpx;
}

.location-selector,
.manager-selector {
  @include input-default;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80rpx;
}

.location-text,
.manager-text {
  flex: 1;
  color: $uni-main-color;
  font-size: $uni-font-size-base;
}

.location-placeholder,
.manager-placeholder {
  flex: 1;
  color: $uni-text-placeholder;
  font-size: $uni-font-size-base;
}

.location-icon,
.manager-icon {
  font-size: $uni-font-size-xl;
  color: $uni-base-color;
  margin-left: 16rpx;
}

.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: $uni-bg-color-white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  @include safe-area-bottom;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.action-row {
  display: flex;
  gap: 24rpx;
}

.submit-btn,
.cancel-btn {
  flex: 1;
  height: 88rpx;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;

  &:disabled {
    opacity: 0.5;
  }
}

.submit-btn {
  @include btn-primary;
}

.cancel-btn {
  background: $uni-bg-color-grey;
  color: $uni-text-gray-800;
}

.delete-btn {
  width: 100%;
  height: 88rpx;
  background: $uni-bg-color-grey;
  color: $uni-text-gray-800;
  border: none;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-base;
  font-weight: $uni-font-weight-base;

  &:disabled {
    opacity: 0.5;
  }
}
</style>
