/**
 * 认证相关的测试辅助函数
 */
import { expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data.mjs';

/**
 * 等待登录页面加载
 */
export async function waitForLoginPage(page) {
  // 等待页面加载完成
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 使用文本内容来验证页面加载
  const pageText = await page.locator('body').textContent();
  expect(pageText).toContain('安全守护');
  expect(pageText).toContain('微信快捷登录');
  expect(pageText).toContain('手机号登录');
}

/**
 * 切换到密码登录标签页
 */
export async function switchToPasswordLoginTab(page) {
  // 点击"密码登录"标签
  await page.locator('text=密码登录').click();
  
  // 等待标签切换和表单更新
  await page.waitForTimeout(1000);
  
  // 验证密码输入框可见
  const pageText = await page.locator('body').textContent();
  if (!pageText.includes('输入密码')) {
    throw new Error('未找到密码输入框');
  }
}

/**
 * 使用手机号和密码登录
 */
export async function loginWithPhoneAndPassword(page, phone, password) {
  // 等待页面完全加载
  await page.waitForTimeout(1000);
  
  // 输入手机号（input type="number"）
  const phoneInput = page.locator('input[type="number"]').first();
  await phoneInput.fill(phone);
  await page.waitForTimeout(500);
  
  // 输入密码
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  await page.waitForTimeout(500);
  
  // 点击登录按钮
  await page.locator('text=密码登录').click();
  
  // 等待登录完成（跳转到首页）
  // 由于是 SPA，可能需要等待一段时间
  await page.waitForTimeout(5000);
  
  // 验证是否跳转到首页（检查页面内容）
  const pageText = await page.locator('body').textContent();
  const hasHomePage = pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的');
  
  if (!hasHomePage) {
    console.log('当前页面内容:', pageText.substring(0, 200));
    throw new Error('登录失败，未跳转到首页');
  }
}

/**
 * 使用微信登录
 */
export async function loginWithWeChat(page, code) {
  // 点击微信登录按钮
  await page.locator('button:has-text("微信登录")').click();
  
  // 模拟微信登录（实际测试中可能需要 mock）
  // 这里只是示例，实际实现可能需要根据具体页面调整
  await page.evaluate((code) => {
    // 模拟微信登录逻辑
    window.mockWeChatLogin = true;
  }, code);
}

/**
 * 验证登录成功
 */
export async function verifyLoginSuccess(page) {
  // 等待页面加载
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 检查页面内容（使用实际的页面元素）
  const pageText = await page.locator('body').textContent();
  
  // 验证是否包含首页元素
  const hasHomePageElements = 
    pageText.includes('打卡') || 
    pageText.includes('社区') || 
    pageText.includes('我的');
  
  if (!hasHomePageElements) {
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
 * 封装超级管理员登录的完整流程
 * 
 * @param {Page} page - Playwright Page 对象
 * @param {Object} superAdmin - 超级管理员凭据（可选，如果不提供则使用默认值）
 * @returns {Promise<void>}
 */
export async function loginAsSuperAdmin(page, superAdmin = null) {
  // 如果没有提供超级管理员凭据，使用默认值
  if (!superAdmin) {
    superAdmin = TEST_USERS.SUPER_ADMIN;
  }
  
  // 先清除可能的登录状态，导航到根路径
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // 等待应用完全初始化
  
  // 检查当前页面是否在首页（已登录状态），如果是则尝试登出
  const pageText = await page.locator('body').textContent();
  if (pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的')) {
    console.log('检测到已登录状态，尝试登出...');
    
    // 点击"我的"标签进入个人中心
    const profileTab = page.locator('.tabbar-item').filter({ hasText: '我的' }).first();
    await profileTab.click({ force: true });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 查找并点击登出按钮
    const profilePageText = await page.locator('body').textContent();
    if (profilePageText.includes('登出') || profilePageText.includes('退出登录')) {
      const logoutButton = page.locator('text=登出').or(page.locator('text=退出登录')).first();
      await logoutButton.click({ force: true });
      await page.waitForTimeout(2000);
    }
    
    // 重新导航到根路径
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }
  
  // 等待登录页面加载
  await waitForLoginPage(page);
  
  // 点击"手机号登录"按钮
  await page.locator('text=手机号登录').click({ force: true });
  await page.waitForTimeout(2000);
  
  // 切换到"密码登录"标签页
  await switchToPasswordLoginTab(page);
  
  // 输入手机号和密码
  await page.locator('input[type="number"]').fill(superAdmin.phone);
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').fill(superAdmin.password);
  await page.waitForTimeout(500);
  
  // 点击登录按钮（使用 uni-button 选择器）
  await page.locator('uni-button.submit').click({ force: true });
  
  // 等待登录完成（超级管理员应该自动导航到"我的"页面）
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');
  
  // 验证登录成功
  const loginPageText = await page.locator('body').textContent();
  expect(loginPageText).toContain('我的');
  
  console.log('✅ 超级管理员登录成功');
}

/**
 * 生成 137 开头的随机 11 位电话号码
 * 
 * @returns {string} 随机生成的手机号
 */
function generate137PhoneNumber() {
  // 支持的手机号前缀
  const prefixes = ['181', '137', '182', '152', '192', '132', '131', '155', '128', '139'];
  
  // 随机选择一个前缀
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // 使用时间戳 + 随机数确保唯一性
  // 时间戳（毫秒）确保不同时间生成的号码不同
  // 随机数作为额外保护，避免同一毫秒内的冲突
  const timestamp = Date.now(); // 毫秒级时间戳
  const random = Math.floor(Math.random() * 1000); // 0-999
  
  // 组合时间戳和随机数，取后8位
  const combined = (timestamp + random) % 100000000;
  const suffix = combined.toString().padStart(8, '0');
  
  return `${prefix}${suffix}`;
}

/**
 * 注册新用户并登录（快捷方法）
 * 封装注册新用户并完成登录的完整流程
 * 
 * @param {Page} page - Playwright Page 对象
 * @param {Object} options - 可选参数
 * @param {string} options.phoneNumber - 手机号（如果不提供则生成 137 开头的随机手机号）
 * @param {string} options.password - 密码（默认为 'F1234567'）
 * @param {string} options.testCode - 验证码（默认为 '123456'）
 * @returns {Promise<Object>} 返回用户信息 { phone, password }
 */
export async function registerAndLoginAsUser(page, options = {}) {
  const phoneNumber = options.phoneNumber || generate137PhoneNumber();
  const password = options.password || 'F1234567';
  const testCode = options.testCode || '123456';

  console.log(`开始注册并登录用户: ${phoneNumber}`);

  try {
    // 步骤 1：导航到登录页面
    console.log('步骤1: 导航到登录页面');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 步骤 2：点击"手机号登录"按钮
    console.log('步骤2: 点击"手机号登录"按钮');
    await page.locator('text=手机号登录').click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 3：切换到"注册"标签
    console.log('步骤3: 切换到"注册"标签');
    await page.locator('.tab').filter({ hasText: '注册' }).click({ force: true });
    await page.waitForTimeout(1000);

    // 步骤 4：输入手机号
    console.log('步骤4: 输入手机号');
    const phoneInput = page.locator('input[type="number"]').first();
    await phoneInput.click({ force: true });
    await phoneInput.clear();
    await phoneInput.type(phoneNumber, { delay: 100 });
    await page.waitForTimeout(500);

    // 步骤 5：点击"获取验证码"按钮
    console.log('步骤5: 点击"获取验证码"按钮');
    const codeBtn = page.locator('.code-btn');
    await codeBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 6：输入验证码
    console.log('步骤6: 输入验证码');
    const codeInput = page.locator('input[type="number"]').nth(1);
    await codeInput.click({ force: true });
    await codeInput.clear();
    await codeInput.type(testCode, { delay: 100 });
    await page.waitForTimeout(500);

    // 步骤 7：输入密码
    console.log('步骤7: 输入密码');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click({ force: true });
    await passwordInput.clear();
    await passwordInput.type(password, { delay: 100 });
    await page.waitForTimeout(500);

    // 步骤 8：勾选用户协议
    console.log('步骤8: 勾选用户协议');
    await page.locator('.agree-label').click({ force: true });
    await page.waitForTimeout(500);

    // 步骤 9：点击"注册"按钮
    console.log('步骤9: 点击"注册"按钮');
    const submitBtn = page.locator('uni-button.submit');
    await submitBtn.click({ force: true });

    // 步骤 10：等待注册完成并跳转到首页
    console.log('步骤10: 等待注册完成并跳转到首页');
    
    // 等待页面响应
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // 检查是否有错误提示
    const pageText = await page.locator('body').textContent();
    
    // 检查是否仍在注册页面（说明注册失败）
    if (pageText.includes('手机号注册/登录') || pageText.includes('注册')) {
      console.error('❌ 注册失败，仍在注册页面');
      console.error('页面内容:', pageText.substring(0, 500));
      
      // 检查是否有错误提示
      const errorPatterns = [
        /验证码错误/i,
        /验证码无效/i,
        /手机号已注册/i,
        /密码强度/i,
        /格式错误/i,
        /失败/i
      ];
      
      for (const pattern of errorPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          throw new Error(`注册失败: ${match[0]}`);
        }
      }
      
      throw new Error('注册失败，未知原因');
    }

    // 验证是否跳转到"打卡"首页或其他有效页面
    console.log('步骤11: 验证是否跳转到首页');
    const homePageText = await page.locator('body').textContent();
    
    // 检查是否跳转到任何有效页面（打卡、社区、我的）
    const validPages = ['打卡', '社区', '我的'];
    const hasValidPage = validPages.some(pageName => homePageText.includes(pageName));
    
    if (!hasValidPage) {
      console.error('❌ 注册失败，未跳转到有效页面');
      console.error('页面内容:', homePageText.substring(0, 500));
      throw new Error('注册失败，未跳转到有效页面');
    }

    console.log('✅ 用户注册并登录成功');

    return { phone: phoneNumber, password };
  } catch (error) {
    console.error('❌ 注册并登录失败:', error.message);
    
    // 捕获页面截图以便调试
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
