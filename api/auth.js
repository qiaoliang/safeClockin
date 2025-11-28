// api/auth.js
import { request } from './request'

export const authApi = {
  login:(code) => request({
	  url: '/api/login',
	  method: 'POST',
	  data: { code }
  }),
  count:() => request({
	  url: '/api/count',
	  method:'GET'
  }),
  getUserProfile:() => request({
    url: '/api/user/profile',
    method: 'GET'
  }),
  updateUserProfile:(data) => request({
    url: '/api/user/profile',
    method: 'POST',
    data: data
  })
}