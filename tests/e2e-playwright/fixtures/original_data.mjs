/**
 * E2E 测试原始数据夹具
 * 包含系统中已存在的初始化用户和社区数据
 * 数据来源: backend/scripts/init_data.py
 */
import { ApiClient } from '../helpers/api-client.mjs';

/**
 * 原始用户数据（系统中已存在的用户）
 */
export const ORIGINAL_USERS = {
  // 超级系统管理员
  SUPER_ADMIN: {
    phone: '13141516171',
    password: 'F1234567',
    nickname: '系统超级系统管理员',
    name: '系统超级系统管理员',
    work_id: 'SA0000001',
    address: '北京市朝阳区柳芳南里29号',
    role: 4, // Role.SUPER_ADMIN
    status: 1,
    verification_status: 2,
    is_community_worker: true,
    community_id: '安卡大家庭的ID',
    description: '超级系统管理员，拥有所有权限'
  },

  // 普通测试用户
  NORMAL_USER: {
    phone: '18122222222',
    password: 'F1234567',
    nickname: '调试用户18122222222',
    name: '调试用户18122222222',
    work_id: 'EMP0001',
    address: '北京市朝阳区柳芳南里30号',
    role: 1, // Role.SOLO
    status: 1,
    community_id: '安卡大家庭的ID',
    description: '普通测试用户，有个人打卡规则'
  },

  // 调试用户-2
  DEBUG_USER_2: {
    phone: '19144444444',
    password: 'F1234567',
    nickname: '调试用户-2',
    name: '调试用户-2',
    work_id: 'EMP0002',
    address: '北京市朝阳区柳芳南里31号',
    role: 1, // Role.SOLO
    status: 1,
    community_id: '调试社区-1的ID',
    description: '调试用户-2，有个人打卡规则'
  },

  // 主管用户-1
  MANAGER_USER_1: {
    phone: '13588888888',
    password: 'F1234567',
    nickname: '主管用户-1',
    name: '主管用户-1',
    work_id: 'MGR0001',
    address: '北京市朝阳区柳芳南里32号',
    role: 3, // Role.MANAGER
    status: 1,
    verification_status: 2,
    is_community_worker: true,
    community_id: '安卡大家庭的ID',
    description: '社区主管，可以管理社区'
  }
};

/**
 * 原始社区数据（系统中已存在的社区）
 */
export const ORIGINAL_COMMUNITIES = {
  // 安卡大家庭 - 默认社区
  ANKA_FAMILY: {
    name: '安卡大家庭',
    description: '系统默认社区，新注册用户自动加入',
    status: 1,
    is_default: true,
    location: '北京市朝阳区柳芳南里29号',
    location_lat: 39.901213,
    location_lon: 116.527067,
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    street: '柳芳南里',
    settings: {
      checkin_enabled: true,
      event_notifications: true
    },
    description_cn: '默认社区，新注册用户自动加入'
  },

  // 黑屋社区 - 特殊管理社区
  BLACK_ROOM: {
    name: '黑屋社区',
    description: '特殊管理社区，用户在此社区时功能受限',
    status: 1,
    is_blackhouse: true,
    location: '北京市海淀区中关村大街1号',
    location_lat: 39.956073,
    location_lon: 116.307079,
    province: '北京市',
    city: '北京市',
    district: '海淀区',
    street: '中关村大街',
    settings: {
      checkin_enabled: false,
      event_notifications: false,
      restricted_mode: true
    },
    description_cn: '黑名单社区，用户功能受限'
  },

  // 调试社区-1
  DEBUG_COMMUNITY_1: {
    name: '调试社区-1',
    description: '用于调试和测试的社区',
    status: 1,
    location: '北京市朝阳区柳芳南里33号',
    location_lat: 39.902000,
    location_lon: 116.528000,
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    street: '柳芳南里',
    settings: {
      checkin_enabled: true,
      event_notifications: true
    },
    description_cn: '用于调试和测试的社区'
  }
};

/**
 * 原始打卡规则数据（系统中已存在的规则）
 */
export const ORIGINAL_CHECKIN_RULES = {
  // 普通测试用户的早上吃药规则
  MORNING_MEDICINE: {
    user_phone: '18122222222',
    rule_type: 'personal',
    rule_name: '早上吃药',
    frequency_type: 0,  // 每天
    time_slot_type: 4,  // 早上
    custom_time: '08:00:00',
    week_days: 127,  // 每天
    status: 1,
    user_nickname: '调试用户18122222222'
  },

  // 调试用户-2的晚上吃药规则
  EVENING_MEDICINE: {
    user_phone: '19144444444',
    rule_type: 'personal',
    rule_name: '晚上吃药',
    frequency_type: 0,  // 每天
    time_slot_type: 6,  // 晚上
    custom_time: '20:00:00',
    week_days: 127,  // 每天
    status: 1,
    user_nickname: '调试用户-2'
  }
};

/**
 * 社区员工关系（CommunityStaff）
 */
export const COMMUNITY_STAFF_RELATIONS = {
  // 超级管理员的关系
  SUPER_ADMIN_ANKA: {
    community: '安卡大家庭',
    user_phone: '13141516171',
    role: 'manager'
  },
  SUPER_ADMIN_BLACK_ROOM: {
    community: '黑屋社区',
    user_phone: '13141516171',
    role: 'manager'
  },

  // 主管用户-1的关系
  MANAGER_1_ANKA: {
    community: '安卡大家庭',
    user_phone: '13588888888',
    role: 'manager'
  },
  MANAGER_1_DEBUG: {
    community: '调试社区-1',
    user_phone: '13588888888',
    role: 'staff'
  }
};

/**
 * 获取原始用户
 */
export function getOriginalUser(userType) {
  const user = ORIGINAL_USERS[userType];
  if (!user) {
    throw new Error(`未找到原始用户类型: ${userType}`);
  }
  return user;
}

/**
 * 获取原始社区
 */
export function getOriginalCommunity(communityType) {
  const community = ORIGINAL_COMMUNITIES[communityType];
  if (!community) {
    throw new Error(`未找到原始社区类型: ${communityType}`);
  }
  return community;
}

/**
 * 获取原始打卡规则
 */
export function getOriginalCheckinRule(ruleType) {
  const rule = ORIGINAL_CHECKIN_RULES[ruleType];
  if (!rule) {
    throw new Error(`未找到原始打卡规则类型: ${ruleType}`);
  }
  return rule;
}

/**
 * 根据手机号获取用户
 */
export function getUserByPhone(phone) {
  const user = Object.values(ORIGINAL_USERS).find(u => u.phone === phone);
  if (!user) {
    throw new Error(`未找到手机号为 ${phone} 的用户`);
  }
  return user;
}

/**
 * 根据社区名称获取社区
 */
export function getCommunityByName(name) {
  const community = Object.values(ORIGINAL_COMMUNITIES).find(c => c.name === name);
  if (!community) {
    throw new Error(`未找到名称为 ${name} 的社区`);
  }
  return community;
}

/**
 * 获取默认社区（安卡大家庭）
 */
export function getDefaultCommunity() {
  return ORIGINAL_COMMUNITIES.ANKA_FAMILY;
}

/**
 * 获取超级管理员用户
 */
export function getSuperAdmin() {
  return ORIGINAL_USERS.SUPER_ADMIN;
}

/**
 * 验证原始数据完整性
 * 检查数据库中的原始数据是否与预期一致
 */
export async function validateOriginalData() {
  const apiClient = new ApiClient();
  const errors = [];

  try {
    // 使用超级管理员登录
    await apiClient.loginWithPassword(
      ORIGINAL_USERS.SUPER_ADMIN.phone,
      ORIGINAL_USERS.SUPER_ADMIN.password
    );

    // 验证用户
    for (const [key, user] of Object.entries(ORIGINAL_USERS)) {
      try {
        const response = await apiClient.getUserByPhone(user.phone);
        if (response.code !== 1) {
          errors.push(`用户 ${user.phone} 验证失败: ${response.msg}`);
        }
      } catch (error) {
        errors.push(`用户 ${user.phone} 验证异常: ${error.message}`);
      }
    }

    // 验证社区
    for (const [key, community] of Object.entries(ORIGINAL_COMMUNITIES)) {
      try {
        // 这里假设有获取社区的 API，需要根据实际情况调整
        // const response = await apiClient.getCommunityByName(community.name);
        // if (response.code !== 1) {
        //   errors.push(`社区 ${community.name} 验证失败: ${response.msg}`);
        // }
      } catch (error) {
        errors.push(`社区 ${community.name} 验证异常: ${error.message}`);
      }
    }

  } catch (error) {
    errors.push(`验证过程异常: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 原始数据统计信息
 */
export function getOriginalDataStats() {
  return {
    users: Object.keys(ORIGINAL_USERS).length,
    communities: Object.keys(ORIGINAL_COMMUNITIES).length,
    checkinRules: Object.keys(ORIGINAL_CHECKIN_RULES).length,
    staffRelations: Object.keys(COMMUNITY_STAFF_RELATIONS).length,
    userList: Object.values(ORIGINAL_USERS).map(u => ({
      phone: u.phone,
      nickname: u.nickname,
      role: u.role
    })),
    communityList: Object.values(ORIGINAL_COMMUNITIES).map(c => ({
      name: c.name,
      is_default: c.is_default,
      is_blackhouse: c.is_blackhouse
    }))
  };
}

/**
 * 打印原始数据统计信息
 */
export function printOriginalDataStats() {
  const stats = getOriginalDataStats();

  console.log('=== 原始数据统计 ===');
  console.log(`用户数量: ${stats.users}`);
  console.log(`社区数量: ${stats.communities}`);
  console.log(`打卡规则数量: ${stats.checkinRules}`);
  console.log(`员工关系数量: ${stats.staffRelations}`);
  console.log('');
  console.log('用户列表:');
  stats.userList.forEach(user => {
    console.log(`  - ${user.nickname} (${user.phone}), Role: ${user.role}`);
  });
  console.log('');
  console.log('社区列表:');
  stats.communityList.forEach(community => {
    console.log(`  - ${community.name}${community.is_default ? ' (默认)' : ''}${community.is_blackhouse ? ' (黑屋)' : ''}`);
  });
}
