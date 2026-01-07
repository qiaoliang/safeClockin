// utils/router.js
import { useUserStore } from "@/store/modules/user";
import { RoleId } from "@/constants/roles.js";

export function routeGuard(url, options = {}) {
    const userStore = useUserStore();

    if (isAuthRequired(url) && !userStore.isLoggedIn) {
        uni.redirectTo({
            url: "/pages/login/login",
        });
        return false;
    }

    if (isRoleRequired(url) && !hasRequiredRole(url, userStore.role)) {
        uni.showToast({
            title: "权限不足",
            icon: "none",
        });
        return false;
    }

    // 检查是否为tabbar页面，如果是则使用switchTab
    const tabbarPages = [
        "/pages/home-solo/home-solo",
        "/pages/home-community/home-community",
        "/pages/profile/profile",
    ];

    if (tabbarPages.includes(url)) {
        uni.switchTab({
            url,
        });
    } else {
        // 如果 options 中指定了 useRedirect 为 true，则使用 redirectTo
        if (options.useRedirect) {
            uni.redirectTo({
                url,
            });
        } else {
            uni.navigateTo({
                url,
                ...options,
            });
        }
    }

    return true;
}

const isAuthRequired = (url) => {
    const authPages = [
        "/pages/home-solo/home-solo",
        "/pages/home-community/home-community",
        "/pages/profile/profile",
        "/pages/supervisor-detail/supervisor-detail",
    ];

    return authPages.some((page) => url.includes(page));
};

const isRoleRequired = (url) => {
    const rolePages = {
        "/pages/home-community/home-community": "community",
    };

    return Object.keys(rolePages).some(
        (page) => url.includes(page) && rolePages[page]
    );
};

const hasRequiredRole = (url, userRole) => {
    const rolePages = {
        "/pages/home-community/home-community": "community",
    };

    const requiredRole = Object.keys(rolePages).find((page) =>
        url.includes(page)
    );
    return requiredRole ? rolePages[requiredRole] === userRole : true;
};

export const getHomePageByRole = (role) => {
    // 普通用户 (solo) - role=1
    if (role === RoleId.SOLO) {
        return "/pages/home-solo/home-solo";
    }

    // 未设置角色 - role=0 (向后兼容)
    if (role === RoleId.UNSET) {
        return "/pages/home-solo/home-solo";
    }

    // 超级系统管理员 - role=4
    if (role === RoleId.SUPER_ADMIN) {
        return "/pages/profile/profile";
    }

    // 默认返回 solo 首页
    return "/pages/home-solo/home-solo";
};
