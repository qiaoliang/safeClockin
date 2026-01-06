/**
 * 首页社区名称显示测试
 * 
 * 测试目标：验证用户登录后，在首页（home-solo）上部的用户信息卡片中显示用户所属的社区名称
 * 
 * TDD 原则：
 * - RED: 先写失败的测试
 * - GREEN: 编写最小代码使测试通过
 * - REFACTOR: 清理代码
 */
import { test, expect } from '@playwright/test';
import { registerAndLoginAsUser } from '../helpers/auth.js';
import { getUserProfile } from '../helpers/user-info.js';

test.describe('首页社区名称显示', () => {
  test('用户登录后，首页应该显示所属社区名称', async ({ page }) => {
    console.log('开始测试：首页应该显示所属社区名称');

    // 步骤 1: 注册并登录用户
    console.log('步骤1: 注册并登录用户');
    const user = await registerAndLoginAsUser(page);
    console.log(`用户已创建并登录: ${user.phone}`);

    // 等待首页完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 步骤 2: 获取用户信息，验证社区信息存在
    console.log('步骤2: 获取用户信息，验证社区信息存在');
    const userProfile = await getUserProfile(page);
    console.log('用户信息:', JSON.stringify(userProfile, null, 2));

    // 断言：用户信息应该存在
    expect(userProfile).not.toBeNull();
    expect(userProfile.community_id).not.toBeNull();
    expect(userProfile.community_name).not.toBeNull();
    console.log(`✅ 用户社区信息: ID=${userProfile.community_id}, 名称=${userProfile.community_name}`);

    // 步骤 3: 验证首页显示社区名称
    console.log('步骤3: 验证首页显示社区名称');
    
    // 获取页面文本内容
    const pageText = await page.locator('body').textContent();
    console.log('页面文本内容长度:', pageText.length);
    console.log('页面文本内容（前500字符）:', pageText.substring(0, 500));

    // 断言：页面应该包含社区名称
    expect(pageText).toContain(userProfile.community_name);
    console.log(`✅ 页面包含社区名称: ${userProfile.community_name}`);

    // 步骤 4: 验证社区名称显示在正确的位置（用户信息卡片中）
    console.log('步骤4: 验证社区名称显示在正确的位置');
    
    // 检查是否有问候语和日期信息（用户信息卡片的标志）
    expect(pageText).toMatch(/(早上好|下午好|晚上好)/);
    console.log('✅ 页面包含问候语');

    // 检查社区名称是否在用户信息区域附近
    // 通过查找包含用户昵称和社区名称的文本块
    const userGreetingText = await page.locator('.user-greeting').textContent();
    expect(userGreetingText).toContain(userProfile.community_name);
    console.log(`✅ 用户问候区域包含社区名称: ${userProfile.community_name}`);

    // 额外验证：检查 community-text 元素是否存在且包含社区名称
    const communityTextElement = page.locator('.community-text');
    await expect(communityTextElement).toBeVisible();
    const communityText = await communityTextElement.textContent();
    expect(communityText).toBe(userProfile.community_name);
    console.log(`✅ community-text 元素显示正确的社区名称: ${communityText}`);

    console.log('✅ 测试通过：首页正确显示社区名称');
  });
});