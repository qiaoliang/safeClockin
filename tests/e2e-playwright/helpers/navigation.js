/**
 * 导航相关的测试辅助函数
 */
import { expect } from '@playwright/test';

/**
 * 导航到指定页面
 */
export async function navigateTo(page, pageName) {
  // uni-app H5 是单页应用，所有路由通过 JavaScript 处理
  // 只访问根路径，然后通过 JavaScript 触发路由
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // 等待应用完全初始化
}

/**
 * 导航到登录页面
 */
export async function navigateToLoginPage(page) {
  await navigateTo(page, 'LOGIN');
  // 等待页面加载完成
  await page.waitForLoadState('networkidle');
  // 等待应用渲染
  await page.waitForTimeout(1000);
}

/**
 * 导航到手机号登录页面
 */
export async function navigateToPhoneLoginPage(page) {
  // 使用 JavaScript 直接触发 uni-app 路由
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      if (typeof window.uni !== 'undefined') {
        window.uni.navigateTo({
          url: '/pages/phone-login/phone-login?mode=login',
          success: () => resolve(true),
          fail: (err) => {
            console.error('导航失败:', err);
            reject(err);
          }
        });
      } else {
        reject(new Error('uni 对象不存在'));
      }
    });
  });
  
  // 等待页面内容更新
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
  
  // 验证页面内容包含手机号登录表单
  const pageText = await page.locator('body').textContent();
  const hasLoginForm = pageText.includes('请输入手机号') && pageText.includes('验证码登录');
  
  if (!hasLoginForm) {
    console.log('当前页面内容:', pageText.substring(0, 200));
    throw new Error('未找到手机号登录表单');
  }
}

/**
 * 导航到首页
 */
export async function navigateToHomePage(page) {
  await navigateTo(page, 'home-solo');
}

/**
 * 导航到社区管理页面
 */
export async function navigateToCommunityManagePage(page) {
  await navigateTo(page, 'community-manage');
}

/**
 * 导航到个人中心页面
 */
export async function navigateToProfilePage(page) {
  await navigateTo(page, 'profile');
}

/**
 * 点击底部导航栏
 */
export async function clickBottomNavigation(page, tabName) {
  const tabSelector = {
    'home': '[data-testid="nav-home"]',
    'community': '[data-testid="nav-community"]',
    'profile': '[data-testid="nav-profile"]',
  };
  
  const selector = tabSelector[tabName];
  if (!selector) {
    throw new Error(`未知的导航标签: ${tabName}`);
  }
  
  await page.locator(selector).click();
  await page.waitForLoadState('networkidle');
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 验证当前页面
 */
export async function verifyCurrentPage(page, expectedPageName) {
  const currentUrl = page.url();
  expect(currentUrl).toContain(`/pages/${expectedPageName}/`);
}

/**
 * 返回上一页
 */
export async function goBack(page) {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

/**
 * 刷新页面
 */
export async function refreshPage(page) {
  await page.reload();
  await page.waitForLoadState('networkidle');
}