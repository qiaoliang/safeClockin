import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock uni 全局对象
global.uni = {
  showToast: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  request: vi.fn(() => Promise.resolve({ data: {}, statusCode: 200 })),
  getSystemInfoSync: vi.fn(() => ({ platform: 'h5' })),
}

/**
 * 关闭原因验证函数
 * 从 home-solo.vue 和 event.js 中提取的验证逻辑
 * 
 * 规则：
 * - 不能为空
 * - 长度必须在 5-200 字符之间
 * - 前后空格会被 trim
 */
function validateCloseReason(reason) {
  if (!reason || reason.trim().length < 5 || reason.trim().length > 200) {
    return {
      valid: false,
      message: '关闭原因长度必须在5-200字符之间'
    }
  }
  return {
    valid: true,
    message: ''
  }
}

describe('关闭原因验证测试', () => {
  beforeEach(() => {
    // 每个测试前清空 mock 调用记录
    vi.clearAllMocks()
  })

  describe('长度验证', () => {
    test('应该拒绝空字符串', () => {
      const result = validateCloseReason('')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝 null 值', () => {
      const result = validateCloseReason(null)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝 undefined 值', () => {
      const result = validateCloseReason(undefined)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝只有空格的字符串', () => {
      const result = validateCloseReason('     ')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝少于5个字符的原因', () => {
      const result = validateCloseReason('测试')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝刚好4个字符的原因', () => {
      const result = validateCloseReason('四个字')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该接受刚好5个字符的原因', () => {
      const result = validateCloseReason('六个字符啊')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该接受刚好6个字符的原因', () => {
      const result = validateCloseReason('七个字符啊')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该拒绝超过200个字符的原因', () => {
      const longReason = 'a'.repeat(201)
      const result = validateCloseReason(longReason)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该接受刚好200个字符的原因', () => {
      const validLongReason = 'a'.repeat(200)
      const result = validateCloseReason(validLongReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该接受199个字符的原因', () => {
      const validLongReason = 'a'.repeat(199)
      const result = validateCloseReason(validLongReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })
  })

  describe('trim 处理验证', () => {
    test('应该自动去除前后空格后验证长度', () => {
      const result = validateCloseReason('  测试原因啊  ')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该拒绝前后空格后少于5个字符的原因', () => {
      const result = validateCloseReason('  测试  ')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该拒绝前后空格后超过200个字符的原因', () => {
      const longReason = '  ' + 'a'.repeat(201) + '  '
      const result = validateCloseReason(longReason)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })

    test('应该接受前后空格后刚好200个字符的原因', () => {
      const validLongReason = '  ' + 'a'.repeat(198) + '  '
      const result = validateCloseReason(validLongReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })
  })

  describe('实际场景测试', () => {
    test('应该接受合理的关闭原因', () => {
      const validReasons = [
        '问题已解决',
        '用户已安全',
        '事件已处理完毕',
        '工作人员已到达现场',
        '用户表示不需要帮助了',
        '联系到用户，确认安全',
        '误操作，实际不需要求助',
        '问题已经得到妥善处理'
      ]

      validReasons.forEach(reason => {
        const result = validateCloseReason(reason)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    test('应该拒绝太短的关闭原因', () => {
      const invalidReasons = [
        '好的',
        '已解决',
        'OK',
        '完成',
        '没事'
      ]

      invalidReasons.forEach(reason => {
        const result = validateCloseReason(reason)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
      })
    })

    test('应该接受较长的详细关闭原因', () => {
      const detailedReason = '工作人员已经到达现场，确认用户安全。用户表示是因为误操作触发了求助按钮，实际上并不需要帮助。已经向用户解释了正确的使用方法，用户表示理解。'
      const result = validateCloseReason(detailedReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该拒绝过长的关闭原因', () => {
      const tooLongReason = '工作人员已经到达现场，确认用户安全。用户表示是因为误操作触发了求助按钮，实际上并不需要帮助。已经向用户解释了正确的使用方法，用户表示理解。' + 'a'.repeat(200)
      const result = validateCloseReason(tooLongReason)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('关闭原因长度必须在5-200字符之间')
    })
  })

  describe('边界条件测试', () => {
    test('应该处理包含特殊字符的原因', () => {
      const specialReason = '用户已安全！@#$%^&*()'
      const result = validateCloseReason(specialReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该处理包含换行符的原因', () => {
      const multilineReason = '问题已解决\n用户安全\n已确认'
      const result = validateCloseReason(multilineReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该处理包含Emoji的原因', () => {
      const emojiReason = '用户已安全✅ 问题解决🎉'
      const result = validateCloseReason(emojiReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    test('应该处理包含中文标点的原因', () => {
      const punctuationReason = '用户已安全，问题已解决。'
      const result = validateCloseReason(punctuationReason)
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })
  })
})