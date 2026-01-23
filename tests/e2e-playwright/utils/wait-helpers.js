/**
 * 智能等待辅助函数
 * 替代硬编码的 waitForTimeout，提供更可靠的等待策略
 */

// ==================== 常量定义 ====================
export const WAIT_TIMEOUTS = {
  DEFAULT: 10000,
  SHORT: 5000,
  LONG: 30000,
  CHECK_INTERVAL: 100,
  NAVIGATION: 500,
};

// ==================== 等待函数 ====================

/**
 * 等待页面稳定
 */
export async function waitForPageStable(page, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT, checkInterval = WAIT_TIMEOUTS.CHECK_INTERVAL } = options;

  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
  await page.waitForTimeout(checkInterval);
}

/**
 * 等待文本内容出现在页面中
 */
export async function waitForTextContent(page, expectedText, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT } = options;

  await page.waitForFunction(
    (text) => document.body.textContent.includes(text),
    expectedText,
    { timeout }
  );
}

/**
 * 等待导航完成
 */
export async function waitForNavigationComplete(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(WAIT_TIMEOUTS.NAVIGATION);
}

/**
 * 等待元素出现并可见
 */
export async function waitForElementVisible(page, selector, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT } = options;

  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
  });
}

/**
 * 等待元素消失
 */
export async function waitForElementHidden(page, selector, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT } = options;

  await page.waitForSelector(selector, {
    state: 'hidden',
    timeout,
  });
}

/**
 * 等待 URL 匹配指定模式
 */
export async function waitForUrl(page, pattern, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT } = options;
  await page.waitForURL(pattern, { timeout });
}

/**
 * 等待 API 请求完成
 */
export async function waitForApiResponse(page, urlPattern, timeout = WAIT_TIMEOUTS.LONG) {
  return await page.waitForResponse(
    (response) => response.url().includes(urlPattern),
    { timeout }
  );
}

/**
 * 等待多个符合条件的 API 请求完成
 */
export async function waitForMultipleApiResponses(page, urlPattern, count, timeout = WAIT_TIMEOUTS.LONG) {
  const responses = [];

  for (let i = 0; i < count; i++) {
    const response = await waitForApiResponse(page, urlPattern, timeout);
    responses.push(response);
  }

  return responses;
}

/**
 * 智能等待条件满足
 */
export async function waitForCondition(condition, options = {}) {
  const { timeout = WAIT_TIMEOUTS.DEFAULT, interval = 200 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * 等待 Toast 消息出现并消失
 */
export async function waitForToast(page, message = null, options = {}) {
  const { timeout = WAIT_TIMEOUTS.SHORT } = options;

  const toastSelector = '[data-testid^="toast-"]';

  await waitForElementVisible(page, toastSelector, { timeout });

  if (message) {
    const toastMessage = await page.locator(toastSelector).textContent();
    if (!toastMessage.includes(message)) {
      throw new Error(`Toast message mismatch. Expected: ${message}, Got: ${toastMessage}`);
    }
  }

  await waitForElementHidden(page, toastSelector, { timeout });
}

/**
 * 等待模态框打开
 */
export async function waitForModalOpen(page, modalSelector, options = {}) {
  const { timeout = WAIT_TIMEOUTS.SHORT } = options;
  await waitForElementVisible(page, modalSelector, { timeout });
}

/**
 * 等待模态框关闭
 */
export async function waitForModalClose(page, modalSelector, options = {}) {
  const { timeout = WAIT_TIMEOUTS.SHORT } = options;
  await waitForElementHidden(page, modalSelector, { timeout });
}
