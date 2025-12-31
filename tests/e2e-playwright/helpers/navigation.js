/**
 * 导航相关的测试辅助函数
 */
import { expect } from '@playwright/test';

/**
 * 导航到指定页面
 */
export async function navigateTo(page, pageName) {
  const pageUrl = `/pages/${pageName}/index.html`;
  await page.goto(pageUrl);
  await page.waitForLoadState('networkidle');
}

/**
 * 导航到登录页面
 */
export async function navigateToLoginPage(page) {
  await navigateTo(page, 'LOGIN');
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