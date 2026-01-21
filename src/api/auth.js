// api/auth.js
import { request } from './request'
import { useUserStore } from '@/store/modules/user'
import { getAPIBaseURL } from '@/config/index'

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
      url: '/api/auth/login_wechat',
      method: 'POST',
      data: requestData
    }).then(response => {
      // 处理新的统一响应格式
      if (response && response.code === 1 && response.data) {
        // 将后端的下划线命名转换为前端的驼峰命名
        const transformedData = {}
        for (const [key, value] of Object.entries(response.data)) {
          if (key === 'user_id') {
            transformedData['userId'] = value
          } else if (key === 'wechat_openid') {
            transformedData['wechatOpenid'] = value
          } else if (key === 'phone_number') {
            transformedData['phone_number'] = value
          } else if (key === 'avatar_url') {
            transformedData['avatarUrl'] = value
          } else if (key === 'refresh_token') {
            transformedData['refreshToken'] = value
          } else if (key === 'login_type') {
            transformedData['loginType'] = value
            // 兼容旧字段名
            transformedData['isNewUser'] = value === 'new_user'
          } else {
            transformedData[key] = value
          }
        }
        response.data = transformedData
      }
      return response
    });
  },
  count: () => request({
    url: '/api/count',
    method: 'GET'
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
          } else if (key === 'community_name') {
            transformedData['communityName'] = value
          } else if (key === 'role_name') {
            transformedData['roleName'] = value
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
    console.log('updateUserProfile - 发送的数据:', transformedData)
    return request({
      url: '/api/user/profile',
      method: 'POST',
      data: transformedData
    })
  },
  uploadAvatar:(file) => {
    return new Promise((resolve, reject) => {
      const userStore = useUserStore()
      uni.uploadFile({
        url: `${getAPIBaseURL()}/api/user/upload-avatar`,
        filePath: file,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${userStore.token}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        },
        fail: reject
      })
    })
  },
  changePassword:(data) => {
    return request({
      url: '/api/user/change-password',
      method: 'POST',
      data: data
    })
  },
  
  // 打卡相关API
  getTodayCheckinItems:() => request({
    url: '/api/user-checkin/today-plan',
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
    url: '/api/user-checkin/rules',
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
  inviteSupervisor:(data) => request({
    url: '/api/supervision/invite/internal',
    method: 'POST',
    data
  }),
  inviteSupervisorLink:(data) => request({
    url: '/api/supervision/invite_link',
    method: 'POST',
    data
  }),
  resolveInviteToken:(params) => request({
    url: '/api/supervision/invite/resolve',
    method: 'GET',
    data: params
  }),
  getSupervisionInvitations:(params) => request({
    url: '/api/supervision/invitations',
    method: 'GET',
    data: params
  }),
  acceptSupervisionInvitation:(relationId) => request({
    url: `/api/supervision/invitations/${relationId}/accept`,
    method: 'POST'
  }),
  rejectSupervisionInvitation:(relationId) => request({
    url: `/api/supervision/invitations/${relationId}/reject`,
    method: 'POST'
  }),
  getMySupervisedUsers:() => request({
    url: '/api/supervision/my_supervised',
    method: 'GET'
  }),
  getMyGuardians:() => request({
    url: '/api/supervision/my_guardians',
    method: 'GET'
  }),
  getSupervisedRecords:(params) => request({
    url: '/api/supervision/records',
    method: 'GET',
    data: params
  }),
  
  // 登出相关API
  logout:() => request({
    url: '/api/logout',
    method: 'POST'
  }),
  sendSmsCode: (data) => request({
    url: '/api/sms/send_code',
    method: 'POST',
    data
  }),
  registerPhone: (data) => request({
    url: '/api/auth/register_phone',
    method: 'POST',
    data
  }).then(response => {
    // 处理新的统一响应格式
    if (response && response.code === 1 && response.data) {
      const transformedData = {}
      for (const [key, value] of Object.entries(response.data)) {
        if (key === 'user_id') {
          transformedData['userId'] = value
        } else if (key === 'wechat_openid') {
          transformedData['wechatOpenid'] = value
        } else if (key === 'phone_number') {
          transformedData['phone_number'] = value
        } else if (key === 'avatar_url') {
          transformedData['avatarUrl'] = value
        } else if (key === 'refresh_token') {
          transformedData['refreshToken'] = value
        } else if (key === 'login_type') {
          transformedData['loginType'] = value
          transformedData['isNewUser'] = value === 'new_user'
        } else if (key === 'community_id') {
          transformedData['communityId'] = value
        } else if (key === 'community_name') {
          transformedData['communityName'] = value
        } else {
          transformedData[key] = value
        }
      }
      response.data = transformedData
    }
    return response
  }),
  loginPhoneCode: (data) => request({
    url: '/api/auth/login_phone_code',
    method: 'POST',
    data
  }).then(response => {
    // 处理新的统一响应格式
    if (response && response.code === 1 && response.data) {
      const transformedData = {}
      for (const [key, value] of Object.entries(response.data)) {
        if (key === 'user_id') {
          transformedData['userId'] = value
        } else if (key === 'wechat_openid') {
          transformedData['wechatOpenid'] = value
        } else if (key === 'phone_number') {
          transformedData['phone_number'] = value
        } else if (key === 'avatar_url') {
          transformedData['avatarUrl'] = value
        } else if (key === 'refresh_token') {
          transformedData['refreshToken'] = value
        } else if (key === 'login_type') {
          transformedData['loginType'] = value
          transformedData['isNewUser'] = value === 'new_user'
        } else if (key === 'community_id') {
          transformedData['communityId'] = value
        } else if (key === 'community_name') {
          transformedData['communityName'] = value
        } else {
          transformedData[key] = value
        }
      }
      response.data = transformedData
    }
    return response
  }),
  loginPhonePassword: (data) => request({
    url: '/api/auth/login_phone_password',
    method: 'POST',
    data
  }),
  loginPhone: (data) => request({
    url: '/api/auth/login_phone',
    method: 'POST',
    data
  }).then(response => {
    // 处理新的统一响应格式
    if (response && response.code === 1 && response.data) {
      const transformedData = {}
      for (const [key, value] of Object.entries(response.data)) {
        if (key === 'user_id') {
          transformedData['userId'] = value
        } else if (key === 'wechat_openid') {
          transformedData['wechatOpenid'] = value
        } else if (key === 'phone_number') {
          transformedData['phone_number'] = value
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
  })
  ,
  bindPhone: (data) => request({
    url: '/api/user/bind_phone',
    method: 'POST',
    data
  }),
  bindWechat: (data) => request({
    url: '/api/user/bind_wechat',
    method: 'POST',
    data
  }),
  // 搜索用户（用于社区添加用户）
  searchUsers: (params) => request({
    url: '/api/user/search',
    method: 'GET',
    data: params
  }).then(response => {
    // 处理响应数据格式转换
    if (response && response.code === 1 && response.data && response.data.users) {
      const transformedUsers = response.data.users.map(user => ({
        userId: user.user_id,
        nickname: user.nickname,
        phone_number: user.phone_number,
        avatarUrl: user.avatar_url,
        isSupervisor: user.is_supervisor
      }))
      response.data.users = transformedUsers
    }
    return response
  }),
  // 从安卡大家庭搜索用户（用于添加用户到其他社区）
  searchAnkaFamilyUsers: (params) => request({
    url: '/api/user/search',
    method: 'GET',
    data: params
  }).then(response => {
    // 处理响应数据格式转换
    if (response && response.code === 1 && response.data && response.data.users) {
      const transformedUsers = response.data.users.map(user => ({
        userId: user.user_id,
        nickname: user.nickname,
        phone_number: user.phone_number,
        avatarUrl: user.avatar_url,
        isStaff: user.is_staff,
        communityId: user.community_id,
        communityName: user.community_name
      }))
      response.data.users = transformedUsers
    }
    return response
  })
}
