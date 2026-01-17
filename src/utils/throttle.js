/**
 * 节流工具模块
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 */

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在开始时立即执行，默认 true
 * @param {boolean} options.trailing - 是否在结束时执行，默认 true
 * @returns {Function} 节流后的函数
 * @example
 * const handleScroll = throttle(() => {
 *   loadMoreData()
 * }, 500)
 */
export function throttle(func, wait = 300, options = {}) {
  let timeout
  let context
  let args
  let result
  let previous = 0

  const { leading = true, trailing = true } = options

  const later = () => {
    previous = leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }

  const throttled = function (...params) {
    const now = Date.now()
    if (!previous && leading === false) previous = now

    const remaining = wait - (now - previous)
    context = this
    args = params

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining)
    }

    return result
  }

  throttled.cancel = () => {
    clearTimeout(timeout)
    previous = 0
    timeout = null
    context = null
    args = null
  }

  return throttled
}

/**
 * 节流函数（Promise 版本）
 * @param {Function} func - 要节流的异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 * @example
 * const handleScroll = throttlePromise(async () => {
 *   return await loadMoreData()
 * }, 500)
 */
export function throttlePromise(func, wait = 300) {
  let lastTime = 0
  let pendingPromise = null

  return function executedFunction(...args) {
    const now = Date.now()

    // 如果在节流期内且已有执行中的 Promise，返回它
    if (now - lastTime < wait && pendingPromise) {
      return pendingPromise
    }

    // 更新时间并执行函数
    lastTime = now
    const promise = func.apply(this, args)
    pendingPromise = promise

    promise.finally(() => {
      pendingPromise = null
    })

    return promise
  }
}

/**
 * 取消节流
 * @param {Function} throttledFn - 节流后的函数
 */
export function cancelThrottle(throttledFn) {
  if (throttledFn && throttledFn.cancel) {
    throttledFn.cancel()
  }
}