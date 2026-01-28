/**
 * "我的"页面对象 - 封装个人中心相关操作和验证
 */
import { expect } from '@playwright/test';
import { BasePage, WAIT_TIMEOUTS } from './base-page.js';
import { WelcomePage } from './welcome-page.js';

const SELECTORS = {
  profileTab: 'text=我的',
  logoutBtn: 'text=退出登录',
  modal: '.uni-modal',
  modalBody: '.uni-modal__bd',
  modalConfirm: '.uni-modal__btn_primary',
  tabbar: '.tabbar-item, .uni-tabbar__item',
};

const TEXT_CONTENT = {
  TITLE: '安全守护',
  WECHAT_LOGIN: '微信快捷登录',
  PHONE_LOGIN: '手机号登录',
  LOGOUT_CONFIRM: '确定要退出登录吗？',
  SESSION_EXPIRED: '用户信息已过期',
  PLEASE_RELOGIN: '请重新登录',
};

export class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.welcomePage = new WelcomePage(page);
  }

  /**
   * 导航到"我的"页面
   */
  async navigate() {
    // 滚动到底部并等待
    await this.scrollToBottom();
    await this.wait(WAIT_TIMEOUTS.LONG);

    // 使用 evaluate 直接点击（通过 XPath 包含文本）
    await this.page.evaluate(() => {
      const tabs = document.querySelectorAll('.uni-tabbar__item, .tabbar-item');
      for (const tab of tabs) {
        if (tab.textContent.includes('我的')) {
          tab.click();
          break;
        }
      }
    });
    await this.wait(WAIT_TIMEOUTS.MEDIUM);
    return this;
  }

  /**
   * 点击退出登录按钮
   */
  async clickLogout() {
    // 多次滚动到底部确保按钮在视图中
    for (let i = 0; i < 3; i++) {
      await this.scrollToBottom();
      const isVisible = await this.page.locator(SELECTORS.logoutBtn).first().isVisible();
      if (isVisible) break;
      await this.wait(WAIT_TIMEOUTS.MEDIUM);
    }
    // 强制点击
    await this.page.locator(SELECTORS.logoutBtn).first().click({ force: true });
    await this.wait(WAIT_TIMEOUTS.MEDIUM);
    return this;
  }

  /**
   * 确认退出登录
   */
  async confirmLogout() {
    await this.expectVisible(SELECTORS.modal);
    const modalText = await this.page.locator(SELECTORS.modalBody).first().textContent();

    // 如果出现"用户信息已过期"提示，关闭后已退出，直接验证在欢迎页
    if (modalText.includes(TEXT_CONTENT.SESSION_EXPIRED) || modalText.includes(TEXT_CONTENT.PLEASE_RELOGIN)) {
      await this.expectVisible(SELECTORS.modalConfirm);
      await this.page.locator(SELECTORS.modalConfirm).first().click({ force: true });
      await this.wait(WAIT_TIMEOUTS.MEDIUM);
      // 已自动退出到欢迎页
      await this.welcomePage.expectOnWelcomePage();
      return;
    }

    expect(modalText).toContain(TEXT_CONTENT.LOGOUT_CONFIRM);

    await this.expectVisible(SELECTORS.modalConfirm);
    await this.page.locator(SELECTORS.modalConfirm).first().click({ force: true });
    return this;
  }

  /**
   * 执行完整退出流程（假设已在"我的"页面）
   * 退出后验证返回到 WelcomePage
   */
  async logout() {
    await this.clickLogout();
    await this.confirmLogout();
    await this.welcomePage.expectOnWelcomePage();
    return this;
  }

  /**
   * 验证在"我的"页面
   */
  async expectOnProfilePage() {
    await this.scrollToBottom();
    const pageText = await this.getPageText();
    expect(pageText).toContain('我的');
    return this;
  }

  /**
   * 验证退出按钮可见
   */
  async expectLogoutButtonVisible() {
    await this.scrollToBottom();
    await this.expectVisible(SELECTORS.logoutBtn);
    return this;
  }
}
