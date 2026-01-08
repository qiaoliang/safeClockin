<template>
  <view class="community-details-new-container">
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

    <!-- 主容器 -->
    <view class="main-container">
      <!-- 顶部导航 -->
      <CommunityDetailHeader 
        :title="pageTitle"
        @back="handleBack"
        @settings="handleSettings"
      />

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
          @click="loadCommunityDetail"
        >
          重试
        </button>
      </view>

      <!-- 内容区域 -->
      <view
        v-else
        class="content-area"
      >
        <!-- 社区基本信息卡片 -->
        <CommunityInfoCard 
          :community="communityData"
          :stats="communityStats"
        />

        <!-- Tab切换栏 -->
        <CommunityTabBar 
          :tabs="tabs"
          :active-tab="activeTab"
          @tab-change="handleTabChange"
        />

        <!-- Tab内容区域 -->
        <view class="tab-content">
          <!-- 专员管理（新版） -->
          <CommunityStaffManagement 
            v-if="activeTab === 'staff'"
            :community-id="communityId"
          />

          <!-- 用户管理 -->
          <CommunityUsersTab
            v-if="activeTab === 'users'"
            :user-list="userList"
            :community-id="communityId"
            @add-user="handleAddUser"
            @remove-user="handleRemoveUser"
            @refresh="refreshUserList"
            @batch-transfer="handleBatchTransfer"
          />

          <!-- 规则管理（分组显示） -->
          <CommunityRulesTabGrouped 
            v-if="activeTab === 'rules'"
            :community-id="communityId"
            @add-rule="handleAddRule"
            @edit-rule="handleEditRule"
            @remove-rule="handleRemoveRule"
          />

          <!-- 分配管理 -->
          <CommunityAssignTab 
            v-if="activeTab === 'assign'"
            :assign-list="assignList"
            :community-id="communityId"
            @assign="handleAssign"
            @unassign="handleUnassign"
          />

          <!-- 应援管理 -->
          <CommunitySupportTab 
            v-if="activeTab === 'support'"
            :support-list="supportList"
            :community-id="communityId"
            @add-support="handleAddSupport"
            @complete-support="handleCompleteSupport"
          />
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom" />

    <!-- 模态框 -->
    <CommunitySettingsModal 
      v-if="showSettingsModal"
      :community="communityData"
      @close="closeSettingsModal"
      @edit="handleEditCommunity"
      @delete="handleDeleteCommunity"
    />

    <CommunityAddStaffModal 
      v-if="showAddStaffModal"
      :community-id="communityId"
      @close="closeAddStaffModal"
      @confirm="confirmAddStaff"
    />

    <CommunityAddUserModal
      :visible="showAddUserModal"
      :community-id="communityId"
      :community-name="communityData.name"
      @close="closeAddUserModal"
      @confirm="confirmAddUser"
    />

    <!-- 批量转移相关组件 -->
    <TargetCommunitySelector
      ref="targetCommunitySelectorRef"
      :source-community-id="communityId"
      @select="handleSelectTargetCommunity"
      @close="transferStore.exitMultiSelectMode"
    />

    <TransferPreviewModal
      ref="transferPreviewModalRef"
      :source-community-name="communityData.name"
      :target-community-name="selectedTargetCommunity?.name || ''"
      :user-count="transferStore.selectedCount"
      @confirm="handleConfirmTransfer"
      @cancel="transferStore.exitMultiSelectMode"
    />

    <TransferResultModal
      ref="transferResultModalRef"
      :result="transferStore.transferResult"
      @confirm="handleCloseTransferResult"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useCommunityStore } from '@/store/modules/community'
import { useTransferStore } from '@/store/modules/transfer'
import { getCommunityDetail, getCommunityStaffList, getCommunityUsers } from '@/api/community'
import { getCommunityRules } from '@/api/community-checkin'
import { authApi } from '@/api/auth'
import CommunityDetailHeader from './components/CommunityDetailHeader.vue'
import CommunityInfoCard from './components/CommunityInfoCard.vue'
import CommunityTabBar from './components/CommunityTabBar.vue'
import CommunityStaffManagement from './components/tabs/CommunityStaffManagement.vue'
import CommunityUsersTab from './components/tabs/CommunityUsersTab.vue'
import CommunityRulesTabGrouped from './components/tabs/CommunityRulesTabGrouped.vue'
import CommunityAssignTab from './components/tabs/CommunityAssignTab.vue'
import CommunitySupportTab from './components/tabs/CommunitySupportTab.vue'
import CommunitySettingsModal from './components/modals/CommunitySettingsModal.vue'
import CommunityAddStaffModal from './components/modals/CommunityAddStaffModal.vue'
import CommunityAddUserModal from './components/modals/CommunityAddUserModal.vue'
import TargetCommunitySelector from './components/modals/TargetCommunitySelector.vue'
import TransferPreviewModal from './components/modals/TransferPreviewModal.vue'
import TransferResultModal from './components/modals/TransferResultModal.vue'

// API
import { addCommunityStaff } from '@/api/community'

// Store
const userStore = useUserStore()
const communityStore = useCommunityStore()
const transferStore = useTransferStore()

// 批量转移相关
const targetCommunitySelectorRef = ref(null)
const transferPreviewModalRef = ref(null)
const transferResultModalRef = ref(null)
const selectedTargetCommunity = ref(null)

// 页面参数
const communityId = ref('')
const pageTitle = ref('社区详情')

// 数据状态
const loading = ref(true)
const error = ref('')
const communityData = ref({})
const communityStats = ref({})

// Tab状态
const tabs = ref([
  { id: 'staff', name: '专员', icon: 'user-tie' },
  { id: 'users', name: '用户', icon: 'users' },
  { id: 'rules', name: '规则', icon: 'list-check' },
  { id: 'assign', name: '分配', icon: 'user-check' },
  { id: 'support', name: '应援', icon: 'hands-helping' }
])
const activeTab = ref('staff')

// 列表数据
const staffList = ref([])
const userList = ref([])
const assignList = ref([])
const supportList = ref([])

// 加载状态标记
const userListLoaded = ref(false)

// 模态框状态
const showSettingsModal = ref(false)
const showAddStaffModal = ref(false)
const showAddUserModal = ref(false)

// 权限检查 - 统一的权限检查函数
const checkCommunityPermission = (userRole) => {
  if (!userRole || !communityId.value) return false
  // 超级管理员可以管理所有社区
  if (userRole === 4) return true
  // 社区工作人员可以管理自己分配的社区
  if (userRole === 3 || userRole === 2) {
    return communityStore.communities.some(c => c.community_id == communityId.value)
  }
  return false
}

const hasEditPermission = computed(() => checkCommunityPermission(userStore.role))
const hasViewPermission = computed(() => checkCommunityPermission(userStore.role))

// 通用确认对话框处理函数
const handleConfirmAction = async ({ title, content, loadingTitle, successTitle, errorTitle, onConfirm }) => {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: loadingTitle, mask: true })
            await onConfirm()
            uni.showToast({ title: successTitle, icon: 'success' })
            resolve(true)
          } catch (err) {
            console.error(`${title}失败:`, err)
            uni.showToast({ title: err.message || errorTitle, icon: 'none' })
            resolve(false)
          } finally {
            uni.hideLoading()
          }
        } else {
          resolve(false)
        }
      }
    })
  })
}

// URL解码函数
const decodeText = (text) => {
  if (!text || typeof text !== 'string') return text
  
  try {
    // 尝试解码URL编码的文本
    return decodeURIComponent(text)
  } catch (error) {
    // 如果解码失败，返回原文本
    console.warn('URL解码失败:', error)
    return text
  }
}

// 解码社区数据中的文本字段
const decodeCommunityData = (data) => {
  if (!data || typeof data !== 'object') return data
  
  const decoded = { ...data }
  
  // 解码基本文本字段
  if (decoded.name) decoded.name = decodeText(decoded.name)
  if (decoded.description) decoded.description = decodeText(decoded.description)
  if (decoded.location) decoded.location = decodeText(decoded.location)
  
  // 解码创建者信息
  if (decoded.creator && decoded.creator.nickname) {
    decoded.creator.nickname = decodeText(decoded.creator.nickname)
  }
  
  // 解码主管信息
  if (decoded.manager && decoded.manager.nickname) {
    decoded.manager.nickname = decodeText(decoded.manager.nickname)
  }
  
  return decoded
}

// 页面加载
onLoad((options) => {
  // 支持两种参数名：id（新页面）和 communityId（旧页面跳转）
  const id = options.id || options.communityId
  if (id) {
    communityId.value = id
    loadCommunityDetail()
  } else {
    error.value = '未指定社区ID'
    loading.value = false
  }
})

// 页面重新显示时刷新数据（处理从编辑页面返回的情况）
onShow(() => {
  // 如果已经有社区ID，重新加载详情以确保数据是最新的
  if (communityId.value) {
    loadCommunityDetail()
  }
})

// 加载社区详情
const loadCommunityDetail = async () => {
  if (!communityId.value) {
    error.value = '社区ID不能为空'
    loading.value = false
    return
  }
  
  // 检查查看权限
  if (!hasViewPermission.value) {
    error.value = '无权限查看该社区详情'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await getCommunityDetail(communityId.value)
    if (response.code === 1) {
      // 解码API返回的数据
      communityData.value = decodeCommunityData(response.data.community || {})
      
      // 验证返回的数据是否属于当前用户有权限的社区
      if (communityData.value.community_id && communityData.value.community_id.toString() !== communityId.value.toString()) {
        error.value = '数据验证失败'
        communityData.value = {}
      } else {
        // 直接使用API返回的统计数据
        communityStats.value = response.data.stats || {
          staff_count: 0,
          user_count: 0,
          support_count: 0,
          active_events: 0,
          checkin_rate: 0
        }
        
        // 加载各Tab数据（用户列表改为懒加载）
        await Promise.all([
          loadStaffList(),
          // loadUserList(), // 改为懒加载，只在切换到用户Tab时加载
          // loadRuleList(), // 规则列表由CommunityRulesTabGrouped组件自己加载
          loadAssignList(),
          loadSupportList()
          // loadCommunityEventStats() // 统计数据已在社区详情API中返回
        ])
        
        pageTitle.value = communityData.value.name
      }
    } else {
      error.value = response.msg || '获取社区详情失败'
      communityData.value = {}
    }
  } catch (err) {
    console.error('加载社区详情失败:', err)
    error.value = '网络错误，请稍后重试'
    communityData.value = {}
  } finally {
    loading.value = false
  }
}

// 加载专员列表
const loadStaffList = async () => {
  try {
    // 只获取role为staff的专员列表
    const response = await getCommunityStaffList(communityId.value, { role: 'staff' })
    if (response.code === 1) {
      // 根据API契约，后端返回的是staff字段
      staffList.value = response.data.staff || []
    } else {
      console.error('加载专员列表失败:', response.msg)
      staffList.value = []
    }
  } catch (err) {
    console.error('加载专员列表失败:', err)
    staffList.value = []
  }
}

// 加载用户列表（懒加载）
const loadUserList = async () => {
  // 如果已经加载过且列表不为空，直接返回
  // 但如果列表为空（可能是删除后），允许重新加载
  if (userListLoaded.value && userList.value.length > 0) {
    return
  }
  
  try {
    const response = await getCommunityUsers(communityId.value)
    if (response.code === 1) {
      userList.value = response.data.users || []
      userListLoaded.value = true
    } else {
      console.error('加载用户列表失败:', response.msg)
      userList.value = []
      userListLoaded.value = true // 标记为已加载，即使是空列表
    }
  } catch (err) {
    console.error('加载用户列表失败:', err)
    userList.value = []
    userListLoaded.value = true // 标记为已加载，即使是空列表
  }
}



// 加载分配列表
const loadAssignList = async () => {
  try {
    // TODO: 调用API获取分配列表
    assignList.value = [
      { id: '401', staffId: '101', userId: '201', status: '已分配' },
      { id: '402', staffId: '102', userId: '202', status: '已分配' }
    ]
  } catch (err) {
    console.error('加载分配列表失败:', err)
  }
}

// 加载应援列表
const loadSupportList = async () => {
  try {
    // TODO: 调用API获取应援列表
    supportList.value = [
      { id: '501', title: '医疗检查', date: '2024-01-15', status: '进行中' },
      { id: '502', title: '心理辅导', date: '2024-01-16', status: '待处理' }
    ]
  } catch (err) {
    console.error('加载应援列表失败:', err)
  }
}



// 事件处理
const handleBack = () => {
  uni.navigateBack()
}

const handleSettings = () => {
  uni.navigateTo({
    url: `/pages/community-form/community-form?id=${communityId.value}`
  })
}

const handleTabChange = (tabId) => {
  activeTab.value = tabId
  
  // 每次切换到"用户"Tab时都重新加载数据，确保数据是最新的
  if (tabId === 'users') {
    loadUserList()
  }
}

const handleAddStaff = () => {
  showAddStaffModal.value = true
}

const handleRemoveStaff = async (staffId) => {
  await handleConfirmAction({
    title: '确认移除',
    content: '确定要移除该专员吗？',
    loadingTitle: '移除中...',
    successTitle: '移除成功',
    errorTitle: '移除失败',
    onConfirm: async () => {
      const response = await communityStore.removeStaffMember(communityId.value, staffId)
      if (response.code === 1) {
        await loadStaffList()
      } else {
        throw new Error(response.msg || '移除失败')
      }
    }
  })
}

const handleAddUser = () => {
  showAddUserModal.value = true
}

const handleRemoveUser = async (userId) => {
  await handleConfirmAction({
    title: '确认移除',
    content: '确定要移除该用户吗？',
    loadingTitle: '移除中...',
    successTitle: '移除成功',
    errorTitle: '移除失败',
    onConfirm: async () => {
      const response = await communityStore.removeCommunityUser(communityId.value, userId)
      if (response.code === 1) {
        userListLoaded.value = false
        userList.value = []
        await loadUserList()
      } else {
        throw new Error(response.msg || '移除失败')
      }
    }
  })
}

const handleAddRule = () => {
  uni.showToast({ title: '添加规则功能开发中', icon: 'none' })
}

const handleEditRule = (ruleId) => {
  uni.showToast({ title: '编辑规则功能开发中', icon: 'none' })
}

const handleRemoveRule = (ruleId) => {
  uni.showToast({ title: '删除规则功能开发中', icon: 'none' })
}

const handleAssign = () => {
  uni.showToast({ title: '分配功能开发中', icon: 'none' })
}

const handleUnassign = (assignId) => {
  uni.showToast({ title: '取消分配功能开发中', icon: 'none' })
}

const handleAddSupport = () => {
  uni.showToast({ title: '添加应援功能开发中', icon: 'none' })
}

const handleCompleteSupport = (supportId) => {
  uni.showToast({ title: '完成应援功能开发中', icon: 'none' })
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const handleEditCommunity = () => {
  uni.navigateTo({
    url: `/pages/community-form/community-form?id=${communityId.value}`
  })
}

const handleDeleteCommunity = async () => {
  await handleConfirmAction({
    title: '确认删除',
    content: '确定要删除该社区吗？此操作不可撤销。',
    loadingTitle: '删除中...',
    successTitle: '删除成功',
    errorTitle: '删除失败',
    onConfirm: async () => {
      // TODO: 调用API删除社区
      await new Promise(resolve => setTimeout(resolve, 500))
      setTimeout(() => uni.navigateBack(), 1500)
    }
  })
}

const closeAddStaffModal = () => {
  showAddStaffModal.value = false
}

const confirmAddStaff = async (staffData) => {
  try {
    
    // 调用真实的API添加专员
    const response = await addCommunityStaff({
      community_id: communityId.value,
      user_ids: staffData.userIds,
      role: 'staff'
    })
    
    
    if (response.code === 1) {
      const addedCount = response.data?.added_count || 0
      const failedCount = response.data?.failed_count || 0
      
      if (addedCount > 0) {
        uni.showToast({ 
          title: `成功添加${addedCount}名专员`, 
          icon: 'success' 
        })
        
        // 关闭模态框
        showAddStaffModal.value = false
        
        // 刷新专员列表 - 这是最关键的修复
        await refreshStaffList()
        
      } else {
        uni.showToast({ 
          title: '添加失败', 
          icon: 'error' 
        })
      }
    } else {
      console.error('添加专员失败:', response.msg)
      uni.showToast({ 
        title: response.msg || '添加失败', 
        icon: 'error' 
      })
    }
  } catch (err) {
    console.error('添加专员异常:', err)
    uni.showToast({ title: '添加失败', icon: 'error' })
  }
}

const closeAddUserModal = () => {
  showAddUserModal.value = false
}

const confirmAddUser = async (data) => {
  try {
    uni.showLoading({ title: '处理中...', mask: true })
    
    // 判断处理类型
    if (data.type === 'create') {
      // 安卡大家庭：创建新用户（使用新的专用API）
      const response = await communityStore.createCommunityUser(
        communityId.value,
        {
          nickname: data.userData.nickname,
          phone: data.userData.phone_number,
          remark: data.userData.remark || ''
        }
      )
      
      if (response.code === 1) {
        uni.showToast({ title: '用户创建并添加成功', icon: 'success' })
        // 刷新用户列表
        await refreshUserList()
      } else {
        uni.showToast({ title: response.msg || '创建用户失败', icon: 'none' })
      }
    } else if (data.type === 'add') {
      // 普通社区：添加现有用户（支持批量添加）
      const userIds = data.userIds || [data.userId]
      const response = await communityStore.addCommunityUsers(
        communityId.value,
        userIds
      )
      
      if (response.code === 1) {
        const addedCount = response.data?.added_count || 0
        const totalUsers = userIds.length
        
        if (addedCount > 0) {
          uni.showToast({ 
            title: totalUsers > 1 
              ? `成功添加 ${addedCount} 名用户` 
              : '添加成功',
            icon: 'success' 
          })
        } else {
          uni.showToast({ 
            title: '用户已在社区',
            icon: 'none' 
          })
        }
        
        // 刷新用户列表
        await refreshUserList()
      } else {
        uni.showToast({ title: response.msg || '添加失败', icon: 'none' })
      }
    }
    
    showAddUserModal.value = false
  } catch (err) {
    console.error('处理用户失败:', err)
    uni.showToast({ 
      title: err.message || '操作失败，请重试', 
      icon: 'none' 
    })
  } finally {
    uni.hideLoading()
  }
}

// 刷新函数 - 直接使用 load 函数，无需额外包装
const refreshStaffList = loadStaffList
const refreshUserList = loadUserList

// 批量转移相关方法
const handleBatchTransfer = async (userIds) => {
  console.log('[批量转移] 主组件收到批量转移事件')
  console.log('[批量转移] userIds:', userIds)
  console.log('[批量转移] userStore.userInfo:', userStore.userInfo)
  
  try {
    // 加载主管管理的社区列表
    console.log('[批量转移] 开始加载主管管理的社区列表')
    await transferStore.loadManagerCommunities(userStore.userInfo.user_id)
    console.log('[批量转移] 社区列表加载完成:', transferStore.managerCommunities)

    if (transferStore.managerCommunities.length === 0) {
      uni.showToast({
        title: '您没有管理的其他社区',
        icon: 'none'
      })
      return
    }

    // 打开目标社区选择器
    setTimeout(() => {
      targetCommunitySelectorRef.value?.open()
    }, 100)
  } catch (error) {
    console.error('加载社区列表失败:', error)
    uni.showToast({
      title: '加载社区列表失败',
      icon: 'none'
    })
  }
}

// 选择目标社区后显示预览
const handleSelectTargetCommunity = (community) => {
  selectedTargetCommunity.value = community
  transferStore.selectTargetCommunity(community.community_id)

  // 打开预览确认对话框
  transferPreviewModalRef.value?.open()
}

// 确认转移
const handleConfirmTransfer = async () => {
  try {
    const success = await transferStore.executeTransfer(communityId.value)

    if (success) {
      // 关闭预览对话框
      transferPreviewModalRef.value?.close()

      // 显示结果对话框
      transferResultModalRef.value?.open()

      // 退出多选模式
      transferStore.exitMultiSelectMode()

      // 刷新用户列表
      await refreshUserList()
    }
  } catch (error) {
    console.error('转移失败:', error)
    uni.showToast({
      title: error.message || '转移失败',
      icon: 'none'
    })
    transferPreviewModalRef.value?.setLoading(false)
  }
}

// 关闭结果对话框
const handleCloseTransferResult = () => {
  transferResultModalRef.value?.close()
  transferStore.resetTransfer()
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.community-details-new-container {
  min-height: 100vh;
  @include bg-gradient-primary;
}

.status-bar {
  @include bg-gradient-statusbar;
  padding: $uni-spacing-xs $uni-spacing-base;
  
  .status-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .status-time {
      color: $uni-white;
      font-size: $uni-font-size-sm;
      font-weight: $uni-font-weight-base;
    }
    
    .status-icons {
      display: flex;
      gap: $uni-spacing-sm;
      
      .icon-signal,
      .icon-wifi,
      .icon-battery {
        color: $uni-white;
        font-size: $uni-font-size-sm;
      }
    }
  }
}

.main-container {
  padding-bottom: $uni-spacing-xxl;
}

.loading-container,
.error-container {
  padding: $uni-spacing-xxxl $uni-spacing-xl;
  text-align: center;
  
  .error-text {
    color: $uni-error;
    font-size: $uni-font-size-base;
    margin-bottom: $uni-spacing-xl;
  }
  
  .retry-btn {
    @include btn-primary;
    padding: $uni-spacing-sm $uni-spacing-lg;
    font-size: $uni-font-size-base;
  }
}

.content-area {
  padding: $uni-spacing-base;
}

.tab-content {
  margin-top: $uni-spacing-xl;
}

.safe-bottom {
  @include safe-area-bottom;
}
</style>