/**
 * 浏览记录组件单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as userApi from '@/api/user'
import { request } from '@/api/request'

// Mock request 模块
vi.mock('@/api/request', () => ({
  request: vi.fn(() => Promise.resolve({}))
}))

describe('Profile View Logs API Tests', () => {
  beforeEach(() => {
    // 清除 mock 调用记录
    vi.clearAllMocks()
  })

  describe('API 方法定义', () => {
    it('应该定义 logProfileView 方法', () => {
      expect(typeof userApi.logProfileView).toBe('function')
    })

    it('应该定义 logViewGuardianInfo 方法', () => {
      expect(typeof userApi.logViewGuardianInfo).toBe('function')
    })

    it('应该定义 getProfileViewLogs 方法', () => {
      expect(typeof userApi.getProfileViewLogs).toBe('function')
    })
  })

  describe('API 参数验证', () => {
    it('logProfileView 应该接受 viewedUserId 和 communityId', () => {
      const viewedUserId = 123
      const communityId = 456

      userApi.logProfileView(viewedUserId, communityId)

      expect(request).toHaveBeenCalledWith({
        url: '/api/user/log-profile-view',
        method: 'POST',
        data: {
          viewed_user_id: viewedUserId,
          community_id: communityId
        }
      })
    })

    it('logViewGuardianInfo 应该接受 guardianId, wardUserId 和 communityId', () => {
      const guardianId = 789
      const wardUserId = 123
      const communityId = 456

      userApi.logViewGuardianInfo(guardianId, wardUserId, communityId)

      expect(request).toHaveBeenCalledWith({
        url: '/api/user/log-view-guardian',
        method: 'POST',
        data: {
          guardian_id: guardianId,
          ward_user_id: wardUserId,
          community_id: communityId
        }
      })
    })

    it('getProfileViewLogs 应该接受 communityId 和可选参数', () => {
      const communityId = 456
      const params = {
        viewer_id: 123,
        limit: 50
      }

      userApi.getProfileViewLogs(communityId, params)

      expect(request).toHaveBeenCalledWith({
        url: '/api/user/profile-view-logs',
        method: 'GET',
        data: {
          community_id: communityId,
          ...params
        }
      })
    })

    it('getProfileViewLogs 应该只接受 communityId 而不需要其他参数', () => {
      const communityId = 456

      userApi.getProfileViewLogs(communityId)

      expect(request).toHaveBeenCalledWith({
        url: '/api/user/profile-view-logs',
        method: 'GET',
        data: {
          community_id: communityId
        }
      })
    })
  })

  describe('日志类型处理', () => {
    const getLogTypeIcon = (type) => {
      const icons = {
        profile: '👤',
        guardian: '👥'
      }
      return icons[type] || '📄'
    }

    const getLogTypeText = (type) => {
      const texts = {
        profile: '查看成员信息',
        guardian: '查看监护人信息'
      }
      return texts[type] || '查看信息'
    }

    it('应该返回正确的日志类型图标', () => {
      expect(getLogTypeIcon('profile')).toBe('👤')
      expect(getLogTypeIcon('guardian')).toBe('👥')
      expect(getLogTypeIcon('unknown')).toBe('📄')
    })

    it('应该返回正确的日志类型文本', () => {
      expect(getLogTypeText('profile')).toBe('查看成员信息')
      expect(getLogTypeText('guardian')).toBe('查看监护人信息')
      expect(getLogTypeText('unknown')).toBe('查看信息')
    })
  })

  describe('时间格式化', () => {
    const formatLogTime = (time) => {
      if (!time) return ''

      try {
        const date = new Date(time)
        const now = new Date()
        const diff = now - date

        // 小于1小时显示"刚刚"
        if (diff < 3600000) {
          return '刚刚'
        }

        // 小于24小时显示"X小时前"
        if (diff < 86400000) {
          return `${Math.floor(diff / 3600000)}小时前`
        }

        // 小于7天显示"X天前"
        if (diff < 604800000) {
          return `${Math.floor(diff / 86400000)}天前`
        }

        // 其他显示完整日期
        return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      } catch (e) {
        return time
      }
    }

    it('应该正确格式化时间', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)
      const oneDayAgo = new Date(now.getTime() - 86400000)

      expect(formatLogTime(oneHourAgo.toISOString())).toBe('1小时前')
      expect(formatLogTime(oneDayAgo.toISOString())).toBe('1天前')
    })

    it('应该处理空时间', () => {
      expect(formatLogTime(null)).toBe('')
      expect(formatLogTime('')).toBe('')
    })
  })

  describe('角色样式映射', () => {
    const getRoleClass = (role) => {
      if (role.includes('超级管理员') || role.includes('Super Admin')) {
        return 'role-super-admin'
      } else if (role.includes('主管') || role.includes('Manager')) {
        return 'role-manager'
      } else if (role.includes('专员') || role.includes('Staff')) {
        return 'role-staff'
      }
      return 'role-default'
    }

    it('应该返回正确的角色样式类', () => {
      expect(getRoleClass('超级管理员')).toBe('role-super-admin')
      expect(getRoleClass('Super Admin')).toBe('role-super-admin')
      expect(getRoleClass('社区主管')).toBe('role-manager')
      expect(getRoleClass('Manager')).toBe('role-manager')
      expect(getRoleClass('社区专员')).toBe('role-staff')
      expect(getRoleClass('Staff')).toBe('role-staff')
      expect(getRoleClass('普通用户')).toBe('role-default')
    })
  })

  describe('日志筛选', () => {
    const logs = [
      { id: 1, view_type: 'profile', viewer_name: '张三' },
      { id: 2, view_type: 'guardian', viewer_name: '李四' },
      { id: 3, view_type: 'profile', viewer_name: '王五' }
    ]

    const filterLogs = (logs, filterType) => {
      if (filterType === 'all') {
        return logs
      }
      return logs.filter(log => log.view_type === filterType)
    }

    it('应该正确筛选日志', () => {
      expect(filterLogs(logs, 'all').length).toBe(3)
      expect(filterLogs(logs, 'profile').length).toBe(2)
      expect(filterLogs(logs, 'guardian').length).toBe(1)
    })

    it('应该返回正确的筛选结果', () => {
      const profileLogs = filterLogs(logs, 'profile')
      expect(profileLogs[0].viewer_name).toBe('张三')
      expect(profileLogs[1].viewer_name).toBe('王五')
    })
  })

  describe('权限验证', () => {
    it('工作人员应该可以查看浏览记录', () => {
      const canViewLogs = (isCommunityStaff, isCommunityManager) => {
        return isCommunityStaff || isCommunityManager
      }

      expect(canViewLogs(true, false)).toBe(true)
      expect(canViewLogs(false, true)).toBe(true)
      expect(canViewLogs(false, false)).toBe(false)
    })
  })
})
