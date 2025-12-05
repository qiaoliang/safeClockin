// store/modules/checkin.js
import { defineStore } from 'pinia'
import { storage } from './storage'
import { request } from '@/api/request'

export const useCheckinStore = defineStore('checkin', {
  state: () => ({
    // 今日打卡数据
    todayCheckinItems: [],
    allRulesCount: 0,
    lastUpdateTime: null,
    
    // 缓存相关
    cacheExpireTime: 5 * 60 * 1000, // 5分钟缓存过期时间
    
    // 加载状态
    isLoading: false,
    error: null
  }),
  
  getters: {
    // 今日待打卡数量
    pendingCheckinCount: (state) => {
      return state.todayCheckinItems.filter(item => 
        item.status !== 'checked' && item.status !== 'missed'
      ).length
    },
    
    // 已完成打卡数量
    completedCheckinCount: (state) => {
      return state.todayCheckinItems.filter(item => item.status === 'checked').length
    },
    
    // 已错过打卡数量
    missedCheckinCount: (state) => {
      return state.todayCheckinItems.filter(item => item.status === 'missed').length
    },
    
    // 今日打卡总数
    todayCheckinCount: (state) => {
      return state.todayCheckinItems.length
    },
    
    // 完成率
    completionRate: (state) => {
      const total = state.todayCheckinItems.length
      if (total === 0) return 0
      const completed = state.todayCheckinItems.filter(item => item.status === 'checked').length
      return Math.round((completed / total) * 100)
    },
    
    // 最近待打卡项目
    nearestPending: (state) => {
      const pending = state.todayCheckinItems.filter(item => 
        item.status !== 'checked' && item.status !== 'missed'
      )
      if (!pending.length) return null
      
      // 按时间倒序排序，最紧急的在前
      pending.sort((a, b) => {
        const timeA = new Date(`2000-01-01T${a.planned_time || '00:00:00'}`)
        const timeB = new Date(`2000-01-01T${b.planned_time || '00:00:00'}`)
        return timeA - timeB
      })
      
      return pending[0]
    },
    
    // 检查缓存是否过期
    isCacheExpired: (state) => {
      if (!state.lastUpdateTime) return true
      const now = new Date().getTime()
      return (now - state.lastUpdateTime) > state.cacheExpireTime
    },
    
    // 是否有有效的缓存数据
    hasValidCache: (state) => {
      return state.todayCheckinItems.length > 0 && !state.isCacheExpired
    }
  },
  
  actions: {
    // 获取今日打卡数据（优先使用缓存）
    async fetchTodayCheckinItems(forceRefresh = false) {
      // 如果有有效缓存且不强制刷新，直接返回缓存数据
      if (!forceRefresh && this.hasValidCache) {
        console.log('使用缓存的打卡数据')
        return this.todayCheckinItems
      }
      
      this.isLoading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/api/checkin/today',
          method: 'GET'
        })
        
        if (response.code === 1) {
          this.todayCheckinItems = (response.data.checkin_items || []).map(item => ({
            ...item
          }))
          
          this.normalizeMissedStatuses()
          this.updateCache()
          
          console.log('获取今日打卡数据成功:', this.todayCheckinItems.length, '项')
          return this.todayCheckinItems
        } else {
          throw new Error(response.msg || '获取打卡数据失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取今日打卡数据失败:', error)
        
        // 如果网络请求失败但有缓存数据，仍然返回缓存
        if (this.todayCheckinItems.length > 0) {
          console.log('网络请求失败，使用缓存数据')
          return this.todayCheckinItems
        }
        
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取所有规则数量
    async fetchAllRulesCount() {
      try {
        const response = await request({
          url: '/api/checkin/rules',
          method: 'GET'
        })
        
        if (response.code === 1) {
          this.allRulesCount = (response.data?.rules || []).length
          this.updateCache()
          return this.allRulesCount
        }
      } catch (error) {
        console.error('获取规则数量失败:', error)
      }
      
      return this.allRulesCount
    },
    
    // 执行打卡操作
    async performCheckin(ruleId) {
      try {
        const response = await request({
          url: '/api/checkin',
          method: 'POST',
          data: { rule_id: ruleId }
        })
        
        if (response.code === 1) {
          // 更新本地数据
          const item = this.todayCheckinItems.find(item => item.rule_id === ruleId)
          if (item) {
            item.status = 'checked'
            item.checkin_time = new Date().toISOString()
            this.updateCache()
          }
          
          console.log('打卡成功:', ruleId)
          return response
        } else {
          throw new Error(response.msg || '打卡失败')
        }
      } catch (error) {
        console.error('打卡失败:', error)
        throw error
      }
    },
    
    // 标记为错过
    async markAsMissed(ruleId) {
      try {
        const response = await request({
          url: '/api/checkin/miss',
          method: 'POST',
          data: { rule_id: ruleId }
        })
        
        if (response.code === 1) {
          // 更新本地数据
          const item = this.todayCheckinItems.find(item => item.rule_id === ruleId)
          if (item) {
            item.status = 'missed'
            this.updateCache()
          }
          
          console.log('标记错过成功:', ruleId)
          return response
        } else {
          throw new Error(response.msg || '标记失败')
        }
      } catch (error) {
        console.error('标记错过失败:', error)
        throw error
      }
    },
    
    // 标准化错过状态（本地计算）
    normalizeMissedStatuses() {
      const now = new Date()
      
      this.todayCheckinItems.forEach(item => {
        if (item.status === 'checked') return
        
        const planned = new Date()
        const [hours, minutes, seconds] = (item.planned_time || '00:00:00').split(':')
        planned.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds) || 0)
        
        const diffMinutes = (now - planned) / (1000 * 60)
        
        // 超过计划时间30分钟且未打卡的标记为错过
        if (diffMinutes > 30) {
          item.status = 'missed'
        }
      })
    },
    
    // 更新缓存
    updateCache() {
      this.lastUpdateTime = new Date().getTime()
      
      // 保存到本地存储
      const cacheData = {
        todayCheckinItems: this.todayCheckinItems,
        allRulesCount: this.allRulesCount,
        lastUpdateTime: this.lastUpdateTime
      }
      
      storage.set('checkinCache', cacheData)
    },
    
    // 从缓存恢复数据
    restoreFromCache() {
      const cacheData = storage.get('checkinCache')
      
      if (cacheData && cacheData.todayCheckinItems) {
        this.todayCheckinItems = cacheData.todayCheckinItems
        this.allRulesCount = cacheData.allRulesCount || 0
        this.lastUpdateTime = cacheData.lastUpdateTime
        
        // 检查并标准化错过状态
        this.normalizeMissedStatuses()
        
        console.log('从缓存恢复打卡数据:', this.todayCheckinItems.length, '项')
        return true
      }
      
      return false
    },
    
    // 清除缓存
    clearCache() {
      this.todayCheckinItems = []
      this.allRulesCount = 0
      this.lastUpdateTime = null
      this.error = null
      
      storage.remove('checkinCache')
    },
    
    // 初始化打卡数据
    async initCheckinData() {
      // 先尝试从缓存恢复
      if (this.restoreFromCache()) {
        // 如果缓存未过期，直接使用缓存
        if (!this.isCacheExpired) {
          return
        }
      }
      
      // 缓存过期或无缓存，重新获取数据
      try {
        await Promise.all([
          this.fetchTodayCheckinItems(),
          this.fetchAllRulesCount()
        ])
      } catch (error) {
        console.error('初始化打卡数据失败:', error)
      }
    },
    
    // 强制刷新数据
    async refreshData() {
      await Promise.all([
        this.fetchTodayCheckinItems(true), // 强制刷新
        this.fetchAllRulesCount()
      ])
    }
  }
})