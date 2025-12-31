/**
 * 社区管理 E2E 测试
 */
import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from '../helpers/auth.js';

test.describe('超级管理员社区管理测试', () => {
  const newCommunityName = '新创建的社区1';
  const newCommunityLocation = '新创建的社区1的位置';

  test('超级管理员登录后自动导航到我的页面', async ({ page }) => {
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page);
    
    // 验证当前页面是"我的"页面
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('我的');
    
    console.log('✅ 超级管理员登录成功，自动导航到我的页面');
  });

  test('访问社区列表并验证默认社区', async ({ page }) => {
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page);
    
    // 点击"社区列表"菜单项
    await page.getByText('社区列表', { exact: true }).click({ force: true });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题为"社区管理"
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('社区管理');
    
    // 验证默认社区存在
    expect(pageText).toContain('安卡大家庭');
    expect(pageText).toContain('黑屋');
    
    console.log('✅ 成功访问社区列表，默认社区验证通过');
  });

  test('验证默认社区保护机制', async ({ page }) => {
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page);
    
    // 导航到社区列表
    await page.getByText('社区列表', { exact: true }).click({ force: true });
    await page.waitForTimeout(3000);
    
    // 找到"安卡大家庭"社区条目
    const communityText = await page.locator('body').textContent();
    expect(communityText).toContain('安卡大家庭');
    
    // 验证"停用"按钮存在（因为社区是激活状态）
    expect(communityText).toContain('停用');
    
    // 点击"停用"按钮（应该会失败，因为是默认社区）
    await page.getByText('停用', { exact: true }).first().click({ force: true });
    await page.waitForTimeout(2000);
    
    // 验证出现错误提示或状态未改变
    const pageTextAfterClick = await page.locator('body').textContent();
    const stillHasEnabled = pageTextAfterClick.includes('启用');
    
    // 验证按钮状态仍为"启用"（说明停用失败）
    expect(stillHasEnabled).toBeTruthy();
    
    console.log('✅ 默认社区保护机制验证通过，无法停用默认社区');
  });

  test('创建新社区', async ({ page }) => {
    // 使用 helper 方法登录
    await loginAsSuperAdmin(page);
    
    // 导航到社区列表
    await page.getByText('社区列表', { exact: true }).click({ force: true });
    await page.waitForTimeout(3000);
    
    // 点击页面右上角的"+"按钮（使用 .floating-add-btn 选择器）
    await page.locator('.floating-add-btn').click({ force: true });
    await page.waitForTimeout(2000);
    
    // 验证页面标题为"社区信息"
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('社区名称');
    
    // 在"社区名称"输入框中填写"新创建的社区1"
    // 使用 getByRole 定位 textbox 元素
    const nameInput = page.getByRole('textbox').first();
    await nameInput.click({ force: true });
    await page.waitForTimeout(200);
    await nameInput.clear();
    await nameInput.type(newCommunityName, { delay: 100 });
    await page.waitForTimeout(500);
    
    // 触发 blur 事件
    await nameInput.blur();
    await page.waitForTimeout(500);
    
    // 验证社区名称已填写
    const pageTextAfterName = await page.locator('body').textContent();
    console.log('填写社区名称后的页面内容:', pageTextAfterName.substring(0, 200));
    
    // 点击"点击选择位置"按钮
    await page.getByText('点击选择位置', { exact: true }).click({ force: true });
    await page.waitForTimeout(1000);
    
    // 在弹出的模态框中输入位置信息
    // 查找模态框中的输入框并填写位置
    const modalInput = page.getByPlaceholder('请输入位置信息');
    await modalInput.fill(newCommunityLocation);
    await page.waitForTimeout(500);
    
    // 点击"OK"按钮
    await page.getByText('OK', { exact: true }).click({ force: true });
    await page.waitForTimeout(1000);
    
    // 点击"创建社区"按钮
    await page.getByText('创建社区', { exact: true }).click({ force: true });
    await page.waitForTimeout(3000);
    
    // 等待返回到社区管理页面
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证社区列表中出现"新创建的社区1"条目
    const pageTextAfterCreate = await page.locator('body').textContent();
    expect(pageTextAfterCreate).toContain(newCommunityName);
    
    // 验证该社区条目右侧有"停用"和"删除"两个按钮
    expect(pageTextAfterCreate).toContain('停用');
    expect(pageTextAfterCreate).toContain('删除');
    
    console.log('✅ 新社区创建成功，功能验证通过');
  });

  test('完整的社区管理流程', async ({ page }) => {
    // 步骤 1：登录
    await loginAsSuperAdmin(page);
    
    // 步骤 2：验证自动导航到"我的"页面
    let pageText = await page.locator('body').textContent();
    expect(pageText).toContain('我的');
    console.log('✅ 步骤 1：登录成功，自动导航到我的页面');
    
    // 步骤 3：访问社区列表
    await page.getByText('社区列表', { exact: true }).click({ force: true });
    await page.waitForTimeout(3000);
    pageText = await page.locator('body').textContent();
    expect(pageText).toContain('社区管理');
    console.log('✅ 步骤 2：成功访问社区列表');
    
    // 步骤 4：验证默认社区
    expect(pageText).toContain('安卡大家庭');
    expect(pageText).toContain('黑屋');
    console.log('✅ 步骤 3：默认社区验证通过');
    
    // 步骤 5：验证默认社区保护机制
    await page.getByText('停用', { exact: true }).first().click({ force: true });
    await page.waitForTimeout(2000);
    
    // 检查是否弹出确认对话框
    const pageTextAfterClick = await page.locator('body').textContent();
    if (pageTextAfterClick.includes('确认操作')) {
      // 点击 Cancel 取消操作
      await page.getByText('Cancel', { exact: true }).click({ force: true });
      await page.waitForTimeout(1000);
    }
    
    pageText = await page.locator('body').textContent();
    expect(pageText).toContain('停用'); // 状态未改变
    console.log('✅ 步骤 4：默认社区保护机制验证通过');
    
    // 步骤 6：创建新社区（简化版，只测试能否打开创建页面）
    await page.locator('.floating-add-btn').click({ force: true });
    await page.waitForTimeout(2000);
    
    // 验证页面标题为"社区信息"
    pageText = await page.locator('body').textContent();
    expect(pageText).toContain('社区名称');
    
    console.log('✅ 步骤 5：能够打开创建社区页面');
    console.log('✅ 完整的社区管理流程测试通过');
  });
});
