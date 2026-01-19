/**
 * EventClosePage - 事件关闭页
 * 处理事件关闭的表单填写和提交
 */
import { BasePage } from './BasePage.js';
import { eventSelectors } from '../utils/selectors.js';

export class EventClosePage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = eventSelectors.close;
  }

  /**
   * 检查关闭事件模态框是否加载完成
   */
  async isLoaded() {
    await this.waitForElementVisible(this.selectors.container);
  }

  /**
   * 填写关闭原因
   * @param {string} reason - 关闭原因
   */
  async fillReason(reason) {
    await this.safeFill(this.selectors.reasonInput, reason);
  }

  /**
   * 点击提交按钮
   */
  async clickSubmit() {
    await this.safeClick(this.selectors.submitBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 点击取消按钮
   */
  async clickCancel() {
    await this.safeClick(this.selectors.cancelBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 提交关闭表单
   * @param {string} reason - 关闭原因
   */
  async submit(reason) {
    await this.fillReason(reason);
    await this.clickSubmit();
  }

  /**
   * 获取关闭原因输入框的值
   * @returns {Promise<string>}
   */
  async getReasonValue() {
    return await this.page.locator(this.selectors.reasonInput).inputValue();
  }

  /**
   * 检查提交按钮是否可点击
   * @returns {Promise<boolean>}
   */
  async isSubmitButtonEnabled() {
    const button = this.page.locator(this.selectors.submitBtn);
    return await button.isEnabled();
  }

  /**
   * 检查关闭原因输入框是否可见
   * @returns {Promise<boolean>}
   */
  async isReasonInputVisible() {
    return await this.isElementVisible(this.selectors.reasonInput);
  }

  /**
   * 验证关闭原因长度
   * @param {number} minLength - 最小长度
   * @param {number} maxLength - 最大长度
   * @returns {Promise<boolean>} 是否在有效范围内
   */
  async validateReasonLength(minLength = 10, maxLength = 200) {
    const reason = await this.getReasonValue();
    return reason.length >= minLength && reason.length <= maxLength;
  }

  /**
   * 等待模态框关闭
   */
  async waitForModalClose() {
    const { waitForModalClose } = await import('../utils/wait-helpers.js');
    await waitForModalClose(this.page, this.selectors.container);
  }
}
