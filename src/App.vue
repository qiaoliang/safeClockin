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
	@import '@/uni.scss';

page {
  background-color: $uni-bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.btn-primary {
  background: linear-gradient(135deg, $uni-primary 0%, $uni-primary-dark 100%);
  color: $uni-white;
  border-radius: $uni-radius-xl;
  font-size: $uni-font-size-xxl;
  font-weight: 600;
  box-shadow: $uni-shadow-primary-xl;
}

.btn-primary:active {
  transform: scale(0.98);
}

.input-default {
  background: $uni-white;
  border: 2rpx solid $uni-border-input;
  border-radius: $uni-radius-lg;
  padding: $uni-spacing-xl $uni-spacing-xxl;
  font-size: $uni-font-size-lg;
}

.input-default:focus {
  border-color: $uni-primary;
}
</style>
