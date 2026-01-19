/**
 * HomePage - 应用首页
 * 处理底部导航和主要页面导航
 */
import { BasePage } from './BasePage.js';
import { homeSelectors } from '../utils/selectors.js';

export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = homeSelectors;
  }

  /**
   * 检查首页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.bottomNav.home);
  }

  /**
   * 导航到指定的底部导航标签
   * @param {string} tabName - 标签名称 ('home', 'community', 'profile')
   */
  async navigateToTab(tabName) {
    const tabTextMap = {
      'home': '打卡',
      'community': '社区',
      'profile': '我的'
    };

    const tabText = tabTextMap[tabName];
    if (!tabText) {
      throw new Error(`Unknown tab: ${tabName}. Available tabs: ${Object.keys(tabTextMap).join(', ')}`);
    }

    try {
      // 优先使用 data-testid 选择器
      const selector = this.selectors.bottomNav[tabName];
      await this.safeClick(selector);
    } catch {
      // 回退到通过 uni-app 的底部导航栏类名和文本查找
      try {
        await this.page.locator('.uni-tabbar__label').filter({ hasText: tabText }).click({ force: true });
      } catch {
        // 最后的回退：通过文本直接查找
        await this.page.getByText(tabText).click({ force: true });
      }
    }
    await this.waitForNetworkIdle();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 导航到首页
   */
  async goToHome() {
    await this.navigateToTab('home');
  }

  /**
   * 导航到社区页面
   */
  async goToCommunity() {
    await this.navigateToTab('community');
  }

  /**
   * 导航到个人中心
   */
  async goToProfile() {
    await this.navigateToTab('profile');
  }

  /**
   * 获取当前激活的标签
   * @returns {Promise<string>} 当前激活的标签名称
   */
  async getActiveTab() {
    // 检查哪个标签处于激活状态
    for (const [tabName, selector] of Object.entries(this.selectors.bottomNav)) {
      const element = this.page.locator(selector);
      const classList = await element.getAttribute('class') || '';
      if (classList.includes('active') || classList.includes('selected')) {
        return tabName;
      }
    }
    return null;
  }

  /**
   * 检查首页是否是当前激活的标签
   * @returns {Promise<boolean>}
   */
  async isHomeTabActive() {
    return await this.getActiveTab() === 'home';
  }

  /**
   * 检查社区标签是否是当前激活的标签
   * @returns {Promise<boolean>}
   */
  async isCommunityTabActive() {
    return await this.getActiveTab() === 'community';
  }

  /**
   * 检查个人中心标签是否是当前激活的标签
   * @returns {Promise<boolean>}
   */
  async isProfileTabActive() {
    return await this.getActiveTab() === 'profile';
  }
}
