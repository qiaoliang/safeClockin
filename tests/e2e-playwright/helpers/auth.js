/**
 * 认证相关的测试辅助函数
 */
import { expect } from '@playwright/test';

/**
 * 等待登录页面加载
 */
export async function waitForLoginPage(page) {
  await expect(page.locator('input[type="tel"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
}

/**
 * 使用手机号和密码登录
 */
export async function loginWithPhoneAndPassword(page, phone, password) {
  // 输入手机号
  await page.locator('input[type="tel"]').fill(phone);
  
  // 输入密码
  await page.locator('input[type="password"]').fill(password);
  
  // 点击登录按钮
  await page.locator('button:has-text("登录")').click();
  
  // 等待登录完成（跳转到首页）
  await page.waitForURL('**/pages/home-*/**', { timeout: 10000 });
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
  // 检查是否跳转到首页
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/pages\/home-.*\/index\.html/);
  
  // 检查是否显示用户信息
  await expect(page.locator('[data-testid="user-nickname"]')).toBeVisible();
}

/**
 * 登出
 */
export async function logout(page) {
  // 点击用户头像
  await page.locator('[data-testid="user-avatar"]').click();
  
  // 点击登出按钮
  await page.locator('button:has-text("登出")').click();
  
  // 确认登出
  await page.locator('button:has-text("确认")').click();
  
  // 等待返回登录页
  await expect(page.locator('input[type="tel"]')).toBeVisible();
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUserInfo(page) {
  const nickname = await page.locator('[data-testid="user-nickname"]').textContent();
  const role = await page.locator('[data-testid="user-role"]').textContent();
  
  return { nickname, role };
}