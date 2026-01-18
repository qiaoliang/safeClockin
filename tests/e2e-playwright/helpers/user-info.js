/**
 * 用户信息读取辅助函数
 * 
 * 用于在测试中读取加密的用户信息
 */

/**
 * 读取用户的 userState（包括加密数据）
 *
 * @param {Page} page - Playwright Page 对象
 * @returns {Promise<Object|null>} 用户信息对象
 */
export async function getUserState(page) {
  try {
    const userState = await page.evaluate(() => {
      // 尝试使用测试辅助函数获取 userState
      try {
        if (typeof window !== 'undefined' && typeof window.__TEST_GET_USER_STATE__ === 'function') {
          console.log('✅ 找到 window.__TEST_GET_USER_STATE__');
          const state = window.__TEST_GET_USER_STATE__()
          console.log('✅ __TEST_GET_USER_STATE__ 返回:', state);
          return state;
        }
      } catch (e) {
        console.log('无法使用 __TEST_GET_USER_STATE__:', e.message);
      }

      // 备选方案：直接从 localStorage 读取
      try {
        const stored = localStorage.getItem('userState');
        if (stored) {
          console.log('✅ 从 localStorage 读取到 userState（加密）');
          // 尝试解析为 JSON
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              console.log('✅ userState 已解析（未加密）');
              return parsed;
            }
          } catch (e) {
            console.log('⚠️ userState 是加密的');
            return null;
          }
        }
      } catch (e) {
        console.log('无法从 localStorage 读取:', e.message);
      }

      // 如果无法从 store 读取，尝试从 localStorage 读取并解密
      let encryptedData = null;

      try {
        if (typeof uni !== 'undefined' && uni.getStorageSync) {
          encryptedData = uni.getStorageSync('userState');
        } else if (typeof localStorage !== 'undefined') {
          encryptedData = localStorage.getItem('userState');
        }
      } catch (e) {
        console.log('无法从 uni 读取，尝试 localStorage');
        if (typeof localStorage !== 'undefined') {
          encryptedData = localStorage.getItem('userState');
        }
      }

      if (!encryptedData) {
        console.log('userState 不存在');
        return null;
      }

      // 尝试解析为 JSON（如果是未加密的数据）
      try {
        const parsed = JSON.parse(encryptedData);
        if (parsed && typeof parsed === 'object') {
          console.log('✅ userState 已解析（未加密）');
          return parsed;
        }
      } catch (e) {
        // 不是 JSON，可能是加密的数据
      }

      // 尝试解密（使用与生产代码相同的逻辑）
      const decodeObject = (str, seed) => {
        if (!str || typeof str !== 'string') return null;
        
        try {
          // 清理输入字符串
          const cleanStr = str.replace(/[^\x00-\x7F]/g, '');
          
          // Base64 解码
          const atob = (b64) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '';
            let i = 0;
            b64 = b64.replace(/[^A-Za-z0-9+/]/g, '');
            while (i < b64.length) {
              const c1 = chars.indexOf(b64[i++]);
              const c2 = chars.indexOf(b64[i++]);
              const c3 = chars.indexOf(b64[i++]);
              const c4 = chars.indexOf(b64[i++]);
              result += String.fromCharCode((c1 << 2) | (c2 >> 4));
              if (c3 !== 64) result += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
              if (c4 !== 64) result += String.fromCharCode(((c3 & 3) << 6) | c4);
            }
            return result;
          };

          const fromBase64ToUint8 = (str) => {
            try {
              if (typeof uni !== 'undefined' && typeof uni.base64ToArrayBuffer === 'function') {
                return new Uint8Array(uni.base64ToArrayBuffer(str));
              }
            } catch (e) {}
            
            const bin = atob(str);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
              u8[i] = bin.charCodeAt(i);
            }
            return u8;
          };

          const prng = (len) => {
            let h = 2166136261;
            for (let i = 0; i < seed.length; i++) {
              h ^= seed.charCodeAt(i);
              h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            }
            const out = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
              out[i] = (h >>> 24) & 0xff;
            }
            return out;
          };

          const utf8Decode = (u8) => {
            if (typeof TextDecoder !== 'undefined') {
              return new TextDecoder().decode(u8);
            }
            let bin = '';
            for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
            return decodeURIComponent(escape(bin));
          };

          const buf = fromBase64ToUint8(cleanStr);
          if (!buf || buf.length === 0) return null;

          const mask = prng(buf.length);
          for (let i = 0; i < buf.length; i++) buf[i] ^= mask[i];

          const json = utf8Decode(buf);
          return JSON.parse(json);
        } catch (e) {
          console.error('解密失败:', e);
          return null;
        }
      };

      // 获取种子
      const getSeed = () => {
        let seed = null;
        
        // 尝试从不同来源获取种子
        const sources = ['secure_seed', 'backup_seed_1', 'bk_seed_2', 'seed_part_1', 'seed_part_2', 'seed_rev'];
        
        for (const key of sources) {
          try {
            if (typeof uni !== 'undefined' && uni.getStorageSync) {
              seed = uni.getStorageSync(key);
            } else if (typeof localStorage !== 'undefined') {
              seed = localStorage.getItem(key);
            }
            
            if (seed && typeof seed === 'string' && seed.length > 10) {
              return seed;
            }

            // 特殊处理分段备份
            if (key === 'seed_part_1' && seed) {
              let part2 = null;
              if (typeof uni !== 'undefined' && uni.getStorageSync) {
                part2 = uni.getStorageSync('seed_part_2');
              } else if (typeof localStorage !== 'undefined') {
                part2 = localStorage.getItem('seed_part_2');
              }
              if (part2) {
                const combined = seed + part2;
                if (combined.length > 10) return combined;
              }
            }

            // 特殊处理反转备份
            if (key === 'seed_rev' && seed) {
              const reversed = seed.split('').reverse().join('');
              if (reversed.length > 10) return reversed;
            }
          } catch (e) {
            continue;
          }
        }

        // 生成新种子
        seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
        return seed;
      };

      const seed = getSeed();
      const userState = decodeObject(encryptedData, seed);
      
      return userState;
    });

    return userState;
  } catch (error) {
    console.error('读取 userState 失败:', error);
    return null;
  }
}

/**
 * 获取用户的社区信息
 * 
 * @param {Page} page - Playwright Page 对象
 * @returns {Promise<Object|null>} 社区信息对象 { community_id, community_name }
 */
export async function getUserCommunityInfo(page) {
  const userState = await getUserState(page);
  
  if (!userState || !userState.profile) {
    return {
      community_id: null,
      community_name: null
    };
  }

  return {
    community_id: userState.profile.community_id,
    community_name: userState.profile.community_name,
    communityRole: userState.profile.communityRole,
    communityRoles: userState.profile.communityRoles
  };
}

/**
 * 获取用户的完整信息
 *
 * @param {Page} page - Playwright Page 对象
 * @returns {Promise<Object|null>} 用户完整信息
 */
export async function getUserProfile(page) {
  const userState = await getUserState(page);

  if (!userState || !userState.profile) {
    console.log('❌ userState 或 profile 不存在');
    return null;
  }

  const profile = userState.profile;

  // 调试日志：输出所有可用的字段
  console.log('🔍 调试信息 - profile 所有字段:', Object.keys(profile));
  console.log('🔍 调试信息 - profile.communityId:', profile.communityId);
  console.log('🔍 调试信息 - profile.community_id:', profile.community_id);
  console.log('🔍 调试信息 - profile.communityName:', profile.communityName);
  console.log('🔍 调试信息 - profile.community_name:', profile.community_name);

  const result = {
    userId: profile.userId,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    phone: profile.phone,
    role: profile.role,
    // 支持两种命名方式：communityId/communityName（驼峰）和 community_id/community_name（下划线）
    community_id: profile.communityId || profile.community_id,
    community_name: profile.communityName || profile.community_name,
    isVerified: profile.isVerified,
    communityRole: profile.communityRole,
    allKeys: Object.keys(profile)
  };

  console.log('✅ 返回的用户信息:', JSON.stringify(result, null, 2));

  return result;
}