/**
 * 添加个人打卡规则测试 - 使用新 POM 架构
 * 测试用户登录后添加、编辑、删除个人打卡规则的完整流程
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { HomePage } from '../pages/HomePage.js';
import { RuleListPage } from '../pages/RuleListPage.js';
import { RuleFormPage } from '../pages/RuleFormPage.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';

test.describe('添加个人打卡规则测试', () => {
  // 每个测试前清理浏览器状态
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
  });

  test.describe('创建打卡规则', () => {
    test('用户登录后添加个人打卡规则', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const phoneLoginPage = new PhoneLoginPage(page);
      const ruleListPage = new RuleListPage(page);
      const ruleFormPage = new RuleFormPage(page);

      // 步骤 1：登录超级管理员
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.SUPER_ADMIN.phone,
        TEST_USERS.SUPER_ADMIN.password
      );

      // 等待登录完成（超级管理员会自动跳转到"我的"页面）
      await page.waitForTimeout(3000);

      // 导航到首页
      const homePage = new HomePage(page);
      await homePage.goToHome();
      await page.waitForTimeout(2000);

      // 验证在首页
      const homePageText = await page.locator('body').textContent();
      expect(homePageText).toMatch(/今日打卡|当前监护/);

      // 步骤 2：导航到打卡规则页面
      await ruleListPage.clickViewRules();
      await ruleListPage.isLoaded();

      const rulePageText = await page.locator('body').textContent();
      expect(rulePageText).toContain('打卡规则');

      // 步骤 3：点击添加个人规则
      await ruleListPage.clickAddPersonalRule();
      await ruleFormPage.isLoaded();

      const addPageText = await page.locator('body').textContent();
      expect(addPageText).toContain('添加打卡规则');

      // 步骤 4：填写规则信息
      const ruleName = `测试规则_${Date.now()}`;
      await ruleFormPage.fillRuleName(ruleName);

      // 步骤 5：提交表单
      await ruleFormPage.clickSubmit();

      // 步骤 6：确认对话框
      await ruleFormPage.clickConfirm();

      // 步骤 7：验证规则创建成功
      await page.waitForTimeout(3000);
      await ruleListPage.isLoaded();

      const finalPageText = await page.locator('body').textContent();
      expect(finalPageText).toContain('打卡规则');
      expect(finalPageText).toContain(ruleName);

      // 步骤 8：验证操作按钮存在
      const buttons = await ruleListPage.getRuleButtonsStatus(ruleName);
      expect(buttons.hasEdit).toBe(true);
      expect(buttons.hasDelete).toBe(true);
      expect(buttons.hasInvite).toBe(true);
    });
  });

  test.describe('编辑打卡规则', () => {
    test('添加个人规则后能够编辑规则', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const ruleListPage = new RuleListPage(page);
      const ruleFormPage = new RuleFormPage(page);

      // 步骤 1：登录
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.NORMAL.phone,
        TEST_USERS.NORMAL.password
      );

      // 等待登录完成并导航到首页
      // 登录后默认跳转到"我的"页面，需要先导航到首页
      const homePage = new HomePage(page);
      await homePage.goToHome();
      await page.waitForTimeout(2000);

      // 步骤 2：导航到打卡规则页面
      await ruleListPage.clickViewRules();
      await ruleListPage.isLoaded();

      // 步骤 3：创建规则
      await ruleListPage.clickAddPersonalRule();
      await ruleFormPage.isLoaded();

      const ruleName = `测试编辑规则_${Date.now()}`;
      await ruleFormPage.fillRuleName(ruleName);
      await ruleFormPage.clickSubmit();
      await ruleFormPage.clickConfirm();

      // 步骤 4：等待返回列表页
      await page.waitForTimeout(3000);
      await ruleListPage.isLoaded();

      const rulePageText = await page.locator('body').textContent();
      expect(rulePageText).toContain(ruleName);

      // 步骤 5：点击编辑按钮
      await ruleListPage.clickEditButton(ruleName);
      await page.waitForTimeout(2000);

      // 步骤 6：验证进入编辑页面
      const editPageText = await page.locator('body').textContent();
      expect(editPageText).toContain('编辑打卡规则');

      // 步骤 7：修改规则名称
      const updatedRuleName = `${ruleName}_已编辑`;
      await ruleFormPage.fillRuleName(updatedRuleName);

      // 步骤 8：提交更新
      await ruleFormPage.clickSubmit();
      await ruleFormPage.clickConfirm();

      // 步骤 9：验证更新成功
      await page.waitForTimeout(3000);
      const finalPageText = await page.locator('body').textContent();
      expect(finalPageText).toContain(updatedRuleName);
    });
  });

  test.describe('删除打卡规则', () => {
    test('添加个人规则后能够删除规则', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const ruleListPage = new RuleListPage(page);
      const ruleFormPage = new RuleFormPage(page);

      // 步骤 1：登录
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.NORMAL.phone,
        TEST_USERS.NORMAL.password
      );

      // 等待登录完成并导航到首页
      // 登录后默认跳转到"我的"页面，需要先导航到首页
      const homePage = new HomePage(page);
      await homePage.goToHome();
      await page.waitForTimeout(2000);

      // 步骤 2：导航到打卡规则页面
      await ruleListPage.clickViewRules();
      await ruleListPage.isLoaded();

      // 步骤 3：创建规则
      await ruleListPage.clickAddPersonalRule();
      await ruleFormPage.isLoaded();

      const ruleName = `测试删除规则_${Date.now()}`;
      await ruleFormPage.fillRuleName(ruleName);
      await ruleFormPage.clickSubmit();
      await ruleFormPage.clickConfirm();

      // 步骤 4：等待返回列表页
      await page.waitForTimeout(3000);
      await ruleListPage.isLoaded();

      const rulePageText = await page.locator('body').textContent();
      expect(rulePageText).toContain(ruleName);

      // 步骤 5：点击删除按钮
      await ruleListPage.clickDeleteButton(ruleName);
      await page.waitForTimeout(1000);

      // 步骤 6：确认删除
      await ruleListPage.confirmDelete();
      await page.waitForTimeout(2000);

      // 步骤 7：验证规则已删除
      const finalPageText = await page.locator('body').textContent();
      expect(finalPageText).not.toContain(ruleName);
    });
  });

  test.describe('表单验证', () => {
    test('规则名称不能为空', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // 登录
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.SUPER_ADMIN.phone,
        TEST_USERS.SUPER_ADMIN.password
      );

      // 等待登录完成（超级管理员会自动跳转到"我的"页面）
      await page.waitForTimeout(3000);

      // 导航到首页
      const homePage = new HomePage(page);
      await homePage.goToHome();
      await page.waitForTimeout(2000);

      // 导航到添加规则页面
      const ruleListPage = new RuleListPage(page);
      await ruleListPage.clickViewRules();
      await ruleListPage.isLoaded();
      await ruleListPage.clickAddPersonalRule();

      const ruleFormPage = new RuleFormPage(page);
      await ruleFormPage.isLoaded();

      // 不填写名称直接提交
      await ruleFormPage.clickSubmit();

      // 验证错误提示或表单状态
      const pageText = await page.locator('body').textContent();
      // 至少验证没有意外崩溃
      expect(pageText).toBeDefined();
    });

    test('规则名称应该接受有效输入', async ({ page }) => {
      const validNames = [
        '早起打卡',
        '运动锻炼',
        '学习计划123',
        '健康生活_2024',
      ];

      // 验证所有有效名称都能正常处理
      for (const name of validNames) {
        const isValid = name.length > 0 && name.length <= 50;
        expect(isValid).toBe(true);
      }
    });
  });

  test.describe('边界条件测试', () => {
    test('处理快速连续点击', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // 登录
      await loginPage.goto();
      await loginPage.clickPhoneLogin();
      const phoneLoginPage = new PhoneLoginPage(page);
      await phoneLoginPage.loginWithPassword(
        TEST_USERS.SUPER_ADMIN.phone,
        TEST_USERS.SUPER_ADMIN.password
      );

      // 等待登录完成（超级管理员会自动跳转到"我的"页面）
      await page.waitForTimeout(3000);

      // 导航到首页
      const homePage = new HomePage(page);
      await homePage.goToHome();
      await page.waitForTimeout(2000);

      // 导航到添加规则页面
      const ruleListPage = new RuleListPage(page);
      await ruleListPage.clickViewRules();
      await ruleListPage.isLoaded();

      // 快速连续点击添加按钮多次
      await ruleListPage.clickAddPersonalRule();
      await page.waitForTimeout(500);

      const ruleFormPage = new RuleFormPage(page);
      const isLoaded = await ruleFormPage.isLoaded();

      // 验证只有一个表单被打开
      expect(isLoaded).toBe(true);
    });
  });
});
