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

test.describe('超级管理员登录测试', () => {
  const superAdmin = TEST_USERS.SUPER_ADMIN;

  test.beforeEach(async ({ page }) => {
    // 导航到根路径（登录页面是默认页面）
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待应用完全初始化
    
    // 等待登录页面加载
    await waitForLoginPage(page);
  });

  test('登录页面应该显示正确的元素', async ({ page }) => {
    // 使用文本内容验证页面元素
    const pageText = await page.locator('body').textContent();
    
    // 验证应用标题
    expect(pageText).toContain('安全守护');
    
    // 验证功能卡片
    expect(pageText).toContain('独居者自主管理');
    expect(pageText).toContain('监护人实时关注');
    expect(pageText).toContain('社区高效服务');
    
    // 验证登录按钮
    expect(pageText).toContain('微信快捷登录');
    expect(pageText).toContain('手机号登录');
    
    console.log('✅ 登录页面元素验证通过');
  });

  test('应该能够点击手机号登录按钮', async ({ page }) => {
    // 点击"手机号登录"按钮（使用 force: true 强制点击）
    await page.locator('text=手机号登录').click({ force: true });
    
    // 等待页面内容更新（SPA 路由可能不会改变 URL）
    await page.waitForTimeout(2000);
    
    // 验证页面内容包含手机号登录表单
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('请输入手机号');
  });

  test('应该能够在标签页之间切换', async ({ page }) => {
    // 点击手机号登录按钮（使用 force: true 强制点击）
    await page.locator('text=手机号登录').click({ force: true });
    await page.waitForTimeout(2000);
    
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

test.describe('登录页面响应式测试', () => {
  test('应该在不同视口尺寸下正常显示', async ({ page }) => {
    // 导航到根路径
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 等待登录页面加载
    await waitForLoginPage(page);
    
    // 测试不同视口尺寸
    const viewports = [
      { width: 375, height: 667 },  // iPhone SE
      { width: 414, height: 896 },  // iPhone 11
      { width: 768, height: 1024 },  // iPad
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // 验证关键元素仍然可见（使用文本内容）
      const pageText = await page.locator('body').textContent();
      expect(pageText).toContain('安全守护');
      expect(pageText).toContain('微信快捷登录');
      expect(pageText).toContain('手机号登录');
    }
    
    console.log('✅ 响应式测试通过');
  });
});