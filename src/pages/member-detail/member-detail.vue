<template>
  <view class="member-detail-container">
    <!-- 用户头部 -->
    <view class="member-header">
      <image
        :src="memberInfo.avatar_url || DEFAULT_AVATAR"
        class="member-avatar-large"
        mode="aspectFill"
      />
      <text class="member-name-large">
        {{ memberInfo.nickname || '未知用户' }}
      </text>
      <view class="member-meta">
        <text class="member-phone">
          📱 {{ formatPhone(memberInfo.phone_number) }}
        </text>
        <text
          v-if="memberInfo.join_time"
          class="join-time"
        >
          📅 {{ formatDate(memberInfo.join_time) }}
        </text>
      </view>
    </view>

    <!-- 基本信息 -->
    <uni-section title="基本信息">
      <uni-list>
        <uni-list-item
          title="联系电话"
          :right-text="memberInfo.phone_number || '未绑定'"
        />
        <uni-list-item
          title="加入时间"
          :right-text="formatDate(memberInfo.join_time)"
        />
        <uni-list-item
          v-if="memberInfo.address"
          title="地址"
          :right-text="memberInfo.address"
        />
      </uni-list>
    </uni-section>

    <!-- 病史信息 -->
    <uni-section
      title="病史信息"
      v-if="canViewMedicalHistory"
    >
      <view class="medical-history-section">
        <MedicalHistoryList
          v-if="!isEditingMedicalHistory"
          :user-id="memberInfo.user_id"
          :readonly="!canEditMedicalHistory"
          @edit="handleEditMedicalHistory"
        />
        <view
          v-else
          class="editing-container"
        >
          <MedicalHistoryForm
            :model-value="editingMedicalHistory"
            @submit="handleSaveMedicalHistory"
            @cancel="handleCancelEditMedicalHistory"
          />
        </view>
      </view>
    </uni-section>

    <!-- 监护人信息 -->
    <uni-section
      title="监护人信息"
      v-if="guardians.length > 0"
    >
      <uni-list>
        <uni-list-item
          v-for="guardian in guardians"
          :key="guardian.user_id"
          :title="guardian.nickname"
          :note="formatPhone(guardian.phone_number)"
          show-arrow
          @click="viewGuardianDetail(guardian)"
        >
          <template v-slot:footer>
            <text class="guardian-tag">
              {{ guardian.relationship || '监护人' }}
            </text>
          </template>
        </uni-list-item>
      </uni-list>
    </uni-section>

    <!-- 监护关系信息 -->
    <uni-section
      title="监护对象"
      v-if="wards.length > 0"
    >
      <uni-list>
        <uni-list-item
          v-for="ward in wards"
          :key="ward.user_id"
          :title="ward.nickname"
          :note="formatPhone(ward.phone_number)"
          show-arrow
          @click="viewWardDetail(ward)"
        >
          <template v-slot:footer>
            <text class="ward-tag">
              {{ ward.relationship || '监护对象' }}
            </text>
          </template>
        </uni-list-item>
      </uni-list>
    </uni-section>

    <!-- 浏览记录入口 -->
    <uni-section
      title="浏览记录"
      v-if="canViewLogs"
    >
      <view class="view-logs-section">
        <button
          class="view-logs-btn"
          @click="viewProfileViewLogs"
        >
          查看浏览记录
        </button>
      </view>
    </uni-section>

    <!-- 监护人详情弹窗 -->
    <uni-popup
      ref="guardianPopup"
      type="center"
    >
      <GuardianDetailModal
        :guardian="selectedGuardian"
        :ward="memberInfo"
        @close="closeGuardianDetail"
      />
    </uni-popup>

    <!-- 监护对象详情弹窗 -->
    <uni-popup
      ref="wardPopup"
      type="center"
    >
      <MemberDetailModal
        :member="selectedWard"
        @close="closeWardDetail"
      />
    </uni-popup>

    <!-- 浏览记录弹窗 -->
    <uni-popup
      ref="viewLogsPopup"
      type="bottom"
    >
      <ProfileViewLogs
        :community-id="currentCommunityId"
        :viewed-user-id="memberInfo.user_id"
        @close="closeViewLogs"
      />
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useCommunityStore } from '@/store/modules/community'
import { formatPhone, formatDate } from '@/utils/community'
import { DEFAULT_AVATAR } from '@/constants/community'
import {
  getUserMedicalHistories,
  logProfileView
} from '@/api/user'
import { checkPagePermission } from '@/utils/permission'
import { PagePath } from '@/constants/permissions'
import MedicalHistoryList from '@/components/medical-history/MedicalHistoryList.vue'
import MedicalHistoryForm from '@/components/medical-history/MedicalHistoryForm.vue'
import GuardianDetailModal from '@/components/community/GuardianDetailModal.vue'
import MemberDetailModal from '@/components/community/MemberDetailModal.vue'
import ProfileViewLogs from '@/components/community/ProfileViewLogs.vue'

const userStore = useUserStore()
const communityStore = useCommunityStore()

// 成员信息
const memberInfo = ref({
  user_id: '',
  nickname: '',
  avatar_url: '',
  phone_number: '',
  address: '',
  join_time: ''
})

// 当前社区ID
const currentCommunityId = ref('')

// 监护人列表
const guardians = ref([])

// 监护对象列表
const wards = ref([])

// 病史编辑状态
const isEditingMedicalHistory = ref(false)
const editingMedicalHistory = ref(null)

// 选中的监护人
const selectedGuardian = ref(null)

// 选中的监护对象
const selectedWard = ref(null)

// 弹窗引用
const guardianPopup = ref(null)
const wardPopup = ref(null)
const viewLogsPopup = ref(null)

// 权限计算
const canViewMedicalHistory = computed(() => {
  // 工作人员可以查看病史
  return userStore.isCommunityStaff
})

const canEditMedicalHistory = computed(() => {
  // 只有工作人员可以编辑病史
  return userStore.isCommunityStaff
})

const canViewLogs = computed(() => {
  // 工作人员和主管可以查看浏览记录
  return userStore.isCommunityManager || userStore.isCommunityStaff
})

// 加载成员详情
const loadMemberDetail = async (userId) => {
  try {
    uni.showLoading({ title: '加载中...' })

    // 从 store 中查找用户
    const user = communityStore.communityUsers.find(u => u.user_id === userId)

    if (user) {
      memberInfo.value = { ...user }
    } else {
      // 如果 store 中没有，使用传入的信息
      memberInfo.value = {
        user_id: userId,
        nickname: '未知用户',
        avatar_url: '',
        phone_number: '',
        join_time: new Date().toISOString()
      }
    }

    // 记录查看日志
    if (userId !== userStore.userInfo?.user_id) {
      await logProfileView(userId, currentCommunityId.value)
    }

    uni.hideLoading()
  } catch (error) {
    console.error('加载成员详情失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 加载监护人信息
const loadGuardians = async (userId) => {
  try {
    // TODO: 从后端 API 获取监护人列表
    // 暂时使用空数组
    guardians.value = []
  } catch (error) {
    console.error('加载监护人信息失败:', error)
  }
}

// 加载监护对象信息
const loadWards = async (userId) => {
  try {
    // TODO: 从后端 API 获取监护对象列表
    // 暂时使用空数组
    wards.value = []
  } catch (error) {
    console.error('加载监护对象信息失败:', error)
  }
}

// 查看监护人详情
const viewGuardianDetail = (guardian) => {
  selectedGuardian.value = guardian
  guardianPopup.value?.open()
}

// 关闭监护人详情
const closeGuardianDetail = () => {
  guardianPopup.value?.close()
  selectedGuardian.value = null
}

// 查看监护对象详情
const viewWardDetail = (ward) => {
  selectedWard.value = ward
  wardPopup.value?.open()
}

// 关闭监护对象详情
const closeWardDetail = () => {
  wardPopup.value?.close()
  selectedWard.value = null
}

// 查看浏览记录
const viewProfileViewLogs = () => {
  viewLogsPopup.value?.open()
}

// 关闭浏览记录
const closeViewLogs = () => {
  viewLogsPopup.value?.close()
}

// 处理编辑病史
const handleEditMedicalHistory = (history) => {
  editingMedicalHistory.value = history
  isEditingMedicalHistory.value = true
}

// 处理保存病史
const handleSaveMedicalHistory = async (formData) => {
  try {
    uni.showLoading({ title: '保存中...' })

    // TODO: 调用 API 保存病史
    // const result = editingMedicalHistory.value
    //   ? await updateMedicalHistory(editingMedicalHistory.value.id, formData)
    //   : await addMedicalHistory({ ...formData, user_id: memberInfo.value.user_id })

    await new Promise(resolve => setTimeout(resolve, 500))

    uni.hideLoading()
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })

    isEditingMedicalHistory.value = false
    editingMedicalHistory.value = null
  } catch (error) {
    console.error('保存病史失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  }
}

// 取消编辑病史
const handleCancelEditMedicalHistory = () => {
  isEditingMedicalHistory.value = false
  editingMedicalHistory.value = null
}

onLoad(async (options) => {
  // 页面权限检查
  if (!checkPagePermission(PagePath.COMMUNITY_USER_MANAGE)) {
    return
  }

  if (options.userId) {
    currentCommunityId.value = options.communityId || communityStore.currentCommunity?.id || ''
    await loadMemberDetail(options.userId)
    await loadGuardians(options.userId)
    await loadWards(options.userId)
  }
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.member-detail-container {
  min-height: 100vh;
  @include bg-gradient;
  padding-bottom: 32rpx;
}

.member-header {
  background: $uni-bg-color-white;
  padding: 64rpx 32rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.member-avatar-large {
  width: 160rpx;
  height: 160rpx;
  border-radius: $uni-radius-full;
  margin: 0 auto 24rpx;
  background: $uni-bg-color-grey;
  display: block;
}

.member-name-large {
  display: block;
  font-size: $uni-font-size-xxl;
  font-weight: bold;
  color: $uni-main-color;
  margin-bottom: 16rpx;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
}

.member-phone {
  font-size: $uni-font-size-base;
  color: $uni-base-color;
}

.join-time {
  font-size: $uni-font-size-sm;
  color: $uni-secondary-color;
}

.medical-history-section {
  padding: 32rpx;
  background: $uni-bg-color-white;
}

.editing-container {
  padding: 32rpx;
  background: $uni-bg-color-white;
}

.guardian-tag,
.ward-tag {
  padding: 8rpx 16rpx;
  background: $uni-info-light;
  color: $uni-info;
  border-radius: $uni-radius-base;
  font-size: $uni-font-size-sm;
  margin-left: 16rpx;
}

.ward-tag {
  background: $uni-warning-light;
  color: $uni-warning;
}

.view-logs-section {
  padding: 32rpx;
  background: $uni-bg-color-white;
}

.view-logs-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: $uni-primary;
  color: $uni-white;
  border: none;
  border-radius: $uni-radius-lg;
  font-size: $uni-font-size-lg;
}

.view-logs-btn:active {
  opacity: 0.8;
}
</style>
