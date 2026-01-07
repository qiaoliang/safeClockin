/**
 * 用户批量转移状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transferUsersBatch, getManagerCommunities } from '@/api/community'

export const useTransferStore = defineStore('transfer', () => {
  // 状态
  const isMultiSelectMode = ref(false)
  const selectedUserIds = ref([])
  const targetCommunityId = ref(null)
  const transferResult = ref(null)
  const managerCommunities = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const selectedCount = computed(() => selectedUserIds.value.length)
  const isMaxSelected = computed(() => selectedCount.value >= 10)

  // 方法
  const enterMultiSelectMode = () => {
    isMultiSelectMode.value = true
    selectedUserIds.value = []
    targetCommunityId.value = null
    transferResult.value = null
    error.value = null
  }

  const exitMultiSelectMode = () => {
    isMultiSelectMode.value = false
    selectedUserIds.value = []
    targetCommunityId.value = null
    transferResult.value = null
    error.value = null
  }

  const toggleUserSelection = (userId) => {
    const index = selectedUserIds.value.indexOf(userId)
    if (index > -1) {
      // 取消选择
      selectedUserIds.value.splice(index, 1)
    } else if (!isMaxSelected.value) {
      // 选择用户（未达到最大限制）
      selectedUserIds.value.push(userId)
    } else {
      // 已达到最大限制
      error.value = '一次最多选择10个用户'
      setTimeout(() => {
        error.value = null
      }, 2000)
    }
  }

  const isUserSelected = (userId) => {
    return selectedUserIds.value.includes(userId)
  }

  const selectTargetCommunity = (communityId) => {
    targetCommunityId.value = communityId
  }

  const loadManagerCommunities = async (managerId) => {
    try {
      loading.value = true
      error.value = null
      const response = await getManagerCommunities(managerId)
      if (response.code === 0) {
        managerCommunities.value = response.data || []
      } else {
        error.value = response.message || '加载社区列表失败'
      }
    } catch (err) {
      error.value = err.message || '加载社区列表失败'
      console.error('加载主管管理的社区列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  const executeTransfer = async (sourceCommunityId) => {
    if (!targetCommunityId.value) {
      error.value = '请选择目标社区'
      return false
    }

    if (selectedUserIds.value.length === 0) {
      error.value = '请选择要转移的用户'
      return false
    }

    try {
      loading.value = true
      error.value = null

      const response = await transferUsersBatch(
        sourceCommunityId,
        targetCommunityId.value,
        selectedUserIds.value
      )

      if (response.code === 0) {
        transferResult.value = response.data
        return true
      } else {
        error.value = response.message || '转移失败'
        return false
      }
    } catch (err) {
      error.value = err.message || '转移失败，请稍后重试'
      console.error('批量转移用户失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const resetTransfer = () => {
    transferResult.value = null
    error.value = null
  }

  return {
    // 状态
    isMultiSelectMode,
    selectedUserIds,
    targetCommunityId,
    transferResult,
    managerCommunities,
    loading,
    error,

    // 计算属性
    selectedCount,
    isMaxSelected,

    // 方法
    enterMultiSelectMode,
    exitMultiSelectMode,
    toggleUserSelection,
    isUserSelected,
    selectTargetCommunity,
    loadManagerCommunities,
    executeTransfer,
    resetTransfer
  }
})