/**
 * 基础测试 - 验证应用加载
 */
import { test, expect } from '@playwright/test';

test.describe('应用基础测试', () => {
  test('应该能够加载应用首页', async ({ page }) => {
    console.log('开始测试：应用加载');
    
    // 访问根路径
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    expect(title).toBe('安全守护');
    
    // 检查应用容器
    await expect(page.locator('#app')).toBeVisible();
    
    console.log('✅ 应用加载成功');
  });

  test('应该能够检查页面内容', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 获取页面 HTML
    const html = await page.content();
    console.log('页面 HTML 长度:', html.length);
    
    // 检查是否有任何文本内容
    const bodyText = await page.locator('body').textContent();
    console.log('页面文本长度:', bodyText.length);
    console.log('页面文本:', bodyText.substring(0, 200));
  });

  test('应该能够执行 JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 检查 uni 对象是否存在
    const hasUni = await page.evaluate(() => {
      return typeof window.uni !== 'undefined';
    });
    console.log('uni 对象存在:', hasUni);
    
    // 检查 Vue 对象是否存在
    const hasVue = await page.evaluate(() => {
      return typeof window.__VUE__ !== 'undefined';
    });
    console.log('Vue 对象存在:', hasVue);
  });
});