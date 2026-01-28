/**
 * ProfilePage - 个人中心页
 * 处理用户个人信息、设置和社区管理入口
 */
import { BasePage } from './BasePage.js';
import { profileSelectors, communitySelectors } from '../utils/selectors.js';

export class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = profileSelectors;
  }

  /**
   * 检查个人中心页是否加载完成
   */
  async isLoaded() {
    // 等待页面加载
    await this.page.waitForTimeout(2000);

    // 验证页面包含个人中心相关内容
    const pageText = await this.getPageText();
    const hasProfileContent = pageText.includes('我的') || pageText.includes('个人中心');

    if (!hasProfileContent) {
      throw new Error('个人中心页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
  }

  /**
   * 检查是否在个人中心页面
   * @returns {Promise<boolean>}
   */
  async isOnProfilePage() {
    const text = await this.getPageText();
    return text.includes('我的');
  }

  /**
   * 点击社区列表按钮，进入社区管理
   */
  async clickCommunityList() {
    // 社区列表按钮的 data-testid 是动态的：menu-社区列表
    try {
      await this.safeClick('data-testid=menu-社区列表');
    } catch {
      // 回退到文本选择器
      await this.page.getByText('社区列表', { exact: true }).click({ force: true });
    }
    await this.waitForNetworkIdle();
  }

  /**
   * 点击退出登录按钮
   */
  async clickLogout() {
    await this.safeClick(this.selectors.logoutBtn);
    await this.waitForNetworkIdle();
  }

  /**
   * 获取用户信息
   * @returns {Promise<object>} 用户信息对象
   */
  async getUserInfo() {
    // 等待页面加载
    await this.page.waitForTimeout(1000);

    // 获取整个页面文本
    const pageText = await this.getPageText();

    // 简单的文本解析，根据实际页面结构调整
    const phoneMatch = pageText.match(/1[3-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    return {
      phone,
      rawText: pageText,
    };
  }

  /**
   * 检查社区列表按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isCommunityListButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.communityListBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('社区列表');
  }

  /**
   * 检查退出登录按钮是否可见
   * @returns {Promise<boolean>}
   */
  async isLogoutButtonVisible() {
    // 先尝试使用 data-testid
    const byTestId = await this.isElementVisible(this.selectors.logoutBtn);
    if (byTestId) return true;

    // 回退到文本检查
    const pageText = await this.getPageText();
    return pageText.includes('退出登录') || pageText.includes('退出');
  }

  /**
   * 验证在个人中心页面
   */
  async expectOnProfilePage() {
    const pageText = await this.getPageText();
    const hasProfileContent = pageText.includes('我的');

    if (!hasProfileContent) {
      throw new Error('个人中心页未正确加载。页面内容: ' + pageText.substring(0, 200));
    }
    return this;
  }

  /**
   * 导航到个人中心页面（点击"我的"标签）
   */
  async navigate() {
    // 等待页面完全加载
    await this.waitForPageLoad();

    // 点击"我的"标签（底部导航栏）
    try {
      // 直接使用evaluate点击，避免可见性问题
      await this.page.evaluate(() => {
        const tabs = document.querySelectorAll('.uni-tabbar-item, .uni-tabbar__item');
        for (const tab of tabs) {
          const label = tab.querySelector('.uni-tabbar__label, .tab-label');
          if (label && label.textContent.includes('我的')) {
            tab.click();
            return;
          }
        }
        // 如果找不到，尝试查找所有包含"我的"的元素
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.textContent === '我的' && el.offsetParent !== null) {
            el.click();
            return;
          }
        }
      });
      await this.waitForPageLoad();
    } catch (e) {
      console.log('导航到个人中心失败:', e.message);
      throw e;
    }
    return this;
  }


  /**
   * 退出登录
   */
  async logout() {
    // 点击"我的"标签进入个人中心
    await this.navigate();

    // 滚动到底部找到退出按钮
    await this.page.evaluate(() => {
      const logoutBtn = document.querySelector('[data-testid="logout-btn"]');
      if (logoutBtn) {
        logoutBtn.scrollIntoView();
      }
    });
    await this.page.waitForTimeout(500);

    // 点击退出登录按钮
    await this.clickLogout();

    // 等待确认弹窗并点击确认
    try {
      // 等待弹窗出现 - 使用更宽泛的选择器
      await this.page.waitForSelector('text=确定要退出登录吗', { timeout: 3000 });
      await this.page.waitForTimeout(500);

      // 点击确定按钮 - 尝试多种方式
      const confirmBtn = this.page.locator('button:has-text("确定"), .uni-popup__btn:has-text("确定"), [class*="btn"]:has-text("确定")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click({ force: true });
      } else {
        // 使用 evaluate 直接点击
        await this.page.evaluate(() => {
          const btns = document.querySelectorAll('button, [role="button"], div[onclick], div[class*="btn"]');
          for (const btn of btns) {
            const text = btn.textContent || btn.innerText || '';
            if (text.trim() === '确定') {
              btn.click();
              return;
            }
          }
        });
      }

      await this.waitForNetworkIdle();
      await this.page.waitForTimeout(3000);
    } catch (e) {
      console.log('退出确认弹窗处理失败:', e.message);
      // 仍然等待一段时间让退出完成
      await this.page.waitForTimeout(2000);
    }
  }
}
