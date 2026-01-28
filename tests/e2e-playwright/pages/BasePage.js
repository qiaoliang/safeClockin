/**
 * BasePage - 基础页面类
 * 所有 Page Object 的基类，提供通用的页面操作方法
 */
import { expect } from '@playwright/test';
import { WAIT_TIMEOUTS } from '../utils/wait-helpers.js';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * 导航到指定路径
   */
  async goto(path = '/') {
    await this.page.goto(path);

    try {
      await this.page.waitForLoadState('networkidle', { timeout: WAIT_TIMEOUTS.DEFAULT });
    } catch {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * 智能等待元素可见
   */
  async waitForElementVisible(selector, options = {}) {
    await expect(this.page.locator(selector)).toBeVisible({
      timeout: options.timeout || WAIT_TIMEOUTS.DEFAULT
    });
  }

  /**
   * 安全点击（等待元素可点击）
   */
  async safeClick(selector) {
    await this.waitForElementVisible(selector);
    await this.page.locator(selector).click();
  }

  /**
   * 安全填充输入框
   */
  async safeFill(selector, value) {
    await this.waitForElementVisible(selector);
    const element = this.page.locator(selector);

    const innerInput = element.locator('input').first();
    const innerInputExists = await innerInput.count() > 0;

    if (innerInputExists) {
      await innerInput.click();
      await innerInput.fill(value);
    } else {
      await element.click();
      await element.fill(value);
    }
  }

  /**
   * 等待网络空闲
   */
  async waitForNetworkIdle(timeout = 5000) {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 获取页面文本内容
   */
  async getPageText() {
    return await this.page.locator('body').textContent();
  }

  /**
   * 等待页面稳定
   */
  async waitForPageStable(options = {}) {
    const { timeout = WAIT_TIMEOUTS.DEFAULT, checkInterval = 2000 } = options;

    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
    // 增加等待时间以适应 Vue 的响应式系统
    await this.page.waitForTimeout(checkInterval);
  }

  /**
   * 等待文本内容出现在页面中
   */
  async waitForTextContent(expectedText, options = {}) {
    const { timeout = WAIT_TIMEOUTS.DEFAULT } = options;

    await this.page.waitForFunction(
      (text) => document.body.textContent.includes(text),
      expectedText,
      { timeout }
    );
  }

  /**
   * 检查元素是否可见
   */
  async isElementVisible(selector) {
    const element = this.page.locator(selector);
    return await element.isVisible().catch(() => false);
  }

  /**
   * 获取元素文本内容
   */
  async getElementText(selector) {
    await this.waitForElementVisible(selector);
    return await this.page.locator(selector).textContent();
  }

  /**
   * 等待页面完全加载
   * 组合多个等待条件确保页面稳定
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: WAIT_TIMEOUTS.DEFAULT }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded', { timeout: WAIT_TIMEOUTS.DEFAULT }).catch(() => {});
    // 等待 Vue 应用初始化
    await this.page.waitForTimeout(2000);
  }
}
