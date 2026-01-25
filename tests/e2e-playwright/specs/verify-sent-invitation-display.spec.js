/**
 * 验证"我发起的邀请"显示正确的信息
 *
 * Bug: "我发起的邀请"显示"未知用户"和"全部规则"
 * 预期: 应该显示被邀请人的昵称和选定的规则名称
 */
import { test, expect } from '@playwright/test';
import { loginWithPhoneAndPassword } from '../helpers/auth.js';

const PAGE_LOAD_WAIT = 2000;

test('验证我发起的邀请显示正确的被邀请人和规则信息', async ({ page }) => {
  // 1. 登录为邀请发起者
  console.log('🔐 开始登录...');
  await loginWithPhoneAndPassword(page, '19144444444', '123456');
  await page.waitForTimeout(PAGE_LOAD_WAIT);

  // 2. 导航到规则设置页面并发送邀请
  console.log('📋 导航到规则设置页面...');
  await page.goto('/#/pages/rule-setting/rule-setting');
  await page.waitForTimeout(PAGE_LOAD_WAIT);

  // 等待邀请按钮可见
  const inviteButtons = page.locator('[data-testid="rule-invite-button"]');
  await expect(inviteButtons.first()).toBeVisible({ timeout: 15000 });

  // 点击邀请按钮（第2个按钮）
  const buttonCount = await inviteButtons.count();
  console.log(`找到 ${buttonCount} 个邀请按钮`);
  if (buttonCount > 1) {
    await inviteButtons.nth(1).click({ timeout: 5000 });
  } else if (buttonCount === 1) {
    await inviteButtons.first().click({ timeout: 5000 });
  } else {
    throw new Error('未找到邀请按钮');
  }
  await page.waitForTimeout(2000);

  // 搜索并选择用户
  const phoneInput = page.locator('input[placeholder*="搜索"]').or(page.locator('.uni-easyinput__content-textarea'));
  await phoneInput.first().fill('13588888888');
  await page.waitForTimeout(1500);

  const userItems = page.locator('.user-item');
  await userItems.first().click();
  await page.waitForTimeout(500);

  // 发送邀请
  const confirmButton = page.getByText('确定', { exact: true }).or(page.getByRole('generic').filter({ hasText: '确定' }));
  await confirmButton.first().click();
  await page.waitForTimeout(2000);

  // 3. 导航到监护管理页面
  console.log('👥 导航到监护管理页面...');
  await page.goto('/#/pages/supervisor-manage/supervisor-manage');
  await page.waitForTimeout(PAGE_LOAD_WAIT);

  // 4. 验证"我发起的邀请"section显示正确的信息
  // 滚动到"我发起的邀请"section
  const sectionTitle = page.getByText('我发起的邀请');
  await expect(sectionTitle).toBeVisible();

  // 等待数据加载
  await page.waitForTimeout(2000);

  // 获取邀请列表
  const invitationItems = page.locator('.sent-invitation-item');
  const count = await invitationItems.count();

  expect(count).toBeGreaterThan(0);
  console.log(`✅ 找到 ${count} 个发起的邀请`);

  // 验证第一个邀请项显示的信息
  const firstItem = invitationItems.first();

  // 验证被邀请人名称不是"未知用户"
  const userName = await firstItem.locator('.sent-inv-name').textContent();
  expect(userName).not.toContain('未知用户');
  console.log(`✅ 被邀请人: ${userName}`);

  // 验证规则名称不是"全部规则"
  const ruleName = await firstItem.locator('.sent-inv-rule').textContent();
  expect(ruleName).not.toContain('全部规则');
  console.log(`✅ 规则: ${ruleName}`);

  console.log('✅ 测试通过：我发起的邀请显示正确的信息');
});
