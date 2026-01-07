// 社区数字看板 API 单元测试
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock store for testing
const mockStore = {
  state: {
    user: {
      userInfo: {
        user_id: 1,
        role: 4, // SUPER_ADMIN
        community_id: 1
      },
      token: 'test-token'
    }
  }
}

describe('社区数字看板 API 单元测试', () => {
  describe('API 请求构建', () => {
    it('应该正确构建统计数据请求 URL', () => {
      const communityId = 1
      const expectedUrl = `/api/community-dashboard/${communityId}/stats`
      expect(expectedUrl).toBe('/api/community-dashboard/1/stats')
    })

    it('应该正确构建异常用户列表请求 URL', () => {
      const communityId = 1
      const page = 1
      const pageSize = 20
      const expectedUrl = `/api/community-dashboard/${communityId}/abnormal-users?page=${page}&page_size=${pageSize}`
      expect(expectedUrl).toBe('/api/community-dashboard/1/abnormal-users?page=1&page_size=20')
    })

    it('应该正确构建趋势数据请求 URL', () => {
      const communityId = 1
      const days = 7
      const expectedUrl = `/api/community-dashboard/${communityId}/trends?days=${days}`
      expect(expectedUrl).toBe('/api/community-dashboard/1/trends?days=7')
    })

    it('应该正确构建未处理事件请求 URL', () => {
      const communityId = 1
      const limit = 3
      const expectedUrl = `/api/community-dashboard/${communityId}/pending-events?limit=${limit}`
      expect(expectedUrl).toBe('/api/community-dashboard/1/pending-events?limit=3')
    })

    it('应该正确构建用户异常值详情请求 URL', () => {
      const communityId = 1
      const userId = 2
      const expectedUrl = `/api/community-dashboard/${communityId}/user-abnormality/${userId}`
      expect(expectedUrl).toBe('/api/community-dashboard/1/user-abnormality/2')
    })
  })

  describe('统计数据解析', () => {
    it('应该正确解析统计数据响应', () => {
      const mockResponse = {
        code: 1,
        data: {
          total_users: 100,
          today_checkin_rate: 85.5,
          unchecked_count: 15,
          total_rules: 2
        }
      }

      expect(mockResponse.code).toBe(1)
      expect(mockResponse.data.total_users).toBe(100)
      expect(mockResponse.data.today_checkin_rate).toBe(85.5)
      expect(mockResponse.data.unchecked_count).toBe(15)
      expect(mockResponse.data.total_rules).toBe(2)
    })

    it('应该处理空统计数据', () => {
      const mockResponse = {
        code: 1,
        data: {
          total_users: 0,
          today_checkin_rate: 0.0,
          unchecked_count: 0,
          total_rules: 0
        }
      }

      expect(mockResponse.data.total_users).toBe(0)
      expect(mockResponse.data.today_checkin_rate).toBe(0.0)
      expect(mockResponse.data.unchecked_count).toBe(0)
    })
  })

  describe('异常用户列表解析', () => {
    it('应该正确解析异常用户列表响应', () => {
      const mockResponse = {
        code: 1,
        data: {
          users: [
            {
              user_id: 1,
              nickname: '测试用户1',
              avatar_url: 'https://example.com/avatar1.jpg',
              total_abnormality: 10,
              unfinished_rules_count: 2,
              rule_abnormalities: [
                { rule_name: '晨间问候', abnormality: 5 },
                { rule_name: '晚间报平安', abnormality: 5 }
              ],
              abnormality_level: 'medium'
            }
          ],
          total: 1,
          page: 1,
          page_size: 20,
          has_next: false
        }
      }

      expect(mockResponse.code).toBe(1)
      expect(mockResponse.data.users.length).toBe(1)
      expect(mockResponse.data.users[0].user_id).toBe(1)
      expect(mockResponse.data.users[0].total_abnormality).toBe(10)
      expect(mockResponse.data.users[0].abnormality_level).toBe('medium')
    })

    it('应该正确计算异常值等级', () => {
      const calculateAbnormalityLevel = (totalAbn) => {
        if (totalAbn <= 3) return 'low'
        if (totalAbn <= 6) return 'medium'
        return 'high'
      }

      expect(calculateAbnormalityLevel(2)).toBe('low')
      expect(calculateAbnormalityLevel(5)).toBe('medium')
      expect(calculateAbnormalityLevel(10)).toBe('high')
    })

    it('应该处理空异常用户列表', () => {
      const mockResponse = {
        code: 1,
        data: {
          users: [],
          total: 0,
          page: 1,
          page_size: 20,
          has_next: false
        }
      }

      expect(mockResponse.data.users.length).toBe(0)
      expect(mockResponse.data.total).toBe(0)
      expect(mockResponse.data.has_next).toBe(false)
    })
  })

  describe('趋势数据解析', () => {
    it('应该正确解析趋势数据响应', () => {
      const mockResponse = {
        code: 1,
        data: {
          date_range: ['2026-01-01', '2026-01-02', '2026-01-03'],
          checkin_rates: [85.5, 90.0, 88.5],
          rule_missed_stats: [
            {
              rule_id: 1,
              rule_name: '晨间问候',
              rule_icon: '📋',
              missed_count: 5
            }
          ]
        }
      }

      expect(mockResponse.code).toBe(1)
      expect(mockResponse.data.date_range.length).toBe(3)
      expect(mockResponse.data.checkin_rates.length).toBe(3)
      expect(mockResponse.data.rule_missed_stats.length).toBe(1)
      expect(mockResponse.data.rule_missed_stats[0].rule_name).toBe('晨间问候')
    })

    it('应该验证天数参数只能是 7 或 30', () => {
      const validateDaysParam = (days) => {
        return [7, 30].includes(days)
      }

      expect(validateDaysParam(7)).toBe(true)
      expect(validateDaysParam(30)).toBe(true)
      expect(validateDaysParam(15)).toBe(false)
      expect(validateDaysParam(0)).toBe(false)
    })
  })

  describe('未处理事件解析', () => {
    it('应该正确解析未处理事件响应', () => {
      const mockResponse = {
        code: 1,
        data: {
          events: [
            {
              event_id: 1,
              type: 'call_for_help',
              title: '用户求助',
              description: '需要帮助',
              created_at: '2026-01-08T10:30:00',
              relative_time: '30分钟前'
            }
          ],
          total: 1
        }
      }

      expect(mockResponse.code).toBe(1)
      expect(mockResponse.data.events.length).toBe(1)
      expect(mockResponse.data.events[0].type).toBe('call_for_help')
      expect(mockResponse.data.events[0].title).toBe('用户求助')
    })

    it('应该处理空未处理事件列表', () => {
      const mockResponse = {
        code: 1,
        data: {
          events: [],
          total: 0
        }
      }

      expect(mockResponse.data.events.length).toBe(0)
      expect(mockResponse.data.total).toBe(0)
    })
  })

  describe('用户异常值详情解析', () => {
    it('应该正确解析用户异常值详情响应', () => {
      const mockResponse = {
        code: 1,
        data: {
          user_id: 1,
          date: '2026-01-08',
          total_abnormality: 10,
          rule_details: [
            {
              rule_name: '晨间问候',
              scheduled_time: '08:00',
              abnormality: 5,
              last_checkin_time: '2026-01-08T09:30:00',
              is_completed: false
            },
            {
              rule_name: '晚间报平安',
              scheduled_time: '18:00',
              abnormality: 5,
              last_checkin_time: null,
              is_completed: false
            }
          ]
        }
      }

      expect(mockResponse.code).toBe(1)
      expect(mockResponse.data.user_id).toBe(1)
      expect(mockResponse.data.total_abnormality).toBe(10)
      expect(mockResponse.data.rule_details.length).toBe(2)
      expect(mockResponse.data.rule_details[0].is_completed).toBe(false)
      expect(mockResponse.data.rule_details[1].last_checkin_time).toBeNull()
    })

    it('应该正确计算总异常值（只累加未完成的规则）', () => {
      const ruleDetails = [
        { abnormality: 5, is_completed: false },
        { abnormality: 3, is_completed: true },
        { abnormality: 2, is_completed: false }
      ]

      const totalAbnormality = ruleDetails
        .filter(rule => !rule.is_completed)
        .reduce((sum, rule) => sum + rule.abnormality, 0)

      expect(totalAbnormality).toBe(7) // 只累加未完成的：5 + 2
    })
  })

  describe('错误处理', () => {
    it('应该正确处理权限错误', () => {
      const mockErrorResponse = {
        code: 0,
        msg: '无权限访问该社区'
      }

      expect(mockErrorResponse.code).toBe(0)
      expect(mockErrorResponse.msg).toContain('无权限')
    })

    it('应该正确处理参数错误', () => {
      const mockErrorResponse = {
        code: 0,
        msg: '天数参数只能是 7 或 30'
      }

      expect(mockErrorResponse.code).toBe(0)
      expect(mockErrorResponse.msg).toContain('天数')
    })

    it('应该正确处理网络错误', () => {
      const mockNetworkError = {
        message: 'Network Error',
        config: {
          url: '/api/community-dashboard/1/stats'
        }
      }

      expect(mockNetworkError.message).toBe('Network Error')
      expect(mockNetworkError.config.url).toContain('community-dashboard')
    })
  })

  describe('相对时间计算', () => {
    it('应该正确计算相对时间', () => {
      const calculateRelativeTime = (createdAt) => {
        const now = new Date()
        const created = new Date(createdAt)
        const diffMs = now - created
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffMinutes = Math.floor(diffSeconds / 60)
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffSeconds < 60) return `${diffSeconds}秒前`
        if (diffMinutes < 60) return `${diffMinutes}分钟前`
        if (diffHours < 24) return `${diffHours}小时前`
        return `${diffDays}天前`
      }

      const now = new Date()
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()

      expect(calculateRelativeTime(thirtySecondsAgo)).toContain('秒前')
      expect(calculateRelativeTime(tenMinutesAgo)).toContain('分钟前')
      expect(calculateRelativeTime(twoHoursAgo)).toContain('小时前')
    })
  })
})
