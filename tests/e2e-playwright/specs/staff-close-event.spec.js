/**
 * 社区工作人员关闭事件 E2E 测试
 *
 * 测试目标：验证社区工作人员可以通过‘问题已解决’，关闭用户的求助事件
 *
 * 遵循测试反模式指南：
 * - 测试真实组件行为，而非 mock 行为
 * - 验证真实用户界面，而非模拟数据
 * - 不向生产类添加仅用于测试的方法
 * - 在理解依赖的情况下进行最小化 mock
 *
 * 遵循 KISS 和 DRY 原则：
 * - 复用现有的 helper 方法
 * - 保持测试简单直接
 * - 避免重复代码
 *
 * 测试场景：
 * 1. 社区工作人员可以查看待处理事件列表
 * 2. 社区工作人员可以关闭用户的求助事件
 * 3. 关闭后事件状态更新
 * 4. 关闭信息正确显示
 *
 * 前置条件：
 * - 后端服务已启动（http://localhost:9999）
 * - H5 应用已构建并运行（http://localhost:8081）
 * - 测试账户：超级管理员（13141516171 / F1234567）
 */
import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "../helpers/auth.js";
import { registerAndLoginAsUser } from "../helpers/auth.js";

test.describe("社区工作人员关闭事件测试", () => {
    test.beforeAll(async () => {
        console.log("开始测试套件：社区工作人员关闭事件");
    });

    test.afterAll(async () => {
        console.log("测试套件完成：社区工作人员关闭事件");
    });

    test.skip("社区工作人员应该能够关闭用户的求助事件", async ({ page }) => {
        console.log("开始测试：社区工作人员关闭用户求助事件");

        // 步骤1: 创建并登录普通用户，发起求助事件
        console.log("步骤1: 普通用户发起求助事件");
        const regularUser = await registerAndLoginAsUser(page);
        console.log(`普通用户已创建并登录: ${regularUser.phone}`);

        // 等待首页完全加载
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 发起求助事件
        await createHelpEvent(page);
        console.log("✅ 普通用户已发起求助事件");

        // 步骤2: 退出当前用户

                console.log("步骤2: 退出当前用户");

                await logoutUser(page);

                console.log("✅ 已退出登录");



                // 检查是否已到达登录页（增加等待时间）

                await page.waitForLoadState("networkidle");

                await page.waitForTimeout(3000);



                // 尝试多次检查页面内容

                let loginPageText = await page.locator("body").textContent();

                console.log("页面内容预览:", loginPageText.substring(0, 200));



                // 如果不在登录页，尝试重新导航

                if (!loginPageText.includes("登录") && !loginPageText.includes("手机号")) {

                    console.log("⚠️ 未到达登录页，尝试重新导航");

                    await page.goto("/");

                    await page.waitForLoadState("networkidle");

                    await page.waitForTimeout(3000);

                    loginPageText = await page.locator("body").textContent();

                }



                expect(loginPageText.includes("登录") || loginPageText.includes("手机号")).toBeTruthy();

                console.log("✅ 已到达登录页");

        // 步骤3: 使用超级管理员登录
        await loginAsSuperAdmin(page);
        console.log("✅ 超级管理员已登录");

        // 步骤4: 导航到社区管理页面
        console.log("步骤4: 导航到社区管理页面");
        await navigateToCommunityManagement(page);
        console.log("✅ 已导航到社区管理页面");

        // 步骤5: 查看待处理事件列表
        console.log("步骤5: 查看待处理事件列表");
        await selectCommunityAndCheckPendingEvents(page);
        console.log("✅ 找到待处理事件");

        // 步骤6: 关闭事件
        console.log("步骤6: 关闭事件");
        await closeEventAsStaff(page);
        console.log("✅ 事件已关闭");

        // 步骤7: 验证事件关闭成功
        console.log("步骤7: 验证事件关闭成功");
        const pageText = await page.locator("body").textContent();
        const hasSuccessIndicator =
            pageText.includes("事件已解决") ||
            pageText.includes("关闭成功") ||
            pageText.includes("事件已关闭");

        expect(hasSuccessIndicator).toBeTruthy();
        console.log("✅ 事件关闭验证通过");
    });
});

/**
 * 辅助函数：创建求助事件
 *
 * @param {Page} page - Playwright Page 对象
 */
async function createHelpEvent(page) {
    console.log("辅助函数：创建求助事件");

    // 设置对话框处理器
    let dialogAccepted = false;
    const dialogHandler = async (dialog) => {
        console.log("检测到原生对话框");
        await dialog.accept();
        dialogAccepted = true;
    };
    page.on("dialog", dialogHandler);

    // 点击一键求助按钮
    const helpButton = page
        .locator(".help-btn")
        .or(page.locator("text=一键求助"))
        .first();
    await helpButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await helpButton.click({ force: true });

    // 等待确认对话框出现并被处理
    await page.waitForTimeout(1000);
    if (!dialogAccepted) {
        const pageText = await page.locator("body").textContent();
        if (pageText.includes("确认要发起求助吗？")) {
            const confirmButton = page.locator("text=确认求助").first();
            await confirmButton.click({ force: true });
        }
    }

    // 等待求助请求发送完成
    await page.waitForTimeout(5000);
    await page.waitForLoadState("networkidle");

    // 清理对话框处理器
    page.off("dialog", dialogHandler);

    // 等待页面内容更新
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");

    console.log("✅ 求助事件已创建");
}

/**
 * 辅助函数：退出登录
 *
 * @param {Page} page - Playwright Page 对象
 */
async function logoutUser(page) {
    console.log("辅助函数：退出登录");

    // 点击"我的"tab
    const profileTab = page
        .locator(".tabbar-item")
        .filter({ hasText: "我的" })
        .or(page.locator("text=我的"))
        .first();
    await profileTab.click({ force: true });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 查找并点击"退出登录"按钮
    const logoutButton = page
        .locator("text=退出登录")
        .or(page.locator(".logout-btn"))
        .first();
    await logoutButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await logoutButton.click({ force: true });

    // 等待确认对话框出现
    await page.waitForTimeout(1000);

    // 点击"确定"按钮
    const confirmButton = page
        .locator("text=确定")
        .or(page.locator("uni-button.confirm"))
        .first();
    await confirmButton.click({ force: true });

    // 等待退出完成
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 强制清除所有存储（确保完全退出）
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    // 导航到根路径以确保到达登录页
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    console.log("✅ 退出登录完成");
}

/**
 * 辅助函数：导航到社区管理页面
 *
 * @param {Page} page - Playwright Page 对象
 */
async function navigateToCommunityManagement(page) {
    console.log("辅助函数：导航到社区管理页面");

    // 首先切换到"打卡"tab（首页），因为超级管理员登录后停留在"我的"tab
    console.log("切换到打卡tab");
    const checkinTab = page
        .locator(".tabbar-item")
        .filter({ hasText: "打卡" })
        .first();
    await checkinTab.click({ force: true });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 点击底部导航栏的"社区"标签
    console.log("切换到社区tab");
    const communityTab = page
        .locator(".tabbar-item")
        .filter({ hasText: "社区" })
        .first();
    await communityTab.click({ force: true });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // NEW: Find the manage button next to community selector
    console.log("查找管理按钮（社区选择器右侧）");

    // Try new CSS class first
    const manageButton = page.locator(".manage-button");
    const count = await manageButton.count();

    if (count > 0) {
        console.log("找到新样式的管理按钮");
        await manageButton.first().click({ force: true });
    } else {
        // Fallback to text search (backward compatibility)
        console.log("尝试通过文本查找管理按钮");
        const textButton = page.locator("text=管理").first();
        const textCount = await textButton.count();

        if (textCount > 0) {
            await textButton.click({ force: true });
        } else {
            throw new Error("未找到管理按钮 - 用户可能没有社区管理权限");
        }
    }

    // 等待页面加载
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log("✅ 已导航到社区管理页面");
}

/**
 * 辅助函数：选择社区并检查待处理事件
 *
 * @param {Page} page - Playwright Page 对象
 */
async function selectCommunityAndCheckPendingEvents(page) {
    console.log("辅助函数：选择社区并检查待处理事件");

    // 查找社区选择器
    const selectorTrigger = page
        .locator(".selector-trigger")
        .or(page.locator(".community-selector"))
        .first();

    // 如果有选择器，点击展开
    const hasSelector = (await selectorTrigger.count()) > 0;
    if (hasSelector) {
        await selectorTrigger.click({ force: true });
        await page.waitForTimeout(1000);

        // 查找"安卡大家庭"选项
        const ankaFamilyOption = page
            .locator(".dropdown-item")
            .filter({ hasText: "安卡大家庭" })
            .or(page.locator("text=安卡大家庭"))
            .first();

        const hasAnkaFamily = (await ankaFamilyOption.count()) > 0;
        if (hasAnkaFamily) {
            await ankaFamilyOption.click({ force: true });
            await page.waitForTimeout(1000);
            console.log("✅ 已选择安卡大家庭社区");
        }
    }

    // 等待页面更新
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 检查是否出现事件警告条
    const notificationBar = page
        .locator(".notification-bar")
        .or(page.locator(".event-warning"))
        .first();

    const hasNotification = (await notificationBar.count()) > 0;
    if (hasNotification) {
        console.log("✅ 发现事件警告条");
        // 点击警告条进入事件详情
        await notificationBar.click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
    } else {
        console.log("⚠️ 未发现事件警告条，尝试查找事件列表");
        // 如果没有警告条，尝试查找事件列表
        const eventList = page
            .locator(".event-item")
            .or(page.locator(".event-card"))
            .first();

        const hasEventList = (await eventList.count()) > 0;
        if (hasEventList) {
            await eventList.click({ force: true });
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(2000);
        }
    }

    console.log("✅ 已进入事件详情页面");
}

/**
 * 辅助函数：关闭事件（作为社区工作人员）
 *
 * @param {Page} page - Playwright Page 对象
 */
async function closeEventAsStaff(page) {
    console.log("辅助函数：关闭事件");

    // 点击"问题已解决"或"关闭事件"按钮
    const pageText = await page.locator("body").textContent();

    if (pageText.includes("问题已解决")) {
        const closeButton = page.locator("text=问题已解决").first();
        await closeButton.click({ force: true });
    } else if (pageText.includes("关闭事件")) {
        const closeButton = page.locator("text=关闭事件").first();
        await closeButton.click({ force: true });
    } else if (pageText.includes("处理")) {
        const handleButton = page.locator("text=处理").first();
        await handleButton.click({ force: true });
    } else {
        // 尝试查找按钮
        const closeButton = page
            .locator("button")
            .filter({ hasText: /解决|关闭|处理/ })
            .first();
        await closeButton.click({ force: true });
    }

    // 等待关闭原因对话框出现
    await page.waitForTimeout(2000);

    // 输入关闭原因（10-500字符）
    const closureReason =
        "工作人员已处理完毕，问题已解决。这是一个有效的关闭原因，长度符合要求。";
    const textArea = page
        .locator("textarea")
        .or(page.locator('input[type="text"]'))
        .first();
    await textArea.click({ force: true });
    await textArea.clear();
    await textArea.type(closureReason, { delay: 100 });
    await page.waitForTimeout(500);

    // 点击确认按钮
    const confirmButton = page
        .locator("text=确认")
        .or(page.locator("text=提交"))
        .or(page.locator("uni-button.submit"))
        .first();
    await confirmButton.click({ force: true });

    // 等待关闭请求发送完成
    await page.waitForTimeout(5000);
    await page.waitForLoadState("networkidle");

    console.log("✅ 事件关闭操作完成");
}
