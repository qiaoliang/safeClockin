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
    // 使用较短的超时时间，如果超时则至少等待 DOM 加载完成
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // 如果网络空闲等待失败，至少确保 DOM 加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      // 给页面一些额外时间渲染
      await this.page.waitForTimeout(1000);
    }
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
    const element = this.page.locator(selector);

    // uni-app 将 <input> 转换为 <uni-input> 自定义组件
    // 尝试找到内部的 input 元素
    const innerInput = element.locator('input').first();
    const innerInputExists = await innerInput.count() > 0;

    if (innerInputExists) {
      // 使用内部的 input 元素
      await innerInput.click();
      await innerInput.fill(value);
    } else {
      // 回退到直接填充
      await element.click();
      await element.fill(value);
    }
  }

  /**
   * 等待网络空闲
   * @param {number} timeout - 超时时间（毫秒）
   */
  async waitForNetworkIdle(timeout = 5000) {
    // 使用较短的超时时间，如果超时则至少等待 DOM 加载完成
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // 如果网络空闲等待失败，至少确保 DOM 加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
      // 给页面一些额外时间渲染
      await this.page.waitForTimeout(500);
    }
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
