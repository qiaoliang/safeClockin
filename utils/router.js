// utils/router.js
import { useUserStore } from '@/store/modules/user'

export function routeGuard(url, options = {}) {
  const userStore = useUserStore()
  
  if (isAuthRequired(url) && !userStore.isLoggedIn) {
    uni.redirectTo({
      url: '/pages/login/login'
    })
    return false
  }
  
  if (isRoleRequired(url) && !hasRequiredRole(url, userStore.role)) {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    })
    return false
  }
  
  uni.navigateTo({
    url,
    ...options
  })
  
  return true
}

const isAuthRequired = (url) => {
  const authPages = [
    '/pages/home-solo/home-solo',
    '/pages/home-supervisor/home-supervisor',
    '/pages/home-community/home-community',
    '/pages/profile/profile'
  ]
  
  return authPages.some(page => url.includes(page))
}

const isRoleRequired = (url) => {
  const rolePages = {
    '/pages/home-solo/home-solo': 'solo',
    '/pages/home-supervisor/home-supervisor': 'supervisor',
    '/pages/home-community/home-community': 'community'
  }
  
  return Object.keys(rolePages).some(page => 
    url.includes(page) && rolePages[page]
  )
}

const hasRequiredRole = (url, userRole) => {
  const rolePages = {
    '/pages/home-solo/home-solo': 'solo',
    '/pages/home-supervisor/home-supervisor': 'supervisor',
    '/pages/home-community/home-community': 'community'
  }
  
  const requiredRole = Object.keys(rolePages).find(page => url.includes(page))
  return requiredRole ? rolePages[requiredRole] === userRole : true
}

export const getHomePageByRole = (role) => {
  const homePages = {
    solo: '/pages/home-solo/home-solo',
    supervisor: '/pages/home-supervisor/home-supervisor',
    community: '/pages/home-community/home-community'
  }
  
  return homePages[role] || '/pages/login/login'
}