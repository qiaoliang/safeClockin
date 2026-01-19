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
    await this.waitForElementVisible(this.selectors.container);
  }

  /**
   * 填写社区名称
   * @param {string} name - 社区名称
   */
  async fillName(name) {
    await this.safeFill(this.selectors.nameInput, name);
  }

  /**
   * 点击位置选择按钮
   */
  async clickLocationSelect() {
    await this.safeClick(this.selectors.locationBtn);
    await this.waitForNetworkIdle();
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
    const button = this.page.locator(this.selectors.submitBtn);
    return await button.isEnabled();
  }

  /**
   * 检查取消按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isCancelButtonVisible() {
    return await this.isElementVisible(this.selectors.cancelBtn);
  }
}
