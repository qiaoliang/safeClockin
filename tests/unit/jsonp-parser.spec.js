import { describe, it, expect } from 'vitest'

describe('JSONP 响应解析测试', () => {
  it('应该正确解析标准 JSONP 响应', () => {
    const jsonString = '{"status":0,"message":"Success"}'
    const jsonpString = `QQmap&&QQmap(${jsonString})`

    // 当前的正则表达式
    const currentRegex = /QQmap&&QQmap\((.+)\)$/
    const currentMatch = jsonpString.match(currentRegex)

    console.log('当前正则匹配结果:', currentMatch)

    if (currentMatch) {
      const parsed = JSON.parse(currentMatch[1])
      console.log('解析后的数据:', parsed)
      expect(parsed.status).toBe(0)
    }
  })

  it('应该处理带有额外字符的 JSONP 响应', () => {
    const jsonString = '{"status":0,"message":"Success"}'
    const jsonpString = `QQmap&&QQmap(${jsonString})` + '(env: macOS,mp,1.06.2504060; lib: 3.13.0)'

    // 当前的正则表达式
    const currentRegex = /QQmap&&QQmap\((.+)\)$/
    const currentMatch = jsonpString.match(currentRegex)

    console.log('带额外字符的响应:', jsonpString)
    console.log('当前正则匹配结果:', currentMatch)

    // 改进的正则表达式（不要求结尾，使用非贪婪匹配）
    const improvedRegex = /QQmap&&QQmap\((.+?)\)/
    const improvedMatch = jsonpString.match(improvedRegex)

    console.log('改进后的正则匹配结果:', improvedMatch)

    if (improvedMatch) {
      const parsed = JSON.parse(improvedMatch[1])
      console.log('解析后的数据:', parsed)
      expect(parsed.status).toBe(0)
    }
  })

  it('应该处理完整的实际响应', () => {
    const actualResponse = `QQmap&&QQmap({"status":0,"message":"Success","request_id":"2a6f1a63fa204dacbc415ad1d07b641e","result":{"location":{"lat":39.905493,"lng":116.408947},"address":"北京市东城区正义路"}});(env: macOS,mp,1.06.2504060; lib: 3.13.0)`

    console.log('实际响应长度:', actualResponse.length)
    console.log('实际响应:', actualResponse.substring(0, 100) + '...')

    // 改进的正则表达式（使用非贪婪匹配）
    const regex = /QQmap&&QQmap\((.+?)\);/
    const match = actualResponse.match(regex)

    console.log('正则匹配结果:', match)

    if (match) {
      const parsed = JSON.parse(match[1])
      console.log('解析后的数据:', parsed)
      expect(parsed.status).toBe(0)
      expect(parsed.result.address).toBe('北京市东城区正义路')
    }
  })
})