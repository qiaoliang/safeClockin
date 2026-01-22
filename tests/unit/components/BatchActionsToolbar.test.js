import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BatchActionsToolbar from '@/components/BatchActionsToolbar.vue'

describe('BatchActionsToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(true)
  })

  it('应该显示总数和选中数', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 3
      }
    })

    expect(wrapper.text()).toContain('已选 3/10')
  })

  it('应该在showSelectAll为true时显示全选按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0,
        showSelectAll: true
      }
    })

    expect(wrapper.find('.select-all-btn').exists()).toBe(true)
  })

  it('应该在showSelectAll为false时隐藏全选按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0,
        showSelectAll: false
      }
    })

    expect(wrapper.find('.select-all-btn').exists()).toBe(false)
  })

  it('应该在选中数为0时禁用批量操作按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0
      }
    })

    expect(wrapper.find('.batch-accept-btn').attributes('disabled')).toBe('')
    expect(wrapper.find('.batch-reject-btn').attributes('disabled')).toBe('')
  })

  it('应该在选中数大于0时启用批量操作按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 3
      }
    })

    expect(wrapper.find('.batch-accept-btn').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.batch-reject-btn').attributes('disabled')).toBeUndefined()
  })

  it('应该在点击全选按钮时触发select-all事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0,
        showSelectAll: true
      }
    })

    const selectAllBtn = wrapper.find('.select-all-btn')
    await selectAllBtn.trigger('click')

    expect(wrapper.emitted('select-all')).toBeTruthy()
  })

  it('应该在点击批量接受按钮时触发batch-accept事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 3
      }
    })

    const acceptBtn = wrapper.find('.batch-accept-btn')
    await acceptBtn.trigger('click')

    expect(wrapper.emitted('batch-accept')).toBeTruthy()
  })

  it('应该在点击批量拒绝按钮时触发batch-reject事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 3
      }
    })

    const rejectBtn = wrapper.find('.batch-reject-btn')
    await rejectBtn.trigger('click')

    expect(wrapper.emitted('batch-reject')).toBeTruthy()
  })

  it('应该在选中数为0时点击批量操作按钮不触发事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 0
      }
    })

    const acceptBtn = wrapper.find('.batch-accept-btn')
    await acceptBtn.trigger('click')

    expect(wrapper.emitted('batch-accept')).toBeFalsy()
  })

  it('应该正确显示全选按钮的选中状态', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 10,
        showSelectAll: true
      }
    })

    expect(wrapper.find('.select-all-btn').classes()).toContain('all-selected')
  })

  it('应该在部分选中时显示部分选中状态', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedCount: 5,
        showSelectAll: true
      }
    })

    expect(wrapper.find('.select-all-btn').classes()).toContain('partial-selected')
  })

  it('应该在总数为0时不显示工具栏', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 0,
        selectedCount: 0
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(false)
  })

  it('应该在总数大于0时显示工具栏', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 1,
        selectedCount: 0
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(true)
  })
})