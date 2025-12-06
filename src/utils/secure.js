export const SENSITIVE_KEYS = ['userState', 'token', 'refreshToken', 'userInfo', 'cached_user_info', 'secure_seed']

function getSeed() {
  let seed = uni.getStorageSync('secure_seed')
  if (!seed) {
    seed = Math.random().toString(36).slice(2) + Date.now().toString(36)
    try { uni.setStorageSync('secure_seed', seed) } catch(e) {}
  }
  return seed
}

function prng(len) {
  const seed = getSeed()
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5
    out[i] = (h >>> 24) & 0xff
  }
  return out
}

function toBase64FromUint8(u8) {
  let base64 = ''
  try {
    if (typeof uni !== 'undefined' && typeof uni.arrayBufferToBase64 === 'function') {
      base64 = uni.arrayBufferToBase64(u8.buffer)
    }
  } catch(e) {}
  if (!base64) {
    try {
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(u8).toString('base64')
      }
    } catch(e) {}
  }
  if (!base64) {
    let bin = ''
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
    if (typeof btoa === 'function') {
      base64 = btoa(bin)
    } else {
      // 简易fallback：手写base64编码（性能次要路径）
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let result = ''
      let i = 0
      while (i < bin.length) {
        const c1 = bin.charCodeAt(i++) & 0xff
        const c2 = i < bin.length ? bin.charCodeAt(i++) & 0xff : NaN
        const c3 = i < bin.length ? bin.charCodeAt(i++) & 0xff : NaN
        result += chars[c1 >> 2]
        result += chars[((c1 & 3) << 4) | (isNaN(c2) ? 0 : (c2 >> 4))]
        result += isNaN(c2) ? '=' : chars[((c2 & 15) << 2) | (isNaN(c3) ? 0 : (c3 >> 6))]
        result += isNaN(c3) ? '=' : chars[c3 & 63]
      }
      base64 = result
    }
  }
  // 确保返回的 base64 只包含 ASCII 字符
  return base64.replace(/[^\x00-\x7F]/g, '')
}

function fromBase64ToUint8(str) {
  function normalizeBase64(input) {
    if (!input || typeof input !== 'string') return null
    // 清理输入，确保只包含 ASCII 字符
    let s = input.trim().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, '')
    s = s.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (s.length % 4)) % 4
    if (pad) s += '='.repeat(pad)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null
    return s
  }

  const normalized = normalizeBase64(str)
  if (!normalized) {
    return new Uint8Array(0)
  }
  try {
    if (typeof uni !== 'undefined' && typeof uni.base64ToArrayBuffer === 'function') {
      const ab = uni.base64ToArrayBuffer(normalized)
      return new Uint8Array(ab)
    }
  } catch(e) {}
  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(normalized, 'base64'))
    }
  } catch(e) {}
  let bin = ''
  if (typeof atob === 'function') {
    try {
      bin = atob(normalized)
    } catch (_) {
      return new Uint8Array(0)
    }
  }
  else {
    // 简易fallback：手写base64解码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const map = {}
    for (let i = 0; i < chars.length; i++) map[chars[i]] = i
    let i = 0
    while (i < normalized.length) {
      const c1 = map[normalized[i++]]
      const c2 = map[normalized[i++]]
      const c3 = map[normalized[i++]]
      const c4 = map[normalized[i++]]
      const b1 = (c1 << 2) | (c2 >> 4)
      const b2 = ((c2 & 15) << 4) | (isNaN(c3) ? 0 : (c3 >> 2))
      const b3 = ((c3 & 3) << 6) | (isNaN(c4) ? 0 : c4)
      bin += String.fromCharCode(b1)
      if (!isNaN(c3)) bin += String.fromCharCode(b2)
      if (!isNaN(c4)) bin += String.fromCharCode(b3)
    }
  }
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

function utf8Encode(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str)
  }
  const utf8 = unescape(encodeURIComponent(str))
  const u8 = new Uint8Array(utf8.length)
  for (let i = 0; i < utf8.length; i++) u8[i] = utf8.charCodeAt(i)
  return u8
}

function utf8Decode(u8) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(u8)
  }
  let bin = ''
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
  return decodeURIComponent(escape(bin))
}

export function encodeObject(obj) {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj)
  const data = utf8Encode(json)
  const mask = prng(data.length)
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ mask[i]
  const base64 = toBase64FromUint8(out)
  // 确保返回的 base64 字符串只包含 ASCII 字符
  return base64.replace(/[^\x00-\x7F]/g, '')
}

export function decodeObject(str) {
  if (!str || typeof str !== 'string') return null
  try {
    // 清理输入字符串，确保只包含有效的 base64 字符
    const cleanStr = str.replace(/[^\x00-\x7F]/g, '')
    const buf = fromBase64ToUint8(cleanStr)
    if (!buf || buf.length === 0) return null
    const mask = prng(buf.length)
    for (let i = 0; i < buf.length; i++) buf[i] ^= mask[i]
    const json = utf8Decode(buf)
    try { 
      const parsed = JSON.parse(json)
      // 验证解析后的对象结构完整性
      if (parsed && typeof parsed === 'object') {
        return parsed
      } else {
        console.warn('decodeObject: 解析的对象结构不完整', parsed)
        return null
      }
    } catch(e) { 
      console.warn('decodeObject: JSON解析失败', e)
      return json 
    }
  } catch(e) {
    console.error('decodeObject: 解码失败', e)
    return null
  }
}
