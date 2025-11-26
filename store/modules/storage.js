// store/modules/storage.js
export const storage = {
  set(key, value) {
    try {
      uni.setStorageSync(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('存储失败:', error)
      return false
    }
  },
  
  get(key) {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('读取存储失败:', error)
      return null
    }
  },
  
  remove(key) {
    try {
      uni.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除存储失败:', error)
      return false
    }
  },
  
  clear() {
    try {
      uni.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空存储失败:', error)
      return false
    }
  }
}