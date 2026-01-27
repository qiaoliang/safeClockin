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
 * 清理认证状态（localStorage + sessionStorage + cookies）
 * 改进: 添加错误处理，支持页面未完全加载的情况
 */
export async function cleanupAuthState(page) {
  console.log('  🧹 清理认证状态...');

  try {
    // 先检查页面是否已加载到有效状态
    const url = page.url();
    if (!url || url === 'about:blank' || !url.includes('localhost')) {
      console.log('  ⚠️ 页面未就绪，跳过 storage 清理');
      // 仍然清理 cookies
      const context = page.context();
      await context.clearCookies();
      console.log('  ✅ 已清理 cookies');
      return;
    }

    // 清理 localStorage 和 sessionStorage
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('  ⚠️ localStorage 访问失败:', e.message);
      }
    });

    // 清理 cookies
    const context = page.context();
    await context.clearCookies();

    await page.waitForTimeout(500);
    console.log('  ✅ 认证状态已清理');
  } catch (error) {
    console.log('  ⚠️ 清理认证状态时出错:', error.message);
    // 不抛出错误，让测试继续执行
  }
}

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

  // 先向下滚动到页面底部，确保底部导航栏可见
  console.log('  📜 向下滚动到页面底部...');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // 等待滚动完成并检查页面高度
  await page.waitForTimeout(1000);
  const windowHeight = await page.evaluate(() => window.innerHeight);
  const documentHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollTop = await page.evaluate(() => window.pageYOffset || document.documentElement.scrollTop);
  console.log(`  📏 窗口高度: ${windowHeight}px, 文档高度: ${documentHeight}px, 滚动位置: ${scrollTop}px`);

  // 尝试多种选择器来找到"我的"标签
  const profileTab = page.locator('.tabbar-item').filter({ hasText: '我的' }).or(
    page.locator('.uni-tabbar__item').filter({ hasText: '我的' })
  ).or(
    page.locator('text=我的')
  ).or(
    page.locator('.tabbar-item:last-child')
  );

  // 等待导航栏元素存在且可见
  console.log('  🔍 等待"我的"tab出现且可见...');
  await profileTab.first().waitFor({ state: 'attached', timeout: 10000 });

  // 检查元素是否在视口内可见
  const isVisible = await profileTab.first().isVisible();
  console.log(`  👁️ 导航栏元素是否可见: ${isVisible}`);

  // 如果不可见，再次滚动到底部
  if (!isVisible) {
    console.log('  ⚠️ 导航栏不可见，再次滚动到底部...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
  }

  // 再次检查可见性
  const isVisibleAfterScroll = await profileTab.first().isVisible();
  console.log(`  👁️ 第二次检查可见性: ${isVisibleAfterScroll}`);

  if (!isVisibleAfterScroll) {
    // 尝试点击最后一个tabbar-item
    console.log('  ⚠️ 仍不可见，尝试直接点击最后一个tab');
    await profileTab.first().click({ force: true });
  } else {
    await profileTab.first().click();
  }

  await page.waitForTimeout(1500);
  console.log('  ✅ 已点击"我的"tab');

  // 步骤 2: 下拉窗口以显示退出登录按钮
  console.log('\n2️⃣ 下拉窗口...');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);
  console.log('  ✅ 已下拉窗口');

  // 步骤 3: 找到并点击"退出登录"按钮
  console.log('\n3️⃣ 点击"退出登录"按钮...');
  // 使用文本选择器
  const logoutBtn = page.locator('text=退出登录').or(
    page.locator('[data-testid="logout-button"]')
  );

  // 等待按钮可见
  await logoutBtn.waitFor({ state: 'visible', timeout: 5000 });
  await logoutBtn.first().click({ force: true });
  await page.waitForTimeout(1000); // 增加等待时间
  console.log('  ✅ 已点击"退出登录"按钮');

  // 步骤 4: 在弹出的对话框中点击"确定"按钮
  console.log('\n4️⃣ 在确认对话框中点击"确定"...');

  // 等待 uni-modal 对话框出现
  console.log('  ⏳ 等待对话框出现...');
  await expect(page.locator('.uni-modal').first()).toBeVisible({ timeout: 5000 });

  // 验证对话框内容
  const modalContent = await page.locator('.uni-modal__bd').first().textContent();
  console.log(`  📝 对话框内容: ${modalContent}`);
  expect(modalContent).toContain('确定要退出登录吗？');

  // 定位确定按钮 - 使用 CSS 类 .uni-modal__btn_primary
  const confirmBtn = page.locator('.uni-modal__btn_primary').first();

  // 检查确定按钮是否可见
  const isConfirmBtnVisible = await confirmBtn.isVisible();
  console.log(`  🔍 确定按钮是否可见: ${isConfirmBtnVisible}`);

  if (isConfirmBtnVisible) {
    // 获取按钮文本
    const btnText = await confirmBtn.textContent();
    console.log(`  📝 确定按钮文本: ${btnText}`);

    await confirmBtn.click({ force: true });
    console.log('  ✅ 已点击"确定"按钮');
  } else {
    console.log('  ⚠️ 确定按钮不可见');
    throw new Error('确定按钮不可见，无法完成退出登录');
  }

  // 等待URL变化 - 这是关键！
  console.log('  ⏳ 等待页面跳转...');
  try {
    await page.waitForURL(/login/i, { timeout: 8000 });
    console.log('  ✅ URL已变化');
  } catch (error) {
    console.log('  ⚠️ URL未在预期时间内变化，继续执行...');
  }

  // 等待网络稳定
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (error) {
    console.log('  ⚠️ 网络未能在指定时间内达到空闲状态，继续执行...');
  }

  // 额外等待确保页面完全加载
  await page.waitForTimeout(2000);

  // 检查是否出现"用户登录已过期"的提示框
  console.log('\n  📋 检查是否出现"用户登录已过期"提示框...');
  const expiredModalVisible = await page.locator('.uni-modal').isVisible();

  if (expiredModalVisible) {
    const expiredModalContent = await page.locator('.uni-modal__bd').first().textContent();
    console.log(`  📝 提示框内容: ${expiredModalContent}`);

    if (expiredModalContent.includes('用户登录已过期') || expiredModalContent.includes('请重新登录')) {
      console.log('  ✅ 检测到"用户登录已过期"提示框，点击确定按钮');
      const expiredConfirmBtn = page.locator('.uni-modal__btn_primary').first();
      await expiredConfirmBtn.click({ force: true });
      await page.waitForTimeout(1000);
      console.log('  ✅ 已点击"确定"按钮');
    }
  } else {
    console.log('  ℹ️ 未检测到"用户登录已过期"提示框');
  }

  // 步骤 5: 等待跳转并验证已返回到登录首页
  console.log('\n5️⃣ 验证返回到登录首页...');

  // 检查 URL 是否变化
  const currentUrl = page.url();
  console.log('  📍 当前 URL:', currentUrl);

  // 如果URL没有变化，额外等待
  if (!currentUrl.includes('login')) {
    console.log('  ⚠️ URL未包含login，额外等待...');
    await page.waitForTimeout(5000);

    // 再次检查URL
    const newUrl = page.url();
    console.log('  📍 重新检查 URL:', newUrl);
  }

  // 验证登录页面关键元素
  const pageText = await page.locator('body').textContent();
  console.log('  📄 当前页面内容长度:', pageText.length);
  console.log('  📄 当前页面内容预览:', pageText.substring(0, 200));

  // 检查是否包含登录页面的关键文本
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

  // 打印当前页面URL和内容，帮助调试
  console.log('  📍 当前URL:', page.url());

  // 点击"手机号登录"按钮 - 使用文本选择器
  await expect(page.locator('text=手机号登录').first()).toBeVisible({ timeout: 15000 });
  await page.locator('text=手机号登录').first().click({ force: true });
  console.log('  ✅ 已点击"手机号登录"按钮');

  // 等待密码登录标签可见 - 使用 data-testid
  await expect(page.locator('[data-testid="tab-password-login"]').first()).toBeVisible({ timeout: 15000 });
  await waitForPage(page);

  // 切换到"密码登录" - 使用 data-testid
  const passwordTab = page.locator('[data-testid="tab-password-login"]').first();
  if (await passwordTab.isVisible()) {
    await passwordTab.click({ force: true });
    await page.waitForTimeout(1000); // 增加等待时间，确保切换完成
    console.log('  ✅ 已切换到密码登录标签');
  } else {
    console.log('  ⚠️ 密码登录标签不可见，尝试直接登录');
  }

  // 等待密码输入框可见
  await expect(page.locator('[data-testid="password-input"]').first()).toBeVisible({ timeout: 10000 });

  // 检查密码输入框是否真的可见
  const passwordInputVisible = await page.locator('[data-testid="password-input"]').first().isVisible();
  console.log('  🔍 密码输入框可见性:', passwordInputVisible);

  // 输入手机号和密码 - 使用 data-testid 定位
  console.log('  📝 输入手机号:', superAdmin.phone);
  const phoneInput = page.locator('[data-testid="phone-input"]').first().locator('input[type="number"]');
  await phoneInput.fill(superAdmin.phone);

  console.log('  📝 输入密码');
  const passwordInput = page.locator('[data-testid="password-input"]').first().locator('input[type="password"]');
  await passwordInput.fill(superAdmin.password);

  // 点击登录按钮 - 使用 data-testid
  const loginBtn = page.locator('[data-testid="login-submit-button"]').first();
  await loginBtn.click({ force: true });
  console.log('  ✅ 已点击登录按钮');

  // 等待登录完成
  await page.waitForTimeout(AUTH_TIMEOUTS.loginWait);
  console.log('  ⏳ 等待网络空闲...');
  await page.waitForLoadState('networkidle');

  // 验证登录成功
  const pageText = await page.locator('body').textContent();
  console.log('  📄 页面内容长度:', pageText.length);
  console.log('  📄 当前URL:', page.url());

  // 检查页面是否包含"我的"
  const hasMyPage = pageText.includes('我的');
  console.log('  🔍 页面是否包含"我的":', hasMyPage);

  if (!hasMyPage) {
    // 如果登录失败，打印页面内容并保存截图
    console.error('  ❌ 登录可能失败，页面内容:');
    console.error('  ', pageText.substring(0, 500));

    const screenshotPath = `${TEMP_DIR}/login-failed-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`  已保存失败截图: ${screenshotPath}`);
  }

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
    const phoneLoginBtn = page.locator('text=手机号登录').first();
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

    // 步骤 7.5：勾选用户协议
    console.log('⏳ 步骤 7.5：勾选用户协议');
    // 尝试点击协议文本区域来勾选协议
    const agreementText = page.locator('text=用户协议').or(
      page.locator('text=隐私政策')
    );
    if (await agreementText.count() > 0) {
      await agreementText.first().click({ force: true });
      await page.waitForTimeout(500);
      console.log('✅ 步骤 7.5：已勾选用户协议');
    } else {
      console.log('⚠️ 步骤 7.5：未找到协议文本，尝试其他方式');
      // 尝试点击复选框
      const checkbox = page.locator('.agree-checkbox, .uni-checkbox, [type="checkbox"]');
      if (await checkbox.count() > 0) {
        await checkbox.first().click({ force: true });
        await page.waitForTimeout(500);
        console.log('✅ 步骤 7.5：已勾选用户协议（通过复选框）');
      }
    }

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
