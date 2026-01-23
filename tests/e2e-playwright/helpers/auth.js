/**
 * 认证相关的测试辅助函数
 */
import { expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data.mjs';

// ==================== 常量定义 ====================
export const AUTH_SELECTORS = {
  phoneLoginBtn: 'text=手机号登录',
  passwordTab: '.tab',
  submitBtn: 'uni-button.submit',
  phoneInput: 'input[type="number"]',
  passwordInput: 'input[type="password"]',
  codeBtn: '.code-btn',
  agreementCheckbox: '.agree-label',
};

export const AUTH_TIMEOUTS = {
  pageLoad: 2000,
  formSwitch: 1000,
  loginWait: 5000,
};

export const VALID_PAGE_INDICATORS = ['打卡', '社区', '我的'];

// ==================== 辅助函数 ====================

/**
 * 等待页面稳定
 */
async function waitForPage(page, timeout = AUTH_TIMEOUTS.pageLoad) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}

/**
 * 验证登录页面加载
 */
export async function waitForLoginPage(page) {
  await waitForPage(page);

  const pageText = await page.locator('body').textContent();
  expect(pageText).toContain('安全守护');
  expect(pageText).toContain('微信快捷登录');
  expect(pageText).toContain('手机号登录');
}

/**
 * 验证是否在有效页面（首页的某个标签）
 */
export function isValidHomePage(pageText) {
  return VALID_PAGE_INDICATORS.some(indicator => pageText.includes(indicator));
}

/**
 * 使用手机号和密码登录
 */
export async function loginWithPhoneAndPassword(page, phone, password) {
  // 检查当前页面状态
  const pageText = await page.locator('body').textContent();
  const currentUrl = page.url();

  // 如果在首页（已登录状态），需要先退出或清除状态
  if (isValidHomePage(pageText)) {
    console.log('  检测到已登录状态，清除认证状态...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForTimeout(500);
    await page.goto('/#/pages/login/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  }

  // 再次检查页面状态
  const refreshedPageText = await page.locator('body').textContent();

  // 点击"手机号登录"按钮
  const loginBtn = page.locator(AUTH_SELECTORS.phoneLoginBtn).first();
  const btnCount = await loginBtn.count();

  if (btnCount > 0) {
    await loginBtn.click({ force: true, timeout: 5000 });
    await waitForPage(page);
  } else {
    // 可能已经在手机登录页面或密码登录页面
    if (refreshedPageText.includes('密码登录') || refreshedPageText.includes('验证码登录')) {
      console.log('  已在登录页面');
    } else {
      console.log('  页面内容:', refreshedPageText.substring(0, 300));
      throw new Error('未找到手机号登录按钮');
    }
  }

  // 切换到"密码登录"标签页
  const tabElement = page.locator(AUTH_SELECTORS.passwordTab).filter({ hasText: '密码登录' });
  const tabCount = await tabElement.count();

  if (tabCount > 0) {
    await tabElement.click({ force: true });
    await page.waitForTimeout(AUTH_TIMEOUTS.formSwitch);
  }

  // 输入手机号和密码
  const phoneInput = page.locator(AUTH_SELECTORS.phoneInput).first();
  await phoneInput.fill(phone);
  await page.waitForTimeout(500);

  const passwordInput = page.locator(AUTH_SELECTORS.passwordInput);
  await passwordInput.fill(password);
  await page.waitForTimeout(500);

  // 点击登录按钮
  await page.locator(AUTH_SELECTORS.submitBtn).click({ force: true });

  // 等待登录完成
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);
  await page.waitForLoadState('networkidle');

  // 验证是否跳转到首页
  const finalPageText = await page.locator('body').textContent();
  if (!isValidHomePage(finalPageText)) {
    console.log('当前页面内容:', finalPageText.substring(0, 200));
    throw new Error('登录失败，未跳转到首页');
  }

  console.log('✅ 登录成功');
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

    // 切换到"注册"标签
    await page.locator(AUTH_SELECTORS.passwordTab).filter({ hasText: '注册' }).click({ force: true });
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
