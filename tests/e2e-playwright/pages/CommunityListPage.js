/**
 * CommunityListPage - 社区列表页
 * 处理社区列表展示、创建和管理
 */
import { BasePage } from './BasePage.js';
import { communitySelectors } from '../utils/selectors.js';

export class CommunityListPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = communitySelectors;
  }

  /**
   * 检查社区列表页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.list.container);
  }

  /**
   * 点击添加社区按钮
   */
  async clickAddButton() {
    await this.safeClick(this.selectors.list.addButton);
    await this.waitForNetworkIdle();
  }

  /**
   * 检查指定社区是否在列表中可见
   * @param {string} communityName - 社区名称
   * @returns {Promise<boolean>}
   */
  async isCommunityVisible(communityName) {
    const selector = this.selectors.list.communityItem(communityName);
    const element = this.page.locator(selector);
    return await element.isVisible().catch(() => false);
  }

  /**
   * 等待指定社区出现在列表中
   * @param {string} communityName - 社区名称
   * @param {number} timeout - 超时时间（毫秒）
   */
  async waitForCommunityVisible(communityName, timeout = 10000) {
    const selector = this.selectors.list.communityItem(communityName);
    await this.waitForElementVisible(selector, { timeout });
  }

  /**
   * 点击指定社区
   * @param {string} communityName - 社区名称
   */
  async clickCommunity(communityName) {
    const selector = this.selectors.list.communityItem(communityName);
    await this.safeClick(selector);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取社区列表中所有社区的名称
   * @returns {Promise<string[]>} 社区名称数组
   */
  async getCommunityNames() {
    const cards = this.page.locator(this.selectors.list.communityCard);
    const count = await cards.count();

    const names = [];
    for (let i = 0; i < count; i++) {
      const name = await cards.nth(i).textContent();
      names.push(name.trim());
    }

    return names;
  }

  /**
   * 获取社区数量
   * @returns {Promise<number>} 社区数量
   */
  async getCommunityCount() {
    const cards = this.page.locator(this.selectors.list.communityCard);
    return await cards.count();
  }

  /**
   * 检查添加按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isAddButtonVisible() {
    return await this.isElementVisible(this.selectors.list.addButton);
  }

  /**
   * 等待社区列表加载完成
   * @param {number} minCount - 期望的最小社区数量
   */
  async waitForListLoad(minCount = 0) {
    await this.isLoaded();

    if (minCount > 0) {
      // 等待至少有指定数量的社区
      await this.page.waitForFunction(
        (count, selector) => {
          const cards = document.querySelectorAll(selector);
          return cards.length >= count;
        },
        minCount,
        this.selectors.list.communityCard
      );
    }
  }
}
