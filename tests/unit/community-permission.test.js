// 社区权限单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCurrentUserRole,
  hasActionPermission,
  canManageCommunity,
  canManageStaff,
  canManageUsers,
  isSuperAdmin,
  isCommunityManager,
  isCommunityStaff
} from '@/utils/permission'
import { RoleId } from '@/constants/roles.js'

// 模拟用户store
vi.mock('@/store/modules/user', () => ({
  useUserStore: vi.fn(() => ({
    role: null,
    isLoggedIn: false,
    token: null
  }))
}))

// 导入模拟后的模块
import { useUserStore } from '@/store/modules/user'

describe('社区权限单元测试', () => {
  let mockUserStore

  beforeEach(() => {
    // 重置模拟
    vi.clearAllMocks()

    // 创建新的模拟store
    mockUserStore = {
      role: null,
      isLoggedIn: false,
      token: null
    }

    // 设置模拟实现
    useUserStore.mockReturnValue(mockUserStore)
  })

  describe('getCurrentUserRole函数', () => {
    it('应该返回数字角色ID', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN
      expect(getCurrentUserRole()).toBe(RoleId.SUPER_ADMIN)

      mockUserStore.role = RoleId.MANAGER
      expect(getCurrentUserRole()).toBe(RoleId.MANAGER)

      mockUserStore.role = RoleId.STAFF
      expect(getCurrentUserRole()).toBe(RoleId.STAFF)

      mockUserStore.role = RoleId.SOLO
      expect(getCurrentUserRole()).toBe(RoleId.SOLO)

      mockUserStore.role = null
      expect(getCurrentUserRole()).toBeNull()
    })
  })

  describe('权限检查函数', () => {
    it('超级管理员应该有所有权限', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN
      mockUserStore.isLoggedIn = true

      expect(isSuperAdmin()).toBe(true)
      expect(isCommunityManager()).toBe(false)
      expect(isCommunityStaff()).toBe(false)
      expect(canManageCommunity()).toBe(true)
      expect(canManageStaff()).toBe(true)
      expect(canManageUsers()).toBe(true)
    })

    it('社区主管应该有工作人员和用户管理权限', () => {
      mockUserStore.role = RoleId.MANAGER
      mockUserStore.isLoggedIn = true

      expect(isSuperAdmin()).toBe(false)
      expect(isCommunityManager()).toBe(true)
      expect(isCommunityStaff()).toBe(false)
      expect(canManageCommunity()).toBe(false)
      expect(canManageStaff()).toBe(true)
      expect(canManageUsers()).toBe(true)
    })

    it('社区专员应该只有用户管理权限', () => {
      mockUserStore.role = RoleId.STAFF
      mockUserStore.isLoggedIn = true

      expect(isSuperAdmin()).toBe(false)
      expect(isCommunityManager()).toBe(false)
      expect(isCommunityStaff()).toBe(true)
      expect(canManageCommunity()).toBe(false)
      expect(canManageStaff()).toBe(false)
      expect(canManageUsers()).toBe(true)
    })

    it('普通用户不应该有任何管理权限', () => {
      mockUserStore.role = RoleId.SOLO
      mockUserStore.isLoggedIn = true

      expect(isSuperAdmin()).toBe(false)
      expect(isCommunityManager()).toBe(false)
      expect(isCommunityStaff()).toBe(false)
      expect(canManageCommunity()).toBe(false)
      expect(canManageStaff()).toBe(false)
      expect(canManageUsers()).toBe(false)
    })
  })

  describe('hasActionPermission函数', () => {
    beforeEach(() => {
      mockUserStore.isLoggedIn = true
      mockUserStore.token = 'test-token'
    })

    it('超级管理员应该有所有操作权限', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN

      expect(hasActionPermission('create_community')).toBe(true)
      expect(hasActionPermission('merge_community')).toBe(true)
      expect(hasActionPermission('add_staff')).toBe(true)
      expect(hasActionPermission('add_user')).toBe(true)
    })

    it('社区主管应该有工作人员和用户管理权限', () => {
      mockUserStore.role = RoleId.MANAGER

      expect(hasActionPermission('add_staff')).toBe(true)
      expect(hasActionPermission('add_user')).toBe(true)
      expect(hasActionPermission('create_community')).toBe(false)
      expect(hasActionPermission('merge_community')).toBe(false)
    })

    it('社区专员应该只有用户管理权限', () => {
      mockUserStore.role = RoleId.STAFF

      expect(hasActionPermission('add_user')).toBe(true)
      expect(hasActionPermission('add_staff')).toBe(false) // 不应该有工作人员管理权限
      expect(hasActionPermission('create_community')).toBe(false)
    })

    it('普通用户不应该有任何操作权限', () => {
      mockUserStore.role = RoleId.SOLO

      expect(hasActionPermission('add_user')).toBe(false)
      expect(hasActionPermission('add_staff')).toBe(false)
      expect(hasActionPermission('create_community')).toBe(false)
    })

    it('未登录时应该没有任何权限', () => {
      mockUserStore.isLoggedIn = false
      mockUserStore.role = RoleId.SUPER_ADMIN

      expect(hasActionPermission('add_user')).toBe(false)
      expect(hasActionPermission('create_community')).toBe(false)
    })
  })

  describe('canManageCommunity函数', () => {
    it('只有超级管理员可以管理社区', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN
      expect(canManageCommunity()).toBe(true)

      mockUserStore.role = RoleId.MANAGER
      expect(canManageCommunity()).toBe(false)

      mockUserStore.role = RoleId.STAFF
      expect(canManageCommunity()).toBe(false)
    })
  })

  describe('canManageStaff函数', () => {
    it('超级管理员和社区主管可以管理工作人员', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN
      expect(canManageStaff()).toBe(true)

      mockUserStore.role = RoleId.MANAGER
      expect(canManageStaff()).toBe(true)

      mockUserStore.role = RoleId.STAFF
      expect(canManageStaff()).toBe(false)

      mockUserStore.role = RoleId.SOLO
      expect(canManageStaff()).toBe(false)
    })
  })

  describe('canManageUsers函数', () => {
    it('超级管理员、主管和专员都可以管理用户', () => {
      mockUserStore.role = RoleId.SUPER_ADMIN
      expect(canManageUsers()).toBe(true)

      mockUserStore.role = RoleId.MANAGER
      expect(canManageUsers()).toBe(true)

      mockUserStore.role = RoleId.STAFF
      expect(canManageUsers()).toBe(true)

      mockUserStore.role = RoleId.SOLO
      expect(canManageUsers()).toBe(false)
    })
  })
  
  describe('canManageCommunity函数', () => {
    it('超级管理员应该有社区管理权限', () => {
      expect(canManageCommunity(RoleId.SUPER_ADMIN)).toBe(true)
    })
    
    it('社区主管不应该有社区管理权限', () => {
      expect(canManageCommunity(RoleId.MANAGER)).toBe(false)
    })
    
    it('社区专员不应该有社区管理权限', () => {
      expect(canManageCommunity(RoleId.STAFF)).toBe(false)
    })
    
    it('普通用户不应该有社区管理权限', () => {
      expect(canManageCommunity(RoleId.SOLO)).toBe(false)
    })
  })
  
  describe('canManageStaff函数', () => {
    it('超级管理员应该有工作人员管理权限', () => {
      expect(canManageStaff(RoleId.SUPER_ADMIN)).toBe(true)
    })
    
    it('社区主管应该有工作人员管理权限', () => {
      expect(canManageStaff(RoleId.MANAGER)).toBe(true)
    })
    
    it('社区专员不应该有工作人员管理权限', () => {
      expect(canManageStaff(RoleId.STAFF)).toBe(false)
    })
    
    it('普通用户不应该有工作人员管理权限', () => {
      expect(canManageStaff(RoleId.SOLO)).toBe(false)
    })
  })
  
  describe('canManageUsers函数', () => {
    it('超级管理员应该有用户管理权限', () => {
      expect(canManageUsers(RoleId.SUPER_ADMIN)).toBe(true)
    })
    
    it('社区主管应该有用户管理权限', () => {
      expect(canManageUsers(RoleId.MANAGER)).toBe(true)
    })
    
    it('社区专员应该有用户管理权限', () => {
      expect(canManageUsers(RoleId.STAFF)).toBe(true)
    })
    
    it('普通用户不应该有用户管理权限', () => {
      expect(canManageUsers(RoleId.SOLO)).toBe(false)
    })
  })
  
  describe('isSuperAdmin函数', () => {
    it('应该正确识别超级管理员', () => {
      expect(isSuperAdmin(RoleId.SUPER_ADMIN)).toBe(true)
    })
    
    it('应该正确排除非超级管理员', () => {
      expect(isSuperAdmin(RoleId.MANAGER)).toBe(false)
      expect(isSuperAdmin(RoleId.STAFF)).toBe(false)
      expect(isSuperAdmin(RoleId.SOLO)).toBe(false)
    })
  })
  
  describe('isCommunityManager函数', () => {
    it('应该正确识别社区主管', () => {
      expect(isCommunityManager(RoleId.MANAGER)).toBe(true)
    })
    
    it('应该正确排除非社区主管', () => {
      expect(isCommunityManager(RoleId.SUPER_ADMIN)).toBe(false)
      expect(isCommunityManager(RoleId.STAFF)).toBe(false)
      expect(isCommunityManager(RoleId.SOLO)).toBe(false)
    })
  })
  
  describe('isCommunityStaff函数', () => {
    it('应该正确识别社区专员', () => {
      expect(isCommunityStaff(RoleId.STAFF)).toBe(true)
    })
    
    it('应该正确排除非社区专员', () => {
      expect(isCommunityStaff(RoleId.SUPER_ADMIN)).toBe(false)
      expect(isCommunityStaff(RoleId.MANAGER)).toBe(false)
      expect(isCommunityStaff(RoleId.SOLO)).toBe(false)
    })
  })
})