/**
 * WelcomePage - 欢迎页面
 * 处理登录入口页面的交互
 * 包含：欢迎页面、手机号登录按钮、微信快捷登录按钮
 * 提供页面导航、登录入口按钮点击和验证功能
 *
 * 注意：登录操作由 PhoneLoginPage 处理
 */
import { BasePage } from './BasePage.js';
import { authSelectors } from '../utils/selectors.js';

export class WelcomePage extends BasePage {
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
    await this.page.waitForTimeout(3000);

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
    const hasTitle = pageText.includes('安全守护');
    const hasWechatLogin = pageText.includes('微信快捷登录');
    const hasPhoneLogin = pageText.includes('手机号登录');

    if (!hasTitle || !hasWechatLogin || !hasPhoneLogin) {
      throw new Error('欢迎页未正确加载。页面缺少必要内容');
    }
    return this;
  }
}
