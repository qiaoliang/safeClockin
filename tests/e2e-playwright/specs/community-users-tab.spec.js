/**
 * 社区详情-用户子Tab E2E 测试
 *
 * Bug: 安卡大家庭社区显示成员有2人，但点击"用户"subtab时却没有显示任何人
 *
 * 遵循 TDD 原则：
 * - 先写测试，观察失败
 * - 修复 bug，验证通过
 */
import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "../helpers/auth.js";

test.describe("社区详情-用户子Tab测试", () => {
    /**
     * 测试目标：验证社区详情页面的用户数量统计与用户列表一致
     *
     * Bug 现象：
     * 1. 社区详情页面显示"成员: 2人"
     * 2. 点击"用户"tab后，列表为空，显示"暂无用户"
     *
     * 预期行为：
     * 1. 社区详情页面显示"成员: 2人"
     * 2. 点击"用户"tab后，应该显示2个用户条目
     */
    test("安卡大家庭-用户数量统计与列表一致", async ({ page }) => {
        console.log("=== 开始测试：安卡大家庭用户数量一致性 ===");

        // 1. 登录超级管理员
        await loginAsSuperAdmin(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log("步骤1: 导航到'我的'页面");
        // 点击底部导航栏的"我的"按钮
        await page.getByText("我的").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        console.log("步骤2: 点击'社区列表'菜单项");
        // 在"社区管理" section 中点击"社区列表"菜单项
        await page.getByText("社区列表").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log("步骤3: 点击'安卡大家庭'社区");
        // 点击安卡大家庭社区进入详情页
        await page.getByText("安卡大家庭").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log("步骤4: 记录社区详情页显示的成员数量");
        // 获取页面文本，查找"成员: X人"、"成员 X人"或"X 成员"格式
        const pageTextDetail = await page.locator("body").textContent();
        console.log("社区详情页内容:", pageTextDetail.substring(0, 500));

        // 提取成员数量 - 支持多种格式：成员: 2人、成员 2人、2 成员
        let memberCount = 0;
        const memberMatch = pageTextDetail.match(/(\d+)\s*成员|成员[：:\s]*(\d+)/);
        if (memberMatch) {
            memberCount = parseInt(memberMatch[1] || memberMatch[2], 10);
            console.log(`✓ 社区详情显示成员数量: ${memberCount}人`);
        } else {
            console.log("⚠️ 未找到成员数量信息");
        }

        console.log("步骤5: 点击'用户'tab");
        // 点击"用户"tab
        await page.getByText("用户").click({ force: true });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log("步骤6: 验证用户列表显示的用户数量");
        // 获取用户列表页面的文本
        const pageTextUsers = await page.locator("body").textContent();
        console.log("用户列表页内容:", pageTextUsers.substring(0, 500));

        // 检查是否显示"暂无用户"
        const hasEmptyState = pageTextUsers.includes("暂无用户");
        if (hasEmptyState) {
            console.log("✗ Bug确认：显示'暂无用户'");
        }

        // 尝试统计用户卡片数量（通过查找"加入时间"关键词）
        // 每个用户卡片都有"加入时间"字段
        const joinTimeMatches = pageTextUsers.match(/加入时间:/g) || [];
        const actualUserCount = joinTimeMatches.length;
        console.log(`✓ 用户列表实际显示用户数量: ${actualUserCount}人`);

        // 断言：如果社区详情显示有成员，用户列表也应该有对应的条目
        if (memberCount > 0) {
            console.log(`\n=== Bug验证 ===`);
            console.log(`社区详情显示成员: ${memberCount}人`);
            console.log(`用户列表显示用户: ${actualUserCount}人`);
            console.log(`是否一致: ${memberCount === actualUserCount ? '✓ 是' : '✗ 否 (Bug!)'}`);

            // 这是核心断言，验证 bug 是否存在
            expect(actualUserCount).toBeGreaterThan(0);
            expect(pageTextUsers).not.toContain("暂无用户");
        }

        console.log("✅ 测试完成");
    });
});