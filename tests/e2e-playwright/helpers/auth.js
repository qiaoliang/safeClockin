/**
 * 认证相关的测试辅助函数
 */
import { expect } from '@playwright/test';

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