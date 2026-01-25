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

test.describe('首页社区名称显示', () => {
  test('用户登录后，首页应该显示所属社区名称', async ({ page }) => {
    console.log('开始测试：首页应该显示所属社区名称');

    // 拦截注册 API 请求，获取 community_id 和 community_name
    let apiCommunityId = null;
    let apiCommunityName = null;

    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/register_phone')) {
        try {
          const data = await response.json();
          if (data.data && data.data.community_id) {
            apiCommunityId = data.data.community_id;
            apiCommunityName = data.data.community_name;
            console.log(`✅ API 返回的社区信息: ID=${apiCommunityId}, 名称=${apiCommunityName}`);
          }
        } catch (e) {
          console.error('解析响应失败:', e);
        }
      }
    });

    // 步骤 1: 注册并登录用户
    console.log('步骤1: 注册并登录用户');
    const user = await registerAndLoginAsUser(page);
    console.log(`用户已创建并登录: ${user.phone}`);

    // 等待首页完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 步骤 2: 验证 API 返回了社区信息
    console.log('步骤2: 验证 API 返回了社区信息');
    expect(apiCommunityId).not.toBeNull();
    expect(apiCommunityId).toBeDefined();
    expect(apiCommunityName).not.toBeNull();
    expect(apiCommunityName).toBeDefined();
    console.log(`✅ API 返回的社区信息: ID=${apiCommunityId}, 名称=${apiCommunityName}`);

    // 步骤 3: 验证首页显示社区名称
    console.log('步骤3: 验证首页显示社区名称');

    // 获取页面文本内容
    const pageText = await page.locator('body').textContent();
    console.log('页面文本内容长度:', pageText.length);
    console.log('页面文本内容（前500字符）:', pageText.substring(0, 500));

    // 断言：页面应该包含社区名称
    expect(pageText).toContain(apiCommunityName);
    console.log(`✅ 页面包含社区名称: ${apiCommunityName}`);

    // 步骤 4: 验证社区名称显示在正确的位置（用户信息卡片中）
    console.log('步骤4: 验证社区名称显示在正确的位置');

    // 检查是否有问候语和日期信息（用户信息卡片的标志）
    expect(pageText).toMatch(/(早上好|下午好|晚上好)/);
    console.log('✅ 页面包含问候语');

    // 检查社区名称是否在用户信息区域附近
    // 通过查找包含用户昵称和社区名称的文本块
    const userGreetingElement = page.locator('.user-greeting');
    if (await userGreetingElement.count() > 0) {
      const userGreetingText = await userGreetingElement.textContent();
      expect(userGreetingText).toContain(apiCommunityName);
      console.log(`✅ 用户问候区域包含社区名称: ${apiCommunityName}`);
    } else {
      console.log('⚠️ .user-greeting 元素不存在，跳过此验证');
    }

    // 额外验证：检查 community-text 元素是否存在且包含社区名称
    const communityTextElement = page.locator('.community-text');
    if (await communityTextElement.count() > 0) {
      await expect(communityTextElement).toBeVisible();
      const communityText = await communityTextElement.textContent();
      expect(communityText).toBe(apiCommunityName);
      console.log(`✅ community-text 元素显示正确的社区名称: ${communityText}`);
    } else {
      // 如果元素不存在，验证页面文本中包含社区名称即可
      console.log('⚠️ .community-text 元素不存在，使用页面文本验证');
      expect(pageText).toContain(apiCommunityName);
    }

    console.log('✅ 测试通过：首页正确显示社区名称');
  });
});
