// api/auth.js
import { request } from './request'

export const authApi = {
  login:(loginData) => {
    // 如果loginData是字符串，说明只传入了code（非首次登录）
    // 如果loginData是对象，说明包含了code和用户信息（首次登录）
    let requestData;
    if (typeof loginData === 'string') {
      requestData = { code: loginData };
    } else {
      requestData = loginData;
    }
    return request({
      url: '/api/login',
      method: 'POST',
      data: requestData
    });
  },
  count:() => request({
	  url: '/api/count',
	  method:'GET'
  }),
  getUserProfile:() => {
    return request({
      url: '/api/user/profile',
      method: 'GET'
    }).then(response => {
      // 如果请求成功，将后端的下划线命名转换为前端的驼峰命名
      if (response && response.code === 1 && response.data) {
        const transformedData = {}
        for (const [key, value] of Object.entries(response.data)) {
          if (key === 'nickname') {
            transformedData['nickName'] = value
          } else if (key === 'avatar_url') {
            transformedData['avatarUrl'] = value
          } else if (key === 'wechat_openid') {
            transformedData['wechatOpenid'] = value
          } else if (key === 'phone_number') {
            transformedData['phoneNumber'] = value
          } else if (key === 'community_id') {
            transformedData['communityId'] = value
          } else {
            transformedData[key] = value
          }
        }
        response.data = transformedData
      }
      return response
    })
  },
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
  // 监督相关API
  searchUsers:(params) => request({
    url: '/api/users/search',
    method: 'GET',
    data: params
  }),
  inviteSupervisor:(data) => request({
    url: '/api/rules/supervision/invite',
    method: 'POST',
    data
  }),
  inviteSupervisorLink:(data) => request({
    url: '/api/rules/supervision/invite_link',
    method: 'POST',
    data
  }),
  resolveInviteToken:(params) => request({
    url: '/api/rules/supervision/invite/resolve',
    method: 'GET',
    data: params
  }),
  getSupervisionInvitations:(params) => request({
    url: '/api/rules/supervision/invitations',
    method: 'GET',
    data: params
  }),
  acceptSupervisionInvitation:(data) => request({
    url: '/api/rules/supervision/accept',
    method: 'POST',
    data
  }),
  rejectSupervisionInvitation:(data) => request({
    url: '/api/rules/supervision/reject',
    method: 'POST',
    data
  }),
  getMySupervisedUsers:() => request({
    url: '/api/rules/supervision/my_supervised',
    method: 'GET'
  }),
  getMyGuardians:() => request({
    url: '/api/rules/supervision/my_guardians',
    method: 'GET'
  }),
  getSupervisedRecords:(params) => request({
    url: '/api/rules/supervision/records',
    method: 'GET',
    data: params
  }),
  
  // 登出相关API
  logout:() => request({
    url: '/api/logout',
    method: 'POST'
  })
  ,
  sendSmsCode: (data) => request({
    url: '/api/sms/send_code',
    method: 'POST',
    data
  }),
  registerPhone: (data) => request({
    url: '/api/auth/register_phone',
    method: 'POST',
    data
  }),
  loginPhoneCode: (data) => request({
    url: '/api/auth/login_phone_code',
    method: 'POST',
    data
  }),
  loginPhonePassword: (data) => request({
    url: '/api/auth/login_phone_password',
    method: 'POST',
    data
  })
}
