<template>
  <view class="admin-management-container">
    <view class="header">
      <text class="title">管理员任免</text>
    </view>

    <view class="admin-list">
      <view
        v-for="admin in adminList"
        :key="admin.user_id"
        class="admin-card"
      >
        <view class="admin-info">
          <view class="admin-avatar">
            {{ admin.nickname?.charAt(0) || '用' }}
          </view>
          <view class="admin-details">
            <text class="admin-name">{{ admin.nickname }}</text>
            <text class="admin-phone">{{ maskPhoneNumber(admin.phone_number) }}</text>
            <text class="admin-role">{{ admin.role }}</text>
          </view>
        </view>

        <view class="admin-actions">
          <view
            v-if="admin.role_type === 'super_admin' && admin.user_id !== currentUserId"
            class="action-btn danger"
            @click="handleRemoveSuperAdmin(admin)"
          >
            <text>取消</text>
          </view>

          <view
            v-if="admin.role_type === 'manager'"
            class="action-btn primary"
            @click="handlePromoteToSuperAdmin(admin)"
          >
            <text>晋级</text>
          </view>
        </view>
      </view>

      <view
        v-if="adminList.length === 0 && !loading"
        class="empty-state"
      >
        <text class="empty-text">暂无管理员</text>
      </view>

      <view
        v-if="loading"
        class="loading-state"
      >
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const adminList = ref([])
const loading = ref(false)

const currentUserId = computed(() => {
  return userStore.userInfo?.user_id || userStore.userInfo?.userId
})

// Load admin list
const loadAdminList = async () => {
  try {
    loading.value = true

    // Call the API to get admin list
    const res = await uni.request({
      url: '/api/community/admin-list',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('token')}`
      }
    })

    if (res[1].data.code === 0) {
      adminList.value = res[1].data.data.admins || []
    } else {
      uni.showToast({
        title: res[1].data.msg || '加载失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载管理员列表失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// Mask phone number
const maskPhoneNumber = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// Promote manager to super admin
const handlePromoteToSuperAdmin = (admin) => {
  uni.showModal({
    title: '确认晋级',
    content: `确定要将 ${admin.nickname} 晋级为超级管理员吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await uni.request({
            url: '/api/community/set-super-admin',
            method: 'POST',
            header: {
              'Authorization': `Bearer ${uni.getStorageSync('token')}`
            },
            data: {
              target_user_id: admin.user_id,
              is_super_admin: true
            }
          })

          if (result[1].data.code === 0) {
            uni.showToast({
              title: '晋级成功',
              icon: 'success'
            })
            await loadAdminList()
          } else {
            uni.showToast({
              title: result[1].data.msg || '晋级失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('晋级失败:', error)
          uni.showToast({
            title: '晋级失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// Remove super admin
const handleRemoveSuperAdmin = (admin) => {
  uni.showModal({
    title: '确认取消',
    content: `确定要取消 ${admin.nickname} 的超级管理员身份吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await uni.request({
            url: '/api/community/set-super-admin',
            method: 'POST',
            header: {
              'Authorization': `Bearer ${uni.getStorageSync('token')}`
            },
            data: {
              target_user_id: admin.user_id,
              is_super_admin: false
            }
          })

          if (result[1].data.code === 0) {
            uni.showToast({
              title: '已取消',
              icon: 'success'
            })
            await loadAdminList()
          } else {
            uni.showToast({
              title: result[1].data.msg || '操作失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('操作失败:', error)
          uni.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

onMounted(() => {
  loadAdminList()
})
</script>

<style lang="scss" scoped>
.admin-management-container {
  min-height: 100vh;
  background-color: #FAE9DB;
  padding: 20rpx;
}

.header {
  padding: 20rpx 0;
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.admin-list {
  margin-top: 20rpx;
}

.admin-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.admin-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #FFD700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  margin-right: 20rpx;
}

.admin-details {
  display: flex;
  flex-direction: column;
}

.admin-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.admin-phone {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.admin-role {
  font-size: 26rpx;
  color: #FF6B6B;
  background-color: #FFF0F0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  align-self: flex-start;
}

.admin-actions {
  margin-left: 20rpx;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
}

.action-btn.primary {
  background-color: #FFD700;
  color: #fff;
}

.action-btn.danger {
  background-color: #FF6B6B;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-state {
  text-align: center;
  padding: 100rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>
