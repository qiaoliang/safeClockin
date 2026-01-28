/**
 * 欢迎页面对象 - 封装登录后首页和退出后的验证
 */
import { expect } from '@playwright/test';
import { BasePage, WAIT_TIMEOUTS } from './base-page.js';

const SELECTORS = {
  loginTitle: 'text=安全守护',
  wechatLogin: 'text=微信快捷登录',
  phoneLogin: 'text=手机号登录',
  wechatLoginBtn: 'button:has-text("微信登录")',
  phoneLoginBtn: 'text=手机号登录',
};

const TEXT_CONTENT = {
  TITLE: '安全守护',
  WECHAT_LOGIN: '微信快捷登录',
  PHONE_LOGIN: '手机号登录',
};

export class WelcomePage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * 导航到欢迎页面（首页/登录页）
   */
  async navigate() {
    await this.page.goto('/');
    await this.waitForPageLoad();
    return this;
  }

  /**
   * 验证在欢迎页面（登录首页）
   */
  async expectOnWelcomePage() {
    const pageText = await this.getPageText();
    expect(pageText).toContain(TEXT_CONTENT.TITLE);
    expect(pageText).toContain(TEXT_CONTENT.WECHAT_LOGIN);
    expect(pageText).toContain(TEXT_CONTENT.PHONE_LOGIN);
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
   * 验证在社区页面
   */
  async expectOnCommunityPage() {
    const pageText = await this.getPageText();
    expect(pageText).toContain('社区');
    return this;
  }

  /**
   * 验证在"我的"页面
   */
  async expectOnProfilePage() {
    const pageText = await this.getPageText();
    expect(pageText).toContain('我的');
    return this;
  }

  /**
   * 点击微信登录按钮
   */
  async clickWechatLogin() {
    await this.expectVisible(SELECTORS.wechatLoginBtn);
    await this.page.locator(SELECTORS.wechatLoginBtn).first().click({ force: true });
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
}
