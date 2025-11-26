// api/auth.js
import { request } from './request'

export const authApi = {
  login:(code) => request({
	  url: '/api/login',
	  method: 'GET',
	  data:{code}
  }),
}