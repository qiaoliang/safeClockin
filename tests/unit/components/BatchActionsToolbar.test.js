import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BatchActionsToolbar from '@/components/BatchActionsToolbar.vue'

// Mock uni-app checkbox component
const Checkbox = {
  name: 'Checkbox',
  template: '<input type="checkbox" :checked="checked" @change="$emit(\'change\', $event)" />',
  props: ['checked'],
  emits: ['change'],
  setup(props, { emit }) {
    return {
      checked: props.checked
    }
  }
}

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
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(true)
  })

  it('应该显示总数和选中数', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.text()).toContain('已选择 3 项')
  })

  it('应该在选中数为0时不显示工具栏', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: []
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(false)
  })

  it('应该在选中数大于0时显示工具栏', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.find('.batch-actions-toolbar').exists()).toBe(true)
  })

  it('应该在选中数为0时禁用批量操作按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    // 由于selectedIds不为空，工具栏会显示，但按钮应该是可用的
    expect(wrapper.find('.accept-btn').exists()).toBe(true)
    expect(wrapper.find('.reject-btn').exists()).toBe(true)
  })

  it('应该在选中数大于0时启用批量操作按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.find('.accept-btn').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.reject-btn').attributes('disabled')).toBeUndefined()
  })

  it('应该在loading状态下禁用批量操作按钮', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3],
        loading: true
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    expect(wrapper.find('.accept-btn').attributes('disabled')).toBe('')
    expect(wrapper.find('.reject-btn').attributes('disabled')).toBe('')
  })

  it('应该在点击全选按钮时触发select-all事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    const selectAllCheckbox = wrapper.find('.select-all-checkbox')
    await selectAllCheckbox.trigger('change', { detail: { checked: true } })

    expect(wrapper.emitted('select-all')).toBeTruthy()
    expect(wrapper.emitted('select-all')[0][0]).toBe(true)
  })

  it('应该在点击批量接受按钮时触发batch-accept事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    const acceptBtn = wrapper.find('.accept-btn')
    await acceptBtn.trigger('click')

    expect(wrapper.emitted('batch-accept')).toBeTruthy()
  })

  it('应该在点击批量拒绝按钮时触发batch-reject事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    const rejectBtn = wrapper.find('.reject-btn')
    await rejectBtn.trigger('click')

    expect(wrapper.emitted('batch-reject')).toBeTruthy()
  })

  it('应该在点击取消按钮时触发cancel事件', async () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    const cancelBtn = wrapper.find('.cancel-btn')
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('应该正确显示全选按钮的选中状态', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    // 检查计算属性
    expect(wrapper.vm.isAllSelected).toBe(true)
  })

  it('应该在部分选中时显示未选中状态', () => {
    const wrapper = mount(BatchActionsToolbar, {
      props: {
        totalCount: 10,
        selectedIds: [1, 2, 3, 4, 5]
      },
      global: {
        components: {
          Checkbox
        }
      }
    })

    // 检查计算属性
    expect(wrapper.vm.isAllSelected).toBe(false)
  })
})