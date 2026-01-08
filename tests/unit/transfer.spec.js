/**
 * 用户批量转移功能单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransferStore } from '@/store/modules/transfer'
import { transferUsersBatch, getManagerCommunities } from '@/api/community'

// Mock API
vi.mock('@/api/community', () => ({
  transferUsersBatch: vi.fn(),
  getManagerCommunities: vi.fn()
}))

describe('useTransferStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('多选模式管理', () => {
    it('应该能够进入多选模式', () => {
      const store = useTransferStore()

      store.enterMultiSelectMode()

      expect(store.isMultiSelectMode).toBe(true)
      expect(store.selectedUserIds).toEqual([])
      expect(store.targetCommunityId).toBe(null)
    })

    it('应该能够退出多选模式', () => {
      const store = useTransferStore()

      store.enterMultiSelectMode()
      store.toggleUserSelection(1)
      store.toggleUserSelection(2)

      store.exitMultiSelectMode()

      expect(store.isMultiSelectMode).toBe(false)
      expect(store.selectedUserIds).toEqual([])
    })
  })

  describe('用户选择', () => {
    it('应该能够选择用户', () => {
      const store = useTransferStore()

      store.enterMultiSelectMode()
      store.toggleUserSelection(1)

      expect(store.selectedUserIds).toEqual([1])
      expect(store.isUserSelected(1)).toBe(true)
    })

    it('应该能够取消选择用户', () => {
      const store = useTransferStore()

      store.enterMultiSelectMode()
      store.toggleUserSelection(1)
      store.toggleUserSelection(1)

      expect(store.selectedUserIds).toEqual([])
      expect(store.isUserSelected(1)).toBe(false)
    })

    it('应该限制最多选择10个用户', () => {
      const store = useTransferStore()

      store.enterMultiSelectMode()

      // 选择10个用户
      for (let i = 1; i <= 10; i++) {
        store.toggleUserSelection(i)
      }

      expect(store.selectedCount).toBe(10)
      expect(store.isMaxSelected).toBe(true)

      // 尝试选择第11个用户
      store.toggleUserSelection(11)

      expect(store.selectedCount).toBe(10)
      expect(store.error).toBe('一次最多选择10个用户')
    })
  })

  describe('目标社区选择', () => {
    it('应该能够选择目标社区', () => {
      const store = useTransferStore()

      store.selectTargetCommunity(2)

      expect(store.targetCommunityId).toBe(2)
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

      const store = useTransferStore()
      await store.loadManagerCommunities(1)

      expect(store.managerCommunities).toEqual(mockCommunities)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('应该处理加载失败', async () => {
      getManagerCommunities.mockRejectedValue(new Error('网络错误'))

      const store = useTransferStore()
      await store.loadManagerCommunities(1)

      expect(store.managerCommunities).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe('网络错误')
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

      const store = useTransferStore()
      store.enterMultiSelectMode()
      store.toggleUserSelection(1)
      store.toggleUserSelection(2)
      store.selectTargetCommunity(2)

      const success = await store.executeTransfer(1)

      expect(success).toBe(true)
      expect(store.transferResult).toEqual(mockResult)
      expect(store.loading).toBe(false)
    })

    it('应该处理未选择目标社区的情况', async () => {
      const store = useTransferStore()
      store.enterMultiSelectMode()
      store.toggleUserSelection(1)

      const success = await store.executeTransfer(1)

      expect(success).toBe(false)
      expect(store.error).toBe('请选择目标社区')
    })

    it('应该处理未选择用户的情况', async () => {
      const store = useTransferStore()
      store.enterMultiSelectMode()
      store.selectTargetCommunity(2)

      const success = await store.executeTransfer(1)

      expect(success).toBe(false)
      expect(store.error).toBe('请选择要转移的用户')
    })

    it('应该处理转移失败', async () => {
      transferUsersBatch.mockResolvedValue({
        code: 1,
        message: '权限不足'
      })

      const store = useTransferStore()
      store.enterMultiSelectMode()
      store.toggleUserSelection(1)
      store.selectTargetCommunity(2)

      const success = await store.executeTransfer(1)

      expect(success).toBe(false)
      expect(store.error).toBe('权限不足')
    })
  })
})