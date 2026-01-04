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
  COMMUNITY_STAFF: {
    phone: '13900000003',
    password: 'Test123456',
    nickname: '社区专员',
    role: 2,
    description: '社区专员，可以管理社区成员'
  },
  
  // 普通用户
  REGULAR_USER: {
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
  WEB_URL: process.env.BASE_URL || 'https://localhost:8081',
  
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
 * 清理测试数据
 * 在测试结束后调用，清理创建的测试数据
 */
export async function cleanupTestData(apiClient, testData) {
  // 这里可以添加清理逻辑，例如删除创建的测试用户、社区等
  // 具体实现取决于后端 API
  
  if (testData.userId) {
    try {
      // await apiClient.deleteUser(testData.userId);
      console.log(`已清理测试用户: ${testData.userId}`);
    } catch (error) {
      console.error(`清理测试用户失败: ${error.message}`);
    }
  }
  
  if (testData.communityId) {
    try {
      // await apiClient.deleteCommunity(testData.communityId);
      console.log(`已清理测试社区: ${testData.communityId}`);
    } catch (error) {
      console.error(`清理测试社区失败: ${error.message}`);
    }
  }
}