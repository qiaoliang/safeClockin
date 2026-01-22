import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SupervisedRuleItem from '@/components/SupervisedRuleItem.vue'

describe('SupervisedRuleItem', () => {
  const mockUser = {
    user_id: '1',
    nickname: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  }

  const mockRules = [
    { rule_id: 1, rule_name: '早间打卡', icon_url: '🌅' },
    { rule_id: 2, rule_name: '晚间打卡', icon_url: '🌙' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    expect(wrapper.find('.supervised-rule-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test User')
  })

  it('应该显示用户头像', () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    const avatar = wrapper.find('.user-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('src')).toBe(mockUser.avatar_url)
  })

  it('应该显示规则数量', () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    expect(wrapper.text()).toContain('2个规则')
  })

  it('应该在无规则时显示提示文本', () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: []
      }
    })

    expect(wrapper.text()).toContain('暂无规则')
  })

  it('应该在默认折叠状态下隐藏规则列表', () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    expect(wrapper.find('.rules-list').exists()).toBe(false)
  })

  it('应该在展开时显示规则列表', async () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    await wrapper.vm.toggleExpand()

    expect(wrapper.find('.rules-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('早间打卡')
    expect(wrapper.text()).toContain('晚间打卡')
  })

  it('应该在点击时触发click事件', async () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0][0]).toEqual(mockUser)
  })

  it('应该在展开时显示箭头旋转', async () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    const arrow = wrapper.find('.expand-arrow')
    expect(arrow.classes()).not.toContain('expanded')

    await wrapper.vm.toggleExpand()

    expect(arrow.classes()).toContain('expanded')
  })

  it('应该正确显示规则图标', async () => {
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: mockRules
      }
    })

    await wrapper.vm.toggleExpand()

    expect(wrapper.text()).toContain('🌅')
    expect(wrapper.text()).toContain('🌙')
  })

  it('应该在没有规则图标时使用默认图标', async () => {
    const rulesWithoutIcon = [
      { rule_id: 1, rule_name: '打卡规则' }
    ]
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: mockUser,
        rules: rulesWithoutIcon
      }
    })

    await wrapper.vm.toggleExpand()

    expect(wrapper.text()).toContain('📋')
  })

  it('应该使用默认头像当用户没有头像URL', () => {
    const userWithoutAvatar = { ...mockUser, avatar_url: '' }
    const wrapper = mount(SupervisedRuleItem, {
      props: {
        user: userWithoutAvatar,
        rules: mockRules
      }
    })

    const avatar = wrapper.find('.user-avatar')
    expect(avatar.attributes('src')).toContain('/static/logo.png')
  })
})