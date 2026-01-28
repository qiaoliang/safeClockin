/**
 * 基础页面类 - 提供通用页面操作方法
 */
import { expect } from '@playwright/test';
import { TEMP_DIR } from '../../../playwright.config.js';

export const WAIT_TIMEOUTS = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 2000,
  XLONG: 3000,
  PAGE_LOAD: 10000,
  ELEMENT_VISIBLE: 10000,
};

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(timeout = WAIT_TIMEOUTS.PAGE_LOAD) {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForTimeout(WAIT_TIMEOUTS.XLONG);
  }

  /**
   * 等待元素可见
   */
  async waitForElement(selector, timeout = WAIT_TIMEOUTS.ELEMENT_VISIBLE) {
    return this.page.locator(selector).first().waitFor({
      state: 'visible',
      timeout,
    });
  }

  /**
   * 验证元素可见
   */
  async expectVisible(selector, timeout = WAIT_TIMEOUTS.ELEMENT_VISIBLE) {
    await expect(this.page.locator(selector).first()).toBeVisible({ timeout });
  }

  /**
   * 验证元素包含文本
   */
  async expectText(selector, expectedText) {
    const text = await this.page.locator(selector).first().textContent();
    await expect(text).toContain(expectedText);
  }

  /**
   * 点击元素（强制点击）
   */
  async click(selector, timeout = WAIT_TIMEOUTS.ELEMENT_VISIBLE) {
    await this.waitForElement(selector, timeout);
    await this.page.locator(selector).first().click({ force: true });
  }

  /**
   * 填写输入框
   */
  async fill(selector, value) {
    const input = this.page.locator(selector).first();
    await input.fill(value);
  }

  /**
   * 保存截图到临时目录
   */
  async saveScreenshot(prefix) {
    const path = `${TEMP_DIR}/${prefix}-${Date.now()}.png`;
    await this.page.screenshot({ path });
    return path;
  }

  /**
   * 获取页面文本内容
   */
  async getPageText() {
    return this.page.locator('body').textContent();
  }

  /**
   * 滚动到页面底部
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(WAIT_TIMEOUTS.MEDIUM);
  }

  /**
   * 等待指定时间
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }
}
