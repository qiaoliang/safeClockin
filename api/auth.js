// api/auth.js
import { request } from './request'

export const authApi = {
  login: (data) => request({
    url: '/auth/wechat-login',
    method: 'POST',
    data
  }),
  
  getUserInfo: () => request({
    url: '/auth/user-info',
    method: 'GET'
  }),
  
  logout: () => request({
    url: '/auth/logout',
    method: 'POST'
  })
}