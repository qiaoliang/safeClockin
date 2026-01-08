/**
 * 用户批量转移功能E2E测试
 */
import { test, expect } from '@playwright/test'

test.describe('用户批量转移功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:8080/#/login')
    await page.fill('input[placeholder="请输入手机号"]', '13141516171')
    await page.fill('input[placeholder="请输入密码"]', 'F1234567')
    await page.click('button:has-text("登录")')

    // 等待登录成功
    await page.waitForURL('**/home-community')
  })

  test('完整的批量转移流程', async ({ page }) => {
    // 1. 进入社区管理页面
    await page.click('text=社区管理')
    await page.waitForURL('**/community-manage')

    // 2. 点击第一个社区
    await page.click('.community-item:first-child')
    await page.waitForURL('**/community-details-new')

    // 3. 点击批量转移按钮
    await page.click('text=批量转移')

    // 4. 验证进入多选模式
    await expect(page.locator('.checkbox')).toBeVisible()

    // 5. 选择3个用户
    await page.click('.user-card:nth-child(1) .checkbox')
    await page.click('.user-card:nth-child(2) .checkbox')
    await page.click('.user-card:nth-child(3) .checkbox')

    // 6. 验证已选数量
    await expect(page.locator('text=/确定 \\(3\\/10\\)/')).toBeVisible()

    // 7. 点击确定按钮
    await page.click('text=确定 (3/10)')

    // 8. 验证目标社区选择器弹出
    await expect(page.locator('.target-community-selector')).toBeVisible()
    await expect(page.locator('text=选择目标社区')).toBeVisible()

    // 9. 选择目标社区（第二个社区）
    await page.click('.community-item:nth-child(2)')
    await expect(page.locator('.community-item.selected')).toBeVisible()

    // 10. 点击下一步
    await page.click('text=下一步')

    // 11. 验证转移预览对话框弹出
    await expect(page.locator('.transfer-preview-modal')).toBeVisible()
    await expect(page.locator('text=确认转移')).toBeVisible()

    // 12. 验证预览信息
    await expect(page.locator('text=/源社区：/')).toBeVisible()
    await expect(page.locator('text=/目标社区：/')).toBeVisible()
    await expect(page.locator('text=/待转移用户：3人/')).toBeVisible()

    // 13. 点击确认转移
    await page.click('text=确认转移')

    // 14. 等待转移完成
    await expect(page.locator('text=转移中...')).toBeVisible()
    await expect(page.locator('text=转移中...')).not.toBeVisible()

    // 15. 验证结果对话框弹出
    await expect(page.locator('.transfer-result-modal')).toBeVisible()
    await expect(page.locator('text=转移成功')).toBeVisible()

    // 16. 验证结果信息
    await expect(page.locator('text=/成功转移 3 个用户/')).toBeVisible()

    // 17. 点击确定
    await page.click('text=确定')

    // 18. 验证退出多选模式
    await expect(page.locator('.checkbox')).not.toBeVisible()
    await expect(page.locator('text=批量转移')).toBeVisible()
  })

  test('超过10个用户限制', async ({ page }) => {
    // 进入社区管理页面
    await page.click('text=社区管理')
    await page.waitForURL('**/community-manage')
    await page.click('.community-item:first-child')
    await page.waitForURL('**/community-details-new')

    // 点击批量转移按钮
    await page.click('text=批量转移')

    // 尝试选择11个用户
    for (let i = 1; i <= 11; i++) {
      await page.click(`.user-card:nth-child(${i}) .checkbox`)
    }

    // 验证错误提示
    await expect(page.locator('text=一次最多选择10个用户')).toBeVisible()

    // 验证只能选择10个
    await expect(page.locator('text=/确定 \\(10\\/10\\)/')).toBeVisible()
  })

  test('未选择用户点击确定', async ({ page }) => {
    // 进入社区管理页面
    await page.click('text=社区管理')
    await page.waitForURL('**/community-manage')
    await page.click('.community-item:first-child')
    await page.waitForURL('**/community-details-new')

    // 点击批量转移按钮
    await page.click('text=批量转移')

    // 直接点击确定（未选择用户）
    await page.click('text=确定 (0/10)')

    // 验证提示
    await expect(page.locator('text=请选择要转移的用户')).toBeVisible()
  })

  test('取消批量转移', async ({ page }) => {
    // 进入社区管理页面
    await page.click('text=社区管理')
    await page.waitForURL('**/community-manage')
    await page.click('.community-item:first-child')
    await page.waitForURL('**/community-details-new')

    // 点击批量转移按钮
    await page.click('text=批量转移')

    // 选择2个用户
    await page.click('.user-card:nth-child(1) .checkbox')
    await page.click('.user-card:nth-child(2) .checkbox')

    // 点击取消
    await page.click('text=取消')

    // 验证退出多选模式
    await expect(page.locator('.checkbox')).not.toBeVisible()
    await expect(page.locator('text=批量转移')).toBeVisible()
  })

  test('部分成功转移', async ({ page }) => {
    // 进入社区管理页面
    await page.click('text=社区管理')
    await page.waitForURL('**/community-manage')
    await page.click('.community-item:first-child')
    await page.waitForURL('**/community-details-new')

    // 点击批量转移按钮
    await page.click('text=批量转移')

    // 选择用户（包含已离开源社区的用户）
    await page.click('.user-card:nth-child(1) .checkbox')
    await page.click('.user-card:nth-child(2) .checkbox')

    // 点击确定
    await page.click('text=确定 (2/10)')

    // 选择目标社区
    await page.click('.community-item:nth-child(2)')
    await page.click('text=下一步')

    // 点击确认转移
    await page.click('text=确认转移')

    // 验证结果对话框
    await expect(page.locator('.transfer-result-modal')).toBeVisible()
    await expect(page.locator('text=转移完成')).toBeVisible()

    // 验证跳过提示
    await expect(page.locator('text=/跳过 1 个用户/')).toBeVisible()
  })
})
