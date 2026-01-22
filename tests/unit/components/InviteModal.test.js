import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InviteModal from '@/components/InviteModal.vue'
import { authApi } from '@/api/auth'

// Mock API
vi.mock('@/api/auth', () => ({
  authApi: {
    inviteSupervisor: vi.fn()
  }
}))

// Mock UserSearch component
const UserSearch = {
  name: 'UserSearch',
  template: '<div class="user-search-mock" @click="$emit(\'user-select\', mockUser)"></div>',
  emits: ['user-select'],
  data() {
    return {
      mockUser: { user_id: '1', nickname: 'Test User' }
    }
  }
}

// Mock uni-app components
const UniEasyInput = {
  name: 'UniEasyInput',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue']
}

const UniLoadMore = {
  name: 'UniLoadMore',
  template: '<div></div>',
  props: ['status']
}

describe('InviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    expect(wrapper.find('.invite-modal-container').exists()).toBe(true)
  })

  it('当visible为false时不显示', () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: false,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    expect(wrapper.find('.invite-modal-container').exists()).toBe(false)
  })

  it('应该正确显示规则名称', () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    expect(wrapper.text()).toContain('测试规则')
  })

  it('应该在用户选择时添加到已选用户列表', async () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    const testUser = { user_id: '1', nickname: 'Test User' }
    await wrapper.vm.handleUserSelect(testUser)

    expect(wrapper.vm.selectedUsers).toHaveLength(1)
    expect(wrapper.vm.selectedUsers[0]).toEqual(testUser)
  })

  it('应该防止重复添加同一个用户', async () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    const testUser = { user_id: '1', nickname: 'Test User' }
    await wrapper.vm.handleUserSelect(testUser)
    await wrapper.vm.handleUserSelect(testUser)

    expect(wrapper.vm.selectedUsers).toHaveLength(1)
  })

  it('应该能够移除已选用户', async () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    const testUser = { user_id: '1', nickname: 'Test User' }
    await wrapper.vm.handleUserSelect(testUser)
    await wrapper.vm.removeUser(testUser)

    expect(wrapper.vm.selectedUsers).toHaveLength(0)
  })

  it('应该在确认时调用API并触发success事件', async () => {
    authApi.inviteSupervisor.mockResolvedValue({
      code: 1,
      data: { success_count: 1 }
    })

    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    const testUser = { user_id: '1', nickname: 'Test User' }
    await wrapper.vm.handleUserSelect(testUser)
    await wrapper.vm.handleConfirm()

    expect(authApi.inviteSupervisor).toHaveBeenCalledWith({
      rule_id: 1,
      receiver_ids: ['1']
    })
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('应该在确认失败时不触发success事件', async () => {
    authApi.inviteSupervisor.mockResolvedValue({
      code: 0,
      msg: '邀请失败'
    })

    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    const testUser = { user_id: '1', nickname: 'Test User' }
    await wrapper.vm.handleUserSelect(testUser)
    await wrapper.vm.handleConfirm()

    expect(wrapper.emitted('success')).toBeFalsy()
  })

  it('应该在点击关闭按钮时触发close事件', async () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    await wrapper.vm.handleClose()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('应该在点击遮罩层时触发close事件', async () => {
    const wrapper = mount(InviteModal, {
      props: {
        visible: true,
        ruleId: 1,
        ruleName: '测试规则'
      },
      global: {
        components: {
          UserSearch,
          UniEasyInput,
          UniLoadMore
        }
      }
    })

    await wrapper.vm.handleOverlayClick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})