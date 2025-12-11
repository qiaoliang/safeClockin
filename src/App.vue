<script>
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from '@/utils/router'

export default {
  onLaunch() {
    console.log('App Launch')
    
    const userStore = useUserStore()
    userStore.initUserState()
    
    this.checkLaunchScene()
  },
  
  onShow() {
    console.log('App Show')
  },
  
  onHide() {
    console.log('App Hide')
  },
  
  methods: {
    checkLaunchScene() {
      const userStore = useUserStore()
      
      if (userStore.isLoggedIn && userStore.userInfo.role) {
        const homePage = getHomePageByRole(userStore.userInfo.role)
        
        // 检查是否为tabbar页面，如果是则使用switchTab，否则使用redirectTo
        const tabbarPages = [
          '/pages/home-solo/home-solo',
          '/pages/home-community/home-community',
          '/pages/profile/profile'
        ]
        
        setTimeout(() => {
          if (tabbarPages.includes(homePage)) {
            uni.switchTab({
              url: homePage
            })
          } else {
            uni.redirectTo({
              url: homePage
            })
          }
        }, 100)
      }
    }
  }
}
</script>

<style lang='scss'>
	@import '@/uni_modules/uni-scss/index.scss';
page {
  background-color: #FAE9DB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.btn-primary {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border-radius: 32rpx;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.4);
}

.btn-primary:active {
  transform: scale(0.98);
}

.input-default {
  background: white;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  font-size: 32rpx;
}

.input-default:focus {
  border-color: #F48224;
}
</style>
