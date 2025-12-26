<template>
  <view class="split-container">
    <!-- 头部说明 -->
    <view class="split-header">
      <text class="header-title">
        社区拆分
      </text>
      <text class="header-subtitle">
        选择要拆分的社区
      </text>
    </view>

    <!-- 选择源社区 -->
    <view class="source-section">
      <text class="section-label">
        源社区
      </text>
      <uni-data-select
        v-model="sourceCommunityId"
        :localdata="communityOptions"
        placeholder="选择社区"
        @change="handleCommunityChange"
      />
    </view>

    <!-- 子社区信息 -->
    <view
      v-if="sourceCommunityId"
      class="sub-communities-section"
    >
      <view class="section-header">
        <text class="section-title">
          子社区信息
        </text>
        <button
          class="add-sub-btn"
          @click="addSubCommunity"
        >
          + 新增子社区
        </button>
      </view>

      <view
        v-for="(sub, index) in subCommunities"
        :key="sub.id"
        class="sub-community-item"
      >
        <view class="sub-item-header">
          <text class="sub-item-title">
            子社区 {{ index + 1 }}
          </text>
          <button
            class="remove-sub-btn"
            @click="removeSubCommunity(index)"
          >
            删除
          </button>
        </view>

        <uni-easyinput
          v-model="sub.name"
          placeholder="子社区名称"
          :maxlength="50"
        />

        <uni-easyinput
          v-model="sub.location"
          placeholder="子社区位置"
          class="mt-16"
        />
      </view>

      <!-- 空状态 -->
      <view
        v-if="subCommunities.length === 0"
        class="empty-sub"
      >
        <text class="empty-text">
          请添加至少一个子社区
        </text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button
        class="split-btn"
        :disabled="!canSplit"
        @click="confirmSplit"
      >
        确认拆分
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCommunityStore } from '@/store/modules/community'
import { generateId } from '@/utils/community'
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
  LOADING_MESSAGES
} from '@/constants/community'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'

const communityStore = useCommunityStore()

// 页面权限检查
onLoad(() => {
  if (!checkPagePermission(PagePath.COMMUNITY_SPLIT)) {
    return
  }
})

// 源社区ID
const sourceCommunityId = ref('')

// 子社区列表
const subCommunities = ref([])

// 社区选项
const communityOptions = computed(() => {
  return communityStore.activeCommunities.map(item => ({
    text: item.name,
    value: item.id
  }))
})

// 是否可以拆分
const canSplit = computed(() => {
  if (!sourceCommunityId.value) return false
  if (subCommunities.value.length === 0) return false

  // 检查所有子社区是否填写完整
  return subCommunities.value.every(sub => sub.name && sub.location)
})

// 处理社区选择变化
const handleCommunityChange = () => {
  // 清空之前的子社区
  subCommunities.value = []
}

// 添加子社区
const addSubCommunity = () => {
  subCommunities.value.push({
    id: generateId(),
    name: '',
    location: ''
  })
}

// 移除子社区
const removeSubCommunity = (index) => {
  subCommunities.value.splice(index, 1)
}

// 确认拆分
const confirmSplit = () => {
  if (!canSplit.value) {
    uni.showToast({
      title: '请完善子社区信息',
      icon: 'none'
    })
    return
  }

  const sourceCommunity = communityStore.communities.find(c => c.id === sourceCommunityId.value)

  uni.showModal({
    title: '确认拆分',
    content: `将"${sourceCommunity?.name}"拆分为 ${subCommunities.value.length} 个子社区？`,
    confirmColor: '#F48224',
    success: async (res) => {
      if (res.confirm) {
        await performSplit()
      }
    }
  })
}

// 执行拆分
const performSplit = async () => {
  try {
    uni.showLoading({ title: LOADING_MESSAGES.PROCESSING })

    const subCommunitiesData = subCommunities.value.map(sub => ({
      name: sub.name,
      location: sub.location
    }))

    await communityStore.splitCommunity(
      sourceCommunityId.value,
      subCommunitiesData
    )

    uni.hideLoading()
    uni.showToast({
      title: SUCCESS_MESSAGES.SPLIT_SUCCESS,
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('拆分社区失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: error.msg || '拆分失败',
      icon: 'none'
    })
  }
}

onMounted(async () => {
  // 确保社区列表已加载
  if (communityStore.communities.length === 0) {
    await communityStore.loadCommunities(true)
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.split-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 160rpx;
}

.split-header {
  background: $uni-bg-color-white;
  padding: 48rpx 32rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.header-title {
  display: block;
  font-size: $uni-font-size-xl;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.source-section {
  padding: 32rpx;
  background: $uni-bg-color-white;
  margin: 0 32rpx 24rpx;
  border-radius: $uni-radius-lg;
  box-shadow: $uni-shadow-sm;
}

.section-label {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-base-color;
  margin-bottom: 16rpx;
}

.sub-communities-section {
  padding: 32rpx;
  background: $uni-bg-color-white;
  margin: 0 32rpx 24rpx;
  border-radius: $uni-radius-lg;
  box-shadow: $uni-shadow-sm;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: $uni-font-size-lg;
  font-weight: $uni-font-weight-base;
  color: $uni-main-color;
}

.add-sub-btn {
  padding: 12rpx 24rpx;
  background: $uni-primary-light;
  color: $uni-primary;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-sm;
  border: none;
}

.sub-community-item {
  padding: 24rpx;
  background: $uni-bg-color-lighter;
  border-radius: $uni-radius-base;
  margin-bottom: 16rpx;
}

.sub-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.sub-item-title {
  font-size: $uni-font-size-base;
  color: $uni-main-color;
  font-weight: $uni-font-weight-base;
}

.remove-sub-btn {
  padding: 8rpx 16rpx;
  background: $uni-error-light;
  color: $uni-error;
  border-radius: $uni-radius-sm;
  font-size: $uni-font-size-xs;
  border: none;
}

.mt-16 {
  margin-top: 16rpx;
}

.empty-sub {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: $uni-bg-color-white;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  @include safe-area-bottom;
}

.split-btn {
  width: 100%;
  height: 88rpx;
  @include btn-primary;
  border: none;

  &:disabled {
    background: $uni-bg-color-grey;
    color: $uni-secondary-color;
    box-shadow: none;
  }
}
</style>
