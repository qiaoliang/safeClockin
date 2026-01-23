/**
 * 改进的认证测试辅助函数
 *
 * 改进点:
 * 1. 使用更稳定的 data-testid 选择器
 * 2. 改进等待策略
 * 3. 增加详细的调试信息
 * 4. 更好的错误处理
 */

import { expect } from '@playwright/test';

// ==================== 常量定义 ====================
export const IMPROVED_AUTH_SELECTORS = {
  // 登录欢迎页面
  loginWelcomePage: '[data-testid="login-welcome-page"]',
  loginTitle: '[data-testid="login-welcome-title"]',
  wechatLoginButton: '[data-testid="wechat-login-button"]',
  phoneLoginButton: '[data-testid="phone-login-button"]',

  // 手机号登录页面
  tabRegister: '[data-testid="tab-register"]',
  tabCodeLogin: '[data-testid="tab-code-login"]',
  tabPasswordLogin: '[data-testid="tab-password-login"]',
  phoneInput: '[data-testid="phone-input"]',
  passwordInput: '[data-testid="password-input"]',
  codeInput: '[data-testid="code-input"]',
  submitButton: '[data-testid="login-submit-button"]',
};

export const AUTH_TIMEOUTS = {
  pageLoad: 5000,      // 增加到 5 秒
  elementVisible: 3000, // 元素可见等待
  networkIdle: 10000,   // 网络空闲等待
  loginWait: 5000,      // 登录完成等待
};

export const VALID_PAGE_INDICATORS = ['打卡', '社区', '我的'];

// ==================== 辅助函数 ====================

/**
 * 等待页面完全加载
 */
async function waitForPageLoad(page, timeout = AUTH_TIMEOUTS.pageLoad) {
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
 */
export async function waitForImprovedLoginPage(page) {
  console.log('  ⏳ 等待登录页面加载...');

  await waitForPageLoad(page);

  // 检查页面 URL
  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  // 等待登录标题元素可见
  try {
    await page.waitForSelector(IMPROVED_AUTH_SELECTORS.loginTitle, {
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
  const pageTitle = await page.locator(IMPROVED_AUTH_SELECTORS.loginTitle).textContent();
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
 * 改进的手机号密码登录函数
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 */
export async function loginWithPhoneAndPasswordImproved(page, phone, password) {
  console.log('🔐 开始改进的登录流程...');

  // 1. 确保在登录页面
  console.log('\n1️⃣ 导航到登录页面...');
  const currentUrl = page.url();

  // 如果不在登录页面，先导航过去
  if (!currentUrl.includes('/pages/login/login')) {
    await page.goto('/#/pages/login/login', { waitUntil: 'commit' });
    console.log('  ✅ 已导航到登录页面');
  }

  // 等待登录页面加载完成
  await waitForImprovedLoginPage(page);

  // 2. 点击手机号登录按钮
  console.log('\n2️⃣ 点击手机号登录按钮...');
  const phoneLoginBtn = page.locator(IMPROVED_AUTH_SELECTORS.phoneLoginButton);

  try {
    await phoneLoginBtn.click({ timeout: 5000 });
    console.log('  ✅ 已点击手机号登录按钮');

    // 等待页面跳转到手机号登录页面
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error('  ❌ 点击手机号登录按钮失败:', error.message);
    throw error;
  }

  // 3. 切换到密码登录标签
  console.log('\n3️⃣ 切换到密码登录标签...');
  const passwordTab = page.locator(IMPROVED_AUTH_SELECTORS.tabPasswordLogin);

  const tabCount = await passwordTab.count();
  if (tabCount > 0) {
    await passwordTab.click({ force: true });
    console.log('  ✅ 已切换到密码登录标签');
    await page.waitForTimeout(500);
  } else {
    console.log('  ℹ️ 已在密码登录页面');
  }

  // 4. 输入手机号
  console.log('\n4️⃣ 输入手机号...');
  const phoneInput = page.locator(IMPROVED_AUTH_SELECTORS.phoneInput).first();
  await phoneInput.fill(phone);
  console.log(`  ✅ 已输入手机号: ${phone}`);
  await page.waitForTimeout(500);

  // 5. 输入密码
  console.log('\n5️⃣ 输入密码...');
  const passwordInput = page.locator(IMPROVED_AUTH_SELECTORS.passwordInput);
  await passwordInput.fill(password);
  console.log('  ✅ 已输入密码');
  await page.waitForTimeout(500);

  // 6. 点击登录按钮
  console.log('\n6️⃣ 点击登录按钮...');
  const submitBtn = page.locator(IMPROVED_AUTH_SELECTORS.submitButton);
  await submitBtn.click({ force: true });
  console.log('  ✅ 已点击登录按钮');

  // 7. 等待登录完成
  console.log('\n7️⃣ 等待登录完成...');
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);
  await page.waitForLoadState('networkidle', { timeout: AUTH_TIMEOUTS.networkIdle })
    .catch(() => console.log('  ⚠️ 网络未在指定时间内达到空闲状态'));

  // 8. 验证是否跳转到首页
  console.log('\n8️⃣ 验证登录结果...');
  const finalPageText = await page.locator('body').textContent();
  const finalUrl = page.url();
  console.log('  当前 URL:', finalUrl);

  if (!isValidHomePage(finalPageText)) {
    console.error('  ❌ 登录失败，未跳转到有效页面');
    console.error('  页面内容:', finalPageText.substring(0, 200));

    // 保存失败截图
    await page.screenshot({ path: 'test-results/login-failed.png' });
    throw new Error('登录失败，未跳转到首页');
  }

  console.log('  ✅ 登录成功！');
  console.log('\n✅ 登录流程完成');
}

/**
 * 改进的微信登录函数
 */
export async function loginWithWeChatImproved(page, code) {
  console.log('🔐 开始微信登录...');

  await waitForImprovedLoginPage(page);

  // 点击微信登录按钮
  const wechatBtn = page.locator(IMPROVED_AUTH_SELECTORS.wechatLoginButton);
  await wechatBtn.click();
  console.log('  ✅ 已点击微信登录按钮');

  // 等待登录完成
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);

  // 验证登录结果
  const pageText = await page.locator('body').textContent();
  if (!isValidHomePage(pageText)) {
    throw new Error('微信登录失败');
  }

  console.log('✅ 微信登录成功');
}
