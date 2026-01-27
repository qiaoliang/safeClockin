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
    // 等待页面加载
    await this.page.waitForTimeout(2000);

    // 验证页面包含社区列表相关内容
    const pageText = await this.getPageText();
    const hasCommunityContent = pageText.includes('社区列表') || pageText.includes('社区管理');

    if (!hasCommunityContent) {
      throw new Error('社区列表页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 点击添加社区按钮
   */
  async clickAddButton() {
    // 等待页面稳定和列表加载完成
    await this.page.waitForTimeout(2000);

    // 直接使用 data-testid 选择器（与生产代码一致）
    const addButton = this.page.locator(this.selectors.list.addButton);

    // 等待按钮可见且可点击
    await addButton.waitFor({ state: 'visible', timeout: 5000 });

    // 等待按钮可交互（attached 且 stable）
    await this.page.waitForTimeout(500);

    // 点击按钮
    await addButton.click({ force: true });

    // 等待网络请求完成
    await this.waitForNetworkIdle();

    // 等待页面跳转开始
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查指定社区是否在列表中可见
   * @param {string} communityName - 社区名称
   * @returns {Promise<boolean>}
   */
  async isCommunityVisible(communityName) {
    // 先尝试使用 data-testid
    const selector = this.selectors.list.communityItem(communityName);
    const element = this.page.locator(selector);
    const byTestId = await element.isVisible().catch(() => false);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes(communityName);
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
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.list.addButton);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('添加社区') || pageText.includes('添加');
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

  /**
   * 检查添加社区表单是否可见（跳转到新页面后的验证）
   * @returns {Promise<boolean>}
   */
  async isAddCommunityFormVisible() {
    // 先等待URL跳转
    await this.page.waitForURL(/\/community-form/, { timeout: 5000 }).catch(() => false);

    // 等待DOM渲染
    await this.page.waitForTimeout(1000);

    // 使用生产代码中的 data-testid 直接验证
    const formElement = this.page.locator('[data-testid="create-community-page"]');
    const isVisible = await formElement.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) return true;

    // 回退：检查页面是否包含表单相关文本
    const pageText = await this.getPageText();
    const formKeywords = ['社区名称', '创建社区', '新增社区', '位置选择', '社区主管'];
    return formKeywords.some(keyword => pageText.includes(keyword));
  }
}
