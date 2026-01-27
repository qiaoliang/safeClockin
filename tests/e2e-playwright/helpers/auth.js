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
import { TEMP_DIR } from '../../../playwright.config.js';

// ==================== 常量定义 ====================

// 测试环境固定验证码
export const TEST_VERIFICATION_CODE = '123456';

// 等待时间常量（毫秒）
const WAIT = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 2000,
  XLONG: 3000,
  CODE_SEND: 2000,
  LOGIN: 8000,
  TAB_SWITCH: 500,
};

// 超时配置（毫秒）
const TIMEOUT = {
  PAGE_LOAD: 10000,
  ELEMENT_VISIBLE: 10000,
  MODAL: 5000,
  URL_CHANGE: 8000,
  BUTTON_VISIBLE: 15000,
};

// ==================== 选择器定义 ====================

export const AUTH_SELECTORS = {
  // 文本选择器（HBuilderX 会保留文本内容）
  phoneLoginBtn: 'text=手机号登录',
  wechatLoginBtn: 'text=微信登录',
  loginTitle: 'text=安全守护',
  profileTab: 'text=我的',
  logoutBtn: 'text=退出登录',
  modalConfirm: '.uni-modal__btn_primary',

  // data-testid 选择器
  tabPasswordLogin: '[data-testid="tab-password-login"]',
  tabCodeLogin: '[data-testid="tab-code-login"]',
  phoneInput: '[data-testid="phone-input"]',
  passwordInput: '[data-testid="password-input"]',
  codeInput: '[data-testid="code-input"]',
  getCodeButton: '[data-testid="get-code-button"]',
  loginSubmitButton: '[data-testid="login-submit-button"]',

  // 通用选择器
  tabbar: '.tabbar-item, .uni-tabbar__item',
  modal: '.uni-modal',
  modalBody: '.uni-modal__bd',
  numberInput: 'input[type="number"]',
  textInput: 'input[type="text"]',
};

export const AUTH_TIMEOUTS = {
  pageLoad: TIMEOUT.PAGE_LOAD,
  elementVisible: TIMEOUT.ELEMENT_VISIBLE,
  formSwitch: WAIT.MEDIUM,
  loginWait: WAIT.LOGIN,
  networkIdle: WAIT.LONG + WAIT.MEDIUM,
};

export const VALID_PAGE_INDICATORS = ['打卡', '社区', '我的'];

// ==================== 辅助函数 ====================

/**
 * 保存截图到临时目录
 */
function saveScreenshotToTemp(page, prefix) {
  const screenshotPath = `${TEMP_DIR}/${prefix}-${Date.now()}.png`;
  return page.screenshot({ path: screenshotPath }).then(() => screenshotPath);
}

/**
 * 等待页面稳定
 */
async function waitForPage(page, timeout = TIMEOUT.PAGE_LOAD) {
  console.log('  ⏳ 等待页面加载...');

  try {
    await page.waitForLoadState('networkidle', { timeout });
    console.log('  ✅ 网络已空闲');
  } catch (error) {
    console.log('  ⚠️ 网络未能在指定时间内达到空闲状态，继续执行...');
  }

  await page.waitForTimeout(WAIT.XLONG);
  console.log('  ✅ 页面加载完成');
}

/**
 * 清理认证状态（localStorage + sessionStorage + cookies）
 */
export async function cleanupAuthState(page) {
  console.log('  🧹 清理认证状态...');

  try {
    const url = page.url();
    if (!url || url === 'about:blank' || !url.includes('localhost')) {
      console.log('  ⚠️ 页面未就绪，跳过 storage 清理');
      const context = page.context();
      await context.clearCookies();
      console.log('  ✅ 已清理 cookies');
      return;
    }

    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('  ⚠️ localStorage 访问失败:', e.message);
      }
    });

    const context = page.context();
    await context.clearCookies();

    await page.waitForTimeout(WAIT.SHORT);
    console.log('  ✅ 认证状态已清理');
  } catch (error) {
    console.log('  ⚠️ 清理认证状态时出错:', error.message);
  }
}

/**
 * 验证登录页面加载
 */
export async function waitForLoginPage(page) {
  console.log('  ⏳ 等待登录页面加载...');

  await waitForPage(page);

  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  try {
    await page.waitForSelector(AUTH_SELECTORS.loginTitle, {
      timeout: TIMEOUT.ELEMENT_VISIBLE,
      state: 'visible'
    });
    console.log('  ✅ 登录标题已加载');
  } catch (error) {
    console.error('  ❌ 登录标题未加载');

    const bodyText = await page.locator('body').textContent();
    console.error('  页面内容长度:', bodyText.length);
    console.error('  页面内容预览:', bodyText.substring(0, 300));

    throw new Error('登录页面未正确加载');
  }

  const pageTitle = await page.locator(AUTH_SELECTORS.loginTitle).first().textContent();
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
 * 验证登录成功
 */
export async function verifyLoginSuccess(page) {
  await waitForPage(page, WAIT.LONG);

  const pageText = await page.locator('body').textContent();
  if (!isValidHomePage(pageText)) {
    console.log('当前页面内容:', pageText.substring(0, 300));
    throw new Error('未找到首页元素，登录可能失败');
  }

  console.log('✅ 登录成功验证通过');
}

/**
 * 滚动到页面底部
 */
async function scrollToBottom(page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/**
 * 等待并点击"我的"标签
 */
async function clickProfileTab(page) {
  console.log('\n1️⃣ 点击"我的"tab...');

  console.log('  📜 向下滚动到页面底部...');
  await scrollToBottom(page);
  await page.waitForTimeout(WAIT.MEDIUM);

  const scrollInfo = await page.evaluate(() => ({
    windowHeight: window.innerHeight,
    documentHeight: document.body.scrollHeight,
    scrollTop: window.pageYOffset || document.documentElement.scrollTop,
  }));
  console.log(`  📏 窗口高度: ${scrollInfo.windowHeight}px, 文档高度: ${scrollInfo.documentHeight}px, 滚动位置: ${scrollInfo.scrollTop}px`);

  const profileTab = page.locator(AUTH_SELECTORS.tabbar).filter({ hasText: '我的' }).or(
    page.locator(AUTH_SELECTORS.profileTab)
  );

  console.log('  🔍 等待"我的"tab出现且可见...');
  await profileTab.first().waitFor({ state: 'attached', timeout: TIMEOUT.PAGE_LOAD });

  const isVisible = await profileTab.first().isVisible();
  console.log(`  👁️ 导航栏元素是否可见: ${isVisible}`);

  if (!isVisible) {
    console.log('  ⚠️ 导航栏不可见，再次滚动到底部...');
    await scrollToBottom(page);
    await page.waitForTimeout(WAIT.SHORT);
  }

  const isVisibleAfterScroll = await profileTab.first().isVisible();
  console.log(`  👁️ 第二次检查可见性: ${isVisibleAfterScroll}`);

  await profileTab.first().click({ force: true });
  await page.waitForTimeout(WAIT.MEDIUM + WAIT.SHORT);
  console.log('  ✅ 已点击"我的"tab');
}

/**
 * 等待并确认模态对话框
 */
async function confirmModal(page, expectedContent) {
  console.log('  ⏳ 等待对话框出现...');
  await expect(page.locator(AUTH_SELECTORS.modal).first()).toBeVisible({ timeout: TIMEOUT.MODAL });

  const modalContent = await page.locator(AUTH_SELECTORS.modalBody).first().textContent();
  console.log(`  📝 对话框内容: ${modalContent}`);

  if (expectedContent) {
    expect(modalContent).toContain(expectedContent);
  }

  const confirmBtn = page.locator(AUTH_SELECTORS.modalConfirm).first();
  const isConfirmBtnVisible = await confirmBtn.isVisible();
  console.log(`  🔍 确定按钮是否可见: ${isConfirmBtnVisible}`);

  if (!isConfirmBtnVisible) {
    throw new Error('确定按钮不可见，无法完成操作');
  }

  const btnText = await confirmBtn.textContent();
  console.log(`  📝 确定按钮文本: ${btnText}`);

  await confirmBtn.click({ force: true });
  console.log('  ✅ 已点击"确定"按钮');
}

/**
 * 检查并处理"登录已过期"提示框
 */
async function handleExpiredLoginModal(page) {
  console.log('\n  📋 检查是否出现"用户登录已过期"提示框...');
  const expiredModalVisible = await page.locator(AUTH_SELECTORS.modal).isVisible();

  if (!expiredModalVisible) {
    console.log('  ℹ️ 未检测到"用户登录已过期"提示框');
    return false;
  }

  const expiredModalContent = await page.locator(AUTH_SELECTORS.modalBody).first().textContent();
  console.log(`  📝 提示框内容: ${expiredModalContent}`);

  if (expiredModalContent.includes('用户登录已过期') || expiredModalContent.includes('请重新登录')) {
    console.log('  ✅ 检测到"用户登录已过期"提示框，点击确定按钮');
    await page.locator(AUTH_SELECTORS.modalConfirm).first().click({ force: true });
    await page.waitForTimeout(WAIT.MEDIUM);
    console.log('  ✅ 已点击"确定"按钮');
    return true;
  }

  return false;
}

/**
 * 验证已返回到登录页面
 */
async function verifyBackToLoginPage(page) {
  console.log('\n5️⃣ 验证返回到登录首页...');

  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  if (!currentUrl.includes('login')) {
    console.log('  ⚠️ URL未包含login，额外等待...');
    await page.waitForTimeout(WAIT.LOGIN);

    const newUrl = page.url();
    console.log('  📍 重新检查 URL:', newUrl);
  }

  const pageText = await page.locator('body').textContent();
  console.log('  📄 当前页面内容长度:', pageText.length);
  console.log('  📄 当前页面内容预览:', pageText.substring(0, 200));

  const hasTitle = pageText.includes('安全守护');
  const hasWechatLogin = pageText.includes('微信快捷登录');
  const hasPhoneLogin = pageText.includes('手机号登录');
  console.log('  🔍 检查结果:', { hasTitle, hasWechatLogin, hasPhoneLogin });

  expect(hasTitle).toBeTruthy();
  expect(hasWechatLogin).toBeTruthy();
  expect(hasPhoneLogin).toBeTruthy();

  if (!hasTitle || !hasWechatLogin || !hasPhoneLogin) {
    console.error('  ❌ 未正确返回到登录页面');
    console.error('  页面内容:', pageText.substring(0, 300));

    const screenshotPath = `${TEMP_DIR}/logout-failed-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    console.error(`  已保存失败截图: ${screenshotPath}`);

    throw new Error('登出失败，未返回到登录页面');
  }

  console.log('  ✅ 已成功返回到登录页面');
}

/**
 * 登出
 * 流程：
 * 1. 点击底部导航栏的"我的"tab
 * 2. 下拉窗口以显示退出登录按钮
 * 3. 点击"退出登录"按钮
 * 4. 在弹出的对话框中点击"确定"
 * 5. 验证已返回到登录首页
 */
export async function logout(page) {
  console.log('\n🚪 开始登出流程...');

  await clickProfileTab(page);

  console.log('\n2️⃣ 下拉窗口...');
  await scrollToBottom(page);
  await page.waitForTimeout(WAIT.SHORT);
  console.log('  ✅ 已下拉窗口');

  console.log('\n3️⃣ 点击"退出登录"按钮...');
  const logoutBtn = page.locator(AUTH_SELECTORS.logoutBtn).or(
    page.locator('[data-testid="logout-button"]')
  );

  await logoutBtn.waitFor({ state: 'visible', timeout: TIMEOUT.MODAL });
  await logoutBtn.first().click({ force: true });
  await page.waitForTimeout(WAIT.MEDIUM);
  console.log('  ✅ 已点击"退出登录"按钮');

  console.log('\n4️⃣ 在确认对话框中点击"确定"...');
  await confirmModal(page, '确定要退出登录吗？');

  console.log('  ⏳ 等待页面跳转...');
  try {
    await page.waitForURL(/login/i, { timeout: TIMEOUT.URL_CHANGE });
    console.log('  ✅ URL已变化');
  } catch (error) {
    console.log('  ⚠️ URL未在预期时间内变化，继续执行...');
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT.URL_CHANGE });
  } catch (error) {
    console.log('  ⚠️ 网络未能在指定时间内达到空闲状态，继续执行...');
  }

  await page.waitForTimeout(WAIT.LONG);

  await handleExpiredLoginModal(page);
  await verifyBackToLoginPage(page);

  console.log('\n✅ 登出流程完成\n');
}

// ==================== 登录辅助函数 ====================

/**
 * 点击手机号登录按钮
 */
async function clickPhoneLoginButton(page) {
  console.log('  📍 当前URL:', page.url());

  await expect(page.locator(AUTH_SELECTORS.phoneLoginBtn).first()).toBeVisible({ timeout: TIMEOUT.BUTTON_VISIBLE });
  await page.locator(AUTH_SELECTORS.phoneLoginBtn).first().click({ force: true });
  console.log('  ✅ 已点击"手机号登录"按钮');

  await waitForPage(page);
}

/**
 * 切换登录标签
 */
async function switchLoginTab(page, tabSelector, tabName) {
  const tab = page.locator(tabSelector).first();
  if (await tab.isVisible()) {
    await tab.click({ force: true });
    await page.waitForTimeout(WAIT.TAB_SWITCH);
    console.log(`  ✅ 已切换到${tabName}标签`);
  } else {
    console.log(`  ⚠️ ${tabName}标签不可见，尝试直接登录`);
  }
}

/**
 * 填写手机号
 */
async function fillPhoneNumber(page, phone) {
  console.log('  📝 输入手机号:', phone);
  const phoneInput = page.locator(AUTH_SELECTORS.phoneInput).first().locator(AUTH_SELECTORS.numberInput);
  await phoneInput.fill(phone);
}

/**
 * 填写密码
 */
async function fillPassword(page, password) {
  console.log('  📝 输入密码');
  const passwordInput = page.locator(AUTH_SELECTORS.passwordInput).first().locator('input[type="password"]');
  await passwordInput.fill(password);
}

/**
 * 点击获取验证码按钮
 */
async function clickGetCodeButton(page) {
  console.log('  📱 点击"获取验证码"按钮');
  const codeBtn = page.locator(AUTH_SELECTORS.getCodeButton).first();
  await codeBtn.click({ force: true });
  console.log('  ✅ 已点击"获取验证码"按钮');
  await page.waitForTimeout(WAIT.CODE_SEND);
}

/**
 * 填写验证码
 */
async function fillVerificationCode(page, code = TEST_VERIFICATION_CODE) {
  console.log('  📝 输入验证码:', code);
  const codeInput = page.locator(AUTH_SELECTORS.codeInput).first().locator(AUTH_SELECTORS.textInput);
  await codeInput.fill(code);
}

/**
 * 点击登录按钮
 */
async function clickLoginButton(page) {
  const loginBtn = page.locator(AUTH_SELECTORS.loginSubmitButton).first();
  await loginBtn.click({ force: true });
  console.log('  ✅ 已点击登录按钮');
}

/**
 * 等待登录完成并验证
 */
async function waitForLoginAndVerify(page) {
  await page.waitForTimeout(WAIT.LOGIN);
  console.log('  ⏳ 等待网络空闲...');
  await page.waitForLoadState('networkidle');

  const pageText = await page.locator('body').textContent();
  console.log('  📄 页面内容长度:', pageText.length);
  console.log('  📄 当前URL:', page.url());

  const hasMyPage = pageText.includes('我的');
  console.log('  🔍 页面是否包含"我的":', hasMyPage);

  if (!hasMyPage) {
    console.error('  ❌ 登录可能失败，页面内容:');
    console.error('  ', pageText.substring(0, 500));

    const screenshotPath = `${TEMP_DIR}/login-failed-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`  已保存失败截图: ${screenshotPath}`);
  }

  expect(pageText).toContain('我的');
}

/**
 * 密码登录的通用流程
 */
async function loginByPassword(page, user) {
  console.log('密码登录...');

  await page.goto('/');
  await waitForPage(page, WAIT.XLONG);
  await waitForLoginPage(page);

  await clickPhoneLoginButton(page);

  await expect(page.locator(AUTH_SELECTORS.tabPasswordLogin).first()).toBeVisible({ timeout: TIMEOUT.BUTTON_VISIBLE });
  await switchLoginTab(page, AUTH_SELECTORS.tabPasswordLogin, '密码登录');

  await expect(page.locator(AUTH_SELECTORS.passwordInput).first()).toBeVisible({ timeout: TIMEOUT.ELEMENT_VISIBLE });

  const passwordInputVisible = await page.locator(AUTH_SELECTORS.passwordInput).first().isVisible();
  console.log('  🔍 密码输入框可见性:', passwordInputVisible);

  await fillPhoneNumber(page, user.phone);
  await fillPassword(page, user.password);
  await clickLoginButton(page);
  await waitForLoginAndVerify(page);
}

/**
 * 验证码登录的通用流程
 */
async function loginByCode(page, user, code = TEST_VERIFICATION_CODE) {
  console.log('验证码登录...');

  await page.goto('/');
  await waitForPage(page, WAIT.XLONG);
  await waitForLoginPage(page);

  await clickPhoneLoginButton(page);

  await expect(page.locator(AUTH_SELECTORS.tabCodeLogin).first()).toBeVisible({ timeout: TIMEOUT.BUTTON_VISIBLE });
  await switchLoginTab(page, AUTH_SELECTORS.tabCodeLogin, '验证码登录');

  await expect(page.locator(AUTH_SELECTORS.codeInput).first()).toBeVisible({ timeout: TIMEOUT.ELEMENT_VISIBLE });

  const codeInputVisible = await page.locator(AUTH_SELECTORS.codeInput).first().isVisible();
  console.log('  🔍 验证码输入框可见性:', codeInputVisible);

  await fillPhoneNumber(page, user.phone);
  await clickGetCodeButton(page);
  await fillVerificationCode(page, code);
  await clickLoginButton(page);
  await waitForLoginAndVerify(page);
}

/**
 * 超级管理员登录（快捷方法）
 */
export async function loginAsSuperAdmin(page, superAdmin = TEST_USERS.SUPER_ADMIN) {
  await loginByPassword(page, superAdmin);
  console.log('✅ 超级管理员登录成功');
}

/**
 * 普通用户登录（使用验证码登录）
 *
 * @param {Page} page - Playwright 页面对象
 * @param {Object} normalUser - 用户信息对象，默认为 TEST_USERS.NORMAL
 * @param {string} normalUser.phone - 手机号
 * @param {string} normalUser.nickname - 昵称（可选）
 *
 * @returns {Promise<void>}
 *
 * @example
 * // 使用默认普通用户登录
 * await loginAsNormalUserByCode(page);
 *
 * @example
 * // 使用社区专员登录
 * await loginAsNormalUserByCode(page, TEST_USERS.STAFF);
 *
 * @example
 * // 使用自定义用户登录
 * await loginAsNormalUserByCode(page, {
 *   phone: '13900000099',
 *   nickname: '测试用户'
 * });
 *
 * @throws {Error} 当登录失败时抛出错误，包括截图保存
 */
export async function loginAsNormalUserByCode(page, normalUser = TEST_USERS.NORMAL) {
  await loginByCode(page, normalUser);
  console.log('✅ 普通用户登录成功');
}

/**
 * 生成随机手机号
 */
function generateRandomPhoneNumber() {
  const prefixes = ['181', '137', '182', '152', '192', '132', '131', '155', '128', '139'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = (Date.now() % 100000000).toString().padStart(8, '0');
  return `${prefix}${suffix}`;
}

/**
 * 注册新用户并登录（快捷方法）
 */
export async function registerAndLoginAsUser(page, options = {}) {
  const phoneNumber = options.phoneNumber || generateRandomPhoneNumber();
  const password = options.password || 'F1234567';
  const testCode = options.testCode || '123456';

  console.log(`开始注册并登录用户: ${phoneNumber}`);

  try {
    console.log('🧹 准备工作：清理认证状态');
    await cleanupAuthState(page);

    console.log('⏳ 步骤 1：导航到登录页面');
    await page.goto('/#/pages/login/login', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT.XLONG);

    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('安全守护');
    expect(pageText).toContain('微信快捷登录');
    expect(pageText).toContain('手机号登录');
    console.log('✅ 步骤 1：成功导航到登录页面');

    console.log('⏳ 步骤 2：点击手机号登录按钮');
    const phoneLoginBtn = page.locator(AUTH_SELECTORS.phoneLoginBtn).first();
    try {
      await phoneLoginBtn.waitFor({ state: 'visible', timeout: TIMEOUT.ELEMENT_VISIBLE });
      await phoneLoginBtn.click({ force: true });
      await waitForPage(page);
      console.log('✅ 步骤 2：成功点击手机号登录按钮');
    } catch (error) {
      const screenshotPath = await saveScreenshotToTemp(page, 'test-failed-login-btn');
      console.error(`❌ "手机号登录"按钮失败，已保存截图: ${screenshotPath}`);
      throw new Error('登录按钮操作失败');
    }

    console.log('⏳ 步骤 3：切换到注册表单');
    const registerTab = page.locator('.tab').filter({ hasText: '注册' });
    await registerTab.click({ force: true });
    await page.waitForTimeout(WAIT.MEDIUM);

    const registerText = await page.locator('body').textContent();
    expect(registerText).toContain('注册');
    expect(registerText).toContain('设置密码');
    console.log('✅ 步骤 3：成功切换到注册表单');

    console.log('⏳ 步骤 4：输入手机号');
    const phoneInput = page.locator(AUTH_SELECTORS.numberInput).first();
    await phoneInput.click({ force: true });
    await phoneInput.clear();
    await phoneInput.type(phoneNumber, { delay: 100 });
    await page.waitForTimeout(WAIT.SHORT);
    console.log('✅ 步骤 4：成功输入手机号');

    console.log('⏳ 步骤 5：发送验证码');
    const codeBtn = page.locator('.code-btn');
    await codeBtn.click({ force: true });
    await page.waitForTimeout(WAIT.CODE_SEND);

    const codeBtnText = await codeBtn.textContent();
    expect(codeBtnText).toMatch(/\d+s/);
    console.log('✅ 步骤 5：成功发送验证码');

    console.log('⏳ 步骤 6：输入验证码');
    const codeInput = page.locator(AUTH_SELECTORS.numberInput).nth(1);
    await codeInput.click({ force: true });
    await codeInput.clear();
    await codeInput.type(testCode, { delay: 100 });
    await page.waitForTimeout(WAIT.SHORT);
    console.log('✅ 步骤 6：成功输入验证码');

    console.log('⏳ 步骤 7：输入密码');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click({ force: true });
    await passwordInput.clear();
    await passwordInput.type(password, { delay: 100 });
    await page.waitForTimeout(WAIT.SHORT);
    console.log('✅ 步骤 7：成功输入密码');

    console.log('⏳ 步骤 8：勾选用户协议');
    const agreementText = page.locator('text=用户协议').or(page.locator('text=隐私政策'));
    if (await agreementText.count() > 0) {
      await agreementText.first().click({ force: true });
      await page.waitForTimeout(WAIT.SHORT);
      console.log('✅ 步骤 8：已勾选用户协议');
    } else {
      console.log('⚠️ 步骤 8：未找到协议文本，尝试其他方式');
      const checkbox = page.locator('.agree-checkbox, .uni-checkbox, [type="checkbox"]');
      if (await checkbox.count() > 0) {
        await checkbox.first().click({ force: true });
        await page.waitForTimeout(WAIT.SHORT);
        console.log('✅ 步骤 8：已勾选用户协议（通过复选框）');
      }
    }

    console.log('⏳ 步骤 9：提交注册申请');
    const submitBtn = page.locator('uni-button.submit');
    await submitBtn.click({ force: true });
    console.log('✅ 步骤 9：提交注册申请');

    await page.waitForTimeout(WAIT.LOGIN);
    await page.waitForLoadState('networkidle');

    const homePageText = await page.locator('body').textContent();

    if (homePageText.includes('手机号注册/登录') || homePageText.includes('注册')) {
      console.error('❌ 注册失败，仍在注册页面');
      console.error('页面内容:', homePageText.substring(0, 500));

      const errorPatterns = [/验证码错误/i, /验证码无效/i, /手机号已注册/i, /密码强度/i, /格式错误/i, /失败/i];
      for (const pattern of errorPatterns) {
        const match = homePageText.match(pattern);
        if (match) throw new Error(`注册失败: ${match[0]}`);
      }

      throw new Error('注册失败，未知原因');
    }

    if (!isValidHomePage(homePageText)) {
      console.error('❌ 注册失败，未跳转到有效页面');
      console.error('页面内容:', homePageText.substring(0, 500));
      throw new Error('注册失败，未跳转到有效页面');
    }

    console.log('✅ 用户注册并登录成功');
    console.log(`✅ 用户 ${phoneNumber} 注册成功并进入打卡首页`);
    return { phone: phoneNumber, password };
  } catch (error) {
    console.error('❌ 注册并登录失败:', error.message);

    try {
      const screenshotPath = await saveScreenshotToTemp(page, 'test-failed-register');
      console.error(`已保存失败截图: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error('无法保存截图:', screenshotError.message);
    }

    throw error;
  }
}
