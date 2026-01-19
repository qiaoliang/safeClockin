/**
 * ProfilePage - 个人中心页
 * 处理用户个人信息、设置和社区管理入口
 */
import { BasePage } from './BasePage.js';
import { profileSelectors, communitySelectors } from '../utils/selectors.js';

export class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = profileSelectors;
  }

  /**
   * 检查个人中心页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.container);
  }

  /**
   * 检查是否在个人中心页面
   * @returns {Promise<boolean>}
   */
  async isOnProfilePage() {
    const text = await this.getPageText();
    return text.includes('我的');
  }

  /**
   * 点击社区列表按钮，进入社区管理
   */
  async clickCommunityList() {
    // 社区列表按钮的 data-testid 是动态的：menu-社区列表
    try {
      await this.safeClick('data-testid=menu-社区列表');
    } catch {
      // 回退到文本选择器
      await this.page.getByText('社区列表', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击退出登录按钮
   */
  async clickLogout() {
    await this.safeClick(this.selectors.logoutBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取用户信息
   * @returns {Promise<object>} 用户信息对象
   */
  async getUserInfo() {
    // 等待用户信息区域加载
    await this.waitForElementVisible(this.selectors.userInfoSection);

    const userInfoElement = this.page.locator(this.selectors.userInfoSection);

    // 提取用户名和手机号
    const text = await userInfoElement.textContent();

    // 简单的文本解析，根据实际页面结构调整
    const phoneMatch = text.match(/1[3-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    return {
      phone,
      rawText: text,
    };
  }

  /**
   * 检查社区列表按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isCommunityListButtonVisible() {
    return await this.isElementVisible(this.selectors.communityListBtn);
  }

  /**
   * 检查退出登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isLogoutButtonVisible() {
    return await this.isElementVisible(this.selectors.logoutBtn);
  }
}
