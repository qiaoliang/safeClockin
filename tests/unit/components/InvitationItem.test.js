import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InvitationItem from '@/components/InvitationItem.vue'

describe('InvitationItem', () => {
  const mockInvitation = {
    relation_id: 1,
    solo_user: {
      user_id: '1',
      nickname: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    rule: {
      rule_id: 1,
      rule_name: '测试规则'
    },
    create_time: '2026-01-22 10:00:00',
    status: 1
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation
      }
    })

    expect(wrapper.find('.invitation-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('测试规则')
  })

  it('应该显示待处理状态', () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation
      }
    })

    expect(wrapper.find('.status-pending').exists()).toBe(true)
    expect(wrapper.text()).toContain('待处理')
  })

  it('应该显示已同意状态', () => {
    const acceptedInvitation = { ...mockInvitation, status: 2 }
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: acceptedInvitation
      }
    })

    expect(wrapper.find('.status-accepted').exists()).toBe(true)
    expect(wrapper.text()).toContain('已同意')
  })

  it('应该显示已拒绝状态', () => {
    const rejectedInvitation = { ...mockInvitation, status: 3 }
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: rejectedInvitation
      }
    })

    expect(wrapper.find('.status-rejected').exists()).toBe(true)
    expect(wrapper.text()).toContain('已拒绝')
  })

  it('应该在点击接受按钮时触发accept事件', async () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation
      }
    })

    const acceptBtn = wrapper.find('.accept-btn')
    await acceptBtn.trigger('click')

    expect(wrapper.emitted('accept')).toBeTruthy()
    expect(wrapper.emitted('accept')[0][0]).toEqual(mockInvitation)
  })

  it('应该在点击拒绝按钮时触发reject事件', async () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation
      }
    })

    const rejectBtn = wrapper.find('.reject-btn')
    await rejectBtn.trigger('click')

    expect(wrapper.emitted('reject')).toBeTruthy()
    expect(wrapper.emitted('reject')[0][0]).toEqual(mockInvitation)
  })

  it('应该在选中状态时显示选中样式', () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation,
        selected: true
      }
    })

    expect(wrapper.find('.invitation-item.selected').exists()).toBe(true)
    expect(wrapper.find('.checkbox.checked').exists()).toBe(true)
  })

  it('应该在未选中状态时显示未选中样式', () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation,
        selected: false
      }
    })

    expect(wrapper.find('.invitation-item.selected').exists()).toBe(false)
    expect(wrapper.find('.checkbox.checked').exists()).toBe(false)
  })

  it('应该在点击复选框时触发select事件', async () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation,
        selected: false
      }
    })

    const checkbox = wrapper.find('.checkbox')
    await checkbox.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0][0]).toBe(mockInvitation.relation_id)
  })

  it('应该正确格式化时间', () => {
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: mockInvitation
      }
    })

    const timeText = wrapper.find('.invitation-time').text()
    expect(timeText).toBeTruthy()
  })

  it('应该在已同意或已拒绝状态时隐藏操作按钮', () => {
    const acceptedInvitation = { ...mockInvitation, status: 2 }
    const wrapper = mount(InvitationItem, {
      props: {
        invitation: acceptedInvitation
      }
    })

    expect(wrapper.find('.accept-btn').exists()).toBe(false)
    expect(wrapper.find('.reject-btn').exists()).toBe(false)
  })
})