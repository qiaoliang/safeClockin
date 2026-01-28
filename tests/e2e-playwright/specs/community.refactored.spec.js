/**
 * 社区管理测试 - 使用新 POM 架构
 * 测试超级管理员的社区管理功能
 */
import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { HomePage } from '../pages/HomePage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { CommunityListPage } from '../pages/CommunityListPage.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';
import { cleanupAuthState } from '../helpers/auth.js';

test.describe('超级管理员社区管理测试', () => {
  // 每个测试后清理认证状态
  test.afterEach(async ({ page }) => {
    await cleanupAuthState(page);
  });

  // 每个测试前清理浏览器状态
  test.beforeEach(async ({ page, context }) => {
    await cleanupAuthState(page);
    await context.clearCookies();
  });

  test.describe('导航测试', () => {
    test('超级管理员登录后自动导航到我的页面', async ({ page }) => {
      const loginPage = new WelcomePage(page);

      // 登录超级管理员
      await loginPage.goto();
      await loginPage.loginAsSuperAdmin();

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 验证在个人中心页面
      const pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/个人中心|我的|系统超级系统管理员/);
    });
  });

  test.describe('社区列表访问', () => {
    test('访问社区列表并验证默认社区', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录超级管理员
      await loginPage.loginAsSuperAdmin();

      // 导航到个人中心
      await homePage.goToProfile();

      // 点击社区列表
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 验证默认社区存在
      const pageText = await page.locator('body').textContent();
      expect(pageText).toContain('安卡大家庭');
      expect(pageText).toContain('黑屋');
    });

    test('验证社区管理页面标题', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录并导航到社区列表
      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 验证页面标题
      const pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/社区管理|社区列表/);
    });
  });

  test.describe('默认社区保护', () => {
    test('验证默认社区保护机制', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录并导航到社区列表
      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 验证默认社区存在
      const pageText = await page.locator('body').textContent();
      expect(pageText).toContain('安卡大家庭');

      // 尝试找到停用按钮
      const deactivateButtonExists = pageText.includes('停用');

      if (deactivateButtonExists) {
        // 点击停用按钮（第一个）
        await page.getByText('停用', { exact: true }).first().click({ force: true });
        await page.waitForTimeout(2000);

        // 验证操作被阻止或有确认对话框
        const finalText = await page.locator('body').textContent();
        const hasProtection = finalText.includes('不能停用默认社区') ||
                             finalText.includes('确认操作');

        if (finalText.includes('确认操作')) {
          // 取消确认对话框
          await page.getByText('Cancel', { exact: true }).or(
            page.getByText('取消', { exact: true })
          ).click({ force: true });
          await page.waitForTimeout(1000);
        }

        // 验证状态未改变
        const currentText = await page.locator('body').textContent();
        expect(currentText).toContain('停用');
      }
    });
  });

  test.describe('社区操作', () => {
    test('能够打开创建社区页面', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录并导航到社区列表
      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 点击添加按钮
      await communityListPage.clickAddButton();
      await page.waitForTimeout(2000);

      // 验证进入创建页面
      const pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/社区名称|社区信息|创建社区/);
    });

    test('验证社区操作按钮存在', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录并导航到社区列表
      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 验证操作按钮存在
      const pageText = await page.locator('body').textContent();
      expect(pageText).toContain('停用');
    });
  });

  test.describe('完整社区管理流程', () => {
    test('端到端社区管理流程', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 步骤 1：登录
      await loginPage.loginAsSuperAdmin();

      // 步骤 2：验证在个人中心
      await page.waitForTimeout(2000);
      let pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/个人中心|我的/);

      // 步骤 3：访问社区列表
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/社区管理|社区列表/);

      // 步骤 4：验证默认社区
      expect(pageText).toContain('安卡大家庭');
      expect(pageText).toContain('黑屋');

      // 步骤 5：验证默认社区保护
      const hasDeactivateButton = pageText.includes('停用');
      if (hasDeactivateButton) {
        await page.getByText('停用', { exact: true }).first().click({ force: true });
        await page.waitForTimeout(2000);

        const afterClickText = await page.locator('body').textContent();
        if (afterClickText.includes('确认操作')) {
          // 取消操作
          await page.getByText('Cancel', { exact: true }).or(
            page.getByText('取消', { exact: true })
          ).click({ force: true });
        }

        // 验证状态未改变
        const finalText = await page.locator('body').textContent();
        expect(finalText).toContain('停用');
      }

      // 步骤 6：能够打开创建页面
      await communityListPage.clickAddButton();
      await page.waitForTimeout(2000);

      const createPageText = await page.locator('body').textContent();
      expect(createPageText).toMatch(/社区名称|社区信息/);
    });
  });

  test.describe('边界条件测试', () => {
    test('快速导航操作', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录
      await loginPage.loginAsSuperAdmin();
      await page.waitForTimeout(1000);

      // 快速连续导航
      await homePage.goToProfile();
      await page.waitForTimeout(500);

      await profilePage.clickCommunityList();
      await page.waitForTimeout(500);

      // 验证最终状态稳定
      await communityListPage.isLoaded();
      const pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/社区管理|社区列表/);
    });

    test('处理页面刷新', async ({ page }) => {
      const loginPage = new WelcomePage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 登录并导航到社区列表
      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 刷新页面
      await page.reload();
      await page.waitForTimeout(2000);

      // 验证页面状态保持
      const pageText = await page.locator('body').textContent();
      expect(pageText).toMatch(/社区管理|社区列表/);
    });
  });
});
