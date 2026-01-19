/**
 * RuleListPage - 打卡规则列表页
 * 显示用户的打卡规则，支持添加、编辑、删除规则
 */
import { BasePage } from './BasePage.js';
import { ruleSelectors } from '../utils/selectors.js';

export class RuleListPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = ruleSelectors.list;
  }

  /**
   * 检查规则列表页是否加载完成
   */
  async isLoaded() {
    // 等待页面标题或容器出现
    try {
      await this.waitForElementVisible(this.selectors.container, { timeout: 10000 });
      return true;
    } catch {
      // 如果没有精确的容器，尝试通过文本判断
      await this.page.waitForTimeout(2000);
      const text = await this.getPageText();
      return text.includes('打卡规则');
    }
  }

  /**
   * 点击"添加个人规则"按钮
   */
  async clickAddPersonalRule() {
    // 优先使用 data-testid 选择器
    try {
      await this.safeClick(this.selectors.addPersonalRuleButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('添加个人规则', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击"查看规则"按钮（从打卡首页）
   */
  async clickViewRules() {
    try {
      await this.safeClick(this.selectors.viewRulesButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('查看规则', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 检查规则是否在列表中
   * @param {string} ruleName - 规则名称
   * @returns {Promise<boolean>}
   */
  async isRuleVisible(ruleName) {
    const text = await this.getPageText();
    return text.includes(ruleName);
  }

  /**
   * 等待规则出现在列表中
   * @param {string} ruleName - 规则名称
   * @param {number} timeout - 超时时间
   */
  async waitForRuleVisible(ruleName, timeout = 10000) {
    await this.page.waitForFunction(
      (name) => document.body.textContent.includes(name),
      ruleName,
      { timeout }
    );
  }

  /**
   * 点击编辑按钮
   * 注意：可能需要先找到特定规则的编辑按钮
   */
  async clickEditButton(ruleName) {
    // 先尝试找到包含规则名称的卡片
    const ruleCard = this.page.locator(this.selectors.ruleCard).filter({ hasText: ruleName }).first();

    // 在卡片内查找编辑按钮
    const editBtn = ruleCard.locator(this.selectors.editButton).or(
      this.page.getByText('编辑', { exact: true })
    ).first();

    await editBtn.click({ force: true });
    await this.waitForNetworkIdle();
  }

  /**
   * 点击删除按钮
   * @param {string} ruleName - 规则名称
   */
  async clickDeleteButton(ruleName) {
    // 先尝试找到包含规则名称的卡片
    const ruleCard = this.page.locator(this.selectors.ruleCard).filter({ hasText: ruleName }).first();

    // 在卡片内查找删除按钮
    const deleteBtn = ruleCard.locator(this.selectors.deleteButton).or(
      this.page.getByText('删除', { exact: true })
    ).first();

    await deleteBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  /**
   * 确认删除操作
   */
  async confirmDelete() {
    try {
      await this.safeClick(this.selectors.form.deleteConfirmButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('删除', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击确认对话框的确定按钮
   */
  async clickConfirm() {
    try {
      await this.safeClick(this.selectors.form.confirmButton);
    } catch {
      // 回退到文本选择器
      await this.page.getByText('确定', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 获取规则数量
   * @returns {Promise<number>}
   */
  async getRuleCount() {
    try {
      const count = await this.page.locator(this.selectors.ruleCard).count();
      return count;
    } catch {
      // 如果无法精确定位，返回估算值
      return 0;
    }
  }

  /**
   * 验证规则操作按钮可见
   * @param {string} ruleName - 规则名称
   * @returns {Promise<object>}
   */
  async getRuleButtonsStatus(ruleName) {
    const text = await this.getPageText();
    return {
      hasEdit: text.includes('编辑'),
      hasDelete: text.includes('删除'),
      hasInvite: text.includes('邀请'),
    };
  }
}
