/**
 * 登录、退出与注册测试 - 使用 Page Object Model
 */
import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';
import { cleanupAuthState, logout } from '../helpers/auth.js';

test.describe('超级管理员登录与退出测试', () => {
  let welcomePage;
  let phoneLoginPage;
  let profilePage;
  const superAdmin = TEST_USERS.SUPER_ADMIN;

  test.beforeEach(async ({ page }) => {
    welcomePage = new WelcomePage(page);
    phoneLoginPage = new PhoneLoginPage(page);
    profilePage = new ProfilePage(page);
    await cleanupAuthState(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await welcomePage.expectOnWelcomePage();
  });

  test('超级管理员 登录 并 退出 成功。', async ({ page }) => {
    // 步骤 A: 超级管理员登录
    await welcomePage.clickPhoneLogin();
    await phoneLoginPage.loginWithPassword(superAdmin.phone, superAdmin.password);
    await profilePage.expectOnProfilePage();

    // 步骤 B: 超级管理员退出 - 使用 auth.js 中的 logout 函数
    await logout(page);

    // 步骤 C: 验证退出成功，返回到欢迎页面
    await welcomePage.expectOnWelcomePage();
  });

  test('应该能够点击手机号登录按钮', async ({ page }) => {
    await welcomePage.clickPhoneLogin();
    // 验证手机号登录页面加载完成，检查是否有登录相关元素
    const pageText = await phoneLoginPage.getPageText();
    expect(pageText).toContain('登录');
  });

  test('应该能够在标签页之间切换', async ({ page }) => {
    await welcomePage.clickPhoneLogin();
    // 切换到注册标签
    await phoneLoginPage.switchToRegisterTab();
    // 验证注册标签页内容
    const pageText = await phoneLoginPage.getPageText();
    expect(pageText).toContain('注册');
  });
});

test.describe('普通用户注册，登录与退出测试', () => {
  let welcomePage;
  let phoneLoginPage;
  let profilePage;

  test.beforeEach(async ({ page }) => {
    welcomePage = new WelcomePage(page);
    phoneLoginPage = new PhoneLoginPage(page);
    profilePage = new ProfilePage(page);
    await cleanupAuthState(page);
  });

  test('普通用户注册，登录与退出测试', async ({ page }) => {
    // 生成随机手机号用于测试
    const timestamp = Date.now();
    const testPhone = `181${(timestamp % 100000000).toString().padStart(8, '0')}`;
    const testPassword = 'F1234567';

    // 步骤 1: 导航到欢迎页
    await welcomePage.navigate();
    await welcomePage.expectOnWelcomePage();

    // 步骤 2: 点击手机号登录按钮
    await welcomePage.clickPhoneLogin();

    // 步骤 3: 切换到注册标签
    await phoneLoginPage.switchToRegisterTab();
    const pageText = await phoneLoginPage.getPageText();
    expect(pageText).toContain('注册');
    expect(pageText).toContain('设置密码');

    // 步骤 4: 填写手机号
    await phoneLoginPage.fillPhone(testPhone);

    // 步骤 5: 获取验证码
    await phoneLoginPage.clickGetCode();

    // 步骤 6: 填写验证码
    await phoneLoginPage.fillCode('123456');

    // 步骤 7: 填写密码
    await phoneLoginPage.fillPassword(testPassword);

    // 步骤 8: 点击提交按钮注册
    await phoneLoginPage.clickSubmit();

    // 等待注册完成
    await page.waitForTimeout(3000);

    // 步骤 9: 验证登录成功（跳转到首页）
    const afterRegisterText = await page.locator('body').textContent();
    const hasHomeContent = afterRegisterText.includes('打卡') || afterRegisterText.includes('社区') || afterRegisterText.includes('我的');
    expect(hasHomeContent).toBe(true);

    // 步骤 10: 退出登录 - 使用 auth.js 中的 logout 函数
    await logout(page);

    // 步骤 11: 验证退出成功，返回到欢迎页面
    await welcomePage.expectOnWelcomePage();
  });
});
