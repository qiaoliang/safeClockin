// api/auth.js
import { request } from './request'

export const authApi = {
  login: (data) => request({
    url: '/posts', // 使用测试API端点
    method: 'POST',
    data: {
      title: 'Login Request',
      body: JSON.stringify(data),
      userId: 1
    }
  }),
  
  getUserInfo: () => request({
    url: '/users/1', // 获取测试用户信息
    method: 'GET'
  }),
  
  logout: () => request({
    url: '/posts/1', // 模拟logout请求
    method: 'DELETE'
  })
}