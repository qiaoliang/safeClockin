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
    // 等待页面加载
    await this.page.waitForTimeout(2000);

    // 验证页面包含个人中心相关内容
    const pageText = await this.getPageText();
    const hasProfileContent = pageText.includes('我的') || pageText.includes('个人中心');

    if (!hasProfileContent) {
      throw new Error('个人中心页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
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
    // 等待页面加载
    await this.page.waitForTimeout(1000);

    // 获取整个页面文本
    const pageText = await this.getPageText();

    // 简单的文本解析，根据实际页面结构调整
    const phoneMatch = pageText.match(/1[3-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    return {
      phone,
      rawText: pageText,
    };
  }

  /**
   * 检查社区列表按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isCommunityListButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.communityListBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('社区列表');
  }

  /**
   * 检查退出登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isLogoutButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.logoutBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('退出登录') || pageText.includes('退出');
  }
}
