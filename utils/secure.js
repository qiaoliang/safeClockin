export const SENSITIVE_KEYS = ['token', 'refreshToken', 'userInfo', 'cached_user_info']

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
  try {
    if (typeof uni !== 'undefined' && typeof uni.arrayBufferToBase64 === 'function') {
      return uni.arrayBufferToBase64(u8.buffer)
    }
  } catch(e) {}
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8).toString('base64')
    }
  } catch(e) {}
  let bin = ''
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
  if (typeof btoa === 'function') return btoa(bin)
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
  return result
}

function fromBase64ToUint8(str) {
  try {
    if (typeof uni !== 'undefined' && typeof uni.base64ToArrayBuffer === 'function') {
      const ab = uni.base64ToArrayBuffer(str)
      return new Uint8Array(ab)
    }
  } catch(e) {}
  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(str, 'base64'))
    }
  } catch(e) {}
  let bin = ''
  if (typeof atob === 'function') bin = atob(str)
  else {
    // 简易fallback：手写base64解码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const map = {}
    for (let i = 0; i < chars.length; i++) map[chars[i]] = i
    let i = 0
    while (i < str.length) {
      const c1 = map[str[i++]]
      const c2 = map[str[i++]]
      const c3 = map[str[i++]]
      const c4 = map[str[i++]]
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
  return toBase64FromUint8(out)
}

export function decodeObject(str) {
  if (!str || typeof str !== 'string') return null
  try {
    const buf = fromBase64ToUint8(str)
    const mask = prng(buf.length)
    for (let i = 0; i < buf.length; i++) buf[i] ^= mask[i]
    const json = utf8Decode(buf)
    try { return JSON.parse(json) } catch(e) { return json }
  } catch(e) {
    return null
  }
}
