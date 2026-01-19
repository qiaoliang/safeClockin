/**
 * 调试测试：对比原始登录方法和 POM 登录方法
 */
import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from '../helpers/auth.js';
import { LoginPage } from '../pages/LoginPage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';

test.describe('登录方法对比调试', () => {
  test('对比原始 loginAsSuperAdmin 方法', async ({ page }) => {
    console.log('\n=== 测试原始 loginAsSuperAdmin 方法 ===');

    try {
      await loginAsSuperAdmin(page);
      const pageText = await page.locator('body').textContent();
      console.log('✅ 原始方法登录成功');
      console.log('页面内容预览:', pageText.substring(0, 200));
    } catch (error) {
      console.error('❌ 原始方法登录失败:', error.message);
      const pageText = await page.locator('body').textContent();
      console.error('当前页面内容:', pageText.substring(0, 300));
      throw error;
    }
  });

  test('对比 POM LoginPage + PhoneLoginPage 方法', async ({ page }) => {
    console.log('\n=== 测试 POM LoginPage + PhoneLoginPage 方法 ===');

    try {
      // 步骤 1：导航到登录页
      console.log('步骤1: 导航到登录页');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      let pageText = await page.locator('body').textContent();
      console.log('登录页内容预览:', pageText.substring(0, 100));

      // 步骤 2：点击手机号登录
      console.log('步骤2: 点击手机号登录按钮');
      await page.locator('text=手机号登录').click({ force: true });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      pageText = await page.locator('body').textContent();
      console.log('手机登录页内容预览:', pageText.substring(0, 100));

      // 步骤 3：使用 POM 方法登录
      console.log('步骤3: 使用 PhoneLoginPage.loginWithPassword');
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.SUPER_ADMIN.phone,
        TEST_USERS.SUPER_ADMIN.password
      );

      pageText = await page.locator('body').textContent();
      console.log('✅ POM 方法登录成功');
      console.log('登录后页面内容预览:', pageText.substring(0, 200));
    } catch (error) {
      console.error('❌ POM 方法登录失败:', error.message);
      const pageText = await page.locator('body').textContent();
      console.error('当前页面内容:', pageText.substring(0, 500));

      // 截图保存
      try {
        await page.screenshot({ path: 'debug-login-failed.png' });
        console.log('已保存截图: debug-login-failed.png');
      } catch (e) {
        // 忽略截图错误
      }
      throw error;
    }
  });

  test('逐步调试 POM 方法', async ({ page }) => {
    console.log('\n=== 逐步调试 POM 方法 ===');

    try {
      // 导航
      console.log('步骤1: 导航');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 点击手机号登录
      console.log('步骤2: 点击手机号登录');
      const loginPage = new LoginPage(page);
      await loginPage.clickPhoneLogin();

      let pageText = await page.locator('body').textContent();
      console.log('当前页面包含:', pageText.includes('密码登录') ? '密码登录标签' : '未找到密码登录标签');

      // 切换标签
      console.log('步骤3: 切换到密码登录标签');
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.switchToPasswordTab();
      await page.waitForTimeout(1000);

      // 填充手机号
      console.log('步骤4: 填充手机号');
      await phoneLoginPage.fillPhone(TEST_USERS.SUPER_ADMIN.phone);
      await page.waitForTimeout(500);

      const phoneValue = await phoneLoginPage.getPhoneValue();
      console.log('手机号输入框值:', phoneValue);

      // 填充密码
      console.log('步骤5: 填充密码');
      await phoneLoginPage.fillPassword(TEST_USERS.SUPER_ADMIN.password);
      await page.waitForTimeout(500);

      const passwordValue = await phoneLoginPage.getPasswordValue();
      console.log('密码输入框值:', passwordValue);

      // 点击提交
      console.log('步骤6: 点击提交按钮');
      await phoneLoginPage.clickSubmit();

      // 等待跳转
      console.log('步骤7: 等待登录完成');
      await page.waitForTimeout(5000);

      pageText = await page.locator('body').textContent();
      const success = pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的');
      console.log('登录结果:', success ? '成功' : '失败');
      console.log('页面内容预览:', pageText.substring(0, 200));

      if (!success) {
        throw new Error('登录失败，未跳转到首页');
      }

      console.log('✅ 逐步调试成功');
    } catch (error) {
      console.error('❌ 逐步调试失败:', error.message);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  });
});
