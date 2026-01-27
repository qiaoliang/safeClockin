/**
 * 超级管理员登录 E2E 测试
 */
import { test, expect } from '@playwright/test';
import {
  waitForLoginPage,
  switchToPasswordLoginTab
} from '../helpers/auth.js';
import { navigateToPhoneLoginPage } from '../helpers/navigation.js';
import { TEST_USERS, ENV_CONFIG } from '../fixtures/test-data.mjs';
import {registerAndLoginAsUser,logout,loginAsSuperAdmin} from '../helpers/auth.js'

test.describe('超级管理员登录与退出测试', () => {
  const superAdmin = TEST_USERS.SUPER_ADMIN;

  test.beforeEach(async ({ page }) => {
    // 导航到根路径（登录页面是默认页面）
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待登录页面加载
    await waitForLoginPage(page);
  });

  test('超级管理员 登录 并 退出 成功。', async ({ page }) => {
    // 使用文本内容验证页面元素
    await loginAsSuperAdmin(page);
    console.log('✅ 步骤A: 超级管理员登录 验证通过');
    await logout(page);
    console.log('✅ 步骤B: 超级管理员 退出 验证通过');

  });

  test('应该能够点击手机号登录按钮', async ({ page }) => {
    // 点击"手机号登录"按钮（使用 force: true 强制点击）
    await page.locator('text=手机号登录').click({ force: true });

    // 等待手机号输入框出现（使用文本内容验证）
    await page.waitForTimeout(1000); // 短暂等待让页面更新

    // 验证页面内容包含手机号登录表单
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('请输入手机号');
  });

  test('应该能够在标签页之间切换', async ({ page }) => {
    // 点击手机号登录按钮（使用 force: true 强制点击）
    await page.locator('text=手机号登录').click({ force: true });

    // 等待页面更新
    await page.waitForTimeout(1000);

    // 验证默认标签页
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('验证码登录');

    // 切换到"注册"标签（使用 exact 匹配避免选择页面标题）
    await page.getByText('注册', { exact: true }).click({ force: true });
    await page.waitForTimeout(500);

    // 切换到"密码登录"标签（使用 exact 匹配）
    await page.getByText('密码登录', { exact: true }).click({ force: true });
    await page.waitForTimeout(500);

    // 切换回"验证码登录"标签（使用 exact 匹配）
    await page.getByText('验证码登录', { exact: true }).click({ force: true });
    await page.waitForTimeout(500);

    console.log('✅ 标签页切换成功');
  });
});

test.describe('普通用户注册，登录与退出测试', () => {
  test('普通用户注册，登录与退出测试', async ({ page }) => {
    const regularUser = await registerAndLoginAsUser(page);
    console.log(`普通用户已创建并登录: ${regularUser.phone}`);
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    await logout(page);
  });
});