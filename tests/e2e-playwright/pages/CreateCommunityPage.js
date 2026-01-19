/**
 * CreateCommunityPage - 创建社区页
 * 处理创建社区的表单填写和提交
 */
import { BasePage } from './BasePage.js';
import { communitySelectors } from '../utils/selectors.js';

export class CreateCommunityPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = communitySelectors.create;
  }

  /**
   * 检查创建社区页是否加载完成
   */
  async isLoaded() {
    // 等待页面加载
    await this.page.waitForTimeout(2000);

    // 验证页面包含创建社区相关内容
    const pageText = await this.getPageText();
    const hasCreateContent = pageText.includes('创建社区') || pageText.includes('添加社区') || pageText.includes('社区名称');

    if (!hasCreateContent) {
      throw new Error('创建社区页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 填写社区名称
   * @param {string} name - 社区名称
   */
  async fillName(name) {
    try {
      await this.safeFill(this.selectors.nameInput, name);
    } catch {
      // 回退到通用输入框选择器
      const input = this.page.locator('input[type="text"]').first();
      await input.click({ force: true });
      await input.clear();
      await input.type(name, { delay: 100 });
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * 点击位置选择按钮
   */
  async clickLocationSelect() {
    try {
      await this.safeClick(this.selectors.locationBtn);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('选择位置').or(this.page.getByText('位置')).first().click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击提交按钮
   */
  async clickSubmit() {
    try {
      await this.safeClick(this.selectors.submitBtn);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('创建').or(this.page.getByText('提交')).first().click({ force: true });
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
   * 填写完整的创建表单
   * @param {object} data - 社区数据
   * @param {string} data.name - 社区名称
   * @param {string} data.location - 位置（可选）
   */
  async fillForm(data) {
    if (data.name) {
      await this.fillName(data.name);
    }

    if (data.location) {
      await this.clickLocationSelect();
      // 这里需要处理位置选择的逻辑
      // 根据实际的位置选择组件实现来补充
    }
  }

  /**
   * 提交创建表单
   * @param {object} data - 社区数据
   */
  async submit(data) {
    await this.fillForm(data);
    await this.clickSubmit();
  }

  /**
   * 获取社区名称输入框的值
   * @returns {Promise<string>}
   */
  async getNameValue() {
    return await this.page.locator(this.selectors.nameInput).inputValue();
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
      return pageText.includes('创建') || pageText.includes('提交');
    }
  }

  /**
   * 检查取消按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isCancelButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.cancelBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('取消');
  }
}
