import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InfiniteScroll from '@/components/InfiniteScroll.vue'

// Mock scroll-view
const ScrollView = {
  name: 'ScrollView',
  template: '<div class="scroll-container"><slot /></div>',
  emits: ['scrolltolower']
}

// Mock uni-load-more
const UniLoadMore = {
  name: 'UniLoadMore',
  template: '<div>加载中...</div>',
  props: ['status']
}

describe('InfiniteScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确渲染组件', () => {
    const loadMore = vi.fn().mockResolvedValue([])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      },
      global: {
        components: {
          'scroll-view': ScrollView,
          'uni-load-more': UniLoadMore
        }
      }
    })

    expect(wrapper.find('.infinite-scroll').exists()).toBe(true)
    expect(wrapper.find('.scroll-container').exists()).toBe(true)
  })

  it('应该在加载中时不重复触发加载', () => {
    const loadMore = vi.fn().mockResolvedValue([])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      },
      global: {
        components: {
          'scroll-view': ScrollView,
          'uni-load-more': UniLoadMore
        }
      }
    })

    // 设置加载状态
    wrapper.vm.loading = true

    // 直接调用 handleScrollToLower 方法
    wrapper.vm.handleScrollToLower()

    // 不应该调用 loadMore
    expect(loadMore).not.toHaveBeenCalled()
  })

  it('应该在无更多数据时不触发加载', () => {
    const loadMore = vi.fn().mockResolvedValue([])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: false
      },
      global: {
        components: {
          'scroll-view': ScrollView,
          'uni-load-more': UniLoadMore
        }
      }
    })

    // 直接调用 handleScrollToLower 方法
    wrapper.vm.handleScrollToLower()

    // 不应该调用 loadMore
    expect(loadMore).not.toHaveBeenCalled()
  })

  it('应该支持重置列表', () => {
    const loadMore = vi.fn().mockResolvedValue([])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      },
      global: {
        components: {
          'scroll-view': ScrollView,
          'uni-load-more': UniLoadMore
        }
      }
    })

    // 重置
    wrapper.vm.reset()

    // 验证初始状态
    expect(wrapper.vm.items).toEqual([])
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('应该暴露 reset、items 和 loading 方法', () => {
    const loadMore = vi.fn().mockResolvedValue([])

    const wrapper = mount(InfiniteScroll, {
      props: {
        loadMore,
        hasMore: true
      },
      global: {
        components: {
          'scroll-view': ScrollView,
          'uni-load-more': UniLoadMore
        }
      }
    })

    expect(wrapper.vm.reset).toBeDefined()
    expect(wrapper.vm.items).toBeDefined()
    expect(wrapper.vm.loading).toBeDefined()
  })
})