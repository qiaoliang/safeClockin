/**
 * EventDetailPage - 事件详情页
 * 显示事件详细信息，包括关闭信息
 */
import { BasePage } from './BasePage.js';
import { eventSelectors } from '../utils/selectors.js';

export class EventDetailPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = eventSelectors.detail;
  }

  /**
   * 检查事件详情页是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.container);
  }

  /**
   * 点击关闭事件按钮
   */
  async clickCloseButton() {
    await this.safeClick(this.selectors.closeBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 检查事件是否处于活跃状态
   * @returns {Promise<boolean>}
   */
  async isEventActive() {
    return await this.isElementVisible(this.selectors.statusActive);
  }

  /**
   * 检查事件是否已关闭
   * @returns {Promise<boolean>}
   */
  async isEventClosed() {
    return await this.isElementVisible(this.selectors.statusClosed);
  }

  /**
   * 获取关闭人信息
   * @returns {Promise<string>}
   */
  async getClosedBy() {
    const element = this.page.locator(this.selectors.closedByLabel);
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  /**
   * 获取关闭时间
   * @returns {Promise<string>}
   */
  async getClosedAt() {
    const element = this.page.locator(this.selectors.closedAtLabel);
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  /**
   * 获取关闭原因
   * @returns {Promise<string>}
   */
  async getClosureReason() {
    const element = this.page.locator(this.selectors.closureReasonLabel);
    if (await element.isVisible()) {
      return await element.textContent();
    }
    return null;
  }

  /**
   * 验证关闭信息完整
   * @param {string} reason - 期望的关闭原因
   * @returns {Promise<boolean>}
   */
  async verifyClosureInfo(reason) {
    const isClosed = await this.isEventClosed();
    if (!isClosed) {
      return false;
    }

    const closureReason = await this.getClosureReason();
    return closureReason && closureReason.includes(reason);
  }
}
