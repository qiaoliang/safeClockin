/**
 * 测试辅助函数
 * 仅在开发环境中可用，用于 E2E 测试中访问应用状态
 */

if (typeof window !== 'undefined') {
  // 暴露一个全局函数，用于获取当前的用户状态
  window.__TEST_GET_USER_STATE__ = function() {
    try {
      // 尝试从 localStorage 读取 pinia 状态
      const stored = localStorage.getItem('userState')
      if (stored) {
        // 尝试解析为 JSON（可能是加密的）
        try {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') {
            console.log('✅ [Test Helper] 从 localStorage 读取到 userState（未加密）')
            return parsed
          }
        } catch (e) {
          console.log('⚠️ [Test Helper] userState 是加密的，无法直接读取')
          return null
        }
      }
      return null
    } catch (error) {
      console.error('❌ [Test Helper] 读取 userState 失败:', error)
      return null
    }
  }

  console.log('✅ [Test Helper] 测试辅助函数已加载')
}
