/**
 * LoginPage - 登录欢迎页
 * 处理登录入口页面的交互
 */
import { BasePage } from './BasePage.js';
import { authSelectors } from '../utils/selectors.js';
import { TEST_USERS } from '../fixtures/test-data.mjs';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = authSelectors;
  }

  /**
   * 导航到登录页
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * 检查登录页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.loginWelcomePage.wechatLoginBtn);
    await this.waitForElementVisible(this.selectors.loginWelcomePage.phoneLoginBtn);
  }

  /**
   * 点击手机号登录按钮
   */
  async clickPhoneLogin() {
    await this.safeClick(this.selectors.loginWelcomePage.phoneLoginBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 点击微信登录按钮
   */
  async clickWechatLogin() {
    await this.safeClick(this.selectors.loginWelcomePage.wechatLoginBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 使用超级管理员账号登录
   * 自动完成从欢迎页到登录后的完整流程
   */
  async loginAsSuperAdmin() {
    const user = TEST_USERS.SUPER_ADMIN;
    await this.clickPhoneLogin();

    // 动态导入避免循环依赖
    const { PhoneLoginPage } = await import('./PhoneLoginPage.js');
    const phoneLoginPage = new PhoneLoginPage(this.page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);
  }

  /**
   * 使用社区管理员账号登录
   */
  async loginAsCommunityAdmin() {
    const user = TEST_USERS.COMMUNITY_ADMIN;
    await this.clickPhoneLogin();

    const { PhoneLoginPage } = await import('./PhoneLoginPage.js');
    const phoneLoginPage = new PhoneLoginPage(this.page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);
  }

  /**
   * 使用普通员工账号登录
   */
  async loginAsStaff() {
    const user = TEST_USERS.STAFF;
    await this.clickPhoneLogin();

    const { PhoneLoginPage } = await import('./PhoneLoginPage.js');
    const phoneLoginPage = new PhoneLoginPage(this.page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);
  }

  /**
   * 使用普通用户账号登录
   */
  async loginAsNormalUser() {
    const user = TEST_USERS.NORMAL;
    await this.clickPhoneLogin();

    const { PhoneLoginPage } = await import('./PhoneLoginPage.js');
    const phoneLoginPage = new PhoneLoginPage(this.page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);
  }

  /**
   * 通用登录方法
   * @param {string} phone - 手机号
   * @param {string} password - 密码
   */
  async login(phone, password) {
    await this.clickPhoneLogin();

    const { PhoneLoginPage } = await import('./PhoneLoginPage.js');
    const phoneLoginPage = new PhoneLoginPage(this.page);
    await phoneLoginPage.loginWithPassword(phone, password);
  }

  /**
   * 获取页面标题
   * @returns {Promise<string>} 页面标题文本
   */
  async getTitle() {
    return await this.getElementText(this.selectors.loginWelcomePage.title);
  }

  /**
   * 检查微信登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isWechatLoginButtonVisible() {
    return await this.isElementVisible(this.selectors.loginWelcomePage.wechatLoginBtn);
  }

  /**
   * 检查手机登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isPhoneLoginButtonVisible() {
    return await this.isElementVisible(this.selectors.loginWelcomePage.phoneLoginBtn);
  }
}
