import http from './http.js'

export const getCount=()=>{
	return http('/api/count')
}