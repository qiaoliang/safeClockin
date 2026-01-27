/**
 * API 响应验证测试
 * 
 * 测试目标：验证注册 API 返回的数据中包含 community_id
 */
import { test, expect } from '@playwright/test';

test.describe('API 响应验证', () => {
  test('注册 API 应该返回 community_id', async ({ page }) => {
    console.log('开始测试：注册 API 应该返回 community_id');

    // 拦截注册 API 请求
    let apiResponseData = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/register_phone')) {
        try {
          const data = await response.json();
          apiResponseData = data;
          console.log('注册 API 响应:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.error('解析响应失败:', e);
        }
      }
    });

    // 导航到登录页面
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 点击"手机号登录"按钮
    await page.locator('text=手机号登录').click({ force: true });
    await page.waitForTimeout(2000);

    // 切换到"注册"标签
    await page.locator('.tab').filter({ hasText: '注册' }).click({ force: true });
    await page.waitForTimeout(1000);

    // 生成随机手机号
    const phoneNumber = '137' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    // 输入手机号
    const phoneInput = page.locator('input[type="number"]').first();
    await phoneInput.click({ force: true });
    await phoneInput.clear();
    await phoneInput.type(phoneNumber, { delay: 100 });
    await page.waitForTimeout(500);

    // 点击"获取验证码"按钮
    const codeBtn = page.locator('.code-btn');
    await codeBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 输入验证码
    const codeInput = page.locator('input[type="number"]').nth(1);
    await codeInput.click({ force: true });
    await codeInput.clear();
    await codeInput.type('123456', { delay: 100 });
    await page.waitForTimeout(500);

    // 输入密码
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click({ force: true });
    await passwordInput.clear();
    await passwordInput.type('F1234567', { delay: 100 });
    await page.waitForTimeout(500);

    // 勾选用户协议
    await page.locator('.agree-label').click({ force: true });
    await page.waitForTimeout(500);

    // 点击"注册"按钮
    const submitBtn = page.locator('uni-button.submit');
    await submitBtn.click({ force: true });

    // 等待注册完成
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // 断言：API 响应应该存在
    expect(apiResponseData).not.toBeNull();
    console.log('✅ API 响应已捕获');

    // 断言：API 响应应该成功
    expect(apiResponseData.code).toBe(1);
    console.log('✅ API 响应成功');

    // 断言：data 应该存在
    expect(apiResponseData.data).not.toBeNull();
    console.log('✅ data 字段存在');

    // 断言：community_id 应该存在且不为 null
    expect(apiResponseData.data.community_id).not.toBeNull();
    expect(apiResponseData.data.community_id).toBeDefined();
    console.log(`✅ community_id 存在: ${apiResponseData.data.community_id}`);

    // 断言：community_name 应该存在
    expect(apiResponseData.data.community_name).not.toBeNull();
    expect(apiResponseData.data.community_name).toBeDefined();
    console.log(`✅ community_name 存在: ${apiResponseData.data.community_name}`);

    console.log('✅ 测试通过：注册 API 返回了正确的社区信息');
  });
});