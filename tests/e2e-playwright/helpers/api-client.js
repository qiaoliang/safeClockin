/**
 * API 客户端用于测试数据清理和管理
 * 提供与后端 API 交互的方法，用于测试数据的创建和清理
 */
import { ENV_CONFIG } from '../fixtures/test-data.mjs';

export class ApiClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || ENV_CONFIG.API_URL;
    this.token = null;
    this.request = this.request.bind(this);
  }

  /**
   * 设置认证 token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * 发起 API 请求
   * @param {string} endpoint - API 端点
   * @param {object} options - 请求选项
   * @returns {Promise<object>} 响应数据
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const requestOptions = {
      ...options,
      headers,
    };

    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  /**
   * GET 请求
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // ==================== 认证相关 ====================

  /**
   * 手机号密码登录
   * @param {string} phone - 手机号
   * @param {string} password - 密码
   * @returns {Promise<object>} 登录响应
   */
  async loginWithPassword(phone, password) {
    const response = await this.post('/api/auth/login-phone-password', {
      phone,
      password,
    });

    if (response.code === 1 && response.data?.token) {
      this.token = response.data.token;
    }

    return response;
  }

  /**
   * 微信登录（使用测试 code）
   * @param {string} code - 微信登录凭证
   * @returns {Promise<object>} 登录响应
   */
  async loginWithWechat(code = 'test_wechat_code') {
    const response = await this.post('/api/auth/wechat-login', { code });

    if (response.code === 1 && response.data?.token) {
      this.token = response.data.token;
    }

    return response;
  }

  // ==================== 社区管理 ====================

  /**
   * 创建社区
   * @param {object} data - 社区数据
   * @returns {Promise<object>} 创建响应
   */
  async createCommunity(data) {
    return this.post('/api/communities', {
      name: data.name,
      location: data.location || '测试地址',
      description: data.description || '测试社区描述',
    });
  }

  /**
   * 删除社区
   * @param {number} communityId - 社区 ID
   * @returns {Promise<object>} 删除响应
   */
  async deleteCommunity(communityId) {
    return this.delete(`/api/communities/${communityId}`);
  }

  /**
   * 获取社区列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} 社区列表
   */
  async getCommunities(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/communities?${queryString}`);
  }

  /**
   * 获取社区详情
   * @param {number} communityId - 社区 ID
   * @returns {Promise<object>} 社区详情
   */
  async getCommunity(communityId) {
    return this.get(`/api/communities/${communityId}`);
  }

  /**
   * 更新社区
   * @param {number} communityId - 社区 ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>} 更新响应
   */
  async updateCommunity(communityId, data) {
    return this.put(`/api/communities/${communityId}`, data);
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户信息
   * @returns {Promise<object>} 用户信息
   */
  async getUserInfo() {
    return this.get('/api/user/info');
  }

  /**
   * 更新用户信息
   * @param {object} data - 更新数据
   * @returns {Promise<object>} 更新响应
   */
  async updateUserInfo(data) {
    return this.put('/api/user/info', data);
  }

  /**
   * 删除用户（仅超级管理员）
   * @param {number} userId - 用户 ID
   * @returns {Promise<object>} 删除响应
   */
  async deleteUser(userId) {
    return this.delete(`/api/users/${userId}`);
  }

  /**
   * 获取用户列表（仅超级管理员）
   * @param {object} params - 查询参数
   * @returns {Promise<object>} 用户列表
   */
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/users?${queryString}`);
  }

  // ==================== 事件管理 ====================

  /**
   * 创建事件
   * @param {object} data - 事件数据
   * @returns {Promise<object>} 创建响应
   */
  async createEvent(data) {
    return this.post('/api/events', {
      community_id: data.communityId,
      title: data.title || '测试事件',
      description: data.description || '测试事件描述',
      event_type: data.eventType || 'call_for_help',
      location: data.location || '',
    });
  }

  /**
   * 关闭事件
   * @param {number} eventId - 事件 ID
   * @param {string} reason - 关闭原因
   * @returns {Promise<object>} 关闭响应
   */
  async closeEvent(eventId, reason) {
    return this.post(`/api/events/${eventId}/close`, {
      close_reason: reason,
    });
  }

  /**
   * 删除事件
   * @param {number} eventId - 事件 ID
   * @returns {Promise<object>} 删除响应
   */
  async deleteEvent(eventId) {
    return this.delete(`/api/events/${eventId}`);
  }

  /**
   * 获取事件列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>} 事件列表
   */
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/api/events?${queryString}`);
  }

  // ==================== 打卡规则 ====================

  /**
   * 创建打卡规则
   * @param {object} data - 规则数据
   * @returns {Promise<object>} 创建响应
   */
  async createCheckinRule(data) {
    return this.post('/api/checkin-rules', {
      rule_name: data.name,
      planned_time: data.plannedTime,
      end_time: data.endTime,
    });
  }

  /**
   * 删除打卡规则
   * @param {number} ruleId - 规则 ID
   * @returns {Promise<object>} 删除响应
   */
  async deleteCheckinRule(ruleId) {
    return this.delete(`/api/checkin-rules/${ruleId}`);
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查健康状态
   * @returns {Promise<boolean>} 服务是否健康
   */
  async healthCheck() {
    try {
      await this.get('/api/health');
      return true;
    } catch (error) {
      console.error('健康检查失败:', error.message);
      return false;
    }
  }

  /**
   * 清除当前 token
   */
  clearToken() {
    this.token = null;
  }
}

/**
 * 创建已认证的 API 客户端
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 * @param {string} apiUrl - API 地址
 * @returns {Promise<ApiClient>} 已认证的 API 客户端
 */
export async function createAuthenticatedApiClient(phone, password, apiUrl) {
  const client = new ApiClient(apiUrl);
  await client.loginWithPassword(phone, password);
  return client;
}
