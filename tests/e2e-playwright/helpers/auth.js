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

// 临时文件目录
const TEMP_DIR = '/tmp/playwright';

/**
 * 保存截图到临时目录
 */
async function saveScreenshotToTemp(page, prefix) {
  const screenshotPath = `${TEMP_DIR}/${prefix}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath });
  return screenshotPath;
}

// ==================== 选择器定义 ====================

export const AUTH_SELECTORS = {
  // 使用文本选择器（更稳定，HBuilderX 会保留文本内容）
  phoneLoginBtn: 'button:has-text("手机号登录")',
  wechatLoginBtn: 'button:has-text("微信登录")',
  loginTitle: 'text=安全守护',

  // 手机号登录页面选择器
  passwordTab: '.uni-tab__item:has-text("密码登录")',
  codeTab: '.uni-tab__item:has-text("验证码登录")',
  registerTab: '.uni-tab__item:has-text("注册")',
  submitBtn: 'button:has-text("登录"), button:has-text("确认"), button:has-text("注册")',
  phoneInput: 'input[type="number"], input[type="tel"]',
  passwordInput: 'input[type="password"]',
  codeInput: 'input[type="text"]:nth-of-type(2)',

  // 验证码按钮（备用）
  codeBtn: 'button:has-text("获取验证码"), button:has-text("验证码")',

  // 用户协议复选框
  agreementCheckbox: '.agree-checkbox, .uni-checkbox, label:has-text("用户协议")',

  // 备用选择器（向后兼容）
  legacy: {
    passwordTab: '.tab:has-text("密码登录")',
    codeTab: '.tab:has-text("验证码登录")',
    submitBtn: 'uni-button.submit, button[type="submit"]',
    phoneInput: 'input[type="number"]',
    passwordInput: 'input[type="password"]',
    codeBtn: '.code-btn',
    agreementCheckbox: '.agree-label',
  }
};

export const AUTH_TIMEOUTS = {
  pageLoad: 10000,        // 增加到 10 秒
  elementVisible: 10000,  // 元素可见等待增加到 10 秒
  formSwitch: 2000,
  loginWait: 8000,
  networkIdle: 15000,     // 网络空闲等待
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
  // 增加等待时间以适应 Vue 的响应式系统
  await page.waitForTimeout(3000);
  console.log('  ✅ 页面加载完成');
}

/**
 * 验证登录页面加载
 * 改进: 使用文本选择器代替 data-testid（HBuilderX 会移除自定义属性）
 */
export async function waitForLoginPage(page) {
  console.log('  ⏳ 等待登录页面加载...');

  await waitForPage(page);

  // 检查页面 URL
  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  // 等待登录标题元素可见 - 使用文本选择器
  try {
    await page.waitForSelector('text=安全守护', {
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

  // 验证关键元素存在 - 使用文本选择器
  const pageTitle = await page.locator('text=安全守护').first().textContent();
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
 * 改进: 使用文本选择器代替 data-testid，增加错误处理和日志先导航到登录
 *       确保页面，并清理之前的状态
 */
export async function loginWithPhoneAndPassword(page, phone, password) {
  console.log('\n🔐 开始登录流程...');

  // 检查当前页面状态
  const currentUrl = page.url();
  console.log('  📍 初始 URL:', currentUrl);

  // 如果页面为空或未正确加载，先清理状态并导航
  if (currentUrl === 'about:blank' || !currentUrl.includes('localhost:8081')) {
    console.log('  ⏳ 页面未加载，清理状态并导航到登录页面...');
    await cleanupAuthState(page);
    await page.goto('/#/pages/login/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  } else {
    // 清理状态以确保干净的登录流程
    console.log('  🧹 清理之前的状态...');
    await cleanupAuthState(page);
  }

  // 检查是否已登录
  const pageText = await page.locator('body').textContent();
  if (isValidHomePage(pageText)) {
    console.log('  检测到已登录状态，跳转到登录页面...');
    await page.goto('/#/pages/login/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  }

  // 等待登录页面加载
  console.log('\n1️⃣ 等待登录页面...');
  await waitForLoginPage(page);

  // 点击"手机号登录"按钮 - 使用文本选择器
  console.log('\n2️⃣ 点击手机号登录按钮...');
  const loginBtn = page.locator('button:has-text("手机号登录")');

  try {
    // 使用更长的超时时间
    await loginBtn.click({ timeout: 5000 });
    console.log('  ✅ 已点击手机号登录按钮');
    await waitForPage(page);
  } catch (error) {
    console.error('  ❌ 点击手机号登录按钮失败');
    // 保存截图以便调试
    await page.screenshot({ path: `${TEMP_DIR}/login-button-error.png` });
    throw new Error('未找到手机号登录按钮');
  }

  // 切换到"密码登录"标签页 - 使用文本选择器
  console.log('\n3️⃣ 切换到密码登录标签...');

  // 尝试使用文本选择器
  let tabElement = page.locator('.uni-tab__item:has-text("密码登录")');
  let tabCount = await tabElement.count();

  // 如果找不到，尝试备用选择器
  if (tabCount === 0) {
    console.log('  ℹ️ 新选择器未找到，尝试备用选择器...');
    tabElement = page.locator('.tab:has-text("密码登录")');
    tabCount = await tabElement.count();
  }

  // 如果还是找不到，尝试通用文本选择器
  if (tabCount === 0) {
    console.log('  ℹ️ 备用选择器也未找到，尝试通用选择器...');
    tabElement = page.locator('text=密码登录');
    tabCount = await tabElement.count();
  }

  if (tabCount > 0) {
    await tabElement.nth(0).click({ force: true });
    console.log('  ✅ 已切换到密码登录标签');
    await page.waitForTimeout(AUTH_TIMEOUTS.formSwitch);
  } else {
    console.log('  ℹ️ 已在密码登录页面或无法找到标签');
  }

  // 输入手机号
  console.log('\n4️⃣ 输入手机号...');
  let phoneInput = page.locator('input[type="number"], input[type="tel"]');
  let phoneInputCount = await phoneInput.count();

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

  // 点击登录按钮 - 使用文本选择器
  console.log('\n6️⃣ 点击登录按钮...');
  let submitBtn = page.locator('button:has-text("登录")');
  let submitBtnCount = await submitBtn.count();

  // 如果找不到，尝试其他选择器
  if (submitBtnCount === 0) {
    console.log('  ℹ️ 登录按钮未找到，尝试备用选择器...');
    submitBtn = page.locator('button:has-text("确认")');
    submitBtnCount = await submitBtn.count();
  }

  // 如果还是找不到，尝试 uni-button
  if (submitBtnCount === 0) {
    console.log('  ℹ️ 确认按钮也未找到，尝试 uni-button...');
    submitBtn = page.locator('uni-button');
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
    await page.screenshot({ path: `${TEMP_DIR}/login-failed.png` });
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
 * 流程：
 * 1. 点击底部导航栏的"我的"tab
 * 2. 下拉窗口以显示退出登录按钮
 * 3. 点击"退出登录"按钮
 * 4. 在弹出的对话框中点击"确定"
 * 5. 验证已返回到登录首页
 */
export async function logout(page) {
  console.log('\n🚪 开始登出流程...');

  // 步骤 1: 点击底部导航栏的"我的"tab
  console.log('\n1️⃣ 点击"我的"tab...');
  const profileTab = page.locator('text=我的').or(page.locator('.tabbar-item:last-child'));
  await profileTab.click();
  await page.waitForTimeout(1000);
  console.log('  ✅ 已点击"我的"tab');

  // 步骤 2: 下拉窗口以显示退出登录按钮
  console.log('\n2️⃣ 下拉窗口...');
  const viewportSize = page.viewportSize();
  const scrollHeight = viewportSize ? viewportSize.height : 800;
  await page.evaluate((height) => {
    window.scrollBy(0, height);
  }, scrollHeight);
  await page.waitForTimeout(500);
  console.log('  ✅ 已下拉窗口');

  // 步骤 3: 找到并点击"退出登录"按钮
  console.log('\n3️⃣ 点击"退出登录"按钮...');
  // 使用 data-testid 或文本选择器
  const logoutBtn = page.locator('[data-testid="logout-button"]').or(
    page.locator('button:has-text("退出登录")')
  ).or(
    page.locator('text=退出登录')
  );

  // 等待按钮可见
  await logoutBtn.waitFor({ state: 'visible', timeout: 5000 });
  await logoutBtn.click();
  await page.waitForTimeout(500);
  console.log('  ✅ 已点击"退出登录"按钮');

  // 步骤 4: 在弹出的对话框中点击"确定"按钮
  console.log('\n4️⃣ 在确认对话框中点击"确定"...');
  // uni.showModal 会创建一个对话框，需要点击确定按钮
  const confirmBtn = page.locator('button:has-text("确定")').or(
    page.locator('.uni-modal__btn:has-text("确定")')
  ).or(
    page.locator('text=确定')
  );

  // 等待对话框出现
  await page.waitForTimeout(500);
  await confirmBtn.first().click();
  console.log('  ✅ 已点击"确定"按钮');

  // 步骤 5: 等待跳转并验证已返回到登录首页
  console.log('\n5️⃣ 验证返回到登录首页...');
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // 验证登录页面关键元素
  const pageText = await page.locator('body').textContent();

  // 检查是否包含登录页面的关键文本
  const hasTitle = pageText.includes('安全守护');
  const hasWechatLogin = pageText.includes('微信快捷登录');
  const hasPhoneLogin = pageText.includes('手机号登录');
  expect(hasTitle).toBeTruthy();
  expect(hasWechatLogin).toBeTruthy();
  expect(hasWechatLogin).toBeTruthy();

  if (!hasTitle || !hasWechatLogin || !hasPhoneLogin) {
    console.error('  ❌ 未正确返回到登录页面');
    console.error('  页面内容:', pageText.substring(0, 300));

    // 保存失败截图
    const screenshotPath = `${TEMP_DIR}/logout-failed-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    console.error(`  已保存失败截图: ${screenshotPath}`);

    throw new Error('登出失败，未返回到登录页面');
  }

  console.log('  ✅ 已成功返回到登录页面');
  console.log('\n✅ 登出流程完成\n');
}
/**
 * 超级管理员登录（快捷方法）
 * 改进: 使用文本选择器代替 data-testid（HBuilderX 会移除自定义属性）
 */
export async function loginAsSuperAdmin(page, superAdmin = TEST_USERS.SUPER_ADMIN) {
  console.log('超级管理员登录...');

  await page.goto('/');
  await waitForPage(page, 3000);
  await waitForLoginPage(page);

  // 点击"手机号登录"按钮 - 使用文本选择器
  await expect(page.locator('button:has-text("手机号登录")').first()).toBeVisible({ timeout: 15000 });
  await page.locator('button:has-text("手机号登录")').first().click({ force: true });

  // 等待密码登录标签可见 - 使用文本选择器
  await expect(page.locator('text=密码登录').first()).toBeVisible({ timeout: 15000 });
  await waitForPage(page);

  // 切换到"密码登录" - 使用文本选择器
  const passwordTab = page.locator('text=密码登录').first();
  if (await passwordTab.isVisible()) {
    await passwordTab.click({ force: true });
    await page.waitForTimeout(500);
  }

  // 等待密码输入框可见
  await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 });

  // 输入手机号和密码
  await page.locator('input[type="number"], input[type="tel"]').first().fill(superAdmin.phone);
  await page.locator('input[type="password"]').first().fill(superAdmin.password);

  // 点击登录按钮 - 使用文本选择器
  await page.locator('button:has-text("登录")').first().click({ force: true });
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
 * 改进: 使用文本选择器代替 data-testid（HBuilderX 会移除自定义属性）
 */
export async function registerAndLoginAsUser(page, options = {}) {
  const phoneNumber = options.phoneNumber || generate137PhoneNumber();
  const password = options.password || 'F1234567';
  const testCode = options.testCode || '123456';

  console.log(`开始注册并登录用户: ${phoneNumber}`);

  try {
    // 清理之前的认证状态
    console.log('🧹 准备工作：清理认证状态');
    await cleanupAuthState(page);

    // 步骤 1：导航到登录页面
    console.log('⏳ 步骤 1：导航到登录页面');
    await page.goto('/#/pages/login/login', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 验证登录页面元素（更完整的验证）
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('安全守护');
    expect(pageText).toContain('微信快捷登录');
    expect(pageText).toContain('手机号登录');
    console.log('✅ 步骤 1：成功导航到登录页面');

    // 步骤 2：点击"手机号登录"按钮
    console.log('⏳ 步骤 2：点击手机号登录按钮');
    const phoneLoginBtn = page.locator('button:has-text("手机号登录")').first();
    try {
      await phoneLoginBtn.waitFor({ state: 'visible', timeout: 10000 });
      await phoneLoginBtn.click({ force: true });
      await waitForPage(page);
      console.log('✅ 步骤 2：成功点击手机号登录按钮');
    } catch (error) {
      const screenshotPath = await saveScreenshotToTemp(page, 'test-failed-login-btn');
      console.error(`❌ "手机号登录"按钮失败，已保存截图: ${screenshotPath}`);
      throw new Error('登录按钮操作失败');
    }

    // 步骤 3：切换到"注册"标签
    console.log('⏳ 步骤 3：切换到注册表单');
    const registerTab = page.locator('.tab').filter({ hasText: '注册' });
    await registerTab.click({ force: true });
    await page.waitForTimeout(1000);

    // 验证注册表单已加载
    const registerText = await page.locator('body').textContent();
    expect(registerText).toContain('注册');
    expect(registerText).toContain('设置密码');
    console.log('✅ 步骤 3：成功切换到注册表单');

    // 步骤 4：输入手机号
    console.log('⏳ 步骤 4：输入手机号');
    const phoneInput = page.locator('input[type="number"]').first();
    await phoneInput.click({ force: true });
    await phoneInput.clear();
    await phoneInput.type(phoneNumber, { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 步骤 4：成功输入手机号');

    // 步骤 5：点击"获取验证码"按钮
    console.log('⏳ 步骤 5：发送验证码');
    const codeBtn = page.locator('.code-btn');
    await codeBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 验证验证码按钮进入倒计时状态
    const codeBtnText = await codeBtn.textContent();
    expect(codeBtnText).toMatch(/\d+s/); // 匹配类似 "60s" 的文本
    console.log('✅ 步骤 5：成功发送验证码');

    // 步骤 6：输入验证码
    console.log('⏳ 步骤 6：输入验证码');
    const codeInput = page.locator('input[type="number"]').nth(1); // 第二个数字输入框
    await codeInput.click({ force: true });
    await codeInput.clear();
    await codeInput.type(testCode, { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 步骤 6：成功输入验证码');

    // 步骤 7：输入密码
    console.log('⏳ 步骤 7：输入密码');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click({ force: true });
    await passwordInput.clear();
    await passwordInput.type(password, { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 步骤 7：成功输入密码');

    // 步骤 8：点击"注册"按钮
    console.log('⏳ 步骤 8：提交注册申请');
    const submitBtn = page.locator('uni-button.submit');
    await submitBtn.click({ force: true });
    console.log('✅ 步骤 8：提交注册申请');

    // 等待注册完成并跳转到首页
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // 验证注册结果
    const homePageText = await page.locator('body').textContent();

    // 检查是否仍在注册页面（说明注册失败）
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

    // 验证是否跳转到有效页面
    if (!isValidHomePage(homePageText)) {
      console.error('❌ 注册失败，未跳转到有效页面');
      console.error('页面内容:', homePageText.substring(0, 500));
      throw new Error('注册失败，未跳转到有效页面');
    }

    console.log('✅ 步骤 9：用户注册并登录成功');
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
