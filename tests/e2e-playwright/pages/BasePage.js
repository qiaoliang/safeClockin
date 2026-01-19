/**
 * BasePage - 基础页面类
 * 所有 Page Object 的基类，提供通用的页面操作方法
 */
import { expect } from '@playwright/test';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * 导航到指定路径
   * @param {string} path - 路径，默认为根路径
   */
  async goto(path = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 智能等待元素可见
   * @param {string} selector - 元素选择器
   * @param {object} options - 选项
   * @param {number} options.timeout - 超时时间（毫秒）
   */
  async waitForElementVisible(selector, options = {}) {
    await expect(this.page.locator(selector)).toBeVisible({
      timeout: options.timeout || 10000
    });
  }

  /**
   * 安全点击（等待元素可点击）
   * @param {string} selector - 元素选择器
   */
  async safeClick(selector) {
    await this.waitForElementVisible(selector);
    await this.page.locator(selector).click();
  }

  /**
   * 安全填充输入框
   * @param {string} selector - 元素选择器
   * @param {string} value - 填充值
   */
  async safeFill(selector, value) {
    await this.waitForElementVisible(selector);
    await this.page.locator(selector).clear();
    await this.page.locator(selector).fill(value);
  }

  /**
   * 等待网络空闲
   * @param {number} timeout - 超时时间（毫秒）
   */
  async waitForNetworkIdle(timeout = 5000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * 获取页面文本内容
   * @returns {Promise<string>} 页面文本内容
   */
  async getPageText() {
    return await this.page.locator('body').textContent();
  }

  /**
   * 等待页面稳定（网络空闲 + DOM 加载完成）
   * @param {object} options - 选项
   * @param {number} options.timeout - 超时时间（毫秒）
   * @param {number} options.checkInterval - 检查间隔（毫秒）
   */
  async waitForPageStable(options = {}) {
    const { timeout = 10000, checkInterval = 100 } = options;

    // 等待网络空闲
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});

    // 等待 DOM 内容加载
    await this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});

    // 额外检查：等待没有正在进行的动画
    await this.page.waitForTimeout(checkInterval);
  }

  /**
   * 等待文本内容出现在页面中
   * @param {string} expectedText - 期望的文本
   * @param {object} options - 选项
   * @param {number} options.timeout - 超时时间（毫秒）
   */
  async waitForTextContent(expectedText, options = {}) {
    const { timeout = 10000 } = options;

    await this.page.waitForFunction(
      (text) => document.body.textContent.includes(text),
      expectedText,
      { timeout }
    );
  }

  /**
   * 检查元素是否存在
   * @param {string} selector - 元素选择器
   * @returns {Promise<boolean>} 元素是否存在
   */
  async isElementVisible(selector) {
    const element = this.page.locator(selector);
    return await element.isVisible().catch(() => false);
  }

  /**
   * 获取元素文本内容
   * @param {string} selector - 元素选择器
   * @returns {Promise<string>} 元素文本内容
   */
  async getElementText(selector) {
    await this.waitForElementVisible(selector);
    return await this.page.locator(selector).textContent();
  }
}
