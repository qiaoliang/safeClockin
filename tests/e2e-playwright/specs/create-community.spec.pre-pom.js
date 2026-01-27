/**
 * 创建社区 E2E 测试
 *
 * 遵循测试反模式指南：
 * - 测试真实组件行为，而非 mock 行为
 * - 验证真实用户界面，而非模拟数据
 * - 不向生产类添加仅用于测试的方法
 * - 在理解依赖的情况下进行最小化 mock
 */
import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "../helpers/auth.js";

test.describe("超级管理员创建社区测试", () => {
    /**
     * 完整的创建社区流程测试
     *
     * 目标: 验证超级管理员可以成功创建一个新社区
     *
     * 测试步骤:
     * 1. 超级管理员登录
     * 2. 导航到社区管理页面
     * 3. 打开创建社区表单
     * 4. 填写社区信息(名称、位置)
     * 5. 提交创建
     * 6. 验证创建成功(新社区出现在列表中)
     */
    test("创建新社区", async ({ page }) => {
        console.log("=== 开始创建社区测试 ===");

        // 1. 登录
        await loginAsSuperAdmin(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log("步骤1: 检查当前页面");
        // 检查当前页面
        const currentPageText = await page.locator("body").textContent();
        console.log(`当前页面包含: ${currentPageText.substring(0, 200)}`);

        // 如果不在"我的"页面,点击导航栏的"我的"按钮
        if (!currentPageText.includes("我的")) {
            console.log("当前不在'我的'页面,点击导航栏的'我的'按钮");
            await page.getByText("我的").click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(2000);
        }

        console.log("步骤2: 导航到'我的'页面");
        // 点击"我的"导航按钮
        await page.locator('.uni-tabbar__label').filter({ hasText: '我的' }).click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log("步骤3: 查找'社区管理'section");
        // 查找"社区管理" section
        const pageTextAfterNav = await page.locator("body").textContent();
        if (!pageTextAfterNav.includes("社区管理")) {
            console.log("未找到'社区管理'section,当前页面内容:");
            console.log(pageTextAfterNav.substring(0, 300));
            throw new Error("无法找到'社区管理'section,无法继续测试");
        }

        await page.waitForLoadState("networkidle");

        console.log("步骤4: 点击'社区列表'菜单项");
        // 点击"社区列表"
        await page.getByText("社区列表").click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log("步骤5: 验证成功跳转到'社区管理'页面");
        // 验证成功跳转到"社区管理"页面
        const pageTextVerify = await page.locator("body").textContent();
        expect(pageTextVerify).toContain("社区管理");

        // 记录创建前的社区数量(用于日志)
        const pageTextBefore = await page.locator("body").textContent();
        const communityLinesBefore = pageTextBefore.match(/.*社区.*/g) || [];
        console.log(`创建前社区数量: ${communityLinesBefore.length}`);

        // 6. 打开创建社区表单
        await page.waitForTimeout(1000);
        const addButton = page.locator(".floating-add-btn");
        await expect(addButton).toBeVisible({ timeout: 5000 });
        await addButton.click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 7. 填写社区名称
        const newCommunityName = `测试社区_${Date.now()}`;
        const input = page.locator(".uni-input-input");
        await input.click();
        await page.keyboard.type(newCommunityName);
        await page.waitForTimeout(500);

        // 8. 选择位置
        const locationSelector = page.getByText("点击选择位置");
        await expect(locationSelector).toBeVisible({ timeout: 5000 });
        await locationSelector.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        const pageTextAfterClick = await page.locator("body").textContent();
        if (pageTextAfterClick.includes("地图") || pageTextAfterClick.includes("选择位置")) {
            const viewportSize = page.viewportSize();
            if (viewportSize) {
                await page.mouse.click(viewportSize.width / 2, viewportSize.height / 2);
                await page.waitForTimeout(1000);
            }

            const confirmButton = page.getByText("确定").or(page.getByText("确认")).or(page.getByText("完成"));
            const isConfirmVisible = await confirmButton.isVisible().catch(() => false);

            if (isConfirmVisible) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
            }
        }

        // 9. 提交创建
        await page.getByText("创建社区").click();
        await page.waitForLoadState("networkidle");

        // 等待创建成功提示
        await page.waitForTimeout(2000);

        console.log("步骤10: 手动点击返回按钮");
        // 手动点击返回按钮(因为uni.navigateBack可能在测试环境不生效)
        const backButton = page.locator('.uni-icon-back').or(page.getByText('取消')).or(page.locator('[class*="back"]'));
        const isBackVisible = await backButton.isVisible().catch(() => false);

        if (isBackVisible) {
            await backButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(3000);
        }

        console.log("步骤11: 验证成功返回到'社区管理'页面");
        // 验证成功返回到"社区管理"页面
        const pageTextAfter = await page.locator("body").textContent();
        expect(pageTextAfter).toContain("社区管理");

        console.log("步骤12: 等待数据加载完成");
        // 额外等待,确保onShow触发的数据加载完成
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log("步骤13: 验证新创建的社区出现在列表中");
        // 验证新创建的社区出现在列表中
        const pageTextFinal = await page.locator("body").textContent();
        expect(pageTextFinal).toContain(newCommunityName);

        console.log("✅ 测试完成: 创建社区成功");
    });
});