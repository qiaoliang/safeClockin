// 纯单元测试 - 不依赖外部服务
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('工具函数单元测试', () => {
  describe('日期格式化函数', () => {
    it('应该正确格式化日期', () => {
      // 模拟日期格式化函数
      const formatDate = (date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      expect(formatDate('2023-12-01')).toBe('2023-12-01')
      expect(formatDate('2023-1-1')).toBe('2023-01-01')
    })
  })

  describe('手机号验证函数', () => {
    it('应该正确验证手机号格式', () => {
      const validatePhone = (phone) => {
        return /^1[3-9]\d{9}$/.test(phone)
      }
      
      expect(validatePhone('13800138000')).toBe(true)
      expect(validatePhone('18900138999')).toBe(true)
      expect(validatePhone('12800138000')).toBe(false) // 1开头但第二位不符合
      expect(validatePhone('1380013800')).toBe(false) // 少一位
      expect(validatePhone('138001380000')).toBe(false) // 多一位
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('密码强度验证函数', () => {
    it('应该正确验证密码强度', () => {
      const validatePassword = (password) => {
        if (!password || password.length < 8) return false
        return /(?=.*[A-Za-z])(?=.*\d)/.test(password)
      }
      
      expect(validatePassword('password123')).toBe(true)
      expect(validatePassword('Password1')).toBe(true)
      expect(validatePassword('12345678')).toBe(false) // 缺少字母
      expect(validatePassword('password')).toBe(false) // 缺少数字
      expect(validatePassword('Pass1')).toBe(false) // 少于8位
      expect(validatePassword('')).toBe(false)
    })
  })

  describe('数据脱敏函数', () => {
    it('应该正确脱敏手机号', () => {
      const maskPhone = (phone) => {
        if (!phone || phone.length < 7) return phone
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
      }
      
      expect(maskPhone('13800138000')).toBe('138****8000')
      expect(maskPhone('18912345678')).toBe('189****5678')
      expect(maskPhone('1234567')).toBe('123****4567')
      expect(maskPhone('123')).toBe('123') // 长度不足
    })
  })
})