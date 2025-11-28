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
  updateUserProfile:(data) => {
    // 将前端的驼峰命名转换为后端的下划线命名
    const transformedData = {}
    for (const [key, value] of Object.entries(data)) {
      if (key === 'avatarUrl') {
        transformedData['avatar_url'] = value
      } else if (key === 'nickName') {
        transformedData['nickname'] = value
      } else {
        transformedData[key] = value
      }
    }
    return request({
      url: '/api/user/profile',
      method: 'POST',
      data: transformedData
    })
  }
}