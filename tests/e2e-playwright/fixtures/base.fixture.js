/**
 * 自定义 Fixtures
 * 扩展 Playwright 基础 fixtures，添加页面对象和常用功能
 */
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { PhoneLoginPage } from '../pages/PhoneLoginPage.js';
import { HomePage } from '../pages/HomePage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { CommunityListPage } from '../pages/CommunityListPage.js';
import { TEST_USERS } from './test-data.mjs';

/**
 * 扩展基础 test，添加页面对象
 */
export const test = base.extend({
  /**
   * 登录页面对象
   */
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  /**
   * 手机登录页面对象
   */
  phoneLoginPage: async ({ page }, use) => {
    await use(new PhoneLoginPage(page));
  },

  /**
   * 首页面对象
   */
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  /**
   * 个人中心页面对象
   */
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  /**
   * 社区列表页面对象
   */
  communityListPage: async ({ page }, use) => {
    await use(new CommunityListPage(page));
  },

  /**
   * 已认证的页面（自动登录超级管理员）
   * 用于需要登录状态的测试
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    await use(page);
  },

  /**
   * 已登录的超级管理员用户对象
   * 包含登录信息和页面对象
   */
  superAdminUser: async ({ page }, use) => {
    const user = TEST_USERS.SUPER_ADMIN;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();

    await use({
      page,
      user,
      loginPage,
    });
  },

  /**
   * 已登录的社区管理员用户对象
   * 包含登录信息和页面对象
   */
  communityAdminUser: async ({ page }, use) => {
    const user = TEST_USERS.COMMUNITY_ADMIN;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickPhoneLogin();

    const phoneLoginPage = new PhoneLoginPage(page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);

    await use({
      page,
      user,
      loginPage,
      phoneLoginPage,
    });
  },

  /**
   * 已登录的普通员工用户对象
   * 包含登录信息和页面对象
   */
  staffUser: async ({ page }, use) => {
    const user = TEST_USERS.STAFF;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickPhoneLogin();

    const phoneLoginPage = new PhoneLoginPage(page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);

    await use({
      page,
      user,
      loginPage,
      phoneLoginPage,
    });
  },

  /**
   * 已登录的普通用户对象
   * 包含登录信息和页面对象
   */
  normalUser: async ({ page }, use) => {
    const user = TEST_USERS.NORMAL;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.clickPhoneLogin();

    const phoneLoginPage = new PhoneLoginPage(page);
    await phoneLoginPage.loginWithPassword(user.phone, user.password);

    await use({
      page,
      user,
      loginPage,
      phoneLoginPage,
    });
  },
});

export const expect = test.expect;
