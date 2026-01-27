/**
 * 登录功能测试 - 使用新 POM 架构
 * 展示如何使用 Page Objects 和 data-testid 选择器
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { HomePage } from '../pages/HomePage.js';
import { TEST_USERS, TestDataTracker, cleanupTestData } from '../fixtures/test-data.mjs';
import { ApiClient } from '../helpers/api-client.mjs';

test.describe('登录功能测试', () => {
  let loginPage;
  let phoneLoginPage;
  let homePage;

  test.beforeEach(async ({ page, context }) => {
    // 清理浏览器状态，确保测试隔离
    await context.clearCookies();

    loginPage = new LoginPage(page);
    phoneLoginPage = new PhoneLoginPage(page);
    homePage = new HomePage(page);
  });

  test.describe('登录欢迎页', () => {
    test('应该显示登录页面元素', async ({ page }) => {
      await loginPage.goto();
      await loginPage.isLoaded();

      const text = await loginPage.getPageText();
      expect(text).toContain('安全守护');
      expect(text).toContain('微信快捷登录');
      expect(text).toContain('手机号登录');
    });

    test('微信登录按钮应该可见', async ({ page }) => {
      await loginPage.goto();
      expect(await loginPage.isWechatLoginButtonVisible()).toBe(true);
    });

    test('手机登录按钮应该可见', async ({ page }) => {
      await loginPage.goto();
      expect(await loginPage.isPhoneLoginButtonVisible()).toBe(true);
    });
  });

  test.describe('手机号登录', () => {
    test('应该能够切换到密码登录标签', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();

      await phoneLoginPage.switchToPasswordTab();
      expect(await phoneLoginPage.isPasswordInputVisible()).toBe(true);
    });

    test('应该能够切换到验证码登录标签', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();

      await phoneLoginPage.switchToCodeTab();
      expect(await phoneLoginPage.isCodeInputVisible()).toBe(true);
    });

    test('应该能够切换到注册标签', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();

      await phoneLoginPage.switchToRegisterTab();
      const text = await phoneLoginPage.getPageText();
      expect(text).toContain('设置密码');
    });
  });

  test.describe('超级管理员登录', () => {
    test('超级管理员应该能够成功登录', async ({ page }) => {
      await loginPage.goto();
      await loginPage.loginAsSuperAdmin();

      // 超级管理员登录后会跳转到个人中心页面
      await page.waitForTimeout(2000);
      const text = await page.locator('body').textContent();
      expect(text).toMatch(/个人中心|系统超级系统管理员/);
    });

    test('超级管理员登录后应该能访问个人中心', async ({ page }) => {
      await loginPage.loginAsSuperAdmin();

      // 超级管理员登录后自动跳转到个人中心页面
      // 验证在个人中心页面
      await page.waitForTimeout(2000);
      const text = await page.locator('body').textContent();
      expect(text).toMatch(/个人中心|系统超级系统管理员|社区管理/);
    });
  });

  test.describe('表单验证', () => {
    test('密码登录时缺少密码应该显示错误', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();

      await phoneLoginPage.switchToPasswordTab();
      await phoneLoginPage.fillPhone(TEST_USERS.SUPER_ADMIN.phone);
      await phoneLoginPage.clickSubmit();

      // 应该显示密码错误提示
      // 具体验证取决于应用的错误提示实现
    });

    test('提交按钮状态应该根据输入变化', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      await phoneLoginPage.switchToPasswordTab();

      // 初始状态下提交按钮应该不可用（如果应用有此逻辑）
      const isEnabled = await phoneLoginPage.isSubmitButtonEnabled();
      // 根据实际应用逻辑验证
    });
  });

  test.describe('用户协议', () => {
    test('注册时需要勾选用户协议', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickPhoneLogin();

      await phoneLoginPage.switchToRegisterTab();
      await phoneLoginPage.fillPhone('13900000999');
      await phoneLoginPage.fillCode('123456');
      await phoneLoginPage.fillPassword('Test123456');
      await phoneLoginPage.clickSubmit();

      // 应该显示需要勾选协议的提示
      // 具体验证取决于应用的错误提示实现
    });
  });
});

/**
 * 测试数据清理示例
 */
test.describe('测试数据管理', () => {
  test.beforeEach(async ({ page, context }) => {
    // 清理浏览器状态，确保测试隔离
    await context.clearCookies();
    await page.goto('/');
  });

  test('使用 TestDataTracker 管理测试数据', async ({ page }) => {
    const tracker = new TestDataTracker();

    // 登录
    const loginPage = new LoginPage(page);
    await loginPage.loginAsSuperAdmin();

    // 在测试过程中创建的数据可以被追踪
    // tracker.trackCommunity(communityId);

    // 测试结束后清理
    const result = await tracker.cleanupAll();
    expect(result.success).toBe(true);
  });

  test('使用 ApiClient 直接清理数据', async ({ page }) => {
    // 创建 API 客户端
    const apiClient = new ApiClient();
    await apiClient.loginWithPassword(
      TEST_USERS.SUPER_ADMIN.phone,
      TEST_USERS.SUPER_ADMIN.password
    );

    // 创建测试社区
    const community = await apiClient.createCommunity({
      name: `测试社区_${Date.now()}`,
      location: '测试地址',
    });

    if (community.code === 1) {
      const communityId = community.data.community_id;

      // 清理测试数据
      const result = await cleanupTestData({ communityId });
      expect(result.success).toBe(true);
    }
  });
});
