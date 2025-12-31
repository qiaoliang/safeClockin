/**
 * 超级管理员登录 E2E 测试
 */
import { test, expect } from '@playwright/test';
import { 
  waitForLoginPage, 
  loginWithPhoneAndPassword, 
  verifyLoginSuccess,
  logout 
} from '../helpers/auth.js';
import { navigateToLoginPage } from '../helpers/navigation.js';
import { TEST_USERS, ENV_CONFIG } from '../fixtures/test-data.js';

test.describe('超级管理员登录测试', () => {
  const superAdmin = TEST_USERS.SUPER_ADMIN;

  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await navigateToLoginPage(page);
    
    // 等待登录页面加载
    await waitForLoginPage(page);
  });

  test('应该成功登录超级管理员账号', async ({ page }) => {
    console.log('开始测试：超级管理员登录');
    
    // 使用手机号和密码登录
    await loginWithPhoneAndPassword(page, superAdmin.phone, superAdmin.password);
    
    // 验证登录成功
    await verifyLoginSuccess(page);
    
    // 验证用户角色
    const userRole = await page.locator('[data-testid="user-role"]').textContent();
    expect(userRole).toContain('超级管理员');
    
    console.log('✅ 超级管理员登录成功');
  });

  test('应该显示正确的用户信息', async ({ page }) => {
    // 登录
    await loginWithPhoneAndPassword(page, superAdmin.phone, superAdmin.password);
    
    // 验证昵称
    const nickname = await page.locator('[data-testid="user-nickname"]').textContent();
    expect(nickname).toBe(superAdmin.nickname);
    
    // 验证手机号（可能部分隐藏）
    const phoneNumber = await page.locator('[data-testid="user-phone"]').textContent();
    expect(phoneNumber).toContain('139****');
  });

  test('应该能够登出', async ({ page }) => {
    // 登录
    await loginWithPhoneAndPassword(page, superAdmin.phone, superAdmin.password);
    
    // 登出
    await logout(page);
    
    // 验证返回到登录页
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('错误密码应该登录失败', async ({ page }) => {
    // 输入错误的密码
    await page.locator('input[type="tel"]').fill(superAdmin.phone);
    await page.locator('input[type="password"]').fill('WrongPassword123');
    
    // 点击登录按钮
    await page.locator('button:has-text("登录")').click();
    
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('密码不正确');
    
    // 验证仍在登录页
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('不存在的手机号应该登录失败', async ({ page }) => {
    // 输入不存在的手机号
    await page.locator('input[type="tel"]').fill('19999999999');
    await page.locator('input[type="password"]').fill(superAdmin.password);
    
    // 点击登录按钮
    await page.locator('button:has-text("登录")').click();
    
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('账号不存在');
  });

  test('空手机号应该显示验证错误', async ({ page }) => {
    // 不输入手机号，直接点击登录
    await page.locator('button:has-text("登录")').click();
    
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('手机号不能为空');
  });

  test('空密码应该显示验证错误', async ({ page }) => {
    // 只输入手机号，不输入密码
    await page.locator('input[type="tel"]').fill(superAdmin.phone);
    await page.locator('button:has-text("登录")').click();
    
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('密码不能为空');
  });

  test('登录后应该能够访问所有功能页面', async ({ page }) => {
    // 登录
    await loginWithPhoneAndPassword(page, superAdmin.phone, superAdmin.password);
    
    // 测试导航到社区管理页面
    await page.goto('/pages/community-manage/index.html');
    await expect(page.locator('[data-testid="community-list"]')).toBeVisible();
    
    // 测试导航到个人中心页面
    await page.goto('/pages/profile/index.html');
    await expect(page.locator('[data-testid="profile-info"]')).toBeVisible();
  });
});

test.describe('登录页面 UI 测试', () => {
  test('应该显示所有必要的表单元素', async ({ page }) => {
    await navigateToLoginPage(page);
    
    // 验证手机号输入框
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toHaveAttribute('placeholder', '请输入手机号');
    
    // 验证密码输入框
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveAttribute('placeholder', '请输入密码');
    
    // 验证登录按钮
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
    
    // 验证微信登录按钮
    await expect(page.locator('button:has-text("微信登录")')).toBeVisible();
  });

  test('应该显示应用标题', async ({ page }) => {
    await navigateToLoginPage(page);
    
    await expect(page.locator('h1:has-text("SafeGuard")')).toBeVisible();
  });
});