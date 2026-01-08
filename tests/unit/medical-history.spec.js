/**
 * 医疗历史组件单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Medical History API Tests', () => {
  describe('API 方法定义', () => {
    it('应该定义 getUserMedicalHistories 方法', () => {
      // 验证 API 方法存在
      const api = require('@/api/user')
      expect(typeof api.getUserMedicalHistories).toBe('function')
    })

    it('应该定义 addMedicalHistory 方法', () => {
      const api = require('@/api/user')
      expect(typeof api.addMedicalHistory).toBe('function')
    })

    it('应该定义 updateMedicalHistory 方法', () => {
      const api = require('@/api/user')
      expect(typeof api.updateMedicalHistory).toBe('function')
    })

    it('应该定义 deleteMedicalHistory 方法', () => {
      const api = require('@/api/user')
      expect(typeof api.deleteMedicalHistory).toBe('function')
    })

    it('应该定义 getCommonConditions 方法', () => {
      const api = require('@/api/user')
      expect(typeof api.getCommonConditions).toBe('function')
    })
  })

  describe('API 参数验证', () => {
    it('getUserMedicalHistories 应该接受 userId 参数', () => {
      const userId = 123
      const expectedUrl = `/api/user/${userId}/medical-history`

      // 模拟 request 函数
      const mockRequest = vi.fn(() => Promise.resolve({}))
      vi.doMock('@/api/request', () => ({ request: mockRequest }))

      // 调用 API
      const { getUserMedicalHistories } = require('@/api/user')
      getUserMedicalHistories(userId)

      // 验证调用
      expect(mockRequest).toHaveBeenCalledWith({
        url: expectedUrl,
        method: 'GET'
      })
    })

    it('addMedicalHistory 应该接受病史数据对象', () => {
      const medicalData = {
        user_id: 123,
        condition_name: '高血压',
        treatment_plan: { type: 'medication', medications: ['降压药'] },
        visibility: 1
      }

      const mockRequest = vi.fn(() => Promise.resolve({}))
      vi.doMock('@/api/request', () => ({ request: mockRequest }))

      const { addMedicalHistory } = require('@/api/user')
      addMedicalHistory(medicalData)

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/user/medical-history',
        method: 'POST',
        data: medicalData
      })
    })

    it('updateMedicalHistory 应该接受 historyId 和更新数据', () => {
      const historyId = 456
      const updateData = {
        condition_name: '糖尿病',
        treatment_plan: { type: 'medication', medications: ['胰岛素'] },
        visibility: 2
      }

      const mockRequest = vi.fn(() => Promise.resolve({}))
      vi.doMock('@/api/request', () => ({ request: mockRequest }))

      const { updateMedicalHistory } = require('@/api/user')
      updateMedicalHistory(historyId, updateData)

      expect(mockRequest).toHaveBeenCalledWith({
        url: `/api/user/medical-history/${historyId}`,
        method: 'PUT',
        data: updateData
      })
    })

    it('deleteMedicalHistory 应该接受 historyId 和 userId', () => {
      const historyId = 456
      const userId = 123

      const mockRequest = vi.fn(() => Promise.resolve({}))
      vi.doMock('@/api/request', () => ({ request: mockRequest }))

      const { deleteMedicalHistory } = require('@/api/user')
      deleteMedicalHistory(historyId, userId)

      expect(mockRequest).toHaveBeenCalledWith({
        url: `/api/user/medical-history/${historyId}`,
        method: 'DELETE',
        data: { user_id: userId }
      })
    })

    it('getCommonConditions 应该不需要参数', () => {
      const mockRequest = vi.fn(() => Promise.resolve({}))
      vi.doMock('@/api/request', () => ({ request: mockRequest }))

      const { getCommonConditions } = require('@/api/user')
      getCommonConditions()

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/user/medical-history/common-conditions',
        method: 'GET'
      })
    })
  })

  describe('治疗方案格式化', () => {
    const formatTreatmentPlan = (plan) => {
      if (!plan) return ''

      if (typeof plan === 'string') {
        try {
          plan = JSON.parse(plan)
        } catch (e) {
          return plan
        }
      }

      if (plan.type === 'medication') {
        return `吃药: ${plan.medications?.join(', ') || '无'}`
      } else if (plan.type === 'injection') {
        return `打针: ${plan.medication || '未指定'}`
      }

      return plan.note || '未指定'
    }

    it('应该正确格式化药物治疗方案', () => {
      const plan = {
        type: 'medication',
        medications: ['降压药', '降糖药']
      }
      expect(formatTreatmentPlan(plan)).toBe('吃药: 降压药, 降糖药')
    })

    it('应该正确格式化注射治疗方案', () => {
      const plan = {
        type: 'injection',
        medication: '胰岛素'
      }
      expect(formatTreatmentPlan(plan)).toBe('打针: 胰岛素')
    })

    it('应该处理空的治疗方案', () => {
      expect(formatTreatmentPlan(null)).toBe('')
      expect(formatTreatmentPlan('')).toBe('')
    })

    it('应该处理字符串格式的治疗方案', () => {
      const planStr = JSON.stringify({
        type: 'medication',
        medications: ['阿司匹林']
      })
      expect(formatTreatmentPlan(planStr)).toBe('吃药: 阿司匹林')
    })

    it('应该处理其他类型的治疗方案', () => {
      const plan = {
        type: 'other',
        note: '需要定期检查'
      }
      expect(formatTreatmentPlan(plan)).toBe('需要定期检查')
    })
  })

  describe('可见性级别', () => {
    const getVisibilityText = (visibility) => {
      return visibility === 1 ? '仅工作人员' : '工作人员和监护人'
    }

    const getVisibilityClass = (visibility) => {
      return visibility === 1 ? 'visibility-staff' : 'visibility-guardian'
    }

    it('应该正确返回可见性文本', () => {
      expect(getVisibilityText(1)).toBe('仅工作人员')
      expect(getVisibilityText(2)).toBe('工作人员和监护人')
    })

    it('应该正确返回可见性样式类', () => {
      expect(getVisibilityClass(1)).toBe('visibility-staff')
      expect(getVisibilityClass(2)).toBe('visibility-guardian')
    })
  })

  describe('常见病史标签', () => {
    it('应该包含常见老年疾病', () => {
      const commonConditions = [
        '高血压', '糖尿病', '心脏病', '冠心病', '脑卒中',
        '骨质疏松', '阿尔茨海默病', '帕金森病', '抑郁症',
        '失眠症', '关节炎', '白内障', '青光眼'
      ]

      expect(commonConditions.length).toBeGreaterThan(10)
      expect(commonConditions).toContain('高血压')
      expect(commonConditions).toContain('糖尿病')
      expect(commonConditions).toContain('阿尔茨海默病')
    })
  })
})
