/**
 * 登录功能测试
 *
 * 目的: 验证改进后的登录辅助函数能够正常工作
 */

import { test, expect } from '@playwright/test';
import { loginWithPhoneAndPassword } from '../../helpers/auth.js';

test.describe('登录功能测试', () => {
  test('应该能够成功使用手机号和密码登录', async ({ page }) => {
    console.log('\n🧪 测试: 手机号密码登录');

    // 使用改进的登录函数
    await loginWithPhoneAndPassword(page, '19144444444', '123456');

    // 验证登录成功
    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/打卡|社区|我的/);

    console.log('✅ 测试通过: 登录成功');
  });

  test('应该能够处理重复登录', async ({ page }) => {
    console.log('\n🧪 测试: 重复登录');

    // 首次登录
    await loginWithPhoneAndPassword(page, '19144444444', '123456');

    // 保存当前 URL
    const firstUrl = page.url();
    console.log('首次登录后 URL:', firstUrl);

    // 尝试再次登录（应该检测到已登录状态）
    await loginWithPhoneAndPassword(page, '19144444444', '123456');

    // 验证仍在首页
    const finalUrl = page.url();
    console.log('重复登录后 URL:', finalUrl);

    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/打卡|社区|我的/);

    console.log('✅ 测试通过: 正确处理重复登录');
  });
});
