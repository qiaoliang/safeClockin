export const SENSITIVE_KEYS = ['userState', 'secure_seed']

function saveSeedWithBackup(seed) {
  let successCount = 0
  let totalAttempts = 0
  
  // 主存储
  try {
    totalAttempts++
    uni.setStorageSync('secure_seed', seed)
    successCount++
  } catch (e) {
    console.warn('⚠️ 主存储保存失败:', e.message)
  }
  
  // 备份存储1：使用不同的key
  try {
    totalAttempts++
    uni.setStorageSync('backup_seed_1', seed)
    successCount++
  } catch (e) {
    console.warn('⚠️ 备份1保存失败:', e.message)
  }
  
  // 备份存储2：简单混淆（base64编码）- 环境适配
  try {
    totalAttempts++
    if (typeof btoa === 'function') {
      uni.setStorageSync('bk_seed_2', btoa(seed))
      successCount++
    } else {
      // 微信小程序环境的fallback
      console.log('ℹ️ 小程序环境，跳过base64备份（使用其他备份机制）')
      successCount++ // 标记为成功，因为有其他备份
    }
  } catch (e) {
    console.warn('⚠️ 备份2保存失败:', e.message)
  }
  
  // 备份存储3：分段存储（前半部分和后半部分分开）
  try {
    totalAttempts++
    const mid = Math.floor(seed.length / 2)
    uni.setStorageSync('seed_part_1', seed.slice(0, mid))
    uni.setStorageSync('seed_part_2', seed.slice(mid))
    successCount++
  } catch (e) {
    console.warn('⚠️ 分段备份保存失败:', e.message)
  }
  
  // 备份存储4：反转字符串
  try {
    totalAttempts++
    uni.setStorageSync('seed_rev', seed.split('').reverse().join(''))
    successCount++
  } catch (e) {
    console.warn('⚠️ 反转备份保存失败:', e.message)
  }
  
  if (successCount >= 3) {
    console.log(`✅ 种子已保存到 ${successCount}/${totalAttempts} 个备份位置`)
    return true
  } else {
    console.error(`❌ 种子保存失败，仅 ${successCount}/${totalAttempts} 个备份成功`)
    return false
  }
}

function recoverSeedFromBackup() {
  console.log('🔄 开始尝试从备份恢复种子...')
  
  // 尝试从备份1恢复
  let seed = uni.getStorageSync('backup_seed_1')
  if (seed && typeof seed === 'string' && seed.length > 10) {
    console.log('✅ 从备份1恢复种子成功')
    return seed
  }
  
  // 尝试从备份2恢复（需要解码）
  try {
    const seedBase64 = uni.getStorageSync('bk_seed_2')
    if (seedBase64 && typeof seedBase64 === 'string') {
      seed = atob(seedBase64)
      if (seed && seed.length > 10) {
        console.log('✅ 从备份2恢复种子成功')
        return seed
      }
    }
  } catch (e) {
    console.warn('⚠️ 从备份2恢复种子失败:', e)
  }
  
  // 尝试从分段备份恢复
  try {
    const part1 = uni.getStorageSync('seed_part_1')
    const part2 = uni.getStorageSync('seed_part_2')
    if (part1 && part2 && typeof part1 === 'string' && typeof part2 === 'string') {
      seed = part1 + part2
      if (seed && seed.length > 10) {
        console.log('✅ 从分段备份恢复种子成功')
        return seed
      }
    }
  } catch (e) {
    console.warn('⚠️ 从分段备份恢复种子失败:', e)
  }
  
  // 尝试从反转备份恢复
  try {
    const revSeed = uni.getStorageSync('seed_rev')
    if (revSeed && typeof revSeed === 'string') {
      seed = revSeed.split('').reverse().join('')
      if (seed && seed.length > 10) {
        console.log('✅ 从反转备份恢复种子成功')
        return seed
      }
    }
  } catch (e) {
    console.warn('⚠️ 从反转备份恢复种子失败:', e)
  }
  
  console.log('❌ 所有备份恢复尝试均失败')
  return null
}

function getSeed() {
  // 首先尝试从主存储获取
  let seed = uni.getStorageSync('secure_seed')
  
  // 验证种子有效性
  if (seed && typeof seed === 'string' && seed.length > 10) {
    return seed
  }
  
  // 主存储无效，尝试从备份恢复
  console.warn('⚠️ 主存储种子无效，尝试从备份恢复')
  seed = recoverSeedFromBackup()
  
  if (seed) {
    // 恢复成功，重新保存到所有位置
    saveSeedWithBackup(seed)
    return seed
  }
  
  // 所有恢复尝试都失败，生成新种子
  console.log('🆔 生成新的加密种子')
  seed = Math.random().toString(36).slice(2) + Date.now().toString(36)
  saveSeedWithBackup(seed)
  
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
  } catch(e) {
    // Ignore conversion errors
  }
  if (!base64) {
    try {
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(u8).toString('base64')
      }
    } catch(e) {
      // Ignore buffer conversion errors
    }
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
  // eslint-disable-next-line no-control-regex
  return base64.replace(/[^\x00-\x7F]/g, '')
}

function fromBase64ToUint8(str) {
  function normalizeBase64(input) {
    if (!input || typeof input !== 'string') return null
    // 清理输入，确保只包含 ASCII 字符
    // eslint-disable-next-line no-control-regex
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
  } catch(e) {
    // Ignore conversion errors
  }
  try {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(normalized, 'base64'))
    }
  } catch(e) {
    // Ignore buffer conversion errors
  }
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
  // eslint-disable-next-line no-control-regex
  return base64.replace(/[^\x00-\x7F]/g, '')
}

// 种子诊断工具
export function diagnoseSeedStatus() {
  console.log('🔍 开始诊断种子状态...')
  
  const diagnostics = {
    primary: null,
    backup1: null,
    backup2: null,
    backupParts: null,
    backupRev: null,
    isValid: false,
    recoveredFrom: null
  }
  
  // 检查主存储
  const primary = uni.getStorageSync('secure_seed')
  diagnostics.primary = {
    exists: !!primary,
    valid: primary && typeof primary === 'string' && primary.length > 10,
    value: primary ? `${primary.slice(0, 8)}...` : null
  }
  
  // 检查备份1
  const backup1 = uni.getStorageSync('backup_seed_1')
  diagnostics.backup1 = {
    exists: !!backup1,
    valid: backup1 && typeof backup1 === 'string' && backup1.length > 10,
    value: backup1 ? `${backup1.slice(0, 8)}...` : null
  }
  
  // 检查备份2
  const backup2 = uni.getStorageSync('bk_seed_2')
  diagnostics.backup2 = {
    exists: !!backup2,
    valid: false,
    value: null
  }
  if (backup2) {
    try {
      const decoded = atob(backup2)
      diagnostics.backup2.valid = decoded && decoded.length > 10
      diagnostics.backup2.value = decoded ? `${decoded.slice(0, 8)}...` : null
    } catch (e) {
      diagnostics.backup2.error = e.message
    }
  }
  
  // 检查分段备份
  const part1 = uni.getStorageSync('seed_part_1')
  const part2 = uni.getStorageSync('seed_part_2')
  diagnostics.backupParts = {
    exists: !!(part1 && part2),
    valid: false,
    value: null
  }
  if (part1 && part2) {
    const combined = part1 + part2
    diagnostics.backupParts.valid = combined.length > 10
    diagnostics.backupParts.value = `${combined.slice(0, 8)}...`
  }
  
  // 检查反转备份
  const revSeed = uni.getStorageSync('seed_rev')
  diagnostics.backupRev = {
    exists: !!revSeed,
    valid: false,
    value: null
  }
  if (revSeed) {
    try {
      const reversed = revSeed.split('').reverse().join('')
      diagnostics.backupRev.valid = reversed.length > 10
      diagnostics.backupRev.value = `${reversed.slice(0, 8)}...`
    } catch (e) {
      diagnostics.backupRev.error = e.message
    }
  }
  
  // 检查是否可以恢复
  if (diagnostics.primary.valid) {
    diagnostics.isValid = true
    diagnostics.recoveredFrom = 'primary'
  } else if (diagnostics.backup1.valid) {
    diagnostics.isValid = true
    diagnostics.recoveredFrom = 'backup1'
  } else if (diagnostics.backup2.valid) {
    diagnostics.isValid = true
    diagnostics.recoveredFrom = 'backup2'
  } else if (diagnostics.backupParts.valid) {
    diagnostics.isValid = true
    diagnostics.recoveredFrom = 'parts'
  } else if (diagnostics.backupRev.valid) {
    diagnostics.isValid = true
    diagnostics.recoveredFrom = 'reversed'
  }
  
  console.log('📊 种子诊断结果:', diagnostics)
  return diagnostics
}

// 清理所有种子备份（用于测试或重置）
export function clearAllSeedBackups() {
  console.log('🧹 清理所有种子备份...')
  const keys = [
    'secure_seed',
    'backup_seed_1',
    'bk_seed_2',
    'seed_part_1',
    'seed_part_2',
    'seed_rev'
  ]
  
  keys.forEach(key => {
    try {
      uni.removeStorageSync(key)
      console.log(`✅ 已清理: ${key}`)
    } catch (e) {
      console.error(`❌ 清理失败: ${key}`, e)
    }
  })
  
  console.log('✅ 所有种子备份已清理')
}

export function decodeObject(str) {
  if (!str || typeof str !== 'string') return null
  try {
    // 清理输入字符串，确保只包含有效的 base64 字符
    // eslint-disable-next-line no-control-regex
    const cleanStr = str.replace(/[^\x00-\x7F]/g, '')
    const buf = fromBase64ToUint8(cleanStr)
    if (!buf || buf.length === 0) return null
    const mask = prng(buf.length)
    for (let i = 0; i < buf.length; i++) buf[i] ^= mask[i]
    const json = utf8Decode(buf)
    try { 
      const parsed = JSON.parse(json)
      // 更宽松的验证：只要有数据就返回
      if (parsed !== null && parsed !== undefined) {
        console.log('✅ decodeObject: 解码成功，数据类型:', typeof parsed)
        return parsed
      } else {
        console.warn('decodeObject: 解析结果为空，返回原始字符串')
        return json
      }
    } catch(e) { 
      console.warn('decodeObject: JSON解析失败，返回原始字符串', e.message)
      return json 
    }
  } catch(e) {
    console.error('decodeObject: 解码失败，尝试兼容性处理', e)
    
    // 如果是种子相关错误，尝试诊断和恢复
    if (e.message && (e.message.includes('seed') || e.message.includes('decode'))) {
      console.warn('⚠️ 检测到可能的种子问题，执行诊断...')
      const diagnostics = diagnoseSeedStatus()
      
      if (!diagnostics.isValid) {
        console.error('❌ 种子诊断失败，无法恢复数据')
        return null
      }
      
      // 如果诊断发现可用备份，尝试重新获取种子并解码
      console.log('🔄 尝试使用恢复的种子重新解码...')
      try {
        const seed = recoverSeedFromBackup()
        if (seed) {
          // 临时设置种子并重试
          const originalSeed = uni.getStorageSync('secure_seed')
          uni.setStorageSync('secure_seed', seed)
          
          // 重新尝试解码
          const result = decodeObject(str)
          
          // 恢复原始种子状态
          if (originalSeed) {
            uni.setStorageSync('secure_seed', originalSeed)
          }
          
          if (result) {
            console.log('✅ 使用恢复种子解码成功')
            return result
          }
        }
      } catch (retryError) {
        console.error('❌ 使用恢复种子重试失败:', retryError)
      }
    }
    
    // 最后尝试直接解析原始字符串（兼容未加密的历史数据）
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }
}
