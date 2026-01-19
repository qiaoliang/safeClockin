/**
 * OneClickHelpPage - 一键求助页
 * 处理一键求助功能的页面对象
 */
import { BasePage } from './BasePage.js';
import { eventSelectors } from '../utils/selectors.js';

export class OneClickHelpPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = eventSelectors.oneClickHelp;
  }

  /**
   * 点击一键求助按钮
   */
  async clickHelpButton() {
    await this.safeClick(this.selectors.helpButton);
  }

  /**
   * 确认发起求助
   * 处理可能的确认对话框（原生或自定义）
   */
  async confirmHelp() {
    // 先尝试自定义确认对话框
    const confirmBtnExists = await this.isElementVisible(this.selectors.confirmButton);

    if (confirmBtnExists) {
      await this.safeClick(this.selectors.confirmButton);
    } else {
      // 如果没有自定义对话框，可能是原生对话框
      // 由测试代码处理原生对话框
      await this.page.waitForTimeout(1000);
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击"继续求助"按钮
   */
  async clickContinueHelp() {
    await this.safeClick(this.selectors.continueHelpButton);
    await this.waitForNetworkIdle();
  }

  /**
   * 点击"问题已解决"按钮
   */
  async clickProblemSolved() {
    await this.safeClick(this.selectors.problemSolvedButton);
    await this.waitForNetworkIdle();
  }

  /**
   * 检查是否显示"继续求助"按钮
   * @returns {Promise<boolean>}
   */
  async isContinueHelpVisible() {
    return await this.isElementVisible(this.selectors.continueHelpButton);
  }

  /**
   * 检查是否显示"问题已解决"按钮
   * @returns {Promise<boolean>}
   */
  async isProblemSolvedVisible() {
    return await this.isElementVisible(this.selectors.problemSolvedButton);
  }

  /**
   * 检查是否显示活跃事件卡片
   * @returns {Promise<boolean>}
   */
  async isActiveEventVisible() {
    return await this.isElementVisible(this.selectors.activeEventCard);
  }

  /**
   * 完整的发起求助流程
   */
  async requestHelp() {
    await this.clickHelpButton();
    await this.confirmHelp();
    // 等待求助请求完成
    await this.page.waitForTimeout(3000);
    await this.waitForNetworkIdle();
  }

  /**
   * 等待求助状态更新
   */
  async waitForHelpStatus() {
    // 等待页面状态更新
    await this.page.waitForTimeout(2000);
    await this.waitForNetworkIdle();
  }
}
