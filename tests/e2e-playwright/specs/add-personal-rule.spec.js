/**
 * 添加个人打卡规则 E2E 测试
 * 测试用户登录后添加个人打卡规则的完整流程
 */
import { test, expect } from '@playwright/test';
import { registerAndLoginAsUser } from '../helpers/auth.js';

test.describe('添加个人打卡规则测试', () => {
  test('用户登录后添加个人打卡规则', async ({ page }) => {
    // 步骤 1：使用 helper 方法注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：验证当前在打卡首页
    const homePageText = await page.locator('body').textContent();
    expect(homePageText).toContain('打卡');
    console.log('✅ 步骤 1：成功进入打卡首页');

    // 步骤 3：点击页面中部的"查看规则"
    await page.waitForTimeout(3000);
    
    // 点击包含"查看规则"文本的元素
    await page.getByText('查看规则', { exact: true }).click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ 步骤 2：成功点击"查看规则"');

    // 步骤 4：验证导航到"打卡规则"页面
    const rulePageText = await page.locator('body').textContent();
    expect(rulePageText).toContain('打卡规则');
    console.log('✅ 步骤 3：成功进入打卡规则页面');

    // 步骤 5：点击页面下方的"+添加个人规则"按钮
    const addPersonalRuleSelector = 'text=添加个人规则';
    await page.locator(addPersonalRuleSelector).click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ 步骤 4：成功点击"+添加个人规则"');

    // 步骤 6：验证导航到"添加规则"页面
    const addRulePageText = await page.locator('body').textContent();
    expect(addRulePageText).toContain('添加打卡规则');
    console.log('✅ 步骤 5：成功进入添加规则页面');

    // 步骤 7：找到包含"请输入事项名称"字样的输入框并填写
    const ruleName = `我新创建的规则 --${userInfo.phone}`;
    
    // 查找包含"请输入事项名称"的输入框
    const ruleNameInput = page.locator('input[type="text"]').first();
    await ruleNameInput.click({ force: true });
    await ruleNameInput.clear();
    await ruleNameInput.type(ruleName, { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 步骤 6：成功填写规则名称');

    // 步骤 8：点击"添加规则"按钮
    const submitBtn = page.locator('uni-button.submit-btn:has-text("添加规则")').or(
      page.locator('button.submit-btn:has-text("添加规则")')
    );
    
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);
    console.log('✅ 步骤 7：成功点击"添加规则"按钮');

    // 步骤 9：在弹出的对话框中点击"确定"
    const confirmBtn = page.locator('uni-button.modal-confirm-btn:has-text("确定")').or(
      page.locator('button.modal-confirm-btn:has-text("确定")')
    );
    
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('✅ 步骤 8：成功点击"确定"');

    // 步骤 10：等待返回到"打卡规则"页面
    await page.waitForTimeout(2000);
    const finalPageText = await page.locator('body').textContent();
    expect(finalPageText).toContain('打卡规则');
    console.log('✅ 步骤 9：成功返回打卡规则页面');

    // 步骤 11：验证新创建的规则出现在列表中
    expect(finalPageText).toContain(ruleName);
    console.log('✅ 步骤 10：成功验证规则已创建');

    // 步骤 12：验证规则条目右侧有"编辑"、"删除"、"邀请"三个按钮
    expect(finalPageText).toContain('编辑');
    expect(finalPageText).toContain('删除');
    expect(finalPageText).toContain('邀请');
    console.log('✅ 步骤 11：成功验证规则操作按钮');
    console.log(`✅ 测试完成：用户 ${userInfo.phone} 成功创建了个人打卡规则`);
  });

  test('添加个人规则后能够编辑规则', async ({ page }) => {
    // 步骤 1：注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：导航到打卡规则页面
    await page.waitForTimeout(3000);
    
    // 点击包含"查看规则"文本的元素
    await page.getByText('查看规则', { exact: true }).click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 3：添加个人规则
    await page.locator('text=添加个人规则').click({ force: true });
    await page.waitForTimeout(2000);

    const ruleName = `测试编辑规则 --${userInfo.phone}`;
    await page.locator('input[type="text"]').first().fill(ruleName);
    await page.waitForTimeout(500);

    await page.locator('uni-button.submit-btn:has-text("添加规则")').click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('uni-button.modal-confirm-btn:has-text("确定")').click({ force: true });
    
    // 等待返回到"打卡规则"页面
    await page.waitForTimeout(4000);
    const rulePageText = await page.locator('body').textContent();
    expect(rulePageText).toContain('打卡规则');
    
    // 验证规则创建成功
    expect(rulePageText).toContain(ruleName);
    console.log('✅ 规则创建成功');

    // 步骤 5：点击"编辑"按钮
    await page.waitForTimeout(2000);
    await page.getByText('编辑', { exact: true }).click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 6：验证进入编辑页面
    const editPageText = await page.locator('body').textContent();
    expect(editPageText).toContain('编辑打卡规则');
    console.log('✅ 成功进入编辑页面');

    // 步骤 7：修改规则名称
    const updatedRuleName = `${ruleName}（已编辑）`;
    await page.locator('input[type="text"]').first().click({ force: true });
    await page.locator('input[type="text"]').first().clear();
    await page.locator('input[type="text"]').first().type(updatedRuleName, { delay: 100 });
    await page.waitForTimeout(500);

    // 步骤 8：点击"更新规则"按钮
    await page.locator('uni-button:has-text("更新规则")').click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('uni-button.modal-confirm-btn:has-text("确定")').click({ force: true });
    await page.waitForTimeout(3000);

    // 步骤 9：验证规则更新成功
    const finalPageText = await page.locator('body').textContent();
    expect(finalPageText).toContain(updatedRuleName);
    console.log('✅ 规则更新成功');
    console.log(`✅ 测试完成：用户 ${userInfo.phone} 成功编辑了个人打卡规则`);
  });

  test('添加个人规则后能够删除规则', async ({ page }) => {
    // 步骤 1：注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：导航到打卡规则页面
    await page.waitForTimeout(3000);
    
    // 点击包含"查看规则"文本的元素
    await page.getByText('查看规则', { exact: true }).click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 3：添加个人规则
    await page.locator('text=添加个人规则').click({ force: true });
    await page.waitForTimeout(2000);

    const ruleName = `测试删除规则 --${userInfo.phone}`;
    await page.locator('input[type="text"]').first().fill(ruleName);
    await page.waitForTimeout(500);

    await page.locator('uni-button.submit-btn:has-text("添加规则")').click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('uni-button.modal-confirm-btn:has-text("确定")').click({ force: true });
    
    // 等待返回到"打卡规则"页面
    await page.waitForTimeout(4000);
    const rulePageText = await page.locator('body').textContent();
    expect(rulePageText).toContain('打卡规则');
    
    // 验证规则创建成功
    expect(rulePageText).toContain(ruleName);
    console.log('✅ 规则创建成功');

    // 步骤 5：点击"删除"按钮
    await page.waitForTimeout(2000);
    await page.getByText('删除', { exact: true }).click({ force: true });
    await page.waitForTimeout(1000);

    // 步骤 6：在删除确认弹窗中点击"删除"
    await page.locator('uni-button.modal-confirm-btn:has-text("删除")').click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 7：验证规则已删除
    const finalPageText = await page.locator('body').textContent();
    expect(finalPageText).not.toContain(ruleName);
    console.log('✅ 规则删除成功');
    console.log(`✅ 测试完成：用户 ${userInfo.phone} 成功删除了个人打卡规则`);
  });
});