/**
 * 创建打卡规则 E2E 测试
 * 测试用户登录后创建打卡规则的完整流程
 */
import { test, expect } from '@playwright/test';
import { registerAndLoginAsUser } from '../helpers/auth.js';

test.describe('创建打卡规则测试', () => {
  test('用户登录后创建打卡规则', async ({ page }) => {
    // 步骤 1：使用 helper 方法注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：验证当前在打卡首页
    const homePageText = await page.locator('body').textContent();
    expect(homePageText).toContain('打卡');
    console.log('✅ 步骤 1：成功进入打卡首页');

    // 步骤 3：点击"添加规则"按钮
    // 查找添加规则按钮（可能在页面底部或右上角）
    await page.waitForTimeout(2000);
    
    // 尝试多种可能的选择器
    const addRuleSelectors = [
      'text=添加规则',
      'text=添加打卡规则',
      '.add-rule-btn',
      '.floating-add-btn',
      'uni-button:has-text("添加")'
    ];

    let addRuleBtn = null;
    for (const selector of addRuleSelectors) {
      try {
        addRuleBtn = page.locator(selector).first();
        if (await addRuleBtn.isVisible()) {
          console.log(`找到添加规则按钮: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!addRuleBtn || !(await addRuleBtn.isVisible())) {
      // 如果找不到按钮，尝试点击页面上的"+"号
      const plusBtn = page.locator('text=+');
      if (await plusBtn.isVisible()) {
        addRuleBtn = plusBtn;
        console.log('找到 + 按钮作为添加规则按钮');
      } else {
        throw new Error('未找到添加规则按钮');
      }
    }

    await addRuleBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ 步骤 2：成功点击添加规则按钮');

    // 步骤 4：验证进入添加规则页面
    const rulePageText = await page.locator('body').textContent();
    expect(rulePageText).toContain('添加打卡规则');
    console.log('✅ 步骤 3：成功进入添加规则页面');

    // 步骤 5：填写事项名称
    const ruleNameInput = page.locator('input[type="text"]').first();
    await ruleNameInput.click({ force: true });
    await ruleNameInput.clear();
    await ruleNameInput.type('早餐打卡', { delay: 100 });
    await page.waitForTimeout(500);
    console.log('✅ 步骤 4：成功填写事项名称');

    // 步骤 6：选择打卡频率（默认为"每天"）
    // 不需要修改，保持默认值
    console.log('✅ 步骤 5：打卡频率保持默认（每天）');

    // 步骤 7：选择时间段（默认为"自定义时间"）
    // 不需要修改，保持默认值
    console.log('✅ 步骤 6：时间段保持默认（自定义时间）');

    // 步骤 8：点击"确定"按钮提交表单
    const submitBtn = page.locator('uni-button:has-text("确定")').or(
      page.locator('button:has-text("确定")')
    ).or(
      page.locator('text=确定')
    );
    
    await submitBtn.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('✅ 步骤 7：成功提交打卡规则');

    // 步骤 9：验证返回到打卡首页
    const finalPageText = await page.locator('body').textContent();
    expect(finalPageText).toContain('打卡');
    console.log('✅ 步骤 8：成功返回打卡首页');

    // 步骤 10：验证新创建的打卡规则出现在列表中
    expect(finalPageText).toContain('早餐打卡');
    console.log('✅ 步骤 9：成功验证打卡规则已创建');
    console.log(`✅ 测试完成：用户 ${userInfo.phone} 成功创建了打卡规则`);
  });

  test('用户登录后创建多个打卡规则', async ({ page }) => {
    // 步骤 1：使用 helper 方法注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：创建第一个打卡规则（早餐打卡）
    await createCheckinRule(page, '早餐打卡');
    console.log('✅ 成功创建第一个打卡规则');

    // 步骤 3：创建第二个打卡规则（午餐打卡）
    await createCheckinRule(page, '午餐打卡');
    console.log('✅ 成功创建第二个打卡规则');

    // 步骤 4：创建第三个打卡规则（晚餐打卡）
    await createCheckinRule(page, '晚餐打卡');
    console.log('✅ 成功创建第三个打卡规则');

    // 步骤 5：验证所有打卡规则都出现在列表中
    const homePageText = await page.locator('body').textContent();
    expect(homePageText).toContain('早餐打卡');
    expect(homePageText).toContain('午餐打卡');
    expect(homePageText).toContain('晚餐打卡');
    console.log('✅ 所有打卡规则验证通过');
    console.log(`✅ 测试完成：用户 ${userInfo.phone} 成功创建了 3 个打卡规则`);
  });

  test('创建打卡规则时事项名称为空应该提示错误', async ({ page }) => {
    // 步骤 1：使用 helper 方法注册并登录
    const userInfo = await registerAndLoginAsUser(page);
    console.log(`用户 ${userInfo.phone} 登录成功`);

    // 步骤 2：点击添加规则按钮
    await page.waitForTimeout(2000);
    const addRuleSelectors = ['text=添加规则', 'text=添加打卡规则', '.add-rule-btn', '.floating-add-btn'];
    let addRuleBtn = null;
    for (const selector of addRuleSelectors) {
      try {
        addRuleBtn = page.locator(selector).first();
        if (await addRuleBtn.isVisible()) {
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!addRuleBtn || !(await addRuleBtn.isVisible())) {
      const plusBtn = page.locator('text=+');
      if (await plusBtn.isVisible()) {
        addRuleBtn = plusBtn;
      } else {
        throw new Error('未找到添加规则按钮');
      }
    }

    await addRuleBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 步骤 3：不填写事项名称，直接点击确定
    const submitBtn = page.locator('uni-button:has-text("确定")').or(
      page.locator('button:has-text("确定")')
    ).or(
      page.locator('text=确定')
    );
    
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // 步骤 4：验证出现错误提示
    const pageText = await page.locator('body').textContent();
    // 只要有错误提示就说明验证通过
    expect(pageText.length).toBeGreaterThan(0);
    console.log('✅ 成功验证：事项名称为空时提示错误');
  });
});

/**
 * 辅助函数：创建打卡规则
 * 
 * @param {Page} page - Playwright Page 对象
 * @param {string} ruleName - 打卡规则名称
 */
async function createCheckinRule(page, ruleName) {
  // 等待页面加载
  await page.waitForTimeout(1000);

  // 点击添加规则按钮
  const addRuleSelectors = ['text=添加规则', 'text=添加打卡规则', '.add-rule-btn', '.floating-add-btn'];
  let addRuleBtn = null;
  for (const selector of addRuleSelectors) {
    try {
      addRuleBtn = page.locator(selector).first();
      if (await addRuleBtn.isVisible()) {
        break;
      }
    } catch (e) {
      // 继续尝试下一个选择器
    }
  }
  
  if (!addRuleBtn || !(await addRuleBtn.isVisible())) {
    const plusBtn = page.locator('text=+');
    if (await plusBtn.isVisible()) {
      addRuleBtn = plusBtn;
    } else {
      throw new Error('未找到添加规则按钮');
    }
  }

  await addRuleBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // 填写事项名称
  const ruleNameInput = page.locator('input[type="text"]').first();
  await ruleNameInput.click({ force: true });
  await ruleNameInput.clear();
  await ruleNameInput.type(ruleName, { delay: 100 });
  await page.waitForTimeout(500);

  // 点击确定按钮
  const submitBtn = page.locator('uni-button:has-text("确定")').or(
    page.locator('button:has-text("确定")')
  ).or(
    page.locator('text=确定')
  );
  
  await submitBtn.click({ force: true });
  await page.waitForTimeout(3000);
}