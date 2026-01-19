/**
 * RuleFormPage - 打卡规则表单页
 * 处理添加和编辑打卡规则的表单
 */
import { BasePage } from './BasePage.js';
import { ruleSelectors } from '../utils/selectors.js';

export class RuleFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = ruleSelectors.form;
  }

  /**
   * 检查表单页是否加载完成
   */
  async isLoaded() {
    try {
      await this.waitForElementVisible(this.selectors.container, { timeout: 10000 });
      return true;
    } catch {
      // 回退检查
      await this.page.waitForTimeout(2000);
      const text = await this.getPageText();
      return text.includes('添加打卡规则') || text.includes('编辑打卡规则');
    }
  }

  /**
   * 检查是否是添加模式
   * @returns {Promise<boolean>}
   */
  async isAddMode() {
    const text = await this.getPageText();
    return text.includes('添加打卡规则');
  }

  /**
   * 检查是否是编辑模式
   * @returns {Promise<boolean>}
   */
  async isEditMode() {
    const text = await this.getPageText();
    return text.includes('编辑打卡规则');
  }

  /**
   * 填写规则名称
   * @param {string} name - 规则名称
   */
  async fillRuleName(name) {
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
   * 填写计划时间
   * @param {string} time - 时间字符串（如 "08:00"）
   */
  async fillPlannedTime(time) {
    try {
      await this.safeFill(this.selectors.plannedTimeInput, time);
    } catch {
      // 如果时间选择器实现不同，可能需要特殊处理
      console.log('⚠️ 时间输入框可能需要特殊处理');
    }
  }

  /**
   * 填写结束时间
   * @param {string} time - 时间字符串
   */
  async fillEndTime(time) {
    try {
      await this.safeFill(this.selectors.endTimeInput, time);
    } catch {
      console.log('⚠️ 结束时间输入框可能需要特殊处理');
    }
  }

  /**
   * 点击提交按钮（添加规则/更新规则）
   */
  async clickSubmit() {
    try {
      // 尝试查找"添加规则"或"更新规则"按钮
      const submitBtn = this.page.locator('uni-button.submit-btn:has-text("添加规则")').or(
        this.page.locator('button.submit-btn:has-text("添加规则")')
      ).or(
        this.page.locator('uni-button:has-text("更新规则")')
      ).or(
        this.page.locator('button:has-text("更新规则")')
      ).first();

      await submitBtn.click({ force: true });
    } catch {
      // 回退到 data-testid
      await this.safeClick(this.selectors.submitButton);
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * 点击确认对话框的确定按钮
   */
  async clickConfirm() {
    try {
      await this.safeClick(this.selectors.confirmButton);
    } catch {
      // 回退到文本选择器
      const confirmBtn = this.page.locator('uni-button.modal-confirm-btn:has-text("确定")').or(
        this.page.locator('button.modal-confirm-btn:has-text("确定")')
      ).or(
        this.page.getByText('确定', { exact: true })
      ).first();

      await confirmBtn.click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击取消按钮
   */
  async clickCancel() {
    try {
      await this.safeClick(this.selectors.cancelButton);
    } catch {
      console.log('⚠️ 取消按钮未找到');
    }
  }

  /**
   * 完整的添加规则流程
   * @param {object} ruleData - 规则数据
   * @param {string} ruleData.name - 规则名称
   * @param {string} ruleData.plannedTime - 计划时间
   * @param {string} ruleData.endTime - 结束时间
   */
  async submitRule(ruleData) {
    await this.fillRuleName(ruleData.name);

    if (ruleData.plannedTime) {
      await this.fillPlannedTime(ruleData.plannedTime);
    }

    if (ruleData.endTime) {
      await this.fillEndTime(ruleData.endTime);
    }

    await this.clickSubmit();
    await this.clickConfirm();
  }

  /**
   * 验证表单字段可见性
   * @returns {Promise<object>}
   */
  async getFieldVisibility() {
    return {
      nameInput: await this.isElementVisible(this.selectors.nameInput),
      plannedTimeInput: await this.isElementVisible(this.selectors.plannedTimeInput),
      endTimeInput: await this.isElementVisible(this.selectors.endTimeInput),
    };
  }
}
