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
 * 改进: 使用文本选择器代替 data-testid，增加错误处理和日志
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
    await page.screenshot({ path: 'test-results/login-button-error.png' });
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
 *       增加更可靠的页面等待机制
 */
export async function registerAndLoginAsUser(page, options = {}) {
  const phoneNumber = options.phoneNumber || generate137PhoneNumber();
  const password = options.password || 'F1234567';
  const testCode = options.testCode || '123456';

  console.log(`开始注册并登录用户: ${phoneNumber}`);

  try {
    // 导航到登录页面
    console.log('  ⏳ 导航到登录页面...');
    await page.goto('/');

    // 等待网络空闲（使用更长的超时）
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      console.log('  ✅ 网络已空闲');
    } catch (error) {
      console.log('  ⚠️ 网络未在指定时间内达到空闲状态，继续执行...');
    }

    // 额外等待，确保 Vue 渲染完成
    await page.waitForTimeout(2000);

    // 验证登录页面包含"安全守护"文本
    const initialPageText = await page.locator('body').textContent();
    if (!initialPageText.includes('安全守护')) {
      throw new Error('登录页面未正确加载，未找到"安全守护"文本');
    }
    console.log('  ✅ 登录页面已加载');

    // 等待"手机号登录"按钮可见（使用更稳定的等待策略）
    console.log('  ⏳ 等待"手机号登录"按钮...');
    const phoneLoginBtn = page.locator('button:has-text("手机号登录")').first();

    try {
      await phoneLoginBtn.waitFor({ state: 'visible', timeout: 10000 });
      console.log('  ✅ "手机号登录"按钮已可见');
    } catch (error) {
      console.error('  ❌ "手机号登录"按钮未在指定时间内可见');
      const screenshotPath = `test-failed-login-btn-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      console.error(`已保存失败截图: ${screenshotPath}`);
      throw new Error('登录按钮超时未出现');
    }

    // 点击"手机号登录"按钮 - 使用文本选择器
    console.log('  👆 点击"手机号登录"按钮...');
    await phoneLoginBtn.click({ force: true });
    console.log('  ✅ 已点击"手机号登录"按钮');

    // 等待页面响应
    await waitForPage(page);

    // 切换到"注册"标签 - 使用文本选择器
    const registerTab = page.locator('text=注册').first();
    if (await registerTab.isVisible()) {
      await registerTab.click({ force: true });
    } else {
      // 尝试其他方式找到注册标签
      const allRegisterText = page.locator('text=注册');
      if (await allRegisterText.count() > 1) {
        await allRegisterText.nth(1).click({ force: true });
      }
    }
    await page.waitForTimeout(AUTH_TIMEOUTS.formSwitch);

    // 输入手机号 - 使用文本选择器
    const phoneInputs = page.locator('input[type="number"], input[type="tel"]');
    if (await phoneInputs.count() > 0) {
      await phoneInputs.first().click({ force: true });
      await phoneInputs.first().clear();
      await phoneInputs.first().type(phoneNumber, { delay: 100 });
      await page.waitForTimeout(500);
    }

    // 点击"获取验证码"按钮 - 使用文本选择器
    const codeBtn = page.locator('button:has-text("获取验证码")').first();
    if (await codeBtn.isVisible()) {
      await codeBtn.click({ force: true });
    }
    await page.waitForTimeout(2000);

    // 输入验证码 - 找到第二个输入框
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    if (inputCount >= 2) {
      await allInputs.nth(1).click({ force: true });
      await allInputs.nth(1).clear();
      await allInputs.nth(1).type(testCode, { delay: 100 });
      await page.waitForTimeout(500);
    }

    // 输入密码 - 使用文本选择器
    const passwordInputs = page.locator('input[type="password"]');
    if (await passwordInputs.count() > 0) {
      await passwordInputs.first().click({ force: true });
      await passwordInputs.first().clear();
      await passwordInputs.first().type(password, { delay: 100 });
      await page.waitForTimeout(500);
    }

    // 勾选用户协议 - 使用文本选择器
    const agreementCheckbox = page.locator('label:has-text("用户协议"), label:has-text("同意")');
    if (await agreementCheckbox.count() > 0) {
      await agreementCheckbox.first().click({ force: true });
    }
    await page.waitForTimeout(500);

    // 点击"注册"按钮 - 使用文本选择器
    const submitBtn = page.locator('button:has-text("注册")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click({ force: true });
    } else {
      // 尝试使用登录按钮
      const loginBtn = page.locator('button:has-text("登录")').first();
      if (await loginBtn.isVisible()) {
        await loginBtn.click({ force: true });
      }
    }

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
