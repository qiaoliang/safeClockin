let baseURL = 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com' // 真实API地址


export default function http(url,data={},method='GET'){
	return new Promise((resolve, reject) => {
	    uni.request =>({
	        url : baseUrl + url,
	        data,
			method,
			header:{
				'token': uni.getStorageSync('token')||''
			},
			success: res =>{
				if(res.statusCode == 200){
					if(res.data.code == 1){    // 业务返回正常码
						resolve(res.data.data)
					}else if(res.data.code==0){ // 业务异常码
						uni.showToast({
							title: res.data.msg,
							icon: 'none'
						})
						reject(res.data.msg)
					}
				}
			},
			fail: () =>{
				uni.showToast({
					title: '服务器异常。',
					icon: 'none'
				})
			}
	    })
	})
}