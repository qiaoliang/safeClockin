// store/modules/user.js
import { defineStore } from "pinia";
import { storage } from "./storage";
import { authApi } from "@/api/auth";
import { diagnoseSeedStatus } from "@/utils/secure";
import { RoleId } from "@/constants/roles.js";

export const useUserStore = defineStore("user", {
    state: () => {
        // 创建初始状态
        const initialState = {
            // 核心用户状态 - 统一管理所有用户相关数据
            userState: {
                // 认证信息
                auth: {
                    token: null,
                    refreshToken: null,
                    secureSeed: null,
                    loginTime: null,
                    expiresAt: null,
                },
                // 用户基本信息
                profile: {
                    userId: null,
                    nickname: null,
                    avatarUrl: null,
                    role: null,
                    phone: null,
                    wechatOpenid: null,
                    isVerified: false,
                    // 社区角色信息：支持用户在多个社区担任不同角色
                    communityRoles: {}, // { communityId: role } 格式
                    communityRole: null, // 保持向后兼容，存储当前社区的角色
                },
                // 缓存数据
                cache: {
                    checkinData: null,
                    lastUpdate: null,
                },
            },

            // 运行时状态
            isLoggedIn: false,
            isLoading: false,
            currentProcessingCode: null,
            currentCommunityId: null,
            
            // 初始化状态标志
            _isInitialized: false,
        };

        // 开发模式下添加保护，防止直接修改 userState
        if (process.env.NODE_ENV === "development") {
            // 使用 Proxy 监听修改尝试
            const proxyHandler = {
                set(target, property, value) {
                    if (property === "profile" && value !== target[property]) {
                        console.warn(
                            "⚠️ 检测到直接修改 userState.profile，请使用 updateUserInfo() 方法"
                        );
                        console.trace("调用栈：");
                        return false; // 阻止修改
                    }
                    if (property === "auth" && value !== target[property]) {
                        console.warn(
                            "⚠️ 检测到直接修改 userState.auth，请使用相应的方法"
                        );
                        console.trace("调用栈：");
                        return false; // 阻止修改
                    }
                    return Reflect.set(target, property, value);
                },
            };

            const proxy = new Proxy(initialState.userState, proxyHandler);
            // 保存原始对象引用，供内部方法使用
            proxy._target = initialState.userState;
            proxy._isProxy = true;

            initialState.userState = proxy;
        }

        return initialState;
    },

    getters: {
        // 便捷访问器
        token: (state) => state.userState.auth.token,
        refreshToken: (state) => state.userState.auth.refreshToken,
        userInfo: (state) => state.userState.profile,
        role: (state) => state.userState.profile.role,

        // 角色判断
        isSoloUser: (state) => state.userState.profile.role === RoleId.SOLO,
        isSupervisor: (state) => state.userState.profile.role === RoleId.SUPER_ADMIN,

        // 社区管理权限判断
        isSuperAdmin: (state) => {
            // 后端返回 role 数字ID：1-普通用户，2-社区专员，3-社区主管，4-超级系统管理员
            const role = state.userState.profile.role;
            // 使用 RoleId 常量进行判断，保留字符串兼容性
            return role === RoleId.SUPER_ADMIN;
        },

        // 社区主管：检查用户的全局角色
        isCommunityManager: (state) => {
            const role = state.userState.profile.role;
            return role === RoleId.MANAGER;
        },

        isCommunityStaff: (state) => {
            // 社区工作人员：包括社区专员和社区主管
            const role = state.userState.profile.role;
            return role === RoleId.STAFF || role === RoleId.MANAGER;
        },

        hasCommunityPermission: (state) => {
            // 判断是否有任何级别的社区管理权限
            const role = state.userState.profile.role;
            return (
                role === RoleId.SUPER_ADMIN ||
                role === RoleId.MANAGER ||
                role === RoleId.STAFF
            );
        },

        // 认证状态
        isTokenValid: (state) => {
            const { token, expiresAt } = state.userState.auth;
            if (!token) return false;
            if (!expiresAt) return true; // 没有过期时间则认为有效
            return new Date() < new Date(expiresAt);
        },

        // 缓存状态
        isCacheExpired: (state) => {
            const { lastUpdate } = state.userState.cache;
            if (!lastUpdate) return true;
            const CACHE_DURATION = 30 * 60 * 1000; // 30分钟
            return Date.now() - lastUpdate > CACHE_DURATION;
        },
    },

    actions: {
        // 内部方法：安全地设置 userState（绕过开发模式保护）
        _setUserState(newState) {
            if (
                process.env.NODE_ENV === "development" &&
                this.userState &&
                this.userState._isProxy
            ) {
                // 开发模式下，直接设置底层对象
                const target = this.userState._target || this.userState;
                Object.assign(target, newState);
            } else {
                // 生产模式或初始化时，直接设置
                this.userState = newState;
            }
        },

        // 内部方法：安全地设置 profile（绕过开发模式保护）
        _setProfile(newProfile) {
            if (
                process.env.NODE_ENV === "development" &&
                this.userState &&
                this.userState._isProxy
            ) {
                // 开发模式下，直接设置底层对象
                const target = this.userState._target || this.userState;
                target.profile = newProfile;
            } else {
                // 生产模式或初始化时，直接设置
                this.userState.profile = newProfile;
            }
        },

        // 持久化用户状态到 storage
        _persistUserState() {
            const userState = JSON.stringify(this.userState);
            storage.set("userState", userState);
        },

        // 确保 userState 结构完整
        _ensureUserStateIntegrity() {
            if (!this.userState || typeof this.userState !== "object") {
                this._setUserState({
                    auth: {
                        token: null,
                        refreshToken: null,
                        secureSeed: null,
                        loginTime: null,
                        expiresAt: null,
                    },
                    profile: {
                        userId: null,
                        nickname: null,
                        avatarUrl: null,
                        role: null,
                        phone: null,
                        wechatOpenid: null,
                        isVerified: false,
                    },
                    cache: {
                        checkinData: null,
                        lastUpdate: null,
                    },
                });
            }

            // 确保子结构完整
            if (!this.userState.auth) {
                const target = this.userState._target || this.userState;
                target.auth = {
                    token: null,
                    refreshToken: null,
                    secureSeed: null,
                    loginTime: null,
                    expiresAt: null,
                };
            }

            if (!this.userState.profile) {
                const target = this.userState._target || this.userState;
                target.profile = {
                    userId: null,
                    nickname: null,
                    avatarUrl: null,
                    role: null,
                    phone: null,
                    wechatOpenid: null,
                    isVerified: false,
                    // 社区角色信息：支持用户在多个社区担任不同角色
                    communityRoles: {},
                    communityRole: null,
                };
            }

            if (!this.userState.cache) {
                const target = this.userState._target || this.userState;
                target.cache = {
                    checkinData: null,
                    lastUpdate: null,
                };
            }
        },

        // 从 storage 恢复用户状态
        _restoreUserState() {
            try {
                // 确保 userState 结构完整
                this._ensureUserStateIntegrity();

                // 优先尝试从新的 userState 恢复
                const savedState = storage.get("userState");

                if (savedState) {

                    // 更宽松的验证逻辑 - 只要是对象就尝试恢复
                    if (savedState && typeof savedState === "object") {
                        // 确保基本结构存在，如果缺失则补充
                        const restoredState = {
                            auth: savedState.auth || {
                                token: null,
                                refreshToken: null,
                                secureSeed: null,
                                loginTime: null,
                                expiresAt: null,
                            },
                            profile: savedState.profile || {
                                userId: null,
                                nickname: null,
                                avatarUrl: null,
                                role: null,
                                phone: null,
                                wechatOpenid: null,
                                isVerified: false,
                                communityRoles: {},
                                communityRole: null,
                            },
                            cache: savedState.cache || {
                                checkinData: null,
                                lastUpdate: null,
                            },
                        };

                        this._setUserState(restoredState);
                        this.isLoggedIn = !!this.userState.auth.token;
                        console.log("✅ 从 userState 恢复用户状态");
                        return true;
                    } else {
                        console.warn("⚠️ userState 数据格式异常，清理并重置");
                        // 删除损坏的数据，但先备份关键信息
                        const wechatOpenid = savedState?.profile?.wechatOpenid;
                        storage.remove("userState");

                        // 重新初始化状态，保留微信OpenID
                        this._ensureUserStateIntegrity();
                        if (wechatOpenid) {
                            this.userState.profile.wechatOpenid = wechatOpenid;
                        }
                    }
                }

                console.log("📱 无有效用户状态，保持未登录");
                return false;
            } catch (error) {
                console.error("恢复用户状态失败:", error);
                // 确保即使出错也有完整的 userState 结构
                this._ensureUserStateIntegrity();
                return false;
            }
        },

        // 清理所有用户相关的 storage
        _clearUserStorage() {
            // 清理新的统一存储
            storage.remove("userState");

            // 清理旧的分散存储
            storage.remove("token");
            storage.remove("refreshToken");
            storage.remove("cached_user_info");
            storage.remove("secure_seed");
            storage.remove("checkinCache");
            
            // 清理微信用户缓存（防止切换登录方式时数据混淆）
            storage.remove("safeguard_cache");
            storage.remove("login_scene");
        },

        // 统一的登录成功处理方法
        async processLoginSuccess(apiResponse, loginType = "unknown") {
            try {
                console.log(`✅ ${loginType}登录成功，处理用户信息`);

                // 检查API响应是否成功
                if (apiResponse.code !== 1) {
                    console.error("登录API返回错误:", apiResponse);
                    throw new Error(
                        `登录失败: ${apiResponse.msg || "未知错误"}`
                    );
                }

                // 清理旧的用户缓存，防止不同登录方式的数据混淆
                if (loginType === "手机") {
                    // 手机登录时清理微信用户缓存
                    console.log("📱 手机登录，清理微信用户缓存");
                    this.clearWechatUserCache();
                    storage.remove("login_scene");
                } else if (loginType === "微信") {
                    // 微信登录时清理可能的手机用户缓存
                    console.log("📱 微信登录，清理可能的旧缓存");
                    storage.remove("login_scene");
                }

                // 更新用户状态
                const now = new Date();
                const target = this.userState._target || this.userState;
                target.auth = {
                    token: apiResponse.data?.token,
                    refreshToken:
                        apiResponse.data?.refreshToken ||
                        apiResponse.data?.refresh_token,
                    secureSeed: this.userState.auth.secureSeed,
                    loginTime: now.toISOString(),
                    expiresAt: apiResponse.data?.expires_at || null,
                };

                // 直接使用登录接口返回的完整用户信息
                target.profile = {
                    userId:
                        apiResponse.data?.userId || apiResponse.data?.user_id,
                    nickname:
                        apiResponse.data?.nickname ||
                        apiResponse.data?.nickName,
                    avatarUrl:
                        apiResponse.data?.avatarUrl ||
                        apiResponse.data?.avatar_url,
                    role: apiResponse.data?.role || null,
                    phone:
                        apiResponse.data?.phone_number,
                    wechatOpenid:
                        apiResponse.data?.wechatOpenid ||
                        apiResponse.data?.wechat_openid,
                    isVerified: apiResponse.data?.is_verified || false,
                    // 社区信息字段映射（支持驼峰和下划线命名）
                    communityId: apiResponse.data?.communityId || apiResponse.data?.community_id || null,
                    communityName: apiResponse.data?.communityName || apiResponse.data?.community_name || null,
                    // 确保社区角色信息存在
                    communityRoles: apiResponse.data?.communityRoles || {},
                    communityRole: apiResponse.data?.communityRole || null,
                };

                this.isLoggedIn = true;

                // 更新缓存时间
                target.cache = {
                    ...target.cache,
                    lastUpdate: Date.now(),
                };

                // 持久化状态
                this._persistUserState();

                console.log(
                    `✅ ${loginType}登录用户信息已保存到本地存储:`,
                    target.profile
                );

                return apiResponse.data;
            } catch (error) {
                console.error(`${loginType}登录处理失败:`, error);
                throw error;
            }
        },

        async login(loginData) {
            this.isLoading = true;
            let code = null;
            try {
                // 检查是否正在处理相同的code，防止重复请求
                code =
                    typeof loginData === "string" ? loginData : loginData.code;
                if (this.currentProcessingCode === code) {
                    throw new Error("登录凭证正在处理中，请勿重复提交");
                }

                this.currentProcessingCode = code;

                // 使用真实API调用
                const apiResponse = await authApi.login(loginData);
                console.log("登录API响应:", apiResponse);

                // 使用统一的登录成功处理方法
                return await this.processLoginSuccess(apiResponse, "微信");
            } catch (error) {
                console.error("登录过程发生错误:", error);
                throw error;
            } finally {
                // 清除当前处理的code
                if (code && this.currentProcessingCode === code) {
                    this.currentProcessingCode = null;
                }
                this.isLoading = false;

                // 清理临时用户信息
                if (this.userState?.cache?.tempUserInfo) {
                    this.updateCache({
                        tempUserInfo: null,
                    });
                }
            }
        },

        async updateUserInfo(userData) {
            // 参数验证
            if (!userData || typeof userData !== "object") {
                throw new Error("用户数据必须是一个对象");
            }

            // 记录更新前的状态，用于错误回滚
            const previousProfile = { ...this.userState.profile };

            this.isLoading = true;
            try {
                // 先更新本地状态（乐观更新）
                const target = this.userState._target || this.userState;
                Object.assign(target.profile, userData);

                // 调用API更新
                const response = await authApi.updateUserProfile(userData);
                console.log("更新用户信息响应:", response);

                // 检查API响应是否成功
                if (response.code !== 1) {
                    console.error("更新用户信息API返回错误:", response);
                    // 回滚本地状态
                    target.profile = previousProfile;
                    throw new Error(
                        `更新用户信息失败: ${response.msg || "未知错误"}`
                    );
                }

                // 持久化状态
                this._persistUserState();

                return response;
            } catch (error) {
                // 确保状态已回滚
                const target = this.userState._target || this.userState;
                target.profile = previousProfile;
                console.error("更新用户信息失败:", error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async fetchUserInfo() {
            this.isLoading = true;
            try {
                const response = await authApi.getUserProfile();
                console.log("获取用户信息响应:", response);

                // 检查API响应是否成功
                if (response.code !== 1) {
                    console.error("获取用户信息API返回错误:", response);
                    throw new Error(
                        `获取用户信息失败: ${response.msg || "未知错误"}`
                    );
                }

                // 更新用户状态
                const target = this.userState._target || this.userState;
                target.profile = {
                    ...target.profile,
                    ...response.data,
                };

                // 更新缓存时间
                target.cache.lastUpdate = Date.now();

                // 持久化状态
                this._persistUserState();

                return response.data;
            } catch (error) {
                console.error("获取用户信息失败:", error);

                // 如果获取用户信息失败，但token仍然有效，保持当前状态
                if (this.isTokenValid) {
                    console.log("Token有效，保持当前用户状态");
                }

                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        logout() {
            // 调用登出API
            authApi.logout().catch(() => {});

            // 检查当前用户类型，决定是否保存缓存
            const currentUserType = this.userState.profile.wechatOpenid ? "微信" : "手机";
            
            if (currentUserType === "微信") {
                // 微信用户退出时保存信息到缓存，用于下次快速登录
                this._saveWechatUserCache();
            } else {
                // 手机用户退出时清理所有缓存
                this.clearWechatUserCache();
            }

            // 保留必要信息用于快速重新登录
            const wechatOpenid = this.userState.profile.wechatOpenid;

            // 重置用户状态
            this._setUserState({
                auth: {
                    token: null,
                    refreshToken: null,
                    secureSeed: this.userState.auth.secureSeed, // 保留安全种子
                    loginTime: null,
                    expiresAt: null,
                },
                profile: {
                    userId: null,
                    nickname: null,
                    avatarUrl: null,
                    role: null,
                    phone: null,
                    wechatOpenid, // 保留微信OpenID用于快速登录
                    isVerified: false,
                },
                cache: {
                    checkinData: null,
                    lastUpdate: null,
                },
            });

            this.isLoggedIn = false;
            
            // 重置初始化标志，允许下次重新初始化
            this._isInitialized = false;

            // 清理存储（除了微信用户的缓存）
            this._clearUserStorage();
            
            // 如果是微信用户，重新保存缓存
            if (currentUserType === "微信") {
                this._saveWechatUserCache();
            }

            // 保留必要信息在 userState 中
            if (wechatOpenid) {
                this.userState.profile.wechatOpenid = wechatOpenid;
            }
        },

        // 初始化用户状态
        initUserState() {
            // 防止重复初始化
            if (this._isInitialized) {
                console.log("📱 用户状态已初始化，跳过重复调用");
                return;
            }

            console.log("=== 开始初始化用户状态 ===");

            // 首先进行种子健康检查
            this._checkSeedHealth();

            // 确保 userState 结构完整
            this._ensureUserStateIntegrity();

            // 尝试从存储恢复状态
            const restored = this._restoreUserState();

            if (restored) {
                console.log("✅ 用户状态恢复成功");
                console.log("用户昵称:", this.userState.profile.nickname);
                console.log("用户角色:", this.userState.profile.role);
                console.log("Token有效:", this.isTokenValid);

                // 如果Token无效，清理状态
                if (!this.isTokenValid) {
                    console.log("⚠️ Token已过期，清理用户状态");
                    this.logout();
                }
            } else {
                console.log("📱 用户未登录，状态已清空");
            }

            // 标记为已初始化
            this._isInitialized = true;
            console.log("=== 用户状态初始化完成 ===");
        },

        // 检查种子健康状况
        _checkSeedHealth() {
            try {
                // 使用导入的 diagnoseSeedStatus 函数
                const diagnostics = diagnoseSeedStatus();

                if (!diagnostics.isValid) {
                    console.warn("⚠️  secure_seed not found，可能影响数据解密");
                    console.warn("建议：清理应用数据后重新登录");
                } else if (diagnostics.recoveredFrom !== "primary") {
                    console.warn(
                        `⚠️ 种子从备份恢复: ${diagnostics.recoveredFrom}`
                    );
                    console.log("建议：种子已自动恢复，可正常使用");
                } else {
                    console.log("✅ 种子健康检查通过");
                }
            } catch (error) {
                console.warn("⚠️  种子健康检查失败:", error);
            }
        },

        // 更新用户角色
        async updateUserRole(role) {
            const target = this.userState._target || this.userState;
            target.profile.role = role;
            await this.updateUserInfo({ role });
        },

        // 设置当前社区ID
        setCurrentCommunityId(communityId) {
            // 更新用户状态中的当前社区ID
            this.currentCommunityId = communityId;
            const target = this.userState._target || this.userState;
            target.profile.communityRole =
                target.profile.communityRoles?.[communityId] || null;
        },

        // 更新用户在特定社区的角色
        updateCommunityRole(communityId, role) {
            const target = this.userState._target || this.userState;
            if (!target.profile.communityRoles) {
                target.profile.communityRoles = {};
            }
            target.profile.communityRoles[communityId] = role;
            // 如果当前社区是此社区，也更新当前社区的角色
            if (target.profile.currentCommunityId === communityId) {
                target.profile.communityRole = role;
            }
            this._persistUserState();
        },

        // 获取用户在指定社区的角色
        getRoleInCommunity(communityId) {
            const target = this.userState._target || this.userState;
            return target.profile.communityRoles?.[communityId] || null;
        },

        // 缓存管理 - 用于 checkinData 和临时用户信息
        updateCache(cacheData) {
            // 确保 userState 和 cache 存在
            if (!this.userState) {
                this._setUserState({ cache: {} });
            }
            if (!this.userState.cache) {
                const target = this.userState._target || this.userState;
                target.cache = {};
            }

            // 更新缓存数据
            const target = this.userState._target || this.userState;
            target.cache = {
                ...target.cache,
                ...cacheData,
                lastUpdate: Date.now(),
            };
            this._persistUserState();
        },

        clearCache() {
            // 确保 userState 存在
            if (!this.userState) {
                this._setUserState({});
            }

            const target = this.userState._target || this.userState;
            target.cache = {
                checkinData: null,
                tempUserInfo: null,
                lastUpdate: null,
            };
            this._persistUserState();
        },

        // 检查并刷新 Token
        async refreshTokenIfNeeded() {
            if (!this.userState.auth.refreshToken) {
                throw new Error("无刷新Token");
            }

            if (this.isTokenValid) {
                return this.userState.auth.token;
            }

            try {
                const response = await authApi.refreshToken(
                    this.userState.auth.refreshToken
                );
                if (response.code === 1) {
                    const target = this.userState._target || this.userState;
                    target.auth.token = response.data.token;
                    target.auth.expiresAt = response.data.expires_at;
                    this._persistUserState();
                    return response.data.token;
                }
                throw new Error("刷新Token失败");
            } catch (error) {
                console.error("刷新Token失败:", error);
                this.logout();
                throw error;
            }
        },

        // 更新 token 和 refreshToken（用于 token 刷新）
        updateTokens(newToken, newRefreshToken) {
            const target = this.userState._target || this.userState;
            target.auth.token = newToken;
            target.auth.refreshToken = newRefreshToken;
            this._persistUserState();
        },

        // 处理 token 过期
        handleTokenExpired() {
            // 标记为重新登录场景
            storage.set("login_scene", "relogin");
            uni.setStorageSync("login_scene", "relogin");

            // 清除认证信息，但保留用户基本信息
            const target = this.userState._target || this.userState;
            target.auth.token = null;
            target.auth.refreshToken = null;
            target.auth.expiresAt = null;
            this.isLoggedIn = false;

            this._persistUserState();
        },

        // 强制清理用户状态（用于调试和异常恢复）
        forceClearUserState() {
            console.log("🧹 强制清理用户状态");
            this._setUserState({
                auth: {
                    token: null,
                    refreshToken: null,
                    secureSeed: null,
                    loginTime: null,
                    expiresAt: null,
                },
                profile: {
                    userId: null,
                    nickname: null,
                    avatarUrl: null,
                    role: null,
                    phone: null,
                    wechatOpenid: null,
                    isVerified: false,
                },
                cache: {
                    checkinData: null,
                    lastUpdate: null,
                },
            });
            this.isLoggedIn = false;
            this.isLoading = false;
            this.currentProcessingCode = null;

            // 清理存储
            storage.clear();
            uni.clearStorageSync();

            console.log("✅ 用户状态已强制清理");
        },

        // 保存微信用户信息到本地缓存
        _saveWechatUserCache() {
            const { nickname, avatarUrl } = this.userState.profile;
            if (nickname && avatarUrl) {
                const cacheData = {
                    nickname,
                    avatarUrl,
                    timestamp: Date.now(),
                };
                storage.set("safeguard_cache", cacheData);
                console.log("✅ 微信用户信息已保存到 safeguard_cache");
            }
        },

        // 获取微信用户缓存
        getWechatUserCache() {
            try {
                const cacheData = storage.get("safeguard_cache");
                if (!cacheData) {
                    console.log("📱 微信用户缓存不存在");
                    return null;
                }

                // 验证缓存数据结构
                if (!cacheData || typeof cacheData !== "object") {
                    console.warn("⚠️ 微信用户缓存格式异常，清理中");
                    this.clearWechatUserCache();
                    return null;
                }

                // 验证必需字段
                if (!cacheData.nickname || !cacheData.avatarUrl) {
                    console.warn("⚠️ 微信用户缓存缺少必需字段，清理中");
                    this.clearWechatUserCache();
                    return null;
                }

                // 检查缓存是否过期（7天）
                const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天
                if (
                    !cacheData.timestamp ||
                    Date.now() - cacheData.timestamp > CACHE_DURATION
                ) {
                    console.log("⚠️ 微信用户缓存已过期，清理中");
                    this.clearWechatUserCache();
                    return null;
                }

                console.log("✅ 微信用户缓存有效");
                return cacheData;
            } catch (error) {
                console.error("❌ 获取微信用户缓存失败:", error);
                // 清理可能损坏的缓存
                this.clearWechatUserCache();
                return null;
            }
        },

        // 清理微信用户缓存
        clearWechatUserCache() {
            storage.remove("safeguard_cache");
            console.log("✅ 微信用户缓存已清理");
        },

        // 更新微信用户缓存
        updateWechatUserCache(nickname, avatarUrl) {
            if (nickname && avatarUrl) {
                const cacheData = {
                    nickname,
                    avatarUrl,
                    timestamp: Date.now(),
                };
                storage.set("safeguard_cache", cacheData);
                console.log("✅ 微信用户缓存已更新");
            }
        },

        // 诊断用户状态（用于调试）
        diagnoseUserState() {
            console.log("🔍 用户状态诊断开始");

            // 检查 userState 结构
            console.log("诊断: userState 类型 =", typeof this.userState);
            if (this.userState) {
                console.log("诊断: userState.auth =", this.userState.auth);
                console.log(
                    "诊断: userState.auth.token =",
                    this.userState.auth.token
                );
                console.log(
                    "诊断: userState.profile =",
                    this.userState.profile
                );
            }

            // 检查存储状态
            const storedUserState = storage.get("userState");
            console.log(
                "诊断: 存储的userState =",
                storedUserState ? "存在" : "不存在"
            );

            // 检查运行时状态
            console.log("诊断: isLoggedIn =", this.isLoggedIn);
            console.log("诊断: isTokenValid =", this.isTokenValid);

            console.log("🔍 用户状态诊断结束");

            return {
                hasUserState: !!this.userState,
                hasToken: !!this.userState?.auth?.token,
                isLoggedIn: this.isLoggedIn,
                isTokenValid: this.isTokenValid,
                hasStoredData: !!storedUserState,
            };
        },
    },
});
