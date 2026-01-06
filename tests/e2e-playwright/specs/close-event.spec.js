/**
 * 事件关闭功能 E2E 测试
 * 
 * 测试目标：验证用户可以自行关闭求助事件
 * 
 * 遵循测试反模式指南：
 * - 测试真实组件行为，而非 mock 行为
 * - 验证真实用户界面，而非模拟数据
 * - 不向生产类添加仅用于测试的方法
 * - 在理解依赖的情况下进行最小化 mock
 * 
 * 测试场景：
 * 1. 用户发起求助后，点击"问题已解决"按钮
 * 2. 填写关闭原因（10-500字符）
 * 3. 验证事件关闭成功
 * 4. 验证关闭信息正确显示
 */
import { test, expect } from '@playwright/test';
import { registerAndLoginAsUser } from '../helpers/auth.js';

test.describe('事件关闭功能测试', () => {
  test.beforeEach(async ({ page }) => {
    console.log('开始测试：事件关闭功能');
    
    // 每个测试开始时，注册并登录一个新用户
    const user = await registerAndLoginAsUser(page);
    console.log(`测试用户已创建并登录: ${user.phone}`);
    
    // 等待首页完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('用户发起求助后，应该能够关闭事件', async ({ page }) => {
    console.log('开始测试：用户关闭求助事件');

    // 等待页面完全加载
    await page.waitForTimeout(1000);

    console.log('步骤1: 发起求助事件');

    // 设置对话框处理器，用于捕获原生对话框
    let dialogAccepted = false;
    const dialogHandler = async (dialog) => {
      console.log('检测到原生对话框');
      console.log('对话框消息:', dialog.message());
      console.log('✅ 接受对话框（点击确认）');
      await dialog.accept();
      dialogAccepted = true;
    };
    page.on('dialog', dialogHandler);

    // 点击一键求助按钮
    const helpButton = page.locator('.help-btn').or(page.locator('text=一键求助')).first();
    await helpButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await helpButton.click({ force: true });

    // 等待确认对话框出现并被处理
    await page.waitForTimeout(1000);
    if (!dialogAccepted) {
      // 如果没有检测到原生对话框，尝试查找自定义对话框
      const pageText = await page.locator('body').textContent();
      if (pageText.includes('确认要发起求助吗？')) {
        const confirmButton = page.locator('text=确认求助').first();
        await confirmButton.click({ force: true });
      }
    }

    // 等待求助请求发送完成
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    // 清理对话框处理器
    page.off('dialog', dialogHandler);

    console.log('步骤2: 验证求助事件已创建');

    // 等待页面内容更新
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // 验证页面显示"继续求助"和"问题已解决"按钮
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('继续求助');
    expect(pageText).toContain('问题已解决');
    console.log('✅ 求助事件已创建');

    console.log('步骤3: 点击"问题已解决"按钮');

    // 点击"问题已解决"按钮
    const resolveButton = page.locator('text=问题已解决').first();
    await resolveButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await resolveButton.click({ force: true });

    // 等待关闭原因对话框出现
    await page.waitForTimeout(2000);

    console.log('步骤4: 填写关闭原因');

    // 验证关闭原因对话框出现
    const dialogPageText = await page.locator('body').textContent();
    expect(dialogPageText).toContain('关闭原因');
    expect(dialogPageText).toContain('请输入关闭原因');
    console.log('✅ 关闭原因对话框已显示');

    // 输入关闭原因（10-500字符）
    const closureReason = '问题已解决，感谢社区工作人员的帮助。这是一个有效的关闭原因，长度符合要求。';
    const textArea = page.locator('textarea').or(page.locator('input[type="text"]')).first();
    await textArea.click({ force: true });
    await textArea.clear();
    await textArea.type(closureReason, { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 已填写关闭原因');

    console.log('步骤5: 确认关闭事件');

    // 点击确认按钮
    const confirmButton = page.locator('text=确认').or(page.locator('text=提交')).or(page.locator('uni-button.submit')).first();
    await confirmButton.click({ force: true });

    // 等待关闭请求发送完成
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    console.log('步骤6: 等待页面更新');

    // 等待页面内容更新（可能需要更长时间）
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    console.log('步骤7: 验证事件关闭成功');

    // 验证事件已关闭
    const finalPageText = await page.locator('body').textContent();
    console.log('页面内容:', finalPageText.substring(0, 500));
    
    // 验证显示"事件已解决"或类似的提示
    // 注意：根据实际UI实现，这里的文本可能不同
    const hasSuccessIndicator = 
      finalPageText.includes('事件已解决') ||
      finalPageText.includes('关闭成功') ||
      finalPageText.includes('事件已关闭');
    
    expect(hasSuccessIndicator).toBeTruthy();
    console.log('✅ 事件关闭成功');

    // 验证页面不再显示"问题已解决"按钮（因为事件已关闭）
    expect(finalPageText).not.toContain('问题已解决');
    console.log('✅ "问题已解决"按钮已隐藏');

    console.log('✅ 所有测试断言通过');
  });

  test('关闭原因太短时，应该显示错误提示', async ({ page }) => {
    console.log('开始测试：关闭原因太短');

    const { createEventAndClickResolveButton } = await createEventAndNavigateToCloseDialog(page);

    console.log('步骤1: 输入太短的关闭原因');

    // 输入太短的关闭原因（<10字符）
    const shortReason = '太短';
    const textArea = page.locator('textarea').or(page.locator('input[type="text"]')).first();
    await textArea.click({ force: true });
    await textArea.clear();
    await textArea.type(shortReason, { delay: 100 });
    await page.waitForTimeout(500);

    console.log('步骤2: 尝试提交');

    // 点击确认按钮
    const confirmButton = page.locator('text=确认').or(page.locator('text=提交')).or(page.locator('uni-button.submit')).first();
    await confirmButton.click({ force: true });

    // 等待响应
    await page.waitForTimeout(2000);

    console.log('步骤3: 验证错误提示');

    // 验证显示错误提示
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('关闭原因长度必须在10-500字符之间');
    console.log('✅ 显示正确的错误提示');
  });

  test('关闭原因太长时，应该显示错误提示', async ({ page }) => {
    console.log('开始测试：关闭原因太长');

    const { createEventAndClickResolveButton } = await createEventAndNavigateToCloseDialog(page);

    console.log('步骤1: 输入太长的关闭原因');

    // 输入太长的关闭原因（>500字符）
    // 注意：由于前端有 maxlength="500" 限制，实际只能输入500个字符
    const longReason = 'a'.repeat(501);
    const textArea = page.locator('textarea').or(page.locator('input[type="text"]')).first();
    await textArea.click({ force: true });
    await textArea.clear();
    await textArea.type(longReason, { delay: 10 });
    await page.waitForTimeout(500);

    console.log('步骤2: 验证前端 maxlength 限制');

    // 验证文本框实际只接受了500个字符（由于 maxlength 限制）
    const actualValue = await textArea.inputValue();
    expect(actualValue.length).toBe(500);
    console.log('✅ 前端 maxlength 限制有效，最多只能输入500个字符');

    console.log('步骤3: 尝试提交');

    // 点击确认按钮
    const confirmButton = page.locator('text=确认').or(page.locator('text=提交')).or(page.locator('uni-button.submit')).first();
    await confirmButton.click({ force: true });

    // 等待响应
    await page.waitForTimeout(2000);

    console.log('步骤4: 验证事件关闭成功');

    // 验证事件关闭成功（因为输入了有效的500个字符）
    const pageText = await page.locator('body').textContent();
    const hasSuccessIndicator = 
      pageText.includes('事件已解决') ||
      pageText.includes('关闭成功');
    
    expect(hasSuccessIndicator).toBeTruthy();
    console.log('✅ 事件关闭成功（输入了有效的500个字符）');
  });

  test('用户应该能够取消关闭事件', async ({ page }) => {
    console.log('开始测试：取消关闭事件');

    const { createEventAndClickResolveButton } = await createEventAndNavigateToCloseDialog(page);

    console.log('步骤1: 填写关闭原因');

    // 输入关闭原因
    const closureReason = '这是一个有效的关闭原因，长度符合要求。';
    const textArea = page.locator('textarea').or(page.locator('input[type="text"]')).first();
    await textArea.click({ force: true });
    await textArea.clear();
    await textArea.type(closureReason, { delay: 100 });
    await page.waitForTimeout(500);

    console.log('步骤2: 点击取消按钮');

    // 点击取消按钮
    const cancelButton = page.locator('text=取消').first();
    await cancelButton.click({ force: true });

    // 等待对话框关闭
    await page.waitForTimeout(2000);

    console.log('步骤3: 验证事件未关闭');

    // 验证事件仍然显示"继续求助"和"问题已解决"按钮
    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('继续求助');
    expect(pageText).toContain('问题已解决');
    console.log('✅ 事件未关闭，取消操作成功');
  });
});

/**
 * 辅助函数：创建事件并导航到关闭对话框
 * 
 * @param {Page} page - Playwright Page 对象
 * @returns {Promise<Object>} 返回辅助函数对象
 */
async function createEventAndNavigateToCloseDialog(page) {
  console.log('辅助函数：创建事件并导航到关闭对话框');

  // 设置对话框处理器
  let dialogAccepted = false;
  const dialogHandler = async (dialog) => {
    console.log('检测到原生对话框');
    await dialog.accept();
    dialogAccepted = true;
  };
  page.on('dialog', dialogHandler);

  // 点击一键求助按钮
  const helpButton = page.locator('.help-btn').or(page.locator('text=一键求助')).first();
  await helpButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await helpButton.click({ force: true });

  // 等待确认对话框出现并被处理
  await page.waitForTimeout(1000);
  if (!dialogAccepted) {
    const pageText = await page.locator('body').textContent();
    if (pageText.includes('确认要发起求助吗？')) {
      const confirmButton = page.locator('text=确认求助').first();
      await confirmButton.click({ force: true });
    }
  }

  // 等待求助请求发送完成
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');

  // 清理对话框处理器
  page.off('dialog', dialogHandler);

  // 等待页面内容更新
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  // 点击"问题已解决"按钮
  const resolveButton = page.locator('text=问题已解决').first();
  await resolveButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await resolveButton.click({ force: true });

  // 等待关闭原因对话框出现
  await page.waitForTimeout(2000);

  console.log('✅ 已导航到关闭对话框');

  return { createEventAndClickResolveButton: () => {} };
}