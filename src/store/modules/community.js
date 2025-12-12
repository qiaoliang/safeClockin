// store/modules/community.js
import { defineStore } from 'pinia'
import { request } from '@/api/request'

export const useCommunityStore = defineStore('community', {
  state: () => ({
    // 社区列表
    communities: [],
    currentCommunity: null,
    
    // 工作人员列表
    staffMembers: [],
    
    // 社区用户列表
    communityUsers: [],
    
    // 加载状态
    loading: false,
    hasMore: true,
    
    // 分页信息
    currentPage: 1,
    pageSize: 20
  }),
  
  getters: {
    // 获取启用的社区
    activeCommunities: (state) => {
      return state.communities.filter(c => c.status === 'active')
    },
    
    // 获取停用的社区
    inactiveCommunities: (state) => {
      return state.communities.filter(c => c.status === 'inactive')
    },
    
    // 获取当前社区的主管
    currentCommunityManager: (state) => {
      if (!state.currentCommunity) return null
      return state.staffMembers.find(s => s.role === 'manager')
    },
    
    // 获取当前社区的专员
    currentCommunityStaff: (state) => {
      return state.staffMembers.filter(s => s.role === 'staff')
    }
  },
  
  actions: {
    // ========== 社区管理 ==========
    
    /**
     * 加载社区列表
     * @param {boolean} refresh - 是否刷新列表
     */
    async loadCommunities(refresh = false) {
      if (this.loading) return
      
      try {
        this.loading = true
        
        const page = refresh ? 1 : this.currentPage
        
        const response = await request({
          url: '/api/community/list',
          method: 'GET',
          data: {
            page,
            page_size: this.pageSize
          }
        })
        
        if (response.code === 1) {
          if (refresh) {
            this.communities = response.data.communities || []
            this.currentPage = 1
          } else {
            this.communities.push(...(response.data.communities || []))
          }
          
          this.hasMore = response.data.has_more || false
          this.currentPage = page + 1
        }
        
        return response
      } catch (error) {
        console.error('加载社区列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 创建社区
     * @param {Object} data - 社区数据
     */
    async createCommunity(data) {
      try {
        const response = await request({
          url: '/api/community/create',
          method: 'POST',
          data
        })
        
        if (response.code === 1) {
          // 刷新列表
          await this.loadCommunities(true)
        }
        
        return response
      } catch (error) {
        console.error('创建社区失败:', error)
        throw error
      }
    },
    
    /**
     * 更新社区信息
     * @param {string} communityId - 社区ID
     * @param {Object} data - 更新数据
     */
    async updateCommunity(communityId, data) {
      try {
        const response = await request({
          url: '/api/community/update',
          method: 'POST',
          data: {
            community_id: communityId,
            ...data
          }
        })
        
        if (response.code === 1) {
          // 更新本地数据
          const index = this.communities.findIndex(c => c.id === communityId)
          if (index !== -1) {
            this.communities[index] = {
              ...this.communities[index],
              ...data
            }
          }
        }
        
        return response
      } catch (error) {
        console.error('更新社区失败:', error)
        throw error
      }
    },
    
    /**
     * 切换社区状态
     * @param {string} communityId - 社区ID
     * @param {string} status - 状态 (active/inactive)
     */
    async toggleCommunityStatus(communityId, status) {
      try {
        const response = await request({
          url: '/api/community/toggle-status',
          method: 'POST',
          data: {
            community_id: communityId,
            status
          }
        })
        
        if (response.code === 1) {
          // 更新本地数据
          const index = this.communities.findIndex(c => c.id === communityId)
          if (index !== -1) {
            this.communities[index].status = status
          }
        }
        
        return response
      } catch (error) {
        console.error('切换社区状态失败:', error)
        throw error
      }
    },
    
    /**
     * 删除社区
     * @param {string} communityId - 社区ID
     */
    async deleteCommunity(communityId) {
      try {
        const response = await request({
          url: '/api/community/delete',
          method: 'POST',
          data: { community_id: communityId }
        })
        
        if (response.code === 1) {
          // 从列表中移除
          this.communities = this.communities.filter(c => c.id !== communityId)
        }
        
        return response
      } catch (error) {
        console.error('删除社区失败:', error)
        throw error
      }
    },
    
    /**
     * 合并社区
     * @param {Array} sourceCommunityIds - 源社区ID数组
     * @param {string} targetCommunityId - 目标社区ID
     */
    async mergeCommunities(sourceCommunityIds, targetCommunityId) {
      try {
        const response = await request({
          url: '/api/community/merge',
          method: 'POST',
          data: {
            source_community_ids: sourceCommunityIds,
            target_community_id: targetCommunityId
          }
        })
        
        if (response.code === 1) {
          // 刷新列表
          await this.loadCommunities(true)
        }
        
        return response
      } catch (error) {
        console.error('合并社区失败:', error)
        throw error
      }
    },
    
    /**
     * 拆分社区
     * @param {string} sourceCommunityId - 源社区ID
     * @param {Array} subCommunities - 子社区数组
     */
    async splitCommunity(sourceCommunityId, subCommunities) {
      try {
        const response = await request({
          url: '/api/community/split',
          method: 'POST',
          data: {
            source_community_id: sourceCommunityId,
            sub_communities: subCommunities
          }
        })
        
        if (response.code === 1) {
          // 刷新列表
          await this.loadCommunities(true)
        }
        
        return response
      } catch (error) {
        console.error('拆分社区失败:', error)
        throw error
      }
    },
    
    // ========== 工作人员管理 ==========
    
    /**
     * 加载工作人员列表
     * @param {string} communityId - 社区ID
     * @param {Object} options - 可选参数
     */
    async loadStaffMembers(communityId, options = {}) {
      try {
        const response = await request({
          url: '/api/community/staff/list',
          method: 'GET',
          data: {
            community_id: communityId,
            role: options.role || 'all',
            sort_by: options.sortBy || 'time'
          }
        })
        
        if (response.code === 1) {
          this.staffMembers = response.data.staff_members || []
        }
        
        return response
      } catch (error) {
        console.error('加载工作人员列表失败:', error)
        throw error
      }
    },
    
    /**
     * 添加工作人员
     * @param {string} communityId - 社区ID
     * @param {Array} userIds - 用户ID数组
     * @param {string} role - 角色 (manager/staff)
     */
    async addStaffMembers(communityId, userIds, role) {
      try {
        const response = await request({
          url: '/api/community/add-staff',
          method: 'POST',
          data: {
            community_id: communityId,
            user_ids: userIds,
            role
          }
        })
        
        if (response.code === 1) {
          // 刷新工作人员列表
          await this.loadStaffMembers(communityId)
        }
        
        return response
      } catch (error) {
        console.error('添加工作人员失败:', error)
        throw error
      }
    },
    
    /**
     * 移除工作人员
     * @param {string} communityId - 社区ID
     * @param {string} userId - 用户ID
     */
    async removeStaffMember(communityId, userId) {
      try {
        const response = await request({
          url: '/api/community/remove-staff',
          method: 'POST',
          data: {
            community_id: communityId,
            user_id: userId
          }
        })
        
        if (response.code === 1) {
          // 从列表中移除
          this.staffMembers = this.staffMembers.filter(s => s.user_id !== userId)
        }
        
        return response
      } catch (error) {
        console.error('移除工作人员失败:', error)
        throw error
      }
    },
    
    // ========== 社区用户管理 ==========
    
    /**
     * 加载社区用户列表
     * @param {string} communityId - 社区ID
     * @param {boolean} refresh - 是否刷新
     */
    async loadCommunityUsers(communityId, refresh = false) {
      if (this.loading) return
      
      try {
        this.loading = true
        
        const page = refresh ? 1 : this.currentPage
        
        const response = await request({
          url: '/api/community/users',
          method: 'GET',
          data: {
            community_id: communityId,
            page,
            page_size: this.pageSize
          }
        })
        
        if (response.code === 1) {
          if (refresh) {
            this.communityUsers = response.data.users || []
            this.currentPage = 1
          } else {
            this.communityUsers.push(...(response.data.users || []))
          }
          
          this.hasMore = response.data.has_more || false
          this.currentPage = page + 1
        }
        
        return response
      } catch (error) {
        console.error('加载社区用户列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 添加社区用户
     * @param {string} communityId - 社区ID
     * @param {Array} userIds - 用户ID数组
     */
    async addCommunityUsers(communityId, userIds) {
      try {
        const response = await request({
          url: '/api/community/add-users',
          method: 'POST',
          data: {
            community_id: communityId,
            user_ids: userIds
          }
        })
        
        if (response.code === 1) {
          // 刷新用户列表
          await this.loadCommunityUsers(communityId, true)
        }
        
        return response
      } catch (error) {
        console.error('添加社区用户失败:', error)
        throw error
      }
    },
    
    /**
     * 移除社区用户
     * @param {string} communityId - 社区ID
     * @param {string} userId - 用户ID
     */
    async removeCommunityUser(communityId, userId) {
      try {
        const response = await request({
          url: '/api/community/remove-user',
          method: 'POST',
          data: {
            community_id: communityId,
            user_id: userId
          }
        })
        
        if (response.code === 1) {
          // 从列表中移除
          this.communityUsers = this.communityUsers.filter(u => u.user_id !== userId)
        }
        
        return response
      } catch (error) {
        console.error('移除社区用户失败:', error)
        throw error
      }
    },
    
    /**
     * 搜索用户
     * @param {string} keyword - 搜索关键词
     * @param {string} communityId - 社区ID (可选)
     */
    async searchUsers(keyword, communityId = null) {
      try {
        const response = await request({
          url: '/api/user/search',
          method: 'GET',
          data: {
            keyword,
            community_id: communityId
          }
        })
        
        return response
      } catch (error) {
        console.error('搜索用户失败:', error)
        throw error
      }
    },
    
    /**
     * 获取用户所属社区
     * @param {string} userId - 用户ID
     */
    async getUserCommunities(userId) {
      try {
        const response = await request({
          url: '/api/user/communities',
          method: 'GET',
          data: {
            user_id: userId
          }
        })
        
        return response
      } catch (error) {
        console.error('获取用户所属社区失败:', error)
        throw error
      }
    },
    
    // ========== 辅助方法 ==========
    
    /**
     * 设置当前社区
     * @param {Object} community - 社区对象
     */
    setCurrentCommunity(community) {
      this.currentCommunity = community
    },
    
    /**
     * 清空状态
     */
    clearState() {
      this.communities = []
      this.currentCommunity = null
      this.staffMembers = []
      this.communityUsers = []
      this.loading = false
      this.hasMore = true
      this.currentPage = 1
    }
  }
})
