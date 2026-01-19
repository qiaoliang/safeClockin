/**
 * PhoneLoginPage - 手机登录页
 * 处理手机号登录、验证码登录和注册
 */
import { BasePage } from './BasePage.js';
import { authSelectors } from '../utils/selectors.js';

export class PhoneLoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = authSelectors.phoneLogin;
  }

  /**
   * 检查手机登录页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.phoneInput);
  }

  /**
   * 切换到密码登录标签
   */
  async switchToPasswordTab() {
    try {
      await this.safeClick(this.selectors.tabPassword);
    } catch {
      // 回退到通过文本查找 tab 元素
      await this.page.locator('.tab').filter({ hasText: '密码登录' }).click({ force: true });
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * 切换到验证码登录标签
   */
  async switchToCodeTab() {
    try {
      await this.safeClick(this.selectors.tabCode);
    } catch {
      await this.page.locator('.tab').filter({ hasText: '验证码登录' }).click({ force: true });
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * 切换到注册标签
   */
  async switchToRegisterTab() {
    try {
      await this.safeClick(this.selectors.tabRegister);
    } catch {
      await this.page.locator('.tab').filter({ hasText: '注册' }).click({ force: true });
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * 填充手机号
   * @param {string} phone - 手机号
   */
  async fillPhone(phone) {
    await this.safeFill(this.selectors.phoneInput, phone);
  }

  /**
   * 填充密码
   * @param {string} password - 密码
   */
  async fillPassword(password) {
    await this.safeFill(this.selectors.passwordInput, password);
  }

  /**
   * 填充验证码
   * @param {string} code - 验证码
   */
  async fillCode(code) {
    await this.safeFill(this.selectors.codeInput, code);
  }

  /**
   * 点击获取验证码按钮
   */
  async clickGetCode() {
    await this.safeClick(this.selectors.codeBtn);
  }

  /**
   * 点击提交按钮
   */
  async clickSubmit() {
    // uni-app 的 button 元素会被渲染为 uni-button 组件
    // 使用 uni-button.submit 选择器
    try {
      await this.page.locator('uni-button.submit').click({ force: true, timeout: 5000 });
    } catch {
      // 回退到 data-testid 选择器
      try {
        await this.safeClick(this.selectors.submitBtn);
      } catch {
        // 最后的回退：通过文本查找
        const submitText = await this.page.locator('uni-button.submit').textContent();
        await this.page.getByText(submitText).click({ force: true });
      }
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 勾选/取消勾选用户协议
   */
  async toggleAgreement() {
    await this.page.locator(this.selectors.agreementCheckbox).click();
  }

  /**
   * 使用密码登录
   * @param {string} phone - 手机号
   * @param {string} password - 密码
   */
  async loginWithPassword(phone, password) {
    await this.switchToPasswordTab();
    await this.fillPhone(phone);
    await this.fillPassword(password);
    await this.clickSubmit();

    // 等待登录完成（跳转到首页）
    await this.page.waitForTimeout(5000);

    // 验证登录成功
    const pageText = await this.page.locator('body').textContent();
    const hasHomePage = pageText.includes('打卡') || pageText.includes('社区') || pageText.includes('我的');

    if (!hasHomePage) {
      throw new Error('登录失败，未跳转到首页。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 使用验证码登录
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   */
  async loginWithCode(phone, code) {
    await this.switchToCodeTab();
    await this.fillPhone(phone);
    await this.fillCode(code);

    // 勾选用户协议
    try {
      await this.page.locator(this.selectors.agreementCheckbox).check();
      await this.page.waitForTimeout(500);
    } catch {
      try {
        await this.page.locator('checkbox').first().click();
        await this.page.waitForTimeout(500);
      } catch {
        console.log('⚠️ 用户协议复选框未找到，尝试继续登录');
      }
    }

    await this.clickSubmit();

    // 等待登录完成（跳转到首页）
    await this.page.waitForTimeout(3000);
  }

  /**
   * 注册新用户
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} password - 密码
   */
  async register(phone, code, password) {
    await this.switchToRegisterTab();
    await this.fillPhone(phone);
    await this.fillCode(code);
    await this.fillPassword(password);
    await this.toggleAgreement();
    await this.clickSubmit();

    // 等待注册完成
    await this.page.waitForTimeout(3000);
  }

  /**
   * 获取输入的手机号
   * @returns {Promise<string>} 输入框的值
   */
  async getPhoneValue() {
    return await this.page.locator(this.selectors.phoneInput).inputValue();
  }

  /**
   * 获取输入的密码
   * @returns {Promise<string>} 输入框的值
   */
  async getPasswordValue() {
    return await this.page.locator(this.selectors.passwordInput).inputValue();
  }

  /**
   * 检查提交按钮是否可点击
   * @returns {Promise<boolean>}
   */
  async isSubmitButtonEnabled() {
    const button = this.page.locator(this.selectors.submitBtn);
    const isEnabled = await button.isEnabled();
    return isEnabled;
  }

  /**
   * 检查密码输入框是否可见
   * @returns {Promise<boolean>}
   */
  async isPasswordInputVisible() {
    return await this.isElementVisible(this.selectors.passwordInput);
  }

  /**
   * 检查验证码输入框是否可见
   * @returns {Promise<boolean>}
   */
  async isCodeInputVisible() {
    return await this.isElementVisible(this.selectors.codeInput);
  }
}
