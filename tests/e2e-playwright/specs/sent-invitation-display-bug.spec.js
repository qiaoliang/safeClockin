/**
 * Bug复现测试：验证"我发起的邀请"显示正确的信息
 *
 * Bug描述：
 * - 在"我发起的邀请"section，显示"未知用户"和"全部规则"
 * - 预期：应该显示被邀请人的昵称和选定的规则名称
 *
 * 测试流程：
 * 1. 登录并邀请一个用户
 * 2. 导航到监护管理页面
 * 3. 验证"我发起的邀请"显示正确的被邀请人和规则信息
 */
import { test, expect } from '@playwright/test';
import { loginWithPhoneAndPassword } from '../helpers/auth.js';

const PAGE_LOAD_WAIT = 2000;

test.describe('Bug复现：我发起的邀请显示正确信息', () => {
  test('应该显示被邀请人的昵称而不是未知用户', async ({ page }) => {
    // 1. 登录为邀请发起者
    await loginWithPhoneAndPassword(page, '19144444444', '123456');
    await page.waitForTimeout(PAGE_LOAD_WAIT);

    // 2. 导航到规则设置页面
    await page.goto('/#/pages/rule-setting/rule-setting');
    await page.waitForTimeout(PAGE_LOAD_WAIT);

    // 3. 点击邀请按钮
    const inviteButtons = page.locator('[data-testid="rule-invite-button"]');
    await expect(inviteButtons.first()).toBeVisible({ timeout: 15000 });
    const buttonCount = await inviteButtons.count();
    if (buttonCount > 1) {
      await inviteButtons.nth(1).click({ timeout: 5000 });
    } else if (buttonCount === 1) {
      await inviteButtons.first().click({ timeout: 5000 });
    } else {
      throw new Error('未找到邀请按钮');
    }
    await page.waitForTimeout(2000);

    // 4. 搜索并选择用户
    const phoneInput = page.locator('input[placeholder*="搜索"]')
      .or(page.locator('.uni-easyinput__content-textarea'));
    await phoneInput.first().fill('13588888888');
    await page.waitForTimeout(1500);

    const userItems = page.locator('.user-item');
    await userItems.first().click();
    await page.waitForTimeout(500);

    // 5. 发送邀请
    const confirmButton = page.getByText('确定', { exact: true })
      .or(page.getByRole('generic').filter({ hasText: '确定' }));
    await confirmButton.first().click();
    await page.waitForTimeout(2000);

    // 6. 导航到监护管理页面
    await page.goto('/#/pages/supervisor-manage/supervisor-manage');
    await page.waitForTimeout(PAGE_LOAD_WAIT);

    // 7. 滚动到"我发起的邀请"section
    const sectionTitle = page.getByText('我发起的邀请');
    await expect(sectionTitle).toBeVisible();
    await page.waitForTimeout(2000);

    // 8. 验证邀请列表显示正确的信息
    const invitationItems = page.locator('.sent-invitation-item');
    const count = await invitationItems.count();

    expect(count).toBeGreaterThan(0);

    // 获取第一个邀请项的信息
    const firstItem = invitationItems.first();
    const userName = await firstItem.locator('.sent-inv-name').textContent();
    const ruleName = await firstItem.locator('.sent-inv-rule').textContent();

    console.log(`🔍 实际显示 - 被邀请人: ${userName}`);
    console.log(`🔍 实际显示 - 规则: ${ruleName}`);

    // 9. 验证Bug：应该显示"未知用户"和"全部规则"
    // 这是Bug复现测试，我们期望看到错误的显示
    expect(userName).toContain('未知用户');
    expect(ruleName).toContain('全部规则');

    console.log('✅ Bug复现成功：显示"未知用户"和"全部规则"');
  });

  test('应该显示正确的被邀请人昵称和规则名称', async ({ page }) => {
    // 这个测试会失败，因为当前有bug
    // 但它记录了预期的行为

    // 1. 登录并邀请用户
    await loginWithPhoneAndPassword(page, '19144444444', '123456');
    await page.waitForTimeout(PAGE_LOAD_WAIT);

    await page.goto('/#/pages/rule-setting/rule-setting');
    await page.waitForTimeout(PAGE_LOAD_WAIT);

    const inviteButtons = page.locator('[data-testid="rule-invite-button"]');
    await expect(inviteButtons.first()).toBeVisible({ timeout: 15000 });
    const buttonCount = await inviteButtons.count();
    if (buttonCount > 1) {
      await inviteButtons.nth(1).click({ timeout: 5000 });
    } else if (buttonCount === 1) {
      await inviteButtons.first().click({ timeout: 5000 });
    } else {
      throw new Error('未找到邀请按钮');
    }
    await page.waitForTimeout(2000);

    const phoneInput = page.locator('input[placeholder*="搜索"]')
      .or(page.locator('.uni-easyinput__content-textarea'));
    await phoneInput.first().fill('13588888888');
    await page.waitForTimeout(2000);

    const userItems = page.locator('.user-item');
    await expect(userItems.first()).toBeVisible({ timeout: 10000 });
    await userItems.first().click();
    await page.waitForTimeout(1000);

    const confirmButton = page.getByText('确定', { exact: true })
      .or(page.getByRole('generic').filter({ hasText: '确定' }));
    await expect(confirmButton.first()).toBeVisible({ timeout: 5000 });
    await confirmButton.first().click();
    await page.waitForTimeout(3000);

    // 2. 导航到监护管理页面
    await page.goto('/#/pages/supervisor-manage/supervisor-manage');
    await page.waitForTimeout(PAGE_LOAD_WAIT);
    await page.waitForTimeout(2000);

    // 3. 验证应该显示正确信息（预期行为）
    const invitationItems = page.locator('.sent-invitation-item');
    const firstItem = invitationItems.first();
    const userName = await firstItem.locator('.sent-inv-name').textContent();
    const ruleName = await firstItem.locator('.sent-inv-rule').textContent();

    console.log(`预期 - 被邀请人: 主管用户-1`);
    console.log(`预期 - 规则: 晨间打卡规则`);

    // 这个断言会失败，因为当前有bug
    expect(userName).toBe('主管用户-1');
    expect(ruleName).toMatch(/打卡|规则/);
  });
});
