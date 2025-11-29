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
  },
  
  // 打卡相关API
  getTodayCheckinItems:() => request({
    url: '/api/checkin/today',
    method: 'GET'
  }),
  performCheckin:(data) => request({
    url: '/api/checkin',
    method: 'POST',
    data: data
  }),
  cancelCheckin:(data) => request({
    url: '/api/checkin/cancel',
    method: 'POST',
    data: data
  }),
  getCheckinHistory:(params) => request({
    url: '/api/checkin/history',
    method: 'GET',
    data: params
  }),
  getCheckinRules:() => request({
    url: '/api/checkin/rules',
    method: 'GET'
  }),
  createCheckinRule:(data) => request({
    url: '/api/checkin/rules',
    method: 'POST',
    data: data
  }),
  updateCheckinRule:(data) => request({
    url: '/api/checkin/rules',
    method: 'PUT',
    data: data
  }),
  deleteCheckinRule:(data) => request({
    url: '/api/checkin/rules',
    method: 'DELETE',
    data: data
  }),
  
  // 登出相关API
  logout:() => request({
    url: '/api/logout',
    method: 'POST'
  })
}