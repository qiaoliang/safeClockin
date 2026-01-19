/**
 * 智能等待辅助函数
 * 替代硬编码的 waitForTimeout，提供更可靠的等待策略
 */

/**
 * 等待页面稳定
 * 等待网络空闲和 DOM 内容加载完成
 *
 * @param {Page} page - Playwright Page 对象
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 * @param {number} options.checkInterval - 检查间隔（毫秒），默认 100
 */
export async function waitForPageStable(page, options = {}) {
  const { timeout = 10000, checkInterval = 100 } = options;

  // 等待网络空闲
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});

  // 等待 DOM 内容加载
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});

  // 额外检查：等待没有正在进行的动画
  await page.waitForTimeout(checkInterval);
}

/**
 * 等待文本内容出现在页面中
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} expectedText - 期望的文本
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 */
export async function waitForTextContent(page, expectedText, options = {}) {
  const { timeout = 10000 } = options;

  await page.waitForFunction(
    (text) => document.body.textContent.includes(text),
    expectedText,
    { timeout }
  );
}

/**
 * 等待导航完成
 * 等待 uni-app 路由完成和渲染完成
 *
 * @param {Page} page - Playwright Page 对象
 */
export async function waitForNavigationComplete(page) {
  // 等待 uni-app 路由完成
  await page.waitForLoadState('networkidle');
  // 给 uni-app 渲染时间
  await page.waitForTimeout(500);
}

/**
 * 等待元素出现并可见
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} selector - 元素选择器
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 */
export async function waitForElementVisible(page, selector, options = {}) {
  const { timeout = 10000 } = options;

  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
  });
}

/**
 * 等待元素消失
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} selector - 元素选择器
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 */
export async function waitForElementHidden(page, selector, options = {}) {
  const { timeout = 10000 } = options;

  await page.waitForSelector(selector, {
    state: 'hidden',
    timeout,
  });
}

/**
 * 等待 URL 匹配指定模式
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string|RegExp} pattern - URL 模式
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 */
export async function waitForUrl(page, pattern, options = {}) {
  const { timeout = 10000 } = options;

  await page.waitForURL(pattern, { timeout });
}

/**
 * 等待 API 请求完成
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} urlPattern - URL 匹配模式
 * @param {number} timeout - 超时时间（毫秒），默认 30000
 * @returns {Promise<Response>} API 响应
 */
export async function waitForApiResponse(page, urlPattern, timeout = 30000) {
  return await page.waitForResponse(
    (response) => response.url().includes(urlPattern),
    { timeout }
  );
}

/**
 * 等待并等待所有符合条件的 API 请求完成
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} urlPattern - URL 匹配模式
 * @param {number} count - 期望的响应数量
 * @param {number} timeout - 超时时间（毫秒），默认 30000
 * @returns {Promise<Response[]>} API 响应数组
 */
export async function waitForMultipleApiResponses(page, urlPattern, count, timeout = 30000) {
  const responses = [];

  for (let i = 0; i < count; i++) {
    const response = await waitForApiResponse(page, urlPattern, timeout);
    responses.push(response);
  }

  return responses;
}

/**
 * 智能等待条件满足
 * 轮询检查条件是否满足，避免硬编码等待
 *
 * @param {Function} condition - 条件函数，返回 true/false
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000
 * @param {number} options.interval - 检查间隔（毫秒），默认 200
 * @returns {Promise<boolean>} 条件是否满足
 */
export async function waitForCondition(condition, options = {}) {
  const { timeout = 10000, interval = 200 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await page.waitForTimeout(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * 等待 Toast 消息出现并消失
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} message - 期望的消息内容（可选）
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 5000
 */
export async function waitForToast(page, message = null, options = {}) {
  const { timeout = 5000 } = options;

  const toastSelector = '[data-testid^="toast-"]';

  // 等待 Toast 出现
  await waitForElementVisible(page, toastSelector, { timeout });

  if (message) {
    // 验证消息内容
    const toastMessage = await page.locator(toastSelector).textContent();
    if (!toastMessage.includes(message)) {
      throw new Error(`Toast message mismatch. Expected: ${message}, Got: ${toastMessage}`);
    }
  }

  // 等待 Toast 消失
  await waitForElementHidden(page, toastSelector, { timeout });
}

/**
 * 等待模态框打开
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} modalSelector - 模态框选择器
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 5000
 */
export async function waitForModalOpen(page, modalSelector, options = {}) {
  const { timeout = 5000 } = options;
  await waitForElementVisible(page, modalSelector, { timeout });
}

/**
 * 等待模态框关闭
 *
 * @param {Page} page - Playwright Page 对象
 * @param {string} modalSelector - 模态框选择器
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 5000
 */
export async function waitForModalClose(page, modalSelector, options = {}) {
  const { timeout = 5000 } = options;
  await waitForElementHidden(page, modalSelector, { timeout });
}
