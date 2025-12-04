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

export function encodeObject(obj) {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj)
  const te = new TextEncoder()
  const data = te.encode(json)
  const mask = prng(data.length)
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ mask[i]
  let bin = ''
  for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i])
  return btoa(bin)
}

export function decodeObject(str) {
  if (!str || typeof str !== 'string') return null
  try {
    const bin = atob(str)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const mask = prng(buf.length)
    for (let i = 0; i < buf.length; i++) buf[i] ^= mask[i]
    const td = new TextDecoder()
    const json = td.decode(buf)
    try { return JSON.parse(json) } catch(e) { return json }
  } catch(e) {
    return null
  }
}
