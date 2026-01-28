/**
 * 登录页面对象 - 封装登录相关操作和验证
 */
import { expect } from '@playwright/test';
import { BasePage, WAIT_TIMEOUTS } from './base-page.js';

const SELECTORS = {
  // 文本选择器
  phoneLoginBtn: 'text=手机号登录',
  loginTitle: 'text=安全守护',
  wechatLogin: 'text=微信快捷登录',

  // 标签页
  tabCodeLogin: '[data-testid="tab-code-login"]',
  tabPasswordLogin: '[data-testid="tab-password-login"]',
  tabRegister: '[data-testid="tab-register"]',

  // 输入框
  phoneInput: '[data-testid="phone-input"]',
  passwordInput: '[data-testid="password-input"]',
  codeInput: '[data-testid="code-input"]',

  // 按钮
  getCodeButton: '[data-testid="get-code-button"]',
  loginSubmitButton: '[data-testid="login-submit-button"]',

  // 模态框
  modal: '.uni-modal',
  modalBody: '.uni-modal__bd',
  modalConfirm: '.uni-modal__btn_primary',

  // 通用
  tabbar: '.tabbar-item, .uni-tabbar__item',
  numberInput: 'input[type="number"]',
  textInput: 'input[type="text"]',
  passwordInputField: 'input[type="password"]',
};

const TEXT_CONTENT = {
  TITLE: '安全守护',
  WECHAT_LOGIN: '微信快捷登录',
  PHONE_LOGIN: '手机号登录',
  CODE_LOGIN: '验证码登录',
  PASSWORD_LOGIN: '密码登录',
  REGISTER: '注册',
  SET_PASSWORD: '设置密码',
  PHONE_REGISTER_LOGIN: '手机号注册/登录',
  ENTER_PHONE: '请输入手机号',
};

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * 导航到登录页面
   */
  async navigate() {
    await this.page.goto('/');
    await this.waitForPageLoad();
    await this.expectVisible(SELECTORS.loginTitle);
    return this;
  }

  /**
   * 验证当前在登录页面
   */
  async expectOnLoginPage() {
    const pageText = await this.getPageText();
    expect(pageText).toContain(TEXT_CONTENT.TITLE);
    expect(pageText).toContain(TEXT_CONTENT.WECHAT_LOGIN);
    expect(pageText).toContain(TEXT_CONTENT.PHONE_LOGIN);
    return this;
  }

  /**
   * 点击手机号登录按钮
   */
  async clickPhoneLogin() {
    await this.expectVisible(SELECTORS.phoneLoginBtn);
    await this.page.locator(SELECTORS.phoneLoginBtn).first().click({ force: true });
    await this.waitForPageLoad();
    return this;
  }

  /**
   * 切换到指定标签页
   * @param {'code' | 'password' | 'register'} tabType - 标签类型
   */
  async switchToTab(tabType) {
    const tabSelector = {
      code: SELECTORS.tabCodeLogin,
      password: SELECTORS.tabPasswordLogin,
      register: SELECTORS.tabRegister,
    }[tabType];

    const tabName = {
      code: '验证码登录',
      password: '密码登录',
      register: '注册',
    }[tabType];

    await this.expectVisible(tabSelector);
    await this.page.locator(tabSelector).first().click({ force: true });
    await this.wait(WAIT_TIMEOUTS.MEDIUM);

    const pageText = await this.getPageText();
    expect(pageText).toContain(tabName);
    return this;
  }

  /**
   * 填写手机号
   */
  async fillPhone(phone) {
    const phoneInput = this.page.locator(SELECTORS.phoneInput).first().locator(SELECTORS.numberInput);
    await phoneInput.fill(phone);
    return this;
  }

  /**
   * 填写密码
   */
  async fillPassword(password) {
    const passwordField = this.page.locator(SELECTORS.passwordInput).first().locator(SELECTORS.passwordInputField);
    await passwordField.fill(password);
    return this;
  }

  /**
   * 点击获取验证码
   */
  async clickGetCode() {
    await this.expectVisible(SELECTORS.getCodeButton);
    await this.page.locator(SELECTORS.getCodeButton).first().click({ force: true });
    await this.wait(WAIT_TIMEOUTS.LONG);
    return this;
  }

  /**
   * 填写验证码
   */
  async fillVerificationCode(code) {
    const codeInput = this.page.locator(SELECTORS.numberInput).nth(1);
    await codeInput.fill(code);
    return this;
  }

  /**
   * 点击登录按钮
   */
  async clickLogin() {
    await this.expectVisible(SELECTORS.loginSubmitButton);
    await this.page.locator(SELECTORS.loginSubmitButton).first().click({ force: true });
    return this;
  }

  /**
   * 超级管理员密码登录
   */
  async loginAsSuperAdmin(phone, password) {
    await this.navigate();
    await this.clickPhoneLogin();
    await this.switchToTab('password');
    await this.fillPhone(phone);
    await this.fillPassword(password);
    await this.clickLogin();
    await this.expectLoginSuccess();
    return this;
  }

  /**
   * 用户验证码登录
   */
  async loginByCode(phone, code = '123456') {
    await this.navigate();
    await this.clickPhoneLogin();
    await this.switchToTab('code');
    await this.fillPhone(phone);
    await this.clickGetCode();
    await this.fillVerificationCode(code);
    await this.clickLogin();
    await this.waitForPageLoad();
    return this;
  }

  /**
   * 普通用户登录（复用 loginByCode，验证在打卡页面）
   */
  async loginAsNormalUser(phone, code = '123456') {
    await this.loginByCode(phone, code);
    await this.expectOnCheckinPage();
    return this;
  }

  /**
   * 验证在打卡页面（普通用户默认首页）
   */
  async expectOnCheckinPage() {
    const pageText = await this.getPageText();
    expect(pageText).toContain('打卡');
    return this;
  }

  /**
   * 验证登录成功（超级管理员在"我的"页面）
   */
  async expectLoginSuccess() {
    await this.wait(WAIT_TIMEOUTS.LONG * 2);
    await this.page.waitForLoadState('networkidle');
    const pageText = await this.getPageText();
    expect(pageText).toContain('我的');
    return this;
  }

  /**
   * 验证页面包含验证码输入框
   */
  async expectCodeInputVisible() {
    await this.expectVisible(SELECTORS.codeInput);
    return this;
  }

  /**
   * 验证页面包含密码输入框
   */
  async expectPasswordInputVisible() {
    await this.expectVisible(SELECTORS.passwordInput);
    return this;
  }

  /**
   * 验证页面包含手机号输入框
   */
  async expectPhoneInputVisible() {
    await this.expectVisible(SELECTORS.phoneInput);
    return this;
  }

  /**
   * 验证标签页可以切换
   */
  async expectTabSwitchable() {
    // 初始在验证码登录
    await this.expectVisible(SELECTORS.tabCodeLogin);

    // 切换到注册
    await this.switchToTab('register');
    const registerText = await this.getPageText();
    expect(registerText).toContain(TEXT_CONTENT.REGISTER);
    expect(registerText).toContain(TEXT_CONTENT.SET_PASSWORD);

    // 切换到密码登录
    await this.switchToTab('password');
    const passwordText = await this.getPageText();
    expect(passwordText).toContain(TEXT_CONTENT.PASSWORD_LOGIN);

    // 切换回验证码登录
    await this.switchToTab('code');
    const codeText = await this.getPageText();
    expect(codeText).toContain(TEXT_CONTENT.CODE_LOGIN);

    return this;
  }

  /**
   * 验证点击手机号登录按钮后显示表单
   */
  async expectPhoneLoginFormVisible() {
    await this.clickPhoneLogin();
    const pageText = await this.getPageText();
    expect(pageText).toContain(TEXT_CONTENT.ENTER_PHONE);
    return this;
  }

  /**
   * 获取验证码按钮文本
   */
  async getCodeButtonText() {
    return this.page.locator(SELECTORS.getCodeButton).first().textContent();
  }
}
