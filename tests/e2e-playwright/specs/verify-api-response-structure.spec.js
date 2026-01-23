/**
 * Bug复现测试：通过API验证"我发起的邀请"返回的数据结构
 *
 * Bug根因分析：
 * 1. 后端 API 返回的字段是 invitee_info 和 rule_info
 * 2. 前端页面使用的字段是 solo_user 和 rule
 * 3. 字段不匹配导致显示"未知用户"和"全部规则"
 *
 * 这个测试验证后端返回的数据结构是否正确
 */

import { test, expect } from '@playwright/test';
import { loginWithPhoneAndPassword } from '../helpers/auth.js';

test.describe('Bug复现：验证API返回的数据结构', () => {
  test('后端 get_sent_invitations API 应该返回正确的字段', async ({ page }) => {
    // 1. 登录
    await loginWithPhoneAndPassword(page, '19144444444', '123456');
    await page.waitForTimeout(2000);

    // 2. 发送一个邀请（确保有数据）
    await page.goto('/#/pages/rule-setting/rule-setting');
    await page.waitForTimeout(2000);

    const inviteButtons = page.locator('[data-testid="rule-invite-button"]');
    await inviteButtons.nth(1).click();
    await page.waitForTimeout(1000);

    const phoneInput = page.locator('input[placeholder*="搜索"]')
      .or(page.locator('.uni-easyinput__content-textarea'));
    await phoneInput.first().fill('13588888888');
    await page.waitForTimeout(1500);

    const userItems = page.locator('.user-item');
    await userItems.first().click();
    await page.waitForTimeout(500);

    const confirmButton = page.getByText('确定', { exact: true })
      .or(page.getByRole('generic').filter({ hasText: '确定' }));
    await confirmButton.first().click();
    await page.waitForTimeout(2000);

    // 3. 监听API响应
    const apiResponse = [];
    page.on('request', request => {
      if (request.url().includes('/api/supervision/sent-invitations')) {
        console.log(`🔍 API请求: ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/supervision/sent-invitations')) {
        try {
          const data = await response.json();
          console.log('📦 API响应数据:', JSON.stringify(data, null, 2));
          apiResponse.push(data);
        } catch (e) {
          console.log('⚠️ 无法解析JSON响应');
        }
      }
    });

    // 4. 导航到监护管理页面触发API调用
    await page.goto('/#/pages/supervisor-manage/supervisor-manage');
    await page.waitForTimeout(3000);

    // 5. 验证API响应
    console.log(`收到 ${apiResponse.length} 个API响应`);

    if (apiResponse.length > 0) {
      const response = apiResponse[0];

      // 检查响应结构
      if (response.data && response.data.invitations) {
        const invitations = response.data.invitations;

        if (invitations.length > 0) {
          const firstInvitation = invitations[0];

          console.log('🔍 第一个邀请的数据结构:');
          console.log(JSON.stringify(firstInvitation, null, 2));

          // 验证后端返回的字段
          test.expect(firstInvitation).toHaveProperty('invitee_info');
          test.expect(firstInvitation).toHaveProperty('rule_info');

          // 验证被邀请人信息存在
          const inviteeInfo = firstInvitation.invitee_info;
          test.expect(inviteeInfo).toHaveProperty('nickname');
          test.expect(inviteeInfo.nickname).not.toBe('');

          // 验证规则信息存在
          const ruleInfo = firstInvitation.rule_info;
          test.expect(ruleInfo).toHaveProperty('rule_name');
          test.expect(ruleInfo.rule_name).not.toBe('');

          console.log('✅ 后端返回正确的数据结构');
          console.log(`  - 被邀请人: ${inviteeInfo.nickname}`);
          console.log(`  - 规则: ${ruleInfo.rule_name}`);
        }
      }
    }
  });
});
