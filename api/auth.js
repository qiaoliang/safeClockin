// api/auth.js
import { request } from './request'

export const authApi = {
  login:(code) => request({
	  url: '/api/count',
	  method: 'GET'
  }),
  count:() => request({
	  url: '/api/count',
	  method:'GET'
  })
}