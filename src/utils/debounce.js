/**
 * 防抖工具模块
 * 在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 */

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 * @example
 * const handleSearch = debounce(async (keyword) => {
 *   const results = await api.searchUsers(keyword)
 *   searchResults.value = results
 * }, 300)
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout

  const debounced = function executedFunction(...args) {
    const context = this

    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }

    const callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(context, args)
  }

  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = null
  }

  return debounced
}

/**
 * 防抖函数（Promise 版本）
 * @param {Function} func - 要防抖的异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 * @example
 * const handleSearch = debouncePromise(async (keyword) => {
 *   return await api.searchUsers(keyword)
 * }, 300)
 */
export function debouncePromise(func, wait = 300) {
  let timeout
  let pendingPromise = null

  return function executedFunction(...args) {
    return new Promise((resolve, reject) => {
      // 清除之前的定时器和 Promise
      if (timeout) {
        clearTimeout(timeout)
      }
      if (pendingPromise) {
        pendingPromise.reject(new Error('Debounced'))
        pendingPromise = null
      }

      // 创建新的 Promise
      const promise = { resolve, reject }
      pendingPromise = promise

      // 设置定时器
      timeout = setTimeout(async () => {
        timeout = null
        pendingPromise = null

        try {
          const result = await func.apply(this, args)
          promise.resolve(result)
        } catch (error) {
          promise.reject(error)
        }
      }, wait)
    })
  }
}

/**
 * 取消防抖
 * @param {Function} debouncedFn - 防抖后的函数
 */
export function cancelDebounce(debouncedFn) {
  if (debouncedFn && debouncedFn.cancel) {
    debouncedFn.cancel()
  }
}