// 测试前端适配新的登录响应格式
import { authApi } from '@/api/auth'

// 模拟后端新的响应格式
const mockNewLoginResponse = {
  code: 1,
  data: {
    token: 'test_token_123',
    refresh_token: 'test_refresh_token_456',
    user_id: 123,
    wechat_openid: 'test_openid_789',
    phone_number: '138****0001',
    nickname: 'Test User',
    avatar_url: 'http://test.com/avatar.jpg',
    role: 'solo',
    login_type: 'existing_user'
  },
  msg: 'success'
}

// 模拟后端新的注册响应格式
const mockNewRegisterResponse = {
  code: 1,
  data: {
    token: 'new_token_123',
    refresh_token: 'new_refresh_token_456',
    user_id: 456,
    wechat_openid: 'phone_new_user_789',
    phone_number: '139****0002',
    nickname: 'New User',
    avatar_url: null,
    role: 'solo',
    login_type: 'new_user'
  },
  msg: 'success'
}

// 测试函数
export function testLoginResponseTransformation() {
  console.log('=== 测试登录响应转换 ===')
  
  // 模拟API响应处理
  const transformedLogin = transformResponse(mockNewLoginResponse)
  console.log('转换后的登录响应:', transformedLogin)
  
  // 验证关键字段
  const expectedFields = ['token', 'refreshToken', 'userId', 'wechatOpenid', 'phoneNumber', 'loginType', 'isNewUser']
  const hasAllFields = expectedFields.every(field => field in transformedLogin.data)
  
  console.log('是否包含所有预期字段:', hasAllFields)
  console.log('login_type 是否正确转换:', transformedLogin.data.loginType === 'existing_user')
  console.log('isNewUser 是否正确设置:', transformedLogin.data.isNewUser === false)
  
  return hasAllFields
}

export function testRegisterResponseTransformation() {
  console.log('=== 测试注册响应转换 ===')
  
  // 模拟API响应处理
  const transformedRegister = transformResponse(mockNewRegisterResponse)
  console.log('转换后的注册响应:', transformedRegister)
  
  // 验证关键字段
  const hasAllFields = ['token', 'refreshToken', 'userId', 'wechatOpenid', 'phoneNumber', 'loginType', 'isNewUser']
    .every(field => field in transformedRegister.data)
  
  console.log('是否包含所有预期字段:', hasAllFields)
  console.log('login_type 是否正确转换:', transformedRegister.data.loginType === 'new_user')
  console.log('isNewUser 是否正确设置:', transformedRegister.data.isNewUser === true)
  
  return hasAllFields
}

// 辅助函数：模拟响应转换逻辑
function transformResponse(response) {
  if (response && response.code === 1 && response.data) {
    const transformedData = {}
    for (const [key, value] of Object.entries(response.data)) {
      if (key === 'user_id') {
        transformedData['userId'] = value
      } else if (key === 'wechat_openid') {
        transformedData['wechatOpenid'] = value
      } else if (key === 'phone_number') {
        transformedData['phoneNumber'] = value
      } else if (key === 'avatar_url') {
        transformedData['avatarUrl'] = value
      } else if (key === 'refresh_token') {
        transformedData['refreshToken'] = value
      } else if (key === 'login_type') {
        transformedData['loginType'] = value
        transformedData['isNewUser'] = value === 'new_user'
      } else {
        transformedData[key] = value
      }
    }
    response.data = transformedData
  }
  return response
}

// 运行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  console.log('在浏览器控制台中运行以下命令来测试:')
  console.log('testLoginResponseTransformation()')
  console.log('testRegisterResponseTransformation()')
} else {
  // Node.js环境
  testLoginResponseTransformation()
  testRegisterResponseTransformation()
}