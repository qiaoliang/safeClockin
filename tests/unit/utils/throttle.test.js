import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle, throttlePromise, cancelThrottle } from '@/utils/throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('throttle', () => {
    it('应该在节流期内只执行一次', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300)

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(300)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('应该支持配置 leading 选项', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300, { leading: false })

      throttledFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该支持配置 trailing 选项', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300, { trailing: false })

      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(300)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('应该正确传递参数', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300)

      throttledFn('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('应该保持正确的 this 上下文', () => {
      const obj = {
        value: 42,
        method: throttle(function() {
          return this.value
        }, 300)
      }

      const result = obj.method()
      expect(result).toBe(42)
    })
  })

  describe('throttlePromise', () => {
    it('应该在节流期内只执行一次异步函数', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const throttledFn = throttlePromise(mockFn, 300)

      const promise1 = throttledFn('call1')
      const promise2 = throttledFn('call2')

      await promise1

      // 由于两个调用都在节流期内，第一个调用会执行，第二个会返回第一个的 Promise
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('call1')
    })
  })

  describe('cancelThrottle', () => {
    it('应该取消节流执行', () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 300)

      // 第一次调用会立即执行（leading: true）
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(1)

      // 取消节流
      cancelThrottle(throttledFn)

      // 等待节流期结束
      vi.advanceTimersByTime(300)
      
      // 再次调用，由于已取消，应该可以正常执行
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})