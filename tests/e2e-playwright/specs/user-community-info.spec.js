/**
 * 用户社区信息验证测试
 * 
 * 测试目标：验证用户注册后，前端应该正确保存用户的社区信息
 * 
 * TDD 原则：
 * - 先写测试，观察失败
 * - 修复生产代码使测试通过
 * - 重构（如果需要）
 * 
 * 问题：用户注册后，后端已将用户分配到默认社区，但前端的 userState 中没有 community_id 字段
 */
import { test, expect } from '@playwright/test';
import { registerAndLoginAsUser } from '../helpers/auth.js';
import { getUserProfile } from '../helpers/user-info.js';

test.describe('用户社区信息验证', () => {
  test('用户注册后应该有 community_id 字段', async ({ page }) => {
    console.log('开始测试：用户注册后应该有 community_id 字段');

    // 注册并登录用户
    const user = await registerAndLoginAsUser(page);
    console.log(`用户已创建并登录: ${user.phone}`);

    // 等待首页完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // === 第一步：验证页面显示社区信息（如果页面能显示，说明数据存在）===
    console.log('\n=== 第一步：验证页面显示社区信息 ===');

    // 检查页面上是否有任何文本包含"安卡大家庭"或"社区"
    const pageText = await page.content();
    console.log('📄 页面完整文本（前500字符）:', pageText.substring(0, 500));

    // 检查是否有"安卡大家庭"或"社区"相关文本
    const hasCommunityText = pageText.includes('安卡大家庭') || pageText.includes('社区');
    console.log(f"✅ 页面包含社区相关文本: {hasCommunityText}");

    // === 第二步：验证 userState 中的 community_id ===
    console.log('\n=== 第二步：验证 userState 中的 community_id ===');

    // 使用 helper 方法获取用户信息（包括加密数据）
    console.log('获取用户的完整信息');
    const userProfile = await getUserProfile(page);

    console.log('用户信息检查结果:', JSON.stringify(userProfile, null, 2));

    // 断言：用户信息应该存在
    expect(userProfile).not.toBeNull();
    console.log('✅ 用户信息存在');

    // 断言：profile 应该包含所有必需字段
    expect(userProfile.userId).toBeTruthy();
    expect(userProfile.nickname).toBeTruthy();
    console.log(`✅ 用户ID: ${userProfile.userId}, 昵称: ${userProfile.nickname}`);

    // 断言：community_id 应该存在且不为 null
    // 这是测试的核心目标
    expect(userProfile.community_id).not.toBeNull();
    expect(userProfile.community_id).toBeDefined();
    console.log(`✅ community_id 存在: ${userProfile.community_id}`);

    // 断言：community_name 应该存在
    expect(userProfile.community_name).not.toBeNull();
    expect(userProfile.community_name).toBeDefined();
    console.log(`✅ community_name 存在: ${userProfile.community_name}`);

    console.log('✅ 测试通过：用户注册后有正确的社区信息');
  });
});