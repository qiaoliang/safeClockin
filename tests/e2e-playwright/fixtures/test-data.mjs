/**
 * E2E 测试数据夹具
 * 包含测试用户数据和环境配置
 */

/**
 * 测试用户数据
 */
export const TEST_USERS = {
  // 超级系统管理员
  SUPER_ADMIN: {
    phone: '13141516171',
    password: 'F1234567',
    nickname: '超级管理员',
    role: 4,
    description: '超级系统管理员，拥有所有权限'
  },

  // 社区管理员
  COMMUNITY_ADMIN: {
    phone: '13900000002',
    password: 'Test123456',
    nickname: '社区管理员',
    role: 3,
    description: '社区管理员，可以管理社区'
  },

  // 社区专员
  STAFF: {
    phone: '13900000003',
    password: 'Test123456',
    nickname: '社区专员',
    role: 2,
    description: '社区专员，可以管理社区成员'
  },

  // 普通用户
  NORMAL: {
    phone: '13900000004',
    password: 'Test123456',
    nickname: '普通用户',
    role: 1,
    description: '普通用户，只有基本权限'
  },

  // 新注册用户（用于测试注册流程）
  NEW_USER: {
    phone: '13900000999',
    password: 'Test123456',
    nickname: '新用户',
    role: 1,
    description: '新注册用户'
  }
};

/**
 * 测试社区数据
 */
export const TEST_COMMUNITIES = {
  DEFAULT_COMMUNITY: {
    id: 1,
    name: '安卡大家庭',
    description: '默认社区',
    is_default: true
  },
  
  BLACK_ROOM: {
    id: 2,
    name: '黑屋社区',
    description: '黑名单社区',
    is_blackroom: true
  },
  
  TEST_COMMUNITY: {
    id: 999,
    name: '测试社区',
    description: '用于测试的社区',
    is_default: false,
    is_blackroom: false
  }
};

/**
 * 环境配置
 */
export const ENV_CONFIG = {
  // 后端 API 地址
  API_URL: process.env.BASE_URL_FOR_SAFEGUARD || 'http://localhost:9999',
  
  // Web 服务器地址
  WEB_URL: process.env.BASE_URL || 'http://localhost:8081',
  
  // 超时配置
  TIMEOUTS: {
    LOGIN: 10000,        // 登录超时
    NAVIGATION: 30000,    // 导航超时
    API_RESPONSE: 5000,   // API 响应超时
    ELEMENT_VISIBLE: 5000 // 元素可见性超时
  },
  
  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000
  }
};

/**
 * 获取测试用户
 */
export function getTestUser(userType) {
  const user = TEST_USERS[userType];
  if (!user) {
    throw new Error(`未找到测试用户类型: ${userType}`);
  }
  return user;
}

/**
 * 获取测试社区
 */
export function getTestCommunity(communityType) {
  const community = TEST_COMMUNITIES[communityType];
  if (!community) {
    throw new Error(`未找到测试社区类型: ${communityType}`);
  }
  return community;
}

/**
 * 生成随机测试数据
 */
export function generateRandomTestData() {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  
  return {
    phone: `139000${randomSuffix}`,
    nickname: `测试用户_${timestamp}`,
    password: 'Test123456'
  };
}

/**
 * 清理测试数据（完整实现）
 * 在测试结束后调用，清理创建的测试数据
 * @param {object} testData - 测试数据对象
 * @param {string} testData.communityId - 要清理的社区 ID
 * @param {string} testData.userId - 要清理的用户 ID
 * @param {string} testData.eventId - 要清理的事件 ID
 * @param {string} testData.ruleId - 要清理的规则 ID
 * @param {boolean} testData.shouldDeleteUser - 是否删除用户（默认 false）
 */
export async function cleanupTestData(testData) {
  // 动态导入 ApiClient 避免循环依赖
  const { ApiClient } = await import('../helpers/api-client.js');
  const apiClient = new ApiClient();

  // 使用超级管理员登录获取 token
  try {
    await apiClient.loginWithPassword(
      TEST_USERS.SUPER_ADMIN.phone,
      TEST_USERS.SUPER_ADMIN.password
    );
  } catch (error) {
    console.error('API 客户端登录失败，无法清理测试数据:', error.message);
    return;
  }

  const cleanupErrors = [];
  let hasCleaned = false;

  // 清理社区
  if (testData.communityId) {
    hasCleaned = true;
    try {
      // 先尝试停用社区
      try {
        await apiClient.updateCommunity(testData.communityId, { status: 'inactive' });
      } catch (error) {
        // 忽略停用失败，直接尝试删除
      }

      const response = await apiClient.deleteCommunity(testData.communityId);
      if (response.code === 1) {
        console.log(`✅ 已清理测试社区: ${testData.communityId}`);
      } else {
        cleanupErrors.push(`清理社区失败: ${response.msg || '未知错误'}`);
      }
    } catch (error) {
      cleanupErrors.push(`清理社区异常: ${error.message}`);
    }
  }

  // 清理用户（可选，默认不删除）
  if (testData.userId && testData.shouldDeleteUser) {
    hasCleaned = true;
    try {
      const response = await apiClient.deleteUser(testData.userId);
      if (response.code === 1) {
        console.log(`✅ 已清理测试用户: ${testData.userId}`);
      } else {
        cleanupErrors.push(`清理用户失败: ${response.msg || '未知错误'}`);
      }
    } catch (error) {
      cleanupErrors.push(`清理用户异常: ${error.message}`);
    }
  }

  // 清理事件
  if (testData.eventId) {
    hasCleaned = true;
    try {
      const response = await apiClient.deleteEvent(testData.eventId);
      if (response.code === 1) {
        console.log(`✅ 已清理测试事件: ${testData.eventId}`);
      } else {
        cleanupErrors.push(`清理事件失败: ${response.msg || '未知错误'}`);
      }
    } catch (error) {
      cleanupErrors.push(`清理事件异常: ${error.message}`);
    }
  }

  // 清理打卡规则
  if (testData.ruleId) {
    hasCleaned = true;
    try {
      const response = await apiClient.deleteCheckinRule(testData.ruleId);
      if (response.code === 1) {
        console.log(`✅ 已清理测试规则: ${testData.ruleId}`);
      } else {
        cleanupErrors.push(`清理规则失败: ${response.msg || '未知错误'}`);
      }
    } catch (error) {
      cleanupErrors.push(`清理规则异常: ${error.message}`);
    }
  }

  // 输出清理错误
  if (cleanupErrors.length > 0) {
    console.warn('⚠️ 数据清理警告:');
    cleanupErrors.forEach(err => console.warn(`  - ${err}`));
  }

  if (!hasCleaned) {
    console.log('ℹ️ 没有需要清理的测试数据');
  }

  return {
    success: cleanupErrors.length === 0,
    errors: cleanupErrors,
  };
}

/**
 * 创建测试数据记录器
 * 用于在测试过程中记录创建的数据，以便后续清理
 */
export class TestDataTracker {
  constructor() {
    this.data = {
      communityIds: [],
      userIds: [],
      eventIds: [],
      ruleIds: [],
    };
  }

  /**
   * 记录社区 ID
   */
  trackCommunity(communityId) {
    this.data.communityIds.push(communityId);
  }

  /**
   * 记录用户 ID
   */
  trackUser(userId, shouldDelete = false) {
    this.data.userIds.push({ id: userId, shouldDelete });
  }

  /**
   * 记录事件 ID
   */
  trackEvent(eventId) {
    this.data.eventIds.push(eventId);
  }

  /**
   * 记录规则 ID
   */
  trackRule(ruleId) {
    this.data.ruleIds.push(ruleId);
  }

  /**
   * 清理所有追踪的数据
   */
  async cleanupAll() {
    const cleanupErrors = [];

    // 清理所有社区
    for (const communityId of this.data.communityIds) {
      const result = await cleanupTestData({ communityId });
      if (!result.success) {
        cleanupErrors.push(...result.errors);
      }
    }

    // 清理所有用户
    for (const { id, shouldDelete } of this.data.userIds) {
      if (shouldDelete) {
        const result = await cleanupTestData({ userId: id, shouldDeleteUser: true });
        if (!result.success) {
          cleanupErrors.push(...result.errors);
        }
      }
    }

    // 清理所有事件
    for (const eventId of this.data.eventIds) {
      const result = await cleanupTestData({ eventId });
      if (!result.success) {
        cleanupErrors.push(...result.errors);
      }
    }

    // 清理所有规则
    for (const ruleId of this.data.ruleIds) {
      const result = await cleanupTestData({ ruleId });
      if (!result.success) {
        cleanupErrors.push(...result.errors);
      }
    }

    // 清空追踪记录
    this.clear();

    return {
      success: cleanupErrors.length === 0,
      errors: cleanupErrors,
    };
  }

  /**
   * 清空追踪记录（不清理数据）
   */
  clear() {
    this.data = {
      communityIds: [],
      userIds: [],
      eventIds: [],
      ruleIds: [],
    };
  }

  /**
   * 获取追踪的数据数量
   */
  getCount() {
    return {
      communities: this.data.communityIds.length,
      users: this.data.userIds.length,
      events: this.data.eventIds.length,
      rules: this.data.ruleIds.length,
    };
  }
}