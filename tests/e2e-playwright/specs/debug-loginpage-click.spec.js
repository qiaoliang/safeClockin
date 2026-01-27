/**
 * 调试 LoginPage.clickPhoneLogin() 方法
 */
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';

test('调试 LoginPage.clickPhoneLogin() 方法', async ({ page }) => {
  console.log('\n=== 测试 LoginPage.clickPhoneLogin() ===');

  // 步骤 1：导航
  console.log('步骤1: 调用 loginPage.goto()');
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  let pageText = await page.locator('body').textContent();
  console.log('页面是否包含"手机号登录":', pageText.includes('手机号登录') ? '是' : '否');

  // 步骤 2：点击手机号登录
  console.log('步骤2: 调用 loginPage.clickPhoneLogin()');
  await loginPage.clickPhoneLogin();

  // 等待页面更新
  await page.waitForTimeout(3000);

  pageText = await page.locator('body').textContent();
  console.log('点击后页面是否包含"密码登录":', pageText.includes('密码登录') ? '是' : '否');
  console.log('点击后页面是否包含"请输入手机号":', pageText.includes('请输入手机号') ? '是' : '否');

  // 步骤 3：尝试登录
  console.log('步骤3: 调用 phoneLoginPage.loginWithPassword()');
  const phoneLoginPage = new PhoneLoginPage(page);

  try {
    await phoneLoginPage.loginWithPassword(
      TEST_USERS.SUPER_ADMIN.phone,
      TEST_USERS.SUPER_ADMIN.password
    );

    pageText = await page.locator('body').textContent();
    const success = pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的');
    console.log('登录结果:', success ? '成功' : '失败');
    console.log('登录后页面内容预览:', pageText.substring(0, 200));

    if (!success) {
      throw new Error('登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error.message);
    pageText = await page.locator('body').textContent();
    console.error('当前页面内容:', pageText.substring(0, 500));
    throw error;
  }
});

test('对比：直接使用 page.locator 点击', async ({ page }) => {
  console.log('\n=== 测试直接使用 page.locator 点击 ===');

  // 步骤 1：导航
  console.log('步骤1: 导航到根路径');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 步骤 2：点击手机号登录
  console.log('步骤2: 直接使用 text=手机号登录 点击');
  await page.locator('text=手机号登录').click({ force: true });

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  let pageText = await page.locator('body').textContent();
  console.log('点击后页面是否包含"密码登录":', pageText.includes('密码登录') ? '是' : '否');

  // 步骤 3：尝试登录
  console.log('步骤3: 调用 phoneLoginPage.loginWithPassword()');
  const phoneLoginPage = new PhoneLoginPage(page);

  try {
    await phoneLoginPage.loginWithPassword(
      TEST_USERS.SUPER_ADMIN.phone,
      TEST_USERS.SUPER_ADMIN.password
    );

    pageText = await page.locator('body').textContent();
    const success = pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的');
    console.log('登录结果:', success ? '成功' : '失败');
    console.log('登录后页面内容预览:', pageText.substring(0, 200));

    if (!success) {
      throw new Error('登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error.message);
    pageText = await page.locator('body').textContent();
    console.error('当前页面内容:', pageText.substring(0, 500));
    throw error;
  }
});
