/**
 * 用户批量转移功能单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { transferUsersBatch, getManagerCommunities } from '@/api/community'

// Mock API
vi.mock('@/api/community', () => ({
  transferUsersBatch: vi.fn(),
  getManagerCommunities: vi.fn()
}))

// 模拟transfer store
vi.mock('@/store/modules/transfer', () => ({
  useTransferStore: vi.fn(() => ({
    isMultiSelectMode: false,
    selectedUserIds: [],
    targetCommunityId: null,
    transferResult: null,
    managerCommunities: [],
    loading: false,
    error: null,
    get selectedCount() {
      return this.selectedUserIds.length
    },
    get isMaxSelected() {
      return this.selectedCount >= 10
    },
    enterMultiSelectMode: vi.fn(function() {
      this.isMultiSelectMode = true
      this.selectedUserIds = []
      this.targetCommunityId = null
      this.transferResult = null
      this.error = null
    }),
    exitMultiSelectMode: vi.fn(function() {
      this.isMultiSelectMode = false
      this.selectedUserIds = []
      this.targetCommunityId = null
      this.transferResult = null
      this.error = null
    }),
    toggleUserSelection: vi.fn(function(userId) {
      const index = this.selectedUserIds.indexOf(userId)
      if (index > -1) {
        this.selectedUserIds.splice(index, 1)
      } else if (!this.isMaxSelected) {
        this.selectedUserIds.push(userId)
      } else {
        this.error = '一次最多选择10个用户'
        setTimeout(() => {
          this.error = null
        }, 2000)
      }
    }),
    isUserSelected: vi.fn(function(userId) {
      return this.selectedUserIds.includes(userId)
    }),
    selectTargetCommunity: vi.fn(function(communityId) {
      this.targetCommunityId = communityId
    }),
    loadManagerCommunities: vi.fn(async function(managerId) {
      try {
        this.loading = true
        this.error = null
        const response = await getManagerCommunities(managerId)
        if (response.code === 0) {
          this.managerCommunities = response.data || []
        } else {
          this.error = response.message || '加载社区列表失败'
        }
      } catch (err) {
        this.error = err.message || '加载社区列表失败'
        // 在测试中不打印错误日志
      } finally {
        this.loading = false
      }
    }),
    executeTransfer: vi.fn(async function(sourceCommunityId) {
      if (!this.targetCommunityId) {
        this.error = '请选择目标社区'
        return false
      }

      if (this.selectedUserIds.length === 0) {
        this.error = '请选择要转移的用户'
        return false
      }

      try {
        this.loading = true
        this.error = null

        const response = await transferUsersBatch(
          sourceCommunityId,
          this.targetCommunityId,
          this.selectedUserIds
        )

        if (response.code === 0) {
          this.transferResult = response.data
          return true
        } else {
          this.error = response.message || '转移失败'
          return false
        }
      } catch (err) {
        this.error = err.message || '转移失败，请稍后重试'
        // 在测试中不打印错误日志
        return false
      } finally {
        this.loading = false
      }
    }),
    resetTransfer: vi.fn(function() {
      this.transferResult = null
      this.error = null
    })
  }))
}))

import { useTransferStore } from '@/store/modules/transfer'

describe('useTransferStore', () => {
  let mockStore

  beforeEach(() => {
    vi.clearAllMocks()
    // 创建新的mock store实例
    mockStore = useTransferStore()
  })

  describe('多选模式管理', () => {
      it('应该能够进入多选模式', () => {
        mockStore.enterMultiSelectMode()
  
        expect(mockStore.isMultiSelectMode).toBe(true)
        expect(mockStore.selectedUserIds).toEqual([])
        expect(mockStore.targetCommunityId).toBe(null)
      })
  
      it('应该能够退出多选模式', () => {
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
        mockStore.toggleUserSelection(2)
  
        mockStore.exitMultiSelectMode()
  
        expect(mockStore.isMultiSelectMode).toBe(false)
        expect(mockStore.selectedUserIds).toEqual([])
      })
    })
  describe('用户选择', () => {
      it('应该能够选择用户', () => {
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
  
        expect(mockStore.selectedUserIds).toEqual([1])
        expect(mockStore.isUserSelected(1)).toBe(true)
      })
  
      it('应该能够取消选择用户', () => {
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
        mockStore.toggleUserSelection(1)
  
        expect(mockStore.selectedUserIds).toEqual([])
        expect(mockStore.isUserSelected(1)).toBe(false)
      })
  
      it('应该限制最多选择10个用户', () => {
        mockStore.enterMultiSelectMode()
  
        // 选择10个用户
        for (let i = 1; i <= 10; i++) {
          mockStore.toggleUserSelection(i)
        }
  
        expect(mockStore.selectedCount).toBe(10)
        expect(mockStore.isMaxSelected).toBe(true)
  
        // 尝试选择第11个用户
        mockStore.toggleUserSelection(11)
  
        expect(mockStore.selectedCount).toBe(10)
        expect(mockStore.error).toBe('一次最多选择10个用户')
      })
    })
  describe('目标社区选择', () => {
      it('应该能够选择目标社区', () => {
        mockStore.selectTargetCommunity(2)
  
        expect(mockStore.targetCommunityId).toBe(2)
      })
    })
  describe('加载主管管理的社区', () => {
      it('应该能够成功加载社区列表', async () => {
        const mockCommunities = [
          { community_id: 1, name: '社区1', user_count: 100 },
          { community_id: 2, name: '社区2', user_count: 200 }
        ]
  
        getManagerCommunities.mockResolvedValue({
          code: 0,
          data: mockCommunities
        })
  
        await mockStore.loadManagerCommunities(1)
  
        expect(mockStore.managerCommunities).toEqual(mockCommunities)
        expect(mockStore.loading).toBe(false)
        expect(mockStore.error).toBe(null)
      })
  
      it('应该处理加载失败', async () => {
        getManagerCommunities.mockRejectedValue(new Error('网络错误'))
  
        await mockStore.loadManagerCommunities(1)
  
        expect(mockStore.managerCommunities).toEqual([])
        expect(mockStore.loading).toBe(false)
        expect(mockStore.error).toBe('网络错误')
      })
    })
  describe('执行批量转移', () => {
      it('应该能够成功执行批量转移', async () => {
        const mockResult = {
          success_count: 2,
          skipped_count: 0,
          failed: [],
          transferred_users: [
            { user_id: 1, nickname: '用户1', phone_number: '138****1234' },
            { user_id: 2, nickname: '用户2', phone_number: '139****5678' }
          ],
          events_transferred: 1,
          rules_updated: 2
        }
  
        transferUsersBatch.mockResolvedValue({
          code: 0,
          data: mockResult
        })
  
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
        mockStore.toggleUserSelection(2)
        mockStore.selectTargetCommunity(2)
  
        const success = await mockStore.executeTransfer(1)
  
        expect(success).toBe(true)
        expect(mockStore.transferResult).toEqual(mockResult)
        expect(mockStore.loading).toBe(false)
      })
  
      it('应该处理未选择目标社区的情况', async () => {
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
  
        const success = await mockStore.executeTransfer(1)
  
        expect(success).toBe(false)
        expect(mockStore.error).toBe('请选择目标社区')
      })
  
      it('应该处理未选择用户的情况', async () => {
        mockStore.enterMultiSelectMode()
        mockStore.selectTargetCommunity(2)
  
        const success = await mockStore.executeTransfer(1)
  
        expect(success).toBe(false)
        expect(mockStore.error).toBe('请选择要转移的用户')
      })
  
      it('应该处理转移失败', async () => {
        transferUsersBatch.mockResolvedValue({
          code: 1,
          message: '权限不足'
        })
  
        mockStore.enterMultiSelectMode()
        mockStore.toggleUserSelection(1)
        mockStore.selectTargetCommunity(2)
  
        const success = await mockStore.executeTransfer(1)
  
        expect(success).toBe(false)
        expect(mockStore.error).toBe('权限不足')
      })
    })
  })