/**
 * 统一的 data-testid 选择器定义
 * 这些属性需要同步添加到应用代码中
 *
 * 使用说明：
 * 1. 在应用组件中添加 data-testid 属性
 * 2. 在此文件中定义对应的选择器
 * 3. 在 Page Object 中引用这些选择器
 */

// ==================== 认证相关选择器 ====================
export const authSelectors = {
  // 登录欢迎页
  loginWelcomePage: {
    container: 'data-testid=login-welcome-page',
    title: 'data-testid=login-welcome-title',
    wechatLoginBtn: 'data-testid=wechat-login-button',
    phoneLoginBtn: 'data-testid=phone-login-button',
  },

  // 手机登录页
  phoneLogin: {
    phoneInput: 'data-testid=phone-input',
    passwordInput: 'data-testid=password-input',
    codeInput: 'data-testid=code-input',
    submitBtn: 'data-testid=login-submit-button',
    codeBtn: 'data-testid=get-code-button',
    agreementCheckbox: 'data-testid=agreement-checkbox',
    tabPassword: 'data-testid=tab-password-login',
    tabCode: 'data-testid=tab-code-login',
    tabRegister: 'data-testid=tab-register',
  },

  // 注册
  register: {
    phoneInput: 'data-testid=register-phone-input',
    codeInput: 'data-testid=register-code-input',
    passwordInput: 'data-testid=register-password-input',
    submitBtn: 'data-testid=register-submit-button',
  },
};

// ==================== 首页选择器 ====================
export const homeSelectors = {
  container: 'data-testid=home-page',

  bottomNav: {
    home: 'data-testid=nav-home',
    community: 'data-testid=nav-community',
    profile: 'data-testid=nav-profile',
  },
};

// ==================== 个人中心选择器 ====================
export const profileSelectors = {
  container: 'data-testid=profile-page',
  communityListBtn: 'data-testid=community-list-button',
  logoutBtn: 'data-testid=logout-button',
  userInfoSection: 'data-testid=user-info-section',
};

// ==================== 社区管理选择器 ====================
export const communitySelectors = {
  // 社区列表页
  list: {
    container: 'data-testid=community-list-page',
    title: 'data-testid=community-list-title',
    addButton: 'data-testid=add-community-button',
    communityItem: (name) => `data-testid=community-item-${name}`,
    communityCard: 'data-testid=community-card',
  },

  // 创建社区页
  create: {
    container: 'data-testid=create-community-page',
    nameInput: 'data-testid=community-name-input',
    locationBtn: 'data-testid=location-select-button',
    submitBtn: 'data-testid=create-community-submit-button',
    cancelBtn: 'data-testid=create-community-cancel-button',
  },

  // 社区详情页
  detail: {
    container: 'data-testid=community-detail-page',
    editBtn: 'data-testid=edit-community-button',
    deleteBtn: 'data-testid=delete-community-button',
  },
};

// ==================== 事件管理选择器 ====================
export const eventSelectors = {
  // 事件列表
  list: {
    container: 'data-testid=event-list-page',
    eventItem: (id) => `data-testid=event-item-${id}`,
    eventCard: 'data-testid=event-card',
    filterBtn: 'data-testid=event-filter-button',
  },

  // 事件详情
  detail: {
    container: 'data-testid=event-detail-page',
    closeBtn: 'data-testid=close-event-button',
  },

  // 关闭事件
  close: {
    container: 'data-testid=close-event-modal',
    reasonInput: 'data-testid=close-reason-input',
    submitBtn: 'data-testid=close-event-submit-button',
    cancelBtn: 'data-testid=close-event-cancel-button',
  },
};

// ==================== 打卡规则选择器 ====================
export const ruleSelectors = {
  // 规则列表
  list: {
    container: 'data-testid=rule-list-page',
    addButton: 'data-testid=add-rule-button',
    ruleItem: (id) => `data-testid=rule-item-${id}`,
  },

  // 创建/编辑规则
  form: {
    container: 'data-testid=rule-form-page',
    nameInput: 'data-testid=rule-name-input',
    timeInput: 'data-testid=rule-time-input',
    submitBtn: 'data-testid=rule-submit-button',
  },
};

// ==================== 辅助函数 ====================

/**
 * 获取带参数的 testid 选择器
 * @param {string} baseTestId - 基础 testid
 * @param {string} param - 参数值
 * @returns {string} 完整的选择器
 */
export function getParametricTestId(baseTestId, param) {
  return `data-testid=${baseTestId}-${param}`;
}

/**
 * 批量获取选择器（用于动态组件列表）
 * @param {string} baseTestId - 基础 testid
 * @param {string[]} params - 参数数组
 * @returns {string[]} 选择器数组
 */
export function getBatchTestIds(baseTestId, params) {
  return params.map(param => getParametricTestId(baseTestId, param));
}
