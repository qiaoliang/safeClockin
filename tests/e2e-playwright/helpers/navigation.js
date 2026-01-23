/**
 * 导航相关的测试辅助函数
 */
import { expect } from '@playwright/test';
import { WAIT_TIMEOUTS } from '../utils/wait-helpers.js';

const NAV_SELECTORS = {
  home: '[data-testid="nav-home"]',
  community: '[data-testid="nav-community"]',
  profile: '[data-testid="nav-profile"]',
};

/**
 * 导航到指定页面
 */
export async function navigateTo(page, pageName) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}

/**
 * 导航到登录页面
 */
export async function navigateToLoginPage(page) {
  await navigateTo(page, 'LOGIN');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 导航到手机号登录页面
 */
export async function navigateToPhoneLoginPage(page) {
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

  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  const pageText = await page.locator('body').textContent();
  const hasLoginForm = pageText.includes('请输入手机号') && pageText.includes('验证码登录');

  if (!hasLoginForm) {
    console.log('当前页面内容:', pageText.substring(0, 200));
    throw new Error('未找到手机号登录表单');
  }
}

/**
 * 点击底部导航栏
 */
export async function clickBottomNavigation(page, tabName) {
  const selector = NAV_SELECTORS[tabName];
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