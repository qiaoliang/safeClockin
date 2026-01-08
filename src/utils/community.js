// utils/community.js
/**
 * 社区管理相关工具函数
 */

import { SPECIAL_COMMUNITY_NAMES } from '@/constants/community'

/**
 * 格式化手机号 - 隐藏中间4位
 * @param {string} phone - 手机号
 * @returns {string} 格式化后的手机号
 */
export const formatPhone = (phone) => {
    if (!phone) return "";
    return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
};

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

/**
 * 格式化日期时间
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期时间 (YYYY-MM-DD HH:mm)
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 格式化相对时间（X小时前、X天前等）
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的相对时间
 */
export const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diff = now - date;

    // 小于1分钟显示"刚刚"
    if (diff < 60000) {
        return "刚刚";
    }

    // 小于1小时显示"X分钟前"
    if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    }

    // 小于24小时显示"X小时前"
    if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    }

    // 小于7天显示"X天前"
    if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
    }

    // 其他显示完整日期
    return formatDate(dateStr);
};

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间(ms)
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait = 500) => {
    let timeout = null;

    return function (...args) {
        const context = this;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
};

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} wait - 等待时间(ms)
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, wait = 500) => {
    let timeout = null;
    let previous = 0;

    return function (...args) {
        const context = this;
        const now = Date.now();

        if (now - previous > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            func.apply(context, args);
            previous = now;
        } else if (!timeout) {
            timeout = setTimeout(() => {
                func.apply(context, args);
                previous = Date.now();
                timeout = null;
            }, wait);
        }
    };
};

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export const validatePhone = (phone) => {
    if (!phone) return false;
    return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证社区名称
 * @param {string} name - 社区名称
 * @returns {boolean} 是否有效
 */
export const validateCommunityName = (name) => {
    if (!name) return false;
    // 2-50个字符
    return name.length >= 2 && name.length <= 50;
};

/**
 * 获取社区状态文本
 * @param {string} status - 状态值
 * @returns {string} 状态文本
 */
export const getCommunityStatusText = (status) => {
    const statusMap = {
        active: "启用",
        inactive: "停用",
    };
    return statusMap[status] || "未知";
};

/**
 * 获取角色文本
 * @param {string} role - 角色值
 * @returns {string} 角色文本
 */
export const getRoleText = (role) => {
    const roleMap = {
        manager: "主管",
        staff: "专员",
        user: "普通用户",
    };
    return roleMap[role] || "未知";
};

/**
 * 获取角色颜色类型
 * @param {string} role - 角色值
 * @returns {string} 颜色类型
 */
export const getRoleColorType = (role) => {
    const colorMap = {
        manager: "info",
        staff: "primary",
        user: "default",
    };
    return colorMap[role] || "default";
};

/**
 * 检查是否为特殊社区
 * @param {string} communityName - 社区名称
 * @returns {boolean} 是否为特殊社区
 */
export const isSpecialCommunity = (communityName) => {
    return communityName === SPECIAL_COMMUNITY_NAMES.ANKA_FAMILY || communityName === SPECIAL_COMMUNITY_NAMES.BLACKHOUSE;
};

/**
 * 获取移除用户提示文本
 * @param {string} currentCommunityName - 当前社区名称
 * @param {number} otherCommunitiesCount - 用户所属其他普通社区数量
 * @returns {string} 提示文本
 */
export const getRemoveUserTip = (
    currentCommunityName,
    otherCommunitiesCount
) => {
    if (currentCommunityName === SPECIAL_COMMUNITY_NAMES.ANKA_FAMILY) {
        return `将该用户移入"${SPECIAL_COMMUNITY_NAMES.BLACKHOUSE}"社区，确认？`;
    }

    if (otherCommunitiesCount > 0) {
        return `将该用户从"${currentCommunityName}"移除，确认？`;
    }

    return `移除后该用户将移入"${SPECIAL_COMMUNITY_NAMES.ANKA_FAMILY}"，确认？`;
};

/**
 * 深拷贝对象
 * @param {*} obj - 需要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepClone(item));
    }

    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 数组去重
 * @param {Array} arr - 数组
 * @param {string} key - 去重依据的键名(可选)
 * @returns {Array} 去重后的数组
 */
export const uniqueArray = (arr, key = null) => {
    if (!Array.isArray(arr)) return [];

    if (!key) {
        return [...new Set(arr)];
    }

    const seen = new Set();
    return arr.filter((item) => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};

/**
 * 安全获取对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径 (如: 'a.b.c')
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
export const safeGet = (obj, path, defaultValue = null) => {
    if (!obj || !path) return defaultValue;

    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
            result = result[key];
        } else {
            return defaultValue;
        }
    }

    return result !== undefined ? result : defaultValue;
};
