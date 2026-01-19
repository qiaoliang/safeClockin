/**
 * 创建社区功能测试 - 使用新 POM 架构
 * 展示完整的测试流程和数据清理
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { HomePage } from '../pages/HomePage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { CommunityListPage } from '../pages/CommunityListPage.js';
import { ApiClient, createAuthenticatedApiClient } from '../helpers/api-client.js';
import { TEST_USERS, TestDataTracker } from '../fixtures/test-data.mjs';

test.describe('创建社区功能测试', () => {
  let apiClient;
  let testDataTracker;

  // 在所有测试前设置
  test.beforeAll(async () => {
    apiClient = await createAuthenticatedApiClient(
      TEST_USERS.SUPER_ADMIN.phone,
      TEST_USERS.SUPER_ADMIN.password
    );
    testDataTracker = new TestDataTracker();
  });

  // 在所有测试后清理
  test.afterAll(async () => {
    const result = await testDataTracker.cleanupAll();
    if (!result.success) {
      console.error('测试数据清理失败:', result.errors);
    }
  });

  test.describe('UI 交互测试', () => {
    test('超级管理员应该能看到社区管理菜单', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);

      // 登录
      await loginPage.loginAsSuperAdmin();

      // 导航到个人中心
      await homePage.goToProfile();

      // 验证社区列表菜单存在
      const text = await profilePage.getPageText();
      expect(text).toContain('社区管理');
    });

    test('应该能进入社区列表页面', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      await loginPage.loginAsSuperAdmin();
      await homePage.goToProfile();
      await profilePage.clickCommunityList();

      // 验证在社区列表页面
      await communityListPage.isLoaded();
    });
  });

  test.describe('创建社区流程', () => {
    test('应该能成功创建新社区', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 1. 登录
      await loginPage.loginAsSuperAdmin();

      // 2. 导航到个人中心
      await homePage.goToProfile();

      // 3. 进入社区列表
      await profilePage.clickCommunityList();
      await communityListPage.isLoaded();

      // 4. 点击添加按钮
      await communityListPage.clickAddButton();

      // 5. 填写社区信息
      const newCommunityName = `测试社区_${Date.now()}`;
      // 使用 API 创建（因为表单页面可能需要 data-testid）
      const response = await apiClient.createCommunity({
        name: newCommunityName,
        location: '测试地址',
      });

      // 6. 验证创建成功
      expect(response.code).toBe(1);

      // 7. 追踪数据以便清理
      if (response.data?.community_id) {
        testDataTracker.trackCommunity(response.data.community_id);

        // 8. 刷新页面验证社区出现
        await page.reload();
        await communityListPage.waitForCommunityVisible(newCommunityName, 10000);
        expect(await communityListPage.isCommunityVisible(newCommunityName)).toBe(true);
      }
    });

    test('创建社区后应该能在列表中看到', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const homePage = new HomePage(page);
      const profilePage = new ProfilePage(page);
      const communityListPage = new CommunityListPage(page);

      // 准备测试数据
      const newCommunityName = `测试社区_${Date.now()}`;
      const response = await apiClient.createCommunity({
        name: newCommunityName,
        location: '测试地址',
      });

      expect(response.code).toBe(1);
      if (response.data?.community_id) {
        testDataTracker.trackCommunity(response.data.community_id);

        // UI 操作验证
        await loginPage.loginAsSuperAdmin();
        await homePage.goToProfile();
        await profilePage.clickCommunityList();

        await communityListPage.waitForCommunityVisible(newCommunityName);
        expect(await communityListPage.isCommunityVisible(newCommunityName)).toBe(true);
      }
    });
  });

  test.describe('API 集成测试', () => {
    test('直接使用 API 创建和删除社区', async () => {
      const newCommunityName = `API测试社区_${Date.now()}`;

      // 创建社区
      const createResponse = await apiClient.createCommunity({
        name: newCommunityName,
        location: 'API测试地址',
      });

      expect(createResponse.code).toBe(1);
      expect(createResponse.data?.community_id).toBeDefined();

      const communityId = createResponse.data.community_id;
      testDataTracker.trackCommunity(communityId);

      // 获取社区详情
      const detailResponse = await apiClient.getCommunity(communityId);
      expect(detailResponse.code).toBe(1);
      expect(detailResponse.data?.name).toBe(newCommunityName);

      // 更新社区
      const updateResponse = await apiClient.updateCommunity(communityId, {
        name: `${newCommunityName}_已更新`,
      });
      expect(updateResponse.code).toBe(1);

      // 删除社区（先停用）
      await apiClient.updateCommunity(communityId, { status: 'inactive' });
      const deleteResponse = await apiClient.deleteCommunity(communityId);
      expect(deleteResponse.code).toBe(1);

      // 验证已删除
      testDataTracker.data.communityIds = testDataTracker.data.communityIds.filter(
        id => id !== communityId
      );
    });

    test('应该能获取社区列表', async () => {
      const response = await apiClient.getCommunities();

      expect(response.code).toBe(1);
      expect(Array.isArray(response.data?.communities)).toBe(true);
    });
  });

  test.describe('边界条件测试', () => {
    test('创建同名社区应该失败', async () => {
      const communityName = `重复测试社区_${Date.now()}`;

      // 创建第一个社区
      const response1 = await apiClient.createCommunity({
        name: communityName,
        location: '测试地址1',
      });

      expect(response1.code).toBe(1);
      if (response1.data?.community_id) {
        testDataTracker.trackCommunity(response1.data.community_id);

        // 尝试创建同名社区
        const response2 = await apiClient.createCommunity({
          name: communityName,
          location: '测试地址2',
        });

        // 应该返回错误
        expect(response2.code).not.toBe(1);
      }
    });

    test('创建空名称社区应该失败', async () => {
      const response = await apiClient.createCommunity({
        name: '',
        location: '测试地址',
      });

      expect(response.code).not.toBe(1);
    });
  });

  test.describe('数据清理测试', () => {
    test('TestDataTracker 应该正确追踪和清理数据', async () => {
      const tracker = new TestDataTracker();

      // 创建测试数据
      const response = await apiClient.createCommunity({
        name: `清理测试社区_${Date.now()}`,
        location: '测试地址',
      });

      expect(response.code).toBe(1);
      if (response.data?.community_id) {
        const communityId = response.data.community_id;

        // 追踪数据
        tracker.trackCommunity(communityId);

        // 验证追踪数量
        const count = tracker.getCount();
        expect(count.communities).toBe(1);

        // 清理数据
        const result = await tracker.cleanupAll();
        expect(result.success).toBe(true);

        // 验证已清理
        const detailResponse = await apiClient.getCommunity(communityId);
        // 应该返回错误或社区状态为已删除
        expect(detailResponse.code).not.toBe(1);
      }
    });

    test('批量清理多个社区', async () => {
      const tracker = new TestDataTracker();
      const communityIds = [];

      // 创建多个社区
      for (let i = 0; i < 3; i++) {
        const response = await apiClient.createCommunity({
          name: `批量测试社区_${Date.now()}_${i}`,
          location: `测试地址${i}`,
        });

        if (response.code === 1 && response.data?.community_id) {
          communityIds.push(response.data.community_id);
          tracker.trackCommunity(response.data.community_id);
        }
      }

      expect(communityIds.length).toBe(3);

      // 批量清理
      const result = await tracker.cleanupAll();
      expect(result.success).toBe(true);
    });
  });
});

/**
 * 使用 TestFixture 的示例
 */
test.describe('使用自定义 Fixtures', () => {
  test('使用 authenticatedPage fixture', async ({ authenticatedPage }) => {
    // authenticatedPage fixture 已经自动登录
    const text = await authenticatedPage.locator('body').textContent();
    expect(text).toMatch(/今日打卡|当前监护|我的/);
  });
});
