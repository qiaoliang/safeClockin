/**
 * 监督邀请功能E2E测试
 */
import { test, expect } from '@playwright/test';
import { loginAsUser, navigateToPage, waitForPageLoad } from '../helpers/page-helpers';

test.describe('监督邀请功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为普通用户
    await loginAsUser(page);
    await waitForPageLoad(page);
  });

  test.describe('规则设置页面 - 邀请监督人', () => {
    test('应该在规则列表中显示邀请按钮', async ({ page }) => {
      await navigateToPage(page, '/pages/rule-setting/rule-setting');
      await waitForPageLoad(page);

      // 检查邀请按钮是否存在
      const inviteButton = page.locator('[data-testid="rule-invite-button"]');
      await expect(inviteButton).toBeVisible();
    });

    test('应该能够打开邀请监督人弹窗', async ({ page }) => {
      await navigateToPage(page, '/pages/rule-setting/rule-setting');
      await waitForPageLoad(page);

      // 点击邀请按钮
      const inviteButton = page.locator('[data-testid="rule-invite-button"]').first();
      await inviteButton.click();

      // 检查邀请弹窗是否显示
      const inviteModal = page.locator('.invite-modal-container');
      await expect(inviteModal).toBeVisible();
    });

    test('应该能够关闭邀请监督人弹窗', async ({ page }) => {
      await navigateToPage(page, '/pages/rule-setting/rule-setting');
      await waitForPageLoad(page);

      // 打开邀请弹窗
      const inviteButton = page.locator('[data-testid="rule-invite-button"]').first();
      await inviteButton.click();

      // 点击关闭按钮
      const closeButton = page.locator('.modal-close-btn');
      await closeButton.click();

      // 检查邀请弹窗是否关闭
      const inviteModal = page.locator('.invite-modal-container');
      await expect(inviteModal).not.toBeVisible();
    });
  });

  test.describe('监护管理页面 - 三section布局', () => {
    test('应该显示三个section', async ({ page }) => {
      await navigateToPage(page, '/pages/supervisor-manage/supervisor-manage');
      await waitForPageLoad(page);

      // 检查三个section是否都存在
      const supervisedSection = page.locator('.section').filter({ hasText: '我的监护' });
      const invitationSection = page.locator('.section').filter({ hasText: '监督邀请' });
      const sentSection = page.locator('.section').filter({ hasText: '我发起的邀请' });

      await expect(supervisedSection).toBeVisible();
      await expect(invitationSection).toBeVisible();
      await expect(sentSection).toBeVisible();
    });

    test('应该显示批量操作工具栏', async ({ page }) => {
      await navigateToPage(page, '/pages/supervisor-manage/supervisor-manage');
      await waitForPageLoad(page);

      // 检查批量操作工具栏是否存在
      const batchToolbar = page.locator('.batch-actions-toolbar');
      await expect(batchToolbar).toBeVisible();
    });

    test('应该能够选择邀请', async ({ page }) => {
      await navigateToPage(page, '/pages/supervisor-manage/supervisor-manage');
      await waitForPageLoad(page);

      // 检查邀请项是否存在
      const invitationItem = page.locator('.invitation-item').first();
      const isVisible = await invitationItem.isVisible();

      if (isVisible) {
        // 点击复选框
        const checkbox = invitationItem.locator('.checkbox');
        await checkbox.click();

        // 检查是否被选中
        await expect(invitationItem).toHaveClass(/selected/);
      }
    });

    test('应该能够展开/收起监护对象规则列表', async ({ page }) => {
      await navigateToPage(page, '/pages/supervisor-manage/supervisor-manage');
      await waitForPageLoad(page);

      // 检查监护对象是否存在
      const supervisedItem = page.locator('.supervised-rule-item').first();
      const isVisible = await supervisedItem.isVisible();

      if (isVisible) {
        // 点击展开
        await supervisedItem.click();

        // 检查规则列表是否显示
        const rulesList = supervisedItem.locator('.rules-list');
        await expect(rulesList).toBeVisible();
      }
    });
  });

  test.describe('首页 - 监护管理角标', () => {
    test('应该显示监护管理按钮', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // 检查监护管理按钮是否存在
      const guardianManageBtn = page.locator('[data-testid="view-rules-button"]');
      await expect(guardianManageBtn).toBeVisible();
    });

    test('应该能够跳转到监护管理页面', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // 点击监护管理按钮
      const gridItems = page.locator('.grid-item-content');
      const guardianItem = gridItems.filter({ hasText: '监护管理' });
      await guardianItem.click();

      // 检查是否跳转到监护管理页面
      await waitForPageLoad(page);
      const url = page.url();
      expect(url).toContain('/pages/supervisor-manage/supervisor-manage');
    });
  });

  test.describe('待处理邀请角标', () => {
    test('应该显示待处理邀请数量', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // 检查角标是否存在
      const badge = page.locator('.badge');
      const isVisible = await badge.isVisible();

      if (isVisible) {
        // 检查角标文本
        const badgeText = await badge.textContent();
        console.log('待处理邀请数量:', badgeText);
        expect(badgeText).toBeTruthy();
      }
    });
  });

  test.describe('邀请流程完整测试', () => {
    test('应该能够完成邀请监督人流程', async ({ page }) => {
      // 1. 导航到规则设置页面
      await navigateToPage(page, '/pages/rule-setting/rule-setting');
      await waitForPageLoad(page);

      // 2. 点击邀请按钮
      const inviteButton = page.locator('[data-testid="rule-invite-button"]').first();
      await inviteButton.click();

      // 3. 检查邀请弹窗显示
      const inviteModal = page.locator('.invite-modal-container');
      await expect(inviteModal).toBeVisible();

      // 4. 关闭弹窗
      const closeButton = page.locator('.modal-close-btn');
      await closeButton.click();

      // 5. 检查弹窗关闭
      await expect(inviteModal).not.toBeVisible();
    });

    test('应该能够查看和管理监督邀请', async ({ page }) => {
      // 1. 导航到监护管理页面
      await navigateToPage(page, '/pages/supervisor-manage/supervisor-manage');
      await waitForPageLoad(page);

      // 2. 检查三个section
      const sections = page.locator('.section');
      await expect(sections).toHaveCount(3);

      // 3. 检查批量操作工具栏
      const batchToolbar = page.locator('.batch-actions-toolbar');
      await expect(batchToolbar).toBeVisible();
    });
  });
});