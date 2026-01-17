import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UserSearch from '@/components/UserSearch.vue'
import { searchUsers } from '@/api/user'

// Mock API
vi.mock('@/api/user', () => ({
  searchUsers: vi.fn()
}))

// Mock uni-easyinput
const UniEasyInput = {
  name: 'UniEasyInput',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @clear="$emit(\'clear\')" />',
  props: ['modelValue', 'placeholder', 'clearable'],
  emits: ['update:modelValue', 'input', 'clear']
}

// Mock uni-load-more
const UniLoadMore = {
  name: 'UniLoadMore',
  template: '<div>{{ contentText.contentdown }}</div>',
  props: ['status', 'contentText']
}

describe('UserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(UserSearch, {
      global: {
        components: {
          'uni-easyinput': UniEasyInput,
          'uni-load-more': UniLoadMore
        }
      }
    })

    expect(wrapper.find('.user-search').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('应该在清空输入时清空搜索结果', async () => {
    searchUsers.mockResolvedValue({
      code: 1,
      data: [{ user_id: '1', nickname: 'Test User' }]
    })

    const wrapper = mount(UserSearch, {
      global: {
        components: {
          'uni-easyinput': UniEasyInput,
          'uni-load-more': UniLoadMore
        }
      }
    })

    // 手动设置搜索结果
    wrapper.vm.searchResults = [{ user_id: '1', nickname: 'Test User' }]
    wrapper.vm.searchKeyword = 'test'

    // 清空输入
    await wrapper.vm.handleClear()

    expect(wrapper.vm.searchKeyword).toBe('')
    expect(wrapper.vm.searchResults).toEqual([])
  })

  it('应该在用户点击时触发 user-select 事件', async () => {
    const wrapper = mount(UserSearch, {
      global: {
        components: {
          'uni-easyinput': UniEasyInput,
          'uni-load-more': UniLoadMore
        }
      }
    })

    // 直接调用 handleUserClick 方法来测试事件触发
    const testUser = { user_id: '1', nickname: 'Test User' }
    wrapper.vm.handleUserClick(testUser)

    expect(wrapper.emitted('user-select')).toBeTruthy()
    expect(wrapper.emitted('user-select')[0][0]).toEqual(testUser)
  })

  it('应该正确格式化电话号码', () => {
    const wrapper = mount(UserSearch, {
      global: {
        components: {
          'uni-easyinput': UniEasyInput,
          'uni-load-more': UniLoadMore
        }
      }
    })

    expect(wrapper.vm.formatPhone('13812345678')).toBe('138****5678')
    expect(wrapper.vm.formatPhone('123')).toBe('123')
    expect(wrapper.vm.formatPhone('')).toBe('')
  })
})