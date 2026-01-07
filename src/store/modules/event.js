// store/modules/event.js
import { defineStore } from "pinia";
import { storage } from "./storage";
import { request } from "@/api/request";

export const useEventStore = defineStore("event", {
    state: () => ({
        // 用户当前进行中的事件
        activeEvent: null,
        // 事件消息列表
        eventMessages: [],
        // 录音状态
        isRecording: false,
        recordingDuration: 0,
        recordingTimer: null,
        // 加载状态
        isLoading: false,
        error: null,
        // 缓存相关
        lastUpdateTime: null,
        cacheExpireTime: 30 * 1000, // 30秒缓存过期时间
    }),

    getters: {
        // 是否有进行中的事件
        hasActiveEvent: (state) => {
            return state.activeEvent !== null && state.activeEvent.status === 1;
        },

        // 检查缓存是否过期
        isCacheExpired: (state) => {
            if (!state.lastUpdateTime) return true;
            const now = new Date().getTime();
            return now - state.lastUpdateTime > state.cacheExpireTime;
        },

        // 是否有有效的缓存数据
        hasValidCache: (state) => {
            return state.activeEvent !== null && !state.isCacheExpired;
        },
    },

    actions: {
        // 获取用户当前进行中的事件
        async fetchActiveEvent(forceRefresh = false) {
            console.log('🔍 [DEBUG] fetchActiveEvent - 开始执行, forceRefresh:', forceRefresh);

            // 如果有有效缓存且不强制刷新，直接返回缓存数据
            if (!forceRefresh && this.hasValidCache) {
                console.log("使用缓存的事件数据");
                return this.activeEvent;
            }

            this.isLoading = true;
            this.error = null;

            try {
                console.log('🔍 [DEBUG] fetchActiveEvent - 发送API请求');
                const response = await request({
                    url: "/api/user/my-active-event",
                    method: "GET",
                });

                console.log('🔍 [DEBUG] fetchActiveEvent - API响应:', JSON.stringify(response, null, 2));

                if (response.code === 1) {
                    this.activeEvent = response.data.event;
                    this.eventMessages = response.data.messages || [];
                    this.lastUpdateTime = new Date().getTime();

                    // 保存到本地存储
                    this.saveToCache();

                    console.log("获取事件数据成功:", this.activeEvent);
                    console.log('🔍 [DEBUG] fetchActiveEvent - hasActiveEvent:', this.hasActiveEvent);
                    return this.activeEvent;
                } else {
                    throw new Error(response.msg || "获取事件数据失败");
                }
            } catch (error) {
                this.error = error.message;
                console.error('🔍 [DEBUG] fetchActiveEvent - API请求失败:', error);
                // 如果网络请求失败但有缓存数据，仍然返回缓存
                if (this.activeEvent !== null) {
                    console.log("网络请求失败，使用缓存数据");
                    return this.activeEvent;
                }

                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        // 添加消息（文字/语音/图片）
        async addMessage(messageData) {
            try {
                if (!this.activeEvent) {
                    throw new Error("没有进行中的事件");
                }

                const response = await request({
                    url: `/api/user/events/${this.activeEvent.event_id}/messages`,
                    method: "POST",
                    data: messageData,
                });

                if (response.code === 1) {
                    // 添加到消息列表顶部
                    this.eventMessages.unshift(response.data.message_data);
                    // 更新缓存
                    this.saveToCache();

                    console.log("添加消息成功:", response.data.message_data);
                    return response.data.message_data;
                } else {
                    throw new Error(response.msg || "添加消息失败");
                }
            } catch (error) {
                console.error("添加消息失败:", error);
                throw error;
            }
        },

        // 关闭事件
        async closeEvent(closureReason) {
            console.log('🔍 DEBUG eventStore.closeEvent 被调用');
            console.log('🔍 DEBUG closureReason:', closureReason);
            console.log('🔍 DEBUG this.activeEvent:', this.activeEvent);
            
            try {
                if (!this.activeEvent) {
                    console.log('🔍 DEBUG 没有进行中的事件');
                    throw new Error("没有进行中的事件");
                }
        
                // 验证关闭原因长度（5-200字符）
                if (!closureReason || closureReason.trim().length < 5 || closureReason.trim().length > 200) {
                    console.log('🔍 DEBUG 关闭原因验证失败');
                    throw new Error("关闭原因长度必须在5-200字符之间");
                }
        
                const url = `/api/events/${this.activeEvent.event_id}/close`;
                console.log('🔍 DEBUG 请求URL:', url);
                
                const response = await request({
                    url: url,
                    method: "PUT",
                    data: { closure_reason: closureReason.trim() },
                });
        
                console.log('🔍 DEBUG 响应:', response);
        
                if (response.code === 1) {
                    console.log("关闭事件成功:", response.data);
        
                    // 刷新事件数据
                    await this.fetchActiveEvent(true);
        
                    return response.data;
                } else {
                    throw new Error(response.msg || "关闭事件失败");
                }
            } catch (error) {
                console.error("关闭事件失败:", error);
                throw error;
            }
        },
        // 开始录音
        startRecording() {
            if (this.isRecording) {
                console.warn("已经在录音中");
                return;
            }

            this.isRecording = true;
            this.recordingDuration = 0;

            // 启动计时器
            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;

                // 最多录制60秒
                if (this.recordingDuration >= 60) {
                    this.stopRecording();
                }
            }, 1000);

            console.log("开始录音");
        },

        // 停止录音
        stopRecording() {
            if (!this.isRecording) {
                console.warn("没有在录音中");
                return null;
            }

            this.isRecording = false;

            // 清除计时器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            const duration = this.recordingDuration;

            // 检查录音时长
            if (duration < 1) {
                console.warn("录音时间太短");
                this.recordingDuration = 0;
                return null;
            }

            console.log(`停止录音，时长: ${duration}秒`);

            const result = {
                duration: duration,
            };

            // 重置录音时长
            this.recordingDuration = 0;

            return result;
        },

        // 上传媒体文件
        async uploadMedia(file, fileType) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('file_type', fileType);

                const response = await request({
                    url: '/api/misc/upload/media',
                    method: 'POST',
                    data: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.code === 1) {
                    console.log(`上传${fileType}成功:`, response.data);
                    return response.data;
                } else {
                    throw new Error(response.msg || '上传失败');
                }
            } catch (error) {
                console.error(`上传${fileType}失败:`, error);
                throw error;
            }
        },

        // 保存到本地缓存
        saveToCache() {
            const cacheData = {
                activeEvent: this.activeEvent,
                eventMessages: this.eventMessages,
                lastUpdateTime: this.lastUpdateTime,
            };

            storage.set("eventCache", cacheData);
        },

        // 从本地缓存恢复
        restoreFromCache() {
            const cacheData = storage.get("eventCache");

            if (cacheData && cacheData.activeEvent) {
                this.activeEvent = cacheData.activeEvent;
                this.eventMessages = cacheData.eventMessages || [];
                this.lastUpdateTime = cacheData.lastUpdateTime;

                console.log("从缓存恢复事件数据:", this.activeEvent);
                return true;
            }

            return false;
        },

        // 清除本地缓存
        clearCache() {
            this.activeEvent = null;
            this.eventMessages = [];
            this.lastUpdateTime = null;
            this.error = null;

            storage.remove("eventCache");
        },

        // 刷新事件数据
        async refreshData() {
            await this.fetchActiveEvent(true);
        },
    },
});