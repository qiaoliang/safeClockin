// 测试配置是否正确加载
import { describe, it, expect } from 'vitest'
import config, { getAPIBaseURL, currentEnv } from '@/config'

describe('配置系统测试', () => {
  it('应该正确加载默认配置', () => {
    expect(config).toBeDefined()
    expect(config.env).toBeDefined()
    expect(config.api).toBeDefined()
    expect(config.api.baseURL).toBeDefined()
  })

  it('应该能够获取 API 基础 URL', () => {
    const baseURL = getAPIBaseURL()
    expect(baseURL).toBeDefined()
    expect(typeof baseURL).toBe('string')
  })

  it('应该能够获取当前环境', () => {
    const env = currentEnv
    expect(env).toBeDefined()
    expect(typeof env).toBe('string')
    expect(['unit', 'func', 'uat', 'prod']).toContain(env)
  })
})