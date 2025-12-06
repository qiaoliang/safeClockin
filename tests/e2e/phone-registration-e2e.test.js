import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PhoneLogin from '@/pages/phone-login/phone-login.vue'

// Mock uni API
global.uni = {
  request: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

// Mock router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn()
}

// Mock auth API
vi.mock('@/api/auth', () => ({
  authApi: {
    sendSmsCode: vi.fn(),
    registerPhone: vi.fn(),
    loginPhone: vi.fn()
  }
}))

describe('手机号注册端到端测试', () => {
  let wrapper
  let userStore
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    // 清理用户状态
    userStore.forceClearUserState()
    
    // Mock组件
    wrapper = mount(PhoneLogin, {
      global: {
        plugins: [pinia],
        mocks: {
          $router: mockRouter
        }
      }
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  describe('完整注册流程', () => {
    const testPhone = '13800138000'
    const testPassword = 'Test123456'
    const testCode = '123456' // 统一测试验证码

    it('应该完成完整的注册流程', async () => {
      // 1. 设置手机号
      await wrapper.setData({ phone: testPhone })
      expect(wrapper.vm.phone).toBe(testPhone)

      // 2. 切换到注册模式
      await wrapper.setData({ activeTab: 'register' })
      expect(wrapper.vm.activeTab).toBe('register')

      // 3. 同意协议
      await wrapper.setData({ agree: true })
      expect(wrapper.vm.agree).toBe(true)

      // 4. Mock发送验证码成功
      const { authApi } = await import('@/api/auth')
      authApi.sendSmsCode.mockResolvedValue({
        code: 1,
        msg: '验证码发送成功'
      })

      // 5. 点击获取验证码
      const sendCodeBtn = wrapper.find('.code-btn')
      await sendCodeBtn.trigger('click')
      
      // 等待异步操作
      await wrapper.vm.$nextTick()
      
      expect(authApi.sendSmsCode).toHaveBeenCalledWith({
        phone: testPhone,
        purpose: 'register'
      })

      // 6. 设置验证码和密码
      await wrapper.setData({ 
        code: testCode,
        password: testPassword 
      })

      // 7. Mock注册成功
      authApi.registerPhone.mockResolvedValue({
        code: 1,
        data: {
          token: 'test-token',
          refresh_token: 'test-refresh-token',
          user_id: 123,
          nickname: '测试用户',
          role: 'solo'
        },
        msg: '注册成功'
      })

      // 8. 点击注册按钮
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      
      // 等待异步操作
      await wrapper.vm.$nextTick()
      
      expect(authApi.registerPhone).toHaveBeenCalledWith({
        phone: testPhone,
        code: testCode,
        password: testPassword
      })

      // 9. 验证成功提示
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '注册成功',
        icon: 'success'
      })
    })

    it('应该处理验证码错误', async () => {
      // 设置测试数据
      await wrapper.setData({ 
        phone: testPhone,
        activeTab: 'register',
        agree: true,
        code: '999999', // 错误验证码
        password: testPassword
      })

      // Mock注册失败
      const { authApi } = await import('@/api/auth')
      authApi.registerPhone.mockResolvedValue({
        code: 0,
        msg: '验证码错误'
      })

      // 点击注册
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证错误提示
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '验证码错误',
        icon: 'none'
      })
    })

    it('应该处理密码强度验证', async () => {
      // 设置弱密码
      await wrapper.setData({ 
        phone: testPhone,
        activeTab: 'register',
        agree: true,
        code: testCode,
        password: '123' // 弱密码
      })

      // 点击注册
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证密码强度提示
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '密码至少8位',
        icon: 'none'
      })
    })

    it('应该处理网络错误', async () => {
      // 设置测试数据
      await wrapper.setData({ 
        phone: testPhone,
        activeTab: 'register',
        agree: true,
        code: testCode,
        password: testPassword
      })

      // Mock网络错误
      const { authApi } = await import('@/api/auth')
      authApi.registerPhone.mockRejectedValue(new Error('网络连接失败'))

      // 点击注册
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证网络错误提示
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '网络连接失败，请检查网络设置',
        icon: 'none'
      })
    })
  })

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      // 不填写手机号
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(uni.showToast).toHaveBeenCalledWith({
        title: '请输入手机号',
        icon: 'none'
      })
    })

    it('应该验证协议同意', async () => {
      // 设置手机号但不同意协议
      await wrapper.setData({ 
        phone: '13800138000',
        activeTab: 'register',
        agree: false
      })

      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(uni.showToast).toHaveBeenCalledWith({
        title: '需勾选协议',
        icon: 'none'
      })
    })

    it('应该验证验证码', async () => {
      // 设置手机号和协议，但不填验证码
      await wrapper.setData({ 
        phone: '13800138000',
        activeTab: 'register',
        agree: true,
        password: 'Test123456'
      })

      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(uni.showToast).toHaveBeenCalledWith({
        title: '请输入验证码',
        icon: 'none'
      })
    })
  })

  describe('用户体验测试', () => {
    it('应该显示倒计时', async () => {
      // Mock发送验证码成功
      const { authApi } = await import('@/api/auth')
      authApi.sendSmsCode.mockResolvedValue({
        code: 1,
        msg: '验证码发送成功'
      })

      // 设置手机号
      await wrapper.setData({ phone: '13800138000' })

      // 点击获取验证码
      const sendCodeBtn = wrapper.find('.code-btn')
      await sendCodeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证倒计时开始
      expect(wrapper.vm.countdown).toBe(60)
      expect(wrapper.vm.sending).toBe(false)
    })

    it('应该在倒计时期间禁用按钮', async () => {
      // 设置倒计时状态
      await wrapper.setData({ countdown: 30 })

      const sendCodeBtn = wrapper.find('.code-btn')
      expect(sendCodeBtn.attributes('disabled')).toBeDefined()
      expect(sendCodeBtn.text()).toContain('30s')
    })
  })

  describe('性能测试', () => {
    it('注册流程应该在合理时间内完成', async () => {
      const startTime = Date.now()
      
      // 设置测试数据
      await wrapper.setData({ 
        phone: '13800138000',
        activeTab: 'register',
        agree: true,
        code: '123456',
        password: 'Test123456'
      })

      // Mock快速响应
      const { authApi } = await import('@/api/auth')
      authApi.registerPhone.mockResolvedValue({
        code: 1,
        data: { token: 'test-token' },
        msg: '注册成功'
      })

      // 执行注册
      const submitBtn = wrapper.find('button')
      await submitBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const endTime = Date.now()
      const duration = endTime - startTime

      // 应该在1秒内完成
      expect(duration).toBeLessThan(1000)
    })
  })
})

// E2E测试工具函数
export const PhoneRegistrationE2EUtils = {
  // 模拟用户输入
  async simulateUserInput(wrapper, { phone, code, password, agree = true }) {
    if (phone !== undefined) await wrapper.setData({ phone })
    if (code !== undefined) await wrapper.setData({ code })
    if (password !== undefined) await wrapper.setData({ password })
    if (agree !== undefined) await wrapper.setData({ agree })
  },

  // 模拟完整注册流程
  async simulateFullRegistration(wrapper, phone = '13800138000', password = 'Test123456') {
    // 1. 输入手机号
    await this.simulateUserInput(wrapper, { phone })
    
    // 2. 切换到注册模式
    await wrapper.setData({ activeTab: 'register' })
    
    // 3. 同意协议
    await this.simulateUserInput(wrapper, { agree: true })
    
    // 4. 发送验证码
    const sendCodeBtn = wrapper.find('.code-btn')
    await sendCodeBtn.trigger('click')
    await wrapper.vm.$nextTick()
    
    // 5. 输入验证码和密码
    await this.simulateUserInput(wrapper, { 
      code: '123456', 
      password 
    })
    
    // 6. 提交注册
    const submitBtn = wrapper.find('button')
    await submitBtn.trigger('click')
    await wrapper.vm.$nextTick()
    
    return wrapper
  },

  // 验证注册结果
  validateRegistrationResult(wrapper) {
    return {
      showToastCalled: uni.showToast.mock.calls.length > 0,
      toastMessage: uni.showToast.mock.calls[0]?.[0]?.title,
      userLoggedIn: useUserStore().isLoggedIn
    }
  }
}