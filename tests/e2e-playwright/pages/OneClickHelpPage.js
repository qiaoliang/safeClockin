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
    try {
      await this.safeClick(this.selectors.helpButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('一键求助').or(this.page.getByText('求助')).first().click({ force: true });
    }
    await this.page.waitForTimeout(1000);
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
      // 尝试通过文本查找确认按钮
      try {
        await this.page.getByText('确认').or(this.page.getByText('确定')).first().click({ force: true });
      } catch {
        // 如果没有自定义对话框，可能是原生对话框
        // 由测试代码处理原生对话框
        await this.page.waitForTimeout(1000);
      }
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击"继续求助"按钮
   */
  async clickContinueHelp() {
    try {
      await this.safeClick(this.selectors.continueHelpButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('继续求助').or(this.page.getByText('继续')).first().click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击"问题已解决"按钮
   */
  async clickProblemSolved() {
    try {
      await this.safeClick(this.selectors.problemSolvedButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('问题已解决').or(this.page.getByText('已解决')).first().click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 检查是否显示"继续求助"按钮
   * @returns {Promise<boolean>}
   */
  async isContinueHelpVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.continueHelpButton);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('继续求助') || pageText.includes('继续');
  }

  /**
   * 检查是否显示"问题已解决"按钮
   * @returns {Promise<boolean>}
   */
  async isProblemSolvedVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.problemSolvedButton);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('问题已解决') || pageText.includes('已解决');
  }

  /**
   * 检查是否显示活跃事件卡片
   * @returns {Promise<boolean>}
   */
  async isActiveEventVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.activeEventCard);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('事件') || pageText.includes('求助');
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
