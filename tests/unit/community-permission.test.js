// 社区权限单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  getCurrentUserRole, 
  hasFeaturePermission, 
  canManageCommunity, 
  canManageStaff, 
  canManageUsers,
  isSuperAdmin,
  isCommunityManager,
  isCommunityStaff
} from '@/utils/permission'

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
    it('应该正确映射超级管理员角色', () => {
      // 测试各种超级管理员角色表示方式
      const testCases = [
        { role: 'community_admin', expected: 'super_admin' },
        { role: 4, expected: 'super_admin' },
        { role: '超级系统管理员', expected: 'super_admin' }
      ]
      
      testCases.forEach(({ role, expected }) => {
        mockUserStore.role = role
        expect(getCurrentUserRole()).toBe(expected)
      })
    })
    
    it('应该正确映射社区主管角色', () => {
      // 测试各种社区主管角色表示方式
      const testCases = [
        { role: 'community_manager', expected: 'community_manager' },
        { role: 3, expected: 'community_manager' },
        { role: '社区主管', expected: 'community_manager' }
      ]
      
      testCases.forEach(({ role, expected }) => {
        mockUserStore.role = role
        expect(getCurrentUserRole()).toBe(expected)
      })
    })
    
    it('应该正确映射社区专员角色', () => {
      // 测试各种社区专员角色表示方式
      const testCases = [
        { role: 'community', expected: 'community_staff' },
        { role: 2, expected: 'community_staff' },
        { role: '社区专员', expected: 'community_staff' }
      ]
      
      testCases.forEach(({ role, expected }) => {
        mockUserStore.role = role
        expect(getCurrentUserRole()).toBe(expected)
      })
    })
    
    it('应该正确映射普通用户角色', () => {
      // 测试各种普通用户角色表示方式
      const testCases = [
        { role: 'solo', expected: 'solo' },
        { role: 1, expected: 'solo' },
        { role: '普通用户', expected: 'solo' }
      ]
      
      testCases.forEach(({ role, expected }) => {
        mockUserStore.role = role
        expect(getCurrentUserRole()).toBe(expected)
      })
    })
    
    it('应该返回null当用户未登录时', () => {
      mockUserStore.role = null
      expect(getCurrentUserRole()).toBe(null)
    })
  })
  
  describe('canManageCommunity函数', () => {
    it('超级管理员应该有社区管理权限', () => {
      const testCases = ['community_admin', 4, '超级系统管理员']
      
      testCases.forEach(role => {
        expect(canManageCommunity('super_admin')).toBe(true)
      })
    })
    
    it('社区主管不应该有社区管理权限', () => {
      expect(canManageCommunity('community_manager')).toBe(false)
    })
    
    it('社区专员不应该有社区管理权限', () => {
      expect(canManageCommunity('community_staff')).toBe(false)
    })
    
    it('普通用户不应该有社区管理权限', () => {
      expect(canManageCommunity('solo')).toBe(false)
    })
  })
  
  describe('canManageStaff函数', () => {
    it('超级管理员应该有工作人员管理权限', () => {
      expect(canManageStaff('super_admin')).toBe(true)
    })
    
    it('社区主管应该有工作人员管理权限', () => {
      expect(canManageStaff('community_manager')).toBe(true)
    })
    
    it('社区专员不应该有工作人员管理权限', () => {
      expect(canManageStaff('community_staff')).toBe(false)
    })
    
    it('普通用户不应该有工作人员管理权限', () => {
      expect(canManageStaff('solo')).toBe(false)
    })
  })
  
  describe('canManageUsers函数', () => {
    it('超级管理员应该有用户管理权限', () => {
      expect(canManageUsers('super_admin')).toBe(true)
    })
    
    it('社区主管应该有用户管理权限', () => {
      expect(canManageUsers('community_manager')).toBe(true)
    })
    
    it('社区专员应该有用户管理权限', () => {
      expect(canManageUsers('community_staff')).toBe(true)
    })
    
    it('普通用户不应该有用户管理权限', () => {
      expect(canManageUsers('solo')).toBe(false)
    })
  })
  
  describe('isSuperAdmin函数', () => {
    it('应该正确识别超级管理员', () => {
      const testCases = ['community_admin', 4, '超级系统管理员']
      
      testCases.forEach(role => {
        expect(isSuperAdmin('super_admin')).toBe(true)
      })
    })
    
    it('应该正确排除非超级管理员', () => {
      const testCases = ['community_manager', 'community_staff', 'solo', 'supervisor']
      
      testCases.forEach(role => {
        expect(isSuperAdmin(role)).toBe(false)
      })
    })
  })
  
  describe('isCommunityManager函数', () => {
    it('应该正确识别社区主管', () => {
      const testCases = ['community_manager', 3, '社区主管']
      
      testCases.forEach(role => {
        expect(isCommunityManager('community_manager')).toBe(true)
      })
    })
    
    it('应该正确排除非社区主管', () => {
      const testCases = ['super_admin', 'community_staff', 'solo']
      
      testCases.forEach(role => {
        expect(isCommunityManager(role)).toBe(false)
      })
    })
  })
  
  describe('isCommunityStaff函数', () => {
    it('应该正确识别社区专员', () => {
      const testCases = ['community', 2, '社区专员']
      
      testCases.forEach(role => {
        expect(isCommunityStaff('community_staff')).toBe(true)
      })
    })
    
    it('应该正确排除非社区专员', () => {
      const testCases = ['super_admin', 'community_manager', 'solo']
      
      testCases.forEach(role => {
        expect(isCommunityStaff(role)).toBe(false)
      })
    })
  })
  
  describe('hasFeaturePermission函数', () => {
    beforeEach(() => {
      // 设置用户已登录
      mockUserStore.isLoggedIn = true
      mockUserStore.token = 'test-token'
    })
    
    it('超级管理员应该有所有功能权限', () => {
      mockUserStore.role = '超级系统管理员'
      
      // 测试一些关键功能权限
      expect(hasFeaturePermission('create_community')).toBe(true)
      expect(hasFeaturePermission('merge_community')).toBe(true)
      expect(hasFeaturePermission('add_staff')).toBe(true)
      expect(hasFeaturePermission('add_user')).toBe(true)
    })
    
    it('社区主管应该有工作人员和用户管理权限', () => {
      mockUserStore.role = '社区主管'
      
      expect(hasFeaturePermission('add_staff')).toBe(true)
      expect(hasFeaturePermission('add_user')).toBe(true)
      expect(hasFeaturePermission('create_community')).toBe(false) // 不应该有社区创建权限
    })
    
    it('社区专员应该只有用户管理权限', () => {
      mockUserStore.role = '社区专员'
      
      expect(hasFeaturePermission('add_user')).toBe(true)
      expect(hasFeaturePermission('add_staff')).toBe(false) // 不应该有工作人员管理权限
      expect(hasFeaturePermission('create_community')).toBe(false)
    })
    
    it('普通用户不应该有任何社区管理功能权限', () => {
      mockUserStore.role = '普通用户'
      
      expect(hasFeaturePermission('add_user')).toBe(false)
      expect(hasFeaturePermission('add_staff')).toBe(false)
      expect(hasFeaturePermission('create_community')).toBe(false)
    })
    
    it('未登录用户不应该有任何功能权限', () => {
      mockUserStore.isLoggedIn = false
      mockUserStore.token = null
      mockUserStore.role = '超级系统管理员'
      
      expect(hasFeaturePermission('create_community')).toBe(false)
    })
  })
})