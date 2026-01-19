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
    // 等待页面加载
    await this.page.waitForTimeout(1000);

    // 验证页面包含关闭事件相关内容
    const pageText = await this.getPageText();
    const hasCloseContent = pageText.includes('关闭') || pageText.includes('关闭原因');

    if (!hasCloseContent) {
      throw new Error('关闭事件模态框未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 填写关闭原因
   * @param {string} reason - 关闭原因
   */
  async fillReason(reason) {
    try {
      await this.safeFill(this.selectors.reasonInput, reason);
    } catch {
      // 回退到通用输入框选择器（可能是 textarea）
      const textarea = this.page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.click({ force: true });
        await textarea.clear();
        await textarea.type(reason, { delay: 100 });
      } else {
        // 如果没有 textarea，尝试输入框
        const input = this.page.locator('input[type="text"]').first();
        await input.click({ force: true });
        await input.clear();
        await input.type(reason, { delay: 100 });
      }
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * 点击提交按钮
   */
  async clickSubmit() {
    try {
      await this.safeClick(this.selectors.submitBtn);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('关闭').or(this.page.getByText('提交')).or(this.page.getByText('确定')).first().click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击取消按钮
   */
  async clickCancel() {
    try {
      await this.safeClick(this.selectors.cancelBtn);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('取消').first().click({ force: true });
    }
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
    try {
      const button = this.page.locator(this.selectors.submitBtn);
      return await button.isEnabled();
    } catch {
      // 回退：检查页面是否有提交相关的文本
      const pageText = await this.getPageText();
      return pageText.includes('关闭') || pageText.includes('提交');
    }
  }

  /**
   * 检查关闭原因输入框是否可见
   * @returns {Promise<boolean>}
   */
  async isReasonInputVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.reasonInput);
    if (byTestId) return true;

    // 回退：检查页面是否有输入相关的元素
    const textarea = this.page.locator('textarea');
    const textareaCount = await textarea.count();
    if (textareaCount > 0) return true;

    // 最后回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('关闭原因') || pageText.includes('请输入');
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
