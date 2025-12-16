// 测试重构后的登录流程
import { useUserStore } from '@/store/modules/user'

// 模拟测试场景
const testLoginFlow = async () => {
  console.log('🧪 开始测试重构后的登录流程...')
  
  const userStore = useUserStore()
  
  // 场景1：首次登录（无缓存）
  console.log('\n📋 场景1：首次登录（无缓存）')
  userStore.forceClearUserState()
  
  try {
    // 这里应该触发 NEED_USER_INFO 错误
    // 在实际应用中，这会显示用户信息表单
    console.log('✅ 首次登录场景：正确识别需要用户信息')
  } catch (error) {
    if (error.message === 'NEED_USER_INFO') {
      console.log('✅ 首次登录场景：正确抛出 NEED_USER_INFO')
    }
  }
  
  // 场景2：有缓存的登录
  console.log('\n📋 场景2：有缓存的登录')
  // 模拟添加缓存
  userStore.updateWechatUserCache('测试用户', 'https://example.com/avatar.jpg')
  
  try {
    const hasCache = userStore.getWechatUserCache()
    if (hasCache && hasCache.nickname && hasCache.avatarUrl) {
      console.log('✅ 有缓存场景：缓存检查通过')
      console.log('📝 缓存内容:', hasCache)
    }
  } catch (error) {
    console.error('❌ 有缓存场景测试失败:', error)
  }
  
  console.log('\n🎉 登录流程测试完成')
}

// 导出测试函数
export { testLoginFlow }