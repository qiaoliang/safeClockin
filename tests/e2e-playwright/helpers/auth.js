/**
 * 认证相关的测试辅助函数
 *
 * 改进说明:
 * - 使用更稳定的 data-testid 选择器
 * - 改进等待策略，增加等待时间
 * - 增加详细的调试日志
 */
import { expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data.mjs';

// ==================== 常量定义 ====================
export const AUTH_SELECTORS = {
  // 使用 data-testid 选择器（更稳定）
  phoneLoginBtn: '[data-testid="phone-login-button"]',
  wechatLoginBtn: '[data-testid="wechat-login-button"]',
  loginTitle: '[data-testid="login-welcome-title"]',

  // 手机号登录页面选择器
  passwordTab: '[data-testid="tab-password-login"]',
  codeTab: '[data-testid="tab-code-login"]',
  submitBtn: '[data-testid="login-submit-button"]',
  phoneInput: '[data-testid="phone-input"]',
  passwordInput: '[data-testid="password-input"]',
  codeInput: '[data-testid="code-input"]',

  // 备用选择器（向后兼容）
  legacy: {
    passwordTab: '.tab',
    submitBtn: 'uni-button.submit',
    phoneInput: 'input[type="number"]',
    passwordInput: 'input[type="password"]',
    codeBtn: '.code-btn',
    agreementCheckbox: '.agree-label',
  }
};

export const AUTH_TIMEOUTS = {
  pageLoad: 5000,        // 增加到 5 秒
  elementVisible: 3000,   // 元素可见等待
  formSwitch: 1000,
  loginWait: 5000,
  networkIdle: 10000,     // 网络空闲等待
};

export const VALID_PAGE_INDICATORS = ['打卡', '社区', '我的'];

// ==================== 辅助函数 ====================

/**
 * 等待页面稳定
 * 改进: 增加等待时间，更好的网络状态检查
 */
async function waitForPage(page, timeout = AUTH_TIMEOUTS.pageLoad) {
  console.log('  ⏳ 等待页面加载...');

  try {
    // 等待网络空闲
    await page.waitForLoadState('networkidle', { timeout });
    console.log('  ✅ 网络已空闲');
  } catch (error) {
    console.log('  ⚠️ 网络未能在指定时间内达到空闲状态，继续执行...');
  }

  // 额外等待，确保 Vue 渲染完成
  await page.waitForTimeout(2000);
  console.log('  ✅ 页面加载完成');
}

/**
 * 验证登录页面加载
 * 改进: 增加详细的日志和错误诊断
 */
export async function waitForLoginPage(page) {
  console.log('  ⏳ 等待登录页面加载...');

  await waitForPage(page);

  // 检查页面 URL
  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  // 等待登录标题元素可见
  try {
    await page.waitForSelector(AUTH_SELECTORS.loginTitle, {
      timeout: AUTH_TIMEOUTS.elementVisible,
      state: 'visible'
    });
    console.log('  ✅ 登录标题已加载');
  } catch (error) {
    console.error('  ❌ 登录标题未加载');

    // 输出诊断信息
    const bodyText = await page.locator('body').textContent();
    console.error('  页面内容长度:', bodyText.length);
    console.error('  页面内容预览:', bodyText.substring(0, 300));

    throw new Error('登录页面未正确加载');
  }

  // 验证关键元素存在
  const pageTitle = await page.locator(AUTH_SELECTORS.loginTitle).textContent();
  expect(pageTitle).toContain('安全守护');
  console.log('  ✅ 登录页面验证通过');
}

/**
 * 验证是否在有效页面（首页的某个标签）
 */
export function isValidHomePage(pageText) {
  return VALID_PAGE_INDICATORS.some(indicator => pageText.includes(indicator));
}

/**
 * 使用手机号和密码登录
 * 改进: 使用 data-testid 选择器，增加错误处理和日志
 *       确保先导航到登录页面
 */
export async function loginWithPhoneAndPassword(page, phone, password) {
  console.log('\n🔐 开始登录流程...');

  // 检查当前页面状态
  const currentUrl = page.url();
  console.log('  📍 初始 URL:', currentUrl);

  // 如果页面为空或未正确加载，先导航到登录页面
  if (currentUrl === 'about:blank' || !currentUrl.includes('localhost:8081')) {
    console.log('  ⏳ 页面未加载，导航到登录页面...');
    await page.goto('/#/pages/login/login', { waitUntil: 'commit' });
    await page.waitForTimeout(2000);
  }

  // 检查是否已登录
  const pageText = await page.locator('body').textContent();
  if (isValidHomePage(pageText)) {
    console.log('  检测到已登录状态，清除认证状态...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForTimeout(500);
    await page.goto('/#/pages/login/login', { waitUntil: 'commit' });
    await page.waitForTimeout(2000);
  }

  // 等待登录页面加载
  console.log('\n1️⃣ 等待登录页面...');
  await waitForLoginPage(page);

  // 点击"手机号登录"按钮
  console.log('\n2️⃣ 点击手机号登录按钮...');
  const loginBtn = page.locator(AUTH_SELECTORS.phoneLoginBtn);

  try {
    // 使用更长的超时时间
    await loginBtn.click({ timeout: 5000 });
    console.log('  ✅ 已点击手机号登录按钮');
    await waitForPage(page);
  } catch (error) {
    console.error('  ❌ 点击手机号登录按钮失败');
    // 保存截图以便调试
    await page.screenshot({ path: 'test-results/login-button-error.png' });
    throw new Error('未找到手机号登录按钮');
  }

  // 切换到"密码登录"标签页
  console.log('\n3️⃣ 切换到密码登录标签...');

  // 尝试使用新的 data-testid 选择器
  let tabElement = page.locator(AUTH_SELECTORS.passwordTab);
  let tabCount = await tabElement.count();

  // 如果新选择器找不到，尝试使用旧选择器（向后兼容）
  if (tabCount === 0) {
    console.log('  ℹ️ 新选择器未找到，尝试备用选择器...');
    tabElement = page.locator(AUTH_SELECTORS.legacy.passwordTab);
    tabCount = await tabElement.count();
  }

  if (tabCount > 0) {
    await tabElement.nth(0).click({ force: true });
    console.log('  ✅ 已切换到密码登录标签');
    await page.waitForTimeout(AUTH_TIMEOUTS.formSwitch);
  } else {
    console.log('  ℹ️ 已在密码登录页面');
  }

  // 输入手机号
  console.log('\n4️⃣ 输入手机号...');
  let phoneInput = page.locator(AUTH_SELECTORS.phoneInput);
  let phoneInputCount = await phoneInput.count();

  // 如果新选择器找不到，尝试旧选择器
  if (phoneInputCount === 0) {
    console.log('  ℹ️ 新手机号选择器未找到，尝试备用选择器...');
    phoneInput = page.locator(AUTH_SELECTORS.legacy.phoneInput);
    phoneInputCount = await phoneInput.count();
  }

  if (phoneInputCount > 0) {
    // uni-input 是自定义组件，需要找到内部的真正 input 元素
    const actualInput = phoneInput.first().locator('input').or(phoneInput.first().locator('[type="number"]'));
    const actualInputCount = await actualInput.count();

    if (actualInputCount > 0) {
      await actualInput.first().click();
      await page.waitForTimeout(200);
      await actualInput.first().fill(phone);
      console.log(`  ✅ 已输入手机号: ${phone}`);
      await page.waitForTimeout(500);
    } else {
      throw new Error('未找到手机号输入框内的 input 元素');
    }
  } else {
    throw new Error('未找到手机号输入框');
  }

  // 输入密码
  console.log('\n5️⃣ 输入密码...');
  let passwordInput = page.locator(AUTH_SELECTORS.passwordInput);
  let passwordInputCount = await passwordInput.count();

  // 如果新选择器找不到，尝试旧选择器
  if (passwordInputCount === 0) {
    console.log('  ℹ️ 新密码选择器未找到，尝试备用选择器...');
    passwordInput = page.locator(AUTH_SELECTORS.legacy.passwordInput);
    passwordInputCount = await passwordInput.count();
  }

  if (passwordInputCount > 0) {
    // uni-input 是自定义组件，需要找到内部的真正 input 元素
    const actualInput = passwordInput.locator('input').or(passwordInput.locator('[type="password"]'));
    const actualInputCount = await actualInput.count();

    if (actualInputCount > 0) {
      await actualInput.click();
      await page.waitForTimeout(200);
      await actualInput.fill(password);
      console.log('  ✅ 已输入密码');
      await page.waitForTimeout(500);
    } else {
      throw new Error('未找到密码输入框内的 input 元素');
    }
  } else {
    throw new Error('未找到密码输入框');
  }

  // 点击登录按钮
  console.log('\n6️⃣ 点击登录按钮...');
  let submitBtn = page.locator(AUTH_SELECTORS.submitBtn);
  let submitBtnCount = await submitBtn.count();

  // 如果新选择器找不到，尝试旧选择器
  if (submitBtnCount === 0) {
    console.log('  ℹ️ 新提交按钮选择器未找到，尝试备用选择器...');
    submitBtn = page.locator(AUTH_SELECTORS.legacy.submitBtn);
    submitBtnCount = await submitBtn.count();
  }

  if (submitBtnCount > 0) {
    await submitBtn.first().click({ force: true });
    console.log('  ✅ 已点击登录按钮');
  } else {
    throw new Error('未找到登录按钮');
  }

  // 等待登录完成
  console.log('\n7️⃣ 等待登录完成...');
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);

  try {
    await page.waitForLoadState('networkidle', { timeout: AUTH_TIMEOUTS.networkIdle });
    console.log('  ✅ 网络已空闲');
  } catch (error) {
    console.log('  ⚠️ 网络未在指定时间内达到空闲状态');
  }

  // 验证是否跳转到首页
  console.log('\n8️⃣ 验证登录结果...');
  const finalPageText = await page.locator('body').textContent();
  const finalUrl = page.url();
  console.log('  当前 URL:', finalUrl);

  if (!isValidHomePage(finalPageText)) {
    console.error('  ❌ 登录失败，未跳转到首页');
    console.error('  页面内容:', finalPageText.substring(0, 200));

    // 保存失败截图
    await page.screenshot({ path: 'test-results/login-failed.png' });
    throw new Error('登录失败，未跳转到首页');
  }

  console.log('  ✅ 登录成功！');
  console.log('\n✅ 登录流程完成\n');
}

/**
 * 使用微信登录
 */
export async function loginWithWeChat(page, code) {
  await page.locator('button:has-text("微信登录")').click();
  await page.evaluate((c) => { window.mockWeChatLogin = true; }, code);
}

/**
 * 验证登录成功
 */
export async function verifyLoginSuccess(page) {
  await waitForPage(page, 2000);

  const pageText = await page.locator('body').textContent();
  if (!isValidHomePage(pageText)) {
    console.log('当前页面内容:', pageText.substring(0, 300));
    throw new Error('未找到首页元素，登录可能失败');
  }

  console.log('✅ 登录成功验证通过');
}

/**
 * 登出
 */
export async function logout(page) {
  // 点击底部导航栏的个人中心
  await page.locator('.tabbar-item:last-child').click();
  await page.waitForLoadState('networkidle');
  
  // 点击登出按钮（需要根据实际页面结构调整）
  // 这里暂时跳过，因为需要先实现个人中心页面的测试
  console.log('登出功能需要根据实际页面结构调整');
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUserInfo(page) {
  // 根据实际页面结构调整选择器
  // 这里暂时返回空对象，需要根据实际首页结构调整
  console.log('获取用户信息需要根据实际页面结构调整');
  return { nickname: '', role: '' };
}
/**
 * 超级管理员登录（快捷方法）
 */
export async function loginAsSuperAdmin(page, superAdmin = TEST_USERS.SUPER_ADMIN) {
  console.log('超级管理员登录...');

  await page.goto('/');
  await waitForPage(page, 3000);
  await waitForLoginPage(page);

  // 点击"手机号登录"按钮
  await page.locator(AUTH_SELECTORS.phoneLoginBtn).click({ force: true });
  await page.waitForSelector(AUTH_SELECTORS.passwordTab, { timeout: 10000 });
  await waitForPage(page);

  // 切换到"密码登录"并登录
  await page.locator(AUTH_SELECTORS.passwordTab).filter({ hasText: '密码登录' }).click({ force: true });
  await page.waitForTimeout(500);

  await page.locator(AUTH_SELECTORS.phoneInput).fill(superAdmin.phone);
  await page.locator(AUTH_SELECTORS.passwordInput).fill(superAdmin.password);

  await page.locator(AUTH_SELECTORS.submitBtn).click({ force: true });
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);
  await page.waitForLoadState('networkidle');

  const pageText = await page.locator('body').textContent();
  expect(pageText).toContain('我的');

  console.log('✅ 超级管理员登录成功');
}

/**
 * 生成随机手机号
 */
function generate137PhoneNumber() {
  const prefixes = ['181', '137', '182', '152', '192', '132', '131', '155', '128', '139'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = (Date.now() % 100000000).toString().padStart(8, '0');
  return `${prefix}${suffix}`;
}

/**
 * 注册新用户并登录（快捷方法）
 */
export async function registerAndLoginAsUser(page, options = {}) {
  const phoneNumber = options.phoneNumber || generate137PhoneNumber();
  const password = options.password || 'F1234567';
  const testCode = options.testCode || '123456';

  console.log(`开始注册并登录用户: ${phoneNumber}`);

  try {
    // 导航到登录页面并验证
    await page.goto('/');
    await waitForPage(page, 3000);

    const initialPageText = await page.locator('body').textContent();
    if (!initialPageText.includes('安全守护')) {
      throw new Error('登录页面未正确加载，未找到"安全守护"文本');
    }

    // 点击"手机号登录"按钮
    await page.waitForSelector(AUTH_SELECTORS.phoneLoginBtn, { timeout: 15000 });
    await page.locator(AUTH_SELECTORS.phoneLoginBtn).click({ force: true });
    await waitForPage(page);

    // 切换到"注册"标签 - 使用正确的 tab-register 选择器
    await page.locator('[data-testid="tab-register"]').click({ force: true });
    await page.waitForTimeout(AUTH_TIMEOUTS.formSwitch);

    // 输入手机号
    const phoneInput = page.locator(AUTH_SELECTORS.phoneInput).first();
    await phoneInput.click({ force: true });
    await phoneInput.clear();
    await phoneInput.type(phoneNumber, { delay: 100 });
    await page.waitForTimeout(500);

    // 点击"获取验证码"按钮
    await page.locator(AUTH_SELECTORS.codeBtn).click({ force: true });
    await page.waitForTimeout(2000);

    // 输入验证码
    const codeInput = page.locator(AUTH_SELECTORS.phoneInput).nth(1);
    await codeInput.click({ force: true });
    await codeInput.clear();
    await codeInput.type(testCode, { delay: 100 });
    await page.waitForTimeout(500);

    // 输入密码
    const passwordInput = page.locator(AUTH_SELECTORS.passwordInput);
    await passwordInput.click({ force: true });
    await passwordInput.clear();
    await passwordInput.type(password, { delay: 100 });
    await page.waitForTimeout(500);

    // 勾选用户协议
    await page.locator(AUTH_SELECTORS.agreementCheckbox).click({ force: true });
    await page.waitForTimeout(500);

    // 点击"注册"按钮
    await page.locator(AUTH_SELECTORS.submitBtn).click({ force: true });

    // 等待注册完成
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // 验证注册结果
    const pageText = await page.locator('body').textContent();

    // 检查是否仍在注册页面（说明注册失败）
    if (pageText.includes('手机号注册/登录') || pageText.includes('注册')) {
      console.error('❌ 注册失败，仍在注册页面');
      console.error('页面内容:', pageText.substring(0, 500));

      const errorPatterns = [/验证码错误/i, /验证码无效/i, /手机号已注册/i, /密码强度/i, /格式错误/i, /失败/i];
      for (const pattern of errorPatterns) {
        const match = pageText.match(pattern);
        if (match) throw new Error(`注册失败: ${match[0]}`);
      }

      throw new Error('注册失败，未知原因');
    }

    // 验证是否跳转到有效页面
    if (!isValidHomePage(pageText)) {
      console.error('❌ 注册失败，未跳转到有效页面');
      console.error('页面内容:', pageText.substring(0, 500));
      throw new Error('注册失败，未跳转到有效页面');
    }

    console.log('✅ 用户注册并登录成功');
    return { phone: phoneNumber, password };
  } catch (error) {
    console.error('❌ 注册并登录失败:', error.message);

    try {
      const screenshotPath = `test-failed-register-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      console.error(`已保存失败截图: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('无法保存截图:', screenshotError.message);
    }

    throw error;
  }
}
