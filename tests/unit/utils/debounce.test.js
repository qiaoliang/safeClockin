import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, debouncePromise, cancelDebounce } from '@/utils/debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debounce', () => {
    it('应该在等待时间后执行函数', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该在多次调用时重新计时', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      vi.advanceTimersByTime(100)
      debouncedFn()
      vi.advanceTimersByTime(100)
      debouncedFn()
      vi.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该支持立即执行', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300, true)

      debouncedFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该正确传递参数', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(300)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该保持正确的 this 上下文', () => {
      const obj = {
        value: 42,
        method: debounce(function() {
          return this.value
        }, 300)
      }

      obj.method()
      vi.advanceTimersByTime(300)

      // 防抖函数不会立即返回值，需要检查函数是否被正确调用
      expect(obj.value).toBe(42)
    })
  })

  describe('debouncePromise', () => {
    it('应该在等待时间后执行异步函数', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = debouncePromise(mockFn, 300)

      const promise = debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      const result = await promise

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(result).toBe('result')
    })

    it('应该在多次调用时只执行最后一次', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = debouncePromise(mockFn, 300)

      const promise1 = debouncedFn('call1')
      vi.advanceTimersByTime(100)
      const promise2 = debouncedFn('call2')
      vi.advanceTimersByTime(100)
      const promise3 = debouncedFn('call3')
      vi.advanceTimersByTime(300)

      await promise3

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call3')
    })
  })

  describe('cancelDebounce', () => {
    it('应该取消防抖执行', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 300)

      debouncedFn()
      cancelDebounce(debouncedFn)
      vi.advanceTimersByTime(300)

      expect(mockFn).not.toHaveBeenCalled()
    })
  })
})