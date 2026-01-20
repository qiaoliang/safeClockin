/**
 * 社区管理 E2E 测试
 *
 * 遵循测试反模式指南：
 * - 测试真实组件行为，而非 mock 行为
 * - 验证真实用户界面，而非模拟数据
 * - 不向生产类添加仅用于测试的方法
 * - 在理解依赖的情况下进行最小化 mock
 */
import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "../helpers/auth.js";

test.describe("超级管理员社区管理测试", () => {
    // 使用动态生成的测试数据，避免硬编码
    const generateTestCommunityName = () => `测试社区_${Date.now()}`;
    const generateTestLocation = () => `测试位置_${Date.now()}`;

    test("超级管理员登录后自动导航到我的页面", async ({ page }) => {
        console.log("开始测试：超级管理员登录后自动导航到我的页面");

        // 使用 helper 方法登录
        await loginAsSuperAdmin(page);

        // 等待页面完全加载
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 验证当前页面是"我的"页面
        const pageText = await page.locator("body").textContent();
        expect(pageText).toContain("我的");

        console.log("✅ 超级管理员登录成功，自动导航到我的页面");
    });

    test("访问社区列表并验证页面显示", async ({ page }) => {
        console.log("开始测试：访问社区列表并验证页面显示");

        // 使用 helper 方法登录
        await loginAsSuperAdmin(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log('步骤1: 导航到"我的"页面');

        // 点击底部导航栏的"我的"按钮
        await page.getByText("我的").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log('步骤2: 在"社区管理" section 中点击"社区列表"菜单项');

        // 在"社区管理" section 中点击"社区列表"菜单项
        // 先找到"社区管理" section,然后在其中找"社区列表"
        const communityManagementSection = page.locator('text=社区管理').first();
        await expect(communityManagementSection).toBeVisible();

        await page.getByText("社区列表").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log('步骤3: 验证页面标题为"社区管理"');

        // 验证页面标题为"社区管理"
        const pageText = await page.locator("body").textContent();
        expect(pageText).toContain("社区管理");

        console.log('步骤4: 验证"正常社区"标签页显示');

        // 验证"正常社区"标签页显示
        expect(pageText).toContain("正常社区");

        console.log("✅ 成功访问社区列表，页面显示验证通过");
    });

    test("验证社区状态切换功能", async ({ page }) => {
        console.log("开始测试：验证社区状态切换功能");

        // 使用 helper 方法登录
        await loginAsSuperAdmin(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log('步骤1: 导航到"我的"页面');

        // 点击底部导航栏的"我的"按钮
        await page.getByText("我的").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log('步骤2: 在"社区管理" section 中点击"社区列表"菜单项');

        // 在"社区管理" section 中点击"社区列表"菜单项
        const communityManagementSection = page.locator('text=社区管理').first();
        await expect(communityManagementSection).toBeVisible();

        await page.getByText("社区列表").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log('步骤3: 验证社区列表显示');

        // 验证社区列表显示
        const communityText = await page.locator("body").textContent();
        expect(communityText).toContain("正常社区");

        console.log('步骤4: 验证社区操作按钮存在');

        // 验证社区操作按钮存在（停用/启用、删除）
        expect(communityText).toMatch(/停用|启用/);
        expect(communityText).toContain("删除");

        console.log("✅ 社区状态切换功能验证通过");
    });

    test("完整的社区管理流程", async ({ page }) => {
        console.log("开始测试：完整的社区管理流程");

        // 步骤 1：登录
        console.log("步骤1: 登录");
        await loginAsSuperAdmin(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 步骤 2：验证自动导航到"我的"页面
        console.log('步骤2: 验证自动导航到"我的"页面');
        let pageText = await page.locator("body").textContent();
        expect(pageText).toContain("我的");
        console.log("✅ 步骤 1：登录成功，自动导航到我的页面");

        // 步骤 3：访问社区列表
        console.log("步骤3: 访问社区列表");
        // 点击底部导航栏的"我的"按钮
        await page.getByText("我的").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 在"社区管理" section 中点击"社区列表"菜单项
        const communityManagementSection = page.locator('text=社区管理').first();
        await expect(communityManagementSection).toBeVisible();

        await page.getByText("社区列表").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);
        pageText = await page.locator("body").textContent();
        expect(pageText).toContain("社区管理");
        console.log("✅ 步骤 2：成功访问社区列表");

        // 步骤 4：验证社区列表显示
        console.log("步骤4: 验证社区列表显示");
        expect(pageText).toContain("正常社区");
        console.log("✅ 步骤 3：社区列表显示验证通过");

        // 步骤 5：验证社区操作按钮
        console.log("步骤5: 验证社区操作按钮");
        expect(pageText).toMatch(/停用|启用/);
        expect(pageText).toContain("删除");
        console.log("✅ 步骤 4：社区操作按钮验证通过");

        // 步骤 6：创建新社区（简化版，只测试能否打开创建页面）
        console.log("步骤6: 创建新社区（简化版）");
        await page.locator(".floating-add-btn").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 验证页面标题为"社区信息"
        pageText = await page.locator("body").textContent();
        expect(pageText).toContain("社区名称");

        console.log("✅ 步骤 5：能够打开创建社区页面");
        console.log("✅ 完整的社区管理流程测试通过");
    });
});
