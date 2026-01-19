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
    // 等待页面加载
    await this.page.waitForTimeout(2000);

    // 验证页面包含事件详情相关内容
    const pageText = await this.getPageText();
    const hasEventContent = pageText.includes('事件') || pageText.includes('详情') || pageText.includes('关闭');

    if (!hasEventContent) {
      throw new Error('事件详情页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 点击关闭事件按钮
   */
  async clickCloseButton() {
    try {
      await this.safeClick(this.selectors.closeBtn);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('关闭事件').or(this.page.getByText('关闭')).first().click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 检查事件是否处于活跃状态
   * @returns {Promise<boolean>}
   */
  async isEventActive() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.statusActive);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('进行中') || pageText.includes('活跃') || (pageText.includes('事件') && !pageText.includes('已关闭'));
  }

  /**
   * 检查事件是否已关闭
   * @returns {Promise<boolean>}
   */
  async isEventClosed() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.statusClosed);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('已关闭') || pageText.includes('关闭时间');
  }

  /**
   * 获取关闭人信息
   * @returns {Promise<string>}
   */
  async getClosedBy() {
    try {
      const element = this.page.locator(this.selectors.closedByLabel);
      if (await element.isVisible()) {
        return await element.textContent();
      }
    } catch {}

    // 回退：从页面文本中提取
    const pageText = await this.getPageText();
    const match = pageText.match(/关闭[人者][:：]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 获取关闭时间
   * @returns {Promise<string>}
   */
  async getClosedAt() {
    try {
      const element = this.page.locator(this.selectors.closedAtLabel);
      if (await element.isVisible()) {
        return await element.textContent();
      }
    } catch {}

    // 回退：从页面文本中提取
    const pageText = await this.getPageText();
    const match = pageText.match(/关闭时间[:：]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 获取关闭原因
   * @returns {Promise<string>}
   */
  async getClosureReason() {
    try {
      const element = this.page.locator(this.selectors.closureReasonLabel);
      if (await element.isVisible()) {
        return await element.textContent();
      }
    } catch {}

    // 回退：从页面文本中提取
    const pageText = await this.getPageText();
    const match = pageText.match(/关闭原因[:：]\s*([^\n]+)/);
    return match ? match[1].trim() : null;
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
