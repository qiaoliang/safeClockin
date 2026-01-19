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
   * 使用多重回退策略，兼容没有 data-testid 的情况
   */
  async isLoaded() {
    // 先尝试等待页面加载
    await this.page.waitForTimeout(2000);

    // 尝试多种方式验证登录页已加载
    const pageText = await this.getPageText();

    // 验证页面包含登录相关文本
    const hasLoginContent = pageText.includes('手机号登录') || pageText.includes('微信快捷登录');

    if (!hasLoginContent) {
      throw new Error('登录页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 点击手机号登录按钮
   * 使用多重回退策略
   */
  async clickPhoneLogin() {
    // 等待页面稳定
    await this.page.waitForTimeout(1000);

    try {
      // 优先使用 data-testid 选择器
      await this.safeClick(this.selectors.loginWelcomePage.phoneLoginBtn);
    } catch {
      // 回退到文本选择器
      try {
        await this.page.getByText('手机号登录').first().click({ force: true, timeout: 5000 });
      } catch {
        // 最后的回退：直接使用文本定位
        await this.page.locator('text=手机号登录').click({ force: true, timeout: 5000 });
      }
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击微信登录按钮
   * 使用多重回退策略
   */
  async clickWechatLogin() {
    // 等待页面稳定
    await this.page.waitForTimeout(1000);

    try {
      // 优先使用 data-testid 选择器
      await this.safeClick(this.selectors.loginWelcomePage.wechatLoginBtn);
    } catch {
      // 回退到文本选择器
      try {
        await this.page.getByText('微信快捷登录').first().click({ force: true, timeout: 5000 });
      } catch {
        // 最后的回退：直接使用文本定位
        await this.page.locator('text=微信快捷登录').click({ force: true, timeout: 5000 });
      }
    }
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
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.loginWelcomePage.wechatLoginBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('微信快捷登录');
  }

  /**
   * 检查手机登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isPhoneLoginButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.loginWelcomePage.phoneLoginBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('手机号登录');
  }
}
