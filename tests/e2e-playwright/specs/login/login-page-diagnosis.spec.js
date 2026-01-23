/**
 * 登录页面诊断测试
 *
 * 目的: 诊断为什么登录页面内容为空
 * 这个测试会输出详细的调试信息
 */

import { test, expect } from '@playwright/test';

test.describe('登录页面诊断测试', () => {
  test('诊断-检查登录页面是否能正确加载', async ({ page }) => {
    console.log('🔍 开始诊断登录页面加载问题...\n');

    // 1. 尝试导航到根路径
    console.log('1️⃣ 导航到根路径 /');
    await page.goto('/', { waitUntil: 'commit' });
    console.log('   ✅ 页面已加载');
    console.log('   当前 URL:', page.url());

    // 2. 等待网络空闲
    console.log('\n2️⃣ 等待网络空闲...');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('   ⚠️ 网络未能在10秒内达到空闲状态');
    });
    console.log('   ✅ 网络状态检查完成');

    // 3. 检查页面内容
    console.log('\n3️⃣ 检查页面内容...');
    const bodyText = await page.locator('body').textContent();
    console.log('   页面内容长度:', bodyText.length);
    console.log('   页面内容预览:', bodyText.substring(0, 200));

    // 4. 检查是否有任何 data-testid 元素
    console.log('\n4️⃣ 检查 data-testid 元素...');
    const testIdElements = await page.locator('[data-testid]').count();
    console.log(`   找到 ${testIdElements} 个 data-testid 元素`);

    if (testIdElements > 0) {
      const firstElement = page.locator('[data-testid]').first();
      const testId = await firstElement.getAttribute('data-testid');
      console.log('   第一个 data-testid:', testId);
    }

    // 5. 尝试查找特定的登录元素
    console.log('\n5️⃣ 查找登录页面元素...');

    const elementsToCheck = [
      { selector: '[data-testid="login-welcome-title"]', name: '登录标题' },
      { selector: '[data-testid="phone-login-button"]', name: '手机号登录按钮' },
      { selector: '[data-testid="wechat-login-button"]', name: '微信登录按钮' },
    ];

    for (const { selector, name } of elementsToCheck) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`   ✅ 找到: ${name}`);
      } catch (error) {
        console.log(`   ❌ 未找到: ${name}`);
      }
    }

    // 6. 保存截图
    console.log('\n6️⃣ 保存截图...');
    await page.screenshot({
      path: 'test-results/login-page-diagnosis.png',
      fullPage: true
    });
    console.log('   ✅ 截图已保存到 test-results/login-page-diagnosis.png');

    // 7. 获取页面 HTML（前1000字符）
    console.log('\n7️⃣ 获取页面 HTML...');
    const html = await page.content();
    console.log('   HTML 长度:', html.length);
    console.log('   HTML 预览:', html.substring(0, 500));

    // 8. 断言
    console.log('\n✅ 诊断完成');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('诊断-显式导航到登录页面', async ({ page }) => {
    console.log('🔍 显式导航到登录页面...\n');

    // 显式导航到登录页面
    const loginUrl = '/#/pages/login/login';
    console.log('1️⃣ 导航到:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 等待3秒

    console.log('   当前 URL:', page.url());

    // 检查页面内容
    const bodyText = await page.locator('body').textContent();
    console.log('2️⃣ 页面内容长度:', bodyText.length);
    console.log('   页面内容预览:', bodyText.substring(0, 300));

    // 保存截图
    await page.screenshot({
      path: 'test-results/login-page-explicit.png',
      fullPage: true
    });

    console.log('✅ 诊断完成');
  });
});
