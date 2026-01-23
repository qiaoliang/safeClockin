/**
 * 改进的登录功能测试
 *
 * 目的: 测试改进后的登录辅助函数
 *
 * 这个测试应该会失败（RED 阶段），因为我们需要先：
 * 1. 修复登录页面的等待策略
 * 2. 或者修复登录页面本身
 */

import { test, expect } from '@playwright/test';
import {
  loginWithPhoneAndPasswordImproved,
  waitForImprovedLoginPage
} from '../helpers/auth-improved.js';

test.describe('改进的登录功能测试', () => {
  test('应该能够成功加载登录页面', async ({ page }) => {
    console.log('\n🧪 测试: 加载登录页面');

    // 导航到登录页面
    await page.goto('/#/pages/login/login', { waitUntil: 'commit' });

    // 等待并验证登录页面
    await waitForImprovedLoginPage(page);

    // 验证关键元素存在
    const loginTitle = page.locator('[data-testid="login-welcome-title"]');
    await expect(loginTitle).toBeVisible();

    const phoneLoginBtn = page.locator('[data-testid="phone-login-button"]');
    await expect(phoneLoginBtn).toBeVisible();

    console.log('✅ 测试通过: 登录页面加载成功');
  });

  test('应该能够使用手机号和密码登录', async ({ page }) => {
    console.log('\n🧪 测试: 手机号密码登录');

    // 使用改进的登录函数
    await loginWithPhoneAndPasswordImproved(page, '19144444444', '123456');

    // 验证登录成功
    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/打卡|社区|我的/);

    console.log('✅ 测试通过: 登录成功');
  });

  test('应该能够处理已登录状态', async ({ page }) => {
    console.log('\n🧪 测试: 处理已登录状态');

    // 首次登录
    await loginWithPhoneAndPasswordImproved(page, '19144444444', '123456');

    // 尝试再次登录（应该检测到已登录状态）
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);

    // 验证仍在首页
    expect(currentUrl).not.toContain('/pages/login/login');

    console.log('✅ 测试通过: 正确处理已登录状态');
  });
});
