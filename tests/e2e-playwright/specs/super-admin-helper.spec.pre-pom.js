/**
 * 超级管理员登录 helper 方法测试
 * 验证 loginAsSuperAdmin 方法是否正常工作
 */
import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from '../helpers/auth.js';

test.describe('超级管理员登录 Helper 方法测试', () => {
  test('应该能够使用 loginAsSuperAdmin 方法完成登录', async ({ page }) => {
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page);
    
    // 验证登录成功
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('我的');
    
    console.log('✅ loginAsSuperAdmin 方法测试通过');
  });

  test('应该能够使用自定义凭据登录', async ({ page }) => {
    // 使用自定义超级管理员凭据
    const customSuperAdmin = {
      phone: '13141516171',
      password: 'F1234567'
    };
    
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page, customSuperAdmin);
    
    // 验证登录成功
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('我的');
    
    console.log('✅ 使用自定义凭据登录测试通过');
  });
});
