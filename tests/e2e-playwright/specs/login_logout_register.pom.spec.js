/**
 * 登录、退出与注册测试 - 使用 Page Object Model
 */
import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { ProfilePage } from '../pages/profile-page.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';
import { cleanupAuthState } from '../helpers/auth.js';

test.describe('超级管理员登录与退出测试', () => {
  let loginPage;
  let profilePage;
  let welcomePage;
  const superAdmin = TEST_USERS.SUPER_ADMIN;

  test.beforeEach(async ({ page }) => {
    loginPage = new WelcomePage(page);
    profilePage = new ProfilePage(page);
    welcomePage = new WelcomePage(page);
    await cleanupAuthState(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await loginPage.expectOnLoginPage();
  });

  test('超级管理员 登录 并 退出 成功。', async ({ page }) => {
    // 步骤 A: 超级管理员登录
    await loginPage.loginAsSuperAdmin(superAdmin.phone, superAdmin.password);
    await profilePage.expectOnProfilePage();

    // 步骤 B: 超级管理员退出
    await profilePage.logout();

    // 步骤 C: 验证退出成功，返回到欢迎页面
    await welcomePage.expectOnWelcomePage();
  });

  test('应该能够点击手机号登录按钮', async ({ page }) => {
    await loginPage.expectPhoneLoginFormVisible();
    await loginPage.expectPhoneInputVisible();
  });

  test('应该能够在标签页之间切换', async ({ page }) => {
    await loginPage.clickPhoneLogin();
    await loginPage.expectTabSwitchable();
  });
});

test.describe('普通用户注册，登录与退出测试', () => {
  let loginPage;
  let profilePage;
  let welcomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new WelcomePage(page);
    profilePage = new ProfilePage(page);
    welcomePage = new WelcomePage(page);
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
    await loginPage.expectPhoneInputVisible();

    // 步骤 3: 切换到注册标签
    await loginPage.switchToTab('register');
    const pageText = await loginPage.getPageText();
    expect(pageText).toContain('注册');
    expect(pageText).toContain('设置密码');

    // 步骤 4: 填写手机号
    await loginPage.fillPhone(testPhone);

    // 步骤 5: 获取验证码
    await loginPage.clickGetCode();
    const codeBtnText = await loginPage.getCodeButtonText();
    expect(codeBtnText).toMatch(/\d+s/);

    // 步骤 6: 填写验证码
    await loginPage.fillVerificationCode('123456');

    // 步骤 7: 填写密码
    await loginPage.fillPassword(testPassword);

    // 步骤 8: 点击登录按钮提交注册
    await loginPage.clickLogin();

    // 步骤 9: 验证登录成功（普通用户在打卡页面）
    await loginPage.loginAsNormalUser(testPhone, '123456');

    // 步骤 10: 点击"我的"标签
    await profilePage.navigate();

    // 步骤 11: 退出登录
    await profilePage.logout();

    // 步骤 12: 验证退出成功，返回到欢迎页面
    await welcomePage.expectOnWelcomePage();
  });
});
